// A small seeded random number generator (mulberry32): the same seed gives the same game,
// which is what makes the screenshot scenes repeatable.

export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convenience helpers built on a seeded generator, so world-building code reads
// declaratively while staying perfectly reproducible for a given seed.
/** Float in [min, max) drawn from `random`. */
export function randomRange(random, min, max) { return min + random() * (max - min); }
/** Integer in [min, max] (both ends included) drawn from `random`. */
export function randomInt(random, min, max) { return min + Math.floor(random() * (max - min + 1)); }
/** One element of `list`, chosen by `random`. */
export function pickRandom(random, list) { return list[Math.floor(random() * list.length)]; }
