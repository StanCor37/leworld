// LeWorld audio: everything is synthesised with Web Audio (no files). Music is a small
// chiptune sequencer (pulse lead, triangle bass, noise drums); effects are short synth
// recipes. Audio only starts after the first key press or tap, as browsers require.
(function () {
  let ctx = null, master, musicBus, sfxBus, noiseBuf, pulseWave;
  let muted = false, unlocked = false;
  const MUSIC_VOL = 0.28, SFX_VOL = 0.5;

  // ---------------------------------------------------------------- setup
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = MUSIC_VOL; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(master);
    // white noise for drums and crunchy effects
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // 25% pulse wave: the classic console lead sound
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    pulseWave = ctx.createPeriodicWave(re, im);
    return true;
  }
  // Called from the first user gesture.
  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!unlocked) { unlocked = true; if (wanted) startSong(wanted); }
  }
  ['keydown', 'pointerdown', 'touchend'].forEach(ev => addEventListener(ev, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (unlocked) ctx.resume();
  });

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.03);
  }

  // ---------------------------------------------------------------- voices
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(name) {
    const m = /^([A-G]#?)(-?\d)$/.exec(name);
    if (!m) return 0;
    const midi = (parseInt(m[2], 10) + 1) * 12 + NOTE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function tone(bus, type, f0, t, dur, vol, opts) {
    opts = opts || {};
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (type === 'pulse') o.setPeriodicWave(pulseWave); else o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + (opts.slide || dur));
    if (opts.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = opts.vib; lg.gain.value = f0 * 0.015;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    const a = opts.attack || 0.004, rel = opts.release || 0.04;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(bus, t, dur, vol, filter, fq, opts) {
    opts = opts || {};
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = filter; f.frequency.setValueAtTime(fq, t);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    if (opts.q) f.Q.value = opts.q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  function drum(kind, t) {
    if (kind === 'k') tone(musicBus, 'sine', 150, t, 0.16, 0.9, { to: 45, slide: 0.12, release: 0.08 });
    else if (kind === 's') { noise(musicBus, t, 0.12, 0.5, 'bandpass', 1800, { q: 0.8 }); tone(musicBus, 'triangle', 220, t, 0.06, 0.25, { to: 140 }); }
    else if (kind === 'h') noise(musicBus, t, 0.04, 0.22, 'highpass', 7000);
  }

  // ---------------------------------------------------------------- music sequencer
  function parse(str) { return (str || '').split(/\s+/).filter(x => x && x !== '|'); }
  function compile(song) {
    const lead = parse(song.lead), bass = parse(song.bass), drums = parse(song.drums);
    const n = Math.max(lead.length, bass.length, drums.length);
    const notes = (seq) => {
      const out = [];
      for (let i = 0; i < seq.length; i++) {
        const tok = seq[i];
        if (tok === '-' || tok === '.') continue;
        let len = 1;
        while (seq[i + len] === '-') len++;
        out.push({ step: i, len, f: freq(tok) });
      }
      return out;
    };
    return { n, step: 60 / song.bpm / 2, lead: notes(lead), bass: notes(bass), drums, leadVol: song.leadVol || 0.5 };
  }
  const compiled = {};
  function getSong(name) {
    if (!LW.MUSIC || !LW.MUSIC[name]) return null;
    return compiled[name] || (compiled[name] = compile(LW.MUSIC[name]));
  }

  let wanted = null, current = null, songGain = null, nextStep = 0, nextTime = 0, timer = null;
  function startSong(name) {
    stopSong();
    const song = getSong(name);
    if (!song || !ctx) return;
    current = { name, song };
    songGain = ctx.createGain(); songGain.gain.value = 0.0001; songGain.connect(musicBus);
    songGain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.4);
    nextStep = 0; nextTime = ctx.currentTime + 0.08;
    timer = setInterval(schedule, 25);
    schedule();
  }
  function stopSong(fade) {
    if (timer) { clearInterval(timer); timer = null; }
    if (songGain && ctx) {
      const g = songGain;
      g.gain.setTargetAtTime(0.0001, ctx.currentTime, fade || 0.12);
      setTimeout(() => g.disconnect(), 900);
    }
    songGain = null; current = null;
  }
  function schedule() {
    if (!current || !ctx) return;
    const s = current.song;
    while (nextTime < ctx.currentTime + 0.12) {
      const i = nextStep % s.n;
      for (const nt of s.lead) if (nt.step === i && nt.f) voice('lead', nt, nextTime, s);
      for (const nt of s.bass) if (nt.step === i && nt.f) voice('bass', nt, nextTime, s);
      const dk = s.drums[i];
      if (dk && dk !== '.') drum(dk, nextTime);
      nextStep++; nextTime += s.step;
    }
  }
  function voice(part, nt, t, s) {
    const dur = nt.len * s.step * 0.92;
    const bus = songGain;
    if (part === 'lead') tone(bus, 'pulse', nt.f, t, dur, 0.18 * s.leadVol / 0.5, { vib: nt.len > 2 ? 5.5 : 0, release: 0.05 });
    else tone(bus, 'triangle', nt.f, t, dur, 0.42, { release: 0.03 });
  }

  // Ask for a song by name; switching to the song already playing does nothing.
  function music(name) {
    wanted = name;
    if (!ctx || !unlocked) return;
    if (current && current.name === name) return;
    if (!name) { stopSong(0.25); return; }
    startSong(name);
  }
  // Duck the music (pause menu) without stopping it.
  function duck(on) { if (musicBus) musicBus.gain.setTargetAtTime(on ? MUSIC_VOL * 0.35 : MUSIC_VOL, ctx.currentTime, 0.08); }

  // ---------------------------------------------------------------- effects
  const N = n => freq(n);
  const SFX = {
    jump: t => tone(sfxBus, 'pulse', 330, t, 0.13, 0.22, { to: 660, slide: 0.1 }),
    land: t => noise(sfxBus, t, 0.05, 0.12, 'lowpass', 900),
    stomp: t => { tone(sfxBus, 'square', 220, t, 0.08, 0.25, { to: 90 }); tone(sfxBus, 'pulse', 520, t + 0.06, 0.12, 0.2, { to: 880 }); },
    book: t => [N('C6'), N('E6'), N('G6'), N('C7')].forEach((f, i) => tone(sfxBus, 'triangle', f, t + i * 0.05, 0.09, 0.3)),
    tool: t => { tone(sfxBus, 'square', 1250, t, 0.05, 0.12); tone(sfxBus, 'square', 1880, t + 0.04, 0.09, 0.1); noise(sfxBus, t, 0.05, 0.1, 'highpass', 5000); },
    reread: t => tone(sfxBus, 'triangle', N('G5'), t, 0.08, 0.18),
    hurt: t => { tone(sfxBus, 'square', 420, t, 0.25, 0.28, { to: 110 }); noise(sfxBus, t, 0.15, 0.2, 'lowpass', 1200); },
    fell: t => tone(sfxBus, 'pulse', 700, t, 0.5, 0.22, { to: 80, slide: 0.45 }),
    // the MALE LONELINESS shot: a melodramatic little "wahh"
    fire: t => { tone(sfxBus, 'pulse', 520, t, 0.22, 0.2, { to: 260, slide: 0.2, vib: 9 }); noise(sfxBus, t, 0.1, 0.08, 'bandpass', 2500); },
    shotHit: t => { tone(sfxBus, 'square', 600, t, 0.07, 0.2, { to: 200 }); noise(sfxBus, t, 0.08, 0.18, 'bandpass', 1500); },
    pop: t => tone(sfxBus, 'sine', 900, t, 0.08, 0.3, { to: 1800, slide: 0.05 }),
    deflect: t => tone(sfxBus, 'square', 160, t, 0.12, 0.2, { to: 140 }),
    unlockFire: t => [N('C5'), N('E5'), N('G5'), N('C6'), N('E6'), N('G6')].forEach((f, i) => tone(sfxBus, 'pulse', f, t + i * 0.06, 0.12, 0.2)),
    repair: t => { tone(sfxBus, 'triangle', N('G5'), t, 0.1, 0.3); tone(sfxBus, 'triangle', N('C6'), t + 0.1, 0.18, 0.3); },
    charge: t => tone(sfxBus, 'pulse', N('E6'), t, 0.15, 0.15, { vib: 12 }),
    checkpoint: t => [N('C5'), N('E5'), N('G5'), N('C6')].forEach((f, i) => tone(sfxBus, 'pulse', f, t + i * 0.09, i === 3 ? 0.35 : 0.1, 0.22)),
    complete: t => {
      const mel = ['C5', 'E5', 'G5', 'C6', '-', 'G5', 'C6', 'E6'];
      mel.forEach((n, i) => { if (n !== '-') tone(sfxBus, 'pulse', N(n), t + i * 0.11, i === 7 ? 0.6 : 0.1, 0.24, { vib: i === 7 ? 6 : 0 }); });
      [N('C3'), N('G3'), N('C4')].forEach((f, i) => tone(sfxBus, 'triangle', f, t + i * 0.3, 0.3, 0.3));
    },
    defeat: t => ['G4', 'F#4', 'F4', 'E4'].forEach((n, i) => tone(sfxBus, 'pulse', N(n), t + i * 0.22, i === 3 ? 0.6 : 0.2, 0.22, { vib: i === 3 ? 6 : 0 })),
    // the ending's "...FRIEND.": a sad trombone
    sadTrombone: t => ['D#4', 'D4', 'C#4', 'C4'].forEach((n, i) => tone(sfxBus, 'sawtooth', N(n), t + i * 0.32, i === 3 ? 0.9 : 0.3, 0.16, { vib: i === 3 ? 5 : 0, attack: 0.03 })),
    bossHit: t => { tone(sfxBus, 'square', 110, t, 0.3, 0.35, { to: 50 }); noise(sfxBus, t, 0.3, 0.3, 'lowpass', 600); },
    bossDown: t => { noise(sfxBus, t, 0.8, 0.4, 'lowpass', 2000, { to: 200 }); SFX.complete(t + 0.5); },
    thud: t => { tone(sfxBus, 'sine', 90, t, 0.2, 0.4, { to: 40 }); noise(sfxBus, t, 0.12, 0.2, 'lowpass', 500); },
    rumble: t => noise(sfxBus, t, 0.35, 0.12, 'lowpass', 300),
    kiss: t => tone(sfxBus, 'sine', 900, t, 0.09, 0.15, { to: 1500, slide: 0.06 }),          // HEY BEAUTIFUL
    scroll: t => noise(sfxBus, t, 0.12, 0.1, 'bandpass', 3000, { to: 1000 }),
    amen: t => { tone(sfxBus, 'square', 80, t, 0.25, 0.3, { to: 50 }); noise(sfxBus, t, 0.2, 0.2, 'lowpass', 400); },
    blah: t => [0, 1].forEach(i => tone(sfxBus, 'square', 180 - i * 30, t + i * 0.1, 0.08, 0.12)),
    say: t => [0, 1, 2].forEach(i => tone(sfxBus, 'square', 260 + Math.random() * 160, t + i * 0.045, 0.035, 0.05)),
    ping: t => { tone(sfxBus, 'sine', N('E6'), t, 0.12, 0.25); tone(sfxBus, 'sine', N('A6'), t + 0.1, 0.2, 0.22); },
    purr: t => { for (let i = 0; i < 6; i++) tone(sfxBus, 'triangle', 70 + (i % 2) * 8, t + i * 0.07, 0.07, 0.25); tone(sfxBus, 'sine', 600, t + 0.45, 0.15, 0.12, { to: 800 }); },
    blip: t => tone(sfxBus, 'pulse', 880, t, 0.04, 0.12),
    select: t => { tone(sfxBus, 'pulse', 660, t, 0.05, 0.16); tone(sfxBus, 'pulse', 990, t + 0.05, 0.08, 0.16); },
    back: t => tone(sfxBus, 'pulse', 500, t, 0.06, 0.14, { to: 350 }),
    type: t => tone(sfxBus, 'square', 1400 + Math.random() * 300, t, 0.02, 0.04),
    heartbreak: t => { tone(sfxBus, 'triangle', N('E5'), t, 0.15, 0.3); noise(sfxBus, t + 0.12, 0.15, 0.25, 'highpass', 3000); tone(sfxBus, 'triangle', N('A#4'), t + 0.15, 0.4, 0.25, { vib: 6 }); }
  };
  const lastPlayed = {};
  function sfx(name) {
    if (!ctx || !unlocked || muted || !SFX[name]) return;
    const now = ctx.currentTime;
    if (lastPlayed[name] && now - lastPlayed[name] < 0.03) return;   // avoid stacking the same sound
    lastPlayed[name] = now;
    SFX[name](now + 0.005);
  }

  LW.Audio = {
    unlock, setMuted, music, sfx, duck,
    get unlocked() { return unlocked; }, get muted() { return muted; }, get playing() { return current && current.name; },
    _ctx: () => ctx, _master: () => master,
    _songInfo: name => { const s = getSong(name); return s && { steps: s.n, lead: s.lead.length, bass: s.bass.length }; }
  };
})();
