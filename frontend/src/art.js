// Deterministic event artwork: each event gets a stable gradient banner.
const GRADS = [
  ['#7b2ff7', '#2f80ed'],
  ['#ff5e62', '#ff9966'],
  ['#11998e', '#38ef7d'],
  ['#fc4a1a', '#f7b733'],
  ['#8e2de2', '#4a00e0'],
  ['#0ba360', '#3cba92'],
  ['#f857a6', '#ff5858'],
  ['#30cfd0', '#330867'],
];
/**
 * Picks a stable gradient for an event id, so the same event always gets the
 * same banner artwork. Cycles through the GRADS palette by id.
 * @param {number|string} id - Event id.
 * @returns {string} CSS linear-gradient value.
 */
export function gradFor(id) {
  const [a, b] = GRADS[Number(id) % GRADS.length];
  return `linear-gradient(120deg, ${a}, ${b})`;
}
