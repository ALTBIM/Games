import { MAX_DAY, roleDefs, events, achDefs } from "./data.js";
import {
  createState,
  activePlayer,
  currentRole,
  roleName,
  nextTurn,
  shuffleRoles,
  clamp,
  addLog,
  syncClashSpots
} from "./state.js";
import { getElements, buildModules, renderLogs, renderClashSpots, renderPixelScene } from "./ui.js";

const state = createState();
const el = getElements();
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, duration = 0.08, type = "sine", gain = 0.04, slide = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide !== 0) osc.frequency.linearRampToValueAtTime(freq + slide, t + duration);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function playFx(kind) {
  if (kind === "ok") {
    playTone(520, 0.08, "triangle", 0.045, 120);
  } else if (kind === "warn") {
    playTone(220, 0.11, "sawtooth", 0.035, -40);
  } else if (kind === "alarm") {
    playTone(720, 0.06, "square", 0.03, -140);
    setTimeout(() => playTone(680, 0.06, "square", 0.03, -120), 70);
  } else if (kind === "combo") {
    playTone(640, 0.06, "triangle", 0.045, 180);
    setTimeout(() => playTone(760, 0.06, "triangle", 0.045, 120), 70);
  } else {
    playTone(420, 0.05, "sine", 0.03, 30);
  }
}

function spendAp(cost) {
  if (state.ap < cost) {
    addLog(state, `Ikke nok AP. Trenger ${cost}, har ${state.ap}.`, "warn");
    playFx("warn");
    render();
    return false;
  }
  state.ap -= cost;
  return true;
}

function triggerEventAlarm() {
  el.stage.classList.remove("alarm");
  void el.stage.offsetWidth;
  el.stage.classList.add("alarm");
  setTimeout(() => el.stage.classList.remove("alarm"), 700);
  playFx("alarm");
}

function renderTwin() {
  const mods = [...el.building.querySelectorAll(".mod")];
  const done = Math.round((state.progress / 100) * mods.length);
  mods.forEach((m, i) => m.classList.toggle("done", i < done));

  renderClashSpots(el, state.clashSpots, resolveClashSpot);

  el.drone.style.left = `${Math.min(90, 8 + (state.day / MAX_DAY) * 84)}%`;
  el.drone.style.top = `${Math.min(84, 12 + (state.chaos / 60) * 70)}%`;
  el.drone.textContent = state.aiCost > 40 ? "BOB+" : "BOB";
}

function render() {
  clamp(state);
  syncClashSpots(state);

  el.dayTxt.textContent = `${state.day}/${MAX_DAY}`;
  el.progressTxt.textContent = `${state.progress}%`;
  el.budgetTxt.textContent = `${state.budget} MNOK`;
  el.trustTxt.textContent = `${state.trust}`;
  el.apTxt.textContent = `${state.ap}/${state.maxAp}`;
  el.comboTxt.textContent = `x${state.combo}`;

  el.dayBar.style.width = `${(state.day / MAX_DAY) * 100}%`;
  el.progressBar.style.width = `${state.progress}%`;
  el.budgetBar.style.width = `${Math.min(100, Math.max(0, (state.budget / 120) * 100))}%`;
  el.trustBar.style.width = `${Math.min(100, Math.max(0, state.trust))}%`;
  el.apBar.style.width = `${(state.ap / state.maxAp) * 100}%`;
  el.comboBar.style.width = `${Math.min(100, state.combo * 14)}%`;

  const p = activePlayer(state);
  el.turnChip.textContent = `Tur: ${p ? `${p.name} (${roleName(p.role)})` : "-"}`;
  el.clashVal.textContent = `${state.clashes}`;
  el.bcfVal.textContent = `${state.bcf}`;
  el.chaosVal.textContent = `${state.chaos}`;
  el.aiVal.textContent = `${state.aiCost}`;
  el.stage.classList.toggle("combo", state.combo >= 3);

  const ready = state.running && !state.ended;
  el.nextDayBtn.disabled = !ready;
  el.clashBtn.disabled = !ready;
  el.iceBtn.disabled = !ready;
  el.aiBtn.disabled = !ready;

  const hasEvent = !!state.currentEvent && ready;
  el.opt1.disabled = !hasEvent || state.ap < 1;
  el.opt2.disabled = !hasEvent || state.ap < 1;
  el.opt3.disabled = !hasEvent || state.ap < 1;

  const role = currentRole(state);
  el.roleNote.textContent = role ? `${p.name} spiller ${role.name}. Bonus: ${role.note}` : "Hotseat ikke startet.";
  el.rosterBox.innerHTML = state.players.length
    ? state.players.map((pl, i) => `<div class="prow ${i === state.currentPlayerIdx ? "a" : ""}"><span>${pl.name} (${roleName(pl.role)})</span><span>${pl.points} p</span></div>`).join("")
    : `<div class="prow"><span>Ingen spillere aktive</span><span>-</span></div>`;

  renderTwin();
  renderPixelScene(el, state);
  renderLogs(el, state.logs);
}

function pickEvent() {
  return JSON.parse(JSON.stringify(events[Math.floor(Math.random() * events.length)]));
}

function presentEvent() {
  state.currentEvent = pickEvent();
  const e = state.currentEvent;
  el.eventMeta.textContent = `Fag: ${e.team}`;
  el.eventTitle.textContent = e.title;
  el.eventBody.textContent = e.body;
  el.opt1.textContent = `${e.options[0].label} (1 AP)`;
  el.opt2.textContent = `${e.options[1].label} (1 AP)`;
  el.opt3.textContent = `${e.options[2].label} (1 AP)`;
  triggerEventAlarm();
  render();
}

function dailyChaos() {
  if (state.clashes > 10) {
    const hit = Math.floor(state.clashes / 3);
    state.budget -= hit;
    state.trust -= Math.ceil(hit / 2);
    state.pipeHits += hit;
    addLog(state, `Byggeplass-modus: ${hit} improviserte kutt pa ror/kanaler.`, "bad");
  }
  if (state.chaos > 35) {
    state.progress -= 2;
    addLog(state, "Kaosnivaet spiste fremdriften i dag.", "warn");
  }
  if (Math.random() < 0.15 + state.chaos * 0.005) {
    state.ifcMissingDays += 1;
    state.trust -= 3;
    addLog(state, "PDF-helvete: teamet jobbet i feil underlag.", "bad");
  }
}

function resolveDelayed() {
  for (const d of state.delayed) d.inDays -= 1;
  const due = state.delayed.filter(d => d.inDays <= 0);
  state.delayed = state.delayed.filter(d => d.inDays > 0);
  due.forEach(d => {
    if (d.budget) state.budget += d.budget;
    if (d.trust) state.trust += d.trust;
    if (d.clashes) {
      state.clashes += d.clashes;
      state.maxClashSpike = Math.max(state.maxClashSpike, d.clashes);
    }
    addLog(state, d.text, "bad");
  });
}

function checkAchievements() {
  achDefs.forEach(a => {
    if (!state.unlocked[a.key] && a.check(state)) {
      state.unlocked[a.key] = true;
      addLog(state, `Achievement: ${a.label}`, "good");
    }
  });
}

function achievementHtml() {
  const unlocked = achDefs.filter(a => state.unlocked[a.key]).map(a => a.label);
  return unlocked.length ? unlocked.map(x => `<div class="ach">${x}</div>`).join("") : `<div class="ach">Ingen achievements last opp.</div>`;
}

function applyRoleBonus(label) {
  const r = currentRole(state);
  if (!r) return;
  const l = label.toLowerCase();
  if (r.id === "BIM" && (l.includes("bcf") || l.includes("ice"))) state.trust += 1;
  if (r.id === "ARK" && (l.includes("endring") || l.includes("plan") || l.includes("rekoordiner"))) state.progress += 1;
  if (r.id === "ARK" && l.includes("ignorer")) state.trust -= 1;
  if (r.id === "RIB" && (l.includes("korriger") || l.includes("bcf"))) state.clashes = Math.max(0, state.clashes - 1);
  if (r.id === "RIV" && (l.includes("send bcf") || l.includes("kall inn"))) state.chaos = Math.max(0, state.chaos - 1);
}

function endScreen(title, body) {
  const rank = [...state.players].sort((a, b) => b.points - a.points);
  const rankHtml = rank.length ? rank.map((p, i) => `<div class="ach">${i + 1}. ${p.name} (${roleName(p.role)}) - ${p.points} p</div>`).join("") : "";
  el.overlay.innerHTML = `<div class="cardov"><h3>${title}</h3><p>${body}</p><div class="achs">${rankHtml}</div><div class="achs">${achievementHtml()}</div><button id="restartOverlayBtn">Spill igjen</button></div>`;
  el.overlay.style.display = "grid";
  document.getElementById("restartOverlayBtn").addEventListener("click", showSetup);
}

function checkEnd() {
  clamp(state);
  if (state.progress >= 100 && state.budget > 0 && state.trust > 0) {
    state.ended = true;
    state.running = false;
    endScreen("Prosjekt levert", `Ferdig pa dag ${Math.min(state.day, MAX_DAY)} med budsjett ${state.budget} MNOK og tillit ${state.trust}.`);
    return;
  }
  if (state.budget <= 0) {
    state.ended = true;
    state.running = false;
    endScreen("Tapt: Budsjettsprekk", "Okonomien kollapset.");
    return;
  }
  if (state.trust <= 0) {
    state.ended = true;
    state.running = false;
    endScreen("Tapt: Tillit borte", "Byggherre mistet tilliten.");
    return;
  }
  if (state.day > MAX_DAY && state.progress < 100) {
    state.ended = true;
    state.running = false;
    endScreen("Tapt: Fremdrift stoppet", "Du rakk ikke ferdigstillelse innen dag 60.");
  }
}

function resolveClashSpot(spotId) {
  if (!state.running || state.ended) return;
  if (!spendAp(1)) return;

  const idx = state.clashSpots.findIndex(s => s.id === spotId);
  if (idx < 0) return;
  const spot = state.clashSpots[idx];
  state.clashSpots.splice(idx, 1);

  state.clashes = Math.max(0, state.clashes - 1);
  state.bcf += 1;
  if (spot.severity >= 2 && Math.random() < 0.45) state.trust += 1;
  const now = performance.now();
  if (now - state.lastClashFixMs <= 1600) {
    state.combo += 1;
  } else {
    state.combo = 1;
  }
  state.lastClashFixMs = now;
  state.comboBest = Math.max(state.comboBest, state.combo);
  if (state.combo >= 3) {
    state.progress += 1;
    if (state.combo % 2 === 0) state.trust += 1;
  }

  const p = activePlayer(state);
  const comboBonus = Math.max(0, state.combo - 1);
  if (p) p.points += 2 + spot.severity + comboBonus;
  addLog(state, `Direkte clash fix (${spot.severity}) ${p ? `av ${p.name}` : ""}. Combo x${state.combo}.`, "good");
  playFx(state.combo >= 3 ? "combo" : "ok");

  checkEnd();
  render();
}

function closeDay() {
  resolveDelayed();
  dailyChaos();
  state.progress += Math.max(1, 4 - Math.floor(state.clashes / 9));
  state.budget -= Math.max(1, Math.floor(state.chaos / 10));
  const r = currentRole(state);
  if (r && r.id === "ENT") {
    state.progress += 1;
    if (state.clashes > 20) state.chaos += 1;
  }
  state.day += 1;
  state.ap = state.maxAp;
  state.combo = 0;
  state.lastClashFixMs = 0;
  state.currentEvent = null;
  checkAchievements();
  checkEnd();
  if (!state.ended) presentEvent();
  render();
}

function chooseOption(i) {
  if (!state.currentEvent || state.ended) return;
  if (!spendAp(1)) return;

  const before = state.clashes;
  const option = state.currentEvent.options[i];
  option.effect(state);
  applyRoleBonus(option.label);

  const d = state.clashes - before;
  if (d > 0) state.maxClashSpike = Math.max(state.maxClashSpike, d);
  const p = activePlayer(state);
  if (p) p.points += Math.max(1, 4 - Math.floor(Math.max(0, d) / 3));

  addLog(state, `Event-kort: ${option.label} (${p ? p.name : "solo"})`, d > 2 ? "warn" : "good");
  playFx(d > 2 ? "warn" : "ok");
  state.currentEvent = null;
  nextTurn(state);
  checkEnd();
  render();
}

function doClashDetection() {
  if (state.ended) return;
  if (!spendAp(1)) return;

  const found = 3 + Math.floor(Math.random() * 8) + Math.floor(state.chaos / 12);
  state.clashes += found;
  state.budget -= 1;
  const r = currentRole(state);
  if (r && r.id === "RIB") state.clashes = Math.max(0, state.clashes - 1);
  state.maxClashSpike = Math.max(state.maxClashSpike, found);
  addLog(state, `Clash detection fant ${found} nye konflikter.`, "warn");
  playFx("warn");
  render();
}

function doIceMeeting() {
  if (state.ended) return;
  if (!spendAp(2)) return;

  state.budget -= 3;
  const x = Math.random();
  if (x < 0.25) {
    state.trust -= 4;
    state.chaos += 4;
    addLog(state, "ICE-mote fail: feil folk, feil modell.", "bad");
    playFx("warn");
  } else if (x < 0.75) {
    const fixed = 3 + Math.floor(Math.random() * 4);
    state.clashes = Math.max(0, state.clashes - fixed);
    state.bcf += 2;
    state.trust += 2;
    const r = currentRole(state);
    if (r && r.id === "RIV") state.chaos = Math.max(0, state.chaos - 1);
    addLog(state, `ICE-mote ga enighet. Lukkede ${fixed} clashes.`, "good");
    playFx("ok");
  } else {
    const fixed = 7 + Math.floor(Math.random() * 4);
    state.clashes = Math.max(0, state.clashes - fixed);
    state.trust += 6;
    state.progress += 3;
    addLog(state, `Mirakelmote! ${fixed} clashes borte.`, "good");
    playFx("combo");
  }
  checkEnd();
  render();
}

function doAI() {
  if (state.ended) return;
  if (!spendAp(2)) return;

  let cost = 2 + Math.floor(state.aiCost / 5);
  const r = currentRole(state);
  if (r && r.id === "RIE") cost = Math.max(1, cost - 1);

  state.aiCost += 5;
  state.budget -= cost;
  const fixed = 2 + Math.floor(Math.random() * 5);
  state.clashes = Math.max(0, state.clashes - fixed);
  state.bcf += 3;
  state.trust += 1;
  addLog(state, `BOB AI foreslo tiltak. ${fixed} clashes redusert. -${cost} MNOK.`, "good");
  playFx("ok");
  checkEnd();
  render();
}

function resetGame(setup = null) {
  let players = [];
  if (Array.isArray(setup) && setup.length) {
    players = setup.map((p, i) => ({ name: (p.name || `Spiller ${i + 1}`).trim(), role: p.role || roleDefs[i % roleDefs.length].id, points: 0 }));
  } else {
    const roles = shuffleRoles();
    players = [{ name: "Spiller 1", role: roles[0], points: 0 }];
  }

  Object.assign(state, createState(), { running: true, players, currentPlayerIdx: 0 });
  el.overlay.style.display = "none";
  addLog(state, `Hotseat startet med ${players.length} spillere.`, "warn");
  presentEvent();
  render();
}

function showSetup() {
  const opts = roleDefs.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  el.overlay.innerHTML = `<div class="cardov"><h3>Velg spillere og roller</h3><p>Lokal multiplayer med turbytte.</p><div class="setup"><label>Antall spillere (1-6)<input id="setupCount" type="number" min="1" max="6" value="2"/></label><div id="setupPlayers"></div></div><button id="setupStartBtn">Start hotseat</button></div>`;
  el.overlay.style.display = "grid";

  const countInput = document.getElementById("setupCount");
  const playersWrap = document.getElementById("setupPlayers");
  const setupStartBtn = document.getElementById("setupStartBtn");

  function draw() {
    const c = Math.max(1, Math.min(6, Number(countInput.value) || 1));
    let html = "";
    for (let i = 0; i < c; i += 1) {
      html += `<div class="row"><input data-kind="name" type="text" value="Spiller ${i + 1}"/><select data-kind="role">${opts}</select></div>`;
    }
    playersWrap.innerHTML = html;
  }

  countInput.addEventListener("input", draw);
  draw();

  setupStartBtn.addEventListener("click", () => {
    const names = [...playersWrap.querySelectorAll('input[data-kind="name"]')];
    const roles = [...playersWrap.querySelectorAll('select[data-kind="role"]')];
    const used = new Set();
    const setup = [];

    for (let i = 0; i < names.length; i += 1) {
      const name = (names[i].value || "").trim() || `Spiller ${i + 1}`;
      const role = roles[i].value;
      if (used.has(role)) {
        alert("Hver spiller maa ha unik rolle.");
        return;
      }
      used.add(role);
      setup.push({ name, role });
    }

    resetGame(setup);
  });
}

el.startBtn.addEventListener("click", () => {
  if (!state.running || state.ended) showSetup();
});
el.nextDayBtn.addEventListener("click", closeDay);
el.clashBtn.addEventListener("click", doClashDetection);
el.iceBtn.addEventListener("click", doIceMeeting);
el.aiBtn.addEventListener("click", doAI);
el.opt1.addEventListener("click", () => chooseOption(0));
el.opt2.addEventListener("click", () => chooseOption(1));
el.opt3.addEventListener("click", () => chooseOption(2));
el.overlayStart.addEventListener("click", showSetup);
window.addEventListener("pointerdown", ensureAudio, { once: true });

buildModules(el);
addLog(state, "Trykk Start prosjekt og spill ved a klikke clashes + bruke action-kort.");
render();
