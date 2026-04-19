"""
EyeFlow — Configuration & Constants
=====================================

Central configuration file for all tunable parameters.
Every module imports its settings from here so you only need
to change values in one place.

Sections
--------
1. Screen          – detected display resolution
2. Camera          – webcam index, resolution, target FPS
3. Gaze smoothing  – EMA alpha, dead zone, Kalman filter noise params
4. Calibration     – grid size, samples per dot, screen margins
5. Dwell-click     – timing and radius for hands-free clicking
6. Hand gesture    – hold frames, cooldown, thresholds
7. Actions         – scroll amount, zoom step
8. Colors          – BGR tuples used by the OpenCV overlay
"""

import pyautogui

# ── 1. Screen ─────────────────────────────────────────────────────
# Automatically detect the user's display resolution.
SCREEN_W, SCREEN_H = pyautogui.size()

# ── 2. Camera ─────────────────────────────────────────────────────
# Which webcam to open (0 = default built-in camera).
CAMERA_INDEX  = 0
# Resolution sent to the camera — 640×480 gives good iris detail.
CAMERA_WIDTH  = 640
CAMERA_HEIGHT = 480
# Requested frame rate from the camera driver.
TARGET_FPS    = 30

# ── 3. Gaze smoothing ────────────────────────────────────────────
# --- Exponential moving average (EMA) ---
# Lower alpha = smoother but laggier cursor.  Range: 0.02 – 0.40
GAZE_ALPHA   = 0.15
# If the cursor would move fewer than this many pixels, ignore
# the movement entirely to prevent micro-jitter.
DEAD_ZONE_PX = 8

# --- Kalman filter ---
# Process noise: how much we expect the TRUE position to change
# between frames.  Larger = more responsive to movement.
KALMAN_PROCESS_NOISE  = 1.0
# Measurement noise: how noisy the raw MediaPipe predictions are.
# Smaller = we trust the prediction more → faster response.
KALMAN_MEASURE_NOISE  = 2.0

# --- Median pre-filter ---
# Window size for the rolling median that rejects outlier spikes.
MEDIAN_WINDOW = 3

# ── 4. Calibration ───────────────────────────────────────────────
# Grid dimension — a 5×5 grid produces 25 calibration dots.
CAL_GRID         = 5
# How many camera frames to capture while the user looks at each dot.
# 25 dots × 60 samples = 1 500 total training samples.
CAL_SAMPLES      = 60
# Margins from the screen edge (fraction of width / height).
CAL_MARGIN_X     = 0.08
CAL_MARGIN_Y     = 0.08

# ── 5. Dwell-click ───────────────────────────────────────────────
# How long (seconds) the gaze must stay still to trigger a click.
DWELL_TIME_S   = 1.5
# Maximum wander (pixels) that still counts as "staying still".
DWELL_RADIUS   = 55
# Cooldown (seconds) before the same spot can fire again.
DWELL_COOLDOWN = 2.0

# ── 6. Hand gesture ──────────────────────────────────────────────
# Consecutive frames a gesture must be seen before it fires.
GESTURE_HOLD_FRAMES = 6
# Seconds between repeated triggers of the same gesture.
GESTURE_COOLDOWN_S  = 0.8
# Normalised distance between thumb-tip and index-tip for "pinch".
PINCH_THRESHOLD     = 0.07
# Normalised horizontal wrist delta that counts as a swipe.
SWIPE_THRESHOLD     = 0.20

# ── 7. Actions ───────────────────────────────────────────────────
# Lines to scroll per scroll-gesture fire.
SCROLL_AMOUNT  = 3
# Fraction per zoom-gesture fire (Ctrl +/−).
ZOOM_STEP      = 0.05

# ── 8. Colors (BGR for OpenCV) ───────────────────────────────────
C_CYAN    = (0,   212, 255)
C_VIOLET  = (200,  80, 255)
C_GREEN   = (0,   230, 118)
C_RED     = (60,   60, 255)
C_ORANGE  = (0,   165, 255)
C_WHITE   = (255, 255, 255)
C_DARK    = (18,   18,  28)
C_YELLOW  = (0,   220, 200)
