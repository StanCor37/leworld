// LeWorld sprites. Pixel maps are authored as flat colour fills; LW.fromMap adds the
// dark outline automatically. Characters face RIGHT; left-facing copies are generated.
// Palette keys live in core.js (LW.PAL).
(function () {
  const MAPS = {};

  // Merge string-grid layers onto a blank w*h grid. Later layers draw over earlier ones.
  function layer(w, h, parts) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill('.'));
    for (const [rows, dx, dy] of parts) {
      for (let y = 0; y < rows.length; y++) {
        const ty = y + (dy || 0);
        if (ty < 0 || ty >= h) continue;
        for (let x = 0; x < rows[y].length; x++) {
          const ch = rows[y][x];
          const tx = x + (dx || 0);
          if (ch === '.' || ch === ' ' || tx < 0 || tx >= w) continue;
          g[ty][tx] = ch;
        }
      }
    }
    return g.map(r => r.join(''));
  }
  // Mirror 12-char left halves into symmetric 24-char rows (for front-facing portraits).
  function sym(halves) { return halves.map(r => r + r.split('').reverse().join('')); }

  // ------------------------------------------------------------------ HUNTER (16x24)
  const H_HEAD = [
    '................',
    '......hhhhh.....',
    '.....hhhhhhhh...',
    '....hhhhhhhhhhh.',
    '....hhhhhhhhhh..',
    '....HHhhssssss..',
    '....HHssssskss..',
    '....HSssssssss..',
    '.....ssssssms...',
    '......ssssss....',
    '.......sss......'
  ];
  const H_HEAD_SHOUT = H_HEAD.slice(0, 8).concat([
    '.....sssssmmm...',
    '......sssssm....',
    '.......sss......'
  ]);
  const H_HEAD_HURT = H_HEAD.slice(0, 6).concat([
    '....HHssssskks..',
    '....HSssssssss..',
    '.....sssssmm....',
    '......ssssmm....',
    '.......sss......'
  ]);
  const H_HEAD_HAPPY = H_HEAD.slice(0, 6).concat([
    '....HHsssskkss..',
    '....HSssssssss..',
    '.....sssssmmm...',
    '......ssssww....',
    '.......sss......'
  ]);

  const pad11 = r => '...........'.split('').map(() => '................').slice(0, 11).concat(r);
  const T_IDLE = pad11([
    '.....rrwwrr.....',
    '....rRrwwrRr....',
    '....rRrkRrRr....',
    '....RRRkRRRR....',
    '....rRrkssRr....',
    '....rRrkssRr....',
    '....yyyysgyy....'
  ]);
  const T_RUN_A = pad11([
    '.....rrwwrr.....',
    '....rRrwwrRr....',
    '....rRrrrRRRR...',
    '....RRRRRRRsss..',
    '....rRrRrRr.ss..',
    '....rRrRrRr.....',
    '....yyyygyyy....'
  ]);
  const T_RUN_B = pad11([
    '.....rrwwrr.....',
    '....rRrwwrRr....',
    '...RRRrrrrRr....',
    '..sRRRRRRRRR....',
    '..ss.rRrRrRr....',
    '.....rRrRrRr....',
    '.....yygyyyy....'
  ]);
  const T_JUMP = pad11([
    '.....rrwwrr.ss..',
    '....rRrwwrRRss..',
    '....rRrrrRRR....',
    '....RRRRRRRR....',
    '....rRrRrRrR....',
    '....rRrRrRrR....',
    '....yyyygyyy....'
  ]);
  const T_FIRE = pad11([
    '.....rrwwrr.....',
    '....rRrwwrRRRss.',
    '....rRrrrRRRRss.',
    '....RRRRRRRR....',
    '....rRrRrRrR....',
    '....rRrRrRrR....',
    '....yyyygyyy....'
  ]);
  const T_HURT = pad11([
    '.ss..rrwwrr..ss.',
    '.sRRrRrwwrRrRRs.',
    '....rRrrrrRr....',
    '....RRRRRRRR....',
    '....rRrRrRrR....',
    '....rRrRrRrR....',
    '....yyyygyyy....'
  ]);
  const T_WIN = pad11([
    '.....rrwwrrRR...',
    '....rRrwwrRRR...',
    '....rRrkRrRr....',
    '....RRRkRRRR....',
    '....rRrkssRr....',
    '....rRrkssRr....',
    '....yyyysgyy....'
  ]);
  const WIN_ARM = ['.ss', 'sss', '.RR', '.RR', '.RR', '.RR', '.RR', '.RR', '.RR'];

  const pad18 = r => new Array(18).fill('................').concat(r);
  const L_IDLE = pad18([
    '....jjjjjjjj....',
    '....jjjJJjjj....',
    '....jjj..jjj....',
    '....bbb..bbb....',
    '....bbbb.bbbb...'
  ]);
  const L_RUN1 = pad18([
    '....jjjjjjjj....',
    '...jjjjJ.jjjj...',
    '..jjjJ....jjjj..',
    '.bbjj......jbb..',
    '.bb........bbbb.'
  ]);
  const L_RUN2 = pad18([
    '....jjjjjjjj....',
    '...jjjjjjjjj....',
    '..bbJj..jjj.....',
    '..bb....jjj.....',
    '........bbbb....'
  ]);
  const L_RUN3 = pad18([
    '....jjjjjjjj....',
    '...JJJj..jjjj...',
    '..JJJ.....jjjj..',
    '.bbJJ......jbb..',
    '.bb........bbbb.'
  ]);
  const L_RUN4 = pad18([
    '....jjjjjjjj....',
    '....jjjjjjjjj...',
    '.....jjj.jjjbb..',
    '.....jjj...bb...',
    '.....bbbb.......'
  ]);
  const L_JUMP = pad18([
    '....jjjjjjjjj...',
    '...jjjjJjjjjjj..',
    '..bbjJ....jjbb..',
    '..bb.......bb...',
    '................'
  ]);
  const L_FALL = pad18([
    '....jjjjjjjj....',
    '...jjjj..jjjj...',
    '..jjj.....jjj...',
    '..bbb......bbb..',
    '..bb........bb..'
  ]);

  const hunter = (head, torso, legs, extra) =>
    layer(16, 24, [[legs, 0, 0], [torso, 0, 0], [head, 0, 0]].concat(extra || []));

  MAPS.hunter_idle = [
    hunter(H_HEAD, T_IDLE, L_IDLE),
    layer(16, 24, [[L_IDLE, 0, 0], [T_IDLE, 0, 1], [H_HEAD, 0, 1]])
  ];
  MAPS.hunter_run = [
    hunter(H_HEAD, T_RUN_A, L_RUN1),
    layer(16, 24, [[L_RUN2, 0, 0], [T_IDLE, 0, -1], [H_HEAD, 0, -1]]),
    hunter(H_HEAD, T_RUN_B, L_RUN3),
    layer(16, 24, [[L_RUN4, 0, 0], [T_IDLE, 0, -1], [H_HEAD, 0, -1]])
  ];
  MAPS.hunter_jump = [hunter(H_HEAD_SHOUT, T_JUMP, L_JUMP)];
  MAPS.hunter_fall = [hunter(H_HEAD, T_RUN_B, L_FALL)];
  MAPS.hunter_fire = [
    hunter(H_HEAD_SHOUT, T_FIRE, L_IDLE),
    hunter(H_HEAD_SHOUT, T_FIRE, L_RUN1)
  ];
  MAPS.hunter_hurt = [hunter(H_HEAD_HURT, T_HURT, L_FALL)];
  MAPS.hunter_win = [
    hunter(H_HEAD_HAPPY, T_WIN, L_IDLE, [[WIN_ARM, 12, 2]]),
    layer(16, 24, [[L_JUMP, 0, -1], [T_WIN, 0, -2], [H_HEAD_HAPPY, 0, -2], [WIN_ARM, 12, 0]])
  ];
  MAPS.hunter_crouch = [layer(16, 24, [
    [H_HEAD, 0, 6],
    [[
      '...rRrwwrRrRR...',
      '...RRRRRRRRss...',
      '...yyyygyyyss...',
      '..jjjjjjjjjjj...',
      '..bbbbJ..jjjbb..',
      '..bbbbb..bbbbb..'
    ], 0, 17]
  ])];

  // ------------------------------------------------------------------ CHLOE (16x24)
  const C_BODY = [
    '................',
    '......cccc......',
    '....cccccccc....',
    '...cccccccccc...',
    '...ccCcccccccc..',
    '..cccCcsssssc...',
    '..ccCcssssks....',
    '..cCcpsssssss...',
    '..ccCcpssssL....',
    '..cCcc.sssss....',
    '..cccCc.sss.....',
    '..cCccvvvvvv....',
    '..ccCvvwvvvvv...',
    '...cCvvvvvSsv...',
    '...ccvvwvvSsv...',
    '....cvvvvvSs....',
    '....VvvvwvVss...',
    '...vvvVvvvvVv...',
    '..vvwvvVvvwvvv..',
    '..VVVVVVVVVVVV..',
    '.....ss..ss.....',
    '.....ss..ss.....',
    '....LLL..LLL....',
    '................'
  ];
  const C_SWAY = layer(16, 24, [[C_BODY, 0, 0], [[
    '..ccc...',
    '..cCc...',
    '.ccCc...',
    '.cCcc...',
    '.ccCc...'
  ], 0, 9]]);
  const C_WAVE = layer(16, 24, [[C_BODY.map((r, i) => (i >= 13 && i <= 16) ? r.slice(0, 10) + 'v' + r.slice(11, 13).replace(/[sS]/g, 'v') + r.slice(13) : r), 0, 0],
    [['.ss', 'sss', '.ss', '.vv', '.vv', 'vv.'], 12, 6]]);
  const C_WAVE2 = layer(16, 24, [[C_BODY.map((r, i) => (i >= 13 && i <= 16) ? r.slice(0, 10) + 'v' + r.slice(11, 13).replace(/[sS]/g, 'v') + r.slice(13) : r), 0, 0],
    [['ss.', 'sss', '.ss', '.vv', '.vv', 'vv.'], 13, 6]]);
  const C_PHONE = layer(16, 24, [[C_BODY, 0, 0], [['.zz', 'zuz', 'zuz', 'ssz', 'ss.'], 11, 9]]);
  MAPS.chloe_idle = [C_BODY, C_SWAY];
  MAPS.chloe_wave = [C_WAVE, C_WAVE2];
  MAPS.chloe_phone = [C_PHONE];
  MAPS.chloe_hop = [layer(16, 24, [[C_BODY.slice(0, 20), 0, -1], [[
    '...ss..ss.......',
    '..LLL...LLL.....'
  ], 1, 19]])];

  // ------------------------------------------------------------------ PORTRAITS (24x24)
  MAPS.portrait_hunter = [layer(24, 24, [[sym([
    '............',
    '........hhhh',
    '......hhhhhh',
    '.....hhhhhhh',
    '....hhhhhhhh',
    '....HHhhhhhh',
    '....HHssssss',
    '....HHshhhss',
    '...SHsskksss',
    '...SSsssssss',
    '....Sssssss.'.replace(/\.$/, 's'),
    '.....sssssSs',
    '.....sssssss',
    '.....sssssss',
    '......ssssss',
    '.......sssss',
    '........SSSS',
    '...rrRrrwsss',
    '..rrRrrRwwss',
    '.rRrrRrrrwww',
    '.rRrrRrrrrww',
    'rRRRRRRRRrww',
    'rRrrRrrRrrww',
    'rRrrRrrRrrww'
  ]), 0, 0], [[
    'hhh',
    'hhhh',
    '.hhh'
  ], 15, 2], [['...m', 'mmm.'], 10, 12]])];

  MAPS.portrait_chloe = [layer(24, 24, [[sym([
    '............',
    '.......ccccc',
    '.....ccccccc',
    '....cccccccc',
    '...cccccCccc',
    '...cccCcccss',
    '..ccCcssssss',
    '..cccsSSssss',
    '..cCskkkssss',
    '..ccsswkssss',
    '.cccpsssssss',
    '.cCcpssppsss',
    '.ccc.sssssSs',
    '.cCc.sssssLL',
    '.ccc..sssssL',
    '.cCc...sssss',
    'cccc....SSSS',
    'cCcc..vvvvvs',
    'ccCc.vvvvvvs',
    'cccvvvvvvvvs',
    'cCvvvvwvvvvv',
    'ccvvVvvvvvwv',
    'cvvVvvvvvvvv',
    'vvvVvvwvvvvv'
  ]), 0, 0], [['pp', 'p.'], 16, 2]])];

  // ------------------------------------------------------------------ EX-BOYFRIEND (16x24)
  const X_HEAD = [
    '................',
    '................',
    '.....UUUUU......',
    '...UUuuuuuu.....',
    '....uuuuuuuu....',
    '....hhssssss....',
    '....hssssksss...',
    '....Sssssssss...',
    '.....SSSSSmS....',
    '......SSSSS.....',
    '......ssss......'
  ];
  const X_HEAD_ANGRY = X_HEAD.slice(0, 5).concat([
    '....hhsskkss....',
    '....hssssksss...',
    '....Sssssssss...',
    '.....SSSSmmm....',
    '......SSSSS.....',
    '.......sss......'
  ]);
  const X_HEAD_DIZZY = X_HEAD.slice(0, 6).concat([
    '....hsssxsxss...',
    '....Sssssssss...',
    '.....SSSSmmS....',
    '......SSSSS.....',
    '.......sss......'
  ]).map(r => r.replace(/x/g, 'k'));
  // Gym-bro build: broad shoulders, bulging biceps, tank top.
  const X_TORSO = pad11([
    '...sswwwwwwwss..',
    '..ssSwwwgwwwSss.',
    '..sSSwwwwgwwSSs.',
    '..sSswwwwwwwsSs.',
    '...sswwwwwwwss..',
    '...ss.wwwwww.ss.',
    '......ttttttt...'
  ]);
  // Double-biceps flex (his signature "dramatic gesture").
  const X_FLEX_FISTS = ['.ss..........ss.', 'sSs..........sSs', 'sSs..........sSs'];
  const X_TORSO_ARMSUP = pad11([
    '.sSSswwwwwwwsSSs',
    '..sSSwwwgwwSSs..',
    '....swwwwgwws...',
    '....swwwwwwws...',
    '.....wwwwwww....',
    '......wwwwww....',
    '......ttttttt...'
  ]);
  const X_TORSO_FOREHEAD = pad11([
    '...sswwwwwwwSs..',
    '..ssSwwwgwwwss..',
    '..sSSwwwwgww....',
    '..sSswwwwwww....',
    '...sswwwwwww....',
    '...ss.wwwwww....',
    '......ttttttt...'
  ]);
  const X_LEGS1 = pad18([
    '.....tTttTttt...',
    '.....tttt.ttt...',
    '......ss..ss....',
    '......ww..ww....',
    '.....bbbb.bbbb..'
  ]);
  const X_LEGS2 = pad18([
    '.....tTttTttt...',
    '....tttt..tttt..',
    '....ss......ss..',
    '...ww........ww.',
    '..bbb........bbb'
  ]);
  MAPS.ex_walk = [
    layer(16, 24, [[X_LEGS1, 0, 0], [X_TORSO, 0, 0], [X_HEAD, 0, 0]]),
    layer(16, 24, [[X_LEGS2, 0, 0], [X_TORSO, 0, -1], [X_HEAD, 0, -1]])
  ];
  MAPS.ex_gesture = [
    layer(16, 24, [[X_LEGS1, 0, 0], [X_TORSO_ARMSUP, 0, 0], [X_FLEX_FISTS, 0, 8], [X_HEAD_ANGRY, 0, 0]]),
    layer(16, 24, [[X_LEGS1, 0, 0], [X_TORSO_FOREHEAD, 0, 0], [X_HEAD, 0, 0], [['ss', 'ss'], 10, 5]])
  ];
  MAPS.ex_charge = [
    layer(16, 24, [[X_LEGS2, 0, 0], [X_TORSO, 1, 0], [X_HEAD_ANGRY, 2, 1]]),
    layer(16, 24, [[X_LEGS1, 0, 0], [X_TORSO, 1, 0], [X_HEAD_ANGRY, 2, 1]])
  ];
  MAPS.ex_defeat = [layer(16, 24, [[X_LEGS1, 0, 0], [X_TORSO_ARMSUP, 0, 0], [X_FLEX_FISTS, 0, 8], [X_HEAD_DIZZY, 0, 0]])];

  // ------------------------------------------------------------------ SUITOR (16x24)
  const SU_HEAD = [
    '................',
    '......hhhhh.....',
    '.....hhhhhhhh...',
    '....hhhhhhhhhh..',
    '....hhssssss....',
    '....hskkkkkk....',
    '....Sssskkss....',
    '....Ssssssss....',
    '.....sssswww....',
    '......sssss.....',
    '.......sss......'
  ];
  const SU_TORSO = pad11([
    '.....pppsppp....',
    '....pPppsgppp...',
    '....pPpsgsppp...',
    '....pPppspppp...',
    '....pPppppppss..',
    '....pPpppppp....',
    '....wwwwwwwww...'
  ]);
  const SU_TORSO_THROW = pad11([
    '.....pppsppp....',
    '....pPppsgpppss.',
    '....pPpsgspppss.',
    '....pPppspppp...',
    '....pPppppppp...',
    '....pPppppppp...',
    '....wwwwwwwww...'
  ]);
  const ROSE = ['.LL', 'LLL', '.f.', 'ff.', '.f.'];
  const SU_LEGS1 = pad18([
    '....wwwwwwwww...',
    '....wwwwW.www...',
    '.....www..www...',
    '.....www..www...',
    '....zzzz.zzzz...'
  ]);
  const SU_LEGS2 = pad18([
    '....wwwwwwwww...',
    '...wwwww..www...',
    '..www.....www...',
    '.zzz......www...',
    '.zz.......zzzz..'
  ]);
  MAPS.suitor_walk = [
    layer(16, 24, [[SU_LEGS1, 0, 0], [SU_TORSO, 0, 0], [SU_HEAD, 0, 0], [ROSE, 12, 12]]),
    layer(16, 24, [[SU_LEGS2, 0, 0], [SU_TORSO, 0, -1], [SU_HEAD, 0, -1], [ROSE, 12, 11]])
  ];
  MAPS.suitor_throw = [layer(16, 24, [[SU_LEGS1, 0, 0], [SU_TORSO_THROW, 0, 0], [SU_HEAD, 0, 0]])];
  MAPS.suitor_defeat = [layer(16, 24, [[SU_LEGS1, 0, 0], [SU_TORSO, 0, 0], [SU_HEAD.map(r => r.replace(/k/g, 's')), 0, 0], [['kk.kk', 'k...k'], 6, 5], [['ppPp'], 7, 8]])];

  // ------------------------------------------------------------------ AGITATOR (16x24)
  const AG_HEAD = [
    '................',
    '................',
    '......EEEE......',
    '.....EeeeeeE....',
    '....eeeeeeeee...',
    '....esskkskss...',
    '....Sssssksss...',
    '....Ssssssssss..',
    '.....ssssmmm....',
    '......sssss.....',
    '.......SSS......'
  ];
  const AG_TORSO = pad11([
    '.....ooooooo....',
    '....oOoooooOo...',
    '....oOooaoooo...',
    '....oOooooooo...',
    '....oOoooooss...',
    '....oOooooo.....',
    '....OOOOOOOOO...'
  ]);
  const AG_TORSO_MEGA = pad11([
    '.....oooooooiii.',
    '....oOooooossiiw',
    '....oOooaoooiii.',
    '....oOooooooo...',
    '....oOooooooo...',
    '....oOooooooo...',
    '....OOOOOOOOO...'
  ]);
  const MEGA = ['..ii', 'wiii', 'wiii', '..ii', '..z.'];
  const AG_LEGS1 = pad18([
    '....ttttttttt...',
    '....ttttTtttt...',
    '.....ttt.ttt....',
    '.....zzz.zzz....',
    '....zzzz.zzzz...'
  ]);
  const AG_LEGS2 = pad18([
    '....ttttttttt...',
    '....tttt.tttt...',
    '....ttt...ttt...',
    '....zzz...zzz...',
    '...zzzz...zzzz..'
  ]);
  MAPS.agitator_march = [
    layer(16, 24, [[AG_LEGS1, 0, 0], [AG_TORSO, 0, 0], [AG_HEAD, 0, 0], [MEGA, 11, 13]]),
    layer(16, 24, [[AG_LEGS2, 0, 0], [AG_TORSO, 0, 1], [AG_HEAD, 0, 1], [MEGA, 11, 14]])
  ];
  MAPS.agitator_telegraph = [
    layer(16, 24, [[AG_LEGS2, 0, 0], [AG_TORSO_MEGA, 0, 0], [AG_HEAD, 0, 0]])
  ];
  MAPS.agitator_charge = [
    layer(16, 24, [[AG_LEGS2, 0, 0], [AG_TORSO, 1, 0], [AG_HEAD, 2, 1], [MEGA, 12, 13]]),
    layer(16, 24, [[AG_LEGS1, 0, 0], [AG_TORSO, 1, 0], [AG_HEAD, 2, 1], [MEGA, 12, 13]])
  ];
  MAPS.agitator_defeat = [layer(16, 24, [[AG_LEGS1, 0, 0], [AG_TORSO, 0, 0], [AG_HEAD.map(r => r.replace(/mmm/, 'mmm').replace(/kk/, 'ss')), 0, 0], [['k.k', '.k.', 'k.k'], 7, 4]])];

  // ------------------------------------------------------------------ PREACHER (16x24)
  const PR_HEAD = [
    '................',
    '......zzzz......',
    '......zzzz......',
    '..zzzzzzzzzzz...',
    '.....ssssss.....',
    '....sssskkss....',
    '....Sssssssss...',
    '.....ssssmmm....',
    '......ssss......',
    '.......ww.......',
    '......zwwz......'
  ];
  const PR_TORSO = pad11([
    '.....zzLLzzz....',
    '....zZzLLzzzz...',
    '....zZzzLzzzz...',
    '....zZzzzzzss...',
    '....zZzzzzzss...',
    '....zZzzzzzz....',
    '....zzzzzzzzz...'
  ]);
  const PR_TORSO_RAISE = pad11([
    '.....zzLLzzzss..',
    '....zZzLLzzzzs..',
    '....zZzzLzzzz...',
    '....zZzzzzzz....',
    '....zZzzzzzz....',
    '....zZzzzzzz....',
    '....zzzzzzzzz...'
  ]);
  const PR_BOOK = ['zzzz', 'zgzz', 'zzzz', 'wwww'];
  const PR_LEGS = pad18([
    '....zzzzzzzzz...',
    '....zzzzZzzzz...',
    '.....zzz.zzz....',
    '.....zzz.zzz....',
    '....kkkk.kkkk...'
  ]);
  MAPS.preacher_idle = [
    layer(16, 24, [[PR_LEGS, 0, 0], [PR_TORSO, 0, 0], [PR_HEAD, 0, 0], [PR_BOOK, 11, 13]]),
    layer(16, 24, [[PR_LEGS, 0, 0], [PR_TORSO, 0, 0], [PR_HEAD.map((r, i) => i === 7 ? '.....ssssmmmm...' : r), 0, 0], [PR_BOOK, 11, 12]])
  ];
  MAPS.preacher_throw = [layer(16, 24, [[PR_LEGS, 0, 0], [PR_TORSO_RAISE, 0, 0], [PR_HEAD.map((r, i) => i === 7 ? '.....ssssmmmm...' : r), 0, 0], [PR_BOOK, 12, 7]])];
  MAPS.preacher_defeat = [layer(16, 24, [[PR_LEGS, 0, 0], [PR_TORSO, 0, 0], [PR_HEAD.map((r, i) => i === 5 ? '....ssskkskk....' : i === 7 ? '.....sssmmss....' : r).slice(3), 0, 3]])];

  // ------------------------------------------------------------------ INSPECTOR (16x24)
  const IN_HEAD = [
    '................',
    '................',
    '......hhhhh.....',
    '.....hhhhhhh....',
    '....hhssssss....',
    '....hsikkiki....',
    '....Sssssssss...',
    '.....ssssmm.....',
    '......ssss......',
    '.......ss.......',
    '......tttt......'
  ];
  const IN_TORSO = pad11([
    '.....tttTtt.....',
    '....tTttTtttt...',
    '....tTttTttwww..',
    '....tTttTttwkw..',
    '....tTttTttwww..',
    '....tTtttttsss..',
    '....TTTTTTTTT...'
  ]);
  const IN_LEGS1 = pad18([
    '....tTtttttt....',
    '....tTttttttt...',
    '.....eee.eee....',
    '.....eee.eee....',
    '....bbbb.bbbb...'
  ]);
  const IN_LEGS2 = pad18([
    '....tTtttttt....',
    '...tTttt.tttt...',
    '...eee....eee...',
    '..eee......eee..',
    '..bbb......bbbb.'
  ]);
  // Inspectors wear a traffic cone: the universal "do not stomp" sign. 16x28 frames.
  const CONE = ['...w...', '..aaa..', '..www..', '.aaaaa.', '.AaaaA.', 'AAAAAAA'];
  MAPS.inspector_walk = [
    layer(16, 28, [[IN_LEGS1, 0, 4], [IN_TORSO, 0, 4], [IN_HEAD, 0, 4], [CONE, 5, 2]]),
    layer(16, 28, [[IN_LEGS2, 0, 4], [IN_TORSO, 0, 3], [IN_HEAD, 0, 3], [CONE, 5, 1]])
  ];
  MAPS.inspector_inspect = [
    layer(16, 28, [[IN_LEGS1, 0, 4], [IN_TORSO.map((r, i) => i === 13 ? '....tTttTttwwws.' : i === 14 ? '....tTttTttwkws.' : r), 0, 4], [IN_HEAD, 0, 4], [CONE, 5, 2], [['iii', 'i.i', 'iii', '.I.', '.I.'], 12, 10]])
  ];
  MAPS.inspector_defeat = [layer(16, 28, [[IN_LEGS1, 0, 4], [IN_TORSO, 0, 4], [IN_HEAD.map((r, i) => i === 5 ? '....hsssssss....' : i === 7 ? '.....ssssmmm....' : r), 0, 4], [['iii.iii'], 4, 11], [CONE, 1, 0]])];

  // ------------------------------------------------------------------ PONTIFF BOSS (32x48)
  const PO_HAT = [
    '................................',
    '...............gg...............',
    '..............gggg..............',
    '.............ggggGg.............',
    '............gggggGgg............',
    '...........ggggggGggg...........',
    '...........ggggpgGggg...........',
    '..........gggpppGgggg...........',
    '..........ggggpgGggggg..........',
    '.........ggggggGgggggg..........',
    '.........ggggggGgggggg..........',
    '.........GGGGGGGGGGGGGG.........',
    '.........gLgLgLgLgLgLgg.........',
    '.........GGGGGGGGGGGGGG.........'
  ];
  const PO_FACE = [
    '..........sssssssssss...........',
    '..........sssssssssss...........',
    '.........ssskkssskksss..........',
    '.........sSsssssssssSs..........',
    '..........sssssSsssss...........',
    '.........wwwwwssswwwww..........',
    '........wwwwwwwmwwwwwww.........',
    '.........www.sssss.www..........',
    '.............sssss..............'
  ];
  const PO_FACE_SHOUT = PO_FACE.slice(0, 5).concat([
    '.........wwwwwmmmwwwww..........',
    '........wwwwwwmmmwwwwww.........',
    '.........www.smmms.www..........',
    '.............sssss..............'
  ]);
  const PO_FACE_HURT = [
    '..........sssssssssss...........',
    '..........sssssssssss...........',
    '.........sskskssksksss..........',
    '.........sSskssssksSss..........',
    '..........sssssSsssss...........',
    '.........wwwwwssswwwww..........',
    '........wwwwwwmmmwwwwww.........',
    '.........www.sssss.www..........',
    '.............sssss..............'
  ];
  const PO_ROBE = [
    '..........wwwwwwwwwwww..........',
    '........wwwwwgggggwwwwww........',
    '.......wwwwwwgxXxgwwwwwww.......',
    '......wwwWwwwgggggwwwWwwww......',
    '......wwwWwwwwgggwwwwWwwww......',
    '.....wwwwWwwwwwgwwwwwWwwwww.....',
    '.....ssswWwwwwwgwwwwwWwwsss.....',
    '.....ssswWwwwwwgwwwwwWwwsss.....',
    '......gwwWwwwwwgwwwwwWwwwg......',
    '......gwwWwwwwwgwwwwwWwwwg......',
    '.....gwwwWwwwwwgwwwwwWwwwwg.....',
    '.....gwwwWwwwwwgwwwwwWwwwwg.....',
    '....gwwwwWwwwwwgwwwwwWwwwwwg....',
    '....gwwwwWwwwwwgwwwwwWwwwwwg....',
    '...gwwwwwWwwwwwgwwwwwWwwwwwwg...',
    '...gGGGGGGGGGGGGGGGGGGGGGGGGg...',
    '...gLgLgLgLgLgLgLgLgLgLgLgLgg...',
    '...ggggggggggggggggggggggggggg..',
    '.......LLLL..........LLLL.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ];
  const PO_ARMS_UP = [
    '...ss........................ss.',
    '..ssss......................ssss',
    '..wwww......................wwww',
    '...wwww....................wwww.',
    '....wwww..................wwww..',
    '.....wwww................wwww...'
  ];
  const poClean = r => r.replace(/s{3}(?=w)|(?<=w)s{3}/g, m => 'www');
  MAPS.pontiff_idle = [
    layer(32, 48, [[PO_ROBE, 0, 22], [PO_FACE, 0, 14], [PO_HAT, 0, 0]]),
    layer(32, 48, [[PO_ROBE, 0, 22], [PO_FACE, 0, 15], [PO_HAT, 0, 1]])
  ];
  MAPS.pontiff_preach = [
    layer(32, 48, [[PO_ROBE.map(poClean), 0, 22], [PO_ARMS_UP, 0, 17], [PO_FACE_SHOUT, 0, 14], [PO_HAT, 0, 0]]),
    layer(32, 48, [[PO_ROBE.map(poClean), 0, 22], [PO_ARMS_UP, 0, 16], [PO_FACE_SHOUT, 0, 14], [PO_HAT, 0, -1]])
  ];
  MAPS.pontiff_hurt = [layer(32, 48, [[PO_ROBE, 0, 22], [PO_FACE_HURT, 0, 14], [PO_HAT, 4, 1]])];

  // ------------------------------------------------------------------ COLLECTIBLES
  MAPS.book = [[
    '..............',
    '..qqqqqqqqqq..',
    '.Qqqqqqqqqqqw.',
    '.Qqqqqgggqqqw.',
    '.Qqqqgqqqgqqw.',
    '.Qqqqgqqqgqqw.',
    '.Qqqqqgggqqqw.',
    '.Qqqqqqgqqqqw.',
    '.Qqqqqgggqqqw.',
    '.Qqqqqqgqqqqw.',
    '.Qqqqqqqqqqqw.',
    '.QQQQQQQQQQQw.',
    '..wWwWwWwWwW..',
    '..............'
  ]];
  MAPS.tool_drill = [[
    '..............',
    '..............',
    '...aaaaaaa....',
    '..aaaaaaaaaE..',
    '..aAAaaaaaaEii',
    '..aaaaaaaaaE..',
    '...aaazzaa....',
    '.....zzaa.....',
    '.....zzaa.....',
    '....zzzaa.....',
    '....aaaaaa....',
    '....AAAAAA....',
    '..............',
    '..............'
  ]];
  MAPS.tool_hammer = [[
    '..............',
    '..............',
    '..iiiiiiiii...',
    '.Iiiiiiiiiii..',
    '..IIIiiiII....',
    '.....bb.......',
    '.....bb.......',
    '.....bb.......',
    '.....bB.......',
    '.....bB.......',
    '.....zz.......',
    '.....zz.......',
    '..............',
    '..............'
  ].map(r => r.replace(/^\.\.\.\.\./, '.....'))];
  MAPS.tool_wrench = [[
    '..............',
    '..........i.i.',
    '.........ii.i.',
    '.........iiii.',
    '........iiI...',
    '.......iiI....',
    '......iiI.....',
    '.....iiI......',
    '....iiI.......',
    '..iiiI........',
    '.i.ii.........',
    '.i..i.........',
    '..............',
    '..............'
  ]];
  MAPS.tool_saw = [[
    '..............',
    '..............',
    '..............',
    '.aaa..........',
    '.aAaiiiiiiii..',
    '.aaaiiiiiiiiii',
    '.aAaiiiiiiiiii',
    '.aaaIiIiIiIiI.',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............'
  ]];

  // ------------------------------------------------------------------ UI ICONS
  MAPS.heart = [[
    '.........',
    '..rr.rr..',
    '.rwrrrrr.',
    '.rrrrrrr.',
    '..rrrrr..',
    '...rrr...',
    '....r....',
    '.........'
  ]];
  MAPS.heart_empty = [[
    '.........',
    '..EE.EE..',
    '.EzzEzzE.',
    '.EzzzzzE.',
    '..EzzzE..',
    '...EzE...',
    '....E....',
    '.........'
  ]];
  MAPS.heart_small = [[
    '.......',
    '.pp.pp.',
    '.ppppp.',
    '..ppp..',
    '...p...',
    '.......'
  ]];
  MAPS.icon_book = [[
    '.........',
    '.qqqqqqw.',
    '.qqgqqqw.',
    '.qgqgqqw.',
    '.qqgqqqw.',
    '.qqqqqqw.',
    '..wwwww..',
    '.........'
  ]];
  MAPS.icon_tool = [[
    '.........',
    '.....i.i.',
    '.....iii.',
    '....ii...',
    '...ii....',
    '.aaa.....',
    '.aa......',
    '.........'
  ]];
  MAPS.icon_charge = [[
    '.........',
    '....gg...',
    '...gg....',
    '..ggggg..',
    '....gg...',
    '...gg....',
    '..g......',
    '.........'
  ]];

  // ------------------------------------------------------------------ CHECKPOINT / GOAL
  const SIGN = [
    '................',
    '................',
    '.rrrrrrrrrrr....',
    '.aaaaaaaaaaaa...',
    '.ggggggggggggg..',
    '.fffffffffffff..',
    '.uuuuuuuuuuuu...',
    '.qqqqqqqqqqq....'
  ];
  const POST = [];
  for (let i = 0; i < 22; i++) POST.push('.....bB.........');
  POST.push('...BBBBBB.......');
  POST.push('................');
  MAPS.checkpoint_on = [
    layer(16, 32, [[POST, 0, 8], [SIGN, 0, 0]]),
    layer(16, 32, [[POST, 0, 8], [SIGN.map((r, i) => i >= 2 ? r.slice(0, 13) + r.slice(13).replace(/[a-z]/g, '.') : r), 0, 1]])
  ];
  MAPS.checkpoint_off = [layer(16, 32, [[POST, 0, 8], [SIGN.map(r => r.replace(/[a-z]/g, m => (m === 'r' || m === 'g' || m === 'u') ? 'e' : 'E')), 0, 0]])];

  MAPS.goal_gate = [layer(24, 40, [
    [Array.from({ length: 27 }, () => '...........bB...........'), 0, 11],
    [[
      '........................',
      '.UUUUUUUUUUUUUUUUUUUUUU.',
      '.UuuuuuuuuuuuuuuuuuuuuU.',
      '.UuuuuuuuuwwuuuuuuuuuuU.',
      '.UuuuuuuuuuwwuuuuuuuuuU.',
      '.UuwuuwwwwwwwwwwwwwuuuU.',
      '.UuwwwwwwwwwwwwwwwwwwuU.',
      '.UuwuuwwwwwwwwwwwwwuuuU.',
      '.UuuuuuuuuuwwuuuuuuuuuU.',
      '.UuuuuuuuuwwuuuuuuuuuuU.',
      '.UuuuuuuuuuuuuuuuuuuuuU.',
      '.UUUUUUUUUUUUUUUUUUUUUU.',
      '........................'
    ], 0, 0],
    [['........BBBBBBBB........'], 0, 38]
  ])];

  // ------------------------------------------------------------------ HAZARDS
  MAPS.spikes = [[
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...w.......w....',
    '..wiI.....wiI...',
    '..wiI.....wiI...',
    '.wiiiI...wiiiI..',
    '.wiiiI...wiiiI..',
    'wiiiiiI.wiiiiiI.',
    'IIIIIIIIIIIIIIII',
    'EEEEEEEEEEEEEEEE',
    'EEEEEEEEEEEEEEEE'
  ]];
  const SPIKE_BASE = ['EEEEEEEEEEEEEEEE', 'EkkEEEkkEEEkkEEE', 'EEEEEEEEEEEEEEEE'];
  MAPS.spikes_retract = [
    layer(16, 16, [[SPIKE_BASE, 0, 13]]),
    layer(16, 16, [[SPIKE_BASE, 0, 13], [['.L.....L.....L..', 'LLL...LLL...LLL.'], 0, 11]]),
    layer(16, 16, [[SPIKE_BASE, 0, 13], [[
      '..w.....w.....w.',
      '.wiI...wiI...wiI',
      '.wiI...wiI...wiI',
      'wiiiI.wiiiI.wiii',
      'wiiiI.wiiiI.wiii',
      'iiiiiIiiiiiIiiii'
    ].map(r => r.slice(0, 16)), 0, 7]])
  ];
  MAPS.falling_block = [[
    '................',
    '.IIIIIIIIIIIIII.',
    '.IiiiiiiiiiiiiI.',
    '.IiEiiiiiiiiEiI.',
    '.IiiiiiiiiiiiiI.',
    '.IiikkiiiikkiiI.',
    '.IiiikkiikkiiiI.',
    '.IiiiwkiikwiiiI.',
    '.IiiiiiiiiiiiiI.',
    '.IiiiiiiiiiiiiI.',
    '.IiiikkkkkkiiiI.',
    '.IiEiiiiiiiiEiI.',
    '.IiiiiiiiiiiiiI.',
    '.IIIIIIIIIIIIII.',
    '.gkgkgkgkgkgkgk.',
    '................'
  ]];

  // ------------------------------------------------------------------ EFFECTS
  MAPS.dust = [
    ['........', '........', '........', '...ww...', '..wwww..', '...ww...', '........', '........'],
    ['........', '........', '..w..w..', '.wW..Ww.', '........', '.w....w.', '........', '........'],
    ['........', '.w....w.', '........', 'W......W', '........', '........', 'w......w', '........']
  ];
  MAPS.sparkle = [
    ['.......', '.......', '...g...', '..gwg..', '...g...', '.......', '.......'],
    ['.......', '...g...', '...w...', '.gwwwg.', '...w...', '...g...', '.......'],
    ['...g...', '.......', '.g.w.g.', 'g.www.g', '.g.w.g.', '.......', '...g...']
  ];
  MAPS.star = [[
    '.........',
    '....g....',
    '....g....',
    '.ggggggg.',
    '..ggggg..',
    '..gg.gg..',
    '.g.....g.',
    '.........'
  ]];
  // A secret cat in every level. Pet her (Down) for serotonin.
  const CAT = [
    '..............',
    '.A.....A......',
    '.aA...Aa......',
    '.aaaaaaa......',
    '.akaaaka......',
    '.aaapaaa....A.',
    '..aaaaa.....a.',
    '..aAaAaa...a..',
    '.aaaaaaaa.aa..',
    '.aaAaaAaaaa...',
    '.aaaaaaaaa....',
    '..ww..ww......',
    '..............'
  ];
  const CAT_TAIL2 = CAT.map((r, i) => i === 5 ? '.aaapaaa......' : i === 6 ? '..aaaaa.......' : i === 7 ? '..aAaAaa..aA..' : r);
  const CAT_HAPPY = CAT.map((r, i) => i === 3 ? '.akaaaka......' : i === 4 ? '.aaaaaaa......' : r);
  MAPS.cat = [CAT, CAT, CAT, CAT_TAIL2];
  MAPS.cat_happy = [CAT_HAPPY, layer(14, 13, [[CAT_HAPPY, 0, 0], [['.p.p.', 'ppppp', '.ppp.', '..p..'], 9, 0]])];

  // Hunter's projectile: a sulky little orb of male loneliness (frame 2 sheds a tear).
  const ORB = [
    '..........',
    '...uuuu...',
    '..uwwuuu..',
    '.uwwuuuuU.',
    '.uwukuukU.',
    '.uuuuuuuU.',
    '.uuuukuuU.',
    '.uuukukUU.',
    '..uUUUUU..',
    '...UUUU...',
    '..........'
  ];
  MAPS.loneliness_ball = [ORB, layer(10, 11, [[ORB, 0, 0], [['w', 'u'], 7, 5]])];
  MAPS.scroll = [
    ['............', '.tttttttttt.', 'tTwwwwwwwwTt', 'tTwkkwkkwwTt', 'tTwwwwwwwwTt', '.tttttttttt.', '............'],
    ['.....tt.....', '....tTTt....', '....twwt....', '....twkt....', '....twkt....', '....twwt....', '....tTTt....', '.....tt.....'].slice(0, 7)
  ];

  // ------------------------------------------------------------------ BUILD
  const SPR = {};
  const ANCHORS = {}; // [ax, ay] in sprite pixels: bottom-centre for characters
  function build() {
    for (const name in MAPS) {
      const frames = MAPS[name].map(rows => {
        const widths = new Set(rows.map(r => r.length));
        if (widths.size > 1) console.warn('[sprites] ragged rows in', name, [...widths]);
        return LW.fromMap(rows);
      });
      SPR[name] = { frames, flipped: frames.map(LW.flipCanvas), flash: frames.map(f => LW.silhouette(f, '#ffffff')) };
      const f = frames[0];
      ANCHORS[name] = [f.width / 2, f.height];
    }
    // Colour variants
    const recolorSet = (base, name, map) => {
      const frames = SPR[base].frames.map(f => LW.recolor(f, map));
      SPR[name] = { frames, flipped: frames.map(LW.flipCanvas), flash: frames.map(f => LW.silhouette(f, '#ffffff')) };
      ANCHORS[name] = ANCHORS[base];
    };
    const P = LW.PAL;
    recolorSet('book', 'book_teal', { [P.q]: P.x, [P.Q]: P.X });
    recolorSet('book', 'book_orange', { [P.q]: P.a, [P.Q]: P.A });
    recolorSet('book', 'book_pink', { [P.q]: P.p, [P.Q]: P.P });
    recolorSet('book', 'book_green', { [P.q]: P.f, [P.Q]: P.F });
    // Agitator placard: EU-style flag (blue disc, ring of yellow stars) inside a red
    // prohibition sign. Drawn procedurally so the circle stays round at 15px.
    const sign = LW.makeCanvas(15, 15), sx = sign.getContext('2d');
    for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
      const dx = x - 7, dy = y - 7, d = Math.sqrt(dx * dx + dy * dy);
      let col = null;
      if (d <= 7.4) col = LW.PAL.k;
      if (d <= 6.5) col = '#d8202c';
      if (d <= 5.0) col = '#1f49b8';
      if (d <= 5.0 && Math.abs(dx - dy) <= 0.8) col = '#d8202c';      // the slash
      if (col) { sx.fillStyle = col; sx.fillRect(x, y, 1, 1); }
    }
    sx.fillStyle = '#ffd23f';
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6, x = Math.round(7 + Math.cos(a) * 3.4), y = Math.round(7 + Math.sin(a) * 3.4);
      if (Math.abs((x - 7) - (y - 7)) > 0.8) sx.fillRect(x, y, 1, 1);
    }
    SPR.sign_eu_no = { frames: [sign], flipped: [sign], flash: [LW.silhouette(sign, '#ffffff')] };
    ANCHORS.sign_eu_no = [7.5, 15];
    // Second suitor look: blue shirt, darker skin
    recolorSet('suitor_walk', 'suitor2_walk', { [P.p]: P.u, [P.P]: P.U, [P.s]: P.n, [P.S]: P.N });
    recolorSet('suitor_throw', 'suitor2_throw', { [P.p]: P.u, [P.P]: P.U, [P.s]: P.n, [P.S]: P.N });
    recolorSet('suitor_defeat', 'suitor2_defeat', { [P.p]: P.u, [P.P]: P.U, [P.s]: P.n, [P.S]: P.N });
  }

  // 1px dilated silhouette in a given colour, 2px larger than the frame (drawn at -1,-1).
  const rimCache = {};
  function rimFor(name, i, flip, color) {
    const key = name + i + (flip ? 'f' : '') + color;
    if (rimCache[key]) return rimCache[key];
    const src = flip ? SPR[name].flipped[i] : SPR[name].frames[i];
    const sil = LW.silhouette(src, color);
    const c = LW.makeCanvas(src.width + 2, src.height + 2);
    const x = c.getContext('2d');
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]]) x.drawImage(sil, dx, dy);
    return (rimCache[key] = c);
  }

  // Draw a sprite with its anchor (default bottom-centre) at x,y.
  // o: {flip, flash, rim: css colour for a light edge around the outline, topLeft, rot}
  function draw(ctx, name, frame, x, y, o) {
    const s = SPR[name];
    if (!s) return;
    o = o || {};
    const n = s.frames.length;
    const i = ((frame | 0) % n + n) % n;
    const img = o.flash ? s.flash[i] : (o.flip ? s.flipped[i] : s.frames[i]);
    const a = o.topLeft ? [0, 0] : ANCHORS[name];
    if (o.rot) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y - img.height / 2));
      ctx.rotate(o.rot);
      ctx.drawImage(img, -Math.round(img.width / 2), -Math.round(img.height / 2));
      ctx.restore();
      return;
    }
    if (o.rim && !o.flash) ctx.drawImage(rimFor(name, i, o.flip, o.rim), Math.round(x - a[0]) - 1, Math.round(y - a[1]) - 1);
    ctx.drawImage(img, Math.round(x - a[0]), Math.round(y - a[1]));
  }

  function frames(name) { return SPR[name] ? SPR[name].frames.length : 0; }
  function get(name, i) { return SPR[name] && SPR[name].frames[i || 0]; }
  function names() { return Object.keys(SPR); }

  LW.Sprites = { build, draw, frames, get, names, MAPS };
})();
