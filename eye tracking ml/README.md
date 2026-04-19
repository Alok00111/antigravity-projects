# EyeFlow 👁️ — Eye Tracker + Hand Gesture Controller

Control your **real OS cursor** with just your eyes. Hand gestures trigger copy, scroll, zoom, undo and more.

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the app
python main.py
```

---

## How It Works

| Phase | What happens |
|---|---|
| **Calibration** | Full-screen overlay with 9 red dots. Look at each dot and click it. Takes ~30 seconds. |
| **Tracking** | Your iris position is mapped to screen coordinates in real-time. The **actual OS cursor** moves. |
| **Gestures** | Show a hand gesture to trigger an OS action (see table below). |

---

## Gesture Commands

| Show this | Gesture name | Action triggered |
|---|---|---|
| 👊 | Fist | **Click** at gaze position |
| ✌️ | Peace / V | **Copy** (Ctrl+C) |
| 👍 | Thumbs Up | **Scroll Up** |
| 👎 | Thumbs Down | **Scroll Down** |
| 🖐️ | Open Palm | **Pause / Resume** cursor |
| 🤏 | Pinch | **Drag** (hold to drag) |
| 🤙 | Shaka | **Zoom In** (Ctrl++) |
| 🤘 | Rock On | **Zoom Out** (Ctrl+-) |
| 👆 | L-Shape | **Delete** |
| 👈 | Swipe Left | **Undo** (Ctrl+Z) |
| 👉 | Swipe Right | **Redo** (Ctrl+Y) |

---

## Debug Window Shortcuts

| Key | Action |
|---|---|
| `Q` | Quit |
| `R` | Recalibrate |
| `P` | Pause / Resume cursor |
| `D` | Toggle dwell-click |

---

## Project Files

```
eye tracking ml/
├── main.py           ← Entry point — run this
├── config.py         ← All tunable settings
├── gaze.py           ← MediaPipe FaceMesh + scikit-learn gaze regression
├── hands.py          ← MediaPipe Hands + rule-based gesture classifier
├── cursor.py         ← Smooth cursor (Win32) + dwell-click
├── actions.py        ← Gesture → pyautogui OS action mappings
├── calibration.py    ← tkinter fullscreen 9-point calibration UI
├── overlay.py        ← OpenCV HUD renderer
└── requirements.txt
```

---

## Tuning Tips

Edit `config.py` to adjust:

| Setting | Default | Effect |
|---|---|---|
| `GAZE_ALPHA` | `0.12` | Cursor smoothing (lower = smoother, more lag) |
| `DEAD_ZONE_PX` | `10` | Ignore tiny jitter below this px threshold |
| `DWELL_TIME_S` | `1.5` | Seconds to hold gaze before auto-click |
| `GESTURE_HOLD_FRAMES` | `6` | Frames gesture must be held to trigger |
| `CAL_SAMPLES` | `40` | Frames captured per calibration dot |

---

## System Requirements

- Python 3.8+
- Windows 10/11 (uses Win32 API for cursor control)
- Webcam (720p or higher recommended)
- Decent lighting on your face
