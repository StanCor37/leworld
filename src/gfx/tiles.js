// Procedural 16x16 terrain tiles for each level theme, plus platforms and props.
// Tile kinds: top (walkable surface), fill (underground), block (solid floating block),
// plat (one-way ledge; art in the top 6px).
(function () {
  const T = LW.TILE;

  // Theme colour sets. Keys: a/b/c = surface light/mid/dark, d/e/f = fill light/mid/dark,
  // g/h/i = block colours, j/k = ledge colours, ink = outline used on this theme.
  const THEMES = {
    street: {
      label: 'Out of Office',
      a: '#e8e4dc', b: '#bdb7ad', c: '#8c857c',
      d: '#d2563f', e: '#a83a2e', f: '#6e2421',
      g: '#3fc7c0', h: '#25908d', i: '#155956',
      j: '#ff5a6e', k: '#fff8e7', ink: '#1a1423'
    },
    avenue: {
      label: 'Unsolicited Avenue',
      a: '#f2b8c6', b: '#cc8aa0', c: '#8f5a78',
      d: '#5a3e6e', e: '#432d55', f: '#2a1c3a',
      g: '#7fe3ff', h: '#3a9fd0', i: '#1f5a8a',
      j: '#ffd23f', k: '#c9971c', ink: '#1a1423'
    },
    country: {
      label: 'The Long Way Round',
      a: '#7ee05a', b: '#46b04a', c: '#22803a',
      d: '#a8743f', e: '#7d522a', f: '#52341b',
      g: '#d9a45a', h: '#a8743f', i: '#6e4a24',
      j: '#c08a50', k: '#7d522a', ink: '#1a1423'
    },
    industrial: {
      label: 'Red Flag District',
      a: '#a7a9b8', b: '#727487', c: '#4a4b5c',
      d: '#6b4a3c', e: '#4f362d', f: '#33231e',
      g: '#ffd23f', h: '#2b2633', i: '#c9971c',
      j: '#c2492f', k: '#7a2a1c', ink: '#120e18'
    },
    train: {
      label: 'The Judgement Express',
      a: '#d85a7a', b: '#a8385a', c: '#6e1f3e',
      d: '#3f3a6e', e: '#2c2852', f: '#1c1838',
      g: '#c08a50', h: '#8a5a2c', i: '#ffd23f',
      j: '#a8743f', k: '#6e4a24', ink: '#14101e'
    },
    palace: {
      label: "The Pontiff's Palace",
      a: '#fff2c8', b: '#ffd23f', c: '#c9971c',
      d: '#f6c6d6', e: '#d897b0', f: '#a8607e',
      g: '#ffd23f', h: '#c9971c', i: '#ff4f8a',
      j: '#c2203e', k: '#ffd23f', ink: '#2a1420'
    },
    sunset: {
      label: 'Almost There',
      a: '#c8d84a', b: '#8aa83a', c: '#5a7a2c',
      d: '#9a4f5a', e: '#6e3448', f: '#462238',
      g: '#ff8a50', h: '#d0583a', i: '#8a3028',
      j: '#ffb36e', k: '#c06a3a', ink: '#1a1028'
    }
  };

  function px(ctx, x, y, c, w, h) { ctx.fillStyle = c; ctx.fillRect(x, y, w || 1, h || 1); }

  function speckle(ctx, rnd, n, colors, x0, y0, w, h) {
    for (let i = 0; i < n; i++)
      px(ctx, x0 + ((rnd() * w) | 0), y0 + ((rnd() * h) | 0), colors[(rnd() * colors.length) | 0]);
  }

  function bricks(ctx, th, light, mid, dark, mortar, y0, rows, bh) {
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * bh;
      const off = (r % 2) * 4;
      px(ctx, 0, y, mortar, T, 1);
      for (let x = -off; x < T; x += 8) {
        const x0 = Math.max(0, x), x1 = Math.min(T, x + 7);
        if (x1 <= x0) continue;
        px(ctx, x0, y + 1, mid, x1 - x0, bh - 1);
        px(ctx, x0, y + 1, light, x1 - x0, 1);
        px(ctx, x0, y + bh - 1, dark, x1 - x0, 1);
        if (x + 7 < T) px(ctx, x + 7, y + 1, mortar, 1, bh - 1);
      }
    }
  }

  const PAINT = {
    street: {
      top(ctx, th, rnd) {
        bricks(ctx, th, th.d, th.e, th.f, th.f, 6, 3, 4);
        px(ctx, 0, 0, th.a, T, 4); px(ctx, 0, 4, th.b, T, 1); px(ctx, 0, 5, th.c, T, 1);
        px(ctx, 0, 0, '#ffffff', T, 1); px(ctx, 7, 1, th.b, 1, 3); px(ctx, 15, 1, th.b, 1, 3);
      },
      fill(ctx, th) { bricks(ctx, th, th.d, th.e, th.f, th.f, 0, 4, 4); },
      block(ctx, th) {
        px(ctx, 0, 0, th.ink, T, T);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
          const x = c * 4 + (r % 2) * 2 - 1, y = r * 4;
          px(ctx, Math.max(1, x), y + 1, th.g, 3, 3); px(ctx, Math.max(1, x), y + 3, th.h, 3, 1);
        }
        px(ctx, 1, 1, th.g, 14, 1);
      },
      plat(ctx, th) {
        for (let x = 0; x < T; x += 4) { px(ctx, x, 0, th.j, 2, 5); px(ctx, x + 2, 0, th.k, 2, 5); }
        px(ctx, 0, 5, th.ink, T, 1);
        for (let x = 0; x < T; x += 4) { px(ctx, x, 6, th.j, 2, 1); px(ctx, x + 2, 6, th.k, 1, 1); }
      }
    },
    avenue: {
      top(ctx, th, rnd) {
        px(ctx, 0, 0, th.a, T, 5); px(ctx, 0, 0, '#ffe0ea', T, 1); px(ctx, 0, 5, th.b, T, 2); px(ctx, 0, 7, th.ink, T, 1);
        px(ctx, 7, 1, th.b, 1, 4);
        px(ctx, 0, 8, th.e, T, 8); speckle(ctx, rnd, 6, [th.d, th.f], 0, 8, T, 8);
      },
      fill(ctx, th, rnd) { px(ctx, 0, 0, th.e, T, T); speckle(ctx, rnd, 10, [th.d, th.f], 0, 0, T, T); },
      block(ctx, th) {
        px(ctx, 0, 0, th.ink, T, T); px(ctx, 1, 1, th.i, 14, 14);
        px(ctx, 2, 2, th.h, 5, 5); px(ctx, 9, 2, th.h, 5, 5); px(ctx, 2, 9, th.h, 5, 5); px(ctx, 9, 9, th.h, 5, 5);
        px(ctx, 2, 2, th.g, 2, 1); px(ctx, 2, 3, th.g, 1, 1); px(ctx, 9, 2, th.g, 2, 1); px(ctx, 2, 9, th.g, 2, 1);
      },
      plat(ctx, th) {
        px(ctx, 0, 0, th.j, T, 4); px(ctx, 0, 0, '#fff2a0', T, 1); px(ctx, 0, 4, th.k, T, 1); px(ctx, 0, 5, th.ink, T, 1);
        px(ctx, 3, 1, th.k, 1, 2); px(ctx, 12, 1, th.k, 1, 2);
      }
    },
    country: {
      top(ctx, th, rnd) {
        px(ctx, 0, 0, th.e, T, T); speckle(ctx, rnd, 8, [th.d, th.f], 0, 7, T, 9);
        px(ctx, 0, 0, th.a, T, 3); px(ctx, 0, 3, th.b, T, 2); px(ctx, 0, 5, th.c, T, 1);
        for (let x = 0; x < T; x += 3) px(ctx, x + ((rnd() * 2) | 0), 6, th.c, 1, 1 + ((rnd() * 2) | 0));
        px(ctx, 2, 0, '#c6ff9a', 2, 1); px(ctx, 10, 0, '#c6ff9a', 3, 1);
      },
      fill(ctx, th, rnd) {
        px(ctx, 0, 0, th.e, T, T); speckle(ctx, rnd, 10, [th.d, th.f], 0, 0, T, T);
        const sx = (rnd() * 10) | 0, sy = (rnd() * 10) | 0;
        px(ctx, sx, sy, '#9a9aa8', 3, 2); px(ctx, sx, sy, '#c9cad6', 2, 1);
      },
      block(ctx, th) {
        px(ctx, 0, 0, th.ink, T, T); px(ctx, 1, 1, th.g, 14, 14);
        px(ctx, 1, 1, th.h, 14, 2); px(ctx, 1, 13, th.h, 14, 2); px(ctx, 1, 1, th.h, 2, 14); px(ctx, 13, 1, th.h, 2, 14);
        for (let i = 0; i < 10; i++) { px(ctx, 3 + i, 3 + i, th.i, 1, 1); px(ctx, 3 + i, 12 - i, th.h, 1, 1); }
        px(ctx, 2, 2, th.i); px(ctx, 13, 2, th.i); px(ctx, 2, 13, th.i); px(ctx, 13, 13, th.i);
      },
      plat(ctx, th) {
        px(ctx, 0, 0, th.ink, T, 6);
        for (let x = 0; x < T; x += 4) { px(ctx, x, 0, th.j, 3, 5); px(ctx, x, 0, '#e8b070', 3, 1); }
        px(ctx, 0, 2, '#d9c08a', T, 1);
      }
    },
    industrial: {
      top(ctx, th, rnd) {
        px(ctx, 0, 0, th.ink, T, T);
        px(ctx, 0, 0, th.a, T, 2); px(ctx, 0, 2, th.b, T, 3);
        for (let x = 1; x < T; x += 3) px(ctx, x, 2, th.c, 1, 3);
        for (let x = 0; x < T; x += 4) { px(ctx, x, 5, th.g, 2, 2); px(ctx, x + 2, 5, th.h, 2, 2); }
        px(ctx, 0, 7, th.ink, T, 1);
        px(ctx, 0, 8, th.e, T, 8); px(ctx, 2, 10, th.c, 1, 1); px(ctx, 13, 10, th.c, 1, 1);
        speckle(ctx, rnd, 5, [th.d, th.f], 0, 9, T, 7);
      },
      fill(ctx, th, rnd) {
        px(ctx, 0, 0, th.e, T, T); px(ctx, 0, 0, th.f, T, 1); px(ctx, 0, 0, th.f, 1, T);
        px(ctx, 2, 2, th.c); px(ctx, 13, 2, th.c); px(ctx, 2, 13, th.c); px(ctx, 13, 13, th.c);
        speckle(ctx, rnd, 6, [th.d, th.f], 1, 1, 15, 15);
      },
      block(ctx, th) {
        px(ctx, 0, 0, th.ink, T, T);
        for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++)
          px(ctx, x, y, ((x - y + 64) % 6) >= 3 ? th.h : th.g);
        px(ctx, 1, 1, '#ffe98a', 14, 1);
      },
      plat(ctx, th) {
        px(ctx, 0, 0, th.ink, T, 7); px(ctx, 0, 0, th.j, T, 2); px(ctx, 0, 4, th.j, T, 2);
        for (let x = 1; x < T; x += 5) px(ctx, x, 2, th.j, 2, 2);
        px(ctx, 0, 0, '#e8765a', T, 1);
      }
    },
    train: {
      top(ctx, th, rnd) {
        px(ctx, 0, 0, th.ink, T, T);
        px(ctx, 0, 0, th.a, T, 3); px(ctx, 0, 0, '#ff9ab0', T, 1); px(ctx, 0, 3, th.b, T, 3); px(ctx, 0, 6, th.c, T, 1);
        px(ctx, 3, 4, th.i); px(ctx, 11, 4, th.i);
        px(ctx, 0, 8, th.d, T, 8); px(ctx, 0, 8, th.e, T, 1);
        px(ctx, 1, 10, '#8ad8ff', 6, 4); px(ctx, 9, 10, '#8ad8ff', 6, 4); px(ctx, 1, 10, '#d8f4ff', 2, 1); px(ctx, 9, 10, '#d8f4ff', 2, 1);
      },
      fill(ctx, th) {
        px(ctx, 0, 0, th.d, T, T); px(ctx, 0, 6, th.i, T, 1); px(ctx, 0, 7, th.f, T, 1);
        px(ctx, 4, 12, th.e, 1, 1); px(ctx, 12, 12, th.e, 1, 1);
      },
      block(ctx, th) {
        px(ctx, 0, 0, th.ink, T, T); px(ctx, 1, 2, th.g, 14, 13);
        px(ctx, 1, 2, '#e0a868', 14, 1); px(ctx, 1, 7, th.h, 14, 1);
        px(ctx, 3, 2, th.h, 2, 13); px(ctx, 11, 2, th.h, 2, 13);
        px(ctx, 6, 0, th.ink, 4, 2); px(ctx, 7, 6, th.i, 2, 3);
      },
      plat(ctx, th) {
        px(ctx, 0, 0, th.ink, T, 6);
        px(ctx, 0, 0, th.j, T, 5); px(ctx, 0, 0, '#d9a45a', T, 1); px(ctx, 5, 1, th.k, 1, 4); px(ctx, 11, 1, th.k, 1, 4);
      }
    },
    palace: {
      top(ctx, th, rnd) {
        px(ctx, 0, 0, th.ink, T, T);
        px(ctx, 0, 0, th.b, T, 2); px(ctx, 0, 0, th.a, T, 1); px(ctx, 0, 2, th.c, T, 1);
        for (let x = 1; x < T; x += 4) px(ctx, x, 3, th.b, 2, 1);
        px(ctx, 0, 4, th.d, T, 12);
        let x = (rnd() * 8) | 0;
        for (let y = 5; y < 16; y++) { px(ctx, x, y, th.e); x += rnd() < 0.5 ? 1 : (rnd() < 0.5 ? -1 : 0); x = (x + T) % T; }
        px(ctx, 0, 4, '#fff0f6', T, 1);
      },
      fill(ctx, th, rnd) {
        px(ctx, 0, 0, th.d, T, T);
        let x = (rnd() * 16) | 0;
        for (let y = 0; y < 16; y++) { px(ctx, x, y, th.e); if (rnd() < 0.3) px(ctx, x + 1, y, th.f); x += rnd() < 0.5 ? 1 : -1; x = (x + T) % T; }
      },
      block(ctx, th) {
        px(ctx, 0, 0, th.ink, T, T); px(ctx, 1, 1, th.g, 14, 14);
        px(ctx, 1, 1, '#fff2a0', 14, 1); px(ctx, 1, 1, '#fff2a0', 1, 14); px(ctx, 14, 2, th.h, 1, 13); px(ctx, 2, 14, th.h, 13, 1);
        px(ctx, 6, 5, th.i, 4, 6); px(ctx, 5, 6, th.i, 6, 4); px(ctx, 6, 6, '#ffb0cc', 2, 1);
      },
      plat(ctx, th) {
        px(ctx, 0, 0, th.ink, T, 7); px(ctx, 0, 0, th.j, T, 4); px(ctx, 0, 0, '#ff6070', T, 1);
        px(ctx, 0, 4, th.k, T, 1);
        for (let x = 2; x < T; x += 6) { px(ctx, x, 5, th.k, 2, 1); px(ctx, x, 6, th.k, 1, 1); }
      }
    },
    sunset: {
      top(ctx, th, rnd) {
        px(ctx, 0, 0, th.e, T, T); speckle(ctx, rnd, 8, [th.d, th.f], 0, 7, T, 9);
        px(ctx, 0, 0, th.a, T, 3); px(ctx, 0, 0, '#fff0a0', T, 1); px(ctx, 0, 3, th.b, T, 2); px(ctx, 0, 5, th.c, T, 1);
        for (let x = 0; x < T; x += 3) px(ctx, x + ((rnd() * 2) | 0), 6, th.c, 1, 1 + ((rnd() * 2) | 0));
      },
      fill(ctx, th, rnd) { px(ctx, 0, 0, th.e, T, T); speckle(ctx, rnd, 10, [th.d, th.f], 0, 0, T, T); },
      block(ctx, th) { bricks(ctx, th, th.g, th.h, th.i, th.ink, 0, 4, 4); },
      plat(ctx, th) {
        px(ctx, 0, 0, th.ink, T, 6);
        for (let x = 0; x < T; x += 4) { px(ctx, x, 0, th.j, 3, 5); px(ctx, x, 0, '#ffe0b0', 3, 1); }
        px(ctx, 0, 3, th.k, T, 1);
      }
    }
  };

  const cache = {};
  // Returns a canvas for theme+kind. variant picks one of several noise seeds for variety.
  function tile(theme, kind, variant) {
    variant = variant || 0;
    const key = theme + kind + variant;
    if (cache[key]) return cache[key];
    const th = THEMES[theme];
    const c = LW.makeCanvas(T, T);
    const ctx = c.getContext('2d');
    PAINT[theme][kind](ctx, th, LW.rng(1000 + variant * 97 + kind.length * 13 + theme.length));
    return (cache[key] = c);
  }

  // ------------------------------------------------------------------ PLATFORMS & PROPS
  const P = LW.PAL;
  const propCache = {};

  // Moving platform: chunky metal slab with chevrons, themed by the theme's ledge colours.
  function movingPlatform(theme, wTiles) {
    const key = 'mp' + theme + wTiles;
    if (propCache[key]) return propCache[key];
    const th = THEMES[theme];
    const w = wTiles * T, h = 8;
    const c = LW.makeCanvas(w, h);
    const ctx = c.getContext('2d');
    px(ctx, 0, 0, th.ink, w, h);
    px(ctx, 1, 1, th.j, w - 2, 5); px(ctx, 1, 1, '#ffffff', w - 2, 1);
    px(ctx, 1, 6, th.k, w - 2, 1);
    for (let x = 4; x < w - 4; x += 8) { px(ctx, x, 3, th.ink, 2, 1); px(ctx, x + 2, 3, th.ink, 2, 1); px(ctx, x + 1, 2, th.ink, 2, 1); px(ctx, x + 1, 4, th.ink, 2, 1); }
    return (propCache[key] = c);
  }

  // Disappearing platform: 3 frames - solid, cracking (warning), ghost.
  function vanishPlatform(frame) {
    const key = 'vp' + frame;
    if (propCache[key]) return propCache[key];
    const c = LW.makeCanvas(T, 8);
    const ctx = c.getContext('2d');
    if (frame === 2) {
      ctx.fillStyle = P.p;
      for (let x = 0; x < T; x += 2) { ctx.fillRect(x, 0, 1, 1); ctx.fillRect(x + 1, 7, 1, 1); }
      for (let y = 0; y < 8; y += 2) { ctx.fillRect(0, y, 1, 1); ctx.fillRect(15, y + 1, 1, 1); }
    } else {
      px(ctx, 0, 0, P.k, T, 8); px(ctx, 1, 1, P.p, 14, 6); px(ctx, 1, 1, '#ffd0e4', 14, 1); px(ctx, 1, 6, P.P, 14, 1);
      px(ctx, 4, 3, '#ffd0e4', 2, 2); px(ctx, 10, 3, '#ffd0e4', 2, 2);
      if (frame === 1) {
        px(ctx, 3, 1, P.k, 1, 2); px(ctx, 4, 3, P.k, 1, 2); px(ctx, 3, 5, P.k, 1, 2);
        px(ctx, 11, 1, P.k, 1, 3); px(ctx, 12, 4, P.k, 1, 3); px(ctx, 7, 2, P.k, 2, 1);
      }
    }
    return (propCache[key] = c);
  }

  // Swinging sign: drawn live. Pivot at (x, y); angle in radians; chain length in px.
  function drawSwingSign(ctx, x, y, angle, len, text, colors) {
    colors = colors || { board: P.a, edge: P.A, ink: P.k };
    const ex = x + Math.sin(angle) * len, ey = y + Math.cos(angle) * len;
    ctx.fillStyle = P.E;
    const steps = Math.ceil(len / 3);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      ctx.fillRect(Math.round(x + (ex - x) * t) - (i % 2), Math.round(y + (ey - y) * t), 2, 2);
    }
    px(ctx, Math.round(x) - 2, Math.round(y) - 2, P.k, 5, 3);
    const tw = LW.Font.width(text, 1, 'small') + 8, bh = 13;
    const bx = Math.round(ex - tw / 2), by = Math.round(ey);
    px(ctx, bx, by, P.k, tw, bh);
    px(ctx, bx + 1, by + 1, colors.board, tw - 2, bh - 2);
    px(ctx, bx + 1, by + bh - 3, colors.edge, tw - 2, 2);
    px(ctx, bx + 1, by + 1, '#ffffff', tw - 2, 1);
    LW.Font.draw(ctx, text, bx + 4, by + 3, { color: colors.ink, font: 'small' });
    return { x: bx, y: by, w: tw, h: bh };
  }

  // Swing warning: small exclamation marker drawn above hazards about to act.
  function drawWarning(ctx, x, y, t) {
    if (Math.floor(t * 8) % 2) return;
    px(ctx, x - 3, y - 9, P.k, 7, 10);
    px(ctx, x - 2, y - 8, P.g, 5, 8);
    px(ctx, x, y - 7, P.k, 1, 4); px(ctx, x, y - 2, P.k, 1, 1);
  }

  // Boss soapbox, 48x20, damage 0..2 adds cracks; 3 = broken.
  function soapbox(damage) {
    const key = 'sb' + damage;
    if (propCache[key]) return propCache[key];
    const c = LW.makeCanvas(48, 22);
    const ctx = c.getContext('2d');
    if (damage >= 3) {
      px(ctx, 2, 14, P.k, 44, 8);
      for (let i = 0; i < 6; i++) { px(ctx, 3 + i * 7, 15 + (i % 2), P.b, 6, 3); px(ctx, 3 + i * 7, 15 + (i % 2), '#a86a3a', 6, 1); }
      px(ctx, 6, 18, P.k, 36, 1);
      return (propCache[key] = c);
    }
    px(ctx, 0, 0, P.k, 48, 22);
    px(ctx, 1, 1, P.b, 46, 20);
    px(ctx, 1, 1, '#a86a3a', 46, 2); px(ctx, 1, 19, P.B, 46, 2);
    for (let y = 6; y < 20; y += 5) px(ctx, 1, y, P.B, 46, 1);
    px(ctx, 9, 4, P.w, 30, 11); px(ctx, 9, 4, P.k, 30, 1); px(ctx, 9, 14, P.k, 30, 1); px(ctx, 9, 4, P.k, 1, 11); px(ctx, 38, 4, P.k, 1, 11);
    LW.Font.draw(ctx, 'SOAP', 16, 7, { color: P.L, font: 'small' });
    const cracks = [[[4, 2], [5, 4], [4, 6], [6, 8], [5, 10]], [[42, 3], [41, 6], [43, 9], [41, 12], [42, 16]], [[22, 15], [24, 17], [23, 19], [26, 20]]];
    for (let d = 0; d < damage; d++) for (const [cx, cy] of cracks[d]) px(ctx, cx, cy, P.k, 1, 2);
    if (damage >= 2) for (const [cx, cy] of cracks[2]) px(ctx, cx, cy, P.k, 2, 1);
    return (propCache[key] = c);
  }

  // Speech-bubble projectile. lines: array of strings. style: {fill, ink, border, tail:'left'|'right'}
  function bubble(lines, style) {
    style = style || {};
    const key = 'bb' + lines.join('|') + JSON.stringify(style);
    if (propCache[key]) return propCache[key];
    const fill = style.fill || P.w, ink = style.ink || P.U, border = style.border || P.k;
    const tw = Math.max.apply(null, lines.map(l => LW.Font.width(l)));
    const LH = LW.Font.lineHeight();
    const bw = tw + 8, bh = lines.length * LH + 3;
    const c = LW.makeCanvas(bw + 4, bh + 4);
    const ctx = c.getContext('2d');
    const ox = style.tail === 'right' ? 0 : 4;
    LW.roundBox(ctx, ox, 0, bw, bh, fill, border);
    // tail
    const tx = style.tail === 'right' ? bw - 5 : 4;
    const dir = style.tail === 'right' ? 1 : -1;
    px(ctx, tx, bh - 1, fill, 3, 1);
    px(ctx, tx + (dir > 0 ? 1 : 0), bh, fill, 2, 1);
    px(ctx, tx + (dir > 0 ? 3 : -1), bh, border, 1, 1);
    px(ctx, tx + (dir > 0 ? 2 : 0), bh + 1, fill, 1, 1);
    px(ctx, tx + (dir > 0 ? 3 : -1), bh + 1, border, 1, 2);
    px(ctx, tx + (dir > 0 ? 1 : 1), bh + 1, border, 1, 1);
    px(ctx, tx + (dir > 0 ? 2 : 0), bh + 2, border, 1, 1);
    lines.forEach((l, i) => LW.Font.draw(ctx, l, ox + Math.floor((bw - LW.Font.width(l)) / 2), 2 + i * LH, { color: ink }));
    if (style.tear) { px(ctx, ox + bw - 3, bh - 4, P.u, 1, 2); px(ctx, ox + bw - 4, bh - 3, P.u, 1, 1); }
    return (propCache[key] = c);
  }

  // "MALE LONELINESS" shot: the orb flies and spells the phrase out letter by letter
  // in the air behind it; the words hang briefly with a mournful wobble, then fade.
  // x0: screen x where it was fired, dir: 1 right / -1 left, travelled: px flown so far.
  const LONELY = 'MALE LONELINESS';
  const LETTER_GAP = 7, LEAD = 10, HOLD = 70, FADE = 50;
  // opts.spent: seconds since the ball hit something (ball hidden, letters fade out).
  function drawLonelinessShot(ctx, x0, y, dir, travelled, t, opts) {
    const n = LONELY.length;
    const spent = opts && opts.spent != null ? opts.spent : null;
    const fadeStart = LEAD + n * LETTER_GAP + HOLD;
    let alpha = Math.max(0, Math.min(1, 1 - (travelled - fadeStart) / FADE));
    if (spent != null) alpha = Math.min(alpha, Math.max(0, 1 - spent / 0.8));
    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      for (let i = 0; i < n; i++) {
        const k = dir > 0 ? i : n - 1 - i;           // read left-to-right in either direction
        const d = LEAD + i * LETTER_GAP;
        if (travelled < d) break;
        const ch = LONELY[k];
        if (ch === ' ') continue;
        const lx = x0 + dir * d - 2 + (dir < 0 ? -3 : 0);
        const ly = y - 4 + Math.round(Math.sin(t * 5 + i * 0.7) * 1.5);
        LW.Font.draw(ctx, ch, lx, ly, { color: P.u, outline: P.k });
      }
      ctx.globalAlpha = 1;
    }
    if (spent == null) LW.Sprites.draw(ctx, 'loneliness_ball', Math.floor(t * 4), x0 + dir * travelled, y + 5, { flip: dir < 0 });
  }

  // Common projectile looks.
  const PROJ = {
    heyBeautiful: () => bubble(['HEY', 'BEAUTIFUL'], { fill: '#ffd0e4', ink: P.P, tail: 'right' }),
    blah: () => bubble(['BLAH'], { fill: P.g, ink: P.k, tail: 'right' }),
    amen: () => bubble(['AMEN!'], { fill: '#fff2c8', ink: P.L, tail: 'right' })
  };

  LW.Tiles = { THEMES, tile, kinds: ['top', 'fill', 'block', 'plat'] };
  LW.Props = { movingPlatform, vanishPlatform, drawSwingSign, drawWarning, soapbox, bubble, drawLonelinessShot, PROJ };
})();
