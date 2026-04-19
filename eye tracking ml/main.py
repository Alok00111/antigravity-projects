"""
main.py — EyeFlow: Eye Tracker + Hand Gesture Controller
=========================================================

This is the entry point for the entire application.
It orchestrates calibration, camera capture, gaze tracking,
hand gesture recognition, cursor smoothing, and the debug overlay.

How the main loop works
-----------------------
1. CalibrationController shows a fullscreen 5×5 grid.  The user clicks
   each dot while looking at it → trains the gaze regression model.
2. The camera re-opens and four systems run every frame:
   - GazeTracker.process()  → predicts where the user is looking
   - SmoothCursor.update()  → smooths the prediction and moves the OS cursor
   - HandTracker.process()  → detects hand gestures
   - ActionExecutor.execute() → maps gestures to OS actions (click, copy, etc.)
3. An OpenCV debug window shows the camera feed with overlays.

Keyboard shortcuts (while the debug window is focused)
------------------------------------------------------
    Q       → Quit
    R       → Recalibrate (re-runs the 25-dot calibration)
    P       → Toggle cursor pause
    D       → Toggle dwell-click on/off

Functions & Classes
-------------------
class EyeFlow
    The main application.
    - run(force_recalibrate)
        Entry point — does calibration, then enters the main loop.
        If a saved calibration exists, it is loaded automatically.
        Use --recalibrate to force a fresh calibration.
    - _recalibrate()
        Tear down windows, re-run calibration, save, re-open camera.
    - _show_action(label)
        Display an action label on the overlay for 1.8 seconds.
    - _cleanup()
        Release camera, close MediaPipe, destroy windows.
"""


import argparse
import sys
import time
import cv2
import numpy as np

# ── Project modules ───────────────────────────────────────────────────────────
from config import (
    CAMERA_INDEX, CAMERA_WIDTH, CAMERA_HEIGHT, TARGET_FPS,
    SCREEN_W, SCREEN_H,
)
from gaze        import GazeTracker
from hands       import HandTracker
from cursor      import SmoothCursor, DwellClicker
from actions     import ActionExecutor
from calibration import CalibrationController
from overlay     import Overlay, make_gesture_panel


# ─── Main application class ───────────────────────────────────────────────────

class EyeFlow:

    WIN_MAIN  = "EyeFlow — Debug View  (Q to quit | R to recal)"
    WIN_PANEL = "EyeFlow — Gesture Reference"

    def __init__(self):
        self._cap    = None
        self._gaze   = None          # GazeTracker (fitted after calibration)
        self._hands  = HandTracker()
        self._cursor = SmoothCursor()
        self._dwell  = DwellClicker()
        self._action = None          # ActionExecutor (created after cursor is ready)

        self._dwell_enabled  = True
        self._last_action_lbl = ""
        self._action_lbl_t    = 0.0
        self._action_lbl_dur  = 1.8   # seconds to display action label

        # FPS measurement
        self._fps_t  = time.time()
        self._fps_n  = 0
        self._fps    = 0.0

    # ── Entry point ───────────────────────────────────────────────────────────

    def run(self, force_recalibrate: bool = False):
        print("\n=== EyeFlow - Eye Tracker + Gestures ===\n")

        # ── Step 1: Calibration (or load saved) ──────────────────────────────
        self._gaze = GazeTracker()

        # Try to load a previously saved calibration model
        if not force_recalibrate and self._gaze.load():
            print("[1/3] Loaded saved calibration ✓  (use --recalibrate to redo)")
        else:
            if force_recalibrate:
                print("[1/3] Recalibration requested — starting calibration UI …")
            else:
                print("[1/3] No saved calibration found — starting calibration UI …")

            cal = CalibrationController()
            self._gaze = cal.run()          # blocks; returns fitted GazeTracker

            if not self._gaze.is_calibrated:
                print("[ERROR] Calibration failed. Exiting.")
                sys.exit(1)

            # Save the trained model so next run skips calibration
            if self._gaze.save():
                print("[1/3] Calibration saved to disk ✓")
            print("[1/3] Calibration complete ✓")

        # ── Step 2: Open camera ───────────────────────────────────────────────
        print("[2/3] Opening camera …")
        self._cap = cv2.VideoCapture(CAMERA_INDEX)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CAMERA_WIDTH)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
        self._cap.set(cv2.CAP_PROP_FPS,          TARGET_FPS)

        if not self._cap.isOpened():
            print("[ERROR] Cannot open camera. Exiting.")
            sys.exit(1)
        print("[2/3] Camera opened ✓")

        # ── Step 3: Boot action executor ──────────────────────────────────────
        self._action = ActionExecutor(self._cursor)

        # Center cursor on screen
        self._cursor.warp(SCREEN_W // 2, SCREEN_H // 2)

        # ── Step 4: Windows ───────────────────────────────────────────────────
        cv2.namedWindow(self.WIN_MAIN,  cv2.WINDOW_NORMAL)
        cv2.namedWindow(self.WIN_PANEL, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(self.WIN_MAIN,  CAMERA_WIDTH, CAMERA_HEIGHT)
        cv2.resizeWindow(self.WIN_PANEL, 264, 400)
        cv2.moveWindow(self.WIN_PANEL,  SCREEN_W - 270, 60)
        cv2.moveWindow(self.WIN_MAIN,   SCREEN_W - 270 - CAMERA_WIDTH - 10, 60)

        overlay = Overlay(CAMERA_WIDTH, CAMERA_HEIGHT)
        print("[3/3] Tracking started ✓  (debug window open)\n")

        # ── Main loop ─────────────────────────────────────────────────────────
        while True:
            ret, frame = self._cap.read()
            if not ret:
                print("[WARN] Frame capture failed — retrying …")
                time.sleep(0.05)
                continue

            frame = cv2.flip(frame, 1)          # mirror for natural feel

            # ── Gaze ──────────────────────────────────────────────────────────
            gaze_r = self._gaze.process(frame)

            if gaze_r.is_calibrated and gaze_r.detected:
                cx, cy = self._cursor.update(gaze_r.screen_x, gaze_r.screen_y)
            else:
                cx, cy = self._cursor.get()

            # ── Dwell click ───────────────────────────────────────────────────
            dwell_prog = 0.0
            if self._dwell_enabled and not self._cursor.paused:
                dwell_prog, clicked = self._dwell.update(cx, cy)
                if clicked:
                    self._show_action("DWELL CLICK")

            # ── Hands ─────────────────────────────────────────────────────────
            hand_r = self._hands.process(frame)
            frame  = self._hands.draw(frame, hand_r)

            # ── Actions ───────────────────────────────────────────────────────
            if hand_r.gesture not in ("none", "holding"):
                lbl = self._action.execute(hand_r.gesture, cx, cy)
                if lbl:
                    self._show_action(lbl)

            # ── FPS ───────────────────────────────────────────────────────────
            self._fps_n += 1
            elapsed = time.time() - self._fps_t
            if elapsed >= 1.0:
                self._fps    = self._fps_n / elapsed
                self._fps_n  = 0
                self._fps_t  = time.time()

            # Expire action label
            if time.time() - self._action_lbl_t > self._action_lbl_dur:
                self._last_action_lbl = ""

            # ── Render ────────────────────────────────────────────────────────
            vis = overlay.render(
                frame,
                gaze_result  = gaze_r,
                hand_result  = hand_r,
                cursor_xy    = (cx, cy),
                dwell_prog   = dwell_prog,
                action_label = self._last_action_lbl,
                is_paused    = self._cursor.paused,
                fps          = self._fps,
            )
            cv2.imshow(self.WIN_MAIN,  vis)

            # Gesture panel
            panel = make_gesture_panel(hand_r.gesture)
            cv2.imshow(self.WIN_PANEL, panel)

            # ── Keyboard shortcuts ────────────────────────────────────────────
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("Quit.")
                break
            elif key == ord('r'):
                print("Recalibrating …")
                self._recalibrate()
                overlay = Overlay(CAMERA_WIDTH, CAMERA_HEIGHT)
            elif key == ord('p'):
                self._cursor.paused = not self._cursor.paused
                print(f"Cursor {'paused' if self._cursor.paused else 'resumed'}")
            elif key == ord('d'):
                self._dwell_enabled = not self._dwell_enabled
                print(f"Dwell click {'enabled' if self._dwell_enabled else 'disabled'}")

        self._cleanup()

    # ── Recalibrate in place ──────────────────────────────────────────────────

    def _recalibrate(self):
        """Tear down, re-run the 25-dot calibration, save, and re-open."""
        self._cap.release()
        cv2.destroyAllWindows()
        self._gaze.reset()

        cal = CalibrationController()
        self._gaze = cal.run()

        # Save the new calibration to disk
        if self._gaze.is_calibrated and self._gaze.save():
            print("[INFO] New calibration saved to disk ✓")

        self._cap = cv2.VideoCapture(CAMERA_INDEX)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CAMERA_WIDTH)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
        cv2.namedWindow(self.WIN_MAIN,  cv2.WINDOW_NORMAL)
        cv2.namedWindow(self.WIN_PANEL, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(self.WIN_MAIN,  CAMERA_WIDTH, CAMERA_HEIGHT)
        cv2.resizeWindow(self.WIN_PANEL, 264, 400)
        cv2.moveWindow(self.WIN_PANEL, SCREEN_W - 270, 60)
        cv2.moveWindow(self.WIN_MAIN,  SCREEN_W - 270 - CAMERA_WIDTH - 10, 60)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _show_action(self, label: str):
        self._last_action_lbl = label
        self._action_lbl_t    = time.time()
        print(f"  ► {label}")

    def _cleanup(self):
        if self._cap:
            self._cap.release()
        self._gaze.release()
        self._hands.release()
        cv2.destroyAllWindows()


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EyeFlow — Eye Tracker + Gesture Controller")
    parser.add_argument("--recalibrate", action="store_true",
                        help="Force recalibration even if a saved model exists")
    args = parser.parse_args()

    app = EyeFlow()
    app.run(force_recalibrate=args.recalibrate)
