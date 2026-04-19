"""
calibration.py — Fullscreen tkinter calibration UI
====================================================

Shows a grid of dots on a dark fullscreen window.
The user clicks each dot while looking at it.  A background thread
captures iris-feature samples from the webcam.
After all dots are clicked the Ridge regression model is fitted.

How calibration works
---------------------
1. A CAL_GRID × CAL_GRID grid of dots is drawn (default 5×5 = 25 dots).
2. The current "active" dot pulses to attract the user's gaze.
3. When the user clicks the active dot, a background thread begins
   capturing CAL_SAMPLES frames from the webcam.
4. Each frame is fed to GazeTracker.add_calibration_sample() which
   records the iris features paired with the dot's screen position.
5. After all dots are done, GazeTracker.fit() trains the model.
6. The tkinter window closes and the fitted GazeTracker is returned.

Functions & Classes
-------------------
_cal_positions()
    Build the list of (x, y) screen positions for the calibration grid.
    Uses CAL_GRID, CAL_MARGIN_X, CAL_MARGIN_Y from config.

class CalibrationController
    Manages the entire calibration flow.
    - run() → GazeTracker
        Show the fullscreen UI, collect samples, fit the model,
        and return the ready-to-use GazeTracker.

    Internal methods:
    - _draw()             Redraw all dots, progress bar, instructions.
    - _pulse()            Animate the active dot (timer callback).
    - _on_click(event)    Handle mouse clicks on the canvas.
    - _collect_samples()  Background thread: capture frames for one dot.
    - _finish()           Fit the model and close the window.
"""

import tkinter as tk
import tkinter.font as tkfont
import threading
import time
import cv2
from gaze import GazeTracker
from config import (
    SCREEN_W, SCREEN_H,
    CAL_MARGIN_X, CAL_MARGIN_Y, CAL_SAMPLES, CAL_GRID,
    CAMERA_INDEX, CAMERA_WIDTH, CAMERA_HEIGHT,
)


# ─── Build calibration screen positions ──────────────────────────────────────

def _cal_positions():
    """
    Generate a CAL_GRID × CAL_GRID list of (x, y) screen positions.

    The dots are evenly spaced across the screen with margins defined
    by CAL_MARGIN_X and CAL_MARGIN_Y (as fractions of screen size).

    Example for 5×5 on 1920×1080 with 8% margins:
        X positions: 154, 557, 960, 1363, 1766
        Y positions:  86, 302, 518, 734,  950
    """
    mx = int(SCREEN_W * CAL_MARGIN_X)   # horizontal margin in pixels
    my = int(SCREEN_H * CAL_MARGIN_Y)   # vertical margin in pixels
    pts = []
    for row in range(CAL_GRID):
        for col in range(CAL_GRID):
            # Evenly space across the available area
            x = mx + col * (SCREEN_W - 2 * mx) // (CAL_GRID - 1)
            y = my + row * (SCREEN_H - 2 * my) // (CAL_GRID - 1)
            pts.append((x, y))
    return pts


# ─── Calibration Controller ───────────────────────────────────────────────────

class CalibrationController:
    """
    Manages the calibration flow.

    Usage:
        ctrl = CalibrationController()
        gaze_tracker = ctrl.run()   # blocks until done, returns fitted GazeTracker
    """

    # Dot sizes (pixels)
    DOT_RADIUS        = 14          # completed / pending dots
    DOT_ACTIVE_RADIUS = 20          # active dot (smaller for dense grid)
    PULSE_INTERVAL_MS = 600         # milliseconds between pulse toggles

    def __init__(self):
        self._pts        = _cal_positions()
        self._current    = 0                    # index of the active dot
        self._gaze       = GazeTracker()
        self._cap        = None                 # cv2.VideoCapture
        self._collecting = False                # True while sampling one dot
        self._done_event = threading.Event()
        self._pulse_big  = False                # toggled for animation

        # tkinter widgets (created in run())
        self._root   = None
        self._canvas = None

    # ── Public API ───────────────────────────────────────────────────────────

    def run(self) -> GazeTracker:
        """
        Show the fullscreen calibration window and block until complete.

        Returns the fitted GazeTracker ready for live tracking.
        """
        # Open the webcam
        self._cap = cv2.VideoCapture(CAMERA_INDEX)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CAMERA_WIDTH)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)

        # Create the fullscreen tkinter window
        root = tk.Tk()
        self._root   = root
        self._canvas = tk.Canvas(root, bg="#0a0a14", highlightthickness=0)
        self._canvas.pack(fill=tk.BOTH, expand=True)

        root.title("EyeFlow — Calibration")
        root.attributes("-fullscreen", True)
        root.attributes("-topmost", True)
        root.configure(bg="#0a0a14")

        # Bind mouse click anywhere on the canvas
        self._canvas.bind("<Button-1>", self._on_click)

        # Initial draw + start pulse animation
        self._draw()
        root.after(self.PULSE_INTERVAL_MS, self._pulse)
        root.mainloop()

        # Clean up the webcam after the window closes
        if self._cap:
            self._cap.release()

        return self._gaze

    # ── Drawing ──────────────────────────────────────────────────────────────

    def _draw(self):
        """Redraw the entire calibration screen: header, progress bar, all dots."""
        c = self._canvas
        c.delete("all")
        sw, sh = SCREEN_W, SCREEN_H
        total = len(self._pts)

        # ── Header text ──────────────────────────────────────────────
        idx = self._current
        if idx < total:
            msg = f"Look at the glowing dot and CLICK it  ({idx + 1} / {total})"
        else:
            msg = "Fitting model… please wait"

        c.create_text(sw // 2, 44,
                      text=msg,
                      fill="#e0e0ff", font=("Inter", 17, "bold"),
                      anchor="center")

        # Sub-instruction
        c.create_text(sw // 2, 76,
                      text="Keep your eyes fixed on the dot while clicking",
                      fill="#6666aa", font=("Inter", 12),
                      anchor="center")

        # ── Progress bar ─────────────────────────────────────────────
        bar_w = 400
        bar_x = (sw - bar_w) // 2
        bar_y = 106
        bar_h = 8
        done_w = int(bar_w * idx / total) if idx <= total else bar_w

        # Background track
        c.create_rectangle(bar_x, bar_y, bar_x + bar_w, bar_y + bar_h,
                           fill="#1e1e3a", outline="")
        # Filled portion
        c.create_rectangle(bar_x, bar_y, bar_x + done_w, bar_y + bar_h,
                           fill="#00d4ff", outline="")

        # ── Draw each dot ────────────────────────────────────────────
        for i, (px, py) in enumerate(self._pts):
            if i < idx:
                # ✓ Completed dot — small cyan circle with a check mark
                r = self.DOT_RADIUS - 4
                c.create_oval(px - r, py - r, px + r, py + r,
                              fill="#00d4ff", outline="#ffffff", width=1,
                              tags=f"dot_{i}")
                c.create_text(px, py, text="✓", fill="white",
                              font=("Inter", 9, "bold"))

            elif i == idx:
                # ● Active dot — pulsing red with glow ring
                r_outer = self.DOT_ACTIVE_RADIUS + (4 if self._pulse_big else 0)
                r_inner = self.DOT_ACTIVE_RADIUS

                # Outer glow ring (subtle)
                c.create_oval(px - r_outer - 4, py - r_outer - 4,
                              px + r_outer + 4, py + r_outer + 4,
                              fill="", outline="#883333", width=2)
                # Main ring
                c.create_oval(px - r_outer, py - r_outer,
                              px + r_outer, py + r_outer,
                              fill="", outline="#ff6666", width=2,
                              tags=f"dot_{i}")
                # Filled centre
                c.create_oval(px - r_inner, py - r_inner,
                              px + r_inner, py + r_inner,
                              fill="#ff4444", outline="#ffffff", width=2,
                              tags=f"dot_{i}")
                # Dot number label
                c.create_text(px, py, text=str(i + 1),
                              fill="white", font=("Inter", 8, "bold"))

            else:
                # ○ Pending dot — dim grey circle
                r = self.DOT_RADIUS - 6
                c.create_oval(px - r, py - r, px + r, py + r,
                              fill="#1e1e3a", outline="#334466", width=1)

        # ── Sample-collection progress ring (green arc) ──────────────
        if self._collecting and idx < total:
            n = self._gaze.num_samples - idx * CAL_SAMPLES
            frac = max(0.0, min(1.0, n / CAL_SAMPLES))
            px, py = self._pts[idx]
            ring_r = self.DOT_ACTIVE_RADIUS + 16
            extent = frac * 359.9
            c.create_arc(px - ring_r, py - ring_r, px + ring_r, py + ring_r,
                         start=90, extent=-extent,
                         outline="#00ff88", width=3, style=tk.ARC)

        # ── Bottom hint ──────────────────────────────────────────────
        c.create_text(sw // 2, sh - 30,
                      text="Make sure your face is well-lit and centred in the webcam",
                      fill="#444466", font=("Inter", 11))

    # ── Animation pulse ──────────────────────────────────────────────────────

    def _pulse(self):
        """Toggle the active dot size to create a pulsing animation."""
        self._pulse_big = not self._pulse_big
        self._draw()
        if self._root and self._current < len(self._pts):
            self._root.after(self.PULSE_INTERVAL_MS, self._pulse)

    # ── Click handler ────────────────────────────────────────────────────────

    def _on_click(self, event):
        """
        Handle a mouse click on the canvas.
        If the click is near the active dot, start collecting samples.
        """
        # Ignore if already collecting or all dots are done
        if self._collecting or self._current >= len(self._pts):
            return

        px, py = self._pts[self._current]
        dist = ((event.x - px) ** 2 + (event.y - py) ** 2) ** 0.5

        # Click must be within the active dot's hit area
        if dist > self.DOT_ACTIVE_RADIUS + 20:
            return

        # Start capturing frames in a background thread
        self._collecting = True
        threading.Thread(target=self._collect_samples, daemon=True).start()

    # ── Frame sampling (background thread) ────────────────────────────────────

    def _collect_samples(self):
        """
        Capture CAL_SAMPLES frames while the user looks at the current dot.

        Runs in a daemon thread.  Each frame is fed to
        GazeTracker.add_calibration_sample() which extracts iris features
        and pairs them with the dot's screen position.
        """
        px, py = self._pts[self._current]
        collected = 0

        while collected < CAL_SAMPLES:
            ret, frame = self._cap.read()
            if not ret:
                time.sleep(0.01)
                continue

            # Mirror the frame so left/right feels natural
            frame = cv2.flip(frame, 1)

            if self._gaze.add_calibration_sample(frame, px, py):
                collected += 1
            else:
                # Face not detected in this frame — skip it
                time.sleep(0.01)

        # Move to the next dot
        self._current  += 1
        self._collecting = False

        if self._current >= len(self._pts):
            # All dots done — fit the model
            self._finish()
        else:
            # Schedule a redraw and restart the pulse on the main thread
            self._root.after(0, self._draw)
            self._root.after(0, lambda: self._root.after(
                self.PULSE_INTERVAL_MS, self._pulse))

    def _finish(self):
        """All dots done — fit the regression model and close the window."""
        # Show "fitting" message
        self._root.after(0, self._draw)

        # Train the model (this is fast, ~10ms)
        ok = self._gaze.fit()

        def _close():
            if self._root:
                self._root.destroy()
                self._root = None

        if ok:
            # Brief pause so the user sees "Fitting model…" then close
            self._root.after(800, _close)
        else:
            # Should never happen if calibration completed normally
            self._root.after(0, lambda: self._canvas.create_text(
                SCREEN_W // 2, SCREEN_H // 2,
                text="Error: Could not fit model. Please re-run.",
                fill="red", font=("Inter", 18)))
