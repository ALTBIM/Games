export function getElements() {
  const ids = [
    "dayTxt","progressTxt","budgetTxt","trustTxt","apTxt",
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

export function renderPixelScene(el, state) {
  const c = el.pixelScene;
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const w = c.width;
  const h = c.height;
  ctx.imageSmoothingEnabled = false;

  // Sky
  ctx.fillStyle = "#7ecbff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#4f8fd1";
  ctx.fillRect(0, 90, w, 40);

  // Sun
  ctx.fillStyle = "#ffe27a";
  ctx.fillRect(36, 24, 18, 18);

  // Skyline blocks
  const skyline = [40, 62, 50, 68, 56, 74, 48, 60, 46, 70];
  ctx.fillStyle = "#42668f";
  skyline.forEach((v, i) => {
    ctx.fillRect(i * 64, 130 - v, 42, v);
  });

  // Ground
  ctx.fillStyle = "#4a6a34";
  ctx.fillRect(0, h - 42, w, 42);
  ctx.fillStyle = "#345027";
  for (let i = 0; i < w; i += 20) ctx.fillRect(i, h - 22, 10, 8);

  // Construction progress
  const floors = 10;
  const builtFloors = Math.max(1, Math.min(floors, Math.floor((state.day / 6) + (state.progress / 20))));
  const bx = 220;
  const by = h - 42;
  const bw = 210;
  const fh = 14;

  // Crane
  ctx.fillStyle = "#d0c17d";
  ctx.fillRect(bx - 26, by - (floors * fh) - 48, 8, floors * fh + 48);
  ctx.fillRect(bx - 26, by - (floors * fh) - 48, 130, 8);
  const hookX = bx + 16 + (state.day * 7 % 80);
  ctx.fillRect(hookX, by - (floors * fh) - 40, 2, 26);

  // Building frame
  ctx.fillStyle = "#5b6673";
  ctx.fillRect(bx, by - floors * fh, bw, floors * fh);

  for (let f = 0; f < builtFloors; f += 1) {
    const y = by - (f + 1) * fh;
    ctx.fillStyle = f % 2 ? "#9aa8b8" : "#8e9cad";
    ctx.fillRect(bx + 2, y + 1, bw - 4, fh - 2);
    // windows on finished floors
    if (f < builtFloors - 1) {
      ctx.fillStyle = "#2f4f74";
      for (let x = bx + 12; x < bx + bw - 10; x += 24) ctx.fillRect(x, y + 4, 10, 6);
    }
  }

  // Unfinished top floor scaffolding
  ctx.fillStyle = "#c88a4d";
  ctx.fillRect(bx + 4, by - builtFloors * fh + 4, bw - 8, 2);

  // Worker sprite
  const workerX = bx + 20 + ((state.day * 9 + state.chaos * 3) % (bw - 40));
  const workerY = by - builtFloors * fh + 2;
  ctx.fillStyle = "#20374f";
  ctx.fillRect(workerX, workerY + 6, 6, 6);
  ctx.fillStyle = "#ffcf7b";
  ctx.fillRect(workerX + 1, workerY + 1, 4, 4);
  ctx.fillStyle = "#e96a52";
  ctx.fillRect(workerX + 1, workerY + 5, 4, 2);

  // HUD text
  ctx.fillStyle = "#0f2137";
  ctx.fillRect(10, 8, 230, 22);
  ctx.fillStyle = "#d8ecff";
  ctx.font = "bold 12px monospace";
  ctx.fillText(`DAY ${state.day}  BUILD ${builtFloors}/${floors}`, 16, 23);
}
