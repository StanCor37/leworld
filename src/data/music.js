// Original chiptune loops. Each song: bpm, then 8th-note steps for lead, bass and drums.
// Notes: C5, F#2, A#4 ... ; '-' holds the previous note; '.' is a rest. '|' is just a bar
// line for readability. Drums: k = kick, s = snare, h = hi-hat, '.' = nothing.
window.LW = window.LW || {};

LW.MUSIC = {
  // Title and story: a warm, slightly lovesick theme.
  love: {
    bpm: 100, leadVol: 0.55,
    lead: 'E5 - G5 - C6 - B5 A5 | G5 - E5 - C5 - D5 E5 | F5 - A5 - C6 - A5 F5 | G5 - - - B4 - D5 -',
    bass: 'C3 - C3 - G2 - G2 - | A2 - A2 - E2 - E2 - | F2 - F2 - C3 - C3 - | G2 - G2 - D3 - B2 -',
    drums: 'k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . s s'
  },
  // Story chats: the same theme, softer, no drums.
  chat: {
    bpm: 88, leadVol: 0.4,
    lead: 'E5 - G5 - C6 - B5 A5 | G5 - E5 - C5 - D5 E5 | F5 - A5 - C6 - A5 F5 | G5 - - - B4 - D5 -',
    bass: 'C3 - - - G2 - - - | A2 - - - E2 - - - | F2 - - - C3 - - - | G2 - - - G2 - - -',
    drums: ''
  },
  // 1. Out of Office - bouncy street pop
  street: {
    bpm: 140,
    lead: 'C5 E5 G5 E5 C6 - G5 - | A5 G5 E5 C5 D5 - - - | F5 A5 C6 A5 G5 E5 C5 E5 | D5 - B4 - C5 - - .',
    bass: 'C3 . G2 . C3 . G2 . | A2 . E2 . A2 . G2 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . G2 .',
    drums: 'k . h k s . h . | k . h k s . h h | k . h k s . h . | k k h . s s s s'
  },
  // 2. Unsolicited Avenue - funky minor strut
  avenue: {
    bpm: 128,
    lead: 'A4 . C5 E5 . D5 C5 . | G4 . B4 D5 . C5 B4 . | F4 . A4 C5 . E5 D5 . | E5 - - . G#4 - B4 -',
    bass: 'A2 A2 . A3 . A2 G2 . | G2 G2 . G3 . G2 F2 . | F2 F2 . F3 . F2 E2 . | E2 E2 . E3 . E2 E2 .',
    drums: 'k . h . s . h k | . k h . s . h . | k . h . s . h k | . k h . s s h s'
  },
  // 3. The Long Way Round - folksy, open countryside
  country: {
    bpm: 112,
    lead: 'D5 - B4 - G4 - B4 D5 | E5 - D5 - B4 - - - | C5 - E5 - G5 - E5 C5 | D5 - - - - - D5 -',
    bass: 'G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | A2 . E3 . A2 . E3 . | D3 . A2 . D3 . F#2 .',
    drums: 'k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h'
  },
  // 4. Red Flag District - driving, grim, chuggy
  industrial: {
    bpm: 150,
    lead: 'E5 . E5 . G5 . E5 D5 | E5 . B4 . D5 . B4 A4 | C5 . C5 . E5 . C5 B4 | B4 - D5 - F#5 - B5 -',
    bass: 'E2 E2 E3 E2 E2 E2 E3 E2 | E2 E2 E3 E2 D2 D2 D3 D2 | C2 C2 C3 C2 C2 C2 C3 C2 | B1 B1 B2 B1 B1 B1 B2 B1',
    drums: 'k . s . k k s . | k . s . k k s . | k . s . k k s . | k s k s k s s s'
  },
  // 5. The Judgement Express - galloping train rhythm
  train: {
    bpm: 160,
    lead: 'D5 . F5 . A5 . F5 . | C5 . E5 . G5 . E5 . | A#4 . D5 . F5 . D5 . | A4 . C#5 . E5 . A5 .',
    bass: 'D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 | A#1 A#2 A#1 A#2 A#1 A#2 A#1 A#2 | A1 A2 A1 A2 A1 A2 A1 A2',
    drums: 'k h s h k h s h | k h s h k h s h | k h s h k h s h | k h s h k s s s'
  },
  // 6. The Pontiff's Palace - pompous and stately
  palace: {
    bpm: 96,
    lead: 'F5 - A5 - C6 - A5 - | A#5 - G5 - E5 - C5 - | D5 - F5 - A5 - F5 - | C5 - E5 - G5 - C6 -',
    bass: 'F2 - F3 - F2 - F3 - | C3 - C2 - C3 - C2 - | D3 - D2 - D3 - D2 - | C3 - C2 - E2 - G2 -',
    drums: 'k . . . s . . . | k . . . s . . . | k . . . s . . . | k . . . s . s .'
  },
  // The Pontiff fight - frantic minor
  boss: {
    bpm: 170,
    lead: 'C5 C5 D#5 C5 G5 . F5 D#5 | D5 D5 F5 D5 G#5 . G5 F5 | C5 C5 D#5 C5 G5 . A#5 G5 | G#5 - G5 - F5 - D5 -',
    bass: 'C2 C3 C2 C3 C2 C3 C2 C3 | A#1 A#2 A#1 A#2 A#1 A#2 A#1 A#2 | G#1 G#2 G#1 G#2 G#1 G#2 G#1 G#2 | G1 G2 G1 G2 G1 G2 G1 G2',
    drums: 'k s k s k s k s | k s k s k s k s | k s k s k s k s | k k s s k k s s'
  },
  // 7. Almost There - hopeful, the love theme with a beat
  sunset: {
    bpm: 120,
    lead: 'E5 - G5 - C6 - B5 A5 | G5 - E5 - C5 - D5 E5 | F5 - A5 - C6 - A5 F5 | G5 - A5 - B5 - D6 -',
    bass: 'C3 . C3 G2 . G2 C3 . | A2 . A2 E2 . E2 A2 . | F2 . F2 C3 . C3 F2 . | G2 . G2 D3 . D3 G2 .',
    drums: 'k . h k s . h . | k . h k s . h . | k . h k s . h . | k . h k s s s s'
  }
};
