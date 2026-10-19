import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {buildElectrical} from './electrical.js';
import {createFlowMaterial} from './flow-effects.js';
import {makeBatch, metal, slabTexture} from './builder-utils.js';
import {LAYOUT} from './scene-layout.js';
import {ITEMS, STORIES, STATUSES} from './nextdc-data.js';

// NEXTDC showcase world: one connected datacentre miniature. The campus (power, cooling, connectivity, security)
// sits at the back on the energy yard datum; the data hall is a cutaway whose roof fades as the camera comes close,
// revealing the Data#3 showcase cage; an office, a branch and an industrial site sit in front, with a cloud above.
// Stories change the same world (lit connections, focus and alert rings, a travelling workload, monitoring beacons).
// Words and statuses live in nextdc-data.js. Conceptual, not NEXTDC's actual site. Brief: docs/NEXTDC-DESIGN.md.
export const NEXTDC_SEED = 211026;
const DECK = LAYOUT.yard.y;
const GROUND = 0.05;

// Showcase racks, left to right inside the cage.
const RACK_ORDER = ['net', 'compute', 'storage', 'gpu', 'backup', 'ops'];
const RACK_X = Object.fromEntries(RACK_ORDER.map((id, i) => [id, -6.6 + i * 0.56]));
const RACK_Z = -2.3;
const RACK_LED = {net: 0x40d9ff, compute: 0x3a8bff, storage: 0xb07cff, gpu: 0x5dff6a, backup: 0xffb347, ops: 0xe8f4ff};
const CAGE = {x0: -7.0, x1: -3.4, z0: -3.2, z1: -1.0, h: 2.2};
const CAGE_CENTER = new THREE.Vector3((CAGE.x0 + CAGE.x1) / 2, DECK + 1.0, (CAGE.z0 + CAGE.z1) / 2);

// Pin anchors (model space). The hotspot layer lifts each pin 0.45 above its anchor.
const ANCHORS = {
  power: [LAYOUT.yard.x, DECK + 2.0, LAYOUT.yard.z],
  cooling: [0.2, DECK + 4.4, -4.3],
  connectivity: [-2.6, DECK + 0.6, 1.0],
  security: [2.6, DECK + 1.3, 0.9],
  cage: [-5.2, DECK + 2.9, -2.1],
  facility: [0.2, DECK + 4.4, -4.3],
  office: [-7.0, 2.6, 4.8],
  branch: [-1.6, 1.9, 5.2],
  industrial: [5.8, 2.6, 4.9],
  cloud: [-1.0, 8.9, -8.6],
  // Rack pins sit on three heights: the racks are 0.56 m apart, so level labels would overlap and hide each other.
  ...Object.fromEntries(RACK_ORDER.map((id, i) => [id, [RACK_X[id], DECK + 2.05 + (i % 3) * 0.6, RACK_Z]])),
};

// Views for the shared viewer. Distance is about 36 / zoom on a desktop screen.
// The hero is the partner showcase (close enough that the roof is away and the rack pins show); 'facility' is the
// whole campus for context.
const NEXTDC_VIEWS_BASE = {
  hero: {yaw: 0, target: [CAGE_CENTER.x, DECK + 1.5, CAGE_CENTER.z], zoom: 4.2, tilt: 0.6, azimuth: 0.3, fov: 38},
  facility: {yaw: 0, target: [-0.6, 2.4, -1.0], zoom: 1.12, tilt: 0.62, azimuth: 0.25, fov: 38},
  cage: {yaw: 0, target: [CAGE_CENTER.x, DECK + 0.9, CAGE_CENTER.z], zoom: 4.4, tilt: 0.78, azimuth: 0.18, fov: 38},
  power: {yaw: 0, target: [6.6, DECK + 1.2, -0.8], zoom: 2.8, tilt: 0.5, azimuth: 0.55, fov: 38},
  cooling: {yaw: 0, target: [0.2, DECK + 3.2, -4.0], zoom: 3.0, tilt: 0.7, azimuth: 0.3, fov: 38},
  connectivity: {yaw: 0, target: [-2.2, DECK + 0.4, 0.4], zoom: 3.2, tilt: 0.62, azimuth: 0.3, fov: 38},
  security: {yaw: 0, target: [1.2, DECK + 0.8, 0.6], zoom: 3.4, tilt: 0.5, azimuth: 0.45, fov: 38},
  office: {yaw: 0, target: [-6.6, 1.2, 4.6], zoom: 3.2, tilt: 0.42, azimuth: 0.3, fov: 38},
  branch: {yaw: 0, target: [-1.4, 1.0, 5.0], zoom: 3.8, tilt: 0.42, azimuth: 0.2, fov: 38},
  industrial: {yaw: 0, target: [5.8, 1.2, 4.8], zoom: 3.1, tilt: 0.45, azimuth: 0.1, fov: 38},
  cloud: {yaw: 0, target: [-1.0, 6.6, -6.4], zoom: 1.9, tilt: 0.32, azimuth: 0.2, fov: 38},
  ...Object.fromEntries(RACK_ORDER.map(id => [id, {yaw: 0, target: [RACK_X[id], DECK + 1.0, RACK_Z], zoom: 6.4, tilt: 0.5, azimuth: 0.12, fov: 38}])),
};
// On phones the facility view pulls in a little and close-ups a little more (viewer.js viewZoom), keeping the outer cards in frame.
export const NEXTDC_VIEWS = Object.fromEntries(Object.entries(NEXTDC_VIEWS_BASE).map(([id, v]) => [id, {...v, portraitZoom: id === 'facility' ? 1.3 : 1.25}]));

// Ground rings for focus and alerts, sized per item.
const RINGS = {
  power: {at: [LAYOUT.yard.x, DECK + 0.06, LAYOUT.yard.z], r: 2.3},
  cooling: {at: [0.2, DECK + 3.46, -4.3], r: 1.9},
  connectivity: {at: [-2.6, DECK + 0.06, 1.0], r: 0.7},
  security: {at: [2.6, DECK + 0.06, 0.9], r: 0.8},
  cage: {at: [CAGE_CENTER.x, DECK + 0.06, CAGE_CENTER.z], r: 2.2},
  office: {at: [-7.0, GROUND + 0.02, 4.8], r: 1.9},
  branch: {at: [-1.6, GROUND + 0.02, 5.2], r: 1.2},
  industrial: {at: [5.8, GROUND + 0.02, 4.9], r: 2.2},
  cloud: {at: [-1.0, 7.1, -8.6], r: 2.0},
  ...Object.fromEntries(RACK_ORDER.map(id => [id, {at: [RACK_X[id], DECK + 0.06, RACK_Z + 0.55], r: 0.34}])),
};

// Connections and internal traces, as point lists shared by the glowing tubes and the workload token paths.
const PIT_A = [-2.6, DECK + 0.08, 1.0], PIT_B = [0.4, DECK + 0.08, 1.0];
const CLOUD = [-1.0, 7.6, -8.6];
const PATHS = {
  'office-dc': [[-7.0, 1.95, 4.8], [-6.0, 3.6, 3.2], [-3.8, 3.2, 1.8], PIT_A],
  'branch-dc': [[-1.6, 1.3, 5.2], [-1.9, 3.0, 3.3], [-2.4, 2.6, 1.7], PIT_A],
  'industrial-dc': [[5.8, 1.6, 4.9], [3.8, 3.4, 3.2], [1.2, 2.8, 1.7], PIT_B],
  'dc-cloud': [[-0.2, DECK + 3.45, -6.2], [-0.5, 6.6, -7.4], CLOUD],
  'branch-cloud': [[-1.6, 1.4, 5.2], [-1.0, 5.6, 2.4], [-0.6, 8.7, -3.2], [-0.9, 8.0, -7.8]],
  'power-trace': [[6.17, DECK + 1.1, 0.38], [4.6, DECK + 2.8, -1.2], [2.4, DECK + 2.8, -2.0], [-2.0, DECK + 2.2, -2.0], [-3.3, DECK + 2.2, -2.3], [-6.9, DECK + 2.2, -2.3]],
  'cooling-trace': [[0.2, DECK + 3.45, -4.3], [-1.0, DECK + 3.0, -4.3], [-2.0, DECK + 2.0, -3.6], [-3.3, DECK + 1.9, -2.95], [-6.9, DECK + 1.9, -2.95]],
  'fibre-trace': [PIT_A, [-2.6, DECK + 0.08, -0.6], [-2.65, DECK + 1.2, -1.45], [-3.0, DECK + 2.05, -1.7], [-6.6, DECK + 2.05, -2.0]],
};
const LINK_COLORS = {data: [0.25, 1.2, 2.6], power: [2.6, 1.5, 0.28], cooling: [0.12, 1.8, 2.5]};
const LINK_KIND = {'power-trace': 'power', 'cooling-trace': 'cooling'};
const rackTop = id => [[RACK_X[id], DECK + 2.05, -2.0], [RACK_X[id], DECK + 1.3, -1.8]];
const TOKEN_PATHS = {
  'office-to-compute': [...PATHS['office-dc'], ...PATHS['fibre-trace'].slice(1), ...rackTop('compute')],
  'compute-to-cloud': [[RACK_X.compute, DECK + 1.3, -1.8], [RACK_X.compute, DECK + 2.3, -2.0], [-4.5, DECK + 3.2, -3.5], [-1.8, 6.5, -7.0], CLOUD],
  'backup-restore': [...rackTop('backup').reverse(), ...PATHS['fibre-trace'].slice().reverse(), ...PATHS['office-dc'].slice(0, -1).reverse()],
  'branch-ai-private': [...PATHS['branch-dc'], ...PATHS['fibre-trace'].slice(1), ...rackTop('gpu')],
  'branch-ai-cloud': PATHS['branch-cloud'],
  'ops-fix': [[RACK_X.ops, DECK + 1.3, -1.8], [RACK_X.ops, DECK + 2.3, -1.9], [RACK_X.storage, DECK + 2.3, -1.9], [RACK_X.storage, DECK + 1.3, -1.8]],
};

const curve = points => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');

export function createNextdcScene() {
  const world = createWorldShell(NEXTDC_SEED);
  const {root} = world;
  world.key.color.set(0xffe4bb);
  world.key.intensity = 3;
  world.height = () => DECK;
  const glow = hex => new THREE.MeshBasicMaterial({color: hex, toneMapped: false});
  const concrete = metal(0x65716f, 0.95, 0), cladding = metal(0xb5b6ae, 0.78, 0.12), plantPaint = metal(0x8f979a, 0.7, 0.2);
  const steel = metal(0x879398, 0.42, 0.72), dark = metal(0x1c2834, 0.6, 0.4), tenant = metal(0x2a3138, 0.7, 0.3);
  const grass = metal(0x1e3328, 0.95, 0), asphalt = metal(0x2a2f33, 0.9, 0), glass = metal(0x34515f, 0.25, 0.6);

  // ---------------------------------------------------------------- campus: power, cooling, connectivity, security
  buildElectrical(world);
  const pad = makeBatch(root, 'nextdc-pad');
  pad.box(0, DECK * 0.25, -3.0, 19.8, DECK * 0.5, 9.8, concrete);
  pad.box(0, DECK * 0.75, -3.0, 18.8, DECK * 0.5, 9.2, concrete);
  // Generators beside the plant block, with exhaust stacks.
  for (const z of [-6.3, -5.1]) {
    pad.box(3.7, DECK + 0.45, z, 1.4, 0.9, 0.9, metal(0x4a5558, 0.65, 0.25));
    pad.beam([4.25, DECK + 0.9, z], [4.25, DECK + 1.6, z], 0.06, dark);
  }
  // Fibre pits (two diverse entries).
  for (const [x, , z] of [PIT_A, PIT_B]) pad.box(x, DECK + 0.03, z, 0.5, 0.06, 0.5, dark);
  // Perimeter fence with a gate gap, a gatehouse with a barrier, and camera poles at the corners.
  const fx0 = -9.25, fx1 = 9.25, fz0 = -7.45, fz1 = 1.45, gate = [1.0, 2.2];
  for (let x = fx0; x <= fx1 + 1e-6; x += 0.92) for (const z of [fz0, fz1]) if (!(z === fz1 && x > gate[0] && x < gate[1])) pad.beam([x, DECK, z], [x, DECK + 0.6, z], 0.014, steel, 5);
  for (let z = fz0; z <= fz1 + 1e-6; z += 0.9) for (const x of [fx0, fx1]) pad.beam([x, DECK, z], [x, DECK + 0.6, z], 0.014, steel, 5);
  for (const y of [DECK + 0.3, DECK + 0.58]) {
    pad.beam([fx0, y, fz0], [fx1, y, fz0], 0.01, steel, 5);
    for (const x of [fx0, fx1]) pad.beam([x, y, fz0], [x, y, fz1], 0.01, steel, 5);
    pad.beam([fx0, y, fz1], [gate[0], y, fz1], 0.01, steel, 5);
    pad.beam([gate[1], y, fz1], [fx1, y, fz1], 0.01, steel, 5);
  }
  pad.box(2.6, DECK + 0.45, 0.9, 0.9, 0.9, 0.8, cladding);
  pad.box(2.6, DECK + 0.95, 0.9, 1.0, 0.08, 0.9, dark);
  pad.box(1.6, DECK + 0.45, 1.25, 1.1, 0.05, 0.05, glow(0xff5a4a));
  for (const [x, z] of [[fx0, fz0], [fx1, fz0], [fx0, fz1], [fx1, fz1]]) {
    pad.beam([x, DECK, z], [x, DECK + 1.6, z], 0.03, steel);
    pad.box(x + (x < 0 ? 0.12 : -0.12), DECK + 1.62, z + (z < 0 ? 0.12 : -0.12), 0.22, 0.12, 0.12, dark);
  }
  pad.finish();
  const deckSlab = slabTexture();
  deckSlab.repeat.set(6.3, 3.1);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(18.8, 9.2), new THREE.MeshStandardMaterial({map: deckSlab, roughness: 0.9, metalness: 0.02}));
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, DECK + 0.004, -3.0);
  deck.receiveShadow = true;
  root.add(deck);

  // Facility: cutaway data hall (west) and a plant block with rooftop chillers (east).
  const building = makeBatch(root, 'nextdc-building');
  const HALL = {x0: -7.6, x1: -2.0, z0: -6.8, z1: -0.6, h: 2.4};
  const hx = (HALL.x0 + HALL.x1) / 2, hz = (HALL.z0 + HALL.z1) / 2;
  building.box(hx, DECK + HALL.h / 2, HALL.z0 + 0.1, HALL.x1 - HALL.x0, HALL.h, 0.2, cladding);
  building.box(HALL.x0 + 0.1, DECK + HALL.h / 2, hz, 0.2, HALL.h, HALL.z1 - HALL.z0, cladding);
  building.box(-2.0 + 2.2, DECK + 1.7, hz, 4.4, 3.4, HALL.z1 - HALL.z0, plantPaint);
  for (const x of [-0.9, 1.3]) for (const z of [-5.4, -3.2]) {
    building.box(x, DECK + 3.4 + 0.25, z, 1.6, 0.5, 1.1, cladding);
  }
  // Tenant rows: generic, kept dim so the showcase reads as the hero.
  for (const z of [-5.4, -4.2]) for (let i = 0; i < 7; i++) {
    building.box(-7.1 + i * 0.72, DECK + 1.0, z, 0.6, 2.0, 0.9, tenant);
    building.box(-7.1 + i * 0.72 + 0.2, DECK + 1.0, z + 0.46, 0.02, 1.4, 0.01, glow(0x23485f));
  }
  // Meet-me room at the hall's front right, where the fibre arrives.
  building.box(-2.65, DECK + 0.9, -1.45, 0.8, 1.8, 0.8, metal(0x22384c, 0.5, 0.5));
  building.box(-2.65, DECK + 1.5, -1.04, 0.5, 0.06, 0.01, glow(0x40d9ff));
  building.finish();
  // The hall roof: its own material so it can fade as the camera comes close.
  const roofMat = new THREE.MeshStandardMaterial({color: 0x3a4a55, roughness: 0.7, metalness: 0.3, transparent: true, opacity: 1});
  const roof = new THREE.Mesh(new THREE.BoxGeometry(HALL.x1 - HALL.x0 + 0.2, 0.12, HALL.z1 - HALL.z0 + 0.2), roofMat);
  roof.position.set(hx, DECK + HALL.h + 0.06, hz);
  roof.castShadow = true;
  // The front wall fades with the roof, so flying in opens the hall like a cutaway.
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(HALL.x1 - HALL.x0, HALL.h, 0.2), roofMat);
  frontWall.position.set(hx, DECK + HALL.h / 2, HALL.z1 - 0.1);
  frontWall.castShadow = true;
  root.add(roof, frontWall);
  // Rooftop chiller fans.
  const fans = [];
  for (const x of [-0.9, 1.3]) for (const z of [-5.4, -3.2]) for (const dx of [-0.4, 0.4]) {
    const fan = new THREE.Group();
    fan.position.set(x + dx, DECK + 3.92, z);
    for (let k = 0; k < 3; k++) {
      const arm = new THREE.Group();
      arm.rotation.y = (k * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.3), metal(0x9ed9f2, 0.4, 0.2));
      blade.position.z = 0.15;
      arm.add(blade);
      fan.add(arm);
    }
    root.add(fan);
    fans.push(fan);
  }

  // ---------------------------------------------------------------- the Data#3 showcase cage
  const cageLines = [];
  const grid = 0.18;
  const side = (ax, az, bx, bz, skip) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / grid);
    for (let i = 0; i <= n; i++) {
      const f = i / n, x = ax + (bx - ax) * f, z = az + (bz - az) * f;
      if (skip && skip(x, z)) continue;
      cageLines.push(x, DECK, z, x, DECK + CAGE.h, z);
    }
    for (let y = 0; y <= CAGE.h + 1e-6; y += grid * 2) cageLines.push(ax, DECK + y, az, bx, DECK + y, bz);
  };
  side(CAGE.x0, CAGE.z0, CAGE.x1, CAGE.z0);
  side(CAGE.x0, CAGE.z0, CAGE.x0, CAGE.z1);
  side(CAGE.x1, CAGE.z0, CAGE.x1, CAGE.z1);
  side(CAGE.x0, CAGE.z1, CAGE.x1, CAGE.z1, x => x > -4.3 && x < -3.7);
  const cageGeo = new THREE.BufferGeometry();
  cageGeo.setAttribute('position', new THREE.Float32BufferAttribute(cageLines, 3));
  const cageMesh = new THREE.LineSegments(cageGeo, new THREE.LineBasicMaterial({color: 0x00aeff, transparent: true, opacity: 0.55}));
  root.add(cageMesh);
  const cageEdge = makeBatch(root, 'nextdc-cage-edge');
  const cw = CAGE.x1 - CAGE.x0, cd = CAGE.z1 - CAGE.z0;
  const blue = glow(0x00aeff);
  cageEdge.box(CAGE_CENTER.x, DECK + 0.015, CAGE.z0, cw, 0.03, 0.05, blue);
  cageEdge.box(CAGE_CENTER.x, DECK + 0.015, CAGE.z1, cw, 0.03, 0.05, blue);
  cageEdge.box(CAGE.x0, DECK + 0.015, CAGE_CENTER.z, 0.05, 0.03, cd, blue);
  cageEdge.box(CAGE.x1, DECK + 0.015, CAGE_CENTER.z, 0.05, 0.03, cd, blue);
  cageEdge.finish();
  // Racks: each with its own body and LED material, so stories can flash or dim one.
  const racks = {};
  for (const id of RACK_ORDER) {
    const bodyMat = new THREE.MeshStandardMaterial({color: 0x17324f, roughness: 0.55, metalness: 0.4, emissive: 0x000000});
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.9), bodyMat);
    body.position.set(RACK_X[id], DECK + 1.0, RACK_Z);
    body.castShadow = body.receiveShadow = true;
    const ledMat = glow(RACK_LED[id]);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.6, 0.01), ledMat);
    led.position.set(RACK_X[id] + 0.17, DECK + 1.0, RACK_Z + 0.46);
    root.add(body, led);
    racks[id] = {bodyMat, ledMat, base: new THREE.Color(RACK_LED[id])};
  }
  // Operations: a small dashboard panel on the ops rack.
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.28), glow(0x1f6d8f));
  dash.position.set(RACK_X.ops - 0.04, DECK + 1.45, RACK_Z + 0.461);
  root.add(dash);
  // Monitoring beacons, shown by the operations story.
  const beacons = new THREE.Group();
  const beaconMats = {};
  for (const id of RACK_ORDER) {
    const mat = glow(0x5dff6a);
    beaconMats[id] = mat;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), mat);
    pillar.position.set(RACK_X[id], DECK + 2.3, RACK_Z);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mat);
    dot.position.set(RACK_X[id], DECK + 2.58, RACK_Z);
    beacons.add(pillar, dot);
  }
  beacons.visible = false;
  root.add(beacons);

  // ---------------------------------------------------------------- surroundings: office, branch, industrial, cloud
  const land = makeBatch(root, 'nextdc-land');
  land.box(0, 0, 4.65, 20.4, 0.1, 5.5, grass);
  land.box(1.6, GROUND + 0.01, 4.6, 0.7, 0.02, 5.4, asphalt);
  land.box(-1.0, GROUND + 0.01, 3.0, 19.0, 0.02, 0.6, asphalt);
  // Office: two storeys with window bands.
  land.box(-7.0, GROUND + 0.9, 4.8, 2.6, 1.8, 1.6, glass);
  land.box(-7.0, GROUND + 1.82, 4.8, 2.7, 0.06, 1.7, dark);
  // Branch: small shopfront with an awning and an antenna.
  land.box(-1.6, GROUND + 0.55, 5.2, 1.6, 1.1, 1.1, cladding);
  land.box(-1.6, GROUND + 0.85, 5.82, 1.6, 0.05, 0.3, metal(0x2b6fb0, 0.6, 0.2));
  land.beam([-1.0, GROUND + 1.1, 4.9], [-1.0, GROUND + 1.9, 4.9], 0.015, steel, 5);
  // Industrial site: a shed with a sawtooth roof, a silo and a stack.
  land.box(5.8, GROUND + 0.65, 4.9, 3.2, 1.3, 1.8, plantPaint);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.BoxGeometry(0.8, 0.05, 1.8);
    g.rotateZ(-0.45);
    g.translate(4.5 + i * 0.8, GROUND + 1.5, 4.9);
    land.geometry(g, metal(0x4a5558, 0.65, 0.25));
  }
  land.cylinder(7.8, GROUND + 0.8, 4.2, 0.4, 0.4, 1.6, steel, 18);
  land.beam([7.2, GROUND, 5.7], [7.2, GROUND + 2.2, 5.7], 0.08, dark);
  // A few trees so the landscape reads as a place.
  for (const [x, z] of [[-9.4, 3.6], [-9.0, 6.4], [-4.6, 6.6], [-4.2, 3.9], [0.4, 6.8], [3.2, 6.6], [3.6, 3.8], [9.2, 6.5], [9.4, 3.7], [-8.4, 2.4]]) {
    land.cylinder(x, GROUND + 0.15, z, 0.04, 0.05, 0.3, metal(0x4a3a2a, 0.9, 0), 6);
    const cone = new THREE.ConeGeometry(0.32, 0.9, 8);
    cone.translate(x, GROUND + 0.75, z);
    land.geometry(cone, metal(0x2f5a3c, 0.9, 0));
  }
  land.finish();
  // Window glows: separate materials so an incident can darken the office.
  const officeWindows = glow(0xffc982), officeServer = glow(0x40d9ff), branchGlow = glow(0xffc982), plantGlow = glow(0xffc982);
  const windows = makeBatch(root, 'nextdc-windows');
  for (const y of [0.45, 1.25]) windows.box(-7.0, GROUND + y, 5.61, 2.3, 0.22, 0.01, officeWindows);
  windows.box(-7.9, GROUND + 0.45, 5.615, 0.5, 0.22, 0.01, officeServer);
  windows.box(-1.6, GROUND + 0.45, 5.76, 1.2, 0.4, 0.01, branchGlow);
  windows.box(5.8, GROUND + 0.7, 5.81, 2.6, 0.2, 0.01, plantGlow);
  windows.finish();
  // Cloud: a floating cluster that bobs gently.
  const cloud = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({color: 0xdff3ff, emissive: 0x2a6a99, emissiveIntensity: 0.6, roughness: 0.9, transparent: true, opacity: 0.92});
  for (const [x, y, z, r] of [[0, 0, 0, 1.2], [1.2, -0.2, 0.2, 0.9], [-1.2, -0.25, 0.1, 0.85], [0.5, 0.5, -0.3, 0.8], [-0.6, 0.45, -0.2, 0.75], [0.2, -0.35, 0.7, 0.7], [2.0, -0.4, 0, 0.55]]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), cloudMat);
    ball.position.set(x, y, z);
    cloud.add(ball);
  }
  cloud.position.set(-1.0, 8.4, -8.6);
  root.add(cloud);

  // ---------------------------------------------------------------- connections, traces and the workload token
  const links = {};
  for (const [id, points] of Object.entries(PATHS)) {
    const color = LINK_COLORS[LINK_KIND[id] || 'data'];
    const trace = id.endsWith('-trace');
    const mat = createFlowMaterial({base: [0.004, 0.02, 0.05], glow: color, speed: 0.22, repeat: trace ? 6 : 4});
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve(points), points.length * 24, trace ? 0.05 : 0.045, 8, false), mat);
    root.add(mesh);
    links[id] = {mesh, mat, color: new THREE.Vector3(...color), trace};
  }
  const tokenCurves = Object.fromEntries(Object.entries(TOKEN_PATHS).map(([id, pts]) => [id, curve(pts)]));
  const token = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), glow(0xffffff));
  const tokenHalo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({color: 0x78dcff, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false}));
  token.add(tokenHalo);
  token.visible = false;
  root.add(token);

  // Rings for focus, selection and alerts.
  const rings = {};
  for (const [id, {at, r}] of Object.entries(RINGS)) {
    const mat = new THREE.MeshBasicMaterial({color: 0x00aeff, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false});
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, Math.max(0.025, r * 0.03), 8, 64), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(...at);
    ring.visible = false;
    ring.renderOrder = 4;
    root.add(ring);
    rings[id] = {ring, mat};
  }

  // ---------------------------------------------------------------- state, stories and per-frame animation
  let state = {}, storyStart = 0, lastT = 0, selected = null, near = false;
  const tmp = new THREE.Vector3();
  const lit = id => (state.lit || []).includes(id);

  function applyLinks() {
    const storyOn = Object.keys(state).length > 0;
    for (const [id, link] of Object.entries(links)) {
      const k = lit(id) ? 1 : link.trace ? 0 : storyOn ? 0.15 : 0.5;
      link.mesh.visible = k > 0;
      link.mat.uniforms.uGlow.value.copy(link.color).multiplyScalar(k);
    }
  }

  world.updates.push(t => {
    lastT = t;
    const local = t - storyStart;
    for (const link of Object.values(links)) link.mat.uniforms.uTime.value = t;
    for (const fan of fans) fan.rotation.y = t * 5;
    cloud.position.y = 8.4 + Math.sin(t * 0.6) * 0.12;
    // Rings: story focus in blue, the selected pin in white, alerts in red.
    const pulse = 1 + 0.08 * Math.sin(t * 4);
    for (const [id, {ring, mat}] of Object.entries(rings)) {
      const alert = state.alert === id, focus = (state.focus || []).includes(id), chosen = selected === id;
      ring.visible = alert || focus || chosen;
      if (!ring.visible) continue;
      mat.color.set(alert ? 0xff4d4d : chosen && !focus ? 0xffffff : 0x00aeff);
      ring.scale.setScalar(alert ? 1 + 0.15 * Math.abs(Math.sin(t * 5)) : pulse);
      if (id === 'cloud') ring.position.y = cloud.position.y - 1.3;
    }
    // Racks: LEDs pulse; an alert flashes red; ops dashboard flickers.
    for (const [id, rack] of Object.entries(racks)) {
      if (state.alert === id) rack.ledMat.color.setRGB(Math.sin(t * 8) > 0 ? 1 : 0.25, 0.1, 0.1);
      else rack.ledMat.color.copy(rack.base).multiplyScalar(0.7 + 0.3 * Math.sin(t * 2 + RACK_X[id] * 5));
      rack.bodyMat.emissive.setRGB(state.alert === id ? 0.35 * (0.5 + 0.5 * Math.sin(t * 8)) : 0, 0, 0);
      beaconMats[id].color.set(state.alert === id ? 0xff4d4d : 0x5dff6a);
    }
    // The office goes dark in an incident and flashes red on alert.
    const officeDown = (state.dim || []).includes('office');
    officeWindows.color.set(officeDown ? 0x1a1a1a : 0xffc982);
    officeServer.color.set(state.alert === 'office' ? (Math.sin(t * 8) > 0 ? 0xff4d4d : 0x330000) : officeDown ? 0x111111 : 0x40d9ff);
    beacons.visible = state.overlay === 'monitor';
    // The workload token travels its path at a steady speed, then waits briefly and repeats.
    if (state.token) {
      const c = tokenCurves[state.token], dur = Math.max(3, c.getLength() / 2.4), cycle = dur + 0.8;
      const u = Math.min(1, ((local % cycle) + cycle) % cycle / dur);
      c.getPointAt(u, tmp);
      token.position.copy(tmp);
      token.visible = true;
    } else token.visible = false;
  });

  // Roof fade and pin scope follow how wide a slice of the world is in frame at the cage, not raw distance: a tall
  // phone frame sits the camera further back for the same framing, and the roof must still come away there.
  const cageWorld = new THREE.Vector3();
  world.onCamera = camera => {
    cageWorld.copy(CAGE_CENTER);
    root.localToWorld(cageWorld);
    const dist = camera.position.distanceTo(cageWorld);
    const span = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect;
    near = span < 9.5;
    const opacity = THREE.MathUtils.smoothstep(span, 7, 13.5);
    roofMat.opacity = opacity;
    roofMat.depthWrite = opacity > 0.98;
    roof.visible = frontWall.visible = opacity > 0.02;
  };

  // Stories: set the world state for one step and return the view to glide to.
  world.setStory = (id, step = 0) => {
    const story = STORIES.find(s => s.id === id);
    const current = story?.steps[Math.max(0, Math.min(story.steps.length - 1, step | 0))];
    state = current ? current.state : {};
    storyStart = lastT;
    applyLinks();
    return current?.view || null;
  };
  world.onHotspot = spot => { selected = spot.id; };
  applyLinks();

  // Pins come from the shared data: status in the label, rack pins only at the cage, far pins only outside.
  world.hotspots = ITEMS.map(item => ({
    id: item.id,
    label: `${item.pin || item.label} · ${STATUSES[item.status].label.toLowerCase()}`,
    caption: item.what,
    view: item.id,
    anchor: new THREE.Vector3(...ANCHORS[item.id]),
    hidden: () => (item.scope === 'any' ? false : item.scope === 'near' ? !near : near),
  }));
  world.nextdc = {items: ITEMS.map(i => i.id), stories: STORIES.map(s => s.id), get near() { return near; }, get state() { return state; }};
  return world;
}

// Generic names the shared viewer loads every extra world by.
export {createNextdcScene as createWorld, NEXTDC_SEED as WORLD_SEED, NEXTDC_VIEWS as WORLD_VIEWS};
