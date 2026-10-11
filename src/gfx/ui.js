// HUD, touch controls and the LeMatch dating-app interface used for story scenes.
(function () {
  const P = LW.PAL, F = LW.Font, S = () => LW.Sprites;
  function px(ctx, x, y, c, w, h) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w || 1, h || 1); }

  // state: {level, levelName, hearts, score, books, booksNeeded, firing, tools, toolsPerCharge, charge, muted}
  function drawHUD(ctx, s) {
    // translucent top bar (20px): level name over score, then power-ups and buttons
    ctx.globalAlpha = 0.75; px(ctx, 0, 0, P.k, LW.VIEW_W, LW.HUD_H); ctx.globalAlpha = 1;
    px(ctx, 0, LW.HUD_H, P.k, LW.VIEW_W, 1);
    for (let i = 0; i < 3; i++) S().draw(ctx, i < s.hearts ? 'heart' : 'heart_empty', 0, 2 + i * 9, 5, { topLeft: true });
    F.draw(ctx, (s.level ? s.level + '  ' : '') + (s.levelName || ''), 33, 2, { color: P.g });
    F.draw(ctx, String(s.score).padStart(6, '0'), 33, 11, { color: P.w });
    // books / firing power
    const R = LW.VIEW_W;                 // anchor the right-hand group to the screen edge
    let x = R - 124;
    S().draw(ctx, 'icon_book', 0, x, 5, { topLeft: true });
    if (s.firing) {
      F.draw(ctx, 'FIRE!', x + 11, 3, { color: P.x });
      const cd = s.cooldown || 0;          // cooldown bar
      px(ctx, x + 11, 12, P.E, 24, 3); px(ctx, x + 11, 12, cd > 0 ? P.a : P.x, Math.round(24 * (1 - cd)), 3);
    } else {
      for (let i = 0; i < s.booksNeeded; i++) px(ctx, x + 11 + i * 6, 7, i < s.books ? P.q : P.E, 5, 6);
    }
    // tools / repair charge
    x = R - 80;
    S().draw(ctx, 'icon_tool', 0, x, 5, { topLeft: true });
    for (let i = 0; i < s.toolsPerCharge; i++) px(ctx, x + 11 + i * 6, 7, i < s.tools ? P.a : P.E, 5, 6);
    if (s.charge) S().draw(ctx, 'icon_charge', Math.floor(Date.now() / 300) % 2, x + 29, 5, { topLeft: true });
    // pause + mute buttons
    smallButton(ctx, R - 34, 4, 'pause');
    smallButton(ctx, R - 18, 4, s.muted ? 'muted' : 'sound');
  }

  function smallButton(ctx, x, y, icon) {
    LW.roundBox(ctx, x, y, 14, 12, P.Z, P.w);
    const c = P.w;
    if (icon === 'pause') { px(ctx, x + 4, y + 3, c, 2, 6); px(ctx, x + 8, y + 3, c, 2, 6); }
    else {
      px(ctx, x + 3, y + 5, c, 2, 2); px(ctx, x + 5, y + 4, c, 1, 4); px(ctx, x + 6, y + 3, c, 1, 6);
      if (icon === 'sound') { px(ctx, x + 8, y + 4, c, 1, 4); px(ctx, x + 10, y + 3, c, 1, 6); }
      else { px(ctx, x + 8, y + 4, P.r); px(ctx, x + 9, y + 5, P.r, 1, 2); px(ctx, x + 10, y + 7, P.r); px(ctx, x + 10, y + 4, P.r); px(ctx, x + 8, y + 7, P.r); }
    }
  }

  // Round touch button. icon: left/right/jump/fire/down/pause.
  function touchButton(ctx, cx, cy, r, icon, pressed, label) {
    ctx.globalAlpha = pressed ? 0.85 : 0.5;
    const blob = (rr, col) => { ctx.fillStyle = col; for (let y = -rr; y <= rr; y++) { const hw = Math.round(Math.sqrt(rr * rr - y * y)); ctx.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); } };
    blob(r, P.k); blob(r - 1, pressed ? P.p : P.Z); blob(r - 3, pressed ? '#ffb0d0' : '#6a6280');
    ctx.globalAlpha = 1;
    const c = P.w;
    if (icon === 'left' || icon === 'right') {
      const d = icon === 'left' ? -1 : 1;
      for (let i = 0; i < 6; i++) px(ctx, cx - d * 3 + d * i, cy - 6 + i, c, 2, 12 - i * 2);
    } else if (icon === 'jump') {
      for (let i = 0; i < 6; i++) px(ctx, cx - i, cy - 4 + i, c, i * 2 + 2, 1);
      px(ctx, cx - 2, cy + 2, c, 6, 4);
    } else if (icon === 'down') {
      for (let i = 0; i < 4; i++) px(ctx, cx - 4 + i, cy - 1 + i, c, 10 - i * 2, 1);
    } else if (icon === 'fire') {
      LW.roundBox(ctx, cx - 7, cy - 5, 15, 9, c);
      px(ctx, cx - 5, cy + 4, c, 2, 2); px(ctx, cx - 4, cy - 2, P.U, 9, 1); px(ctx, cx - 4, cy, P.U, 6, 1);
    }
    if (label) F.draw(ctx, label, cx, cy + r + 3, { color: P.w, align: 'center', shadow: P.k });
  }

  // ---------------------------------------------------------------- LEMATCH UI
  const LM = { bg: '#fff0f6', head: '#ff4f8a', head2: '#c9306a', me: '#ff4f8a', them: '#ffffff', ink: '#1a1423', soft: '#e8c6d6' };

  function logo(ctx, x, y, scale) {
    scale = scale || 1;
    const w = F.width('LEMATCH', scale) + 10 * scale;
    S().draw(ctx, 'heart', 0, x, y - scale, { topLeft: true });
    F.draw(ctx, 'LE', x + 10, y, { color: P.w, scale });
    F.draw(ctx, 'MATCH', x + 10 + F.width('LE ', scale) - scale * 2, y, { color: P.g, scale });
    return w;
  }

  // Phone frame centred at cx; returns the screen rect.
  function phone(ctx, cx, top, w, h) {
    const x = Math.round(cx - w / 2);
    LW.roundBox(ctx, x - 4, top - 4, w + 8, h + 12, '#2b2633', P.k);
    px(ctx, x - 3, top - 3, '#4a4458', w + 6, 1);
    px(ctx, x, top, LM.bg, w, h);
    px(ctx, x, top, LM.head, w, 13); px(ctx, x, top + 13, LM.head2, w, 1);
    logo(ctx, x + 4, top + 4);
    px(ctx, cx - 8, top + h + 2, '#4a4458', 16, 3);
    return { x, y: top + 14, w, h: h - 14 };
  }

  // Chat bubble inside the phone. who: 'me' (Hunter, right) or 'them' (Chloe, left).
  function chatBubble(ctx, scr, y, who, text) {
    const maxW = scr.w - 34;
    const lines = F.wrap(text, maxW);
    const tw = Math.max.apply(null, lines.map(l => F.width(l)));
    const bw = tw + 8, bh = lines.length * 7 + 5;
    const mine = who === 'me';
    const av = mine ? 'portrait_hunter' : 'portrait_chloe';
    const ax = mine ? scr.x + scr.w - 14 : scr.x + 2;
    const bx = mine ? ax - 3 - bw : ax + 15;
    // mini avatar: crop of portrait
    const img = S().get(av);
    LW.roundBox(ctx, ax - 1, y - 1, 14, 14, mine ? LM.me : '#bf8bea', P.k);
    ctx.drawImage(img, 5, 3, 14, 14, ax - 1, y - 1, 14, 14);
    LW.roundBox(ctx, bx, y, bw, bh, mine ? LM.me : LM.them, P.k);
    lines.forEach((l, i) => F.draw(ctx, l, bx + 4, y + 3 + i * 7, { color: mine ? P.w : LM.ink }));
    return bh + 4;
  }

  // Profile card (portrait + name + location).
  function profileCard(ctx, x, y, who, name, place, tagline) {
    const w = 84, h = 104;
    LW.roundBox(ctx, x, y, w, h, P.w, P.k);
    px(ctx, x + 2, y + 2, who === 'hunter' ? '#ffcf8a' : '#d9c4ff', w - 4, 52);
    const img = S().get(who === 'hunter' ? 'portrait_hunter' : 'portrait_chloe');
    ctx.drawImage(img, x + w / 2 - 24, y + 6, 48, 48);
    F.draw(ctx, name, x + 6, y + 58, { color: P.k, scale: 2 });
    F.draw(ctx, place, x + 6, y + 72, { color: LM.head2 });
    F.wrap(tagline, w - 12).forEach((l, i) => F.draw(ctx, l, x + 6, y + 81 + i * 7, { color: '#55556a' }));
  }

  // "IT'S A MATCH!" splash. t animates hearts.
  function matchSplash(ctx, t) {
    px(ctx, 0, 0, '#2a1440', LW.VIEW_W, LW.VIEW_H);
    for (let i = 0; i < 24; i++) {
      const hx = (i * 41 + Math.sin(t + i) * 6) % LW.VIEW_W, hy = LW.VIEW_H - ((t * 25 + i * 37) % (LW.VIEW_H + 10));
      S().draw(ctx, 'heart_small', 0, hx, hy, { topLeft: true });
    }
    F.draw(ctx, "IT'S A MATCH!", LW.VIEW_W / 2, 18, { color: P.g, scale: 3, align: 'center', outline: P.k });
    const bob = Math.round(Math.sin(t * 4) * 2);
    profileCard(ctx, 58, 46 + bob, 'hunter', 'HUNTER', 'SENSIBLE BOOTS', 'Owns a drill. Will use it for you.');
    profileCard(ctx, 178, 46 - bob, 'chloe', 'CHLOE', 'EXCELLENT TASTE', 'Seeking someone who can assemble furniture.');
    S().draw(ctx, 'heart', 0, 160, 98 + bob, {});
  }

  // Story panel bar (between levels / in-game), with speaker portrait.
  function dialogBox(ctx, who, text, y) {
    y = y == null ? 128 : y;
    const x = 8, w = LW.VIEW_W - 16, h = 44;
    LW.roundBox(ctx, x, y, w, h, '#2b2633', P.w);
    const img = S().get(who === 'hunter' ? 'portrait_hunter' : 'portrait_chloe');
    LW.roundBox(ctx, x + 4, y + 4, 36, 36, who === 'hunter' ? '#ffcf8a' : '#d9c4ff', P.k);
    ctx.drawImage(img, x + 6, y + 6, 32, 32);
    F.draw(ctx, who === 'hunter' ? 'HUNTER' : 'CHLOE', x + 46, y + 5, { color: who === 'hunter' ? P.a : P.p });
    F.wrap(text, w - 54).forEach((l, i) => F.draw(ctx, l, x + 46, y + 14 + i * 7, { color: P.w }));
  }

  LW.UI = { drawHUD, touchButton, smallButton, logo, phone, chatBubble, profileCard, matchSplash, dialogBox, LM };
})();
