// LeWorld graphics core: shared palette, canvas helpers and the pixel-map sprite builder.
// Everything is drawn at a low internal resolution and scaled up with nearest-neighbour.
window.LW = window.LW || {};

LW.VIEW_W = 320;        // grows on wider screens (phones), see game.js fit()
LW.MIN_VIEW_W = 320;
LW.MAX_VIEW_W = 400;
LW.VIEW_H = 180;
LW.TILE = 16;
LW.HUD_H = 20;          // height of the in-game top bar

// Shared palette. Single characters are used as keys inside pixel maps.
LW.PAL = {
  k: '#1a1423', // outline / ink
  w: '#fff8e7', // warm white
  W: '#d9d0c0', // white shade
  s: '#f4b98c', // light skin
  S: '#cf8558', // light skin shade
  n: '#9a5b36', // brown skin
  N: '#6e3c22', // brown skin shade
  h: '#3b2a22', // dark hair
  H: '#7d6a5e', // shaved undercut
  r: '#e0383e', // flannel red
  R: '#8f1d33', // flannel dark
  j: '#3d63c4', // denim
  J: '#26407f', // denim shade
  b: '#7a4520', // boot leather
  B: '#4a2812', // boot shade
  y: '#5a3a1f', // belt
  g: '#ffd23f', // gold
  G: '#c9971c', // gold shade
  c: '#fbe38e', // blonde hair (Chloe)
  C: '#d4a03c', // blonde shade
  v: '#bf8bea', // lavender
  V: '#8456c0', // lavender shade
  L: '#d8204c', // lipstick red
  p: '#ff7eb6', // pink
  P: '#c94a86', // pink shade
  m: '#a8434f', // mouth
  e: '#8b8ba0', // grey
  E: '#55556a', // grey shade
  o: '#6f7d3a', // olive
  O: '#454f24', // olive shade
  t: '#e0bf84', // tan
  T: '#a8854c', // tan shade
  u: '#4fb3ff', // sky blue
  U: '#2a6fd0', // blue shade
  z: '#2b2633', // black suit
  Z: '#4a4458', // suit highlight
  q: '#6a3fbf', // purple
  Q: '#3e2382', // purple shade
  f: '#46c25a', // green
  F: '#22803a', // green shade
  a: '#ff9a3c', // orange
  A: '#c4621a', // orange shade
  i: '#c9cad6', // light grey / steel
  I: '#9496a8', // steel shade
  x: '#5fe0d8', // teal
  X: '#2a9c96'  // teal shade
};
LW.OUTLINE = LW.PAL.k;

LW.makeCanvas = function (w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
};

// Deterministic RNG so procedural tiles/backgrounds are identical every load.
LW.rng = function (seed) {
  let s = seed >>> 0 || 1;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
};

LW.hexToRgb = function (hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Build a canvas from rows of palette characters. '.' or ' ' is transparent.
// opts.outline: true adds a 1px outline around opaque pixels (4-neighbour), so maps
// can be authored as flat colour fills with only interior detail lines.
LW.fromMap = function (rows, opts) {
  opts = opts || {};
  const pal = Object.assign({}, LW.PAL, opts.pal || {});
  const h = rows.length;
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const c = LW.makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const solid = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) continue;
      const [r, g, b] = LW.hexToRgb(col);
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
      solid[y * w + x] = 1;
    }
  }
  if (opts.outline !== false) {
    const [r, g, b] = LW.hexToRgb(opts.outlineColor || LW.OUTLINE);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (solid[y * w + x]) continue;
        const n = (x > 0 && solid[y * w + x - 1]) || (x < w - 1 && solid[y * w + x + 1]) ||
                  (y > 0 && solid[(y - 1) * w + x]) || (y < h - 1 && solid[(y + 1) * w + x]);
        if (n) {
          const i = (y * w + x) * 4;
          img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
};

LW.flipCanvas = function (src) {
  const c = LW.makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
};

// Recolour a canvas: every pixel of colour `from` becomes `to` (hex strings).
LW.recolor = function (src, map) {
  const c = LW.makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const pairs = Object.keys(map).map(k => [LW.hexToRgb(k), LW.hexToRgb(map[k])]);
  for (let i = 0; i < img.data.length; i += 4) {
    if (!img.data[i + 3]) continue;
    for (const [f, t] of pairs) {
      if (img.data[i] === f[0] && img.data[i + 1] === f[1] && img.data[i + 2] === f[2]) {
        img.data[i] = t[0]; img.data[i + 1] = t[1]; img.data[i + 2] = t[2];
        break;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
};

// A solid-white silhouette of a sprite, used for hit flashes.
LW.silhouette = function (src, color) {
  const c = LW.makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color || '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
};

// Filled pixel-art rectangle with optional 1px border.
LW.box = function (ctx, x, y, w, h, fill, border) {
  if (border) { ctx.fillStyle = border; ctx.fillRect(x, y, w, h); x++; y++; w -= 2; h -= 2; }
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
};

// Rounded pixel box (corners cut by one pixel) - used for chat bubbles and panels.
LW.roundBox = function (ctx, x, y, w, h, fill, border) {
  ctx.fillStyle = border || fill;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  if (border) {
    ctx.fillStyle = fill;
    ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
    ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
  }
};
