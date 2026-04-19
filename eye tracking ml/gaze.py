"""
gaze.py — Iris-based gaze tracker
===================================

Uses MediaPipe FaceMesh (refine_landmarks=True) to extract iris positions,
then maps them to screen coordinates via scikit-learn polynomial regression.

How it works
------------
1. MediaPipe detects 478 face landmarks including 10 iris landmarks.
2. We extract a feature vector from relative iris/eye/head positions.
3. During calibration we collect (features, screen_x, screen_y) pairs.
4. A Ridge regression model (with degree-2 polynomial features) is
   trained on the collected data.
5. During live tracking, each frame's features are fed to the model
   to predict where on the screen the user is looking.

Feature vector (14 dimensions)
------------------------------
  0-1   Left iris normalised (x, y)
  2-3   Right iris normalised (x, y)
  4-5   Left iris relative to left-eye socket (rx, ry)
  6-7   Right iris relative to right-eye socket (rx, ry)
  8-9   Average relative iris position (avg_rx, avg_ry)
 10-11  Nose tip normalised (x, y) — captures head rotation
 12-13  Left-eye–right-eye distance and vertical midpoint — captures
        head distance / tilt

Functions & Classes
-------------------
class GazeResult
    Dataclass holding one frame's gaze output:
    - detected          : bool — was a face found?
    - screen_x, screen_y: int — predicted screen coordinates
    - iris_left_px      : ndarray — left iris centre in image pixels
    - iris_right_px     : ndarray — right iris centre in image pixels
    - face_mesh         : object — raw MediaPipe landmarks
    - is_calibrated     : bool — has the model been fitted?

class GazeTracker
    The main tracker.
    - add_calibration_sample(frame, sx, sy) → bool
        Record one frame while the user looks at (sx, sy).
    - fit() → bool
        Train the regression model on all collected samples.
    - save(path) → bool
        Save the trained model to a file using joblib.
    - load(path) → bool
        Load a previously saved model from a file.
    - process(frame) → GazeResult
        Run one frame through MediaPipe + the model.
    - reset()
        Clear calibration data and model.
    - release()
        Free MediaPipe resources.
"""

import os
import cv2
import mediapipe as mp
import numpy as np
import joblib
from sklearn.linear_model import Ridge
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
import threading
from dataclasses import dataclass
from typing import Optional, List

# Default path for saved calibration model (same folder as this script)
CALIBRATION_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "calibration_model.joblib")


# ─── Result dataclass ────────────────────────────────────────────────────────

@dataclass
class GazeResult:
    """Output of GazeTracker.process() for a single camera frame."""
    detected:      bool  = False         # Was a face found in this frame?
    screen_x:      int   = 0             # Predicted gaze X on screen
    screen_y:      int   = 0             # Predicted gaze Y on screen
    iris_left_px:  Optional[np.ndarray] = None   # Left iris (x,y) in image px
    iris_right_px: Optional[np.ndarray] = None   # Right iris (x,y) in image px
    face_mesh:     object = None         # Raw MP landmark object
    is_calibrated: bool  = False         # True after fit() succeeds


# ─── Tracker ─────────────────────────────────────────────────────────────────

class GazeTracker:
    """
    Iris-landmark gaze tracker with polynomial regression calibration.

    Landmark indices used (MediaPipe FaceMesh with refine_landmarks=True):
      468-472   Left iris ring (5 points, 468 = centre)
      473-477   Right iris ring (5 points, 473 = centre)
      133, 33   Left eye inner / outer corners
      362, 263  Right eye inner / outer corners
      159, 145  Left eye top / bottom
      386, 374  Right eye top / bottom
      1         Nose tip       (head yaw / pitch proxy)
      152       Chin           (head tilt proxy)
    """

    # ── MediaPipe landmark indices ───────────────────────────────────
    # Iris rings — all 5 points averaged for a stable centre
    L_IRIS_IDX = [468, 469, 470, 471, 472]
    R_IRIS_IDX = [473, 474, 475, 476, 477]

    # Eye corners for horizontal normalisation
    L_INNER, L_OUTER = 133, 33
    R_INNER, R_OUTER = 362, 263

    # Eye top/bottom for vertical normalisation
    L_TOP, L_BOT = 159, 145
    R_TOP, R_BOT = 386, 374

    # Head pose landmarks
    NOSE_TIP = 1
    CHIN     = 152

    def __init__(self):
        # Initialise MediaPipe FaceMesh
        mp_fm = mp.solutions.face_mesh
        self._mesh = mp_fm.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,          # REQUIRED for iris landmarks
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        # Calibration data storage
        self._cal_X: List[np.ndarray] = []     # feature vectors
        self._cal_y: List[List[float]] = []    # screen (x, y) labels

        # Trained model (None until fit() is called)
        self._model: Optional[Pipeline] = None
        self._lock  = threading.Lock()
        self.is_calibrated = False

    # ── Private helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _center(lm, indices, w, h) -> np.ndarray:
        """
        Average the (x, y) pixel positions of the given landmark indices.
        Returns a 2-element ndarray [px_x, px_y].
        """
        pts = np.array([[lm[i].x * w, lm[i].y * h] for i in indices])
        return pts.mean(axis=0)

    def _features(self, lm, w, h) -> np.ndarray:
        """
        Build a 14-dimension feature vector from one frame's face landmarks.

        The features include:
          - Raw normalised iris positions (captures absolute gaze direction)
          - Iris position relative to eye-socket width/height (removes
            head-translation noise)
          - Averaged relative positions (stabilises left-right differences)
          - Nose tip normalised position (captures head yaw / pitch)
          - Inter-eye distance and vertical midpoint (captures head
            distance from camera and head tilt)
        """
        # --- Raw normalised iris positions (0-3) ---------------------------
        # Average all 5 iris landmarks for stability instead of just one
        li_x = np.mean([lm[i].x for i in self.L_IRIS_IDX])
        li_y = np.mean([lm[i].y for i in self.L_IRIS_IDX])
        ri_x = np.mean([lm[i].x for i in self.R_IRIS_IDX])
        ri_y = np.mean([lm[i].y for i in self.R_IRIS_IDX])

        # --- Iris relative to eye-socket (4-7) -----------------------------
        # Horizontal: how far across the eye the iris is (0 = inner corner, 1 = outer)
        l_ew = abs(lm[self.L_OUTER].x - lm[self.L_INNER].x) + 1e-6
        r_ew = abs(lm[self.R_OUTER].x - lm[self.R_INNER].x) + 1e-6
        l_rx = (li_x - lm[self.L_INNER].x) / l_ew
        r_rx = (ri_x - lm[self.R_INNER].x) / r_ew

        # Vertical: how far down the eye the iris is (0 = top, 1 = bottom)
        l_eh = abs(lm[self.L_BOT].y - lm[self.L_TOP].y) + 1e-6
        r_eh = abs(lm[self.R_BOT].y - lm[self.R_TOP].y) + 1e-6
        l_ry = (li_y - lm[self.L_TOP].y) / l_eh
        r_ry = (ri_y - lm[self.R_TOP].y) / r_eh

        # --- Averaged relative iris position (8-9) -------------------------
        avg_rx = (l_rx + r_rx) / 2.0
        avg_ry = (l_ry + r_ry) / 2.0

        # --- Head pose proxy features (10-13) ------------------------------
        # Nose tip position tells us where the head is pointing
        nose_x = lm[self.NOSE_TIP].x
        nose_y = lm[self.NOSE_TIP].y

        # Inter-eye distance (shrinks when head is further from camera)
        eye_dist = ((lm[self.L_INNER].x - lm[self.R_INNER].x) ** 2 +
                    (lm[self.L_INNER].y - lm[self.R_INNER].y) ** 2) ** 0.5

        # Vertical midpoint of the two eyes (shifts with head tilt)
        eye_mid_y = (lm[self.L_INNER].y + lm[self.R_INNER].y) / 2.0

        return np.array(
            [li_x, li_y, ri_x, ri_y,              # raw iris (0-3)
             l_rx, l_ry, r_rx, r_ry,               # relative iris (4-7)
             avg_rx, avg_ry,                        # averaged relative (8-9)
             nose_x, nose_y,                        # nose tip (10-11)
             eye_dist, eye_mid_y],                  # head geometry (12-13)
            dtype=np.float32
        )

    def _run_mediapipe(self, frame):
        """
        Run FaceMesh on a BGR frame.
        Returns the first face's landmarks, or None if no face.
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self._mesh.process(rgb)
        if result.multi_face_landmarks:
            return result.multi_face_landmarks[0]
        return None

    # ── Calibration API ──────────────────────────────────────────────────────

    def add_calibration_sample(self, frame: np.ndarray,
                               screen_x: int, screen_y: int) -> bool:
        """
        Record one calibration sample.

        Call this repeatedly while the user is looking at the dot at
        (screen_x, screen_y).  Each call processes one camera frame.

        Returns True if a face was detected and the sample was saved.
        Returns False if no face was found (sample skipped).
        """
        h, w = frame.shape[:2]
        face = self._run_mediapipe(frame)
        if face is None:
            return False
        feat = self._features(face.landmark, w, h)
        self._cal_X.append(feat)
        self._cal_y.append([float(screen_x), float(screen_y)])
        return True

    def fit(self) -> bool:
        """
        Train the Ridge regression model on all collected calibration data.

        The model uses degree-2 polynomial features, which means it can
        learn curved mappings (e.g. lens distortion, head geometry).
        Ridge regularisation (alpha=1.0) prevents overfitting to noise.

        Returns True on success, False if there aren't enough samples.
        """
        if len(self._cal_X) < 9:
            return False

        X = np.array(self._cal_X)
        y = np.array(self._cal_y)

        # Build a pipeline:  raw features → polynomial expansion → Ridge regression
        model = Pipeline([
            ('poly', PolynomialFeatures(degree=2, include_bias=True)),
            ('reg',  Ridge(alpha=1.0)),
        ])
        model.fit(X, y)

        with self._lock:
            self._model = model
            self.is_calibrated = True
        return True

    def save(self, path: str = None) -> bool:
        """
        Save the trained model to disk so calibration persists across runs.

        Uses joblib to serialise the sklearn Pipeline.  The file is saved
        next to this script as 'calibration_model.joblib' by default.

        Returns True on success, False if no model is fitted yet.
        """
        if path is None:
            path = CALIBRATION_FILE
        with self._lock:
            if self._model is None:
                return False
            try:
                joblib.dump(self._model, path)
                return True
            except Exception as e:
                print(f"[WARN] Could not save calibration: {e}")
                return False

    def load(self, path: str = None) -> bool:
        """
        Load a previously saved model from disk.

        If the file exists and loads successfully, the tracker is
        immediately ready for live tracking (no calibration needed).

        Returns True on success, False if file doesn't exist or is corrupt.
        """
        if path is None:
            path = CALIBRATION_FILE
        if not os.path.exists(path):
            return False
        try:
            model = joblib.load(path)
            with self._lock:
                self._model = model
                self.is_calibrated = True
            return True
        except Exception as e:
            print(f"[WARN] Could not load calibration: {e}")
            return False

    def reset(self):
        """Clear all calibration data and the trained model."""
        self._cal_X.clear()
        self._cal_y.clear()
        with self._lock:
            self._model = None
            self.is_calibrated = False

    @property
    def num_samples(self) -> int:
        """How many calibration samples have been collected so far."""
        return len(self._cal_X)

    # ── Tracking API ─────────────────────────────────────────────────────────

    def process(self, frame: np.ndarray) -> GazeResult:
        """
        Process one camera frame and predict the gaze screen position.

        Steps:
        1. Run MediaPipe FaceMesh to get landmarks.
        2. If calibrated, extract features and predict (x, y) with the model.
        3. Return a GazeResult with all relevant data.
        """
        h, w = frame.shape[:2]
        face = self._run_mediapipe(frame)

        result = GazeResult(is_calibrated=self.is_calibrated)
        if face is None:
            return result

        lm = face.landmark
        result.detected  = True
        result.face_mesh = face

        # Compute iris centres in pixel coordinates (for overlay drawing)
        result.iris_left_px  = self._center(lm, self.L_IRIS_IDX, w, h)
        result.iris_right_px = self._center(lm, self.R_IRIS_IDX, w, h)

        # Predict screen coordinates if the model is ready
        with self._lock:
            if self.is_calibrated and self._model is not None:
                feat = self._features(lm, w, h)
                pred = self._model.predict(feat.reshape(1, -1))[0]
                result.screen_x = int(pred[0])
                result.screen_y = int(pred[1])

        return result

    def release(self):
        """Close the MediaPipe FaceMesh session."""
        self._mesh.close()
