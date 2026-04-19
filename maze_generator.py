import pymunk
import random
import math

def generate_maze(space, width, total_height, seed=None, ball_radius=30):
    if seed is not None:
        random.seed(seed)

    obstacle_shapes = []   # list of dicts: { "shape": ..., "kind": "normal"|"bumper"|"bowl" }
    gates = []

    def _add(shape, kind="normal"):
        obstacle_shapes.append({"shape": shape, "kind": kind})

    def add_static_segment(p1, p2, thickness=10, elasticity=0.8, friction=0.05, kind="normal"):
        seg = pymunk.Segment(space.static_body, p1, p2, thickness)
        seg.elasticity = elasticity
        seg.friction = friction
        space.add(seg)
        _add(seg, kind)
        return seg

    def add_static_circle(pos, radius=15, elasticity=0.8, friction=0.05, kind="normal"):
        circle = pymunk.Circle(space.static_body, radius, pos)
        circle.elasticity = elasticity
        circle.friction = friction
        space.add(circle)
        _add(circle, kind)

    def add_static_poly(vertices, elasticity=0.7, friction=0.15, kind="normal"):
        """
        High elasticity + low friction = crisp reflective bounce on curve walls.
        """
        poly = pymunk.Poly(space.static_body, vertices)
        poly.elasticity = elasticity
        poly.friction   = friction
        space.add(poly)
        _add(poly, kind)

    def add_gate(y_pos):
        gate_seg = add_static_segment((0, y_pos), (width, y_pos), thickness=30, elasticity=0.2)
        gates.append({"shape": gate_seg["shape"] if isinstance(gate_seg, dict) else gate_seg,
                      "y": y_pos, "opened": False})
        return y_pos + 100

    y = 500

    # --- STARTING TUBE ---
    add_static_segment((width/2 - 100, 0), (width/2 - 100, y))
    add_static_segment((width/2 + 100, 0), (width/2 + 100, y))

    # ── EVENT BUILDERS ─────────────────────────────────────────────────────────

    def build_plinko(current_y):
        current_y += 200
        rows = random.randint(10, 15)
        plinko_spacing = ball_radius * 2 + 50
        for r in range(rows):
            offset = (r % 2) * (plinko_spacing / 2)
            for c in range(int(width / plinko_spacing) + 1):
                x = c * plinko_spacing + offset
                if 50 < x < width - 50:
                    add_static_circle((x, current_y), radius=10, elasticity=0.5, kind="normal")
            current_y += 80
        return current_y + 100

    def build_zigzags(current_y):
        num_shelves = random.randint(3, 5)
        for i in range(num_shelves):
            if i % 2 == 0:
                # Shelf from left wall (extends past screen to prevent corner slip)
                add_static_segment((-50, current_y - 20), (width * 0.70, current_y + 220), thickness=22)
            else:
                # Shelf from right wall
                add_static_segment((width + 50, current_y - 20), (width * 0.30, current_y + 220), thickness=22)
            current_y += 300
        return current_y + 200

    def build_funnels_and_spinners(current_y):
        """Wide-gap funnels with peg scatter below — spinners removed (they block flow)."""
        for _ in range(2):
            current_y += 80
            # Gap = 5× ball diameter → even a cluster of balls flows through freely
            half_gap = ball_radius * 5
            # Funnel opening centred at a random x, but always wide
    def build_funnels_and_spinners(current_y):
        """Wide-gap funnels with peg scatter below — spinners removed (they block flow)."""
        for _ in range(2):
            current_y += 80
            half_gap = ball_radius * 5
            cx = random.randint(int(width * 0.35), int(width * 0.65))
            
            # Wings extend past screen bounds to prevent edge gaps
            add_static_segment((-50, current_y - 20), (cx - half_gap, current_y + 200), thickness=22)
            add_static_segment((width + 50, current_y - 20), (cx + half_gap, current_y + 200), thickness=22)
            current_y += 200

            # Vertical guides removed to eliminate wedge traps with pegs
            current_y += 50

            # 3 rows of pegs below the funnel — spread across full width
            peg_r = ball_radius * 0.7
            for row in range(3):
                offset = (row % 2) * (ball_radius * 3)
                num_pegs = int(width / (ball_radius * 5))
                for col in range(num_pegs):
                    px = offset + col * (ball_radius * 5) + ball_radius * 2
                    if ball_radius * 2 < px < width - ball_radius * 2:
                        add_static_circle((px, current_y), radius=int(peg_r),
                                          elasticity=0.55, friction=0.3, kind="normal")
                current_y += int(ball_radius * 5)

            current_y += 200
        return current_y


    def build_bowls(current_y):
        num_bowls = random.randint(3, 5)
        for _ in range(num_bowls):
            current_y += 100
            cx = random.randint(int(width * 0.35), int(width * 0.65))
            r = width * 0.45          # fits within screen
            cy = current_y
            min_hole_radius = ball_radius * 2 + 10
            gap_theta = math.asin(min_hole_radius / r)
            steps = 40
            thickness = int(width * 0.02) + 5

            for side in [0, 1]:   # 0 = left arc, 1 = right arc
                for i in range(steps):
                    if side == 0:
                        theta1 = math.pi - i * (math.pi/2 - gap_theta) / steps
                        theta2 = math.pi - (i+1) * (math.pi/2 - gap_theta) / steps
                    else:
                        theta1 = i * (math.pi/2 - gap_theta) / steps
                        theta2 = (i+1) * (math.pi/2 - gap_theta) / steps

                    p1_in  = (cx + r * math.cos(theta1),            cy + r * math.sin(theta1))
                    p2_in  = (cx + r * math.cos(theta2),            cy + r * math.sin(theta2))
                    p1_out = (cx + (r+thickness) * math.cos(theta1), cy + (r+thickness) * math.sin(theta1))
                    p2_out = (cx + (r+thickness) * math.cos(theta2), cy + (r+thickness) * math.sin(theta2))

                    # Wind CCW for pymunk convex check
                    add_static_poly([p1_in, p2_in, p2_out, p1_out],
                                    elasticity=0.72, friction=0.12, kind="bowl")

            current_y += r + 50
        return current_y + 400

    def build_pinball_bumpers(current_y):
        current_y += 200

        # Always use dice-5: 4 corners + 1 center — center bumper blocks the middle gap
        pattern = [(0, 0), (1, 0), (0.5, 0.5), (0, 1), (1, 1)]

        radius = int(width / 9)
        padding = radius + 30

        area_w = width - 2 * padding
        area_h = int(radius * 5)

        placed = []
        for (col_t, row_t) in pattern:
            cx = int(padding + col_t * area_w)
            cy = int(current_y + padding // 2 + row_t * area_h)

            overlaps = any(
                math.hypot(cx - px, cy - py) < 2 * radius + 10
                for (px, py) in placed
            )
            if not overlaps:
                add_static_circle((cx, cy), radius=radius,
                                  elasticity=1.8, friction=0.1, kind="bumper")
                placed.append((cx, cy))

        section_height = area_h + radius * 2 + 200
        return current_y + section_height

    def build_stairs(current_y):
        num_flights = random.randint(2, 4)
        for i in range(num_flights):
            current_y += 100
            steps = 5
            step_w = (width * 0.7) / steps
            step_h = 60
            
            # Start slightly off-screen to close gaps
            start_x = -50 if i % 2 == 0 else width + 50
            dir_x = 1 if i % 2 == 0 else -1
            
            for s in range(steps):
                x1 = start_x + dir_x * s * step_w
                y1 = current_y + s * step_h
                # If it's the very first point of the stair, shift y upward so the corner is sealed
                if s == 0: y1 -= 20
                
                x2 = start_x + dir_x * (s + 1) * step_w
                y2 = current_y + s * step_h + 25
                add_static_segment((x1, y1), (x2, y2), thickness=15, elasticity=0.5, friction=0.2)
                add_static_segment((x2, y2), (x2, y2 + step_h - 25), thickness=15)
                
            current_y += steps * step_h + 150
        return current_y + 100

    def build_diamonds(current_y):
        current_y += 150
        num_rows = random.randint(3, 5)
        for r in range(num_rows):
            num_diamonds = 3 if r % 2 == 0 else 2
            spacing = width / (num_diamonds + 1)
            for i in range(num_diamonds):
                cx = spacing * (i + 1)
                cy = current_y
                # Make them scale slightly with width
                dw, dh = width * 0.08, width * 0.12
                # Winding CCW: top, left, bottom, right
                add_static_poly([
                    (cx, cy - dh), (cx - dw, cy), (cx, cy + dh), (cx + dw, cy)
                ], elasticity=0.6, friction=0.1, kind="normal")
            current_y += int(width * 0.35)
        return current_y + 100

    # ── SHUFFLE & BUILD ────────────────────────────────────────────────────────
    event_factories = [
        build_plinko, build_zigzags, build_funnels_and_spinners,
        build_bowls, build_pinball_bumpers, build_stairs, build_diamonds
    ]
    events = []
    for _ in range(2):
        block = list(event_factories)
        random.shuffle(block)
        events.extend(block)

    for fn in events:
        y = fn(y)

    y += 500

    # --- FINISH LINE (funnel) ---
    finish_y = y
    add_static_segment((0, finish_y - 300), (width/2 - 150, finish_y), thickness=30)
    add_static_segment((width, finish_y - 300), (width/2 + 150, finish_y), thickness=30)

    finish_bucket = {"x1": width/2 - 150, "x2": width/2 + 150, "y": finish_y}

    add_static_segment((width/2 - 150, finish_y), (width/2 - 150, finish_y + 400), thickness=30)
    add_static_segment((width/2 + 150, finish_y), (width/2 + 150, finish_y + 400), thickness=30)
    add_static_segment((width/2 - 150, finish_y + 400), (width/2 + 150, finish_y + 400), thickness=30)

    total_generated_height = finish_y + 500

    # --- MAIN WALLS (sized to actual track) ---
    for w in [pymunk.Segment(space.static_body, (0, -2000), (0, total_generated_height + 2000), 20),
              pymunk.Segment(space.static_body, (width, -2000), (width, total_generated_height + 2000), 20)]:
        w.elasticity = 0.5
        w.friction = 0.5
        space.add(w)
        _add(w, "normal")

    return {
        "obstacles": obstacle_shapes,   # list of {"shape":…, "kind":…}
        "gates": gates,
        "finish_line": finish_bucket,
        "total_height": total_generated_height,
    }
