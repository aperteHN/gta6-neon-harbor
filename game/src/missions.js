// Story missions for Mara Vale in Solstice City: a five-chapter heist story with waypoints,
// pickups, deliveries, escapes and cash rewards. Each mission is a list of objective steps.
// Each chapter also names its home district, which the HUD shows beside the objective.
/**
 * Bonus free-roam objectives for after (or between) story chapters: un-tracked,
 * un-rewarded in code, but surfaced on the title/HUD rotation so the city always
 * suggests one more thing to do once the gold marker is far away.
 */
export const FREE_ROAM_IDEAS = [
  'Bonus: steal one car from every district in a single run',
  'Bonus: reach Coral Beach at a 3-star wanted level, then lose the heat on the sand',
  'Bonus: visit all six landmarks — Harbor Customs to the Neon Pier',
  'Bonus: drive the full outer ring road without hitting a building',
  'Bonus: honk (H) at ten pedestrians in the Palm Quarter',
];
export const MISSIONS = [
  { title: '1 · Back in Solstice', giver: 'Rico', text: 'Meet Rico at Harbor Customs. He kept your old Comet running.', steps: [
    { kind: 'go', x: 340, y: 1740, label: 'Meet Rico at Harbor Customs' },
    { kind: 'go', x: 1540, y: 1740, label: 'Drive to the Palm Quarter meet' } ], reward: 250 },
  { title: '2 · Paper Trail', giver: 'Rico', text: 'Grab the ledger from Solstice Bank before the auditors do.', steps: [
    { kind: 'go', x: 740, y: 740, label: 'Reach Solstice Bank' },
    { kind: 'pickup', x: 820, y: 820, label: 'Take the ledger' },
    { kind: 'go', x: 340, y: 1740, label: 'Bring the ledger back to Rico' } ], reward: 600, wanted: 2 },
  { title: '3 · Portside Run', giver: 'Captain Sana', text: 'Move a sealed crate out of the Portside Warehouse, quietly if you can.', steps: [
    { kind: 'go', x: 2140, y: 940, label: 'Enter Portside Warehouse yard' },
    { kind: 'pickup', x: 2240, y: 1020, label: 'Load the sealed crate' },
    { kind: 'go', x: 2540, y: 1740, label: 'Deliver the crate to Coral Diner' } ], reward: 900, wanted: 3 },
  { title: '4 · Neon Diversion', giver: 'Sana', text: 'Draw the patrols to Neon Harbor, then lose them across the beach.', steps: [
    { kind: 'go', x: 540, y: 1940, label: 'Trigger the alarm in Neon Harbor' },
    { kind: 'escape', label: 'Lose the police (wanted must reach 0)' } ], reward: 1200, wanted: 4 },
  { title: '5 · The Solstice Heist', giver: 'Rico & Sana', text: 'One last job: the Downtown vault convoy. Take the gold, cross the city, vanish at Coral Beach.', steps: [
    { kind: 'go', x: 940, y: 540, label: 'Ambush the vault convoy Downtown' },
    { kind: 'pickup', x: 1020, y: 620, label: 'Take the gold bars' },
    { kind: 'go', x: 2740, y: 1940, label: 'Reach the boat at Coral Beach' },
    { kind: 'escape', label: 'Lose the police to finish the heist' } ], reward: 3000, wanted: 5 },
];
export function createMissionState() {
  return { index: 0, step: 0, active: false, done: false, cashEarned: 0 };
}
const MISSION_DISTRICTS = ['Neon Harbor', 'Solstice Downtown', 'Portside Yards', 'Neon Harbor', 'Solstice Downtown'];
export function currentObjective(ms) {
  if (ms.done) return null;
  const m = MISSIONS[ms.index];
  return { mission: m, step: m.steps[ms.step], number: ms.index + 1, district: MISSION_DISTRICTS[ms.index] || '' };
}
/** The free-roam idea to suggest right now, rotating by chapters completed. */
export function freeRoamIdea(ms) { return FREE_ROAM_IDEAS[Math.min(ms.index, FREE_ROAM_IDEAS.length - 1)]; }
export function advanceMission(ms, addWanted) {
  const m = MISSIONS[ms.index];
  ms.step += 1;
  if (m.wanted) addWanted(m.wanted);
  if (ms.step >= m.steps.length) {
    ms.cashEarned += m.reward;
    ms.index += 1; ms.step = 0;
    if (ms.index >= MISSIONS.length) { ms.done = true; return { finished: true, reward: m.reward, allDone: true }; }
    return { finished: true, reward: m.reward, allDone: false };
  }
  return { finished: false, reward: 0, allDone: false };
}
