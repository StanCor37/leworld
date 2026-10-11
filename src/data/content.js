// Writing that appears during play. Edit freely: the pixel font is uppercase ASCII, so
// accents are written without them (Anzaldua, Estes, Cixous).
window.LW = window.LW || {};

// Fifty feminist (and feminist-adjacent) books. Each book pickup in the adventure gets one,
// shown with its author when collected and listed in the ending's reading list.
LW.BOOKS = [
  ['The Second Sex', 'Simone de Beauvoir'],
  ['The Hour of the Star', 'Clarice Lispector'],
  ['Near to the Wild Heart', 'Clarice Lispector'],
  ['The Passion According to G.H.', 'Clarice Lispector'],
  ['The Feminine Mystique', 'Betty Friedan'],
  ['Women, Race & Class', 'Angela Davis'],
  ['Are Prisons Obsolete?', 'Angela Davis'],
  ["A Room of One's Own", 'Virginia Woolf'],
  ['Orlando', 'Virginia Woolf'],
  ['Three Guineas', 'Virginia Woolf'],
  ['A Vindication of the Rights of Woman', 'Mary Wollstonecraft'],
  ['Sister Outsider', 'Audre Lorde'],
  ['Zami: A New Spelling of My Name', 'Audre Lorde'],
  ["Ain't I a Woman", 'bell hooks'],
  ['Feminism Is for Everybody', 'bell hooks'],
  ['All About Love', 'bell hooks'],
  ['Gender Trouble', 'Judith Butler'],
  ['Sexual Politics', 'Kate Millett'],
  ['The Female Eunuch', 'Germaine Greer'],
  ['The Dialectic of Sex', 'Shulamith Firestone'],
  ['We Should All Be Feminists', 'Chimamanda Ngozi Adichie'],
  ['Bad Feminist', 'Roxane Gay'],
  ['Men Explain Things to Me', 'Rebecca Solnit'],
  ["The Handmaid's Tale", 'Margaret Atwood'],
  ['The Color Purple', 'Alice Walker'],
  ["In Search of Our Mothers' Gardens", 'Alice Walker'],
  ['Stone Butch Blues', 'Leslie Feinberg'],
  ['Fun Home', 'Alison Bechdel'],
  ['Rubyfruit Jungle', 'Rita Mae Brown'],
  ['The Well of Loneliness', 'Radclyffe Hall'],
  ['Tipping the Velvet', 'Sarah Waters'],
  ['Lesbian Nation', 'Jill Johnston'],
  ['Borderlands / La Frontera', 'Gloria Anzaldua'],
  ['This Bridge Called My Back', 'Cherrie Moraga & Gloria Anzaldua'],
  ['Women Who Run with the Wolves', 'Clarissa Pinkola Estes'],
  ['Caliban and the Witch', 'Silvia Federici'],
  ['Living a Feminist Life', 'Sara Ahmed'],
  ['Invisible Women', 'Caroline Criado Perez'],
  ['Whipping Girl', 'Julia Serano'],
  ['Hood Feminism', 'Mikki Kendall'],
  ['Down Girl', 'Kate Manne'],
  ['The Bell Jar', 'Sylvia Plath'],
  ['I Know Why the Caged Bird Sings', 'Maya Angelou'],
  ['Their Eyes Were Watching God', 'Zora Neale Hurston'],
  ['Herland', 'Charlotte Perkins Gilman'],
  ['The Yellow Wallpaper', 'Charlotte Perkins Gilman'],
  ['Persepolis', 'Marjane Satrapi'],
  ['Girl, Woman, Other', 'Bernardine Evaristo'],
  ['The Laugh of the Medusa', 'Helene Cixous'],
  ['Our Bodies, Ourselves', "Boston Women's Health Collective"]
];

// One-liners when Hunter picks up a power tool (by tool look).
LW.TOOL_QUIPS = {
  tool_drill: ['CORDLESS. LIKE MY HEART.', 'FOR SHELVES AND EMERGENCIES', 'HOLE-Y MATRIMONY'],
  tool_hammer: ['NAILED IT', 'EVERY PROBLEM IS A NAIL', 'GENTLE PARENTING TOOL'],
  tool_wrench: ['ADJUSTABLE, LIKE MY STANDARDS', 'TIGHTENS THINGS. LIKE THE PLOT.', 'MONKEY? NO. LESBIAN.'],
  tool_saw: ['CUTS THROUGH NONSENSE', 'SEE SAW. SAW SEE.', 'FLAT-PACK FEARS NOTHING']
};

// Chloe's texts mid-level (short, non-blocking). Levels can override with def.pings.
LW.CHLOE_PINGS = {
  checkpoint: [
    'U STILL ALIVE? ASKING FOR ME',
    'SAW YOU ON THE NEWS. NICE BOOTS',
    'MY CAT SAYS HURRY UP',
    'I PRACTISED A CASUAL HELLO. 40 TIMES.',
    'KEEP GOING, HANDY WOMAN'
  ],
  unlockFire: "RADICAL READER MODE?? THAT'S MY LOVE LANGUAGE",
  repair: 'DID YOU JUST FIX YOURSELF WITH A DRILL? HOT',
  cat: 'YOU PET A CAT WITHOUT ME?? THE BETRAYAL',
  lowHealth: 'BREATHE. HYDRATE. JUMP ON HIM.'
};

// What enemies say (speech bubbles). Each enemy cycles through its own list.
// The pixel font has no diacritics: write c/s/z/dj instead of č/ć/š/ž/đ.
LW.TAUNTS = {
  ex: [
    'BABE, WAIT!', 'I CAN CHANGE!', 'I WROTE YOU A SONG!', 'SHE ONLY LIKES ME FOR MY ARMS',
    'THIS IS SO UNFAIR', 'I HAVE A PODCAST!',
    "SHE'LL COME BACK TO ME. EVENTUALLY.", "I'M NOT CRYING, IT'S PROTEIN SWEAT",
    'I DID A 5K FOR HER. WELL, A 2K.', 'WE WERE BASICALLY ENGAGED (IN MY HEAD)',
    "I'M AN ALPHA. MY THERAPIST DISAGREES.", "YOU CAN'T EVEN GROW A BEARD",
    'I STILL HAVE HER HOODIE. AND FEELINGS.', "IT'S JUST A PHASE, BRO"
  ],
  suitor: [
    'SMILE MORE, BEAUTIFUL', 'NOT LIKE OTHER GUYS, I SWEAR', "YOU'D BE PRETTIER WITH ME",
    'HAVE YOU TRIED A REAL MAN?', 'WHY ARE YOU IGNORING ME, PRINCESS?', "I'M A NICE GUY. NOTICE ME.",
    'I COULD FIX YOU', 'U UP? HELLO? HELLO??', "I'M BASICALLY A FEMINIST. SMILE."
  ],
  agitator: [
    "WE'RE JUST ASKING QUESTIONS!", 'NOT IN MY NEIGHBOURHOOD!', 'OI!', 'THINK OF THE CHILDREN!', 'FREE SPEECH! (MINE ONLY)',
    'BRAK JE ZAJEDNICA IZMEDJU MUSKARCA I ZENE!', 'NO TO BRUSSELS! NO TO RAINBOWS!', 'TRADITION! (STARTED IN 2015)',
    "THEY'RE COMING FOR OUR BARBECUES!", 'BRING BACK THE GOOD OLD DAYS (THAT NEVER WERE)', 'I READ IT ON A FORUM!',
    "NATURAL ORDER! (I DON'T KNOW WHAT IT MEANS)", 'PROTECT TRADITIONAL VALUES!', 'STOP THE PROPAGANDA! (THE BOOKS)',
    'EU OUT! RAINBOWS OUT! FUN OUT!'
  ],
  preacher: [
    'REPENT!', "THAT'S NOT IN THE BOOK!", 'HAVE YOU TRIED BEING SAD?', 'I SHALL PRAY FOR YOUR BOOTS', 'SINNER! ...NICE FLANNEL THOUGH',
    "IT'S A BLASPHEMY!", 'BOG JE STVORIO ADAMA I EVU, NE ADAMA I STEVU!', 'THE END IS NEAR! (OF MY SHIFT)',
    'YOUR FLANNEL IS SINFUL', "I'LL PRAY IT AWAY! ...OK, MAYBE NOT", 'LEVITICUS SAYS... (I SKIPPED THE SHELLFISH PART)',
    'LOVE THY NEIGHBOUR! (NOT LIKE THAT)', 'READING BOOKS IS HOW IT STARTS!', "ARE YOU SAVED? YOUR GAME ISN'T."
  ],
  inspector: [
    "IT'S A PHASE.", 'WHO IS THE MAN AND WHO IS THE WOMAN?', 'LICENCE AND REGISTRATION', 'HAVE YOU TRIED MEN?',
    'THIS ROMANCE IS UNAUTHORISED', "YOU JUST HAVEN'T MET THE RIGHT GUY", 'BUT WHO PAYS FOR DINNER?',
    'SO WHICH ONE OF YOU OPENS JARS?', 'ARE YOU TWO SISTERS?', "I'LL NEED TO SEE SOME PAPERWORK",
    'HAS ANYONE ASKED YOUR FATHER?', 'IS THIS A PHASE?'
  ],
  pontiff: [
    "ADAM AND EVE! NOT ADAM AND STEVE! ...WHO IS STEVE?", 'I HAVE A VERY LARGE HAT FOR A REASON',
    'BLESS ME, FOR I AM ALWAYS RIGHT', 'THIS SOAPBOX WAS VERY EXPENSIVE', 'SILENCE IN MY PALACE! EXCEPT ME.',
    'REPENT! OR AT LEAST TONE IT DOWN.'
  ]
};

// What happens when Hunter pets a secret cat.
LW.CAT_LINES = ['+100 SEROTONIN', 'PURR-FECT', 'CAT APPROVES OF YOU', '+1 EMOTIONAL SUPPORT', 'MRRP!', 'SHE WILL REMEMBER THIS'];
