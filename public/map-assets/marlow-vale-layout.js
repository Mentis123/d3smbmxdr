// Marlow Vale, the upstream council town of the Riverbend basin. Pure layout: no Three.js, no DOM, so the tests can
// check the land against the river and the town against both (src/lib/worlds/marlow-vale.test.ts).
//
// Turntable-local units, Y up, +z toward the opening camera. About 1 unit ~ 25 m. The world is a long view down a
// valley: the camera stands on a rocky eucalypt spur at the front left, the council town sits on the right bank,
// and the river runs away to an island where it leaves the view between the far ridges. Downstream (front right,
// out of the world) is Riverbend: its dam powers this town, so a transmission line arrives from that side.
//
// Three depth bands, each built at the fidelity its distance deserves:
//   hero   z  +14 .. -16   tabletop detail: council, town, bridge, plant, roads with lamps, traffic
//   middle z  -16 .. -46   coarser: farms, scattered houses, tree belts, the island, mist on the water
//   far    z  -46 .. -150  ridge silhouettes, mist banks, fog; never inspected up close

export const WATER = 0.06;
// Beyond the middle band the land falls away like the curve of the earth, so from the lookout the skyline is the
// ridges in the middle distance with sky above them, as in the reference. The river falls with it (waterAt).
export const dropAt = z => (z < -55 ? (-55 - z) ** 2 * 0.0035 : 0);
export const waterAt = z => WATER - dropAt(z);
export const FLOOR = 0.34;

// River centreline, upstream (far) to downstream (front right). Smoothed with Catmull-Rom below.
const RIVER_KEYS = [
  [-30, -150], [-24, -112], [-17, -84], [-10, -62], [-5.5, -47], [-4.5, -40], [-6.5, -32], [-10.5, -24],
  [-12.2, -16], [-10.6, -9.5], [-6.6, -4.6], [-1.5, -1.6], [4, 0.2], [9.5, 2.4], [15, 5.8], [22, 10.5], [34, 17],
];
// Half-width along the river, by key index (wider at the island, which splits the flow).
const RIVER_HALF = [2.6, 2.4, 2.1, 1.8, 1.9, 2.9, 1.8, 1.45, 1.4, 1.4, 1.45, 1.5, 1.55, 1.6, 1.7, 1.8, 1.9];

function catmull(points, perSegment) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment, t2 = t * t, t3 = t2 * t;
      const f = j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push(p1.map((_, j) => f(j)));
    }
  }
  out.push(points[points.length - 1].slice());
  return out;
}

// Dense centreline with half-width and arc length per sample.
export const RIVER = (() => {
  const pts = catmull(RIVER_KEYS.map((k, i) => [k[0], k[1], RIVER_HALF[i]]), 14);
  let s = 0;
  return pts.map((p, i) => { if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); return {x: p[0], z: p[1], half: p[2], s}; });
})();
export const RIVER_LENGTH = RIVER[RIVER.length - 1].s;

// Nearest point on the centreline: distance, half-width there, arc length and the side (+1 right of the flow).
export function riverQuery(x, z) {
  let best = {d: Infinity, half: 1, s: 0, side: 1, i: 0, t: 0};
  for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i], b = RIVER[i + 1];
    if (Math.abs(x - a.x) > 30 && Math.abs(x - b.x) > 30) continue;
    if (Math.abs(z - a.z) > 30 && Math.abs(z - b.z) > 30) continue;
    const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2));
    const px = a.x + dx * t, pz = a.z + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = {d, half: a.half + (b.half - a.half) * t, s: a.s + (b.s - a.s) * t, side: Math.sign(dx * (z - a.z) - dz * (x - a.x)) || 1, i, t};
  }
  return best;
}

// The island, mid-river where the channel widens before it leaves the view.
export const ISLAND = {x: -4.7, z: -40.2, rx: 1.25, rz: 2.7, top: 0.36};

// Fixed places (other modules anchor to these; keep them in step with the tests).
export const PLACES = {
  spur: {x: 11.38, z: 28.7, fx: -0.306, fz: -0.952}, // the rocky spur the opening camera stands on, pointing down-valley
  council: {x: 5.2, z: -7.4, top: 1.35},    // council chambers and clock tower on a levelled knoll
  plant: {x: -6.6, z: -10.6, top: FLOOR + 0.12}, // water treatment plant inside the river bend
  bridge: {s: null, x: 4.6, z: 0.42},       // road bridge; s filled in below
  glass: {x: 11.6, z: -18.5, top: 3.05},    // the glass civic building on the far hill
  substation: {x: 14.2, z: -5.6, top: FLOOR + 0.5}, // where the line from Riverbend's dam lands
  square: {x: 5.2, z: -4.6},                // the green in front of the council
};
PLACES.bridge.s = riverQuery(PLACES.bridge.x, PLACES.bridge.z).s;

// ---------------------------------------------------------------- noise (deterministic, value noise)
function hash2(i, j) { const k = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return k - Math.floor(k); }
export function noise2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), a = x - ix, b = z - iz, u = a * a * (3 - 2 * a), v = b * b * (3 - 2 * b);
  const l = (p, q, t) => p + (q - p) * t;
  return l(l(hash2(ix, iz), hash2(ix + 1, iz), u), l(hash2(ix, iz + 1), hash2(ix + 1, iz + 1), u), v);
}
export function fbm2(x, z, octaves = 4) { let v = 0, a = 0.5, f = 1, n = 0; for (let o = 0; o < octaves; o++) { v += noise2(x * f + o * 17.3, z * f - o * 9.1) * a; n += a; a *= 0.5; f *= 2.03; } return v / n; }
const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const bump = (x, z, cx, cz, rx, rz) => Math.exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));

// ---------------------------------------------------------------- terrain
// Land before the river is carved: valley floor, rolling hills, the town's hill, the spur, valley walls and ridges.
function land(x, z) {
  const n = fbm2(x * 0.22, z * 0.22), fine = noise2(x * 1.3, z * 1.3);
  let h = FLOOR + (n - 0.5) * 0.35 + (fine - 0.5) * 0.06;
  // Gentle rise away from the river on both banks; the right bank (town side) climbs to the glass building's hill.
  h += 1.15 * bump(x, z, 12.5, -19, 6.5, 6) + 0.6 * bump(x, z, 15, -10, 5, 7) + 0.5 * bump(x, z, 7, -14, 4, 4);
  h += 0.35 * bump(x, z, -20, -6, 6, 8);
  // Rolling farmland in the middle band; the valley walls stay low and far so the eye runs all the way down it.
  const along = Math.max(0, -z - 14);
  const wall = Math.max(0, Math.abs(x - riverAxis(z)) - (24 + along * 0.32));
  h += 2.6 * (1 - Math.exp(-wall * wall * 0.0016)) * (0.8 + n * 0.6);
  // Behind and beside the camera the land rises into hills too, so a turned table never shows an edge.
  h += 3 * (1 - Math.exp(-(Math.max(0, z - 36) ** 2) * 0.01));
  // The spur: a rocky shoulder at the front left where the opening camera looks over the valley.
  // The lookout: a long rocky spur behind the town that runs toward the valley from where the opening camera stands,
  // falling gently so it fills the bottom of the frame; and a low wooded rise on the near left of the valley floor.
  h += spurRise(x, z) * (0.96 + 0.08 * noise2(x * 0.7, z * 0.7));
  h += 1.4 * bump(x, z, -10, 6, 6, 4);
  return h;
}
// The spur, as a ridge aligned with the opening camera's view (along = toward the valley).
export function spurFrame(x, z) { const S = PLACES.spur, dx = x - S.x, dz = z - S.z; return {along: dx * S.fx + dz * S.fz, across: -dx * S.fz + dz * S.fx}; }
// Its top slopes just under the opening frame's bottom edge (about 0.36 down per unit forward), so the near rock fills
// the bottom of the frame and the valley shows over it; behind the camera it levels into a wooded crest.
function spurRise(x, z) {
  const {along, across} = spurFrame(x, z), a = along + 4;
  const ridge = a < 0 ? 6.7 * Math.exp(-((a / 12) ** 2)) : 0.6 * Math.log(1 + Math.exp((6.7 - 0.36 * a) / 0.6));
  return ridge * Math.exp(-((across / (3.2 + Math.max(0, a) * 0.28)) ** 2));
}
// A smooth valley axis used for the walls (the river wanders inside it).
function riverAxis(z) { return z > -10 ? -2 : z > -60 ? -2 - (z + 10) * 0.13 : 4.5 - (z + 60) * 0.35; }

// Levelled pads: council knoll, plant terrace, substation, square.
const PADS = [
  {x: PLACES.council.x, z: PLACES.council.z, r: 1.7, top: PLACES.council.top},
  {x: PLACES.plant.x, z: PLACES.plant.z, r: 2.3, top: PLACES.plant.top},
  {x: PLACES.substation.x, z: PLACES.substation.z, r: 1.6, top: PLACES.substation.top},
  {x: PLACES.glass.x, z: PLACES.glass.z, r: 1.4, top: PLACES.glass.top},
];

export function height(x, z) {
  let h = land(x, z);
  // The council stands on a knoll: raise it, then level its top.
  h += 0.95 * bump(x, z, PLACES.council.x, PLACES.council.z, 2.6, 2.4);
  for (const p of PADS) { const d = Math.hypot(x - p.x, z - p.z); const k = 1 - smooth(p.r, p.r + 1.3, d); h += (p.top - h) * k; }
  const r = riverQuery(x, z);
  // The far ridges: layered silhouettes on the horizon, opening into a wide notch along the river itself.
  if (z < -50) {
    const along = -z - 50, k = smooth(-52, -76, z), ridgeN = fbm2(x * 0.05, z * 0.04, 5);
    const notch = 1 - 0.85 * Math.exp(-((r.d / (6 + along * 0.18)) ** 2));
    h += k * notch * (0.7 + ridgeN * 2.6);
  }
  // Carve the river: bed below the water, a low wet bank at the waterline, then the land eases back in.
  const far = z < -46 ? 1 + (-46 - z) * 0.06 : 1, bed = WATER - 0.22;
  if (r.d < r.half) h = bed + (WATER + 0.08 - bed) * smooth(r.half * 0.7, r.half, r.d);
  else if (r.d < r.half + 3 * far) { const bankLine = WATER + 0.08 + (r.d - r.half) * 0.28 / far, k = smooth(r.half, r.half + 1.5 * far, r.d); h = bankLine + (h - bankLine) * k; }
  h -= dropAt(z);
  // The island rises out of the widened channel.
  const id = Math.hypot((x - ISLAND.x) / ISLAND.rx, (z - ISLAND.z) / ISLAND.rz);
  if (id < 1.6) h = Math.max(h, WATER - 0.1 + (ISLAND.top - WATER + 0.1) * (1 - smooth(0.25, 1.15, id)) + (noise2(x * 3, z * 3) - 0.5) * 0.08 * (1 - smooth(0.5, 1.1, id)));
  return h;
}

// ---------------------------------------------------------------- roads
// Polylines (smoothed); lamps every LAMP_SPACING along each. The bridge road is the only river crossing.
const ROAD_KEYS = {
  // From the front left fields over the bridge, up past the square to the council, then on up the hill.
  main: [[-2.6, 11], [-1.6, 6.4], [1.6, 2.6], [4.0, 1.3], [5.2, -0.5], [5.6, -2.6], [5.4, -4.2], [6.9, -5.6], [8.2, -8.4], [8.9, -11.6], [10.6, -14.2], [11.4, -16.6]],
  // The river road along the right bank, east to the substation and west toward the plant's access lane.
  riverside: [[-3.4, -6.2], [0, -4.3], [3.3, -3.2], [5.4, -3.6], [8.2, -2.2], [11.4, -1.4], [14.2, -3.6], [16.8, -2.4], [21, 1.6]],
  // The ring street behind the council.
  ring: [[5.6, -2.6], [2.6, -5.4], [2.4, -9.2], [4.6, -11.4], [8.2, -11.0], [8.6, -8.6]],
  // A lane into the treatment plant.
  plant: [[-3.4, -6.2], [-4.6, -8.2], [-5.4, -9.4]],
  // The south-bank estate loop (front right).
  estate: [[1.6, 2.6], [4.8, 4.4], [8.4, 6.2], [11.6, 8.6], [14.6, 11.4]],
  // A long country road out toward the island through the middle band.
  valley: [[2.4, -9.2], [1.4, -14.5], [-0.8, -21.5], [-1.0, -28.5], [0.6, -34.8], [0.9, -41], [-0.8, -50]],
};
export const ROADS = Object.fromEntries(Object.entries(ROAD_KEYS).map(([id, keys]) => {
  const pts = catmull(keys, 10); let s = 0;
  return [id, pts.map((p, i) => { if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); return {x: p[0], z: p[1], s}; })];
}));
export const ROAD_WIDTH = {main: 0.34, riverside: 0.3, ring: 0.26, plant: 0.22, estate: 0.26, valley: 0.24};
export const LAMP_SPACING = 0.5;

export function roadDistance(x, z) {
  let best = Infinity;
  for (const pts of Object.values(ROADS)) for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return best;
}

// Point and heading at arc length s on a road (for traffic).
export function roadAt(id, s) {
  const pts = ROADS[id], L = pts[pts.length - 1].s; s = Math.max(0, Math.min(L, s));
  let i = 0; while (i < pts.length - 2 && pts[i + 1].s < s) i++;
  const a = pts[i], b = pts[i + 1], t = (s - a.s) / (b.s - a.s || 1);
  return {x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, heading: Math.atan2(b.x - a.x, b.z - a.z), length: L};
}

// ---------------------------------------------------------------- town lots
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// Where houses may stand: town blocks on the right bank, the south-bank estate, and farms scattered up the valley.
const ZONES = [
  {id: 'town', x0: -1.5, x1: 13.5, z0: -14.5, z1: -2.4, step: 0.62, keep: 0.8},
  {id: 'estate', x0: 2.5, x1: 16.5, z0: 2.6, z1: 12, step: 0.66, keep: 0.72},
  {id: 'east', x0: 12.5, x1: 20, z0: -12, z1: 1, step: 0.8, keep: 0.45},
  {id: 'farms', x0: -18, x1: 14, z0: -44, z1: -15, step: 2.4, keep: 0.22},
  {id: 'west', x0: -24, x1: -14, z0: -14, z1: 4, step: 1.9, keep: 0.25},
];
const KEEP_CLEAR = [
  {x: PLACES.council.x, z: PLACES.council.z, r: 1.9}, {x: PLACES.square.x, z: PLACES.square.z, r: 1.0},
  {x: PLACES.plant.x, z: PLACES.plant.z, r: 2.6}, {x: PLACES.substation.x, z: PLACES.substation.z, r: 1.9},
  {x: PLACES.glass.x, z: PLACES.glass.z, r: 1.7}, {x: PLACES.spur.x, z: PLACES.spur.z, r: 9},
];
export const HOUSES = (() => {
  const out = [], r = rng(281026);
  for (const zone of ZONES) for (let z = zone.z0; z < zone.z1; z += zone.step) for (let x = zone.x0; x < zone.x1; x += zone.step) {
    const px = x + (r() - 0.5) * zone.step * 0.7, pz = z + (r() - 0.5) * zone.step * 0.7, keep = r(), size = r(), tone = r(), rot = r();
    if (keep > zone.keep) continue;
    const river = riverQuery(px, pz); if (river.d < river.half + 0.75) continue;
    if (Math.hypot((px - ISLAND.x) / ISLAND.rx, (pz - ISLAND.z) / ISLAND.rz) < 1.4) continue;
    const road = roadDistance(px, pz), near = zone.id === 'town' || zone.id === 'estate';
    if (road < 0.36) continue;
    if (near && road > 1.6) continue;
    if (KEEP_CLEAR.some(k => Math.hypot(px - k.x, pz - k.z) < k.r)) continue;
    const y = height(px, pz), slope = Math.abs(height(px + 0.3, pz) - height(px - 0.3, pz)) + Math.abs(height(px, pz + 0.3) - height(px, pz - 0.3));
    if (slope > 0.45 || y < WATER + 0.18 || y > 4.5) continue;
    const w = 0.3 + size * 0.22, d = 0.26 + ((size * 7.3) % 1) * 0.16;
    out.push({x: +px.toFixed(3), z: +pz.toFixed(3), y, w, d, h: 0.2 + size * 0.12 + (zone.id === 'town' && size > 0.85 ? 0.16 : 0), rot: rot * Math.PI, tone, zone: zone.id});
  }
  return out;
})();
