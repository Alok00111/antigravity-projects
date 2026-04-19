import './style.css';
import { io, Socket } from 'socket.io-client';
import { Game3D } from './game3d';

/* ================================================================
   Main client – UI, networking, page routing
   ================================================================ */
const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`;

// ─── DOM refs ────────────────────────────────────────────────────
const pages = {
  home:     document.getElementById('page-home')!,
  lobby:    document.getElementById('page-lobby')!,
  game:     document.getElementById('page-game')!,
  gameover: document.getElementById('page-gameover')!,
};

const nameInput   = document.getElementById('nameInput')   as HTMLInputElement;
const codeInput   = document.getElementById('codeInput')   as HTMLInputElement;
const btnQuick    = document.getElementById('btnQuickPlay')!;
const btnCreate   = document.getElementById('btnCreateRoom')!;
const btnJoin     = document.getElementById('btnJoinCode')!;
const btnLeave    = document.getElementById('btnLeave')!;
const btnCopy     = document.getElementById('btnCopyCode')!;
const btnReady    = document.getElementById('readyButton')  as HTMLButtonElement;
const roomDisplay = document.getElementById('roomCodeDisplay')!;
const lobbyList   = document.getElementById('lobbyPlayerList')!;
const lobbySubtitle = document.getElementById('lobbySubtitle')!;
const homeError   = document.getElementById('homeError')!;


const hudTimer      = document.getElementById('hudTimer')!;
const hudPhase      = document.getElementById('hudPhaseLabel')!;
const hudScoreboard = document.getElementById('hudScoreboard')!;
const hudMoveStatus = document.getElementById('hudMoveStatus')!;
const hudDragHint   = document.getElementById('hudDragHint')!;
const toastEl       = document.getElementById('toastEl')!;
const hypeEl        = document.getElementById('hypeEl')!;
const challengeText = document.getElementById('challengeText')!;

// Settings DOM refs
const btnSettings        = document.getElementById('btnSettings')!;
const settingsPanelEl    = document.getElementById('settingsPanel')!;
const btnCloseSettings   = document.getElementById('btnCloseSettings')!;
const resumeCountdownEl  = document.getElementById('resumeCountdown')!;
const resumeTimerEl      = document.getElementById('resumeTimer')!;
const cameraSpeedSlider  = document.getElementById('cameraSpeedSlider') as HTMLInputElement;
const cameraSpeedVal     = document.getElementById('cameraSpeedVal')!;
const dangerZoneToggle   = document.getElementById('dangerZoneToggle') as HTMLInputElement;

const goTitle    = document.getElementById('gameoverTitle')!;
const goSub      = document.getElementById('gameoverSub')!;
const goBall     = document.getElementById('gameoverBall')!;
const goRankings = document.getElementById('gameoverRankings')!;
const btnAgain   = document.getElementById('btnPlayAgain')!;
const btnHome    = document.getElementById('btnGoHome')!;
const emoteBar   = document.getElementById('emoteBar')!;
const mvpBadges  = document.getElementById('mvpBadges')!;

// ─── State ───────────────────────────────────────────────────────
let channel: Socket | null = null;
let myId   = '';
let myName = '';
let roomCode = '';
let isReady  = false;
let game3d: Game3D | null = null;
let moveLockedIn     = false;   // true once player has set a move (can still re-drag)
let settingsOpen     = false;
let isBotRoom        = true;    // used for pause-on-settings logic
let resumeCounterTimer: number | null = null;
let lastPhase = '';
let lastRound = 0;
let reconnectTimer: number | null = null;
let reconnectAttempts = 0;
let lastJoinRequest: { code?: string; createPrivate: boolean } | null = null;
const reconnectToken = (() => {
  const key = 'slidebox_reconnect_token';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, created);
  return created;
})();
let elimComboCount = 0;
let elimComboResetTimer: number | null = null;

type MetaProgress = { dayKey: string; wins: number; roundsPlayed: number; maxStreak: number; currentStreak: number };
const progressKey = 'slidebox_progress';
function getDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function loadProgress(): MetaProgress {
  const fallback: MetaProgress = { dayKey: getDayKey(), wins: 0, roundsPlayed: 0, maxStreak: 0, currentStreak: 0 };
  try {
    const raw = localStorage.getItem(progressKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as MetaProgress;
    if (parsed.dayKey !== getDayKey()) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}
function saveProgress(p: MetaProgress) {
  localStorage.setItem(progressKey, JSON.stringify(p));
}
function refreshChallengePill() {
  const p = loadProgress();
  const target = 2;
  if (p.wins >= target) {
    challengeText.textContent = `Daily complete! ${p.wins} wins today • streak ${p.currentStreak}`;
  } else {
    challengeText.textContent = `Daily Challenge: Win ${target} matches (${p.wins}/${target})`;
  }
}
refreshChallengePill();

// avatar selection (simple)
let avatarIdx = 0;
const avatarCanvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
const prevBtn = document.getElementById('prevAvatar');
const nextBtn = document.getElementById('nextAvatar');

const AVATAR_COLORS = ['#DC143C','#FFD700','#228B22','#1E90FF','#8B4513','#9400D3','#FF6B35','#44CF6C','#A855F7'];
let myColor = AVATAR_COLORS[0];

function drawAvatar() {
  if (!avatarCanvas) return;
  const ctx = avatarCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, 96, 96);
  // simple colored circle
  ctx.fillStyle = myColor;
  ctx.beginPath(); ctx.arc(48, 48, 38, 0, Math.PI * 2); ctx.fill();
}

prevBtn?.addEventListener('click', () => {
  avatarIdx = (avatarIdx - 1 + AVATAR_COLORS.length) % AVATAR_COLORS.length;
  myColor = AVATAR_COLORS[avatarIdx];
  drawAvatar();
});
nextBtn?.addEventListener('click', () => {
  avatarIdx = (avatarIdx + 1) % AVATAR_COLORS.length;
  myColor = AVATAR_COLORS[avatarIdx];
  drawAvatar();
});
drawAvatar();

// ─── Page routing ────────────────────────────────────────────────
function showPage(name: 'home' | 'lobby' | 'game' | 'gameover') {
  Object.values(pages).forEach(p => p.classList.add('hidden'));
  pages[name].classList.remove('hidden');
  pages[name].classList.add('active');
}

// ─── Connect ─────────────────────────────────────────────────────
let eventsAttached = false;

function connect() {
  return new Promise<Socket>((resolve, reject) => {
    console.log('Socket.io connect initializing with:', SERVER_URL);
    const ch = io(SERVER_URL, { transports: ['websocket'] });
    ch.on('connect', () => resolve(ch));
    ch.on('connect_error', err => reject(err));
  });
}

let audioCtx: AudioContext | null = null;
function ensureAudioContext() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playUiBeep(freq: number, duration = 0.08, type: OscillatorType = 'triangle', vol = 0.03) {
  try {
    ensureAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // ignore audio failures
  }
}
let hypeTimeout = 0;
function showHype(text: string) {
  hypeEl.textContent = text;
  hypeEl.classList.remove('hidden');
  clearTimeout(hypeTimeout);
  hypeTimeout = window.setTimeout(() => hypeEl.classList.add('hidden'), 1300);
}

async function doJoin(code?: string, createPrivate = false) {
  try {
    homeError.classList.add('hidden');
    if (!channel) {
      channel = await connect();
      setupSocketEvents(channel);
    }

    myName = nameInput.value.trim() || `Player${Math.floor(Math.random() * 999)}`;
    const avatar = String(avatarIdx + 1);
    lastJoinRequest = { code, createPrivate };
    channel.emit('joinRoom', { 
      name: myName, 
      avatar, 
      color: myColor, 
      code: code || undefined,
      createPrivate,
      reconnectToken
    });
  } catch {
    homeError.textContent = 'Connection failed. Make sure the server is running.';
    homeError.classList.remove('hidden');
  }
}

// ─── UI events ───────────────────────────────────────────────────
btnQuick.addEventListener('click', () => doJoin());
btnCreate.addEventListener('click', () => doJoin(undefined, true));
btnJoin.addEventListener('click', () => {
  const c = codeInput.value.trim().toUpperCase();
  if (c.length === 4) doJoin(c);
});
codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnJoin.click(); });

btnLeave.addEventListener('click', () => {
  channel?.disconnect();
  channel = null;
  eventsAttached = false;
  showPage('home');
});

btnCopy.addEventListener('click', () => {
  const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  navigator.clipboard.writeText(url).then(() => {
    const original = btnCopy.textContent;
    btnCopy.textContent = 'Copied! ✅';
    setTimeout(() => btnCopy.textContent = original, 2000);
  });
});

// Check for invites on load
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const invite = params.get('room');
  if (invite) {
    codeInput.value = invite.toUpperCase();
    codeInput.focus();
  }
});

btnReady.addEventListener('click', () => {
  ensureAudioContext();
  isReady = !isReady;
  channel?.emit('setReady', isReady);
  btnReady.textContent = isReady ? 'Waiting...' : 'Ready Up';
  btnReady.classList.toggle('btn-ready', isReady);
  playUiBeep(isReady ? 660 : 380, 0.06);
});

btnAgain.addEventListener('click', () => {
  if (game3d) {
    game3d.dispose();
    game3d = null;
  }
  showPage('lobby');
});
btnHome.addEventListener('click', () => {
  if (game3d) {
    game3d.dispose();
    game3d = null;
  }
  channel?.disconnect();
  channel = null;
  eventsAttached = false;
  showPage('home');
});

emoteBar.querySelectorAll<HTMLButtonElement>('button[data-emote]').forEach(btn => {
  btn.addEventListener('click', () => {
    const emote = btn.dataset.emote || '🔥';
    channel?.emit('emote', emote);
    showToast(`${myName || 'You'} ${emote}`, '#ffffff');
  });
});

// ─── Settings panel ──────────────────────────────────────────────
function openSettings() {
  if (settingsOpen) return;
  settingsOpen = true;
  settingsPanelEl.classList.remove('hidden');
  // Pause planning timer when playing with bots
  if (isBotRoom) channel?.emit('pauseGame');
}

function closeSettings() {
  if (!settingsOpen) return;
  // Clear any existing countdown
  if (resumeCounterTimer !== null) { clearInterval(resumeCounterTimer); resumeCounterTimer = null; }

  if (isBotRoom) {
    // Show 3-second countdown before resuming
    let count = 3;
    resumeTimerEl.textContent = String(count);
    resumeCountdownEl.classList.remove('hidden');
    resumeCounterTimer = window.setInterval(() => {
      count--;
      resumeTimerEl.textContent = String(count);
      if (count <= 0) {
        clearInterval(resumeCounterTimer!);
        resumeCounterTimer = null;
        resumeCountdownEl.classList.add('hidden');
        settingsPanelEl.classList.add('hidden');
        settingsOpen = false;
        channel?.emit('resumeGame');
      }
    }, 1000);
  } else {
    settingsPanelEl.classList.add('hidden');
    settingsOpen = false;
  }
}

btnSettings.addEventListener('click', openSettings);
btnCloseSettings.addEventListener('click', closeSettings);
// Also close when clicking the darkened backdrop
settingsPanelEl.querySelector('.settings-backdrop')?.addEventListener('click', closeSettings);

// ─── Settings controls ──────────────────────────────────────────────

document.querySelectorAll('#diffChips .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#diffChips .chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    channel?.emit('updateSettings', { botDifficulty: (btn as HTMLElement).dataset.val });
  });
});


// Removed client-only settings as requested

// Global key events (Camera Switcher)
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC' && game3d) {
    const newMode = game3d.cycleCameraMode();
    showToast(`📸 Camera: ${newMode}`, '#FFD700');
  }
});

// ─── Socket events ───────────────────────────────────────────────
function setupSocketEvents(ch: Socket) {
  if (eventsAttached) return;
  eventsAttached = true;

  ch.on('joined', (data: unknown) => {
    const d = data as { code: string; myId: string };
    roomCode = d.code;
    myId = d.myId;
    roomDisplay.textContent = roomCode;
    isReady = false;
    btnReady.textContent = 'Ready Up';
    btnReady.disabled = false;
    btnReady.classList.remove('btn-ready');
    ch.emit('updateSettings', { planningMs: 7000, shrinkFactor: 0.97, initialPlatform: 1600, powerupCount: 0 });
    reconnectAttempts = 0;
    if (reconnectTimer !== null) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
    showPage('lobby');
  });

  ch.on('error', (msg: unknown) => {
    homeError.textContent = String(msg);
    homeError.classList.remove('hidden');
  });

  ch.on('eliminated', (data: unknown) => {
    const d = data as { name: string; color: string };
    showToast(`💀 ${d.name} fell off!`, d.color);
    game3d?.triggerCameraShake(2.1, 300);
    playUiBeep(180, 0.14, 'sawtooth', 0.05);
    elimComboCount++;
    if (elimComboResetTimer !== null) clearTimeout(elimComboResetTimer);
    if (elimComboCount >= 2) showHype(`${elimComboCount}X CHAOS COMBO!`);
    elimComboResetTimer = window.setTimeout(() => { elimComboCount = 0; }, 1500);
  });

  ch.on('sync', (raw: unknown) => {
    const data = raw as SyncPayload;
    if (!data || !data.state) return;

    const status = data.state.status;
    if ((data.config?.planningMs ?? 7000) !== 7000) {
      ch.emit('updateSettings', { planningMs: 7000, shrinkFactor: 0.97, initialPlatform: 1600, powerupCount: 0 });
    }
    if (status === 'PLANNING' && data.paused) {
      hudPhase.textContent = '⏸ PAUSED';
      hudTimer.textContent = '...';
    }

    if (status === 'LOBBY') {
      if (!pages.lobby.classList.contains('hidden') || pages.home.classList.contains('active')) {
        renderLobby(data);
      }
      return;
    }

    // switch to game page on first in-game sync
    if (!pages.game.classList.contains('active')) {
      showPage('game');
      if (!game3d) {
        game3d = new Game3D();
        game3d.setMyId(myId);
        game3d.onMoveSet = (dx, dz, power) => {
          channel?.emit('setMove', { dx, dz, power });
          // Mark move as set but KEEP aiming enabled so player can change it
          moveLockedIn = true;
          hudMoveStatus.classList.remove('hidden');
          hudDragHint.classList.add('hidden');
        };
      }
    }

    // update 3D
    game3d!.sync(data);

    // Track whether this is a bot room (for pause-on-settings logic)
    isBotRoom = Object.values(data.players).some((p: PlayerInfo) => p.isBot);

    // update HUD
    updateHUD(data);

    // game-over — show even if no winner (everyone fell)
    if (status === 'GAME_OVER') {
      setTimeout(() => showGameOver(data.state), 1500);
    }
  });
  ch.on('emote', (payload: unknown) => {
    const d = payload as { name: string; emote: string };
    showToast(`${d.name} ${d.emote}`, '#ffffff');
    playUiBeep(640, 0.05);
  });

  ch.on('disconnect', () => {
    if (!lastJoinRequest) return;
    if (reconnectTimer !== null) return;
    showToast('Connection lost. Reconnecting...', '#ff3366');
    reconnectTimer = window.setInterval(async () => {
      if (channel && channel.connected) return;
      if (reconnectAttempts >= 10) {
        if (reconnectTimer !== null) clearInterval(reconnectTimer);
        reconnectTimer = null;
        showToast('Could not reconnect. Back to home.', '#ff3366');
        showPage('home');
        return;
      }
      reconnectAttempts++;
      try {
        const fallbackCode = roomCode || lastJoinRequest?.code;
        channel = await connect();
        setupSocketEvents(channel);
        channel.emit('joinRoom', {
          name: myName || nameInput.value.trim() || 'Player',
          avatar: String(avatarIdx + 1),
          color: myColor,
          code: fallbackCode,
          createPrivate: false,
          reconnectToken
        });
      } catch {
        // keep retrying
      }
    }, 1200);
  });
}

// ─── Types ───────────────────────────────────────────────────────
interface PlayerInfo {
  name: string; color: string; avatar: string;
  isReady: boolean; isAlive: boolean; isBot: boolean;
  hasShield?: boolean;
  hasPendingMove: boolean;
  pendingMove?: { dx: number; dz: number; power: number } | null;
}
interface SyncPayload {
  state: { status: string; round: number; platform: { w: number; h: number }; winner: { name: string; color: string; avatar: string } | null; phaseEndsAt: number; now: number };
  players: Record<string, PlayerInfo>;
  bodies: { id: string; x: number; y: number; z: number; qx?: number; qy?: number; qz?: number; qw?: number }[];
  powerups?: { id: string; type: string; x: number; z: number }[];
  code: string;
  config?: { planningMs: number; maxImpulse: number; shrinkFactor: number; botDifficulty: string; initialPlatform?: number; powerupCount?: number };
  paused?: boolean;
}

// ─── Lobby render ────────────────────────────────────────────────
function renderLobby(data: SyncPayload) {
  lobbyList.innerHTML = '';
  const all = Object.entries(data.players);
  const humans = all.filter(([, p]) => !p.isBot);
  const readyHumans = humans.filter(([, p]) => p.isReady).length;
  lobbySubtitle.textContent = `${readyHumans}/${humans.length} players ready`;
  for (const [pid, p] of all) {
    const slot = document.createElement('div');
    slot.className = `lobby-slot ${p.isReady ? 'ready' : ''}`;
    slot.innerHTML = `
      <div class="lobby-slot-avatar" style="background:${p.color}"></div>
      <div class="lobby-slot-info">
        <span class="lobby-slot-name">${p.name}${pid === myId ? ' (You)' : ''}</span>
      </div>
      <span class="lobby-slot-status ${p.isReady ? 'is-ready' : 'not-ready'}">${p.isReady ? 'READY' : 'NOT READY'}</span>
    `;
    lobbyList.appendChild(slot);
  }
}

// ─── HUD update ──────────────────────────────────────────────────
function updateHUD(data: SyncPayload) {
  const { state, players } = data;

  // Track rounds played for progress stats (round badge removed from UI)
  if (state.round !== lastRound && state.status === 'PLANNING') {
    const p = loadProgress();
    p.roundsPlayed += 1;
    saveProgress(p);
    lastRound = state.round;
  }

  // Phase + timer
  const remaining = Math.max(0, Math.ceil((state.phaseEndsAt - state.now) / 1000));
  const isUrgent = remaining <= 3;
  hudPhase.classList.remove('phase-action', 'phase-reveal');
  hudTimer.classList.remove('urgent', 'reveal-timer');

  switch (state.status) {
    case 'PLANNING':
      hudPhase.textContent = '🎯 AIM';
      hudTimer.textContent = String(remaining);
      if (isUrgent) hudTimer.classList.add('urgent');
      hudDragHint.classList.toggle('hidden', moveLockedIn);
      // Aiming is ALWAYS enabled during planning — moves can be changed anytime
      game3d?.enableAiming(true);
      break;
    case 'REVEAL':
      hudPhase.textContent = '👀 REVEALING';
      hudTimer.textContent = String(remaining);
      hudPhase.classList.add('phase-reveal');
      hudTimer.classList.add('reveal-timer');
      hudDragHint.classList.add('hidden');
      game3d?.enableAiming(false);
      break;
    case 'ACTION':
      hudPhase.textContent = '💥 ACTION!';
      hudTimer.textContent = '—';
      hudPhase.classList.add('phase-action');
      hudDragHint.classList.add('hidden');
      hudMoveStatus.classList.add('hidden');
      moveLockedIn = false;
      game3d?.enableAiming(false);
      break;
    default:
      hudPhase.textContent = state.status;
      hudTimer.textContent = '';
  }
  if (state.status !== lastPhase) {
    if (state.status === 'ACTION') {
      playUiBeep(210, 0.09, 'square', 0.05);
      // No screen shake on action start — only shake on eliminations
    }
    if (state.status === 'REVEAL') {
      playUiBeep(760, 0.06);
    }
    lastPhase = state.status;
  }

  // Scoreboard
  const entries = Object.entries(players).filter(([,p]) => !p.isBot || p.isAlive);
  hudScoreboard.innerHTML = entries.map(([pid, p]) => `
    <div class="hud-sb-row ${p.isAlive ? '' : 'eliminated'}">
      <span class="hud-sb-dot" style="background:${p.color}"></span>
      <span class="hud-sb-name">${p.name}${pid === myId ? ' (You)' : ''}</span>
      <span class="hud-sb-status">${p.isAlive ? '●' : '☠'}</span>
    </div>
  `).join('');
}

// ─── Toast ───────────────────────────────────────────────────────
let toastTimeout = 0;
function showToast(msg: string, _color: string) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toastEl.classList.add('hidden'), 3000);
}

// ─── Game Over ───────────────────────────────────────────────────
function showGameOver(state: any) {
  const winner = state.winner;
  const rankings = state.rankings || [];

  if (winner) {
    goTitle.textContent = `${winner.name} wins!`;
    goSub.textContent   = 'Last one standing!';
    goBall.style.background = winner.color;
    goBall.style.display = 'block';
  } else {
    goTitle.textContent = `💥 It's a Draw!`;
    goSub.textContent   = 'Everyone fell off at the same time.';
    goBall.style.display = 'none'; // Clearer in draw
  }

  const p = loadProgress();
  const iWon = !!winner && winner.name === myName;
  if (iWon) {
    p.wins += 1;
    p.currentStreak += 1;
    p.maxStreak = Math.max(p.maxStreak, p.currentStreak);
    showHype(`WIN STREAK ${p.currentStreak}!`);
    playUiBeep(920, 0.1, 'triangle', 0.05);
    setTimeout(() => playUiBeep(1100, 0.11, 'triangle', 0.05), 90);
  } else {
    p.currentStreak = 0;
  }
  saveProgress(p);
  refreshChallengePill();
  const badges: string[] = [];
  if (iWon) badges.push('Clutch Winner');
  if ((state.rankings || []).length >= 5 && iWon) badges.push('Party King');
  if (p.currentStreak >= 2) badges.push(`Hot Streak x${p.currentStreak}`);
  if (!iWon && p.maxStreak >= 3) badges.push('Veteran Grinder');
  mvpBadges.innerHTML = badges.map(b => `<span class="mvp-badge">${b}</span>`).join('');

  // Clear and fill rankings
  goRankings.innerHTML = '';
  const medals = ['🥇', '🥈', '🥉'];
  rankings.forEach((r: any, i: number) => {
    const row = document.createElement('div');
    row.className = `ranking-row rank-${i + 1}`;
    
    // Position badge — medal emoji for top 3, number otherwise
    const pos = document.createElement('div');
    pos.className = 'ranking-pos';
    pos.textContent = i < 3 ? medals[i] : String(i + 1);

    // Color dot avatar
    const svg = document.createElement('div');
    svg.className = 'ranking-avatar';
    svg.style.backgroundColor = r.color;

    const name = document.createElement('div');
    name.className = 'ranking-name';
    name.textContent = r.name;

    row.append(pos, svg, name);
    goRankings.appendChild(row);
  });

  showPage('gameover');
}
