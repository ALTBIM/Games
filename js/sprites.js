export const SPRITES = {
  worker: [
    "..yy..",
    "..yy..",
    "..rr..",
    ".bbbb.",
    ".b..b.",
    ".b..b.",
    "..bb.."
  ],
  truck: [
    "................",
    "..oooooooooo....",
    ".oooooooooooo...",
    ".oo....oo..oo...",
    ".oooooooooooo...",
    "...ww....ww....."
  ],
  excavator: [
    ".......y........",
    "......yy........",
    ".....yyyy.......",
    "..ooooooo.......",
    ".oooooooooo......",
    ".oo....oo........",
    "..ww..ww........."
  ]
};

const DEFAULT_PALETTE = {
  y: "#ffd57a",
  r: "#f0735b",
  b: "#1f3856",
  o: "#d08a4d",
  w: "#2d4056",
  g: "#66a050"
};

export function drawSprite(ctx, sprite, x, y, scale = 2, palette = DEFAULT_PALETTE) {
  for (let row = 0; row < sprite.length; row += 1) {
    for (let col = 0; col < sprite[row].length; col += 1) {
      const key = sprite[row][col];
      if (key === ".") continue;
      ctx.fillStyle = palette[key] || "#ffffff";
      ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
    }
  }
}
