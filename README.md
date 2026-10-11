# LeWorld

A browser pixel-art platformer: Hunter crosses the world for a first date with Chloe.
Plain HTML Canvas + JavaScript, no build step.

## Run

The game loads several script files, so serve the folder rather than opening the HTML directly:

```
python tools/devserver.py
```

Then open:

- http://localhost:8765/ – the game, starting at Level 1 (finish a level to go to the next)
- http://localhost:8765/?level=l4 – jump straight to a level (`l1` … `l7`)
- http://localhost:8765/?level=enemies – every enemy type, then the Pontiff boss fight
- http://localhost:8765/?level=hazards – moving/vanishing platforms, falling blocks, swinging signs, pop-up spikes
- add `&mode=challenge` to either to play in Challenge mode (Casual is the default)
- http://localhost:8765/tests.html – automated physics tests
- http://localhost:8765/gallery.html – all graphics, animated

### Playing on a phone

Run `python tools/devserver.py 8765 --lan` and open the printed address on a phone connected
to the same Wi-Fi. Hold the phone sideways; on-screen buttons appear on touch screens
(left/right and a small crouch button bottom-left, jump and fire bottom-right, pause top-right).

## Controls (desktop)

| Action | Keys |
| --- | --- |
| Move | Left/Right arrows or A/D |
| Jump | Up arrow, W or Space |
| Crouch | Down arrow or S |
| Fire (once unlocked) | Shift |
| Pause | Escape or P (or click the pause button) |
| Mute | M (or click the speaker button) |
| Menus | Arrows + Enter/Space, or mouse/tap |
| Debug overlay | ` (backtick) |

Progress is saved in this browser (localStorage) at checkpoints, when a level is finished
and when pausing. `?level=...` dev links never touch the saved adventure.

## Where things live

- `src/config.js` – every movement, camera and enemy tuning number
- `src/levels/` – level maps (character grids; legend at the top of `src/engine/level.js`);
  `index.js` sets the play order. `tests.html` checks every level is completable.
- `src/data/content.js` – the 50 books, tool one-liners, Chloe's texts, cat lines, enemy lines
- `src/data/story.js` – the intro chat, between-level chats and the ending
- `src/data/music.js` – the chiptune songs (note text format, easy to rewrite)
- `src/audio.js` – Web Audio synth: music sequencer and every sound effect (no audio files)
- `src/engine/` – input, collision, player, enemies, camera, world simulation
- `src/gfx/` – palette, sprites, tiles, backgrounds, UI, pixel font
