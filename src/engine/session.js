// Session: adventure-wide progress that survives level restarts (and, later, page reloads).
// Score is awarded once per collectible per level for the whole adventure, so restarting a
// level can never farm points.
(function () {
  function create(difficulty) {
    return {
      difficulty: difficulty || 'casual',
      score: 0,
      collected: {},     // levelId -> { itemId: true }
      cats: {}           // catId -> true (secret cats petted)
    };
  }

  function hasScored(session, levelId, itemId) {
    return !!(session.collected[levelId] && session.collected[levelId][itemId]);
  }

  // Returns the points awarded (0 if this item already scored in this adventure).
  function award(session, levelId, itemId, points) {
    const lvl = session.collected[levelId] || (session.collected[levelId] = {});
    if (lvl[itemId]) return 0;
    lvl[itemId] = true;
    session.score += points;
    return points;
  }

  function count(session, levelId, kind) {
    const lvl = session.collected[levelId] || {};
    return Object.keys(lvl).filter(k => k.startsWith(kind + '@')).length;
  }

  LW.Session = { create, hasScored, award, count };
})();
