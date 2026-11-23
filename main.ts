// Neon Harbor — Solstice City Heist: a gta6-01 entry (Node 22, standard library only).
// The game is this directory's game/ folder, plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library and no network request), and this
// program hands it in. It copies game/ and screenshots/ from beside this file to /output
// and writes /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library. The game itself is an original open-world crime game: a sun-soaked city explored
// on foot and by car, traffic and pedestrians, cars to steal, a wanted level with police,
// shooting combat, a five-chapter heist story, a HUD with a minimap, and browser saves.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output (see the header note).
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly and early when the game payload is missing: a dossier built from an
// empty tree would waste a grading run, while this message names the exact problem.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('Neon Harbor: game/index.html is missing beside main.ts — the entry cannot be handed in without the game.');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
// One line of operator feedback: the dossier's byte size, checked against its 1.5 MiB cap.
console.log(`Neon Harbor handed in: dossier.json is ${Buffer.byteLength(dossier)} bytes (cap 1572864).`);
