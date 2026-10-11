// The first date: Hunter reaches Chloe at a cosy cafe at sunset. Short animated scene,
// warm dialogue, a small affectionate moment, then the final card with totals,
// the reading list, and Replay / Main Menu.
(function () {
  const VH = LW.VIEW_H, P = LW.PAL, F = LW.Font, I = () => LW.Input;
  const GROUND = 150;
  const pressed = () => { const a = I().consume('mOk'), b = I().consume('jump'), c = I().takeTap(); return a || b || !!c; };

  function px(ctx, x, y, c, w, h) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w || 1, h || 1); }

  function drawCafe(ctx, t) {
    // building
    px(ctx, 212, 70, P.k, 108, 80); px(ctx, 213, 71, '#e8b49a', 106, 79);
    for (let y = 92; y < 150; y += 8) px(ctx, 213, y, '#d49a80', 106, 1);
    // sign
    px(ctx, 226, 54, P.k, 72, 16); px(ctx, 227, 55, P.p, 70, 14);
    F.draw(ctx, 'CAFE', 262, 59, { color: P.w, align: 'center' });
    LW.Sprites.draw(ctx, 'heart_small', 0, 283, 58, { topLeft: true });
    // striped awning with scallops
    for (let i = 0, x = 212; x < 320; i++, x += 6) { const col = i % 2 ? P.w : P.p; px(ctx, x, 72, col, 6, 10); px(ctx, x + 1, 82, col, 4, 2); }
    px(ctx, 212, 72, P.k, 108, 1);
    // warm window and door
    px(ctx, 222, 94, P.k, 46, 34); px(ctx, 223, 95, '#ffd56b', 44, 32);
    px(ctx, 244, 95, P.k, 1, 32); px(ctx, 223, 110, P.k, 44, 1);
    const flick = Math.sin(t * 3) > 0 ? '#ffe08a' : '#ffd56b';
    px(ctx, 226, 98, flick, 6, 3);
    px(ctx, 280, 104, P.k, 22, 46); px(ctx, 281, 105, '#7a4520', 20, 45); px(ctx, 297, 126, P.g, 2, 2);
    // potted plant
    px(ctx, 306, 136, P.k, 10, 14); px(ctx, 307, 137, '#c06a3a', 8, 12);
    for (let i = 0; i < 5; i++) px(ctx, 305 + i * 2, 128 + (i % 2) * 3, '#46c25a', 3, 8);
  }

  function drawTable(ctx, t) {
    // two chairs and a little round table with steaming cups
    px(ctx, 141, 128, P.k, 3, 22); px(ctx, 141, 138, P.k, 12, 3); px(ctx, 151, 138, P.k, 3, 12);
    px(ctx, 186, 128, P.k, 3, 22); px(ctx, 177, 138, P.k, 12, 3); px(ctx, 177, 138, P.k, 3, 12);
    px(ctx, 150, 126, P.k, 36, 5); px(ctx, 151, 127, '#fff0f6', 34, 3);
    px(ctx, 166, 131, P.k, 4, 19); px(ctx, 160, 148, P.k, 16, 2);
    for (const cx of [157, 175]) {
      px(ctx, cx - 3, 120, P.k, 7, 7); px(ctx, cx - 2, 121, P.w, 5, 5); px(ctx, cx + 4, 122, P.k, 2, 3);
      for (let k = 0; k < 3; k++) {
        const sy = 117 - ((t * 10 + k * 4) % 12);
        px(ctx, cx + Math.round(Math.sin(t * 3 + k) * 1.5), sy, 'rgba(255,255,255,0.7)', 1, 2);
      }
    }
  }

  function dialog(ctx, who, text) {
    const x = 8, y = 4, w = LW.VIEW_W - 16, h = 54;   // top of the screen: the couple stays visible
    LW.roundBox(ctx, x, y, w, h, '#2b2633', P.w);
    LW.roundBox(ctx, x + 5, y + 5, 44, 44, who === 'hunter' ? '#ffcf8a' : '#d9c4ff', P.k);
    ctx.drawImage(LW.Sprites.get(who === 'hunter' ? 'portrait_hunter' : 'portrait_chloe'), x + 6, y + 6, 42, 42);
    F.draw(ctx, who === 'hunter' ? 'HUNTER' : 'CHLOE', x + 56, y + 6, { color: who === 'hunter' ? P.a : P.p });
    F.wrap(text, w - 64).forEach((l, i) => F.draw(ctx, l, x + 56, y + 18 + i * 9, { color: P.w }));
  }

  // stats: { score, books, booksTotal, tools, toolsTotal, cats, catsTotal, km, reading: [[title, author]], firstBook }
  function Ending(stats, cb) {
    this.stats = stats; this.cb = cb;
    this.phase = 'walk'; this.t = 0; this.line = 0; this.page = 0; this.T = 0;
    const book = stats.firstBook ? stats.firstBook[0].toUpperCase() : 'ONE ABOUT LOVE';
    this.lines = LW.STORY.ending.map(([w, s]) => [w, LW.Story.fill(s, { BOOK: book })]);
    this.menu = new LW.Menus.Menu([
      { label: 'REPLAY ADVENTURE', action: () => cb.replay(), note: 'MAYBE NEXT TIME, HUNTER' },
      { label: 'READING LIST', action: () => { this.phase = 'list'; this.page = 0; I().flush(); }, note: stats.reading.length + ' BOOKS COLLECTED' },
      { label: 'RETURN TO MENU', action: () => cb.menu() }
    ]);
  }
  Ending.prototype.set = function (p) { this.phase = p; this.t = 0; I().flush(); };
  Ending.prototype.update = function (dt) {
    this.t += dt; this.T += dt;
    const skip = I().consume('mBack') || I().consume('pause');
    if (this.phase === 'walk') {
      if (skip) return this.set('card');
      if (this.t > 3.6 || (this.t > 0.5 && pressed())) this.set('talk');
    } else if (this.phase === 'talk') {
      if (skip) return this.set('card');
      if ((this.t > 0.3 && pressed()) || this.t > 5) {
        this.line++; this.t = 0;
        if (this.line >= this.lines.length) this.set('moment');
        // the twist gets its own sad trombone
        else if (/^\.\.\.FRIEND/.test(this.lines[this.line][1]) && LW.Audio) LW.Audio.sfx('sadTrombone');
      }
    } else if (this.phase === 'moment') {
      if (!this.broke && this.t > 1.2) { this.broke = true; if (LW.Audio) LW.Audio.sfx('heartbreak'); }
      if (skip || this.t > 4.2 || (this.t > 1 && pressed())) this.set('card');
    } else if (this.phase === 'card') {
      if (this.t > 1.2) this.menu.handle();
    } else if (this.phase === 'list') {
      const pages = Math.max(1, Math.ceil(this.stats.reading.length / 6));
      if (I().consume('mRight') || I().consume('right')) this.page = Math.min(pages - 1, this.page + 1);
      if (I().consume('mLeft') || I().consume('left')) this.page = Math.max(0, this.page - 1);
      if (skip || pressed()) { this.phase = 'card'; this.t = 2; I().flush(); }
    }
  };

  Ending.prototype.draw = function (ctx) {
    const T = this.T, t = this.t;
    LW.Backgrounds.draw(ctx, 'sunset', 0, T);
    for (let x = 0; x < LW.VIEW_W; x += 16) {
      ctx.drawImage(LW.Tiles.tile('sunset', 'top', (x / 16) % 4), x, GROUND);
      ctx.drawImage(LW.Tiles.tile('sunset', 'fill', (x / 16 + 1) % 4), x, GROUND + 16);
    }
    const ox = Math.round((LW.VIEW_W - 320) / 2);   // centre the 320-wide scene on wide screens
    ctx.save(); ctx.translate(ox, 0);
    drawCafe(ctx, T);
    drawTable(ctx, T);
    if (this.stats.cats > 0) LW.Sprites.draw(ctx, 'cat_happy', Math.floor(T * 2), 270, GROUND);

    // positions
    let hx = 120, cx = 214, hAnim = 'hunter_idle', cAnim = 'chloe_wave';
    if (this.phase === 'walk') {
      const k = Math.min(1, t / 3.2);
      hx = -12 + 132 * k; hAnim = k < 1 ? 'hunter_run' : 'hunter_idle';
      cAnim = hx > 60 ? 'chloe_wave' : 'chloe_phone';
    } else if (this.phase === 'talk') {
      cAnim = this.lines[this.line] && this.lines[this.line][0] === 'chloe' ? 'chloe_wave' : 'chloe_idle';
    } else {
      const k = this.phase === 'moment' ? Math.min(1, t / 1.2) : 1;
      hx = 120 + 16 * k; cx = 214 - 18 * k;
      hAnim = k < 1 ? 'hunter_run' : (this.phase === 'moment' && t < 2.4 ? 'hunter_hurt' : 'hunter_idle');
      cAnim = k < 1 ? 'chloe_idle' : 'chloe_hop';
    }
    const rim = 'rgba(255,230,200,0.75)';
    LW.Sprites.draw(ctx, hAnim, Math.floor(T * (hAnim === 'hunter_run' ? 10 : 3)), hx, GROUND, { rim });
    LW.Sprites.draw(ctx, cAnim, Math.floor(T * 3), cx, GROUND - (cAnim === 'chloe_hop' && Math.floor(T * 3) % 2 ? 2 : 0), { flip: true, rim });

    if (this.phase === 'walk' && hx > 60) LW.Sprites.draw(ctx, 'heart_small', 0, cx - 4, GROUND - 32 + Math.round(Math.sin(T * 5) * 2), { topLeft: true });
    if (this.phase === 'talk') { ctx.restore(); dialog(ctx, this.lines[this.line][0], this.lines[this.line][1]); ctx.save(); ctx.translate(ox, 0); }
    if (this.phase === 'moment' || this.phase === 'card' || this.phase === 'list') {
      // the "moment": a shared heart rises... and cracks in two. Chloe is delighted anyway.
      const mid = Math.round((hx + cx) / 2);
      const mt = this.phase === 'moment' ? t : 9;
      const split = Math.max(0, Math.min(5, (mt - 1.2) * 6));
      const img = LW.Sprites.get('heart');
      const hy = GROUND - 40 + (split > 0 ? Math.round(split * 2) : -Math.round(Math.sin(T * 6)));
      if (split <= 0) ctx.drawImage(img, mid - 4, hy);
      else {
        // left and right halves drift apart with a jagged crack between them
        ctx.drawImage(img, 0, 0, 4, 8, mid - 4 - split, hy, 4, 8);
        ctx.drawImage(img, 4, 0, 5, 8, mid + split, hy + 1, 5, 8);
        px(ctx, mid - split, hy + 1, P.k, 1, 2); px(ctx, mid - split + 1, hy + 3, P.k, 1, 2); px(ctx, mid - split, hy + 5, P.k, 1, 2);
      }
      if (split > 0) {
        // Chloe's joy: little sparkles; Hunter's despair: a single sweat drop
        LW.Sprites.draw(ctx, 'sparkle', Math.floor(T * 8), cx + 6, GROUND - 26);
        px(ctx, hx + 6, GROUND - 26 + Math.round((T * 8) % 4), '#7fd8ff', 2, 3);
      }
      if (this.phase === 'moment' && t > 1.6) F.draw(ctx, LW.STORY.moment, LW.VIEW_W / 2, 30, { color: P.p, align: 'center', outline: P.k });
    }

    ctx.restore();
    if (this.phase === 'card') this.drawCard(ctx, t);
    if (this.phase === 'list') this.drawList(ctx);
  };

  Ending.prototype.drawCard = function (ctx, t) {
    const s = this.stats;
    const a = Math.min(1, t * 1.5);
    ctx.globalAlpha = 0.72 * a; px(ctx, 0, 0, P.k, LW.VIEW_W, VH); ctx.globalAlpha = a;
    const [l1, l2] = LW.STORY.finalCard;
    F.draw(ctx, l1, LW.VIEW_W / 2, 8, { color: P.w, scale: 2, align: 'center', outline: P.k });
    F.draw(ctx, l2, LW.VIEW_W / 2, 26, { color: P.g, scale: 2, align: 'center', outline: P.k });
    const y = 50;
    const ox = Math.round((LW.VIEW_W - 320) / 2);
    F.draw(ctx, 'SCORE', ox + 40, y, { color: P.i }); F.draw(ctx, String(s.score), ox + 128, y, { color: P.w, align: 'right' });
    F.draw(ctx, 'KM', ox + 40, y + 11, { color: P.i }); F.draw(ctx, LW.Story.fmt(s.km), ox + 128, y + 11, { color: P.w, align: 'right' });
    F.draw(ctx, 'CATS', ox + 40, y + 22, { color: P.i }); F.draw(ctx, s.cats + ' / ' + s.catsTotal, ox + 128, y + 22, { color: P.p, align: 'right' });
    F.draw(ctx, 'BOOKS', ox + 172, y, { color: P.i }); F.draw(ctx, s.books + ' / ' + s.booksTotal, ox + 280, y, { color: P.v, align: 'right' });
    F.draw(ctx, 'TOOLS', ox + 172, y + 11, { color: P.i }); F.draw(ctx, s.tools + ' / ' + s.toolsTotal, ox + 280, y + 11, { color: P.a, align: 'right' });
    F.draw(ctx, 'MODE', ox + 172, y + 22, { color: P.i }); F.draw(ctx, LW.CFG.difficulty[s.difficulty].label, ox + 280, y + 22, { color: P.w, align: 'right' });
    ctx.globalAlpha = 1;
    if (t > 1.2) {
      LW.roundBox(ctx, ox + 80, 88, 160, 4 + 3 * 15 + 3, '#2b2633', P.w);
      const note = this.menu.draw(ctx, ox + 83, 91, 154, this.T);
      if (note) F.draw(ctx, note, LW.VIEW_W / 2, 146, { color: P.g, align: 'center', outline: P.k });
    }
  };

  Ending.prototype.drawList = function (ctx) {
    const s = this.stats, per = 6;
    px(ctx, 0, 0, P.k, LW.VIEW_W, VH);
    LW.roundBox(ctx, 10, 6, LW.VIEW_W - 20, VH - 12, '#2b2633', P.v);
    F.draw(ctx, 'YOUR READING LIST', LW.VIEW_W / 2, 12, { color: P.g, scale: 2, align: 'center' });
    if (!s.reading.length) F.draw(ctx, 'NO BOOKS YET. THE LIBRARY AWAITS.', LW.VIEW_W / 2, 80, { color: P.w, align: 'center' });
    s.reading.slice(this.page * per, this.page * per + per).forEach(([title, author], i) => {
      const y = 34 + i * 20;
      LW.Sprites.draw(ctx, ['book', 'book_teal', 'book_orange', 'book_pink', 'book_green'][(this.page * per + i) % 5], 0, 26, y + 15);
      F.draw(ctx, title, 38, y + 1, { color: P.w });
      F.draw(ctx, author, 38, y + 10, { color: P.v });
    });
    const pages = Math.max(1, Math.ceil(s.reading.length / per));
    F.draw(ctx, (pages > 1 ? 'PAGE ' + (this.page + 1) + ' / ' + pages + '   LEFT / RIGHT   ' : '') + 'JUMP TO GO BACK', LW.VIEW_W / 2, VH - 17, { color: P.i, align: 'center' });
  };

  LW.Ending = Ending;
})();
