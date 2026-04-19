import pygame
import pymunk
import random
import sys
import os
import math
import threading
import queue
import cv2
import numpy as np
from maze_generator import generate_maze

# ─── Constants ────────────────────────────────────────────────────────────────
# Render directly at this size — no scaling overhead every frame.
WINDOW_WIDTH  = 540
WINDOW_HEIGHT = 960

# Physics world is the same coordinate space as the render window.
PHYSICS_WIDTH  = WINDOW_WIDTH
PHYSICS_HEIGHT = WINDOW_HEIGHT

# Scale factor: physics coords → screen coords  (1:1 now)
PX = 1.0
FPS = 60

# Colours
BLACK      = (10,  10,  15)
WHITE      = (245, 245, 245)
GRAY       = (80,  80,  90)
ACCENT     = (50,  150, 255)
OBSTACLE   = (220, 225, 235)
BOWL_COL   = (140, 190, 255)
BUMPER_COL = (255, 220,  0)
BUMPER_RIM = (255, 140,  0)
FINISH_COL = (255, 215,  0)

BALL_RADIUS = 15       # half of old 30 since physics space is now half the size

STATE_MENU      = 0
STATE_PLACEMENT = 1
STATE_RACING    = 2

RECORDINGS_DIR = "recordings"


def _next_recording_path():
    os.makedirs(RECORDINGS_DIR, exist_ok=True)
    existing = [f for f in os.listdir(RECORDINGS_DIR) if f.endswith(".mp4")]
    nums = []
    for f in existing:
        try:
            nums.append(int(os.path.splitext(f)[0]))
        except ValueError:
            pass
    return os.path.join(RECORDINGS_DIR, f"{max(nums)+1 if nums else 1}.mp4")


class App:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Marble Race")
        self.clock = pygame.time.Clock()
        self.font       = pygame.font.SysFont("impact", 22)
        self.big_font   = pygame.font.SysFont("impact", 50)
        self.small_font = pygame.font.SysFont("impact", 16)

        self.state = STATE_MENU

        self.num_balls  = 3
        self.maze_seed  = random.randint(1000, 9999)
        self.ball_colors = [
            (255,  60,  60), ( 60, 220,  80), ( 60, 150, 255),
            (255, 210,  40), (210,  60, 255), ( 40, 230, 220),
            (255, 140,  40), (140,  60, 255), (255, 255, 255), (120, 120, 130)
        ]
        self.ball_setup = []
        self.space = None
        self.track_data = {}
        self.balls = []
        self.camera_y = -150
        self.winner = None
        self.freeze_frames = 0
        self.dragged_ball_index = None

        # Recording
        self.recorder      = None
        self.is_recording  = False
        self._rec_queue    = queue.Queue(maxsize=180)
        self._rec_thread   = None
        self._frame_count  = 0   # used to record at 30fps (every other frame)
        self.collision_log = []
        self.current_recording_path = None

    # ─── Physics ──────────────────────────────────────────────────────────────

    def create_physics_world(self):
        self.space = pymunk.Space()
        self.space.gravity = (0, 980)
        # No damping — preserve energy
        self.space.damping = 1.0
        
        def post_solve_cb(arbiter, space, data):
            if not getattr(self, 'is_recording', False):
                return True
            try:
                impulse = arbiter.total_impulse.length
                if impulse > 500: # threshold for audible collision
                    if len(arbiter.contact_point_set.points) > 0:
                        p = arbiter.contact_point_set.points[0].point_a
                        # Test if on screen vertically
                        if self.camera_y < p.y < self.camera_y + WINDOW_HEIGHT:
                            ts = self._frame_count / 60.0
                            self.collision_log.append(ts)
            except Exception:
                pass
            return True
            
        self.space.on_collision(None, None, post_solve=post_solve_cb)

        self.track_data = generate_maze(
            self.space, PHYSICS_WIDTH, 20000,
            seed=self.maze_seed, ball_radius=BALL_RADIUS
        )

    def reset_balls(self):
        self.balls = []
        for setup in self.ball_setup:
            mass    = 1
            inertia = pymunk.moment_for_circle(mass, 0, BALL_RADIUS)
            body    = pymunk.Body(mass, inertia)
            body.position = setup["pos"]
            shape = pymunk.Circle(body, BALL_RADIUS)
            shape.elasticity = 0.85
            shape.friction   = 0.05
            self.space.add(body, shape)
            self.balls.append({
                "body": body, "shape": shape,
                "color": setup["color"], "name": setup["name"],
                "finished": False,
                "stuck_frames": 0,          # anti-stuck counter
                "last_pos": setup["pos"],   # last sampled position
            })

    # ─── Recording (background thread) ────────────────────────────────────────

    def start_recording(self):
        path = _next_recording_path()
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        # Record at 30 fps (we push every other game frame)
        self.recorder = cv2.VideoWriter(path, fourcc, 30, (WINDOW_WIDTH, WINDOW_HEIGHT))
        self.is_recording = True
        self._frame_count = 0
        self.collision_log = []
        self.current_recording_path = path
        while not self._rec_queue.empty():
            try: self._rec_queue.get_nowait()
            except: break
        self._rec_thread = threading.Thread(target=self._rec_worker, daemon=True)
        self._rec_thread.start()
        print(f"[REC] -> {path}")

    def stop_recording(self):
        if not self.is_recording:
            return
        self.is_recording = False
        self._rec_queue.put(None)   # sentinel
        if self._rec_thread:
            self._rec_thread.join(timeout=15)
        if self.recorder:
            self.recorder.release()
            self.recorder = None
        if self.current_recording_path:
            import json
            json_path = self.current_recording_path.replace('.mp4', '.json')
            with open(json_path, 'w') as f:
                json.dump({"collisions": self.collision_log}, f)
        print("[REC] Saved.")

    def _rec_worker(self):
        while True:
            frame = self._rec_queue.get()
            if frame is None:
                break
            if self.recorder:
                self.recorder.write(frame)

    def capture_frame(self):
        """Called every OTHER game frame → 30fps recording. Non-blocking."""
        self._frame_count += 1
        if self._frame_count % 2 != 0:
            return
        # pygame.image.tobytes is faster than surfarray
        raw = pygame.image.tobytes(self.screen, "RGB")
        arr = np.frombuffer(raw, dtype=np.uint8).reshape((WINDOW_HEIGHT, WINDOW_WIDTH, 3))
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        try:
            self._rec_queue.put_nowait(bgr)
        except queue.Full:
            pass

    # ─── UI Helpers ───────────────────────────────────────────────────────────

    def draw_button(self, surf, text, rect, col, hover_col, mouse):
        hovered = rect.collidepoint(mouse)
        pygame.draw.rect(surf, hover_col if hovered else col, rect, border_radius=8)
        pygame.draw.rect(surf, WHITE, rect, 2, border_radius=8)
        t = self.font.render(text, True, WHITE)
        surf.blit(t, t.get_rect(center=rect.center))
        return hovered

    # ─── Main Loop ────────────────────────────────────────────────────────────

    def run(self):
        running = True
        while running:
            mouse = pygame.mouse.get_pos()
            events = pygame.event.get()
            for ev in events:
                if ev.type == pygame.QUIT:
                    running = False

            self.screen.fill(BLACK)

            if self.state == STATE_MENU:
                self.run_menu(events, mouse)
            elif self.state == STATE_PLACEMENT:
                self.run_placement(events, mouse)
            elif self.state == STATE_RACING:
                self.run_racing(events, mouse)

            pygame.display.flip()

            if self.is_recording:
                self.capture_frame()

            self.clock.tick(FPS)

        if self.is_recording:
            self.stop_recording()
        pygame.quit()
        sys.exit()

    # ─── Menu ─────────────────────────────────────────────────────────────────

    def run_menu(self, events, mouse):
        title = self.big_font.render("MARBLE RACE", True, FINISH_COL)
        sub   = self.font.render("setup", True, ACCENT)
        self.screen.blit(title, title.get_rect(center=(WINDOW_WIDTH//2, 90)))
        self.screen.blit(sub,   sub.get_rect(  center=(WINDOW_WIDTH//2, 140)))

        btn_minus = pygame.Rect(WINDOW_WIDTH//2-75,  200, 40, 40)
        btn_plus  = pygame.Rect(WINDOW_WIDTH//2+35,  200, 40, 40)
        btn_seed  = pygame.Rect(WINDOW_WIDTH//2-75,  300, 150, 45)
        btn_start = pygame.Rect(WINDOW_WIDTH//2-100, 500, 200, 55)

        txt = self.font.render(f"BALLS: {self.num_balls}", True, WHITE)
        self.screen.blit(txt, txt.get_rect(center=(WINDOW_WIDTH//2, 220)))
        hm = self.draw_button(self.screen, "-", btn_minus, GRAY, ACCENT, mouse)
        hp = self.draw_button(self.screen, "+", btn_plus,  GRAY, ACCENT, mouse)

        seed_txt = self.font.render(f"SEED: {self.maze_seed}", True, WHITE)
        self.screen.blit(seed_txt, seed_txt.get_rect(center=(WINDOW_WIDTH//2, 285)))
        hs = self.draw_button(self.screen, "RANDOMIZE", btn_seed,  GRAY, ACCENT, mouse)
        ht = self.draw_button(self.screen, "PLACE BALLS", btn_start, (30,160,60), ACCENT, mouse)

        for ev in events:
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                if hm and self.num_balls > 2:  self.num_balls -= 1
                if hp and self.num_balls < 10: self.num_balls += 1
                if hs: self.maze_seed = random.randint(1000, 9999)
                if ht:
                    self.ball_setup = []
                    for i in range(self.num_balls):
                        col = self.ball_colors[i % len(self.ball_colors)]
                        pos = (WINDOW_WIDTH//2 - 40 + (i%3)*40, -75 - (i//3)*40)
                        self.ball_setup.append({"color": col, "name": f"P{i+1}", "pos": pos})
                    self.create_physics_world()
                    self.reset_balls()
                    self.camera_y = -150
                    self.state = STATE_PLACEMENT

    # ─── Placement ────────────────────────────────────────────────────────────

    def run_placement(self, events, mouse):
        world_mouse = (mouse[0], mouse[1] + self.camera_y)

        for ev in events:
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                for i, b in enumerate(self.balls):
                    bx, by = b["body"].position
                    if ((bx-world_mouse[0])**2 + (by-world_mouse[1])**2)**0.5 <= BALL_RADIUS:
                        self.dragged_ball_index = i; break
            elif ev.type == pygame.MOUSEBUTTONUP and ev.button == 1:
                self.dragged_ball_index = None

        if self.dragged_ball_index is not None:
            nx = max(WINDOW_WIDTH//2-35, min(WINDOW_WIDTH//2+35, world_mouse[0]))
            ny = min(-25, world_mouse[1])
            self.balls[self.dragged_ball_index]["body"].position   = (nx, ny)
            self.ball_setup[self.dragged_ball_index]["pos"]        = (nx, ny)
            self.balls[self.dragged_ball_index]["body"].velocity   = (0, 0)

        self.draw_maze()

        btn_start = pygame.Rect(WINDOW_WIDTH//2-100, 400, 200, 55)
        btn_back  = pygame.Rect(10, 10, 80, 36)
        hs = self.draw_button(self.screen, "START!", btn_start, (30,160,60), ACCENT, mouse)
        hb = self.draw_button(self.screen, "BACK",  btn_back,  GRAY,       ACCENT, mouse)

        inst = self.small_font.render("Drag balls to position!", True, WHITE)
        self.screen.blit(inst, inst.get_rect(center=(WINDOW_WIDTH//2, 50)))

        for ev in events:
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                if hs:
                    self.winner = None
                    self.freeze_frames = 0
                    self.state = STATE_RACING
                    self.start_recording()
                if hb:
                    self.state = STATE_MENU

    # ─── Racing ───────────────────────────────────────────────────────────────

    def run_racing(self, events, mouse):
        if self.freeze_frames == 0:
            # 2 substeps — good collision accuracy without killing performance
            dt = 1.0 / (FPS * 2)
            self.space.step(dt)
            self.space.step(dt)

            # ── Anti-stuck: kick balls that haven't moved in ~2 s ────────────
            for b in self.balls:
                if b["finished"]:
                    continue
                pos = b["body"].position
                lx, ly = b["last_pos"]
                moved = ((pos.x - lx)**2 + (pos.y - ly)**2) ** 0.5
                if moved < 3:          # ball barely moved this frame
                    b["stuck_frames"] += 1
                else:
                    b["stuck_frames"] = 0
                    b["last_pos"] = (pos.x, pos.y)

                # 2 seconds at 60 fps = 120 frames
                if b["stuck_frames"] > 120:
                    b["stuck_frames"] = 0
                    b["last_pos"] = (pos.x, pos.y)
                    # Random horizontal + strong downward impulse to dislodge
                    kick_x = random.uniform(-200, 200)
                    kick_y = random.uniform(300, 700)
                    b["body"].apply_impulse_at_world_point(
                        (kick_x, kick_y), (pos.x, pos.y)
                    )
            for gate in self.track_data["gates"]:
                if not gate["opened"]:
                    if all(b["body"].position.y >= gate["y"] - 150 for b in self.balls):
                        gate["opened"] = True
                        try:
                            self.space.remove(gate["shape"])
                            self.track_data["obstacles"] = [
                                o for o in self.track_data["obstacles"]
                                if o["shape"] is not gate["shape"]
                            ]
                        except: pass

            # Finish logic
            fl = self.track_data["finish_line"]
            for b in self.balls:
                if not b["finished"] and not self.winner:
                    y = b["body"].position.y
                    x = b["body"].position.x
                    if y > fl["y"] and fl["x1"] < x < fl["x2"]:
                        self.winner = b["name"]
                        b["finished"] = True
                        self.freeze_frames = FPS * 5
                        self.stop_recording()
        else:
            self.freeze_frames -= 1
            if self.freeze_frames <= 0:
                self.state = STATE_MENU
                return

        # Camera tracking
        if not self.winner:
            leading_y = max(b["body"].position.y for b in self.balls)
            target_cy = leading_y - WINDOW_HEIGHT * 0.6
            target_cy = max(-150, min(target_cy, self.track_data["total_height"] - WINDOW_HEIGHT))
            self.camera_y += (target_cy - self.camera_y) * 0.12

        self.draw_maze()

        if self.winner:
            overlay = pygame.Surface((WINDOW_WIDTH, 120), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 170))
            self.screen.blit(overlay, (0, WINDOW_HEIGHT//2 - 60))
            w = self.big_font.render(f"{self.winner} WINS!", True, FINISH_COL)
            self.screen.blit(w, w.get_rect(center=(WINDOW_WIDTH//2, WINDOW_HEIGHT//2)))

        # BACK button removed for clean recordings


    # ─── Draw ─────────────────────────────────────────────────────────────────

    def draw_maze(self):
        cy = self.camera_y

        for item in self.track_data["obstacles"]:
            obs  = item["shape"]
            kind = item["kind"]

            if isinstance(obs, pymunk.Segment):
                p1w = obs.body.local_to_world(obs.a)
                p2w = obs.body.local_to_world(obs.b)
                p1  = (int(p1w.x), int(p1w.y - cy))
                p2  = (int(p2w.x), int(p2w.y - cy))
                # Cull off-screen
                if p1[1] < -60 and p2[1] < -60:   continue
                if p1[1] > WINDOW_HEIGHT+60 and p2[1] > WINDOW_HEIGHT+60: continue
                r = max(1, int(obs.radius * 2))
                pygame.draw.line(self.screen, OBSTACLE, p1, p2, r)
                pygame.draw.circle(self.screen, OBSTACLE, p1, max(1, int(obs.radius)))
                pygame.draw.circle(self.screen, OBSTACLE, p2, max(1, int(obs.radius)))

            elif isinstance(obs, pymunk.Poly):
                pts = []
                min_y = float('inf')
                max_y = float('-inf')
                for v in obs.get_vertices():
                    vw = obs.body.local_to_world(v)
                    sy = int(vw.y - cy)
                    pts.append((int(vw.x), sy))
                    if sy < min_y: min_y = sy
                    if sy > max_y: max_y = sy
                if max_y < -60 or min_y > WINDOW_HEIGHT+60: continue
                if len(pts) < 3: continue
                col = BOWL_COL if kind == "bowl" else OBSTACLE
                pygame.draw.polygon(self.screen, col, pts)

            elif isinstance(obs, pymunk.Circle):
                pw  = obs.body.local_to_world(obs.offset)
                pos = (int(pw.x), int(pw.y - cy))
                r   = int(obs.radius)
                if pos[1] < -r-5 or pos[1] > WINDOW_HEIGHT+r+5: continue

                if kind == "bumper":
                    pygame.draw.circle(self.screen, BUMPER_RIM, pos, r + 4)
                    pygame.draw.circle(self.screen, BUMPER_COL, pos, r)
                    pygame.draw.circle(self.screen, (255,255,200), (pos[0]-r//4, pos[1]-r//4), max(2, r//3))
                else:
                    pygame.draw.circle(self.screen, OBSTACLE, pos, r)
                    pygame.draw.circle(self.screen, WHITE, pos, r, 1)

        # Balls
        for b in self.balls:
            pos = (int(b["body"].position.x), int(b["body"].position.y - cy))
            r   = BALL_RADIUS
            col = b["color"]
            # shadow
            pygame.draw.circle(self.screen, (20,20,25), (pos[0]+2, pos[1]+3), r)
            # body
            pygame.draw.circle(self.screen, tuple(max(0,c-70) for c in col), pos, r)
            pygame.draw.circle(self.screen, col, pos, r-3)
            # highlight
            pygame.draw.circle(self.screen, tuple(min(255,c+110) for c in col),
                                (pos[0]-r//3, pos[1]-r//3), r//4)
            # rim
            pygame.draw.circle(self.screen, WHITE, pos, r, 2)
            # label
            ns = self.small_font.render(b["name"], True, WHITE)
            self.screen.blit(ns, ns.get_rect(center=(pos[0], pos[1]-r-10)))

        # Finish line
        fl  = self.track_data["finish_line"]
        fy  = int(fl["y"] - cy)
        fx1 = int(fl["x1"])
        fx2 = int(fl["x2"])
        cw  = 20
        for i in range((fx2-fx1)//cw + 1):
            x0 = fx1 + i*cw
            x1 = min(x0+cw, fx2)
            c  = FINISH_COL if i%2==0 else WHITE
            pygame.draw.rect(self.screen, c, (x0, fy-10, x1-x0, 10))
        pygame.draw.line(self.screen, FINISH_COL, (fx1, fy), (fx2, fy), 3)
        ft = self.small_font.render("FINISH", True, FINISH_COL)
        self.screen.blit(ft, ft.get_rect(center=(WINDOW_WIDTH//2, fy-24)))

        # REC indicator hidden for clean recordings



if __name__ == "__main__":
    app = App()
    app.run()
