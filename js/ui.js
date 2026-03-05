import { SPRITES, drawSprite } from "./sprites.js";

export function getElements() {
  const ids = [
    "dayTxt","progressTxt","budgetTxt","trustTxt","apTxt","weatherTxt",
    "comboTxt","dayBar","progressBar","budgetBar","trustBar","apBar","comboBar","turnChip",
    "eventMeta","eventTitle","eventBody","opt1","opt2","opt3",
    "clashVal","bcfVal","chaosVal","aiVal","startBtn","nextDayBtn",
    "clashBtn","iceBtn","aiBtn","roleNote","rosterBox","logBox",
    "overlay","overlayStart","building","stage","drone","pixelScene"
  ];
  return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
}

export function buildModules(el) {
  el.building.innerHTML = "";
  for (let i = 0; i < 20; i += 1) {
    const node = document.createElement("div");
    node.className = "mod";
    el.building.appendChild(node);
  }
}

export function renderLogs(el, logs) {
  el.logBox.innerHTML = logs.map(x => `<div class="log ${x.tone || ""}">${x.text}</div>`).join("");
}

export function renderClashSpots(el, clashSpots, onClick) {
  [...el.stage.querySelectorAll(".clash-hit")].forEach(n => n.remove());
  clashSpots.forEach(spot => {
    const b = document.createElement("button");
    b.className = "clash-hit";
    b.type = "button";
    b.style.left = `${spot.x}%`;
    b.style.top = `${spot.y}%`;
    b.title = `Clash severity ${spot.severity}`;
    b.addEventListener("click", () => onClick(spot.id));
    el.stage.appendChild(b);
  });
}

function drawWeather(ctx, state, w, h) {
  if (state.weather === "SUN") {
    ctx.fillStyle = "#ffe27a";
    ctx.fillRect(36, 24, 18, 18);
  } else if (state.weather === "RAIN") {
    ctx.fillStyle = "#9cc8ff";
    for (let i = 0; i < 42; i += 1) {
      const x = (i * 17 + state.frame * 3) % w;
      const y = (i * 11 + state.frame * 6) % (h - 50);
      ctx.fillRect(x, y, 1, 5);
    }
  } else if (state.weather === "SNOW") {
    ctx.fillStyle = "#e8f6ff";
    for (let i = 0; i < 45; i += 1) {
      const x = (i * 23 + state.frame * 1.6) % w;
      const y = (i * 13 + state.frame * 2.1) % (h - 45);
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (state.weather === "WIND") {
    ctx.fillStyle = "#cde3ff";
    for (let i = 0; i < 14; i += 1) {
      const y = 20 + i * 12;
      const x = (state.frame * 6 + i * 27) % w;
      ctx.fillRect(x, y, 16, 1);
    }
  }
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
  ctx.fillRect(0, 90, w, 40);

  drawWeather(ctx, state, w, h);

  const skyline = [40, 62, 50, 68, 56, 74, 48, 60, 46, 70];
  ctx.fillStyle = "#42668f";
  skyline.forEach((v, i) => ctx.fillRect(i * 64, 130 - v, 42, v));

  ctx.fillStyle = "#4a6a34";
  ctx.fillRect(0, h - 42, w, 42);
  ctx.fillStyle = "#345027";
  for (let i = 0; i < w; i += 20) ctx.fillRect(i, h - 22, 10, 8);

  const floors = 10;
  const builtFloors = Math.max(1, Math.min(floors, Math.floor((state.day / 6) + (state.progress / 20))));
  const bx = 220;
  const by = h - 42;
  const bw = 210;
  const fh = 14;

  ctx.fillStyle = "#d0c17d";
  ctx.fillRect(bx - 26, by - (floors * fh) - 48, 8, floors * fh + 48);
  ctx.fillRect(bx - 26, by - (floors * fh) - 48, 130, 8);
  const hookX = bx + 16 + ((state.day * 7 + state.frame * 0.7) % 80);
  ctx.fillRect(hookX, by - (floors * fh) - 40, 2, 26);

  ctx.fillStyle = "#5b6673";
  ctx.fillRect(bx, by - floors * fh, bw, floors * fh);

  for (let f = 0; f < builtFloors; f += 1) {
    const y = by - (f + 1) * fh;
    ctx.fillStyle = f % 2 ? "#9aa8b8" : "#8e9cad";
    ctx.fillRect(bx + 2, y + 1, bw - 4, fh - 2);
    if (f < builtFloors - 1) {
      ctx.fillStyle = "#2f4f74";
      for (let x = bx + 12; x < bx + bw - 10; x += 24) ctx.fillRect(x, y + 4, 10, 6);
    }
  }

  ctx.fillStyle = "#c88a4d";
  ctx.fillRect(bx + 4, by - builtFloors * fh + 4, bw - 8, 2);

  // Moving pixel sprites from sprite-sheet definitions
  const truckX = 18 + ((state.frame * 1.8) % (w - 90));
  const exX = w - 90 - ((state.frame * 1.2) % 140);
  drawSprite(ctx, SPRITES.truck, truckX, h - 48, 2);
  drawSprite(ctx, SPRITES.excavator, exX, h - 52, 2);

  const workerX = bx + 20 + ((state.frame * 1.6 + state.day * 9 + state.chaos * 3) % (bw - 40));
  const workerY = by - builtFloors * fh + 2;
  drawSprite(ctx, SPRITES.worker, workerX, workerY, 2);

  ctx.fillStyle = "#0f2137";
  ctx.fillRect(10, 8, 300, 22);
  ctx.fillStyle = "#d8ecff";
  ctx.font = "bold 12px monospace";
  ctx.fillText(`DAY ${state.day}  BUILD ${builtFloors}/${floors}  WEATHER ${state.weather}`, 16, 23);
}
