import { roleDefs } from "./data.js";

export function createState() {
  return {
    day: 1,
    budget: 120,
    progress: 0,
    trust: 100,
    clashes: 6,
    bcf: 0,
    chaos: 3,
    aiCost: 0,
    ap: 3,
    maxAp: 3,
    combo: 0,
    comboBest: 0,
    lastClashFixMs: 0,
    running: false,
    ended: false,
    currentEvent: null,
    delayed: [],
    logs: [],
    maxClashSpike: 0,
    pipeHits: 0,
    ifcMissingDays: 0,
    unlocked: {},
    players: [],
    currentPlayerIdx: 0,
    clashSpots: [],
    nextClashId: 1,
    weather: "SUN",
    frame: 0,
    meeting: {
      mode: "meeting",
      active: false,
      timer: 0,
      total: 0,
      participants: [],
      bubbles: []
    }
  };
}

export function activePlayer(state) {
  return state.players[state.currentPlayerIdx] || null;
}

export function currentRole(state) {
  const p = activePlayer(state);
  return p ? roleDefs.find(r => r.id === p.role) || null : null;
}

export function roleName(roleId) {
  const role = roleDefs.find(r => r.id === roleId);
  return role ? role.name : roleId;
}

export function nextTurn(state) {
  if (state.players.length > 0) {
    state.currentPlayerIdx = (state.currentPlayerIdx + 1) % state.players.length;
  }
}

export function shuffleRoles() {
  const ids = roleDefs.map(r => r.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = ids[i];
    ids[i] = ids[j];
    ids[j] = t;
  }
  return ids;
}

export function clamp(state) {
  state.progress = Math.min(100, Math.max(0, state.progress));
  state.budget = Math.max(-99, state.budget);
  state.trust = Math.max(-99, state.trust);
  state.clashes = Math.max(0, state.clashes);
  state.chaos = Math.max(0, state.chaos);
  state.ap = Math.max(0, Math.min(state.maxAp, state.ap));
}

export function addLog(state, text, tone = "") {
  state.logs.unshift({ text, tone });
  state.logs = state.logs.slice(0, 90);
}

export function syncClashSpots(state) {
  const target = Math.min(36, Math.max(0, state.clashes));
  if (state.clashSpots.length > target) {
    state.clashSpots.length = target;
  }
  while (state.clashSpots.length < target) {
    state.clashSpots.push({
      id: state.nextClashId++,
      x: 8 + Math.random() * 84,
      y: 8 + Math.random() * 84,
      severity: 1 + Math.floor(Math.random() * 3)
    });
  }
}
