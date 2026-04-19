import pygame
import pymunk
import random
import sys
import argparse
from maze_generator import generate_maze

parser = argparse.ArgumentParser()
parser.add_argument('--seed', type=int, default=None)
args = parser.parse_args()

PHYSICS_WIDTH = 1080
PHYSICS_HEIGHT = 1920
RENDER_SCALE = 0.5
WINDOW_WIDTH = int(PHYSICS_WIDTH * RENDER_SCALE)
WINDOW_HEIGHT = int(PHYSICS_HEIGHT * RENDER_SCALE)
FPS = 60

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
COLORS = [(255, 50, 50), (50, 255, 50), (50, 150, 255)]
NAMES = ["Messi", "Ronaldo", "Neymar"]

pygame.init()
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("YouTube Shorts Marble Race")
clock = pygame.time.Clock()

font = pygame.font.SysFont("impact", 48)
big_font = pygame.font.SysFont("impact", 100)

space = pymunk.Space()
space.gravity = (0, 1500)

seed = args.seed if args.seed is not None else random.randint(0, 1000000)
print(f"Generating race with seed: {seed}")

track_data = generate_maze(space, PHYSICS_WIDTH, 40000, seed=seed)
obstacles = track_data["obstacles"]
gates = track_data["gates"]
finish_line = track_data["finish_line"]
TOTAL_MAZE_HEIGHT = track_data["total_height"]

balls = []
for i in range(3):
    mass = 1
    radius = 30
    inertia = pymunk.moment_for_circle(mass, 0, radius, (0, 0))
    body = pymunk.Body(mass, inertia)
    start_x = PHYSICS_WIDTH/2 - 100 + i * 100
    body.position = (start_x, -100 - i * 50) # Drop into the starting tube
    shape = pymunk.Circle(body, radius, (0, 0))
    shape.elasticity = 0.8
    shape.friction = 0.5
    space.add(body, shape)
    balls.append({
        "body": body, 
        "shape": shape, 
        "color": COLORS[i], 
        "name": NAMES[i],
        "finished": False
    })

render_surface = pygame.Surface((PHYSICS_WIDTH, PHYSICS_HEIGHT))
camera_y = -300 # Start near the top
winner = None
freeze_frames = 0

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            
    # Physics only steps if we are not in frozen victory state
    if freeze_frames == 0:
        dt = 1.0 / FPS
        space.step(dt)
        
        # GATE LOGIC
        # If all currently un-finished balls are resting on a gate, open it
        for gate in gates:
            if not gate["opened"]:
                # Check if all balls are near this gate
                all_at_gate = True
                for b in balls:
                    y = b["body"].position.y
                    # If any ball is significantly above the gate, wait
                    if y < gate["y"] - 200:
                        all_at_gate = False
                        break
                
                if all_at_gate:
                    gate["opened"] = True
                    try:
                        space.remove(gate["shape"])
                        obstacles.remove(gate["shape"])
                    except:
                        pass # Exception if already removed
                        
        # FINISH LINE LOGIC
        for b in balls:
            if not b["finished"] and not winner:
                y = b["body"].position.y
                x = b["body"].position.x
                if y > finish_line["y"]:
                    if finish_line["x1"] < x < finish_line["x2"]:
                        winner = b["name"]
                        b["finished"] = True
                        freeze_frames = FPS * 5 # Freeze for 5 seconds

    else:
        freeze_frames -= 1
        if freeze_frames <= 0:
            # Quit after 5 seconds
            running = False
            continue

    # CAMERA logic
    if not winner:
        # Track the leading ball (the one with the largest y)
        leading_y = -2000
        for b in balls:
            if b["body"].position.y > leading_y:
                leading_y = b["body"].position.y
                
        target_camera_y = leading_y - PHYSICS_HEIGHT * 0.6
        if target_camera_y < -300:
            target_camera_y = -300
        if target_camera_y > TOTAL_MAZE_HEIGHT - PHYSICS_HEIGHT:
            target_camera_y = TOTAL_MAZE_HEIGHT - PHYSICS_HEIGHT
            
        camera_y += (target_camera_y - camera_y) * 0.1

    render_surface.fill(BLACK)
    
    # OBSTACLES
    for obs in obstacles:
        if isinstance(obs, pymunk.Segment):
            p1_w = obs.body.local_to_world(obs.a)
            p2_w = obs.body.local_to_world(obs.b)
            p1 = int(p1_w.x), int(p1_w.y - camera_y)
            p2 = int(p2_w.x), int(p2_w.y - camera_y)
            if -100 < p1[1] < PHYSICS_HEIGHT + 100 or -100 < p2[1] < PHYSICS_HEIGHT + 100:
                pygame.draw.line(render_surface, WHITE, p1, p2, int(obs.radius * 2))
        elif isinstance(obs, pymunk.Circle):
            pos_w = obs.body.local_to_world(obs.offset)
            pos = int(pos_w.x), int(pos_w.y - camera_y)
            if -100 < pos[1] < PHYSICS_HEIGHT + 100:
                pygame.draw.circle(render_surface, WHITE, pos, int(obs.radius))
                
    # BALLS AND NAMES
    for b in balls:
        pos = int(b["body"].position.x), int(b["body"].position.y - camera_y)
        pygame.draw.circle(render_surface, b["color"], pos, int(b["shape"].radius))
        pygame.draw.circle(render_surface, WHITE, pos, int(b["shape"].radius), 3)
        
        # Name
        text_surf = font.render(b["name"], True, WHITE)
        text_rect = text_surf.get_rect(center=(pos[0], pos[1] - 50))
        render_surface.blit(text_surf, text_rect)
        
    # DRAW FINISH LINE
    finish_p1 = (int(finish_line["x1"]), int(finish_line["y"] - camera_y))
    finish_p2 = (int(finish_line["x2"]), int(finish_line["y"] - camera_y))
    pygame.draw.line(render_surface, (255, 255, 0), finish_p1, finish_p2, 10)
    
    # Text
    f_text = font.render("FINISH LINE", True, (255, 255, 0))
    f_rect = f_text.get_rect(center=(PHYSICS_WIDTH/2, finish_p1[1] - 30))
    render_surface.blit(f_text, f_rect)

    if winner:
        win_text = big_font.render(f"{winner} WINS!", True, (255, 255, 0))
        w_rect = win_text.get_rect(center=(PHYSICS_WIDTH/2, PHYSICS_HEIGHT/2))
        render_surface.blit(win_text, w_rect)

    scaled = pygame.transform.smoothscale(render_surface, (WINDOW_WIDTH, WINDOW_HEIGHT))
    screen.blit(scaled, (0, 0))
    
    pygame.display.flip()
    clock.tick(FPS)
    
pygame.quit()
sys.exit()
