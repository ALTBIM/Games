export function getElements() {
  const ids = [
    "dayTxt","progressTxt","budgetTxt","trustTxt","apTxt",
    "comboTxt","dayBar","progressBar","budgetBar","trustBar","apBar","comboBar","turnChip",
    "eventMeta","eventTitle","eventBody","opt1","opt2","opt3",
    "clashVal","bcfVal","chaosVal","aiVal","startBtn","nextDayBtn",
    "clashBtn","iceBtn","aiBtn","roleNote","rosterBox","logBox",
    "overlay","overlayStart","building","stage","drone"
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
