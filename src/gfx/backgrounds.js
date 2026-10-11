// Parallax backgrounds for each level theme. Static layers are pre-rendered into
// seamless 640px-wide strips; small animated details are drawn live each frame.
(function () {
  const W = LW.MAX_VIEW_W, H = LW.VIEW_H, LWID = 640;   // skies are drawn at the widest view

  function px(ctx, x, y, c, w, h) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w || 1, h || 1); }

  // Flat sky bands with a one-row checker dither between them (classic console look).
  function skyCanvas(bands, heights) {
    const c = LW.makeCanvas(W, H), ctx = c.getContext('2d');
    let y = 0;
    bands.forEach((col, i) => {
      const h = heights ? heights[i] : Math.ceil(H / bands.length);
      px(ctx, 0, y, col, W, h);
      if (i > 0) { ctx.fillStyle = col; for (let x = 0; x < W; x += 2) ctx.fillRect(x, y - 1, 1, 1); }
      if (i > 0) { ctx.fillStyle = bands[i - 1]; for (let x = 1; x < W; x += 2) ctx.fillRect(x, y, 1, 1); }
      y += h;
    });
    return c;
  }

  function strip(h) { const c = LW.makeCanvas(LWID, h); return [c, c.getContext('2d')]; }

  // Draw fn(x) at x and x±LWID so shapes crossing the seam wrap seamlessly.
  function wrap(fn, x) { fn(x); fn(x - LWID); fn(x + LWID); }

  function blob(ctx, cx, cy, r, col) {
    ctx.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const hw = Math.round(Math.sqrt(r * r - y * y));
      ctx.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
    }
  }

  function cloud(ctx, x, y, s, col, shade) {
    blob(ctx, x, y + 2, 4 * s, shade);
    blob(ctx, x - 5 * s, y + 3, 3 * s, shade);
    blob(ctx, x + 5 * s, y + 3, 3 * s, shade);
    blob(ctx, x, y, 4 * s, col);
    blob(ctx, x - 5 * s, y + 2, 3 * s, col);
    blob(ctx, x + 5 * s, y + 2, 3 * s, col);
    px(ctx, x - 8 * s, y + 3 * s + 1, shade, 16 * s, 1);
  }

  function hills(ctx, h, base, amp, freq, phase, col, top) {
    for (let x = 0; x < LWID; x++) {
      const y = Math.round(base - amp * (0.6 * Math.sin((x / LWID) * Math.PI * 2 * freq + phase) +
        0.4 * Math.sin((x / LWID) * Math.PI * 2 * (freq * 2 + 1) + phase * 1.7)));
      px(ctx, x, y, col, 1, h - y);
      if (top) px(ctx, x, y, top, 1, 1);
    }
  }

  // Generic city silhouette with lit windows. Returns window positions for twinkling.
  function skyline(ctx, rnd, h, opts) {
    const wins = [];
    let x = 0;
    while (x < LWID) {
      const bw = opts.minW + ((rnd() * (opts.maxW - opts.minW)) | 0);
      const bh = opts.minH + ((rnd() * (opts.maxH - opts.minH)) | 0);
      const col = opts.colors[(rnd() * opts.colors.length) | 0];
      const top = h - bh;
      px(ctx, x, top, col, bw, bh);
      if (opts.roofs && rnd() < 0.5) { for (let i = 0; i < bw / 2; i++) px(ctx, x + i, top - i * 0.6, col, bw - i * 2, 1); }
      if (opts.antenna && rnd() < 0.4) px(ctx, x + (bw >> 1), top - 6, col, 1, 6);
      if (opts.win) for (let wy = top + 3; wy < h - 4; wy += opts.winStep) for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
        const lit = rnd() < opts.litChance;
        px(ctx, wx, wy, lit ? opts.win : opts.winOff, 1, 2);
        if (lit) wins.push([wx, wy]);
      }
      x += bw + ((rnd() * opts.gap) | 0);
    }
    return wins;
  }

  function tree(ctx, x, base, s, leaf, dark, trunk) {
    px(ctx, x - 1, base - 6 * s, trunk, 2 * s, 6 * s);
    blob(ctx, x, base - 9 * s, 5 * s, dark);
    blob(ctx, x - 1, base - 10 * s, 4 * s, leaf);
  }

  const BG = {};

  // ---------------------------------------------------------------- 1. OUT OF OFFICE
  BG.street = function () {
    const rnd = LW.rng(11);
    const sky = skyCanvas(['#4aa8ff', '#6cbcff', '#92d0ff', '#b8e2ff', '#dcf2ff'], [40, 30, 30, 30, 50]);
    const [far, fctx] = strip(H);
    skyline(fctx, rnd, H, { minW: 20, maxW: 40, minH: 40, maxH: 90, colors: ['#9cc4ec', '#a8cdee'], gap: 6, win: '#c4e0fa', winOff: '#9cc4ec', winStep: 6, litChance: 0.4 });
    const [mid, mctx] = strip(H);
    let x = 0;
    const houseCols = [['#ff8fab', '#d9607e'], ['#7fe0c0', '#4aae8f'], ['#ffd56b', '#d0a83a'], ['#c3a4ff', '#9070d8'], ['#ff9f6b', '#d0703f']];
    while (x < LWID) {
      const bw = 36 + ((rnd() * 20) | 0), bh = 46 + ((rnd() * 30) | 0);
      const [c1, c2] = houseCols[(rnd() * houseCols.length) | 0];
      const top = H - bh;
      px(mctx, x, top, '#1a1423', bw, bh); px(mctx, x + 1, top + 1, c1, bw - 2, bh);
      px(mctx, x + bw - 4, top + 1, c2, 3, bh);
      // gable roof
      for (let i = 0; i < 8; i++) px(mctx, x + i * 2, top - i, '#a83a2e', bw - i * 4, 1);
      px(mctx, x + bw - 10, top - 12, '#6e2421', 4, 8);
      for (let wy = top + 6; wy < H - 14; wy += 12) for (let wx = x + 5; wx < x + bw - 8; wx += 10) {
        px(mctx, wx, wy, '#1a1423', 6, 8); px(mctx, wx + 1, wy + 1, '#fff8e7', 4, 6); px(mctx, wx + 1, wy + 4, '#bfe6ff', 4, 3);
        px(mctx, wx - 1, wy + 8, '#fff8e7', 8, 1);
      }
      px(mctx, x + 4, H - 14, '#1a1423', 7, 14); px(mctx, x + 5, H - 13, '#8f1d33', 5, 13); px(mctx, x + 9, H - 8, '#ffd23f');
      x += bw + 2;
    }
    const [near, nctx] = strip(H);
    for (let i = 0; i < 9; i++) {
      const tx = (i * 71 + 20) % LWID;
      wrap(xx => tree(nctx, xx, H - 6, 2, '#5ad06a', '#2f9a4a', '#6e4a24'), tx);
    }
    for (let x2 = 0; x2 < LWID; x2 += 8) blob(nctx, x2 + 4, H - 6, 5, '#2f9a4a');
    for (let x2 = 0; x2 < LWID; x2 += 8) blob(nctx, x2 + 3, H - 7, 3, '#5ad06a');
    px(nctx, 0, H - 5, '#2f9a4a', LWID, 5);
    const clouds = [[30, 20, 2], [150, 36, 1], [240, 14, 2], [330, 44, 1], [420, 24, 2], [540, 34, 1]];
    return {
      layers: [{ c: far, p: 0.15, y: -50 }, { c: mid, p: 0.35, y: -48 }, { c: near, p: 0.6, y: -40, fill: '#2f9a4a' }],
      sky,
      live(ctx, cam, t) {
        blob(ctx, 270, 26, 10, '#fff2a0'); blob(ctx, 270, 26, 8, '#ffe066');
        for (const [cx, cy, s] of clouds) {
          const xx = ((cx - cam * 0.05 - t * 4) % LWID + LWID) % LWID - 40;
          cloud(ctx, xx, cy, s, '#ffffff', '#cfe8ff');
        }
      },
      liveBehind: true
    };
  };

  // ---------------------------------------------------------------- 2. UNSOLICITED AVENUE
  BG.avenue = function () {
    const rnd = LW.rng(22);
    const sky = skyCanvas(['#2a1c4a', '#43255e', '#6a2e72', '#a03e7a', '#d8607e', '#ff9a86'], [30, 26, 26, 26, 30, 42]);
    const [far, fctx] = strip(H);
    const farWins = skyline(fctx, rnd, H, { minW: 18, maxW: 34, minH: 70, maxH: 140, colors: ['#3a2a5e', '#32244f'], gap: 3, win: '#ffd56b', winOff: '#2a1f44', winStep: 5, litChance: 0.35, antenna: true });
    const [mid, mctx] = strip(H);
    const midWins = skyline(mctx, rnd, H, { minW: 30, maxW: 50, minH: 50, maxH: 100, colors: ['#1f1633', '#261a3e'], gap: 30, win: '#ff9ad0', winOff: '#180f28', winStep: 6, litChance: 0.25 });
    // billboards
    const boards = [[60, 'LEMATCH ♥', '#ff4f8a', '#fff8e7'], [260, 'MAIN CHARACTER', '#3fc7c0', '#1a1423'], [470, 'TRUST ME BRO', '#ffd23f', '#1a1423']];
    for (const [bx, text, bgc, ink] of boards) {
      wrap(xx => {
        const tw = LW.Font.width(text, 1, 'small') + 10;
        px(mctx, xx + 6, 92, '#1a1423', 2, 40); px(mctx, xx + tw - 8, 92, '#1a1423', 2, 40);
        px(mctx, xx, 72, '#1a1423', tw, 22); px(mctx, xx + 1, 73, bgc, tw - 2, 20);
        LW.Font.draw(mctx, text, xx + 5, 80, { color: ink, font: 'small' });
      }, bx);
    }
    return {
      layers: [{ c: far, p: 0.15, y: 0 }, { c: mid, p: 0.4, y: 20 }],
      sky,
      live(ctx, cam, t) {
        // a few window lights blink on/off
        const off = ((cam * 0.15) % LWID + LWID) % LWID;
        for (let i = 0; i < farWins.length; i += 7) {
          const [wx, wy] = farWins[i];
          if (Math.sin(t * 1.3 + i) > 0.6) {
            const sx = wx - off; const xx = sx < -2 ? sx + LWID : sx;
            px(ctx, xx, wy, '#2a1f44', 1, 2);
          }
        }
        // drifting stars
        for (let i = 0; i < 18; i++) {
          if (Math.sin(t * 2 + i * 7) > 0.2) px(ctx, (i * 53 + 7) % W, (i * 17) % 40 + 2, '#fff8e7');
        }
      },
      liveBehind: true
    };
  };

  // ---------------------------------------------------------------- 3. THE LONG WAY ROUND
  BG.country = function () {
    const rnd = LW.rng(33);
    const sky = skyCanvas(['#5ab8ff', '#7ec8ff', '#a6dcff', '#cdeeff'], [40, 40, 40, 60]);
    const [far, fctx] = strip(H);
    // mountains
    for (let i = 0; i < 7; i++) {
      const mx = i * 96 + ((rnd() * 30) | 0), mh = 50 + ((rnd() * 30) | 0), base = 130;
      wrap(xx => {
        for (let y = 0; y < mh; y++) {
          const hw = Math.round(y * 1.3);
          px(fctx, xx - hw, base - mh + y, '#7a8ed8', hw * 2 + 1, 1);
          px(fctx, xx, base - mh + y, '#6476c0', hw + 1, 1);
          if (y < 10) px(fctx, xx - hw, base - mh + y, '#f4f6ff', hw * 2 + 1, 1);
        }
      }, mx);
    }
    px(fctx, 0, 130, '#7a8ed8', LWID, 50);
    const [mid, mctx] = strip(H);
    hills(mctx, H, 130, 14, 2, 0.5, '#6ad06a', '#a6f08a');
    for (let i = 0; i < 14; i++) {
      const tx = (i * 47 + ((rnd() * 20) | 0)) % LWID;
      wrap(xx => tree(mctx, xx, 140, 1, '#3fb05a', '#22803a', '#6e4a24'), tx);
    }
    const [near, nctx] = strip(H);
    hills(nctx, H, 158, 10, 3, 2, '#3fae4a', '#7ee05a');
    // fence
    for (let x = 0; x < LWID; x += 12) { px(nctx, x, 150, '#fff8e7', 2, 12); }
    px(nctx, 0, 153, '#fff8e7', LWID, 1); px(nctx, 0, 157, '#fff8e7', LWID, 1);
    const clouds = [[40, 26, 2], [200, 40, 1], [300, 18, 2], [460, 30, 1], [580, 22, 2]];
    return {
      layers: [{ c: far, p: 0.1, y: 0 }, { c: mid, p: 0.3, y: 0 }, { c: near, p: 0.55, y: 10 }],
      sky,
      live(ctx, cam, t) {
        for (const [cx, cy, s] of clouds) {
          const xx = ((cx - cam * 0.05 - t * 3) % LWID + LWID) % LWID - 40;
          cloud(ctx, xx, cy, s, '#ffffff', '#d8eeff');
        }
      },
      liveBehind: true,
      midAfter: 1,
      // windmill sits on the mid hills layer
      liveMid(ctx, cam, t) {
        const off = ((cam * 0.3) % LWID + LWID) % LWID;
        let wx = 340 - off; if (wx < -40) wx += LWID;
        const by = 112;
        px(ctx, wx - 4, by, '#1a1423', 9, 26); px(ctx, wx - 3, by + 1, '#fff8e7', 7, 25); px(ctx, wx - 2, by + 16, '#a83a2e', 3, 9);
        px(ctx, wx - 5, by - 2, '#a83a2e', 11, 3);
        for (let i = 0; i < 4; i++) {
          const a = t * 1.5 + i * Math.PI / 2;
          const ca = Math.cos(a), sa = Math.sin(a), cp = Math.cos(a + 1.5708), sp = Math.sin(a + 1.5708);
          for (let r = 2; r < 18; r++) {
            const x = wx + ca * r, y = by + sa * r;
            if (r > 5) for (let k = 1; k <= 5; k++) px(ctx, x + cp * k, y + sp * k, (r + k) % 4 ? '#fff8e7' : '#d9d0c0', 1, 1);
            px(ctx, x, y, '#6e4a24', 1, 1);
          }
        }
        px(ctx, wx - 1, by - 1, '#ffd23f', 3, 3);
      }
    };
  };

  // ---------------------------------------------------------------- 4. RED FLAG DISTRICT
  BG.industrial = function () {
    const rnd = LW.rng(44);
    const sky = skyCanvas(['#4a2c3a', '#6e3a3a', '#94503a', '#b8683a', '#d08a4a'], [36, 34, 34, 34, 42]);
    const [far, fctx] = strip(H);
    const stacks = [];
    let x = 0;
    while (x < LWID) {
      const bw = 40 + ((rnd() * 40) | 0), bh = 40 + ((rnd() * 40) | 0);
      const top = H - bh;
      px(fctx, x, top, '#3a2630', bw, bh);
      // saw-tooth factory roof
      for (let i = 0; i < bw; i += 10) for (let j = 0; j < 8; j++) px(fctx, x + i, top - j, '#3a2630', 10 - j, 1);
      if (rnd() < 0.8) { const sx = x + 6 + ((rnd() * (bw - 12)) | 0), sh = 30 + ((rnd() * 30) | 0); px(fctx, sx, top - sh, '#2e1e26', 6, sh); px(fctx, sx, top - sh + 4, '#c2492f', 6, 2); stacks.push([sx + 3, top - sh]); }
      for (let wy = top + 6; wy < H - 6; wy += 9) for (let wx = x + 3; wx < x + bw - 4; wx += 6) px(fctx, wx, wy, rnd() < 0.3 ? '#ff9a3c' : '#2a1a22', 3, 3);
      x += bw + 4;
    }
    const [mid, mctx] = strip(H);
    // chain-link fence
    for (let y = 120; y < H; y++) for (let x2 = 0; x2 < LWID; x2++) if (((x2 + y) % 6 === 0) || ((x2 - y + 600) % 6 === 0)) px(mctx, x2, y, '#5a4a52');
    px(mctx, 0, 119, '#7a6a72', LWID, 2);
    for (let x2 = 0; x2 < LWID; x2 += 80) px(mctx, x2, 100, '#3a2a32', 3, 80);
    const flagPoles = [];
    for (let x2 = 40; x2 < LWID; x2 += 80) flagPoles.push(x2);
    return {
      layers: [{ c: far, p: 0.15, y: 0 }, { c: mid, p: 0.4, y: 0 }],
      sky,
      live(ctx, cam, t) {
        const off = ((cam * 0.15) % LWID + LWID) % LWID;
        for (const [sx, sy] of stacks) {
          for (let k = 0; k < 4; k++) {
            const ph = (t * 0.4 + k * 0.25) % 1;
            let xx = sx - off + ph * 18; if (xx < -20) xx += LWID; if (xx > LWID - 20) xx -= LWID;
            blob(ctx, xx, sy - ph * 40, 2 + ph * 6, ph > 0.6 ? '#6e5a5a' : '#8a7270');
          }
        }
      },
      liveBehind: true,
      liveMid(ctx, cam, t) {
        // literal red flags, flapping
        const off = ((cam * 0.4) % LWID + LWID) % LWID;
        for (const fx of flagPoles) {
          let xx = fx - off; if (xx < -30) xx += LWID;
          px(ctx, xx, 70, '#2a1a22', 2, 60); px(ctx, xx - 1, 68, '#ffd23f', 4, 2);
          for (let i = 0; i < 18; i++) {
            const wy = Math.round(Math.sin(t * 6 - i * 0.5) * 1.5);
            px(ctx, xx + 2 + i, 72 + wy, '#1a1423', 1, 12);
            px(ctx, xx + 2 + i, 73 + wy, i % 6 < 3 ? '#e0383e' : '#c22a35', 1, 10);
          }
        }
      }
    };
  };

  // ---------------------------------------------------------------- 5. THE JUDGEMENT EXPRESS
  BG.train = function () {
    const rnd = LW.rng(55);
    const sky = skyCanvas(['#1c1040', '#2e1658', '#4a1e72', '#6e2a8a', '#9a3a9a', '#c84aa8', '#ff7ac0'], [24, 22, 22, 22, 24, 30, 36]);
    const [far, fctx] = strip(H);
    for (let i = 0; i < 40; i++) px(fctx, (rnd() * LWID) | 0, (rnd() * 70) | 0, rnd() < 0.5 ? '#fff8e7' : '#ffd0e4');
    hills(fctx, H, 130, 18, 3, 1, '#3a1c5a', '#5a2a7a');
    const [mid, mctx] = strip(H);
    hills(mctx, H, 150, 8, 4, 0, '#2a1446', '#4a2066');
    const [poles, pctx] = strip(H);
    for (let x = 0; x < LWID; x += 160) {
      px(pctx, x, 40, '#140a24', 3, 140); px(pctx, x - 8, 46, '#140a24', 19, 2); px(pctx, x - 6, 52, '#140a24', 15, 2);
    }
    for (let x = 0; x < LWID; x++) {
      const sag = Math.round(Math.sin((x % 160) / 160 * Math.PI) * 6);
      px(pctx, x, 46 + sag, '#140a24'); px(pctx, x, 52 + sag, '#140a24');
    }
    const eyes = [[60, 50], [190, 30], [290, 62]];
    return {
      layers: [{ c: far, p: 0.05, y: 0, auto: 10 }, { c: mid, p: 0.15, y: 0, auto: 60 }, { c: poles, p: 0.3, y: 0, auto: 260 }],
      sky,
      live(ctx, cam, t) {
        // giant floating judging eyes, blinking out of sync
        eyes.forEach(([ex, ey], i) => {
          const yy = ey + Math.sin(t * 0.8 + i) * 4;
          const blink = (t * 0.7 + i * 0.37) % 3 < 0.12;
          blob(ctx, ex, yy, 9, '#1a1423');
          if (blink) { px(ctx, ex - 8, yy, '#fff8e7', 17, 1); return; }
          blob(ctx, ex, yy, 8, '#fff8e7');
          const lx = Math.sin(t * 0.5 + i * 2) * 3;
          blob(ctx, ex + lx, yy + 1, 4, '#d8204c');
          blob(ctx, ex + lx, yy + 1, 2, '#1a1423');
          px(ctx, ex + lx - 2, yy - 2, '#ffffff', 2, 2);
          px(ctx, ex - 9, yy - 10, '#1a1423', 6, 2); px(ctx, ex + 3, yy - 10, '#1a1423', 6, 2); // judgemental brows
          px(ctx, ex - 4, yy - 9, '#1a1423', 3, 1); px(ctx, ex + 1, yy - 9, '#1a1423', 3, 1);
        });
      },
      liveBehind: true
    };
  };

  // ---------------------------------------------------------------- 6. THE PONTIFF'S PALACE
  BG.palace = function () {
    const sky = skyCanvas(['#5a1838', '#6e2044', '#7a2a4a'], [60, 60, 60]);
    const [far, fctx] = strip(H);
    // stained-glass windows
    for (let x = 30; x < LWID; x += 110) {
      px(fctx, x, 30, '#3a0e22', 34, 90);
      blob(fctx, x + 17, 30, 17, '#3a0e22');
      const cols = ['#ff4f8a', '#3fc7c0', '#ffd23f', '#6a3fbf', '#46c25a'];
      for (let gy = 0; gy < 10; gy++) for (let gx = 0; gx < 4; gx++) px(fctx, x + 3 + gx * 7, 32 + gy * 8, cols[(gx * 3 + gy) % 5], 6, 7);
      blob(fctx, x + 17, 28, 13, '#ffd23f'); blob(fctx, x + 17, 28, 10, '#ff4f8a'); blob(fctx, x + 17, 28, 5, '#fff2c8');
    }
    px(fctx, 0, 140, '#4a1230', LWID, 40);
    const [mid, mctx] = strip(H);
    for (let x = 0; x < LWID; x += 160) {
      // gold column
      px(mctx, x, 0, '#1a1423', 20, H); px(mctx, x + 1, 0, '#ffd23f', 18, H);
      for (let k = 3; k < 18; k += 4) px(mctx, x + k, 0, '#c9971c', 1, H);
      px(mctx, x + 2, 0, '#fff2a0', 1, H);
      px(mctx, x - 3, 20, '#1a1423', 26, 8); px(mctx, x - 2, 21, '#ffd23f', 24, 6); px(mctx, x - 2, 21, '#fff2a0', 24, 1);
      // red curtains swagged beside the column
      for (let y = 0; y < 120; y++) {
        const wdt = Math.round(14 + Math.sin(y / 120 * Math.PI) * -8 + y / 10);
        px(mctx, x + 20, y, '#8a1028', wdt, 1); px(mctx, x + 20 + 4, y, '#c2203e', 3, 1); px(mctx, x + 20 + 10, y, '#c2203e', 2, 1);
        px(mctx, x - wdt, y, '#8a1028', wdt, 1); px(mctx, x - 8, y, '#c2203e', 3, 1);
      }
      px(mctx, x - 30, 0, '#ffd23f', 80, 3);
    }
    return {
      layers: [{ c: far, p: 0.2, y: 0 }, { c: mid, p: 0.45, y: 0 }],
      sky,
      live(ctx, cam, t) {},
      midAfter: 1,
      liveMid(ctx, cam, t) {
        // chandeliers hang between columns
        const off = ((cam * 0.45) % LWID + LWID) % LWID;
        for (let cx = 80; cx < LWID; cx += 160) {
          let xx = cx - off; if (xx < -40) xx += LWID;
          const sw = Math.sin(t * 1.2 + cx) * 2;
          px(ctx, xx, 0, '#c9971c', 1, 20);
          const bx = xx + sw;
          px(ctx, bx - 14, 22, '#1a1423', 29, 4); px(ctx, bx - 13, 23, '#ffd23f', 27, 2);
          px(ctx, bx - 4, 18, '#ffd23f', 9, 5);
          for (let k = -12; k <= 12; k += 6) {
            px(ctx, bx + k, 17, '#fff8e7', 2, 5);
            const fl = Math.sin(t * 12 + k) > 0 ? 1 : 0;
            px(ctx, bx + k, 14 - fl, '#ffd23f', 2, 3); px(ctx, bx + k, 15, '#ff9a3c', 2, 1);
          }
          px(ctx, bx - 1, 26, '#ff4f8a', 3, 3);
        }
      }
    };
  };

  // ---------------------------------------------------------------- 7. ALMOST THERE
  BG.sunset = function () {
    const rnd = LW.rng(77);
    const sky = skyCanvas(['#2e1650', '#55206a', '#8a2a72', '#c4406e', '#ff6a50', '#ff9a40', '#ffc860'], [22, 22, 22, 24, 26, 30, 34]);
    const [far, fctx] = strip(H);
    // Chloe's city on the horizon, a cosy cafe sign glowing
    const wins = skyline(fctx, rnd, 150, { minW: 14, maxW: 28, minH: 20, maxH: 60, colors: ['#4a2058', '#3e1a4c'], gap: 10, win: '#ffd56b', winOff: '#3a1846', winStep: 5, litChance: 0.3, antenna: true });
    px(fctx, 0, 150, '#4a2058', LWID, 30);
    wrap(xx => { px(fctx, xx, 104, '#1a1423', 30, 12); px(fctx, xx + 1, 105, '#ff4f8a', 28, 10); LW.Font.draw(fctx, 'CAFE', xx + 7, 108, { color: '#fff8e7', font: 'small' }); px(fctx, xx + 12, 116, '#1a1423', 2, 20); }, 300);
    const [mid, mctx] = strip(H);
    hills(mctx, H, 162, 10, 2, 1.2, '#5a2448', '#8a3458');
    for (let i = 0; i < 6; i++) wrap(xx => tree(mctx, xx, 168, 1, '#7a2a52', '#5a1c40', '#3a1028'), i * 107 + 30);
    return {
      layers: [{ c: far, p: 0.1, y: -10, fill: '#4a2058' }, { c: mid, p: 0.3, y: -28, fill: '#5a2448' }],
      sky,
      live(ctx, cam, t) {
        // retro striped sun
        const sx = 160, sy = 96;
        for (let y = -34; y <= 34; y++) {
          if (y > 4 && (y % 6) < (1 + (y - 4) / 8)) continue;
          const hw = Math.round(Math.sqrt(34 * 34 - y * y));
          px(ctx, sx - hw, sy + y, y < -10 ? '#ffe680' : (y < 6 ? '#ffc04a' : '#ff8a50'), hw * 2, 1);
        }
        // birds
        for (let i = 0; i < 5; i++) {
          const bx = ((i * 70 + t * 14) % 360) - 20, by = 30 + (i * 13) % 30 + Math.sin(t * 2 + i) * 3;
          const up = Math.floor(t * 6 + i) % 2;
          px(ctx, bx, by, '#2e1650', 2, 1); px(ctx, bx + 4, by, '#2e1650', 2, 1);
          px(ctx, bx + 2, by + (up ? -1 : 1), '#2e1650', 2, 1);
        }
      },
      liveBehind: true
    };
  };

  // ---------------------------------------------------------------- RENDERER
  const cache = {};
  function get(theme) { return cache[theme] || (cache[theme] = BG[theme]()); }

  function drawLayer(ctx, L, cam, t) {
    const off = (((cam * L.p + (L.auto || 0) * t) % LWID) + LWID) % LWID;
    ctx.drawImage(L.c, -Math.round(off), L.y || 0);
    ctx.drawImage(L.c, LWID - Math.round(off), L.y || 0);
    if (L.fill && L.y < 0) px(ctx, 0, H + L.y, L.fill, W, -L.y);
  }

  // Haze laid over each finished background to push it back and keep characters readable.
  // Light themes fade toward the sky, dark themes sink toward shadow.
  const HAZE = {
    street: ['#d8eeff', 0.38], avenue: ['#1c1236', 0.4], country: ['#dcefff', 0.34],
    industrial: ['#2a1a24', 0.38], train: ['#140a30', 0.4], palace: ['#2a0a1a', 0.42], sunset: ['#2e1650', 0.3]
  };
  // Rim colour for characters on each theme (light rim behind the dark outline).
  const RIM = {
    street: 'rgba(255,255,255,0.75)', avenue: 'rgba(255,230,245,0.6)', country: 'rgba(255,255,255,0.75)',
    industrial: 'rgba(255,236,210,0.6)', train: 'rgba(255,220,255,0.6)', palace: 'rgba(255,240,210,0.6)', sunset: 'rgba(255,230,200,0.6)'
  };

  // Draw the full background for a theme at camera x (world px) and time t (seconds).
  function draw(ctx, theme, cam, t) {
    const bg = get(theme);
    ctx.drawImage(bg.sky, 0, 0);
    if (bg.liveBehind) bg.live(ctx, cam, t);
    bg.layers.forEach((L, i) => {
      drawLayer(ctx, L, cam, t);
      if (i === (bg.midAfter || 0) && bg.liveMid) bg.liveMid(ctx, cam, t);
    });
    if (!bg.liveBehind) bg.live(ctx, cam, t);
    const hz = HAZE[theme];
    if (hz) { ctx.globalAlpha = hz[1]; px(ctx, 0, 0, hz[0], W, H); ctx.globalAlpha = 1; }
  }

  LW.Backgrounds = { draw, themes: Object.keys(BG), rim: theme => RIM[theme] || 'rgba(255,255,255,0.7)' };
})();
