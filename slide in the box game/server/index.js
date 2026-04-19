const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const RAPIER = require('@dimforge/rapier3d-compat');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ─── Constants ────────────────────────────────────────────────────────────────

// VISUAL radius (world units) — used for rendering on the client side.
// This is what the player sees as the disc size.
const PLAYER_RADIUS = 36;

// PHYSICS hitbox radius — 33% larger than PLAYER_RADIUS.
// By making the physics collider bigger than the visual disc, two discs will
// bounce off each other BEFORE their painted circles ever visually overlap,
// even accounting for interpolation lag between server tick and client render.
const COLLISION_RADIUS = 39; // strict physics margin to prevent visual overlap with PLAYER_RADIUS 36

const INITIAL_PLATFORM = 2400;  // 50% bigger starting platform
const SHRINK_FACTOR = 0.97;  // platform multiplied by this each round (3% shrink)
const MAX_PER_ROOM = 6;     // max players + bots per room
const TICK_MS = 1000 / 60; // server runs at 60 Hz

// ─── Phase durations (ms) ─────────────────────────────────────────────────────
const PLANNING_MS = 7000;  // players drag to aim during this window
const REVEAL_MS = 3000;  // all arrows shown before action starts
const ACTION_MAX_MS = 9000; // hard cap on action phase (forces settle)
const ACTION_MIN_MS = 2200; // minimum time before we allow early settle check
const SETTLE_SPEED = 0.22; // linvel magnitude below which a disc is "settled"
const GAMEOVER_MS = 5000; // show game-over screen for this long before lobby reset

// ─── Powerup config ───────────────────────────────────────────────────────────
const POWERUP_RADIUS = 2.8;
const POWERUP_COUNT = 0;   // 0 = powerups disabled (pure mechanics mode)
const POWERUP_TYPES = ['boost', 'shield', 'chaos', 'freeze', 'swap', 'gravity', 'heavy'];

const MAX_IMPULSE = 40000; // high impulse to overcome the new high friction

// ─── Cosmetics ────────────────────────────────────────────────────────────────
const COLORS = ['#DC143C', '#FFD700', '#228B22', '#1E90FF', '#8B4513', '#9400D3'];
const AVATARS = Array.from({ length: 20 }, (_, i) => String(i + 1));

// Bot names cycle through this list (wraps with modulo)
const BOT_NAMES = ['GlitchBot', 'RoboKing', 'NullPtr', 'ByteBot', 'ZeroBot'];
let botNameIdx = 0;
function nextBotName() { return BOT_NAMES[(botNameIdx++) % BOT_NAMES.length]; }

// Active room registry: code (string) → Room instance
const rooms = new Map();

/**
 * Generates a unique 4-character room code from a safe alphabet
 * (ambiguous characters like O/0 and I/1 are excluded on purpose).
 * Loops until we find a code not already in use.
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
  while (rooms.has(code));
  return code;
}

// ─── Room ─────────────────────────────────────────────────────────────────────
/**
 * Room owns a Rapier physics world, all player/bot state, and the game loop.
 * One Room = one match. Destroyed when all humans disconnect.
 */
class Room {
  constructor(code) {
    this.code = code;
    this.players = {};          // socketId → player object (human only)
    this.bodies = {};          // entityId → Rapier RigidBody
    this.bots = {};          // botId    → bot object
    this.reconnectMap = new Map();   // reconnectToken → current socketId (for tab reload)
    this.pendingMoves = {};          // entityId → { dx, dz, power } submitted during PLANNING
    this.powerups = [];          // active powerup positions
    this.platformSize = INITIAL_PLATFORM;
    this.actionStart = 0;           // timestamp when ACTION phase began (for min-settle delay)

    // Mutable per-room config — overridable via socket 'updateSettings'
    this.config = {
      planningMs: PLANNING_MS,
      maxImpulse: MAX_IMPULSE,
      shrinkFactor: SHRINK_FACTOR,
      botDifficulty: 'medium',     // 'easy' | 'medium' | 'hard' — controls bot power range
      initialPlatform: INITIAL_PLATFORM,
      powerupCount: POWERUP_COUNT,
    };

    // Pause support — only allowed during PLANNING phase (so bots don't cheat)
    this.paused = false;
    this.pausedRemaining = 0;

    // Shared game state broadcast to all clients on every tick
    this.state = {
      status: 'LOBBY',
      round: 0,
      platform: { w: this.platformSize, h: this.platformSize },
      winner: null,
      rankings: [],    // [{ name, color, avatar, isWinner }] — built as players are eliminated
      now: Date.now(),
      phaseEndsAt: 0,
    };
    this.eliminatedIds = new Set(); // prevents duplicate elimination events

    // ── Rapier physics world setup ──────────────────────────────────────────
    // Zero gravity: this is a 2D top-down disc game. Discs slide on a flat plane (Y=0).
    // No need for any gravitational pull — only linear+angular damping slows discs down.
    this.world = new RAPIER.World({ x: 0, y: 0, z: 0 });

    // CRITICAL: We call world.step() 4 times per tick for collision accuracy.
    // Rapier's default timestep is 1/60s, but our game tick is also 1/60s.
    // Without this fix, 4 steps × 1/60s = 4/60s simulated per 1/60s real time = 4× speed.
    // Setting timestep to 1/240 means 4 steps × 1/240s = 1/60s = correct real-time.
    this.world.timestep = 1 / 240;

    // numSolverIterations=40: more iterations → more accurate constraint resolution per step.
    // Critical for preventing inter-penetration when multiple discs collide simultaneously.
    this.world.integrationParameters.numSolverIterations = 40;

    // maxCcdSubsteps=16: Continuous Collision Detection subdivides each physics step
    // so fast-moving discs don't tunnel through each other between frames.
    this.world.integrationParameters.maxCcdSubsteps = 16;

    // Start the 60 Hz game loop immediately
    this._tickInterval = setInterval(() => this._tick(), TICK_MS);
    this._refillBots();
  }

  /* ── Platform (logical only — no physical collider needed) ────────────── */
  /**
   * Updates the logical platform size in shared state so the client can
   * render the board and danger zone accurately. There is no actual physics
   * collider for the platform edge — elimination is handled in _checkEliminations()
   * by comparing disc XZ distance to platformSize/2.
   */
  _updatePlatform() {
    this.state.platform = { w: this.platformSize, h: this.platformSize, type: 'circle' };
  }

  /* ── Bot slot management ──────────────────────────────────────────────── */
  /**
   * Keeps the room full of bots at all times during LOBBY.
   * When a human joins, one bot is removed (last added). When a human leaves,
   * a bot is added back. Bots always auto-ready so the game can start as soon
   * as the single human player hits Ready.
   */
  _refillBots() {
    if (this.state.status !== 'LOBBY') return; // don't alter bots during active play
    const humanCount = Object.keys(this.players).length;
    const needed = MAX_PER_ROOM - humanCount;
    const botKeys = Object.keys(this.bots);

    // Remove excess bots (e.g. a human just joined)
    while (botKeys.length > needed) {
      delete this.bots[botKeys.pop()];
    }
    // Add new bots until the room is full
    while (Object.keys(this.bots).length < needed) {
      const bid = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      this.bots[bid] = {
        id: bid, name: nextBotName(),
        color: COLORS[Object.keys(this.bots).length % COLORS.length],
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        isReady: true,   // bots are always ready
        isAlive: false, isBot: true, hasShield: false, powerBoost: 1,
      };
    }
    this._checkAutoStart();
  }

  /* ── Player join / leave ──────────────────────────────────────────────── */
  addPlayer(socketId, name, avatar, color) {
    this.players[socketId] = {
      id: socketId, name: name || 'Player',
      color: color || '#ffffff', avatar: avatar || '1',
      isReady: false,  // humans must explicitly click Ready
      isAlive: false, isBot: false, hasShield: false, powerBoost: 1,
    };
    this._refillBots(); // may remove a bot to make room
  }

  /**
   * Transfers an old socket's full game state (body, pending move) to a new
   * socket ID when a player reconnects mid-match. The reconnectToken is a
   * client-generated UUID stored in localStorage that persists across reloads.
   */
  reconnectPlayer(oldSocketId, newSocketId, reconnectToken) {
    const oldPlayer = this.players[oldSocketId];
    if (!oldPlayer) return false;

    // Move player data to new socket key
    this.players[newSocketId] = { ...oldPlayer, id: newSocketId };
    delete this.players[oldSocketId];

    // Re-key the physics body so future ticks find it correctly
    if (this.bodies[oldSocketId]) {
      this.bodies[newSocketId] = this.bodies[oldSocketId];
      delete this.bodies[oldSocketId];
    }

    // Preserve any move submitted before the disconnect
    if (this.pendingMoves[oldSocketId]) {
      this.pendingMoves[newSocketId] = this.pendingMoves[oldSocketId];
      delete this.pendingMoves[oldSocketId];
    }

    this.reconnectMap.set(reconnectToken, newSocketId);
    return true;
  }

  /**
   * Cleans up a player on disconnect: removes their physics body from Rapier,
   * then deletes room if no humans remain (stops the tick interval to avoid leaks).
   */
  removePlayer(socketId) {
    // Always clean up the physics body first — Rapier holds references internally
    if (this.bodies[socketId]) {
      this.world.removeRigidBody(this.bodies[socketId]);
      delete this.bodies[socketId];
    }
    delete this.players[socketId];

    // Remove any reconnect tokens pointing to this socket
    for (const [token, sid] of this.reconnectMap.entries()) {
      if (sid === socketId) this.reconnectMap.delete(token);
    }

    // If no humans left, tear down the room entirely
    if (Object.keys(this.players).length === 0) {
      clearInterval(this._tickInterval);
      rooms.delete(this.code);
    }
  }

  setReady(socketId, ready) {
    if (this.state.status !== 'LOBBY') return;
    if (this.players[socketId]) this.players[socketId].isReady = ready;
    this._checkAutoStart();
  }

  /**
   * Auto-starts the game once every human player has clicked Ready.
   * Bots are always pre-readied, so this only waits on human consent.
   */
  _checkAutoStart() {
    if (this.state.status !== 'LOBBY') return;
    const humans = Object.values(this.players);
    if (humans.length > 0 && humans.every(p => p.isReady)) {
      this._startGame();
    }
  }

  /* ── Utility: combined player + bot list ──────────────────────────────── */
  _allEntities() {
    // Returns every participant (human + bot) as a flat array.
    // Used everywhere we need to iterate over all disc owners.
    return [...Object.values(this.players), ...Object.values(this.bots)];
  }

  /* ── Spawn all disc bodies into the physics world ─────────────────────── */
  /**
   * Removes any existing bodies, then creates one Rapier RigidBody per entity
   * arranged in a circle at a safe radius inside the platform.
   *
   * Key physics decisions:
   *  - Ball collider (sphere): at Y=0 with Y-translation locked, a sphere becomes
   *    a perfect 2D circle in the XZ plane. Cylinder-cylinder contact detection in
   *    3D was unreliable at the same Y height, causing discs to phase through each other.
   *  - COLLISION_RADIUS > PLAYER_RADIUS: the hitbox is 33% larger than the visual disc
   *    so discs bounce off before they visually overlap even with render interpolation lag.
   *  - CCD enabled: prevents fast discs from tunneling through each other in a single step.
   *  - Y-locked translations: Rapier will never move a disc up or down, keeping all
   *    physics strictly in the XZ plane (true 2D).
   *  - All rotations locked: discs don't tilt or wobble — they're flat coins.
   */
  _spawnAllEntities() {
    // Remove all existing physics bodies before respawning (clean slate)
    Object.keys(this.bodies).forEach(id => {
      this.world.removeRigidBody(this.bodies[id]);
    });
    this.bodies = {};

    const all = this._allEntities();
    all.forEach((entity, i) => {
      // Distribute discs evenly around a circle inside the platform
      const angle = (Math.PI * 2 / all.length) * i;
      const r = Math.min(this.platformSize * 0.18, 180); // spawn ring radius (capped so they're not too spread)
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, 0, z)             // Y=0: all discs on the same flat plane
        .setLinearDamping(3.2)               // heavy friction so it stops like real wood, not ice
        .setAngularDamping(10)               // aggressive angular damping — discs spin freely but stop fast
        .enabledRotations(false, false, false) // lock ALL axes of rotation (no tilt/wobble)
        .enabledTranslations(true, false, true) // only allow XZ movement — Y is permanently frozen
        .setCcdEnabled(true);               // continuous collision detection (prevents tunneling at high speed)

      const body = this.world.createRigidBody(bodyDesc);
      this.world.createCollider(
        RAPIER.ColliderDesc.ball(COLLISION_RADIUS) // sphere at Y=0+Y-lock = 2D circle collision
          .setFriction(0.3)
          .setRestitution(0.5)          // 0.5 restitution = realistic bounce (carrom-like)
          .setMass(12)
          .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), // enables collision callbacks if needed later
        body
      );
      this.bodies[entity.id] = body;
      entity.isAlive = true;
      entity.hasShield = false;
      entity.powerBoost = 1;
    });
  }

  /* ── Phase transitions ────────────────────────────────────────────────── */

  _startGame() {
    this.state.round = 0;
    this.platformSize = this.config.initialPlatform;
    this._updatePlatform();
    this._spawnAllEntities();
    this._startPlanning();
  }

  /**
   * PLANNING phase: players have PLANNING_MS milliseconds to drag and set their move.
   * Bots pick a direction+power after a human-like random delay so they don't all
   * move instantly (which would look robotic). Bot AI also uses its current position
   * to decide: if near the edge, aim toward center; otherwise aim randomly.
   */
  _startPlanning() {
    this.state.round++;
    this.state.status = 'PLANNING';
    this.state.phaseEndsAt = Date.now() + this.config.planningMs;
    this.pendingMoves = {};  // clear previous round's moves
    this.powerups = [];
    this.paused = false;

    // Bot difficulty maps to a [minPower, maxPower] range for randomising shot strength
    const diffPower = { easy: [0.15, 0.35], medium: [0.3, 0.6], hard: [0.55, 0.9] }[this.config.botDifficulty] || [0.3, 0.6];

    Object.values(this.bots).forEach(bot => {
      if (!bot.isAlive) return;

      // Random delay simulates human reaction time — avoids all bots submitting at t=0
      const delay = 400 + Math.random() * Math.max(600, this.config.planningMs - 800);
      setTimeout(() => {
        if (this.state.status !== 'PLANNING') return; // phase may have ended by now
        const body = this.bodies[bot.id];
        if (!body) return;
        const pos = body.translation();
        const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z); // distance from center

        let dx, dz;
        if (dist > this.platformSize * 0.25) {
          // Bot is near the edge — aim toward center with slight random offset
          dx = -pos.x + (Math.random() - 0.5) * 15;
          dz = -pos.z + (Math.random() - 0.5) * 15;
        } else {
          // Bot is near center — shoot in a random direction
          const a = Math.random() * Math.PI * 2;
          dx = Math.cos(a); dz = Math.sin(a);
        }
        const mag = Math.sqrt(dx * dx + dz * dz) || 1;
        const power = diffPower[0] + Math.random() * (diffPower[1] - diffPower[0]);
        this.pendingMoves[bot.id] = { dx: dx / mag, dz: dz / mag, power };
      }, delay);
    });
  }

  /**
   * REVEAL phase: all pending moves are locked in. Any entity that didn't submit
   * gets a zero-power move (stays still). Client shows arrows for all moves for
   * REVEAL_MS milliseconds before ACTION begins — builds anticipation.
   */
  _startReveal() {
    this.state.status = 'REVEAL';
    this.state.phaseEndsAt = Date.now() + REVEAL_MS;

    // Fill in zero-move for any entity that didn't submit during planning
    for (const e of this._allEntities()) {
      if (e.isAlive && !this.pendingMoves[e.id]) {
        this.pendingMoves[e.id] = { dx: 0, dz: 0, power: 0 };
      }
    }
  }

  /**
   * ACTION phase: all impulses are applied simultaneously at the exact same tick.
   * This is the carrom moment — every disc launches at once.
   * Force = power (0–1) × maxImpulse × optional powerBoost multiplier.
   */
  _startAction() {
    this.state.status = 'ACTION';
    this.state.phaseEndsAt = Date.now() + ACTION_MAX_MS;
    this.actionStart = Date.now(); // used by _allSettled() for minimum settle delay

    for (const e of this._allEntities()) {
      if (!e.isAlive) continue;
      const move = this.pendingMoves[e.id];
      if (!move || move.power === 0) continue; // no move submitted → stays still
      const body = this.bodies[e.id];
      if (!body) continue;

      const force = move.power * this.config.maxImpulse;
      const powerBoost = e.powerBoost || 1; // heavy powerup applies 1.4× boost
      body.applyImpulse({ x: move.dx * force * powerBoost, y: 0, z: move.dz * force * powerBoost }, true);
      e.powerBoost = 1; // reset after use
    }
  }

  /**
   * Spawns powerup collectibles scattered across the inner-to-middle ring
   * of the platform. Inner area is left clear so discs can't spawn on top of them.
   * Currently disabled (POWERUP_COUNT=0) but wired up for future use.
   */
  _spawnPowerups() {
    this.powerups = [];
    const count = Math.max(0, Math.min(12, this.config.powerupCount || POWERUP_COUNT));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      // Spawn between 18% and 38% of platform radius from center
      const r = (this.platformSize * 0.18) + Math.random() * (this.platformSize * 0.20);
      this.powerups.push({
        id: `pu_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        type: POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)],
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
      });
    }
  }

  /**
   * Checks each alive entity against every active powerup each tick during ACTION.
   * Uses COLLISION_RADIUS (physics hitbox) for pickup detection — consistent with
   * how discs collide with each other.
   *
   * Powerup effects:
   *  boost   — immediate velocity impulse in current direction of travel
   *  shield  — next out-of-bounds elimination is negated and disc teleports to center
   *  chaos   — repels all OTHER discs from the collector
   *  freeze  — zeroes all OTHER discs' velocity instantly
   *  swap    — teleports collector to a random other disc's position and vice versa
   *  gravity — pulls all OTHER discs toward the board center
   *  heavy   — grants 1.4× force multiplier on the next shot
   */
  _applyPowerups() {
    if (!this.powerups.length) return;

    for (const e of this._allEntities()) {
      if (!e.isAlive) continue;
      const body = this.bodies[e.id];
      if (!body) continue;
      const pos = body.translation();

      // Iterate in reverse so we can splice safely while looping
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const p = this.powerups[i];
        const d = Math.hypot(pos.x - p.x, pos.z - p.z);

        // Pickup range = physics hitbox + powerup pickup radius
        if (d > COLLISION_RADIUS + POWERUP_RADIUS) continue;

        if (p.type === 'boost') {
          // Boost in the direction of current motion
          const v = body.linvel();
          const mag = Math.hypot(v.x, v.z) || 1;
          body.applyImpulse({ x: (v.x / mag) * 800, y: 0, z: (v.z / mag) * 800 }, true);

        } else if (p.type === 'shield') {
          e.hasShield = true; // flag checked in _checkEliminations

        } else if (p.type === 'chaos') {
          // Push all other discs radially outward from this disc's position
          for (const other of this._allEntities()) {
            if (!other.isAlive || other.id === e.id) continue;
            const ob = this.bodies[other.id];
            if (!ob) continue;
            const op = ob.translation();
            const dx = op.x - pos.x;
            const dz = op.z - pos.z;
            const m = Math.hypot(dx, dz) || 1;
            if (m < 24) ob.applyImpulse({ x: (dx / m) * 620, y: 0, z: (dz / m) * 620 }, true);
          }

        } else if (p.type === 'freeze') {
          // Instantly halt all OTHER discs' movement
          for (const other of this._allEntities()) {
            if (!other.isAlive || other.id === e.id) continue;
            const ob = this.bodies[other.id];
            if (!ob) continue;
            ob.setLinvel({ x: 0, y: 0, z: 0 }, true);
            ob.setAngvel({ x: 0, y: 0, z: 0 }, true);
          }

        } else if (p.type === 'swap') {
          // Teleport to a random other disc's position and swap positions
          const others = this._allEntities().filter(other => other.isAlive && other.id !== e.id && this.bodies[other.id]);
          if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)];
            const tb = this.bodies[target.id];
            if (tb) {
              const p1 = body.translation();
              const p2 = tb.translation();
              // Swap positions (Y=0 — keep flat in the physics plane)
              body.setTranslation({ x: p2.x, y: 0, z: p2.z }, true);
              tb.setTranslation({ x: p1.x, y: 0, z: p1.z }, true);
              // Zero velocities so swapped discs don't carry momentum to wrong position
              body.setLinvel({ x: 0, y: 0, z: 0 }, true);
              tb.setLinvel({ x: 0, y: 0, z: 0 }, true);
            }
          }

        } else if (p.type === 'gravity') {
          // Pull all OTHER discs toward the board center (0,0)
          for (const other of this._allEntities()) {
            if (!other.isAlive || other.id === e.id) continue;
            const ob = this.bodies[other.id];
            if (!ob) continue;
            const op = ob.translation();
            const dx = -op.x; // direction toward center
            const dz = -op.z;
            const m = Math.hypot(dx, dz) || 1;
            ob.applyImpulse({ x: (dx / m) * 700, y: 0, z: (dz / m) * 700 }, true);
          }

        } else if (p.type === 'heavy') {
          // Next shot deals 40% more force — consumed after one round
          e.powerBoost = 1.4;
        }

        io.to(this.code).emit('powerupTaken', { by: e.name, type: p.type });
        this.powerups.splice(i, 1); // remove collected powerup
      }
    }
  }

  /**
   * Returns true when all alive discs are slow enough to end the ACTION phase early.
   * Requires ACTION_MIN_MS to have passed first — prevents instant settling on
   * zero-move rounds where discs never moved.
   *
   * SETTLE_SPEED threshold is intentionally low (0.22 world units/s) so discs
   * must be nearly stationary before the next round begins.
   */
  _allSettled() {
    if (Date.now() - this.actionStart < ACTION_MIN_MS) return false;
    for (const e of this._allEntities()) {
      if (!e.isAlive) continue;
      const body = this.bodies[e.id];
      if (!body) continue;
      const v = body.linvel();
      // Check full 3D magnitude — Y velocity should always be ~0 due to Y-lock,
      // but included for safety
      if (Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) > SETTLE_SPEED) return false;
    }
    return true;
  }

  /**
   * Checks every alive disc's XZ distance from origin each ACTION tick.
   * A disc is eliminated if its center moves beyond (platformSize/2 + COLLISION_RADIUS).
   * The +COLLISION_RADIUS buffer gives the disc just enough room so it's eliminated
   * when the edge of the hitbox clears the platform, not just the center.
   *
   * Shield logic: if shielded, disc is teleported back to center and shield is consumed.
   */
  _checkEliminations() {
    // Elimination boundary: center of disc must stay within platform radius + hitbox
    const radius = this.platformSize / 2 + COLLISION_RADIUS;

    for (const e of this._allEntities()) {
      if (!e.isAlive) continue;
      const body = this.bodies[e.id];
      if (!body) continue;
      const pos = body.translation();
      const dist = Math.hypot(pos.x, pos.z); // XZ distance from origin (center of board)

      if (dist > radius) {
        if (!this.eliminatedIds.has(e.id)) {  // guard against duplicate elimination
          if (e.hasShield) {
            // Shield saves the player — teleport back to center, remove shield
            e.hasShield = false;
            body.setTranslation({ x: 0, y: 0, z: 0 }, true);
            body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            body.setAngvel({ x: 0, y: 0, z: 0 }, true);
            io.to(this.code).emit('shieldSaved', { name: e.name, color: e.color });
            continue;
          }
          // No shield — eliminate permanently this round
          e.isAlive = false;
          this.eliminatedIds.add(e.id);
          // rankings is built in reverse order: first eliminated is at the end
          this.state.rankings.unshift({ name: e.name, color: e.color, avatar: e.avatar, isWinner: false });
          this.world.removeRigidBody(body); // free Rapier memory immediately
          delete this.bodies[e.id];
          io.to(this.code).emit('eliminated', { name: e.name, color: e.color });
        }
      }
    }
  }

  // Rapier ball colliders at Y=0 with Y-locked translations handle all disc-to-disc
  // collision detection natively. No manual separation hack needed.

  /**
   * Called at the end of ACTION phase (all settled or time limit hit).
   * If ≤1 player alive → game over. Otherwise shrink the platform and start next round.
   *
   * Shrink curve:
   *  - Rounds 1–8: fixed SHRINK_FACTOR (0.97 = 3% per round)
   *  - Rounds 9+:  accelerates by 0.4% per extra round, up to 4% bonus shrink,
   *    ensuring late-game matches don't drag on forever.
   */
  _endRound() {
    const alive = this._allEntities().filter(e => e.isAlive);

    if (alive.length <= 1) {
      // Only 0 or 1 disc left — someone wins
      const finalWinner = alive.length === 1 ? alive[0] : null;
      this._gameOver(finalWinner);
      return;
    }

    // Accelerating late-game shrink prevents infinite matches
    const lateGameBonus = Math.min(0.04, Math.max(0, (this.state.round - 8) * 0.004));
    const effectiveShrink = Math.max(0.9, this.config.shrinkFactor - lateGameBonus);
    this.platformSize *= effectiveShrink;
    this._updatePlatform(); // sync new size to client state

    // Freeze all surviving discs in their current XZ position — no Y drift to reset
    // Players near the new (smaller) edge will face more pressure next round
    alive.forEach((entity) => {
      const body = this.bodies[entity.id];
      if (!body) return;
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    });

    // After shrinking, immediately eliminate any disc whose center is now
    // outside the new smaller platform boundary. This prevents the situation
    // where a disc is visually outside the board but survives until the next
    // ACTION phase — the elimination should feel instant when the board shrinks.
    this._checkEliminations();

    // Re-check if eliminations from the shrink ended the game
    const stillAlive = this._allEntities().filter(e => e.isAlive);
    if (stillAlive.length <= 1) {
      const finalWinner = stillAlive.length === 1 ? stillAlive[0] : null;
      this._gameOver(finalWinner);
      return;
    }

    this._startPlanning();
  }

  /**
   * Determines the winner and sets GAME_OVER state.
   * Edge case: if all remaining discs fell off simultaneously (zero alive),
   * the last-eliminated player (top of rankings) is retroactively declared winner.
   */
  _gameOver(winner) {
    this.state.status = 'GAME_OVER';
    this.state.phaseEndsAt = Date.now() + GAMEOVER_MS;

    if (!winner && this.state.rankings.length > 0) {
      // All discs fell at once — last surviving disc before final round wins
      const lastFallen = this.state.rankings[0];
      this.state.winner = { name: lastFallen.name, color: lastFallen.color, avatar: lastFallen.avatar };
      lastFallen.isWinner = true;
    } else if (winner) {
      this.state.winner = { name: winner.name, color: winner.color, avatar: winner.avatar };
      // Winner wasn't eliminated so doesn't appear in rankings yet — add them at the top
      this.state.rankings.unshift({ ...this.state.winner, isWinner: true });
    } else {
      this.state.winner = null;
    }
  }

  /**
   * Resets everything back to LOBBY state.
   * Called automatically after GAMEOVER_MS by the tick loop.
   * Removes all physics bodies to free Rapier memory before the next game.
   */
  _resetToLobby() {
    // Remove all physics bodies (prevents Rapier memory leaks)
    Object.keys(this.bodies).forEach(id => {
      this.world.removeRigidBody(this.bodies[id]);
    });
    this.bodies = {};
    this.state.status = 'LOBBY';
    this.state.round = 0;
    this.state.winner = null;
    this.state.rankings = [];
    this.powerups = [];
    this.eliminatedIds.clear();
    this.platformSize = INITIAL_PLATFORM;
    this._updatePlatform();
    // Reset all entity flags — bots re-ready automatically, humans must click Ready again
    this._allEntities().forEach(e => { e.isAlive = false; e.isReady = e.isBot; e.hasShield = false; e.powerBoost = 1; });
    this._refillBots();
  }

  /* ── Move submission (client → server during PLANNING) ───────────────── */
  /**
   * Stores a player's chosen shot direction+power. Normalizes the direction
   * vector and clamps power to [0,1]. Players may re-submit as many times as
   * they like during PLANNING — only the last submission counts.
   */
  setMove(socketId, move) {
    if (this.state.status !== 'PLANNING') return;
    if (!this.players[socketId] || !this.players[socketId].isAlive) return;

    const mag = Math.sqrt(move.dx * move.dx + move.dz * move.dz) || 1;
    this.pendingMoves[socketId] = {
      dx: move.dx / mag,                           // normalized direction X
      dz: move.dz / mag,                           // normalized direction Z
      power: Math.max(0, Math.min(1, move.power)), // clamped power [0,1]
    };
  }

  /* ── Pause / Resume (settings panel open during bot game) ────────────── */
  /**
   * Pauses the planning countdown. Only allowed during PLANNING phase.
   * Stores remaining time so the countdown can be restored accurately on resume.
   * Used when a human player opens the settings panel.
   */
  pauseGame() {
    if (this.paused || this.state.status !== 'PLANNING') return;
    this.paused = true;
    this.pausedRemaining = Math.max(0, this.state.phaseEndsAt - Date.now());
  }

  resumeGame() {
    if (!this.paused) return;
    this.paused = false;
    // Reconstruct phaseEndsAt from when we resume, not from when we paused
    this.state.phaseEndsAt = Date.now() + this.pausedRemaining;
    this.pausedRemaining = 0;
  }

  /* ── Settings update from client ────────────────────────────────────── */
  /**
   * Allows clients to tweak maxImpulse and bot difficulty mid-lobby.
   * Core gameplay constants (planningMs, shrinkFactor, platform size, powerups)
   * are locked to their default values so the game stays balanced.
   */
  updateConfig(cfg) {
    // These are intentionally hardcoded — not client-controllable
    this.config.planningMs = PLANNING_MS;
    this.config.shrinkFactor = SHRINK_FACTOR;
    this.config.initialPlatform = INITIAL_PLATFORM;
    this.config.powerupCount = 0;

    // Only bot difficulty is player-adjustable
    if (cfg.botDifficulty !== undefined) this.config.botDifficulty = cfg.botDifficulty;
  }

  /* ── Main game loop tick (called at 60 Hz) ────────────────────────────── */
  /**
   * Drives all phase transitions and physics updates.
   *
   * ACTION phase runs 4 physics substeps per tick (4 × 60Hz = 240 sub-steps/sec).
   * This is critical: at high disc speeds, a single step per tick allows discs to
   * pass through each other between frames (tunneling). More substeps means Rapier
   * resolves collisions at smaller time slices, catching fast-moving impacts.
   *
   * No physics steps are run during PLANNING/REVEAL/LOBBY — discs are stationary
   * and stepping the world unnecessarily wastes CPU.
   */
  _tick() {
    this.state.now = Date.now();

    switch (this.state.status) {
      case 'PLANNING':
        // Only advance phase if not paused (settings panel may be open)
        if (!this.paused && Date.now() >= this.state.phaseEndsAt) this._startReveal();
        break;

      case 'REVEAL':
        if (Date.now() >= this.state.phaseEndsAt) this._startAction();
        break;

      case 'ACTION':
        // 4 substeps × 60 Hz = 240 physics steps/sec for high collision fidelity
        this.world.step();
        this.world.step();
        this.world.step();
        this.world.step();
        this._checkEliminations();
        // End round early if all discs have settled, or force end at hard time limit
        if (this._allSettled() || Date.now() >= this.state.phaseEndsAt) this._endRound();
        break;

      case 'GAME_OVER':
        if (Date.now() >= this.state.phaseEndsAt) this._resetToLobby();
        break;
    }

    this._broadcast();
  }

  /* ── Broadcast current state to all clients in room ──────────────────── */
  /**
   * Sends a 'sync' packet to every socket in the room every tick.
   * Includes physics body positions (x,y,z + quaternion), player metadata,
   * and all game state needed for the client to render the frame.
   *
   * pendingMove is only included in the payload during REVEAL phase —
   * before that it's hidden so opponents can't see each other's moves.
   */
  _broadcast() {
    // Extract current position and rotation from every live physics body
    const bodiesData = Object.keys(this.bodies).map(id => {
      const b = this.bodies[id];
      const p = b.translation();
      const q = b.rotation();
      return { id, x: p.x, y: p.y, z: p.z, qx: q.x, qy: q.y, qz: q.z, qw: q.w };
    });

    const isReveal = this.state.status === 'REVEAL';
    const strippedPlayers = {};
    this._allEntities().forEach(e => {
      strippedPlayers[e.id] = {
        name: e.name, color: e.color, avatar: e.avatar,
        isReady: e.isReady, isAlive: e.isAlive, isBot: e.isBot,
        hasShield: !!e.hasShield,
        hasPendingMove: !!this.pendingMoves[e.id],  // true/false indicator (hidden during planning)
        pendingMove: isReveal ? (this.pendingMoves[e.id] || null) : null, // only reveal during REVEAL phase
      };
    });

    io.to(this.code).emit('sync', {
      state: this.state,
      players: strippedPlayers,
      bodies: bodiesData,
      code: this.code,
      powerups: this.powerups,
      config: this.config,
      paused: this.paused,
    });
  }
}

// ─── Init Rapier & start HTTP server ─────────────────────────────────────────
/**
 * Rapier WASM module must be fully initialised before we can create worlds or
 * colliders. Everything is inside this .then() to guarantee that.
 */
RAPIER.init().then(() => {
  io.on('connection', socket => {
    let currentRoom = null;
    let currentReconnectToken = null;

    /**
     * joinRoom handler — the single entry point for all clients.
     * Handles three cases:
     *  1. Reconnect: client sends a stored reconnectToken → re-attach to old slot
     *  2. Join by code: client sends a room code → join that specific room
     *  3. Quick play: no code → find any available lobby, or create a new room
     */
    socket.on('joinRoom', (data) => {
      const reconnectToken = typeof data?.reconnectToken === 'string' ? data.reconnectToken : null;
      let room;

      // ── Step 1: Try to find a room the player was previously in ──────────
      if (reconnectToken) {
        for (const candidate of rooms.values()) {
          const oldSocketId = candidate.reconnectMap.get(reconnectToken);
          if (oldSocketId && candidate.players[oldSocketId]) {
            room = candidate;
            break;
          }
        }
      }

      // ── Step 2: If found, migrate the player to the new socket ID ────────
      if (room && reconnectToken) {
        const oldSocketId = room.reconnectMap.get(reconnectToken);
        const ok = oldSocketId ? room.reconnectPlayer(oldSocketId, socket.id, reconnectToken) : false;
        if (!ok) room = null; // reconnect failed (old slot gone) — fall through to fresh join
      }

      // ── Step 3: Join by explicit code ────────────────────────────────────
      if (data.code) {
        room = room || rooms.get(data.code.toUpperCase());
        if (!room || room.state.status !== 'LOBBY') {
          // Allow reconnect to active rooms; reject brand-new joins mid-game
          if (!reconnectToken || !room) {
            socket.emit('error', 'Room not found or game in progress');
            return;
          }
        }
      } else if (!data.createPrivate) {
        // ── Step 4: Quick Play — find any open lobby ──────────────────────
        rooms.forEach(r => {
          if (!room && r.state.status === 'LOBBY' && Object.keys(r.players).length < 6) {
            room = r;
          }
        });
      }

      // ── Step 5: Create a new room if none was found ───────────────────────
      if (!room) {
        const code = generateCode();
        room = new Room(code);
        rooms.set(code, room);
      }

      currentRoom = room;
      currentReconnectToken = reconnectToken;
      socket.join(room.code); // subscribe to the room's Socket.IO channel

      if (!room.players[socket.id]) {
        room.addPlayer(socket.id, data.name, data.avatar, data.color);
      }
      if (reconnectToken) room.reconnectMap.set(reconnectToken, socket.id);

      socket.emit('joined', { code: room.code, myId: socket.id });
      room._broadcast(); // push state to new player immediately
    });

    socket.on('setReady', ready => {
      if (currentRoom) { currentRoom.setReady(socket.id, ready); currentRoom._broadcast(); }
    });

    socket.on('setMove', move => {
      if (currentRoom) currentRoom.setMove(socket.id, move);
    });

    socket.on('pauseGame', () => {
      if (currentRoom) currentRoom.pauseGame();
    });

    socket.on('resumeGame', () => {
      if (currentRoom) currentRoom.resumeGame();
    });

    socket.on('updateSettings', cfg => {
      if (currentRoom) {
        currentRoom.updateConfig(cfg);
        socket.emit('settingsUpdated', currentRoom.config);
      }
    });

    socket.on('emote', emote => {
      if (!currentRoom || !currentRoom.players[socket.id]) return;
      const safe = String(emote || '').slice(0, 4); // limit emote length for safety
      io.to(currentRoom.code).emit('emote', { name: currentRoom.players[socket.id].name, emote: safe });
    });

    /**
     * On disconnect: for active games we keep the player slot alive for 20 seconds
     * to allow reconnect. For LOBBY disconnects, slot is freed immediately so the
     * room can refill with a bot.
     */
    socket.on('disconnect', () => {
      if (!currentRoom) return;
      if (currentReconnectToken && currentRoom.state.status !== 'LOBBY') {
        // Active game — hold slot open briefly for reconnect
        setTimeout(() => {
          if (currentRoom && currentRoom.players[socket.id]) {
            currentRoom.removePlayer(socket.id);
          }
        }, 20000);
      } else {
        // Lobby — remove immediately and refill with a bot
        currentRoom.removePlayer(socket.id);
      }
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => console.log(`[server] Geckos+Rapier on :${PORT}`));
});
