"""
hands.py — Hand tracker + gesture classifier
==============================================

Detects 11 gestures from MediaPipe Hands landmarks.
Each gesture maps to an OS action (see actions.py).

Supported gestures
------------------
  fist          → Click / Confirm
  open_palm     → Pause cursor
  peace         → Copy
  thumbs_up     → Scroll up
  thumbs_down   → Scroll down
  pinch         → Drag
  shaka         → Zoom in
  rock          → Zoom out
  l_shape       → Delete
  swipe_left    → Undo
  swipe_right   → Redo

How gesture detection works
---------------------------
1. MediaPipe Hands finds 21 hand landmarks in the frame.
2. GestureClassifier checks finger up/down states using landmark
   positions (tip vs. PIP joint for fingers, tip vs. IP for thumb).
3. Simple rules map finger states to gestures (e.g. all fingers
   down = fist, index + middle up = peace).
4. A debounce buffer ensures a gesture must be held for
   GESTURE_HOLD_FRAMES consecutive frames before firing.
5. Swipe detection tracks the wrist's horizontal movement over
   the last 20 frames.

Functions & Classes
-------------------
class GestureClassifier
    Rule-based gesture classifier from 21 hand landmarks.
    - classify(landmarks, handedness) → (gesture_name, confidence)

class HandTracker
    Wraps MediaPipe Hands + GestureClassifier + debounce logic.
    - process(frame)      → HandResult
    - draw(frame, result) → frame with hand skeleton drawn
    - release()           → close MediaPipe

class HandResult (dataclass)
    - detected    : bool
    - gesture     : str
    - confidence  : float
    - hand_lm     : MediaPipe hand landmarks
    - handedness  : "Left" or "Right"
"""

import cv2
import mediapipe as mp
import numpy as np
import time
from collections import deque, Counter
from dataclasses import dataclass
from typing import Optional, Tuple
from config import GESTURE_HOLD_FRAMES, GESTURE_COOLDOWN_S, PINCH_THRESHOLD, SWIPE_THRESHOLD


# ─── Result dataclass ────────────────────────────────────────────────────────

@dataclass
class HandResult:
    detected:   bool   = False
    gesture:    str    = "none"
    confidence: float  = 0.0
    hand_lm:    object = None
    handedness: str    = "Right"


# ─── Gesture classifier ───────────────────────────────────────────────────────

class GestureClassifier:
    """
    Rule-based gesture classifier from 21 MediaPipe hand landmarks.
    Landmark IDs:
        0=Wrist  4=ThumbTip  8=IndexTip  12=MiddleTip  16=RingTip  20=PinkyTip
        2=ThumbMCP  3=ThumbIP
        6=IndexPIP  10=MiddlePIP  14=RingPIP  18=PinkyPIP
    """

    def classify(self, lm, handedness: str) -> Tuple[str, float]:
        """Return (gesture_name, confidence)."""
        t, i, m, r, p = self._finger_states(lm, handedness)
        pinch = self._dist(lm[4], lm[8]) < PINCH_THRESHOLD

        # Priority order matters
        if pinch and not m and not r and not p:
            return "pinch", 0.90

        if not t and not i and not m and not r and not p:
            return "fist", 0.95

        if i and m and r and p:                         # all 4 up → palm
            return "open_palm", 0.90

        if not t and i and m and not r and not p:       # V sign
            return "peace", 0.90

        if t and not i and not m and not r and p:       # thumb + pinky
            return "shaka", 0.90

        if not t and i and not m and not r and p:       # index + pinky
            return "rock", 0.90

        if t and i and not m and not r and not p:       # L shape
            return "l_shape", 0.85

        if t and not i and not m and not r and not p:   # thumb only
            wrist_y = lm[0].y
            tip_y   = lm[4].y
            if tip_y < wrist_y - 0.10:
                return "thumbs_up", 0.90
            if tip_y > wrist_y + 0.05:
                return "thumbs_down", 0.85

        return "none", 0.0

    # ── helpers ──────────────────────────────────────────────────────────────

    def _finger_states(self, lm, handedness):
        """Returns (thumb, index, middle, ring, pinky) as booleans."""
        i = lm[8].y  < lm[6].y  - 0.02
        m = lm[12].y < lm[10].y - 0.02
        r = lm[16].y < lm[14].y - 0.02
        p = lm[20].y < lm[18].y - 0.02
        # Thumb: compare tip to IP joint horizontally
        if handedness == "Right":
            t = lm[4].x < lm[3].x - 0.02
        else:
            t = lm[4].x > lm[3].x + 0.02
        return t, i, m, r, p

    @staticmethod
    def _dist(a, b) -> float:
        return ((a.x - b.x)**2 + (a.y - b.y)**2) ** 0.5


# ─── Hand Tracker ─────────────────────────────────────────────────────────────

class HandTracker:
    def __init__(self):
        mp_h = mp.solutions.hands
        self._hands = mp_h.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.70,
            min_tracking_confidence=0.50,
        )
        self._mp_draw   = mp.solutions.drawing_utils
        self._mp_styles = mp.solutions.drawing_styles
        self._clf       = GestureClassifier()

        self._buf            = deque(maxlen=GESTURE_HOLD_FRAMES + 2)
        self._last_gesture   = "none"
        self._last_fire_time = 0.0
        self._wrist_hist     = deque(maxlen=20)

    # ── Main entry ───────────────────────────────────────────────────────────

    def process(self, frame: np.ndarray) -> HandResult:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = self._hands.process(rgb)

        result = HandResult()
        if not res.multi_hand_landmarks:
            self._buf.clear()
            self._wrist_hist.clear()
            return result

        hand_lm   = res.multi_hand_landmarks[0]
        handedness = res.multi_handedness[0].classification[0].label

        result.detected   = True
        result.hand_lm    = hand_lm
        result.handedness = handedness

        lm = hand_lm.landmark

        # Track wrist X for swipe detection
        self._wrist_hist.append(lm[0].x)
        swipe = self._detect_swipe()
        if swipe:
            result.gesture    = swipe
            result.confidence = 0.85
            return result

        # Static gesture classification + debounce
        gesture, conf = self._clf.classify(lm, handedness)
        self._buf.append(gesture)

        stable = self._debounce()
        result.gesture    = stable
        result.confidence = conf
        return result

    # ── Swipe detection ───────────────────────────────────────────────────────

    def _detect_swipe(self) -> Optional[str]:
        if len(self._wrist_hist) < 12:
            return None
        delta = self._wrist_hist[-1] - self._wrist_hist[0]
        if abs(delta) > SWIPE_THRESHOLD:
            now = time.time()
            if now - self._last_fire_time > GESTURE_COOLDOWN_S:
                self._last_fire_time = now
                self._wrist_hist.clear()
                return "swipe_left" if delta < 0 else "swipe_right"
        return None

    # ── Debounce ─────────────────────────────────────────────────────────────

    def _debounce(self) -> str:
        if len(self._buf) < GESTURE_HOLD_FRAMES:
            return "none"

        counts = Counter(self._buf)
        top, n = counts.most_common(1)[0]
        if top == "none" or n < GESTURE_HOLD_FRAMES - 1:
            return "none"

        now = time.time()
        # Continuous scroll gestures re-fire after cooldown
        retrigger = top in ("thumbs_up", "thumbs_down")

        if top == self._last_gesture:
            if now - self._last_fire_time < GESTURE_COOLDOWN_S and not retrigger:
                return "holding"
            if not retrigger:
                return "holding"

        self._last_gesture   = top
        self._last_fire_time = now
        return top

    # ── Drawing ───────────────────────────────────────────────────────────────

    def draw(self, frame: np.ndarray, result: HandResult) -> np.ndarray:
        if not result.detected or result.hand_lm is None:
            return frame
        self._mp_draw.draw_landmarks(
            frame,
            result.hand_lm,
            mp.solutions.hands.HAND_CONNECTIONS,
            self._mp_styles.get_default_hand_landmarks_style(),
            self._mp_styles.get_default_hand_connections_style(),
        )
        return frame

    def release(self):
        self._hands.close()
