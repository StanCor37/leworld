// Pixel fonts. 'big' (5x7, proportional) is the default for anything people read;
// 'small' (3x5, monospaced) is for text that is part of the world art (signs, billboards).
// Lowercase is drawn as uppercase.
LW.Font = (function () {
  const SMALL = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
    E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
    I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
    Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
    8: '111101111101111', 9: '111101111001110',
    '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010',
    "'": '010010000000000', '"': '101101000000000', ':': '000010000010000', ';': '000010000010100',
    '-': '000000111000000', '+': '000010111010000', '/': '001001010100100', '(': '010100100100010',
    ')': '010001001001010', '&': '010101010101011', '%': '101001010100101', '=': '000111000111000',
    '*': '000101010101000', '#': '101111101111101', '<': '001010100010001', '>': '100010001010100',
    '_': '000000000000111', '@': '010101111100011', '~': '000011110000000',
    '♥': '101111111010000', ' ': '000000000000000'
  };

  // 5x7: seven rows of five bits.
  const B = {
    A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
    C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
    E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
    G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
    I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
    K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
    M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
    O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
    Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
    S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
    U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
    W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
    Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
    0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
    2: '01110 10001 00001 00010 00100 01000 11111', 3: '11111 00010 00100 00010 00001 10001 01110',
    4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
    6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
    8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
    '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000',
    '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100',
    "'": '00100 00100 01000 00000 00000 00000 00000', '"': '01010 01010 01010 00000 00000 00000 00000',
    ':': '00000 01100 01100 00000 01100 01100 00000', ';': '00000 01100 01100 00000 01100 00100 01000',
    '-': '00000 00000 00000 11111 00000 00000 00000', '+': '00000 00100 00100 11111 00100 00100 00000',
    '/': '00001 00010 00010 00100 01000 01000 10000', '(': '00010 00100 01000 01000 01000 00100 00010',
    ')': '01000 00100 00010 00010 00010 00100 01000', '&': '01100 10010 10100 01000 10101 10010 01101',
    '%': '11000 11001 00010 00100 01000 10011 00011', '=': '00000 00000 11111 00000 11111 00000 00000',
    '*': '00000 00100 10101 01110 10101 00100 00000', '#': '01010 01010 11111 01010 11111 01010 01010',
    '<': '00010 00100 01000 10000 01000 00100 00010', '>': '01000 00100 00010 00001 00010 00100 01000',
    '_': '00000 00000 00000 00000 00000 00000 11111', '@': '01110 10001 10111 10101 10111 10000 01110',
    '~': '00000 00000 01000 10101 00010 00000 00000', '♥': '00000 01010 11111 11111 01110 00100 00000'
  };

  // Build glyph tables: { w, h, bits:[[x,y]...], left }. Big glyphs are trimmed to their
  // used columns (proportional spacing); a space is 3px wide.
  function buildBig() {
    const out = {};
    for (const ch in B) {
      const rows = B[ch].split(' ');
      let l = 5, r = -1;
      rows.forEach(row => { for (let x = 0; x < 5; x++) if (row[x] === '1') { l = Math.min(l, x); r = Math.max(r, x); } });
      const px = [];
      rows.forEach((row, y) => { for (let x = 0; x < 5; x++) if (row[x] === '1') px.push([x - l, y]); });
      out[ch] = { w: r - l + 1, px };
    }
    out[' '] = { w: 3, px: [] };
    return out;
  }
  function buildSmall() {
    const out = {};
    for (const ch in SMALL) {
      const px = [];
      for (let i = 0; i < 15; i++) if (SMALL[ch][i] === '1') px.push([i % 3, (i / 3) | 0]);
      out[ch] = { w: 3, px };
    }
    return out;
  }
  const FONTS = {
    big: { glyphs: buildBig(), h: 7, sp: 1, line: 9 },
    small: { glyphs: buildSmall(), h: 5, sp: 1, line: 7 }
  };
  let DEFAULT = 'big';

  const cache = {};
  function glyphCanvas(f, fname, ch, color) {
    const key = fname + ch + color;
    if (cache[key]) return cache[key];
    const g = f.glyphs[ch] || f.glyphs['?'];
    const c = LW.makeCanvas(Math.max(1, g.w), f.h);
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    for (const [x, y] of g.px) ctx.fillRect(x, y, 1, 1);
    return (cache[key] = c);
  }

  function norm(str) { return String(str).toUpperCase(); }
  function fontOf(o) { return FONTS[(o && o.font) || DEFAULT]; }

  function width(str, scale, font) {
    scale = scale || 1;
    const f = FONTS[font || DEFAULT];
    const s = norm(str);
    let w = 0;
    for (const ch of s) w += ((f.glyphs[ch] || f.glyphs['?']).w + f.sp);
    return s.length ? (w - f.sp) * scale : 0;
  }

  // draw(ctx, text, x, y, {color, scale, align:'left'|'center'|'right', shadow, outline, font})
  function draw(ctx, str, x, y, o) {
    o = o || {};
    const f = fontOf(o), fname = (o.font) || DEFAULT;
    const scale = o.scale || 1;
    const color = o.color || '#fff8e7';
    const s = norm(str);
    const w = width(s, scale, fname);
    if (o.align === 'center') x -= Math.floor(w / 2);
    else if (o.align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    if (o.shadow) draw(ctx, s, x + scale, y + scale, { color: o.shadow, scale, font: fname });
    if (o.outline) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]])
        draw(ctx, s, x + dx, y + dy, { color: o.outline, scale, font: fname });
    }
    let cx = x;
    for (const ch of s) {
      const g = f.glyphs[ch] || f.glyphs['?'];
      if (g.px.length) ctx.drawImage(glyphCanvas(f, fname, ch, color), cx, y, g.w * scale, f.h * scale);
      cx += (g.w + f.sp) * scale;
    }
    return w;
  }

  // Word-wrap to a pixel width; returns array of lines.
  function wrap(str, maxW, scale, font) {
    const words = norm(str).split(' ');
    const lines = [];
    let cur = '';
    for (const wd of words) {
      const t = cur ? cur + ' ' + wd : wd;
      if (width(t, scale, font) > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  return {
    draw, width, wrap,
    get CH() { return FONTS[DEFAULT].h; },
    get LINE() { return FONTS[DEFAULT].line; },
    height: font => FONTS[font || DEFAULT].h,
    lineHeight: font => FONTS[font || DEFAULT].line
  };
})();
