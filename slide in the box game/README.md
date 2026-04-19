# Slide in the Box

Multiplayer physics game where players pick an impulse at the same time, then watch all moves execute together on a shrinking circular platform. The goal is simple: stay on the board and push everyone else off.

This README is based on the current code in this project and documents what is implemented right now.

## What This Project Is

- **Game type**: Real-time, round-based, last-player-standing physics game
- **Client**: TypeScript + Vite + Babylon.js (`client/`)
- **Server**: Node.js + Socket.IO + Rapier 3D physics (`server/`)
- **Match structure**: Rooms with up to 6 total participants (humans + bots)
- **Core design pattern**: Server-authoritative simulation with client-side interpolation/rendering

## Gameplay Rules (As Implemented)

- Matches are played in rounds on a circular platform.
- Every round follows a WEGO-style sequence:
  1. **PLANNING**: players drag to aim and set move power.
  2. **REVEAL**: all planned arrows are shown.
  3. **ACTION**: impulses are applied simultaneously.
- If a piece falls below a Y threshold or moves outside platform radius, it is eliminated.
- If more than one player survives after action settles, the platform shrinks and the next round starts.
- Last surviving player wins.

## Room and Matchmaking Flow

From the home screen:

- **Quick Play**: joins any available lobby in `LOBBY` state; creates one if none is available.
- **Create Private**: always creates a new room.
- **Join by code**: joins a room via 4-character room code.

Additional behavior:

- A share link can be copied with `?room=CODE`.
- On page load, if a `room` query param is present, it auto-fills the join code.
- Game starts when all human players in lobby mark as ready.

## Bot System

- Bots are automatically added in lobby to fill up to 6 participants.
- Bot difficulty modes affect random power range:
  - `easy`: low power band
  - `medium`: mid power band
  - `hard`: high power band
- Bot move logic is position-aware:
  - near edge: tends to steer inward (with randomness)
  - near center: random direction

## Tech Stack

### Client (`client/`)

- `@babylonjs/core`: 3D rendering
- `socket.io-client`: real-time networking
- `vite` + `typescript`: build/dev tooling

### Server (`server/`)

- `socket.io`: room events + game state sync
- `@dimforge/rapier3d-compat`: physics world and rigid body simulation
- `express` + `cors`: server bootstrap and HTTP support

## Architecture Overview

### Server-authoritative simulation

The server owns:

- room state machine (`LOBBY`, `PLANNING`, `REVEAL`, `ACTION`, `GAME_OVER`)
- all rigid bodies and physics stepping
- elimination checks and winner computation
- timing for phase transitions and round progression
- room settings and bot behavior

The client owns:

- UI screens and HUD
- sending user intents (`joinRoom`, `setReady`, `setMove`, settings updates)
- Babylon scene rendering
- smoothing/interpolating visual motion toward server snapshots

### Networking events in use

Client -> Server:

- `joinRoom`
- `setReady`
- `setMove`
- `pauseGame`
- `resumeGame`
- `updateSettings`

Server -> Client:

- `joined`
- `error`
- `sync`
- `eliminated`
- `settingsUpdated`

## State Model

Each room tracks:

- players (human + bot metadata)
- rigid bodies for active pieces
- pending moves for current planning phase
- platform size and shrink settings
- current phase timing (`phaseEndsAt`, `now`)
- rankings and winner info
- paused state for planning timer

The `sync` payload includes:

- `state` (status, round, platform, winner/rankings, timing)
- `players` (ready/alive/bot flags and reveal-only pending moves)
- `bodies` (position + rotation quaternions)
- room `config`
- `paused`

## Key Game Mechanics in Code

- **Platform**: circular Rapier cylinder collider; visual platform in Babylon rebuilt when size changes.
- **Move power**: normalized `0..1` from drag distance on client; clamped and normalized again on server.
- **Impulse application**: all alive entities get impulse simultaneously at ACTION start.
- **Round end**: waits for minimum action time and then checks settled velocity threshold, or max action timeout.
- **Shrink**: platform size multiplied by `shrinkFactor` each round after survivors are determined.
- **Elimination ranking**: eliminated players are inserted as they fall; winner inserted/marked at game over.

## Client Rendering and Input

`Game3D` features:

- Babylon `ArcRotateCamera` with camera modes:
  - `FOLLOW`
  - `STRATEGIC`
  - `FREE`
- Disc-style player meshes with material caching
- Aim arrow visualization during planning and reveal
- Danger zone ring showing next shrink boundary
- Elimination particle burst effect
- Position/rotation interpolation for smooth movement

Input details:

- Left mouse drag: aim and set force
- Right mouse drag: camera orbit
- `C` key: cycle camera mode

## UI Screens and UX

Implemented pages:

- Home
- Lobby
- In-game HUD
- Settings overlay
- Game-over screen with rankings

In-game settings include:

- Planning time
- Max power
- Bot difficulty
- Platform shrink factor
- Danger zone visibility (client-side)
- Camera speed (client-side)

## Project Structure

- `client/index.html`: screen structure and HUD markup
- `client/src/main.ts`: app shell, socket event wiring, page transitions, HUD and settings logic
- `client/src/game3d.ts`: Babylon renderer, aiming logic, and visual sync
- `client/src/style.css`: full UI styling
- `server/index.js`: room lifecycle, gameplay state machine, physics, socket events

## Local Development

Open two terminals.

### 1) Start server

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:3001` by default.

### 2) Start client

```bash
cd client
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

### Optional client env

Client reads:

- `VITE_SERVER_URL` (fallback: `http://localhost:3001`)

Create `client/.env` if you want a non-default server URL.

## Build and Preview

Client:

```bash
cd client
npm run build
npm run preview
```

Server:

```bash
cd server
npm start
```

## Current Status and Notes

From code inspection, this project already has a complete playable loop:

- lobby + ready flow
- room code invites
- bot autofill
- synchronized phase-based gameplay
- elimination, shrinking board, and game-over rankings

Potential issues / cleanup opportunities:

- `client/src/game3d.ts` references `/clouds.png` and `/environment.env`, but those files are not present in `client/public` in this workspace. If missing at runtime, visual quality may degrade or those resources may fail to load.
- `client/src/style.css` contains duplicate style sections for rankings with overlapping selectors. It works, but can be simplified to avoid maintenance confusion.
- Room cleanup on disconnect removes human players and deletes empty rooms; bots are regenerated in lobby flow. This is functional, but worth testing heavily with rapid joins/leaves.

## Next Development Targets

If your goal is to finish/polish this game, high-value next tasks are:

1. Add missing visual assets (or fallback loading) for sky/environment.
2. Add reconnect handling and soft recovery if socket drops mid-match.
3. Add a small server-side test harness for phase transitions and elimination edge cases.
4. Add mobile/touch aiming polish and responsive HUD scaling.
5. Add telemetry/debug overlay (phase, FPS, active bodies) for balancing.

