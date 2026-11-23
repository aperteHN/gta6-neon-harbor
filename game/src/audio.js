// Synthesised sound with WebAudio only: engine hum, sirens, shots, pickups and a sunny loop.
// No audio files, so the game stays fully offline.
export function createAudio() {
  let ctx = null, master = null, musicTimer = null, note = 0;
  const NOTES = [220, 261.6, 329.6, 392, 329.6, 261.6, 293.7, 349.2];
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.16; master.connect(ctx.destination);
      return true;
    } catch { return false; }
  }
  function blip(freq, dur, type = 'square', vol = 0.5, slide = 0) {
    if (!ensure()) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
  }
  return {
    startMusic() {
      if (!ensure() || musicTimer) return;
      musicTimer = setInterval(() => { blip(NOTES[note % NOTES.length], 0.32, 'triangle', 0.22); note++; }, 340);
    },
    stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } },
    shoot() { blip(720, 0.09, 'sawtooth', 0.5, -520); },
    pickup() { blip(660, 0.12, 'sine', 0.6, 440); },
    cash() { blip(880, 0.1, 'sine', 0.5, 220); setTimeout(() => blip(1320, 0.16, 'sine', 0.5), 70); },
    enterCar() { blip(180, 0.18, 'triangle', 0.5, 120); },
    /** Two-tone car horn (H while driving): a friendly toot, or a long blast if held in spirit. */
    horn(long = false) {
      blip(370, long ? 0.42 : 0.16, 'square', 0.34);
      setTimeout(() => blip(466, long ? 0.42 : 0.16, 'square', 0.3), 12);
    },
    /** Short rising jingle when a story chapter closes and the cash lands. */
    missionComplete() { [523.3, 659.3, 783.99].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'triangle', 0.4), i * 85)); },
    crash() { blip(90, 0.25, 'sawtooth', 0.7, -40); },
    siren() { blip(620, 0.18, 'square', 0.18, 180); },
    busted() { blip(300, 0.5, 'sawtooth', 0.5, -200); },
  };
}
