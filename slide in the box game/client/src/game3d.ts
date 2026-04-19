/* ================================================================
   Game3D (2D renderer) – smooth canvas board for web-first launch

   Coordinate system note:
   - Server uses XZ as the 2D plane (Y is always 0, locked by Rapier).
   - Canvas uses screen X/Y. We map: world X → screen X, world Z → screen Y.
   - PLAYER_RADIUS (18) is the visual disc size; physics hitbox is 24 (on server).
   ================================================================ */

/**
 * Minimal per-player data the renderer needs each sync tick.
 * `pendingMove` is only non-null during the REVEAL phase (server hides it beforehand).
 */
type PlayerState = {
  color: string;
  isAlive: boolean;
  pendingMove?: { dx: number; dz: number; power: number } | null;
};

export class Game3D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private _myId = '';           // our own socket ID — used for "Me" highlight ring
  private _aimingEnabled = false; // only true during PLANNING when it's our turn to aim
  private _aimDir = { x: 0, z: 0 }; // normalized aiming direction (world coords)
  private _aimPower = 0;        // [0,1] shot power set by drag distance

  // Camera mode cycles: ARENA (normal), TACTICAL (zoomed out), FOCUS (zoomed in)
  private currentMode: 'ARENA' | 'TACTICAL' | 'FOCUS' = 'ARENA';

  // renderSmooth: lerp factor during non-ACTION phases (lower = smoother but laggier).
  // 0.45 is a good balance — discs look like they're gliding, not teleporting.
  private renderSmooth = 0.45;

  private dangerVisible = true; // whether to paint the danger/shrink zone ring
  private shakeUntil = 0;       // performance.now() timestamp: camera shake active until here
  private shakeStrength = 0;    // pixel magnitude of camera shake offset

  // ── State mirrored from server sync packets ─────────────────────────────────
  private status = 'LOBBY';
  private platformSize = 100;     // current platform diameter (world units)
  private basePlatformSize = 100; // maximum platform size ever seen — used for stable zoom
  private phaseRemainingMs = 0;   // ms left in current phase (drives danger zone pulsing)
  private players: Record<string, PlayerState> = {};
  private powerups: Array<{ id: string; type: string; x: number; z: number }> = [];

  /**
   * targets: latest XZ positions received from the server (raw, unsmoothed).
   * rendered: current visually interpolated XZ positions displayed on canvas.
   *
   * Each frame we lerp rendered → targets. This decouples the 60 Hz server tick
   * from whatever FPS the browser is running at, keeping motion smooth.
   */
  private targets  = new Map<string, { x: number; z: number }>();
  private rendered = new Map<string, { x: number; z: number }>();

  // Arrow data for all players during REVEAL phase
  private revealArrows = new Map<string, { dx: number; dz: number; power: number; color: string }>();

  // Stores the world position of our disc at the moment we started dragging.
  // Used to anchor the aiming arrow correctly even as the disc renders with lerp lag.
  private myAimOrigin: { x: number; z: number } | null = null;

  // Simple particle system for disc elimination burst effects
  private particles: Array<{ x: number; z: number; vx: number; vz: number; life: number; color: string }> = [];

  // Mirror of server shrinkFactor — needed to compute where the danger zone ring goes
  private shrinkFactor = 0.97;

  /** Called by the UI layer when a player commits their aiming drag. */
  public onMoveSet: ((dx: number, dz: number, power: number) => void) | null = null;

  private pointerDownHandler = (e: PointerEvent) => this.onPointerDown(e);
  private pointerMoveHandler = (e: PointerEvent) => this.onPointerMove(e);
  private pointerUpHandler   = (e: PointerEvent) => this.onPointerUp(e);
  private blockContextHandler = (e: Event) => e.preventDefault();
  private resizeHandler = () => this.resize();
  private rafId: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    // Canvas fills the entire viewport — sits behind all HTML UI overlays (z-index 0)
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100vw;height:100vh;z-index:0;';

    // Suppress default browser touch pan/zoom so pointer events reach our drag handler
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('contextmenu', this.blockContextHandler);

    this.setupPointerEvents();
    this.resize();
    window.addEventListener('resize', this.resizeHandler);

    // Kick off the RAF render loop — runs at display refresh rate (typically 60/120 Hz)
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  public dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resizeHandler);
    this.canvas.removeEventListener('contextmenu', this.blockContextHandler);
    this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
    this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
    this.canvas.removeEventListener('pointerup', this.pointerUpHandler);
    this.canvas.removeEventListener('pointercancel', this.pointerUpHandler);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ── Public API for UI layer ─────────────────────────────────────────────────
  setMyId(id: string) { this._myId = id; }
  enableAiming(enable: boolean) { this._aimingEnabled = enable; if (!enable) this._aimPower = 0; }
  setDangerZoneVisible(visible: boolean) { this.dangerVisible = visible; }

  /**
   * Maps a UI "camera speed" slider (1–15) to a lerp factor.
   * Lower speed → smaller lerp → smoother but more latent visual tracking.
   */
  setCameraSpeed(speed: number) { this.renderSmooth = Math.max(0.25, Math.min(0.6, speed / 15)); }

  /** Triggers a screen shake effect for hits/eliminations (strength 1–5 recommended). */
  triggerCameraShake(strength = 1, durationMs = 250) {
    this.shakeStrength = strength;
    this.shakeUntil = performance.now() + durationMs;
  }

  /** Cycles through ARENA → TACTICAL → FOCUS camera zoom levels. */
  cycleCameraMode(): string {
    const modes: Array<'ARENA' | 'TACTICAL' | 'FOCUS'> = ['ARENA', 'TACTICAL', 'FOCUS'];
    this.currentMode = modes[(modes.indexOf(this.currentMode) + 1) % modes.length];
    return this.currentMode;
  }

  /**
   * Called every server sync tick (~60 Hz via socket.io).
   * Updates all interpolation targets and builds the reveal-arrow map.
   *
   * Critical: we never directly set rendered positions here.
   * Positions flow: server → targets → (lerp each frame) → rendered → canvas.
   * This keeps animation smooth regardless of socket jitter.
   */
  sync(stateData: {
    state: { status: string; platform: { w: number }; phaseEndsAt?: number; now?: number };
    players: Record<string, PlayerState>;
    bodies: { id: string; x: number; z: number }[];
    powerups?: Array<{ id: string; type: string; x: number; z: number }>;
    config?: { shrinkFactor?: number };
  }) {
    this.status = stateData.state.status;
    this.platformSize = stateData.state.platform.w;

    // basePlatformSize never shrinks — keeps the zoom level stable across rounds.
    // If we zoomed in as the platform shrinks, discs would look jittery near edges.
    this.basePlatformSize = Math.max(this.basePlatformSize, stateData.state.platform.w);

    // phaseRemainingMs is used to decide when to switch the danger zone to urgent-red pulsing
    this.phaseRemainingMs = Math.max(0, (stateData.state.phaseEndsAt || 0) - (stateData.state.now || 0));

    this.players = stateData.players || {};
    this.powerups = stateData.powerups || [];
    if (stateData.config?.shrinkFactor) this.shrinkFactor = stateData.config.shrinkFactor;

    // Rebuild reveal arrows fresh each tick (only populated during REVEAL phase by server)
    this.revealArrows.clear();

    // Update interpolation targets for every live body
    for (const b of stateData.bodies || []) this.targets.set(b.id, { x: b.x, z: b.z });

    // Detect eliminated discs: bodies no longer present in the sync packet.
    // Burst their last known rendered position with particles, then remove from maps.
    const active = new Set((stateData.bodies || []).map(b => b.id));
    for (const [id, r] of this.rendered.entries()) {
      if (!active.has(id)) {
        this.spawnParticles(r.x, r.z, this.players[id]?.color || '#ff3366');
        this.rendered.delete(id);
        this.targets.delete(id);
      }
    }

    // Build reveal arrows from pending moves (server only sends them during REVEAL)
    if (this.status === 'REVEAL') {
      for (const [pid, p] of Object.entries(this.players)) {
        if (p.pendingMove && p.isAlive && p.pendingMove.power > 0) {
          this.revealArrows.set(pid, { ...p.pendingMove, color: p.color });
        }
      }
    }
  }

  /** Called on window resize — keeps canvas pixel dimensions in sync with viewport. */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /* ── Pointer / touch aiming ────────────────────────────────────────────── */
  /**
   * Drag mechanic: player drags away from their disc to aim.
   *  - Drag direction is REVERSED (pull back → launch forward, like a slingshot).
   *  - maxDrag (110px) defines 100% power. Dragging further doesn't increase power.
   *  - Power < 0.03 is treated as a cancelled/accidental move.
   *  - Touch and mouse both use the Pointer Events API (unified).
   */
  private _dragging = false;
  private _startX = 0;
  private _startY = 0;

  private onPointerDown(e: PointerEvent) {
    if (!this._aimingEnabled) return;
    this._dragging = true;
    this._startX = e.clientX;
    this._startY = e.clientY;

    // setPointerCapture ensures move/up events fire even if pointer leaves canvas
    this.canvas.setPointerCapture(e.pointerId);

    // Capture our disc's current rendered position as the arrow origin.
    // We snapshot this at mousedown because the disc may still be lerping
    // (e.g. if the player grabbed immediately after last round ended).
    const myPos = this.rendered.get(this._myId);
    if (myPos) this.myAimOrigin = { x: myPos.x, z: myPos.z };
  }

  private onPointerMove(e: PointerEvent) {
    if (!this._dragging) return;
    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;
    const rawDist = Math.sqrt(dx * dx + dy * dy);

    // Dead zone: ignore tiny accidental movements (<5px)
    const maxDrag = 110; // screen pixels for maximum power shot
    const dist = Math.min(rawDist, maxDrag);
    if (rawDist < 5) {
      this._aimPower = 0;
      return;
    }

    // Negate direction: drag LEFT → disc fires RIGHT (slingshot metaphor)
    this._aimDir = { x: -dx / rawDist, z: -dy / rawDist };
    this._aimPower = dist / maxDrag; // [0,1] clamped by min(rawDist, maxDrag)
  }

  private onPointerUp(e: PointerEvent) {
    if (!this._dragging) return;
    this._dragging = false;

    // Only emit if drag was meaningful (> 3% power threshold)
    if (this._aimPower > 0.03 && this.onMoveSet) {
      this.onMoveSet(this._aimDir.x, this._aimDir.z, this._aimPower);
    }
  }

  private setupPointerEvents() {
    this.canvas.addEventListener('pointerdown',   this.pointerDownHandler);
    this.canvas.addEventListener('pointermove',   this.pointerMoveHandler);
    this.canvas.addEventListener('pointerup',     this.pointerUpHandler);
    this.canvas.addEventListener('pointercancel', this.pointerUpHandler);
  }

  /* ── World ↔ Screen coordinate conversion ─────────────────────────────── */
  /**
   * Computes how many screen pixels equal one world unit.
   * basePlatformSize never shrinks, so the zoom stays constant as the board shrinks.
   * The board radius maps to 37% of the shorter screen dimension — leaves room for UI.
   */
  private worldScale() {
    const shortest = Math.min(window.innerWidth, window.innerHeight);
    const visualRadius = shortest * 0.37; // 37% of min(W,H) = platform edge screen radius
    return visualRadius / Math.max(10, this.basePlatformSize / 2);
  }

  /**
   * World (XZ) → screen (XY).
   * Board center (0,0) maps to slightly above vertical center (0.54 instead of 0.5)
   * to leave room for the status bar at the top.
   */
  private worldToScreen(x: number, z: number) {
    const s = this.worldScale();
    return { x: window.innerWidth * 0.5 + x * s, y: window.innerHeight * 0.54 + z * s };
  }



  /* ── Particle system ─────────────────────────────────────────────────────── */
  /**
   * Spawns a burst of 18 particles at the given world position.
   * Particles drift outward with random speed and fade over ~33 frames.
   * Called when a disc is eliminated (detected in sync() via missing body ID).
   */
  private spawnParticles(x: number, z: number, color: string) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({ x, z, vx: Math.cos(a) * speed, vz: Math.sin(a) * speed, life: 1, color });
    }
  }

  /* ── Arrow drawing ────────────────────────────────────────────────────────── */
  /**
   * Draws a direction arrow starting at `origin` screen position.
   * Arrow length scales with power (36px at zero → 131px at max).
   * Used for both the player's live aiming arrow and the REVEAL phase arrows.
   */
  private drawArrow(origin: { x: number; y: number }, dx: number, dz: number, power: number, color: string) {
    const len = 36 + power * 95;
    const ang = Math.atan2(dz, dx); // angle in screen space (dz maps to screen Y)
    const tx = origin.x + Math.cos(ang) * len;
    const ty = origin.y + Math.sin(ang) * len;

    // Shaft
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(origin.x, origin.y);
    this.ctx.lineTo(tx, ty);
    this.ctx.stroke();

    // Arrowhead (two lines at ±0.45 radians from main direction)
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(tx, ty);
    this.ctx.lineTo(tx - Math.cos(ang - 0.45) * 12, ty - Math.sin(ang - 0.45) * 12);
    this.ctx.lineTo(tx - Math.cos(ang + 0.45) * 12, ty - Math.sin(ang + 0.45) * 12);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /* ── Main render loop (requestAnimationFrame) ─────────────────────────── */
  /**
   * Runs at display refresh rate (60/120 Hz).
   * Order of drawing layers (back to front):
   *   1. Background gradient
   *   2. Board shadow + fill
   *   3. Decorative rings
   *   4. Danger zone (PLANNING only)
   *   5. Powerup stars
   *   6. Lerp interpolation step (advance rendered → targets)
   *   7. REVEAL arrows
   *   8. Player aiming arrow
   *   9. Discs (shadow + body + highlight)
   *  10. Particles
   *
   * Camera shake is applied as a canvas translate so ALL layers shake together.
   */
  private loop() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const now = performance.now();

    // ── Camera shake offset ───────────────────────────────────────────────────
    // Shake decays automatically — just stops after shakeUntil ms.
    const shake = now < this.shakeUntil ? this.shakeStrength : 0;
    const ox = shake ? (Math.random() - 0.5) * shake * 8 : 0;
    const oy = shake ? (Math.random() - 0.5) * shake * 5 : 0;
    this.ctx.save();
    this.ctx.translate(ox, oy);

    // ── Background gradient ────────────────────────────────────────────────────
    const bg = this.ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
    bg.addColorStop(0, '#6ee7ff');
    bg.addColorStop(0.5, '#9fe8ff');
    bg.addColorStop(1, '#ffd1ea');
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const boardCenter = this.worldToScreen(0, 0);
    const scale = this.worldScale();
    const boardR = (this.platformSize / 2) * scale; // current platform edge in screen pixels

    // ── Board shadow + fill ────────────────────────────────────────────────────
    // Outer shadow ring (slightly larger circle in a lighter cream color)
    this.ctx.fillStyle = '#fff9ef';
    this.ctx.beginPath();
    this.ctx.arc(boardCenter.x, boardCenter.y, boardR + 20, 0, Math.PI * 2);
    this.ctx.fill();
    // Main board surface
    this.ctx.fillStyle = '#fff4dd';
    this.ctx.beginPath();
    this.ctx.arc(boardCenter.x, boardCenter.y, boardR, 0, Math.PI * 2);
    this.ctx.fill();

    // ── Decorative concentric rings ────────────────────────────────────────────
    // Draw rings relative to basePlatformSize, NOT current boardR. This ensures
    // the rings stay physically locked in place as the board shrinks, instead of
    // scaling down. We use clip() to ensure these fixed rings never draw outside
    // the current falling edge.
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(boardCenter.x, boardCenter.y, boardR, 0, Math.PI * 2);
    this.ctx.clip();

    const baseR = (this.basePlatformSize / 2) * scale;
    for (const r of [0.2, 0.4, 0.6, 0.8]) {
      this.ctx.strokeStyle = 'rgba(179,144,98,0.35)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(boardCenter.x, boardCenter.y, baseR * r, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // ── Danger zone (PLANNING phase only) ─────────────────────────────────────
    // Shows the area between the current platform edge and where it will shrink to next round.
    // This is in sync with the server's _updatePlatform() → platformSize × shrinkFactor.
    // Uses a donut (arc + reverse arc) fill technique to paint only the shrink band.
    if (this.dangerVisible && this.status === 'PLANNING') {
      // next platform size = current × shrinkFactor (same formula as server _endRound)
      const nextPlatformSize = this.platformSize * this.shrinkFactor;
      const nextR = (nextPlatformSize / 2) * scale; // inner edge of danger zone (screen px)

      // Pulse speed increases when < 10s remain in planning — creates urgency signal
      const lateWarning = this.phaseRemainingMs <= 10000;
      const pulse = lateWarning
        ? (0.15 + 0.25 * (0.5 + 0.5 * Math.sin(now * 0.012))) // fast pulse
        : 0.10;                                                   // static low opacity

      // Even-odd fill rule via two arcs: outer (clockwise) then inner (counter-clockwise)
      this.ctx.fillStyle = lateWarning ? `rgba(255,42,72,${pulse})` : `rgba(255,130,90,${pulse})`;
      this.ctx.beginPath();
      this.ctx.arc(boardCenter.x, boardCenter.y, boardR,  0, Math.PI * 2);        // outer edge (cw)
      this.ctx.arc(boardCenter.x, boardCenter.y, nextR,   0, Math.PI * 2, true);  // inner edge (ccw)
      this.ctx.fill();

      // Dashed stroke at exactly nextR — shows where the platform boundary will be
      this.ctx.strokeStyle = lateWarning
        ? `rgba(255,42,72,${0.4 + pulse})`
        : `rgba(255,130,90,${0.3 + pulse})`;
      this.ctx.lineWidth = lateWarning ? 4 : 2;
      this.ctx.setLineDash([8, 6]);
      this.ctx.beginPath();
      this.ctx.arc(boardCenter.x, boardCenter.y, nextR, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // reset dash so subsequent strokes are solid
    }

    // ── Powerup stars ──────────────────────────────────────────────────────────
    // Rotating 5-pointed star for each active powerup on the board.
    // Color encodes powerup type so players can identify them at a glance.
    for (const pu of this.powerups) {
      const p = this.worldToScreen(pu.x, pu.z);
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      const phase = now * 0.004; // slow rotation (~0.23 rev/s)
      this.ctx.rotate(phase);
      const typeColors: Record<string, string> = {
        boost: '#ff7a00', shield: '#00d084', chaos: '#9b5cff',
        freeze: '#4ecbff', swap: '#ff4ecb', gravity: '#5661ff', heavy: '#ffcc33',
      };
      this.ctx.fillStyle = typeColors[pu.type] || '#ffffff';
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      // Draw a 5-pointed star using alternating outer (r1) and inner (r2) radii
      this.ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2; // outer point angle
        const b = a + Math.PI / 5;                       // inner point angle
        this.ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); // outer tip
        this.ctx.lineTo(Math.cos(b) *  6, Math.sin(b) *  6); // inner notch
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }

    // ── Interpolation: advance rendered positions toward server targets ─────────
    // lerpFactor during ACTION = 0.6 (snappy — tracks rapid physics updates closely).
    // lerpFactor otherwise = renderSmooth (default 0.45 — gentle glide between ticks).
    //
    // Higher = more "sticky" to server position (less visual lag, but can look choppy).
    // Lower  = smoother animation but disc renders slightly behind server position.
    //
    // 0.6 during ACTION is critical: if too low, discs visually phase through each
    // other because the rendered positions lag too far behind the corrected physics.
    const lerpFactor = this.status === 'ACTION' ? 0.6 : this.renderSmooth;
    for (const [id, target] of this.targets.entries()) {
      const curr = this.rendered.get(id) || { x: target.x, z: target.z }; // cold start: snap to target
      curr.x += (target.x - curr.x) * lerpFactor;
      curr.z += (target.z - curr.z) * lerpFactor;
      this.rendered.set(id, curr);
    }

    // ── Disc visual radius ─────────────────────────────────────────────────────
    // 18 matches PLAYER_RADIUS on the server (visual only — physics hitbox is 22).
    // Scaled by worldScale() so discs resize correctly with the viewport.
    // Floor at 8px so they're never invisible on tiny screens.
    const PHYSICS_RADIUS = 36; // keep in sync with server PLAYER_RADIUS constant
    const discR = Math.max(8, PHYSICS_RADIUS * scale);

    // ── REVEAL phase: draw all players' locked-in move arrows ─────────────────
    if (this.status === 'REVEAL') {
      for (const [pid, m] of this.revealArrows.entries()) {
        const pos = this.rendered.get(pid);
        if (!pos) continue;
        const p = this.worldToScreen(pos.x, pos.z);
        this.drawArrow(p, m.dx, m.dz, m.power, m.color);
      }
    }

    // ── PLANNING: draw the local player's live aiming arrow ───────────────────
    // myAimOrigin is snapshotted at pointer-down so the arrow stays stable even
    // if the disc is still lerping toward its resting position.
    if (this._aimingEnabled && this._aimPower > 0.03 && this.myAimOrigin) {
      const p = this.worldToScreen(this.myAimOrigin.x, this.myAimOrigin.z);
      this.drawArrow(p, this._aimDir.x, this._aimDir.z, this._aimPower, '#ffd700');
    }

    // ── Discs ─────────────────────────────────────────────────────────────────
    // Drawn in rendered-position order (no z-sorting needed — all discs are at Y=0).
    // Layer stack per disc: drop shadow → filled circle → white border → gold ring (self only)
    for (const [id, pos] of this.rendered.entries()) {
      const pl = this.players[id];
      if (!pl) continue;
      const p = this.worldToScreen(pos.x, pos.z);

      // Drop shadow (slightly larger dark circle offset by 2px)
      this.ctx.shadowBlur = 16;
      this.ctx.shadowColor = 'rgba(0,0,0,0.28)';
      this.ctx.fillStyle = '#2d2d2d';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y + 2, discR + 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // reset shadow so it doesn't bleed onto disc body

      // Disc body (player color)
      this.ctx.fillStyle = pl.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, discR, 0, Math.PI * 2);
      this.ctx.fill();

      // White border ring
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // ── Particles ─────────────────────────────────────────────────────────────
    // Each particle drifts outward, fading over ~33 frames (life decrements by 0.03/frame).
    // Drawn last so they appear on TOP of discs for a dramatic burst effect.
    for (const pt of this.particles) {
      pt.x  += pt.vx * 0.05; // world-space movement (0.05 scales vel to look natural)
      pt.z  += pt.vz * 0.05;
      pt.life -= 0.03;        // 0.03/frame → 33 frames ~= 0.5s at 60fps
      const p = this.worldToScreen(pt.x, pt.z);
      this.ctx.fillStyle = pt.color;
      this.ctx.globalAlpha = Math.max(0, pt.life); // fade out as life → 0
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1; // always reset alpha so subsequent draws aren't affected
    }
    // Remove particles that have fully faded (life ≤ 0)
    this.particles = this.particles.filter(p => p.life > 0);

    this.ctx.restore(); // undo the camera shake translate
    this.rafId = requestAnimationFrame(() => this.loop()); // schedule next frame
  }
}
