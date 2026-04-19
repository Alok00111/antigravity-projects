"""
cursor.py — Smooth gaze-driven cursor + dwell-click
=====================================================

Moves the real Windows cursor based on gaze predictions.
Uses a three-stage smoothing pipeline to eliminate jitter:

    Raw prediction ──► Median filter ──► Kalman filter ──► EMA ──► Dead zone ──► OS cursor

Stage 1 — Median pre-filter  (reject sudden spikes / outliers)
Stage 2 — Kalman filter      (model position + velocity for smooth trajectory)
Stage 3 — EMA                (final gentle polish on the output)
Stage 4 — Dead zone          (ignore movements smaller than DEAD_ZONE_PX)

Functions & Classes
-------------------
_move_native(x, y)
    Move the Windows cursor instantly via the Win32 API.

class KalmanFilter2D
    A simple 2D Kalman filter that models position and velocity.
    - predict()        → advance the state by one time-step
    - update(mx, my)   → correct the state with a new measurement

class SmoothCursor
    The main cursor controller.  Owns the full smoothing pipeline.
    - update(tx, ty)   → feed a new raw gaze prediction, returns smoothed (x, y)
    - get()            → return the current cursor position without updating
    - warp(x, y)       → teleport the cursor (used right after calibration)

class DwellClicker
    Triggers a left-click when the gaze stays within DWELL_RADIUS
    for DWELL_TIME_S seconds.
    - update(x, y)     → feed current position, returns (progress, clicked)
"""

import ctypes
import time
import threading
import numpy as np
from collections import deque
import pyautogui

from config import (
    SCREEN_W, SCREEN_H,
    GAZE_ALPHA, DEAD_ZONE_PX,
    DWELL_TIME_S, DWELL_RADIUS, DWELL_COOLDOWN,
    KALMAN_PROCESS_NOISE, KALMAN_MEASURE_NOISE,
    MEDIAN_WINDOW,
)

# Disable PyAutoGUI safety delays for real-time use
pyautogui.PAUSE    = 0
pyautogui.FAILSAFE = False


# ─── Native cursor move (Windows) ────────────────────────────────────────────

def _move_native(x: int, y: int):
    """Move the OS cursor with zero overhead via the Windows SetCursorPos API."""
    ctypes.windll.user32.SetCursorPos(int(x), int(y))


# ─── Kalman Filter (2D position + velocity) ──────────────────────────────────

class KalmanFilter2D:
    """
    Lightweight 2D Kalman filter for cursor smoothing.

    State vector:  [x, y, vx, vy]  (position + velocity)
    Measurement:   [x, y]          (position only)

    The filter predicts where the cursor *should* be based on its
    recent velocity, then corrects that prediction with each new
    raw measurement from MediaPipe.  This produces a smooth curve
    even when the raw measurements are noisy.
    """

    def __init__(self, process_noise: float, measure_noise: float):
        # State: [x, y, vx, vy]
        self.x = np.zeros(4, dtype=np.float64)

        # State transition matrix (constant-velocity model)
        # Each tick:  x_new = x_old + vx,  y_new = y_old + vy
        self.F = np.array([
            [1, 0, 1, 0],   # x  = x + vx
            [0, 1, 0, 1],   # y  = y + vy
            [0, 0, 1, 0],   # vx = vx  (velocity stays the same)
            [0, 0, 0, 1],   # vy = vy
        ], dtype=np.float64)

        # Measurement matrix — we only observe position, not velocity
        self.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
        ], dtype=np.float64)

        # Covariance matrix — starts with high uncertainty
        self.P = np.eye(4, dtype=np.float64) * 1000.0

        # Process noise covariance (how much real motion we expect)
        self.Q = np.eye(4, dtype=np.float64) * process_noise

        # Measurement noise covariance (how noisy MediaPipe is)
        self.R = np.eye(2, dtype=np.float64) * measure_noise

        # Pre-compute identity matrix
        self._I = np.eye(4, dtype=np.float64)

    def predict(self):
        """Advance the internal state by one time-step (predict phase)."""
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q

    def update(self, mx: float, my: float):
        """
        Correct the predicted state with a new measurement (update phase).

        Parameters
        ----------
        mx, my : float
            The raw measured screen coordinates from the gaze model.
        """
        z = np.array([mx, my], dtype=np.float64)

        # Innovation (difference between measurement and prediction)
        y = z - self.H @ self.x

        # Innovation covariance
        S = self.H @ self.P @ self.H.T + self.R

        # Kalman gain — how much to trust the measurement vs. prediction
        K = self.P @ self.H.T @ np.linalg.inv(S)

        # Correct the state estimate
        self.x = self.x + K @ y

        # Update the covariance
        self.P = (self._I - K @ self.H) @ self.P

    @property
    def position(self) -> tuple:
        """Return the current estimated (x, y) position."""
        return float(self.x[0]), float(self.x[1])

    def reset(self, x: float, y: float):
        """Hard-reset the filter to a known position with zero velocity."""
        self.x = np.array([x, y, 0.0, 0.0], dtype=np.float64)
        self.P = np.eye(4, dtype=np.float64) * 1000.0


# ─── Smooth Cursor ───────────────────────────────────────────────────────────

class SmoothCursor:
    """
    Three-stage gaze-to-cursor smoother + dead-zone gate.

    Pipeline:
        1. Median pre-filter   – stores last N raw values, takes the median
                                  to reject random spikes.
        2. Kalman filter       – models position + velocity for a smooth
                                  trajectory that predicts ahead.
        3. EMA (exponential    – gentle final low-pass filter on top of
           moving average)       the Kalman output.
        4. Dead zone           – if the final movement is < DEAD_ZONE_PX,
                                  don't move the cursor at all.
    """

    def __init__(self):
        # Smoothed cursor position (starts at screen centre)
        self._x = float(SCREEN_W) / 2
        self._y = float(SCREEN_H) / 2
        self._lock = threading.Lock()

        # Whether cursor movement is paused (toggled by open_palm gesture)
        self.paused = False

        # Stage 1: Median pre-filter — stores recent raw values
        self._median_buf_x = deque(maxlen=MEDIAN_WINDOW)
        self._median_buf_y = deque(maxlen=MEDIAN_WINDOW)

        # Stage 2: Kalman filter
        self._kalman = KalmanFilter2D(
            process_noise=KALMAN_PROCESS_NOISE,
            measure_noise=KALMAN_MEASURE_NOISE,
        )
        # Initialise Kalman at screen centre
        self._kalman.reset(self._x, self._y)

    def update(self, target_x: int, target_y: int) -> tuple:
        """
        Feed a new raw gaze prediction through the smoothing pipeline.

        Parameters
        ----------
        target_x, target_y : int
            Raw predicted screen coordinates from the gaze model.

        Returns
        -------
        (int, int)
            The smoothed cursor position after all filtering stages.
            Also moves the real OS cursor to that position.
        """
        with self._lock:
            if self.paused:
                return int(self._x), int(self._y)

            # Remember where we were before this update
            old_x, old_y = self._x, self._y

            # ── Stage 1: Median pre-filter ────────────────────────────────
            # Add the raw value to the buffer, then take the median.
            # This kills sudden spikes (e.g. MediaPipe briefly loses
            # the iris and predicts a wild position).
            self._median_buf_x.append(float(target_x))
            self._median_buf_y.append(float(target_y))
            med_x = float(np.median(self._median_buf_x))
            med_y = float(np.median(self._median_buf_y))

            # ── Stage 2: Kalman filter ────────────────────────────────────
            # Predict where the cursor should be based on velocity,
            # then correct with the median-filtered measurement.
            self._kalman.predict()
            self._kalman.update(med_x, med_y)
            kal_x, kal_y = self._kalman.position

            # ── Stage 3: EMA (exponential moving average) ─────────────────
            # Blends the Kalman output toward the current position.
            dx = kal_x - self._x
            dy = kal_y - self._y
            dist = (dx * dx + dy * dy) ** 0.5

            # Adaptive alpha: bigger jumps get a faster response
            alpha = min(0.55, GAZE_ALPHA + 0.002 * dist)

            self._x += alpha * dx
            self._y += alpha * dy

            # Clamp to screen bounds
            self._x = max(0.0, min(float(SCREEN_W - 1), self._x))
            self._y = max(0.0, min(float(SCREEN_H - 1), self._y))

            xi, yi = int(self._x), int(self._y)

            # ── Stage 4: Dead zone ────────────────────────────────────────
            # Check how far the cursor ACTUALLY moved this frame.
            # If less than DEAD_ZONE_PX, snap back and don't move.
            actual_move = ((self._x - old_x) ** 2 + (self._y - old_y) ** 2) ** 0.5
            if actual_move < DEAD_ZONE_PX:
                # Movement too small — revert and don't touch the OS cursor
                self._x, self._y = old_x, old_y
                return int(old_x), int(old_y)

        # Move the real OS cursor
        _move_native(xi, yi)
        return xi, yi

    def get(self) -> tuple:
        """Return the current smoothed position without updating."""
        with self._lock:
            return int(self._x), int(self._y)

    def warp(self, x: int, y: int):
        """
        Instantly teleport the cursor (used right after calibration).
        Resets the Kalman filter and median buffers so the next
        update() starts fresh from this position.
        """
        with self._lock:
            self._x, self._y = float(x), float(y)
            self._kalman.reset(float(x), float(y))
            self._median_buf_x.clear()
            self._median_buf_y.clear()
        _move_native(x, y)


# ─── Dwell Clicker ───────────────────────────────────────────────────────────

class DwellClicker:
    """
    Triggers a left-click when gaze stays within DWELL_RADIUS px
    for DWELL_TIME_S seconds.

    Returns a progress value (0.0 – 1.0) useful for drawing a
    "filling ring" UI element around the cursor.
    """

    def __init__(self):
        # Anchor point — the position where dwell timing started
        self._sx      = 0
        self._sy      = 0
        # Timestamp when dwell timing started
        self._t0      = 0.0
        # Whether we're currently inside a dwell sequence
        self._active  = False
        # Last click location and time (for cooldown)
        self._last_xy = None
        self._last_t  = 0.0

    def update(self, x: int, y: int) -> tuple:
        """
        Feed the current cursor position.

        Returns
        -------
        (float, bool)
            progress : 0.0 – 1.0  how far through the dwell timer
            clicked  : True if a click was just fired
        """
        now = time.time()

        # If not currently dwelling, start a new dwell sequence here
        if not self._active:
            self._sx, self._sy = x, y
            self._t0   = now
            self._active = True
            return 0.0, False

        # Check if cursor has wandered too far from the anchor
        dist = ((x - self._sx) ** 2 + (y - self._sy) ** 2) ** 0.5
        if dist > DWELL_RADIUS:
            # Cursor moved — reset the anchor
            self._sx, self._sy = x, y
            self._t0  = now
            return 0.0, False

        # Cursor is still near the anchor — accumulate time
        elapsed  = now - self._t0
        progress = min(1.0, elapsed / DWELL_TIME_S)

        if progress >= 1.0:
            # Cooldown check: don't re-fire at the same spot too soon
            if (self._last_xy is not None
                    and ((x - self._last_xy[0]) ** 2 + (y - self._last_xy[1]) ** 2) ** 0.5 < 30
                    and now - self._last_t < DWELL_COOLDOWN):
                self._t0 = now          # reset timer without firing
                return 0.0, False

            # Fire the click!
            self._last_xy = (x, y)
            self._last_t  = now
            self._active  = False
            pyautogui.click(x, y)
            return 1.0, True

        return progress, False
