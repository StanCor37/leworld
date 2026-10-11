// Countries Hunter and Chloe can live in, grouped by continent. Each new adventure picks two
// from different continents. [name, latitude, longitude] - coordinates drive the travel map.
window.LW = window.LW || {};
LW.COUNTRIES = {
  'Europe': [['Serbia', 44.0, 21.0], ['France', 46.6, 2.4], ['Italy', 42.8, 12.5], ['Spain', 40.4, -3.7],
    ['Germany', 51.2, 10.4], ['Ireland', 53.4, -8.2], ['Portugal', 39.6, -8.0], ['Croatia', 45.1, 15.2], ['Iceland', 64.9, -19.0]],
  'Asia': [['Japan', 36.2, 138.3], ['India', 21.0, 78.0], ['Thailand', 15.9, 100.9], ['Vietnam', 14.0, 108.3],
    ['Philippines', 12.9, 121.8], ['South Korea', 36.5, 127.9]],
  'Africa': [['South Africa', -30.6, 22.9], ['Kenya', 0.0, 37.9], ['Ghana', 7.9, -1.0], ['Morocco', 31.8, -7.1],
    ['Nigeria', 9.1, 8.7], ['Senegal', 14.5, -14.5]],
  'North America': [['Canada', 56.0, -106.0], ['Mexico', 23.6, -102.5], ['USA', 39.8, -98.6], ['Cuba', 21.5, -77.8],
    ['Costa Rica', 9.7, -83.8]],
  'South America': [['Brazil', -14.2, -51.9], ['Argentina', -38.4, -63.6], ['Chile', -35.7, -71.5], ['Colombia', 4.6, -74.3],
    ['Peru', -9.2, -75.0]],
  'Oceania': [['Australia', -25.3, 133.8], ['New Zealand', -40.9, 174.9], ['Fiji', -17.7, 178.1]]
};

// Pick two countries on different continents. Returns { hunter, chloe } with name/lat/lon/continent.
LW.pickCountries = function (rand) {
  rand = rand || Math.random;
  const conts = Object.keys(LW.COUNTRIES);
  const a = conts[Math.floor(rand() * conts.length)];
  let b = a;
  while (b === a) b = conts[Math.floor(rand() * conts.length)];
  const pick = c => { const l = LW.COUNTRIES[c], [name, lat, lon] = l[Math.floor(rand() * l.length)]; return { name, lat, lon, continent: c }; };
  return { hunter: pick(a), chloe: pick(b) };
};
