"""
actions.py — Gesture → OS action mappings
===========================================

Each gesture detected by HandTracker triggers a real OS-level action.
Uses pyautogui for keyboard/mouse automation and ctypes for native calls.

Gesture → Action mapping
-------------------------
  fist          → Left-click at cursor position
  peace         → Copy (Ctrl+C)
  thumbs_up     → Scroll up
  thumbs_down   → Scroll down
  open_palm     → Toggle cursor pause
  pinch         → Start/continue drag (mouseDown)
  shaka         → Zoom in (Ctrl++)
  rock          → Zoom out (Ctrl+-)
  l_shape       → Delete key
  swipe_left    → Undo (Ctrl+Z)
  swipe_right   → Redo (Ctrl+Y)

Functions & Classes
-------------------
_copy(), _paste(), _undo(), _redo(), _delete()
    Keyboard shortcut helpers using pyautogui.

_zoom_in(), _zoom_out()
    Browser-style zoom via Ctrl +/-.

_start_drag(x, y), _end_drag(x, y)
    Mouse drag helpers (mouseDown / mouseUp).

_click(x, y)
    Simple left-click at the given position.

class ActionExecutor
    Maps gesture strings to OS actions.
    - execute(gesture, cx, cy) → str
        Run the action for the given gesture.
        Returns a human-readable description, or "" if ignored.
"""

import pyautogui
import ctypes
import time
import threading

pyautogui.PAUSE    = 0
pyautogui.FAILSAFE = False

from config import SCROLL_AMOUNT, ZOOM_STEP

# ─── Clipboard helper (Windows native) ───────────────────────────────────────

def _copy():
    """Simulate Ctrl+C."""
    pyautogui.hotkey("ctrl", "c")

def _paste():
    """Simulate Ctrl+V."""
    pyautogui.hotkey("ctrl", "v")

def _undo():
    pyautogui.hotkey("ctrl", "z")

def _redo():
    pyautogui.hotkey("ctrl", "y")

def _delete():
    pyautogui.press("delete")


# ─── Zoom (browser / Windows magnifier style via Ctrl ± ) ────────────────────

_zoom_level = 0  # tracks how many steps we've zoomed

def _zoom_in():
    global _zoom_level
    pyautogui.hotkey("ctrl", "+")
    _zoom_level = min(_zoom_level + 1, 10)

def _zoom_out():
    global _zoom_level
    pyautogui.hotkey("ctrl", "-")
    _zoom_level = max(_zoom_level - 1, -10)


# ─── Drag state ───────────────────────────────────────────────────────────────

_dragging = False

def _start_drag(x, y):
    global _dragging
    if not _dragging:
        pyautogui.mouseDown(x, y, button="left")
        _dragging = True

def _end_drag(x, y):
    global _dragging
    if _dragging:
        pyautogui.mouseUp(x, y, button="left")
        _dragging = False


# ─── Click ───────────────────────────────────────────────────────────────────

def _click(x, y):
    pyautogui.click(x, y)


# ─── Action dispatcher ────────────────────────────────────────────────────────

class ActionExecutor:
    """
    Maps gesture strings to OS actions.
    Call execute(gesture, cursor_x, cursor_y) on every new gesture event.
    """

    # Map gesture → (description, function_taking_xy_or_none)
    GESTURE_MAP = {
        "fist":        ("Click / Confirm",  "click"),
        "peace":       ("Copy",             "copy"),
        "thumbs_up":   ("Scroll Up",        "scroll_up"),
        "thumbs_down": ("Scroll Down",      "scroll_down"),
        "open_palm":   ("Pause Cursor",     "pause"),
        "pinch":       ("Drag",             "drag"),
        "shaka":       ("Zoom In",          "zoom_in"),
        "rock":        ("Zoom Out",         "zoom_out"),
        "l_shape":     ("Delete",           "delete"),
        "swipe_left":  ("Undo",             "undo"),
        "swipe_right": ("Redo",             "redo"),
    }

    def __init__(self, cursor):
        self._cursor   = cursor    # SmoothCursor instance
        self._pinching = False
        self._last_action = ("none", 0.0)

    def execute(self, gesture: str, cx: int, cy: int) -> str:
        """
        Execute the action for the given gesture.
        Returns a human-readable description string, or "" if ignored.
        """
        if gesture in ("none", "holding"):
            # Release drag if pinch ended
            if self._pinching and gesture != "holding":
                _end_drag(cx, cy)
                self._pinching = False
            return ""

        info = self.GESTURE_MAP.get(gesture)
        if info is None:
            return ""

        desc, action = info

        # ── Route to action ──────────────────────────────────────────
        if action == "click":
            _click(cx, cy)

        elif action == "copy":
            _copy()

        elif action == "scroll_up":
            pyautogui.scroll(SCROLL_AMOUNT)

        elif action == "scroll_down":
            pyautogui.scroll(-SCROLL_AMOUNT)

        elif action == "pause":
            self._cursor.paused = not self._cursor.paused
            desc = "Cursor Paused" if self._cursor.paused else "Cursor Resumed"

        elif action == "drag":
            if not self._pinching:
                _start_drag(cx, cy)
                self._pinching = True
            return "Drag"

        elif action == "zoom_in":
            _zoom_in()

        elif action == "zoom_out":
            _zoom_out()

        elif action == "delete":
            _delete()

        elif action == "undo":
            _undo()

        elif action == "redo":
            _redo()

        # Release drag when leaving pinch
        if action != "drag" and self._pinching:
            _end_drag(cx, cy)
            self._pinching = False

        return desc
