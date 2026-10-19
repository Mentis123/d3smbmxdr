import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {buildElectrical} from './electrical.js';
import {createFlowMaterial} from './flow-effects.js';
import {createWaterMaterial} from './water.js';
import {makeBatch, metal} from './builder-utils.js';
import {LAYOUT} from './scene-layout.js';

// AI-ready datacenter miniature. It shares the water-and-energy world's turntable, key light and environment,
// its substation kit (buildElectrical on LAYOUT.yard), the energy flow shader for pulses along cables and pipes,
// the treatment-basin water shader, and the mining workshop's open-front building language.
export const DC_SEED = 201026;
// The energy yard datum. Everything on the hall pad sits at this height so the substation lines up.
export const DECK = LAYOUT.yard.y;
// Where each pin points, in model units (the same space as the other worlds).
export const DC_ANCHORS = {
  power: new THREE.Vector3(LAYOUT.yard.x, DECK + 1.45, LAYOUT.yard.z + 1.03),
  cooling: new THREE.Vector3(3.0, DECK + 1.75, -2.6),
  structure: new THREE.Vector3(-3.0, DECK + 0.16, 2.0),
};

// Camera views for the shared viewer (same shape as MINING_VIEWS and the energy views).
export const DATACENTER_VIEWS = {
  hero: {yaw: 0, target: [-0.8, 1.6, -0.6], zoom: 1, tilt: 0.62, azimuth: 0.42, fov: 36},
  power: {yaw: 0, target: [6.4, 2.6, 0.2], zoom: 2.1, tilt: 0.5, azimuth: 0.42, fov: 36},
  cooling: {yaw: 0, target: [1.6, 2.4, -2.0], zoom: 2.2, tilt: 0.5, azimuth: 0.42, fov: 36},
  structure: {yaw: 0, target: [-3.0, 1.8, 1.8], zoom: 2.3, tilt: 0.5, azimuth: 0.35, fov: 36},
};
// Pins for the shared hotspot layer. Pin 2 toggles the air-only view, so the air limit and the liquid path are one comparison.
export const DC_HOTSPOTS = [
  {id: 'power', label: '1 · Too hungry', view: 'power', anchor: DC_ANCHORS.power,
    caption: 'Power density shock. Many racks were designed for about 10 kW; an AI rack can need 100–250+ kW. AI needs more power per rack, not more racks.'},
  {id: 'cooling', label: '2 · Too hot', view: 'cooling', anchor: DC_ANCHORS.cooling, cooling: 'air',
    caption: 'Air cooling hits its limit at AI density. Select again to switch between air-only and the liquid loop.'},
  {id: 'structure', label: '3 · Too heavy', view: 'structure', anchor: DC_ANCHORS.structure,
    caption: 'Structural constraints. AI racks weigh about 2,000–5,000+ lb each. Check floor loading, cable and pipe paths before they arrive.'},
];

function tileTexture() {
  // 600 mm raised-floor tiles with pedestal dots, drawn procedurally so the miniature needs no image asset.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d');
  g.fillStyle = '#1b2b3c';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x = i * 256, y = j * 256;
    const shade = (i + j) % 2 ? '#213348' : '#1d2e41';
    g.fillStyle = shade;
    g.fillRect(x + 3, y + 3, 250, 250);
    g.fillStyle = '#4b6e8c';
    g.beginPath();
    g.arc(x + 128, y + 128, 4, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = '#4a7396';
  g.lineWidth = 2;
  g.strokeRect(1, 1, 510, 510);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createDatacenterScene() {
  const world = createWorldShell(DC_SEED);
  const {root, scene} = world;
  world.key.color.set(0xffe4bb);
  world.key.intensity = 3;
  world.height = () => DECK;

  const concrete = metal(0x65716f, 0.95, 0);
  const paint = metal(0xb5b6ae, 0.78, 0.12);
  const trim = metal(0x596970, 0.55, 0.55);
  const roofMetal = metal(0x35464d, 0.68, 0.3);
  const rackStd = metal(0x1a2636, 0.6, 0.35);
  const rackAI = new THREE.MeshStandardMaterial({color: 0x17324f, roughness: 0.55, metalness: 0.4, emissive: 0x000000});
  const cduMetal = metal(0x233b58, 0.4, 0.6);
  const warm = new THREE.MeshBasicMaterial({color: 0xffc982, toneMapped: false});
  const cyan = new THREE.MeshBasicMaterial({color: 0x40d9ff, toneMapped: false});
  const orange = new THREE.MeshBasicMaterial({color: 0xff7a3d, toneMapped: false});
  const ledStd = [];
  const ledAI = [];
  const updates = world.updates;

  // Substation: the energy world's own yard, unchanged, on the same datum.
  buildElectrical(world);

  // Two-step concrete pad. The base is wider so the whole pad reads as a built platform on the plinth.
  const padZ = -0.4;
  const pad = makeBatch(root, 'dc-pad');
  const padBox = (x, y0, z, w, h, d, m) => pad.box(x, y0 + h / 2, z, w, h, d, m);
  padBox(0, 0, padZ, 19.6, DECK * 0.5, 15.0, concrete);
  padBox(0, DECK * 0.5, padZ, 18.8, DECK * 0.5, 14.0, concrete);
  pad.finish();
  const deckTexture = tileTexture();
  deckTexture.repeat.set(16, 12);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(18.8, 14), new THREE.MeshStandardMaterial({map: deckTexture, roughness: 0.78, metalness: 0.18}));
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, DECK + 0.004, padZ);
  deck.receiveShadow = true;
  root.add(deck);

  // Hall: solid back and sides, open front so the racks show, as in the mining workshop.
  const shell = makeBatch(root, 'dc-hall');
  const boxAt = (x, y0, z, w, h, d, m) => shell.box(x, y0 + h / 2, z, w, h, d, m);
  const HALL = {x0: -7.6, x1: 1.4, z0: -4.2, z1: 3.4, wall: 3.2};
  const hallX = (HALL.x0 + HALL.x1) / 2, hallZ = (HALL.z0 + HALL.z1) / 2;
  boxAt(hallX, DECK, HALL.z0 + 0.15, HALL.x1 - HALL.x0, HALL.wall, 0.3, paint);
  boxAt(HALL.x0 + 0.15, DECK, hallZ, 0.3, HALL.wall, HALL.z1 - HALL.z0, paint);
  boxAt(HALL.x1 - 0.15, DECK, hallZ, 0.3, HALL.wall, HALL.z1 - HALL.z0, paint);
  boxAt(hallX, DECK + HALL.wall, hallZ, HALL.x1 - HALL.x0 + 0.7, 0.25, HALL.z1 - HALL.z0 + 0.5, roofMetal);
  for (const x of [HALL.x0 + 0.15, HALL.x1 - 0.15]) boxAt(x, DECK, HALL.z1 - 0.15, 0.3, HALL.wall, 0.3, trim);
  boxAt(hallX, DECK + HALL.wall - 0.25, HALL.z1 - 0.15, HALL.x1 - HALL.x0, 0.2, 0.2, trim);
  // Lit side windows and ceiling strips (bloom picks these up).
  for (const z of [-3.4, -0.8, 2.0]) {
    boxAt(HALL.x0 + 0.02, DECK + 1.3, z, 0.02, 0.9, 0.9, warm);
    boxAt(HALL.x1 - 0.02, DECK + 1.3, z, 0.02, 0.9, 0.9, warm);
  }
  for (const z of [-1.6, 1.1]) boxAt(hallX, DECK + HALL.wall - 0.22, z, HALL.x1 - HALL.x0 - 0.8, 0.05, 0.12, warm);
  shell.finish();

  // Racks. Standard enterprise row at the back, AI row in front (~250 kW each in the infographic's range).
  const racks = makeBatch(root, 'dc-racks');
  const aiRacks = makeBatch(root, 'dc-ai-racks');
  const AI_Z = 0.2, STD_Z = -2.6;
  const aiPositions = [-6.5, -5.0, -3.5, -2.0, -0.5, 1.0].map(x => x - 0.5);
  const stdPositions = [-6.4, -5.0, -3.6, -2.2, -0.8];
  const aiDepth = 1.25, stdDepth = 1.0;
  for (const x of stdPositions) {
    racks.box(x, DECK + 1.1, STD_Z, 0.7, 2.2, stdDepth, rackStd);
  }
  for (const x of aiPositions) {
    aiRacks.box(x, DECK + 1.25, AI_Z, 0.9, 2.5, aiDepth, rackAI);
  }
  racks.finish();
  aiRacks.finish();
  // LED strips on each door: a steady pulse per rack, cool blue for liquid, hot orange for air-only.
  stdPositions.forEach((x, i) => {
    const mat = new THREE.MeshBasicMaterial({color: 0x4cff9a, toneMapped: false});
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.7, 0.02), mat);
    strip.position.set(x + 0.2, DECK + 1.1, STD_Z + stdDepth / 2 + 0.01);
    root.add(strip);
    ledStd.push({mat, phase: i * 1.37});
  });
  aiPositions.forEach((x, i) => {
    const mat = new THREE.MeshBasicMaterial({color: 0x7fe9ff, toneMapped: false});
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.0, 0.02), mat);
    strip.position.set(x + 0.28, DECK + 1.25, AI_Z + aiDepth / 2 + 0.01);
    root.add(strip);
    ledAI.push({mat, phase: 6 * 1.37 + i * 1.37});
  });

  // Liquid loop: CDU at the back right, supply and return manifolds in the cold aisle, dry coolers outside.
  const liquid = new THREE.Group();
  liquid.name = 'liquid-loop';
  root.add(liquid);
  const cdu = makeBatch(liquid, 'dc-cdu');
  cdu.box(0.5, DECK + 0.8, -3.4, 0.9, 1.6, 0.9, cduMetal);
  cdu.finish();
  const flowMats = [];
  function pipeFlow(group, points, radius, phase) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
    const mat = createFlowMaterial({phase, speed: 0.09});
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 20, radius, 10, false), mat);
    group.add(mesh);
    flowMats.push(mat);
    return mesh;
  }
  const supplyY = DECK + 1.05, returnY = DECK + 0.78, manifoldZ = 1.2;
  pipeFlow(liquid, [[-7.0, supplyY, manifoldZ], [0.2, supplyY, manifoldZ]], 0.05, 0.0);
  pipeFlow(liquid, [[0.2, returnY, manifoldZ], [-7.0, returnY, manifoldZ]], 0.05, 0.5);
  for (const x of aiPositions) {
    const branch = (a, b, y) => {
      const curve = new THREE.LineCurve3(new THREE.Vector3(a, y, manifoldZ), new THREE.Vector3(b, y, AI_Z + aiDepth / 2 + 0.05));
      liquid.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.03, 6, false), cduMetal));
    };
    branch(x + 0.28, x + 0.28, supplyY);
    branch(x + 0.36, x + 0.36, returnY);
  }
  // Supply and return headers from the CDU to the dry coolers, passing through the back wall.
  // Supply runs out through the east wall to the dry coolers; return comes back to the CDU.
  const COOLERS = [{x: 3.0, z: -2.6}, {x: 3.0, z: 0.6}];
  pipeFlow(liquid, [[0.9, DECK + 1.5, -3.4], [2.4, DECK + 1.5, -3.4], [2.4, DECK + 1.5, -2.6], [2.05, DECK + 1.5, -2.6]], 0.06, 1.0);
  pipeFlow(liquid, [[2.05, DECK + 1.2, 0.6], [2.4, DECK + 1.2, 0.6], [2.4, DECK + 1.2, -2.0], [0.9, DECK + 1.2, -3.2]], 0.06, 1.5);

  // Dry coolers on the open east side, in view from the default camera, with fans that turn on the absolute scene time.
  const coolers = makeBatch(liquid, 'dc-dry-coolers');
  const fans = [];
  for (const {x, z} of COOLERS) {
    coolers.box(x, DECK + 0.65, z, 1.9, 1.3, 1.3, paint);
    coolers.box(x, DECK + 1.32, z, 2.0, 0.08, 1.4, trim);
  }
  coolers.finish();
  for (const {x, z} of COOLERS) {
    const fan = new THREE.Group();
    fan.position.set(x, DECK + 1.42, z);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 28), metal(0x1a2a36, 0.5, 0.3));
    fan.add(disc);
    for (let k = 0; k < 4; k++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.5), metal(0x9ed9f2, 0.4, 0.2));
      blade.position.z = 0.25;
      const arm = new THREE.Group();
      arm.rotation.y = (k * Math.PI) / 2;
      arm.add(blade);
      fan.add(arm);
    }
    liquid.add(fan);
    fans.push(fan);
  }

  // Heat-rejection basin in front of the hall (the energy world's shader, mode 3).
  const basinR = 1.2, basinX = -5.4, basinZ = 4.9;
  const basinWater = createWaterMaterial(3, scene.environment);
  const basin = new THREE.Mesh(new THREE.CircleGeometry(basinR, 64), basinWater);
  basin.rotation.x = -Math.PI / 2;
  basin.position.set(basinX, DECK + 0.14, basinZ);
  root.add(basin);
  const rim = new THREE.Mesh(new THREE.RingGeometry(basinR, basinR + 0.14, 64), concrete);
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(basinX, DECK + 0.16, basinZ);
  root.add(rim);
  const rimWall = new THREE.Mesh(new THREE.CylinderGeometry(basinR + 0.07, basinR + 0.07, 0.16, 64, 1, true), concrete);
  rimWall.position.set(basinX, DECK + 0.08, basinZ);
  root.add(rimWall);

  // Warm light inside the open hall, so the racks read from outside (the shell's key light only reaches the open front).
  const hallLight = new THREE.PointLight(0xffc982, 9, 9, 1.6);
  hallLight.position.set(-3.1, DECK + 2.4, 0.2);
  root.add(hallLight);

  // Air-only mode: a CRAH unit outside the cold aisle, shown only when the air path is selected.
  const air = new THREE.Group();
  air.name = 'air-cooling';
  root.add(air);
  const crah = makeBatch(air, 'dc-crah');
  crah.box(-8.7, DECK + 1.1, 1.6, 1.0, 2.2, 1.6, paint);
  crah.finish();
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.8), new THREE.MeshBasicMaterial({color: 0x2f8fd0, transparent: true, opacity: 0.4, depthWrite: false}));
  grille.position.set(-8.7 + 0.51, DECK + 1.2, 1.6);
  grille.rotation.y = Math.PI / 2;
  air.add(grille);

  // Power: an energy-world feed from the yard transformers, along the hall ceiling over the AI row.
  const powerGroup = new THREE.Group();
  powerGroup.name = 'power-feed';
  root.add(powerGroup);
  pipeFlow(powerGroup, [[6.2, 3.05, 0.38], [4.0, 3.9, 0.38], [1.2, DECK + 2.8, 0.2], [-3.0, DECK + 2.8, 0.2], [-7.0, DECK + 2.8, 0.2]], 0.06, 2.0);

  // Structural load marks: floor under the AI row, outlined per rack footprint, pulsing when selected.
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.9), new THREE.MeshBasicMaterial({color: 0xff8a5c, transparent: true, opacity: 0.14, depthWrite: false}));
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(-3.0, DECK + 0.01, AI_Z + aiDepth / 2 + 0.3);
  root.add(plate);

  // Shared animation: one clock drives flows, LEDs, fans and the basin, so speed-invariant playback is free.
  const focusMats = {plate: plate.material};
  updates.push((t) => {
    for (const mat of flowMats) mat.uniforms.uTime.value = t;
    basinWater.uniforms.uTime.value = t;
    for (const fan of fans) fan.rotation.y = -t * 2.6;
    for (const {mat, phase} of ledStd) mat.color.setRGB(0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.1 + phase)) * 0.4, 1, 0.6 + 0.4 * Math.sin(t * 1.1 + phase));
    for (const {mat, phase} of ledAI) mat.color.setRGB(0.2, 0.8 + 0.2 * Math.sin(t * 1.8 + phase), 1);
    focusMats.plate.opacity = 0.14 + 0.05 * Math.sin(t * 1.8);
  });

  // Mode switch: 'liquid' shows the loop and cool LEDs; 'air' shows the CRAH and hot AI racks.
  let heat = 0;
  function setCooling(mode) {
    liquid.visible = mode === 'liquid';
    air.visible = mode === 'air';
    for (const {mat} of ledAI) mat.color.set(mode === 'air' ? 0xff7a3d : 0x7fe9ff);
    world.coolingMode = mode;
    world.updateHeat?.();
  }
  setCooling('liquid');
  world.setCooling = setCooling;
  world.setHeat = (h) => {
    heat = h;
    rackAI.emissive.setRGB(0.45 * heat, 0.14 * heat, 0.03 * heat);
  };
  world.updateHeat = () => world.setHeat(world.coolingMode === 'air' ? 1 : 0);
  world.updateHeat();
  world.hotspots = DC_HOTSPOTS;
  return world;
}
