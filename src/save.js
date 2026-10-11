// Saving: browser-local storage for this version. Two keys:
//   leworld.settings  - sound and preferred difficulty (kept even without an adventure)
//   leworld.save      - the current adventure
// Everything is wrapped in try/catch: private windows, blocked storage or a corrupted save
// simply behave as "no save".
(function () {
  const SAVE_KEY = 'leworld.save', SETTINGS_KEY = 'leworld.settings', VERSION = 1;

  function read(key) {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function write(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  // ---------------------------------------------------------------- settings
  const settings = Object.assign({ sound: true, difficulty: 'casual' }, read(SETTINGS_KEY) || {});
  function saveSettings() { write(SETTINGS_KEY, { sound: !!settings.sound, difficulty: settings.difficulty }); }

  // ---------------------------------------------------------------- adventure
  // Validate shape so a hand-edited or old save can't crash the game.
  function valid(d) {
    return d && d.v === VERSION && d.countries && d.countries.hunter && d.countries.chloe &&
      LW.CFG.difficulty[d.difficulty] && typeof d.score === 'number' && d.current &&
      LW.LEVELS[d.current.level] && Array.isArray(d.completed);
  }
  let lastError = null;
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { lastError = null; return null; }
    if (!raw) { lastError = null; return null; }
    const d = read(SAVE_KEY);
    if (!valid(d)) { lastError = 'Saved progress could not be read, so it was set aside.'; return null; }
    lastError = null;
    return d;
  }
  function has() { return !!load(); }
  function clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
  function store(d) { d.v = VERSION; d.savedAt = Date.now(); return write(SAVE_KEY, d); }

  LW.Save = { load, has, clear, store, settings, saveSettings, error: () => lastError, VERSION };
})();
