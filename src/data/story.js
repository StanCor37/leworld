// Story text. {HUNTER_COUNTRY}, {CHLOE_COUNTRY} and {KM} are filled in per adventure.
// who: 'chloe' | 'hunter' | 'sys' (a small system line in the app).
window.LW = window.LW || {};

LW.STORY = {
  intro: [
    ['chloe', 'COFFEE?'],
    ['hunter', 'ABSOLUTELY. WHERE?'],
    ['chloe', 'THERE MIGHT BE A SMALL GEOGRAPHICAL COMPLICATION.'],
    ['hunter', 'I OWN SENSIBLE BOOTS.'],
    ['sys', 'HUNTER SHARED A LOCATION: {HUNTER_COUNTRY}'],
    ['sys', 'CHLOE SHARED A LOCATION: {CHLOE_COUNTRY}'],
    ['sys', 'DISTANCE: {KM} KM'],
    ['chloe', "...THAT'S A LOT OF KM."],
    ['hunter', 'GEOGRAPHY IS JUST AN INCONVENIENT PLATFORMING MECHANIC.'],
    ['chloe', 'IS THAT A YES?'],
    ['hunter', 'PACKING MY DRILL.']
  ],

  // After each level (index = level just finished, 0-based).
  interludes: [
    [
      ['chloe', "HOW'S THE TRIP?"],
      ['hunter', 'SOMEONE TRIED TO DEBATE MY EXISTENCE. I JUMPED OVER HIM.'],
      ['chloe', 'GOOD. I BOOKED US A TABLE.'],
      ['hunter', 'ALSO YOUR EX SAYS HI. LOUDLY. WITH HIS ARMS.']
    ],
    [
      ['chloe', 'WHY IS MY PHONE FULL OF MEN SAYING HEY BEAUTIFUL TO YOU'],
      ['hunter', 'THEY THREW IT AT ME. LITERALLY.'],
      ['chloe', "I'D NEVER THROW A COMPLIMENT. I'D HAND-DELIVER IT."],
      ['hunter', "THAT'S WHY I'M CROSSING THE PLANET."]
    ],
    [
      ['chloe', 'HOW ARE THE BOOTS?'],
      ['hunter', 'SENSIBLE. MUDDY. EMOTIONALLY SUPPORTIVE.'],
      ['chloe', 'I READ ONE OF YOUR BOOKS. WE NEED TO TALK. (GOOD TALK.)'],
      ['hunter', 'BRING SNACKS TO THE GOOD TALK.']
    ],
    [
      ['chloe', 'SAW THE NEWS. ARE YOU OK?'],
      ['hunter', 'THEY HAD SIGNS. I HAD BOOKS. BOOKS WON.'],
      ['chloe', 'MY HERO. MY HANDY, WELL-READ HERO.'],
      ['hunter', 'STILL HAVE THE TABLE?'],
      ['chloe', 'GUARDING IT WITH MY LIFE.']
    ],
    [
      ['chloe', 'TRAIN UPDATE?'],
      ['hunter', 'A MAN IN A HAT JUDGED ME FOR 300 KM.'],
      ['chloe', 'AND?'],
      ['hunter', 'HE MET MALE LONELINESS. IT WENT BADLY FOR HIM.'],
      ['chloe', 'NEXT STOP A PALACE?? ARE YOU A PRINCESS NOW']
    ],
    [
      ['chloe', 'DID YOU... BREAK A SOAPBOX?'],
      ['hunter', 'SPIRITUALLY AND PHYSICALLY.'],
      ['chloe', 'I CAN SEE THE SUNSET FROM THE CAFE. HURRY.'],
      ['hunter', 'ALMOST THERE. LOOK FOR THE FLANNEL.']
    ]
  ],

  // The "first date". {BOOK} is the first book Hunter picked up (or a fallback).
  // Plot twist: Hunter gets friendzoned.
  ending: [
    ['chloe', 'YOU MADE IT!'],
    ['hunter', 'TRAFFIC WAS TERRIBLE. MOSTLY MEN.'],
    ['chloe', 'I SAVED YOU A SEAT. AND A CROISSANT.'],
    ['hunter', 'I BROUGHT YOU A BOOK. {BOOK}.'],
    ['chloe', 'HUNTER... YOU CROSSED THE WHOLE WORLD FOR ME.'],
    ['hunter', "I'D DO IT AGAIN. WITH BETTER BOOTS."],
    ['chloe', "YOU'RE THE BEST... FRIEND I'VE EVER HAD."],
    ['hunter', '...FRIEND.'],
    ['chloe', "BEST FRIEND! LIKE SISTERS! LET'S GO TO IKEA TOGETHER!"],
    ['hunter', 'I DID BRING A DRILL.']
  ],
  moment: '*FRIENDZONED IN TWO TIMEZONES*',
  finalCard: ['DISTANCE TRAVELLED.', 'FRIENDZONE CONFIRMED.']
};
