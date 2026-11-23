// Save and load progress in localStorage: cash, mission progress, health and position.
// Saves are stamped with a format version and a timestamp; a stale or foreign-shaped
// payload is treated as "no save" instead of crashing the boot sequence.
import { SAVE_KEY } from './config.js';
const SAVE_VERSION = 1;
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || (data.version !== undefined && data.version !== SAVE_VERSION)) return null;
    return data;
  } catch { return null; }
}
/** Persist `data` (plus version/timestamp). Returns true when the save actually landed. */
export function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION, savedAt: Date.now() }));
    return true;
  } catch { /* private mode: play unsaved */ return false; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
