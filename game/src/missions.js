export const MISSIONS = [
  { id: 0, title: 'Hotwire', brief: 'Mara Voss says you need wheels. Steal any civilian car near the plaza.', target: { kind: 'car', x: 1280, y: 1000, label: 'Steal a car' }, reward: 1000, timeLimit: 60 },
  { id: 1, title: 'Courier', brief: 'Deliver the package to the port warehouse on the east side before time runs out.', target: { kind: 'place', x: 2400, y: 960, label: 'Port Warehouse' }, reward: 2500, timeLimit: 75 },
  { id: 2, title: 'Getaway', brief: 'Attract the heat! Reach 3 stars wanted level and survive for 25 seconds.', target: { kind: 'evade', x: 1280, y: 960, label: 'Survive 3+ Stars' }, reward: 4000, timeLimit: 25 },
  { id: 3, title: 'Collection', brief: 'Collect 3 hidden cash drops scattered around downtown Vice Point.', target: { kind: 'collect', x: 900, y: 700, label: 'Cash Drop' }, reward: 5000, timeLimit: 90 },
  { id: 4, title: 'The Big Score', brief: 'Hit the downtown bank, then escape to the safehouse on the north side with wanted>=3!', target: { kind: 'escape', x: 1280, y: 400, label: 'Bank / Safehouse' }, reward: 10000, timeLimit: 120 }
];

export const STORY = {
  city: "Vice Point",
  hero: "Rook",
  fixer: "Mara Voss",
  rivals: "The Gulls",
  text: "Neon lights cut through the coastal fog as Rook steps out onto the pavement. Mara Voss has a string of jobs waiting for anyone bold enough to take Vice Point by storm. Outrun the badge, muscle the rivals, and take the city."
};

export function missionByIndex(i) {
  return MISSIONS[i] || null;
}
