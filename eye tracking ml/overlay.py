"""
overlay.py — OpenCV visualisation renderer
============================================

Draws the HUD, face-mesh iris highlights, hand skeleton, dwell ring,
and status panel on the camera frame shown in the debug window.

What gets drawn
---------------
- Top status bar:  FPS, gaze coordinates, calibration state, pause indicator
- Iris crosshairs: small cyan circles on the detected iris centres
- Gesture badge:   coloured badge showing the current gesture + action
- Action flash:    temporary banner when an action fires (e.g. "✓ CLICK")
- Dwell ring:      progress arc when the dwell-click timer is running
- Face-not-found:  red warning banner when no face is detected
- Gesture panel:   a separate small window listing all gesture → action mappings

Functions & Classes
-------------------
_filled_rect(img, x, y, w, h, color, alpha, radius)
    Draw a semi-transparent rectangle (used for badges / bars).

_text(img, txt, x, y, color, scale, thickness, font)
    Draw text with a dark shadow behind it for readability.

_circle(img, cx, cy, r, color, thickness)
    Draw a circle with a dark outline for contrast.

_dwell_ring(img, cx, cy, progress, r)
    Draw a progress arc for the dwell-click timer.

class Overlay
    Main debug-window renderer.
    - render(frame, gaze_result, hand_result, cursor_xy,
             dwell_prog, action_label, is_paused, fps) → ndarray

make_gesture_panel(active_gesture) → ndarray
    Render the gesture reference card (260×400 px image).
"""

import cv2
import numpy as np
import math
from config import (
    C_CYAN, C_VIOLET, C_GREEN, C_RED, C_ORANGE, C_WHITE, C_DARK, C_YELLOW,
    SCREEN_W, SCREEN_H,
)

# ─── Gesture emoji / label lookup ────────────────────────────────────────────

GESTURE_INFO = {
    "fist":        ("CLICK",        C_RED),
    "peace":       ("COPY",         C_GREEN),
    "thumbs_up":   ("SCROLL UP",    C_CYAN),
    "thumbs_down": ("SCROLL DOWN",  C_CYAN),
    "open_palm":   ("PAUSE",        C_YELLOW),
    "pinch":       ("DRAG",         C_ORANGE),
    "shaka":       ("ZOOM IN",      C_VIOLET),
    "rock":        ("ZOOM OUT",     C_VIOLET),
    "l_shape":     ("DELETE",       C_RED),
    "swipe_left":  ("UNDO",         C_ORANGE),
    "swipe_right": ("REDO",         C_ORANGE),
    "holding":     ("HOLDING…",     (180, 180, 180)),
    "none":        ("",             C_WHITE),
}


# ─── Helper drawing functions ────────────────────────────────────────────────

def _filled_rect(img, x, y, w, h, color, alpha=0.55, radius=8):
    """Draw a semi-transparent rounded rectangle."""
    overlay = img.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), color, -1)
    cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)
    # thin border
    cv2.rectangle(img, (x, y), (x + w, y + h), color, 1)


def _text(img, txt, x, y, color=C_WHITE, scale=0.5, thickness=1, font=cv2.FONT_HERSHEY_SIMPLEX):
    cv2.putText(img, txt, (x, y), font, scale, (0, 0, 0), thickness + 1, cv2.LINE_AA)
    cv2.putText(img, txt, (x, y), font, scale, color,     thickness,     cv2.LINE_AA)


def _circle(img, cx, cy, r, color, thickness=1):
    cv2.circle(img, (int(cx), int(cy)), int(r), (0, 0, 0), thickness + 2)
    cv2.circle(img, (int(cx), int(cy)), int(r), color,     thickness)


def _dwell_ring(img, cx, cy, progress, r=28):
    """Draw a progress arc around the dwell cursor."""
    if progress <= 0:
        return
    start_angle = -90                         # 12 o'clock
    sweep       = int(360 * progress)
    for thick in range(4, 0, -1):
        alpha_color = (0, int(220 * progress), int(255 * progress))
        cv2.ellipse(img, (int(cx), int(cy)), (r, r), 0,
                    start_angle, start_angle + sweep,
                    alpha_color, thick, cv2.LINE_AA)


# ─── Main renderer ───────────────────────────────────────────────────────────

class Overlay:

    def __init__(self, frame_w: int, frame_h: int):
        self.fw = frame_w
        self.fh = frame_h

    def render(self,
               frame:         np.ndarray,
               gaze_result,          # GazeResult
               hand_result,          # HandResult
               cursor_xy:    tuple,  # (cx, cy) in screen coords
               dwell_prog:   float,  # 0.0 – 1.0
               action_label: str,
               is_paused:    bool,
               fps:          float) -> np.ndarray:

        out = frame.copy()

        # ── Iris highlight ───────────────────────────────────────────────────
        if gaze_result.detected:
            for iris_px in [gaze_result.iris_left_px, gaze_result.iris_right_px]:
                if iris_px is not None:
                    ix, iy = int(iris_px[0]), int(iris_px[1])
                    _circle(out, ix, iy, 6,  C_CYAN, 2)
                    _circle(out, ix, iy, 2,  C_CYAN, -1)

        # ── Hand skeleton (drawn by HandTracker.draw already) ─────────────
        # (drawn externally if needed — here just gesture label overlay)

        # ── Top status bar ───────────────────────────────────────────────────
        bar_h = 36
        _filled_rect(out, 0, 0, self.fw, bar_h, C_DARK, alpha=0.75, radius=0)

        # FPS
        _text(out, f"FPS {fps:.0f}", 8, 24, C_CYAN, 0.55, 1)

        # Gaze screen position
        cx, cy = cursor_xy
        _text(out, f"Gaze  {cx},{cy}", 80, 24, C_WHITE, 0.50, 1)

        # Calibration state
        cal_txt = "CALIBRATED" if gaze_result.is_calibrated else "NOT CALIBRATED"
        cal_col = C_GREEN if gaze_result.is_calibrated else C_RED
        _text(out, cal_txt, self.fw - 150, 24, cal_col, 0.50, 1)

        # Pause indicator
        if is_paused:
            _text(out, "⏸ PAUSED", self.fw // 2 - 40, 24, C_YELLOW, 0.55, 1)

        # ── Gesture badge ────────────────────────────────────────────────────
        gesture = hand_result.gesture
        label, color = GESTURE_INFO.get(gesture, ("", C_WHITE))
        if label:
            badge_w = 140
            bx = self.fw - badge_w - 8
            by = bar_h + 8
            _filled_rect(out, bx, by, badge_w, 40, color, alpha=0.65)
            _text(out, gesture.upper(), bx + 6, by + 16, C_DARK, 0.50, 2)
            _text(out, label,           bx + 6, by + 34, C_DARK, 0.45, 1)

        # ── Action flash (bottom center) ─────────────────────────────────────
        if action_label:
            aw  = len(action_label) * 13 + 24
            ax  = (self.fw - aw) // 2
            ay  = self.fh - 55
            _filled_rect(out, ax, ay, aw, 38, C_CYAN, alpha=0.80)
            _text(out, f"✓  {action_label}", ax + 10, ay + 26, C_DARK, 0.60, 2)

        # ── Dwell progress ring at iris centre in frame ───────────────────────
        if dwell_prog > 0 and gaze_result.iris_left_px is not None:
            # Map cursor position back to frame coords (approximate)
            fx = int(gaze_result.iris_left_px[0])
            fy = int(gaze_result.iris_left_px[1])
            _dwell_ring(out, fx, fy, dwell_prog, r=20)

        # ── "face not found" warning ──────────────────────────────────────────
        if not gaze_result.detected:
            _filled_rect(out, self.fw // 2 - 130, self.fh // 2 - 22, 260, 44,
                         C_RED, alpha=0.70)
            _text(out, "⚠  Face not detected", self.fw // 2 - 118,
                  self.fh // 2 + 8, C_WHITE, 0.65, 2)

        return out


# ─── Gesture reference panel (separate small window) ─────────────────────────

GESTURE_ROWS = [
    ("Fist",        "👊", "Click / Confirm"),
    ("Peace / V",   "✌", "Copy"),
    ("Thumbs Up",   "👍", "Scroll Up"),
    ("Thumbs Down", "👎", "Scroll Down"),
    ("Open Palm",   "🖐", "Pause Cursor"),
    ("Pinch",       "🤏", "Drag"),
    ("Shaka",       "🤙", "Zoom In"),
    ("Rock On",     "🤘", "Zoom Out"),
    ("L-Shape",     "👆", "Delete"),
    ("Swipe Left",  "👈", "Undo"),
    ("Swipe Right", "👉", "Redo"),
]


def make_gesture_panel(active_gesture: str = "none") -> np.ndarray:
    """Return a 260×400 BGR image of the gesture reference card."""
    pw, ph = 260, 42 + len(GESTURE_ROWS) * 32 + 12
    panel = np.full((ph, pw, 3), (18, 18, 28), dtype=np.uint8)

    # Title
    cv2.putText(panel, "GESTURE COMMANDS", (10, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, C_CYAN, 1, cv2.LINE_AA)
    cv2.line(panel, (10, 28), (pw - 10, 28), (60, 60, 100), 1)

    for idx, (name, emoji, action) in enumerate(GESTURE_ROWS):
        gy = 42 + idx * 32
        gesture_key = name.lower().replace(" / ", "_").replace(" ", "_")

        # Active highlight
        if active_gesture and active_gesture in gesture_key:
            cv2.rectangle(panel, (4, gy - 4), (pw - 4, gy + 24), (40, 40, 80), -1)

        _text(panel, emoji, 10, gy + 16, C_WHITE, 0.55, 1)
        _text(panel, name,  36, gy + 12, C_WHITE, 0.42, 1)
        _text(panel, action, 36, gy + 26, (140, 200, 255), 0.38, 1)

    return panel
