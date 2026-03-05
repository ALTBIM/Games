import { SPRITES, drawSprite } from "./sprites.js";

export function getElements() {
  const ids = [
    "dayTxt","progressTxt","budgetTxt","trustTxt","apTxt","weatherTxt","comboTxt",
    "dayBar","progressBar","budgetBar","trustBar","apBar","turnChip",
    "eventMeta","eventTitle","eventBody","sceneOpt1","sceneOpt2","sceneOpt3",
    "sceneActClash","sceneActIce","sceneActAi","sceneActNext",
    "clashVal","bcfVal","chaosVal","aiVal","startBtn","nextDayBtn",
    "clashBtn","iceBtn","aiBtn","roleNote","rosterBox","logBox",
    "overlay","overlayStart","sceneOverlay","sceneChoices","sceneWrap","pixelScene"
  ];
  return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
}

export function renderLogs(el, logs) {
  el.logBox.innerHTML = logs.map(x => `<div class="log ${x.tone || ""}">${x.text}</div>`).join("");
}

export function renderClashSpots(el, clashSpots, onClick) {
  [...el.sceneOverlay.querySelectorAll(".clash-hit")].forEach(n => n.remove());
  clashSpots.forEach(spot => {
    const b = document.createElement("button");
    b.className = "clash-hit";
    b.type = "button";
    b.style.left = `${spot.x}%`;
    b.style.top = `${spot.y}%`;
    b.title = `Clash severity ${spot.severity}`;
    b.addEventListener("click", () => onClick(spot.id));
    el.sceneOverlay.appendChild(b);
  });
}

function drawWeather(ctx, state, w, h) {
  if (state.weather === "SUN") {
    ctx.fillStyle = "#ffe27a";
    ctx.fillRect(36, 24, 18, 18);
  } else if (state.weather === "RAIN") {
    ctx.fillStyle = "#9cc8ff";
    for (let i = 0; i < 70; i += 1) {
      const x = (i * 17 + state.frame * 4) % w;
      const y = (i * 13 + state.frame * 8) % (h - 70);
      ctx.fillRect(x, y, 1, 6);
    }
  } else if (state.weather === "SNOW") {
    ctx.fillStyle = "#e8f6ff";
    for (let i = 0; i < 60; i += 1) {
      const x = (i * 23 + state.frame * 1.9) % w;
      const y = (i * 15 + state.frame * 2.2) % (h - 60);
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (state.weather === "WIND") {
    ctx.fillStyle = "#cde3ff";
    for (let i = 0; i < 18; i += 1) {
      const y = 25 + i * 16;
      const x = (state.frame * 7 + i * 41) % w;
      ctx.fillRect(x, y, 20, 1);
    }
  }
}

function drawSpeechBubble(ctx, x, y, text) {
  const pad = 6;
  ctx.font = "bold 10px monospace";
  const tw = Math.min(180, ctx.measureText(text).width + pad * 2);
  const th = 18;
  ctx.fillStyle = "#f4fbff";
  ctx.fillRect(x, y, tw, th);
  ctx.fillStyle = "#0f2036";
  ctx.fillRect(x + 5, y + th, 6, 4);
  ctx.fillStyle = "#0f2036";
  ctx.fillText(text.slice(0, 28), x + pad, y + 12);
}

function drawMeeting(ctx, state, w, h) {
  const meetingMode = state.meeting.mode === "meeting";
  const tableX = w / 2 - 110;
  const tableY = h - 140;
  if (meetingMode) {
    ctx.fillStyle = "#a86d44";
    ctx.fillRect(tableX, tableY, 220, 26);
    ctx.fillStyle = "#7c4f31";
    ctx.fillRect(tableX + 14, tableY + 26, 8, 24);
    ctx.fillRect(tableX + 198, tableY + 26, 8, 24);
  }

  const people = state.meeting.participants;
  const t = state.meeting.total > 0 ? 1 - (state.meeting.timer / state.meeting.total) : 1;
  const ease = t * (2 - t);

  people.forEach((p, i) => {
    const target = meetingMode
      ? [
        { x: tableX - 28, y: tableY + 2 },
        { x: tableX + 40, y: tableY - 14 },
        { x: tableX + 130, y: tableY - 14 },
        { x: tableX + 212, y: tableY + 2 },
        { x: tableX + 70, y: tableY + 20 },
        { x: tableX + 150, y: tableY + 20 }
      ][i % 6]
      : [
        { x: w * 0.28, y: h - 120 },
        { x: w * 0.4, y: h - 112 },
        { x: w * 0.52, y: h - 118 },
        { x: w * 0.64, y: h - 110 },
        { x: w * 0.76, y: h - 116 },
        { x: w * 0.18, y: h - 110 }
      ][i % 6];

    const start = { x: (i % 2 ? w + 40 : -40), y: h - 64 - i * 3 };
    const x = start.x + (target.x - start.x) * ease;
    const y = start.y + (target.y - start.y) * ease;
    drawSprite(ctx, SPRITES.worker, x, y, 2);

    if (state.meeting.bubbles[i] && state.meeting.timer > state.meeting.total * 0.22) {
      drawSpeechBubble(ctx, x - 8, y - 22, state.meeting.bubbles[i]);
    }
  });
}

export function renderPixelScene(el, state) {
  const c = el.pixelScene;
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const w = c.width;
  const h = c.height;
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#7ecbff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#4f8fd1";
  ctx.fillRect(0, 170, w, 76);

  drawWeather(ctx, state, w, h);

  const skyline = [60, 82, 70, 88, 76, 94, 68, 80, 66, 90, 58, 86, 72, 92, 64];
  ctx.fillStyle = "#42668f";
  skyline.forEach((v, i) => ctx.fillRect(i * 70, 246 - v, 48, v));

  ctx.fillStyle = "#4a6a34";
  ctx.fillRect(0, h - 70, w, 70);
  ctx.fillStyle = "#345027";
  for (let i = 0; i < w; i += 24) ctx.fillRect(i, h - 30, 12, 10);

  const floors = 12;
  const builtFloors = Math.max(1, Math.min(floors, Math.floor((state.day / 5) + (state.progress / 18))));
  const bx = 310;
  const by = h - 70;
  const bw = 320;
  const fh = 18;

  ctx.fillStyle = "#d0c17d";
  ctx.fillRect(bx - 34, by - (floors * fh) - 60, 10, floors * fh + 60);
  ctx.fillRect(bx - 34, by - (floors * fh) - 60, 180, 10);
  const hookX = bx + 20 + ((state.day * 10 + state.frame * 0.9) % 130);
  ctx.fillRect(hookX, by - (floors * fh) - 50, 2, 36);

  ctx.fillStyle = "#5b6673";
  ctx.fillRect(bx, by - floors * fh, bw, floors * fh);

  for (let f = 0; f < builtFloors; f += 1) {
    const y = by - (f + 1) * fh;
    ctx.fillStyle = f % 2 ? "#9aa8b8" : "#8e9cad";
    ctx.fillRect(bx + 2, y + 1, bw - 4, fh - 2);
    if (f < builtFloors - 1) {
      ctx.fillStyle = "#2f4f74";
      for (let x = bx + 16; x < bx + bw - 12; x += 28) ctx.fillRect(x, y + 5, 12, 7);
    }
  }

  ctx.fillStyle = "#c88a4d";
  ctx.fillRect(bx + 8, by - builtFloors * fh + 6, bw - 16, 3);

  const truckX = 24 + ((state.frame * 2.1) % (w - 130));
  const exX = w - 120 - ((state.frame * 1.35) % 180);
  drawSprite(ctx, SPRITES.truck, truckX, h - 72, 3);
  drawSprite(ctx, SPRITES.excavator, exX, h - 78, 3);

  if (state.meeting.active) {
    drawMeeting(ctx, state, w, h);
  } else {
    const workerX = bx + 26 + ((state.frame * 1.8 + state.day * 11 + state.chaos * 4) % (bw - 50));
    const workerY = by - builtFloors * fh + 4;
    drawSprite(ctx, SPRITES.worker, workerX, workerY, 3);
  }

  ctx.fillStyle = "#0f2137";
  ctx.fillRect(12, 10, 390, 24);
  ctx.fillStyle = "#d8ecff";
  ctx.font = "bold 12px monospace";
  ctx.fillText(`DAY ${state.day} BUILD ${builtFloors}/${floors} WEATHER ${state.weather}`, 18, 26);
}
