import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {makeBatch} from './builder-utils.js';
import {createActors} from './lab/exhibit-actors.js';
import {createProps} from './lab/exhibit-props.js';

// Neighbourhood Market: a warm, roof-off, fictional supermarket miniature for the retail AI Lab. Three places carry
// the exhibits (produce scales front-left, deli counter back-left, fresh-produce display right) and a back-office
// alcove holds the one store GPU cabinet. The front wall is cut away and the side walls step down toward the front
// so every place is visible from the opening camera. Fictional store, original products and people; not a real
// retailer's layout. Brief: docs/three-worlds/RETAIL-LAB-PLAN.md and AI-LAB-MASTER-PLAN.md (B6).
//
// FIXED LAYOUT (the retail exhibit markers anchor to these points, ~1.6 above them; keep them in step):
//   floor 18 x 12 centred on the origin, floor top y = 0.2, entrance at z = +6
//   produce scales (weighing station) x -5, z 3 · deli counter x -4.5, z -3.5 (glass faces +z)
//   produce display (three sloping crates) x 4.5, z 1.5 · stockroom door x 7.5, z 1.5
//   back office + STORE GPU cabinet x 6, z -4 · two short aisles around x 0, z -2..2 · checkout x 0, z 5
export const RETAIL_SEED = 231026;
export const FLOOR = 0.2;
export const RETAIL_PLACES = {
  scales: [-5, FLOOR, 3],
  deli: [-4.5, FLOOR, -3.5],
  display: [4.5, FLOOR, 1.5],
  stockroomDoor: [7.5, FLOOR, 1.5],
  backoffice: [6, FLOOR, -4],
  checkout: [0, FLOOR, 5],
};
const X0 = -9, X1 = 9, Z0 = -6, Z1 = 6, WALL_H = 2.6, LOW_H = 0.95;

// Views for the shared viewer (distance is about 36 / zoom on a desktop screen). Azimuth 0 looks from the open front.
const RETAIL_VIEWS_BASE = {
  hero: {yaw: 0, target: [0, 0.3, 0.6], zoom: 1.3, tilt: 0.78, azimuth: 0.3, fov: 38},
  scales: {yaw: 0, target: [-5.4, 1.0, 2.7], zoom: 5.0, tilt: 0.55, azimuth: -0.05, fov: 38},
  deli: {yaw: 0, target: [-4.4, 1.2, -3.7], zoom: 4.8, tilt: 0.62, azimuth: 0.22, fov: 38},
  display: {yaw: 0, target: [4.8, 0.95, 1.1], zoom: 4.2, tilt: 0.62, azimuth: -0.1, fov: 38},
  backoffice: {yaw: 0, target: [6.3, 1.0, -4.1], zoom: 4.2, tilt: 0.62, azimuth: -0.42, fov: 38},
};
export const RETAIL_VIEWS = Object.fromEntries(Object.entries(RETAIL_VIEWS_BASE).map(([id, v]) => [id, {...v, portraitZoom: id === 'hero' ? 1.15 : 1.25}]));

// Deterministic random so the shelves and fruit look the same on every load.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Warm cream vinyl tiles with soft grout and per-tile tone, as a repeating canvas texture (no image asset).
function floorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d'), r = rng(7);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const k = 206 + Math.round(r() * 12);
    g.fillStyle = `rgb(${k},${k - 10},${k - 26})`;
    g.fillRect(i * 128, j * 128, 128, 128);
    for (let s = 0; s < 14; s++) {
      g.fillStyle = r() > 0.5 ? 'rgba(120,100,70,0.05)' : 'rgba(255,255,255,0.06)';
      g.fillRect(i * 128 + r() * 118, j * 128 + r() * 118, 3 + r() * 9, 2 + r() * 6);
    }
  }
  g.strokeStyle = 'rgba(150,132,108,0.55)';
  g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// A soft warm room for reflections, replacing the industrial night-blue environment of the shell.
function warmEnvironment() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fff6e8'); grad.addColorStop(0.45, '#f1dfc4'); grad.addColorStop(0.6, '#8a7560'); grad.addColorStop(1, '#3a3028');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  g.fillStyle = 'rgba(255,248,235,0.55)';
  for (const x of [40, 160, 280, 400]) g.fillRect(x, 30, 70, 10);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Soft contact shadow: a rounded dark pool that fades at its edges, stretched under each fixture.
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 18, 64, 64, 64);
  grad.addColorStop(0, 'rgba(40,26,12,0.55)'); grad.addColorStop(0.6, 'rgba(40,26,12,0.3)'); grad.addColorStop(1, 'rgba(40,26,12,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// White wall tiles with grey grout, for the deli splashback.
function tileTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, 256, 64);
  g.strokeStyle = 'rgba(140,140,132,0.8)'; g.lineWidth = 2;
  for (let x = 0; x <= 256; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); }
  for (let y = 0; y <= 64; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// A slate menu board drawn as pictograms and chalk lines (no words, no prices).
function menuTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#1f2a26'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#b98a5a'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 122);
  const dots = ['#f0c75a', '#e59a9a', '#6aa84f', '#c98a3f'];
  for (let i = 0; i < 4; i++) {
    const y = 24 + i * 26;
    g.fillStyle = dots[i]; g.beginPath(); g.arc(28, y, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(240,236,228,0.85)';
    g.fillRect(46, y - 3, 110 + (i % 2) * 40, 6);
    g.fillRect(206, y - 3, 30, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createRetailScene() {
  const world = createWorldShell(RETAIL_SEED);
  const {root, scene} = world;
  world.height = () => FLOOR;
  world.stats.stage = 'retail';

  // ---------------------------------------------------------------- retail lighting preset: bright, soft, warm
  const oldEnv = scene.environment;
  scene.environment = warmEnvironment();
  scene.environmentIntensity = 0.38;
  world.extraTextures = world.extraTextures.filter(t => t !== oldEnv).concat(scene.environment);
  oldEnv.dispose();
  for (const light of scene.children) {
    if (light.isHemisphereLight) { light.color.set(0xfff1de); light.groundColor.set(0x5a4a3a); light.intensity = 0.58; }
    else if (light === world.key) { light.color.set(0xfff0da); light.intensity = 2.35; light.position.set(-7, 18, 11); }
    else if (light.isDirectionalLight && light.color.b > light.color.r) { light.color.set(0xffe6cc); light.intensity = 0.35; }
    else if (light.isDirectionalLight) { light.intensity = 0.55; }
  }

  // ---------------------------------------------------------------- materials (shared, so batches stay few)
  const M = (color, roughness = 0.75, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra});
  const glowM = (color, k = 0.9) => new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: k, roughness: 0.4});
  const mat = {
    skirt: M(0xb9ab96, 0.85), wall: M(0xe4d9c6, 0.92), wallBand: M(0x2f6b4f, 0.7), trim: M(0xb98a5a, 0.6),
    shelf: M(0xd9dad6, 0.45, 0.25), shelfBack: M(0xc9c9c2, 0.6, 0.1), rail: M(0x2f6b4f, 0.5),
    timber: M(0xb07a46, 0.8), timberDark: M(0x8a5a33, 0.85), crate: M(0xc08a52, 0.82),
    steel: M(0xc4ccd1, 0.32, 0.75), chrome: M(0xc9ced2, 0.34, 0.8), dark: M(0x262d33, 0.6, 0.3),
    counter: M(0xe2ddd2, 0.5), counterTop: M(0x9aa3a8, 0.35, 0.6), belt: M(0x1d1f22, 0.7), till: M(0x6b7178, 0.55, 0.2),
    glass: new THREE.MeshStandardMaterial({color: 0xd8eef2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.26, depthWrite: false}),
    red: M(0xd3392f, 0.55), green: M(0x3f8f5a, 0.55), mat: M(0x4a4440, 0.95), carpet: M(0x7d8590, 0.95),
    paintYellow: M(0xf2c14e, 0.6), cart: M(0x6a7278, 0.7, 0.2), screen: glowM(0x9fe3ff, 0.8), lamp: glowM(0xfff1d6, 1.2), ledGreen: glowM(0x58e3a0, 1.0),
  };
  const produce = {
    orange: M(0xf08a1c, 0.5), apple: M(0xc0262c, 0.42), greenApple: M(0x8cc04a, 0.45), lemon: M(0xf3d34a, 0.5),
    banana: M(0xf2cf3b, 0.55), tomato: M(0xd8382a, 0.38), avocado: M(0x3e5b2a, 0.7), potato: M(0xb48a5a, 0.9),
    broccoli: M(0x3f7a35, 0.9), capsicum: M(0xe23b2b, 0.35), lettuce: M(0x8fc65a, 0.85),
  };
  const goods = [0xc8452f, 0x3a6ea5, 0xe8b840, 0x5d9b4a, 0xf0ece4, 0xe07b2f, 0x7b4f9e, 0x2f8f8a, 0xb43d5c, 0x6b4a2f, 0xe9dcc4, 0xd7c9a8].map(c => M(c, 0.55));
  const deliFood = [M(0xe59a9a, 0.6), M(0xa8323c, 0.55), M(0xf0c75a, 0.6), M(0x6aa84f, 0.8), M(0x4d5a2a, 0.5), M(0xc98a3f, 0.6), M(0xf3e6c8, 0.7)];

  // Small transform helper: geometry built at the origin, then tilted and placed (for sloping crates and fruit).
  const place = (g, x, y, z, rx = 0, ry = 0, rz = 0) => g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1)));
  const fruitGeo = (kind, r) => {
    if (kind === 'banana') { const g = new THREE.TorusGeometry(r * 1.6, r * 0.32, 5, 8, 1.5); return g; }
    if (kind === 'broccoli' || kind === 'lettuce') return new THREE.IcosahedronGeometry(r * 1.15, 1);
    const g = new THREE.SphereGeometry(r, 8, 6);
    if (kind === 'lemon' || kind === 'avocado' || kind === 'potato') g.scale(1, 0.85, 1.25);
    return g;
  };
  const FRUIT_R = {orange: 0.07, apple: 0.065, greenApple: 0.065, lemon: 0.055, banana: 0.075, tomato: 0.055, avocado: 0.06, potato: 0.06, broccoli: 0.07, capsicum: 0.065, lettuce: 0.09};

  // ---------------------------------------------------------------- shell: slab, floor, walls, light strips
  const shell = makeBatch(root, 'retail-shell');
  shell.box(0, FLOOR / 2 - 0.05, 0, X1 - X0 + 0.3, FLOOR + 0.1, Z1 - Z0 + 0.3, mat.skirt);
  // Back wall, and side walls full height at the back, stepping down toward the open front.
  shell.box(0, FLOOR + WALL_H / 2, Z0 - 0.08, X1 - X0 + 0.3, WALL_H, 0.16, mat.wall);
  for (const x of [X0 - 0.08, X1 + 0.08]) {
    shell.box(x, FLOOR + WALL_H / 2, (Z0 + 0) / 2, 0.16, WALL_H, -Z0, mat.wall);
    shell.box(x, FLOOR + LOW_H / 2, Z1 / 2, 0.16, LOW_H, Z1, mat.wall);
    shell.box(x, FLOOR + LOW_H + 0.03, Z1 / 2, 0.22, 0.06, Z1, mat.trim);
    shell.box(x, FLOOR + WALL_H + 0.03, Z0 / 2, 0.22, 0.06, -Z0, mat.trim);
  }
  shell.box(0, FLOOR + WALL_H + 0.03, Z0 - 0.08, X1 - X0 + 0.36, 0.06, 0.22, mat.trim);
  // Store-colour band and warm light strips along the back and side walls.
  shell.box(0, FLOOR + 1.95, Z0 + 0.005, X1 - X0, 0.34, 0.02, mat.wallBand);
  shell.box(0, FLOOR + WALL_H - 0.12, Z0 + 0.02, X1 - X0 - 0.4, 0.05, 0.05, mat.lamp);
  for (const x of [X0 + 0.02, X1 - 0.02]) {
    shell.box(x, FLOOR + 1.95, Z0 / 2, 0.02, 0.34, -Z0, mat.wallBand);
    shell.box(x, FLOOR + WALL_H - 0.12, Z0 / 2, 0.05, 0.05, -Z0 - 0.4, mat.lamp);
  }
  // Skirting kick along the open front, and the entrance mat.
  shell.box(-2.2, FLOOR + 0.04, Z1 + 0.05, 13.6, 0.08, 0.1, mat.trim);
  shell.box(7.5, FLOOR + 0.04, Z1 + 0.05, 3.0, 0.08, 0.1, mat.trim);
  shell.box(3.6, FLOOR + 0.006, Z1 - 0.55, 1.9, 0.012, 1.0, mat.mat);
  for (const x of [2.55, 4.65]) {
    shell.cylinder(x, FLOOR + 0.55, Z1 - 0.12, 0.06, 0.07, 1.1, mat.chrome, 12);
    shell.box(x, FLOOR + 1.12, Z1 - 0.12, 0.16, 0.06, 0.16, mat.dark);
  }
  shell.finish();
  const floorTex = floorTexture();
  floorTex.repeat.set((X1 - X0) / 2.4, (Z1 - Z0) / 2.4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({map: floorTex, roughness: 0.55, metalness: 0}));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR + 0.002;
  floor.receiveShadow = true;
  floor.name = 'retail-floor';
  root.add(floor);
  const blobMat = new THREE.MeshBasicMaterial({map: blobTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
  world.extraTextures.push(blobMat.map);
  const blobs = makeBatch(root, 'retail-contact-shadow');
  const blob = (x, z, w, d) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(x, FLOOR + 0.004, z); blobs.geometry(g, blobMat); };

  // Kit shim so the shared exhibit props and actors build straight into this world (same three module, one root).
  const matCache = new Map();
  const kmat = (color, opts = {}) => {
    const key = color + JSON.stringify(opts);
    if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({color, roughness: 0.65, ...opts}));
    return matCache.get(key);
  };
  const kmesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; root.add(o); return o; };
  const kit = {THREE, root, mat: kmat, mesh: kmesh, box: (w, h, d, m, x, y, z) => kmesh(new THREE.BoxGeometry(w, h, d), m, x, y, z),
    steel: kmat(0x8899a3, {metalness: 0.75, roughness: 0.32}), dark: kmat(0x223540, {metalness: 0.6}), track: r => r};
  const props = createProps(kit);
  const sign = (text, w, h, x, y, z, ry = 0, colors = {bg: '#2f6b4f', fg: '#fff8ea'}) => props.plate(text, w, h, {...colors, x, y, z, ry});

  // ---------------------------------------------------------------- reusable store pieces
  const r = rng(RETAIL_SEED);
  // An open timber crate (slatted sides) of fruit, built level at the origin then tilted and placed.
  function crate(batch, {x, y, z, w = 0.8, d = 0.55, tilt = 0.32, ry = 0, kind = 'apple', fill = 1}) {
    const h = 0.16, parts = [];
    const add = (g, m) => parts.push([g, m]);
    add(new THREE.BoxGeometry(w, 0.025, d), mat.crate);
    for (const s of [-1, 1]) {
      add(place(new THREE.BoxGeometry(w, h, 0.025), 0, h / 2, s * d / 2), mat.crate);
      add(place(new THREE.BoxGeometry(0.025, h, d), s * w / 2, h / 2, 0), mat.crate);
      add(place(new THREE.BoxGeometry(w + 0.02, 0.03, 0.03), 0, h - 0.015, s * (d / 2 + 0.005)), mat.timberDark);
    }
    if (kind === 'banana') {
      // Bananas lie as bunches: four or five curved fingers fanned from one stem, two rows of bunches per crate.
      const bw = 0.28, bd = 0.26, nbx = Math.max(1, Math.floor((w - 0.04) / bw)), nbz = Math.max(1, Math.round(Math.floor((d - 0.04) / bd) * fill));
      for (let i = 0; i < nbx; i++) for (let j = 0; j < nbz; j++) {
        const cx = -w / 2 + 0.02 + bw * (i + 0.5) + (r() - 0.5) * 0.03, cz = d / 2 - 0.02 - bd * (j + 0.5), rot = Math.PI / 2 + (r() - 0.5) * 0.4 + (j % 2) * Math.PI;
        const fingers = 5 + Math.floor(r() * 2);
        for (let f = 0; f < fingers; f++) {
          // A hand of bananas seen from above: nested crescents side by side, the middle fingers riding higher.
          const off = f - (fingers - 1) / 2;
          const g = new THREE.TorusGeometry(0.12, 0.03, 6, 10, 1.4);
          g.rotateZ(-0.7);
          g.rotateX(Math.PI / 2);
          g.translate(-0.12 + off * 0.05, 0.045 + ((fingers - 1) / 2 - Math.abs(off)) * 0.018, 0);
          g.rotateY(rot);
          g.translate(cx, 0, cz);
          add(g, produce.banana);
        }
      }
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, ry, 0, 'YXZ')), new THREE.Vector3(1, 1, 1));
      for (const [g, mm] of parts) { g.applyMatrix4(m); batch.geometry(g, mm); }
      return;
    }
    const rad = FRUIT_R[kind], step = rad * 2.05, nx = Math.floor((w - 0.04) / step), nz = Math.floor((d - 0.04) / step);
    const rows = Math.max(1, Math.round(nz * fill));
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < nx - layer; i++) for (let j = 0; j < rows - layer; j++) {
      const fx = -w / 2 + 0.02 + step * (i + 0.5 + layer * 0.5) + (r() - 0.5) * rad * 0.3;
      const fz = d / 2 - 0.02 - step * (j + 0.5 + layer * 0.5) + (r() - 0.5) * rad * 0.3;
      const g = fruitGeo(kind, rad * (0.92 + r() * 0.16));
      place(g, fx, 0.02 + rad + layer * rad * 1.5, fz, kind === 'banana' ? Math.PI / 2 : r() * 3, r() * 6, 0);
      add(g, produce[kind]);
    }
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, ry, 0, 'YXZ')), new THREE.Vector3(1, 1, 1));
    for (const [g, mm] of parts) { g.applyMatrix4(m); batch.geometry(g, mm); }
  }
  // A shopping basket (plastic, wire handle). Returned geometry pieces go into a batch or a group.
  function basket(batch, x, y, z, ry = 0, colorMat = mat.red, withHandle = true) {
    const pieces = [[new THREE.BoxGeometry(0.42, 0.02, 0.28), colorMat]];
    for (const s of [-1, 1]) {
      pieces.push([place(new THREE.BoxGeometry(0.42, 0.2, 0.02), 0, 0.1, s * 0.14), colorMat]);
      pieces.push([place(new THREE.BoxGeometry(0.02, 0.2, 0.28), s * 0.21, 0.1, 0), colorMat]);
    }
    if (withHandle) pieces.push([place(new THREE.TorusGeometry(0.17, 0.008, 4, 12, Math.PI), 0, 0.2, 0), mat.dark]);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    for (const [g, mm] of pieces) { g.applyMatrix4(m); batch.geometry(g, mm); }
  }
  // A shopping trolley in wire (beams), nose toward local +z.
  function trolley(batch, x, z, ry = 0) {
    const c = Math.cos(ry), s = Math.sin(ry);
    const P = (lx, ly, lz) => [x + lx * c + lz * s, FLOOR + ly, z - lx * s + lz * c];
    const b = (a, bb, rad = 0.008) => batch.beam(P(...a), P(...bb), rad, mat.chrome, 4);
    const top = 0.92, bot = 0.5;
    const corners = [[-0.24, -0.38], [0.24, -0.38], [0.2, 0.36], [-0.2, 0.36]];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
      b([ax, top, az], [bx, top, bz]); b([ax * 0.92, bot, az * 0.95], [bx * 0.92, bot, bz * 0.95]);
      b([ax, top, az], [ax * 0.92, bot, az * 0.95]);
    }
    for (let k = 1; k < 5; k++) { const f = k / 5, zz = -0.38 + 0.74 * f, hw = 0.24 - 0.04 * f; b([-hw, top, zz], [-hw * 0.92, bot, zz * 0.95], 0.004); b([hw, top, zz], [hw * 0.92, bot, zz * 0.95], 0.004); }
    for (let k = 1; k < 4; k++) { const xx = -0.24 + 0.12 * k; b([xx, top, -0.38], [xx * 0.85, top, 0.36], 0.004); }
    for (const sx of [-1, 1]) { b([sx * 0.22, bot, -0.36], [sx * 0.2, 0.08, -0.4], 0.012); b([sx * 0.18, bot, 0.34], [sx * 0.18, 0.08, 0.36], 0.012); }
    b([-0.22, 0.08, -0.4], [-0.18, 0.08, 0.36], 0.012); b([0.22, 0.08, -0.4], [0.18, 0.08, 0.36], 0.012);
    batch.beam(P(-0.26, 1.0, -0.46), P(0.26, 1.0, -0.46), 0.018, mat.red, 8);
    for (const sx of [-1, 1]) b([sx * 0.24, top, -0.38], [sx * 0.25, 1.0, -0.46], 0.01);
    for (const [wx, wz] of [[-0.2, -0.4], [0.2, -0.4], [-0.17, 0.36], [0.17, 0.36]]) {
      const g = new THREE.CylinderGeometry(0.04, 0.04, 0.025, 10);
      g.rotateZ(Math.PI / 2); g.rotateY(ry);
      const p = P(wx, 0.04, wz); g.translate(p[0], p[1], p[2]);
      batch.geometry(g, mat.dark);
    }
  }

  // ---------------------------------------------------------------- aisles: three gondolas, two short aisles
  const aisles = makeBatch(root, 'retail-aisles');
  const GONDOLA_X = [-1.6, 0, 1.6], GZ0 = -2, GZ1 = 2, SHELF_Y = [0.12, 0.46, 0.8, 1.14, 1.48];
  for (const gx of GONDOLA_X) {
    aisles.box(gx, FLOOR + 0.06, 0, 0.72, 0.12, GZ1 - GZ0, mat.shelfBack);
    aisles.box(gx, FLOOR + 0.85, 0, 0.05, 1.7, GZ1 - GZ0, mat.shelfBack);
    for (const z of [GZ0, GZ1]) aisles.box(gx, FLOOR + 0.85, z, 0.08, 1.7, 0.05, mat.shelf);
    for (const side of [-1, 1]) for (const [li, ly] of SHELF_Y.entries()) {
      const sx = gx + side * 0.19;
      aisles.box(sx, FLOOR + ly, 0, 0.34, 0.025, GZ1 - GZ0 - 0.06, mat.shelf);
      aisles.box(gx + side * 0.36, FLOOR + ly + 0.018, 0, 0.012, 0.035, GZ1 - GZ0 - 0.06, mat.rail);
      if (li === SHELF_Y.length - 1) continue;
      // Facings: runs of one product, varied heights, so each shelf reads as goods rather than noise.
      let z = GZ0 + 0.08;
      while (z < GZ1 - 0.12) {
        const m = goods[Math.floor(r() * goods.length)], w = 0.1 + r() * 0.1, h = 0.12 + r() * 0.16, n = 2 + Math.floor(r() * 4);
        // Packets, not stripes: each facing varies a little in height and depth, and a few are sold through.
        for (let k = 0; k < n && z + w < GZ1 - 0.06; k++, z += w + 0.014) {
          if (r() < 0.09) continue;
          const hh = h * (0.92 + r() * 0.12), dd = 0.2 + r() * 0.07;
          aisles.box(sx + side * (0.04 - dd / 2 + 0.11), FLOOR + ly + 0.013 + hh / 2, z + w / 2, dd, hh, w * 0.94, m);
        }
        z += 0.03 + (r() < 0.15 ? 0.12 : 0);
      }
    }
    // End cap facing the front: a promotional stack of boxes on a low plinth.
    aisles.box(gx, FLOOR + 0.12, GZ1 + 0.22, 0.7, 0.24, 0.36, mat.trim);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) aisles.box(gx - 0.22 + j * 0.22 + i * 0.11, FLOOR + 0.33 + i * 0.18, GZ1 + 0.22, 0.2, 0.17, 0.28, goods[(gx + 3 + i) % goods.length | 0]);
  }
  aisles.finish();
  for (const [i, gx] of GONDOLA_X.entries()) sign(['PANTRY', 'SNACKS', 'DRINKS'][i], 0.68, 0.17, gx, FLOOR + 1.88, GZ1 + 0.03);

  // ---------------------------------------------------------------- produce scales: weighing station front-left
  const scalesGroup = new THREE.Group();
  scalesGroup.name = 'retail-produce-scales';
  root.add(scalesGroup);
  const sc = makeBatch(scalesGroup, 'retail-scales');
  const [SX, , SZ] = RETAIL_PLACES.scales;
  sc.box(SX, FLOOR + 0.42, SZ, 0.72, 0.84, 0.5, mat.counter);
  sc.box(SX, FLOOR + 0.86, SZ, 0.78, 0.04, 0.56, mat.counterTop);
  sc.box(SX - 0.08, FLOOR + 0.9, SZ + 0.04, 0.4, 0.04, 0.34, mat.chrome);
  sc.box(SX - 0.08, FLOOR + 0.93, SZ + 0.04, 0.36, 0.012, 0.3, mat.steel);
  // Terminal on a post at the back of the station, screen tilted toward the shopper (+z), and an overhead camera arm.
  sc.box(SX + 0.24, FLOOR + 1.1, SZ - 0.2, 0.05, 0.4, 0.05, mat.dark);
  const term = new THREE.BoxGeometry(0.3, 0.22, 0.04); place(term, SX + 0.24, FLOOR + 1.36, SZ - 0.16, -0.35); sc.geometry(term, mat.dark);
  const scr = new THREE.BoxGeometry(0.26, 0.18, 0.01); place(scr, SX + 0.24, FLOOR + 1.36 + 0.007, SZ - 0.137, -0.35); sc.geometry(scr, mat.screen);
  sc.box(SX - 0.3, FLOOR + 1.05, SZ - 0.24, 0.04, 1.7 - 0.84, 0.04, mat.dark);
  sc.box(SX - 0.3, FLOOR + 1.84, SZ - 0.04, 0.04, 0.04, 0.44, mat.dark);
  sc.box(SX - 0.3, FLOOR + 1.78, SZ + 0.14, 0.11, 0.09, 0.13, mat.dark);
  sc.cylinder(SX - 0.3, FLOOR + 1.72, SZ + 0.14, 0.035, 0.035, 0.04, mat.screen, 10);
  // Bag roll dispenser and a resting basket beside the station.
  sc.cylinder(SX + 0.5, FLOOR + 0.9, SZ, 0.06, 0.06, 0.24, mat.green, 12);
  basket(sc, SX + 0.62, FLOOR, SZ + 0.2, -0.3, mat.green, true);
  // Produce island behind the scales and a sloping wall bench along the left wall.
  sc.box(SX, FLOOR + 0.35, 1.2, 2.5, 0.7, 1.2, mat.timber);
  sc.box(SX, FLOOR + 0.71, 1.2, 2.6, 0.03, 1.3, mat.timberDark);
  const islandKinds = [['orange', 'apple', 'lemon'], ['greenApple', 'tomato', 'avocado']];
  for (const [row, dz] of [[0, 0.32], [1, -0.32]]) for (let i = 0; i < 3; i++) {
    crate(sc, {x: SX - 0.82 + i * 0.82, y: FLOOR + 0.78, z: 1.2 + dz, w: 0.76, d: 0.56, tilt: dz > 0 ? 0.22 : -0.22, kind: islandKinds[row][i]});
  }
  sc.box(-8.45, FLOOR + 0.4, 2.8, 0.9, 0.8, 4.6, mat.timber);
  const benchKinds = ['banana', 'potato', 'capsicum', 'broccoli', 'lettuce', 'orange'];
  for (let i = 0; i < 6; i++) crate(sc, {x: -8.4, y: FLOOR + 0.92, z: 0.85 + i * 0.78, w: 0.74, d: 0.7, tilt: 0.38, ry: Math.PI / 2, kind: benchKinds[i]});
  sc.box(-8.88, FLOOR + 1.25, 2.8, 0.06, 0.6, 4.6, mat.timberDark);
  sc.finish();
  sign('FRESH PRODUCE', 1.5, 0.3, -8.83, FLOOR + 1.7, 2.8, Math.PI / 2);
  sign('SCALES', 0.62, 0.16, SX + 0.24, FLOOR + 1.6, SZ - 0.2, 0, {bg: '#10161c', fg: '#d8f6ff'});
  sign('CAMERA', 0.5, 0.13, SX - 0.3, FLOOR + 1.98, SZ + 0.14, 0, {bg: '#10161c', fg: '#d8f6ff'});

  // ---------------------------------------------------------------- deli counter back-left, glass facing the shop
  const deliGroup = new THREE.Group();
  deliGroup.name = 'retail-deli-counter';
  root.add(deliGroup);
  const dl = makeBatch(deliGroup, 'retail-deli');
  const [DX, , DZ] = RETAIL_PLACES.deli, DW = 3.6;
  dl.box(DX, FLOOR + 0.42, DZ, DW, 0.84, 0.9, mat.counter);
  dl.box(DX, FLOOR + 0.42, DZ + 0.452, DW, 0.6, 0.01, mat.timber);
  dl.box(DX, FLOOR + 0.86, DZ - 0.05, DW, 0.04, 0.8, mat.counterTop);
  dl.box(DX, FLOOR + 1.36, DZ - 0.3, DW, 0.04, 0.34, mat.counterTop);
  for (const sx of [-1, 1]) dl.box(DX + sx * DW / 2, FLOOR + 1.1, DZ - 0.05, 0.03, 0.5, 0.8, mat.glass);
  const front = new THREE.BoxGeometry(DW, 0.56, 0.012); place(front, DX, FLOOR + 1.12, DZ + 0.25, -0.42); dl.geometry(front, mat.glass);
  dl.box(DX, FLOOR + 1.38, DZ + 0.02, DW, 0.012, 0.3, mat.glass);
  // Trays of food under the glass: mounded salads and dips, and trays of sliced rounds, each its own colour.
  for (let i = 0; i < 9; i++) {
    const tx = DX - DW / 2 + 0.22 + i * 0.4;
    dl.box(tx, FLOOR + 0.9, DZ, 0.36, 0.04, 0.5, mat.steel);
    const food = deliFood[i % deliFood.length];
    if (i % 3 === 1) {
      for (let k = 0; k < 10; k++) {
        const g = new THREE.CylinderGeometry(0.045, 0.045, 0.018, 12);
        place(g, tx - 0.11 + (k % 5) * 0.055, FLOOR + 0.935 + (k % 2) * 0.012, DZ - 0.1 + Math.floor(k / 5) * 0.2, 0.5, 0, 0);
        dl.geometry(g, food);
      }
    } else {
      for (let k = 0; k < 4; k++) {
        const g = new THREE.SphereGeometry(0.085, 10, 6);
        g.scale(1, 0.42 + r() * 0.12, 1.25);
        g.translate(tx - 0.07 + (k % 2) * 0.14 + (r() - 0.5) * 0.02, FLOOR + 0.925, DZ - 0.11 + Math.floor(k / 2) * 0.22);
        dl.geometry(g, food);
      }
    }
  }
  // Staff side: prep bench with a slicer and scale on the back wall, a wall shelf and a lit menu board.
  dl.box(DX, FLOOR + 0.45, Z0 + 0.38, DW + 0.4, 0.9, 0.6, mat.steel);
  dl.box(DX, FLOOR + 0.905, Z0 + 0.38, DW + 0.44, 0.03, 0.64, mat.counterTop);
  dl.box(DX - 0.9, FLOOR + 1.02, Z0 + 0.38, 0.36, 0.2, 0.3, mat.chrome);
  // Chopping board with a knife, and a stack of clean trays.
  dl.box(DX + 0.05, FLOOR + 0.93, Z0 + 0.42, 0.46, 0.025, 0.3, mat.timber);
  dl.box(DX + 0.1, FLOOR + 0.947, Z0 + 0.4, 0.2, 0.008, 0.03, mat.steel);
  for (let i = 0; i < 4; i++) dl.box(DX + 1.3, FLOOR + 0.93 + i * 0.025, Z0 + 0.4, 0.4, 0.02, 0.3, mat.steel);
  dl.cylinder(DX - 0.9, FLOOR + 1.1, Z0 + 0.5, 0.11, 0.11, 0.02, mat.steel, 16);
  dl.box(DX + 0.6, FLOOR + 0.96, Z0 + 0.38, 0.3, 0.1, 0.26, mat.counter);
  dl.box(DX, FLOOR + 1.45, Z0 + 0.12, DW, 0.03, 0.22, mat.steel);
  for (let i = 0; i < 8; i++) dl.cylinder(DX - 1.5 + i * 0.42, FLOOR + 1.53, Z0 + 0.12, 0.06, 0.06, 0.14, deliFood[(i + 2) % deliFood.length], 10);
  // Painted service area in front of the counter: where a waiting customer stands.
  const AZ = DZ + 1.25;
  for (const [x, z, w, d] of [[DX, AZ - 0.45, 2.8, 0.05], [DX, AZ + 0.45, 2.8, 0.05], [DX - 1.4, AZ, 0.05, 0.9], [DX + 1.4, AZ, 0.05, 0.9]]) dl.box(x, FLOOR + 0.006, z, w, 0.01, d, mat.paintYellow);
  // Deli camera on the back wall, looking over the counter at the service area.
  dl.box(DX + 1.6, FLOOR + 2.15, Z0 + 0.1, 0.06, 0.06, 0.2, mat.dark);
  const cam = new THREE.BoxGeometry(0.12, 0.1, 0.2); place(cam, DX + 1.6, FLOOR + 2.1, Z0 + 0.28, -0.35); dl.geometry(cam, mat.dark);
  // Ticket stand at the corner of the service area: where a customer starts waiting.
  dl.cylinder(DX + 1.55, FLOOR + 0.5, AZ - 0.35, 0.025, 0.025, 1.0, mat.chrome, 8);
  dl.cylinder(DX + 1.55, FLOOR + 0.015, AZ - 0.35, 0.16, 0.16, 0.03, mat.dark, 16);
  dl.box(DX + 1.55, FLOOR + 1.06, AZ - 0.35, 0.14, 0.14, 0.12, mat.red);
  dl.finish();
  // White tile splashback between the prep bench and the wall shelf, and two menu boards (pictograms, no words).
  const splash = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.4, 0.54, 0.012), new THREE.MeshStandardMaterial({map: tileTexture(), roughness: 0.35}));
  splash.position.set(DX, FLOOR + 1.18, Z0 + 0.008);
  splash.receiveShadow = true;
  splash.name = 'retail-deli-splashback';
  deliGroup.add(splash);
  const menuMat = new THREE.MeshStandardMaterial({map: menuTexture(), roughness: 0.8});
  for (const sx of [-1, 1]) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.03), menuMat);
    board.position.set(DX + sx * 1.3, FLOOR + 2.02, Z0 + 0.03);
    board.name = 'retail-deli-menu';
    deliGroup.add(board);
  }
  world.extraTextures.push(splash.material.map, menuMat.map);
  sign('DELI', 1.2, 0.34, DX, FLOOR + 1.95, Z0 + 0.03);
  sign('CAMERA', 0.5, 0.13, DX + 1.6, FLOOR + 2.34, Z0 + 0.04, 0, {bg: '#10161c', fg: '#d8f6ff'});

  // ---------------------------------------------------------------- fresh-produce display right, stockroom door
  const displayGroup = new THREE.Group();
  displayGroup.name = 'retail-produce-display';
  root.add(displayGroup);
  const dp = makeBatch(displayGroup, 'retail-display');
  const [PX, , PZ] = RETAIL_PLACES.display;
  dp.box(PX, FLOOR + 0.33, PZ - 0.1, 3.0, 0.66, 1.0, mat.timber);
  dp.box(PX, FLOOR + 0.95, PZ - 0.62, 3.0, 0.62, 0.12, mat.timberDark);
  // Three sloping crates facing the shop floor: apples, oranges, banana bunches.
  for (const [i, kind] of ['apple', 'orange', 'banana'].entries()) {
    crate(dp, {x: PX - 0.98 + i * 0.98, y: FLOOR + 0.78, z: PZ - 0.05, w: 0.9, d: 0.72, tilt: 0.34, kind});
  }
  // Overhead store camera on a slim stand behind the display.
  dp.box(PX + 1.2, FLOOR + 1.15, PZ - 0.74, 0.05, 1.9, 0.05, mat.dark);
  dp.box(PX + 0.9, FLOOR + 2.1, PZ - 0.5, 0.6, 0.04, 0.04, mat.dark);
  const dcam = new THREE.BoxGeometry(0.12, 0.1, 0.2); place(dcam, PX + 0.62, FLOOR + 2.04, PZ - 0.42, -0.6); dp.geometry(dcam, mat.dark);
  // Replenishment trolley: a flat stock cart loaded with crates, waiting by the stockroom door.
  dp.box(6.55, FLOOR + 0.2, 2.6, 0.7, 0.04, 1.1, mat.cart);
  for (const [wx, wz] of [[-0.28, -0.45], [0.28, -0.45], [-0.28, 0.45], [0.28, 0.45]]) dp.cylinder(6.55 + wx, FLOOR + 0.08, 2.6 + wz, 0.07, 0.07, 0.05, mat.dark, 10);
  dp.beam([6.25, FLOOR + 0.2, 3.13], [6.25, FLOOR + 0.95, 3.13], 0.015, mat.dark);
  dp.beam([6.85, FLOOR + 0.2, 3.13], [6.85, FLOOR + 0.95, 3.13], 0.015, mat.dark);
  dp.beam([6.25, FLOOR + 0.95, 3.13], [6.85, FLOOR + 0.95, 3.13], 0.015, mat.dark);
  for (let i = 0; i < 2; i++) crate(dp, {x: 6.55, y: FLOOR + 0.23 + i * 0.18, z: 2.32 + i * 0.05, w: 0.62, d: 0.48, tilt: 0, ry: Math.PI / 2, kind: 'banana'});
  crate(dp, {x: 6.55, y: FLOOR + 0.23, z: 2.86, w: 0.62, d: 0.4, tilt: 0, ry: Math.PI / 2, kind: 'banana'});
  // Stockroom partition (x 7.6) with a pair of swing doors centred on z 1.5, and stock pallets behind it.
  const SDX = 7.6, DOOR_Z = RETAIL_PLACES.stockroomDoor[2];
  dp.box(SDX, FLOOR + WALL_H / 2, (-2.5 + DOOR_Z - 0.65) / 2, 0.14, WALL_H, DOOR_Z - 0.65 + 2.5, mat.wall);
  dp.box(SDX, FLOOR + WALL_H / 2, (DOOR_Z + 0.65 + 4.4) / 2, 0.14, WALL_H, 4.4 - DOOR_Z - 0.65, mat.wall);
  dp.box(SDX, FLOOR + 2.35, DOOR_Z, 0.14, 0.5, 1.3, mat.wall);
  dp.box((SDX + X1) / 2, FLOOR + WALL_H / 2, 4.4, X1 - SDX + 0.14, WALL_H, 0.14, mat.wall);
  dp.box((SDX + X1) / 2, FLOOR + WALL_H + 0.03, 4.4, X1 - SDX + 0.2, 0.06, 0.22, mat.trim);
  for (const [z0, z1] of [[-2.5, DOOR_Z - 0.68], [DOOR_Z + 0.68, 4.4]]) dp.box(SDX - 0.075, FLOOR + 1.95, (z0 + z1) / 2, 0.012, 0.34, z1 - z0, mat.wallBand);
  dp.box(SDX, FLOOR + WALL_H + 0.03, 0.95, 0.22, 0.06, 6.9, mat.trim);
  for (const s of [-1, 1]) {
    const leaf = new THREE.BoxGeometry(0.04, 1.95, 0.6); place(leaf, SDX - 0.12 + 0.1 * (s > 0 ? 1 : 0), FLOOR + 1.0, DOOR_Z + s * 0.31, 0, s * 0.18);
    dp.geometry(leaf, mat.counterTop);
    const port = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16); port.rotateZ(Math.PI / 2); place(port, SDX - 0.13 + 0.1 * (s > 0 ? 1 : 0), FLOOR + 1.45, DOOR_Z + s * 0.31);
    dp.geometry(port, mat.dark);
  }
  dp.box(8.3, FLOOR + 0.07, 3.3, 1.1, 0.14, 1.1, mat.timber);
  for (let i = 0; i < 6; i++) dp.box(8.05 + (i % 2) * 0.5, FLOOR + 0.3 + Math.floor(i / 2) * 0.32, 3.3, 0.46, 0.3, 1.0, mat.crate);
  dp.box(8.3, FLOOR + 0.07, -0.4, 1.1, 0.14, 1.1, mat.timber);
  for (let i = 0; i < 4; i++) dp.box(8.05 + (i % 2) * 0.5, FLOOR + 0.3 + Math.floor(i / 2) * 0.32, -0.4, 0.46, 0.3, 1.0, goods[(i * 3) % goods.length]);
  dp.finish();
  sign('STOCKROOM', 0.9, 0.2, SDX - 0.08, FLOOR + 2.32, DOOR_Z, -Math.PI / 2);
  sign('FRUIT', 0.9, 0.22, PX, FLOOR + 1.44, PZ - 0.55);
  sign('CAMERA', 0.5, 0.13, PX + 1.2, FLOOR + 2.28, PZ - 0.7, 0, {bg: '#10161c', fg: '#d8f6ff'});

  // ---------------------------------------------------------------- back office alcove: the one store GPU
  const officeGroup = new THREE.Group();
  officeGroup.name = 'retail-backoffice';
  root.add(officeGroup);
  const of = makeBatch(officeGroup, 'retail-office');
  const [OX, , OZ] = RETAIL_PLACES.backoffice;
  // Office floor stays inside its walls: partition (x 4.6) on the left, stockroom wall line (x 7.6) and back wall.
  const OFZ = -2.75;
  of.box((4.66 + X1) / 2, FLOOR + 0.004, (Z0 + OFZ) / 2, X1 - 4.66, 0.008, OFZ - Z0, mat.carpet);
  of.box((4.66 + X1) / 2, FLOOR + 0.01, OFZ, X1 - 4.66, 0.012, 0.06, mat.trim);
  of.box(4.6, FLOOR + 0.6, (Z0 + OFZ) / 2, 0.12, 1.2, OFZ - Z0, mat.wall);
  of.box(4.6, FLOOR + 1.23, (Z0 + OFZ) / 2, 0.16, 0.05, OFZ - Z0, mat.trim);
  of.box(SDX, FLOOR + 0.6, -2.62, 0.12, 1.2, 0.24, mat.wall);
  // Desk with a monitor, and a wall-mounted network switch with a few lit ports.
  of.box(7.75, FLOOR + 0.74, -5.35, 1.6, 0.04, 0.7, mat.timber);
  for (const [lx, lz] of [[7.0, -5.65], [8.5, -5.65], [7.0, -5.05], [8.5, -5.05]]) of.box(lx, FLOOR + 0.37, lz, 0.04, 0.74, 0.04, mat.dark);
  of.box(7.75, FLOOR + 1.0, -5.55, 0.56, 0.34, 0.03, mat.dark);
  of.box(7.75, FLOOR + 1.0, -5.535, 0.52, 0.3, 0.005, mat.screen);
  of.box(7.75, FLOOR + 0.8, -5.55, 0.06, 0.12, 0.06, mat.dark);
  of.box(7.75, FLOOR + 0.77, -5.2, 0.4, 0.015, 0.14, mat.dark);
  // Network switch wall-mounted on the inside of the partition beside the cabinet, with a short trunk into it.
  const SWZ = OZ - 0.75;
  of.box(4.69, FLOOR + 0.95, SWZ, 0.06, 0.1, 0.5, mat.dark);
  for (let i = 0; i < 6; i++) of.box(4.725, FLOOR + 0.95, SWZ - 0.2 + i * 0.08, 0.005, 0.02, 0.03, mat.ledGreen);
  of.box(4.69, FLOOR + 0.47, SWZ + 0.12, 0.05, 0.86, 0.06, mat.trim);
  of.box((4.69 + OX) / 2, FLOOR + 0.025, SWZ + 0.12, OX - 4.69, 0.03, 0.08, mat.trim);
  of.box(OX, FLOOR + 0.025, (SWZ + 0.12 + OZ - 0.2) / 2, 0.08, 0.03, OZ - 0.2 - SWZ - 0.12, mat.trim);
  // Chair.
  of.box(7.6, FLOOR + 0.46, -4.75, 0.42, 0.06, 0.42, mat.dark);
  of.box(7.6, FLOOR + 0.75, -4.55, 0.42, 0.5, 0.05, mat.dark);
  of.cylinder(7.6, FLOOR + 0.23, -4.75, 0.03, 0.03, 0.44, mat.chrome, 8);
  of.finish();
  // The STORE GPU name sits on a header panel on the cabinet's own front face, not floating above it.
  const cabinet = props.siteCabinet(OX, OZ, {label: '', y: FLOOR, parent: officeGroup});
  const header = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.05), kit.dark);
  header.position.set(0, 1.23, 0.205);
  header.castShadow = true;
  cabinet.group.add(header);
  props.plate('STORE GPU', 0.52, 0.15, {parent: cabinet.group, x: 0, y: 1.23, z: 0.233, bg: '#0d2230', fg: '#d8f6ff'});
  sign('BACK OFFICE', 0.9, 0.2, 4.53, FLOOR + 0.9, -4.7, -Math.PI / 2, {bg: '#f2ece0', fg: '#2f6b4f'});

  // ---------------------------------------------------------------- checkout lane, entrance, trolleys, baskets
  const fr = makeBatch(root, 'retail-front');
  for (const [lx, open] of [[-0.55, true], [-2.75, false]]) {
    fr.box(lx, FLOOR + 0.45, 4.85, 0.7, 0.9, 1.7, mat.till);
    fr.box(lx + 0.355, FLOOR + 0.42, 4.85, 0.01, 0.6, 1.5, mat.timber);
    fr.box(lx, FLOOR + 0.91, 4.7, 0.6, 0.02, 1.3, mat.belt);
    fr.box(lx, FLOOR + 0.92, 5.6, 0.7, 0.04, 0.3, mat.counterTop);
    fr.box(lx - 0.2, FLOOR + 1.1, 5.25, 0.05, 0.36, 0.05, mat.dark);
    const s = new THREE.BoxGeometry(0.26, 0.18, 0.03); place(s, lx - 0.2, FLOOR + 1.32, 5.25, 0, Math.PI / 2 - 0.4); fr.geometry(s, open ? mat.screen : mat.dark);
    fr.cylinder(lx + 0.25, FLOOR + 1.3, 4.0, 0.025, 0.025, 0.8, mat.chrome, 8);
    fr.box(lx + 0.25, FLOOR + 1.75, 4.0, 0.16, 0.16, 0.04, open ? mat.ledGreen : mat.dark);
    for (let i = 0; i < 4; i++) fr.box(lx - 0.05 + (i % 2) * 0.18, FLOOR + 0.97, 4.3 + i * 0.22, 0.14, 0.1 + (i % 3) * 0.04, 0.12, goods[(i * 2 + 1) % goods.length]);
  }
  // Basket stack by the entrance, a trolley bay, a trolley in the aisle and one at the checkout.
  for (let i = 0; i < 5; i++) basket(fr, 2.2, FLOOR + i * 0.07, 5.2, 0, i % 2 ? mat.red : mat.green, i === 4);
  for (let i = 0; i < 3; i++) trolley(fr, 6.0 + i * 0.22, 5.25, Math.PI / 2);
  trolley(fr, 0.85, -0.6, Math.PI);
  trolley(fr, 0.3, 3.6, 0);
  fr.finish();
  sign('CHECKOUT', 0.6, 0.16, -0.3, FLOOR + 1.94, 4.0);
  sign('NEIGHBOURHOOD MARKET', 3.2, 0.36, 1.2, FLOOR + 1.95, Z0 + 0.03, 0, {bg: '#fff8ea', fg: '#2f6b4f'});

  // ---------------------------------------------------------------- contact shadows under the fixtures
  for (const gx of GONDOLA_X) blob(gx, 0.15, 1.2, 5.0);
  blob(SX, 1.2, 3.2, 1.9); blob(-8.4, 2.8, 1.4, 5.2); blob(SX, SZ, 1.2, 0.95);
  blob(DX, DZ, DW + 0.5, 1.4); blob(DX, Z0 + 0.45, DW + 0.8, 1.0);
  blob(PX, PZ - 0.2, 3.5, 1.6); blob(6.55, 2.6, 1.0, 1.4);
  for (const lx of [-0.55, -2.75]) blob(lx, 4.85, 1.1, 2.1);
  blob(OX, OZ, 0.9, 0.8); blob(7.75, -5.35, 1.9, 1.0); blob(8.3, 3.3, 1.4, 1.4); blob(8.3, -0.4, 1.4, 1.4);
  blobs.finish();
  for (const o of root.children) if (o.name.startsWith('retail-contact-shadow')) { o.castShadow = false; o.receiveShadow = false; o.renderOrder = -1; }

  // ---------------------------------------------------------------- a few purposeful people (shared actor rig)
  const actors = createActors(kit);
  // The shared rig is a site worker; shoppers and colleagues drop the hi-vis bands and helmet brim.
  function storePerson({shirt, pants, hair, apron, brim = false, name}) {
    const p = actors.person({vest: apron ?? shirt, shirt, pants, helmet: hair, name});
    p.group.traverse(o => {
      const prm = o.geometry?.parameters;
      if (!prm) return;
      if (o.geometry.type === 'BoxGeometry' && Math.abs(prm.height - 0.035) < 1e-6 && Math.abs(prm.width - 0.38) < 1e-6) o.visible = false;
      if (!brim && o.geometry.type === 'CylinderGeometry' && Math.abs(prm.radiusTop - 0.15) < 1e-6) o.visible = false;
    });
    p.group.position.y = FLOOR;
    const foot = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), blobMat);
    foot.rotation.x = -Math.PI / 2;
    foot.position.y = 0.004;
    foot.name = name + '-contact';
    p.group.add(foot);
    return p;
  }
  // 1) A shopper brings a basket to the scales, weighs, then walks to the checkout and back to the door.
  const shopper = storePerson({shirt: 0x5b7fb5, pants: 0x30343c, hair: 0x4a3222, name: 'retail-shopper-scales'});
  const carried = new THREE.Group();
  shopper.group.add(carried);
  const carriedBatch = makeBatch(carried, 'retail-shopper-basket');
  basket(carriedBatch, -0.3, 0.52, 0.06, Math.PI / 2, mat.red, true);
  for (let i = 0; i < 4; i++) { const g = fruitGeo(i % 2 ? 'orange' : 'apple', 0.05); place(g, -0.3 + (i % 2) * 0.06 - 0.03, 0.62, 0.06 - 0.1 + i * 0.06); carriedBatch.geometry(g, produce[i % 2 ? 'orange' : 'apple']); }
  carriedBatch.finish();
  // The shopper weighs from the front-left corner of the station so the plate stays in view of the camera and the visitor.
  const PATH_IN = [[3.4, FLOOR, 5.55], [2.6, FLOOR, 3.75], [-3.0, FLOOR, 3.75], [-5.75, FLOOR, 3.55]];
  const PATH_OUT = [[-5.75, FLOOR, 3.55], [-2.6, FLOOR, 4.0], [0.3, FLOOR, 3.85], [0.3, FLOOR, 5.55], [3.4, FLOOR, 5.55]];
  // 2) A deli colleague carries a tray along the prep bench.
  const deliHand = storePerson({shirt: 0xf3f1ea, pants: 0x2a2a30, hair: 0xf8f8f4, apron: 0x2f6b4f, brim: true, name: 'retail-colleague-deli'});
  const tray = new THREE.Group();
  deliHand.group.add(tray);
  const trayBatch = makeBatch(tray, 'retail-deli-tray');
  trayBatch.box(0, 1.08, 0.3, 0.5, 0.025, 0.34, mat.steel);
  for (let i = 0; i < 6; i++) trayBatch.box(-0.17 + (i % 3) * 0.17, 1.11, 0.22 + Math.floor(i / 3) * 0.16, 0.13, 0.04, 0.12, deliFood[(i + 1) % deliFood.length]);
  trayBatch.finish();
  const DELI_A = [DX - 1.4, FLOOR, Z0 + 1.15], DELI_B = [DX + 1.3, FLOOR, Z0 + 1.15];
  // 3) A colleague at the checkout, 4) a shopper browsing the middle aisle, 5) a colleague by the replenishment trolley.
  const cashier = storePerson({shirt: 0x2f6b4f, pants: 0x2a2a30, hair: 0x1d1a18, name: 'retail-colleague-checkout'});
  cashier.group.position.set(-1.22, FLOOR, 4.95);
  cashier.group.rotation.y = Math.PI / 2;
  cashier.pose({weight: 0, look: 0.25});
  const browser = storePerson({shirt: 0xc4724e, pants: 0x46506a, hair: 0x8a8a8a, name: 'retail-shopper-aisle'});
  browser.group.position.set(0.82, FLOOR, -1.3);
  browser.group.rotation.y = Math.PI / 2;
  const waiting = storePerson({shirt: 0x8c5a8f, pants: 0x3a3f4a, hair: 0x2b1d14, name: 'retail-shopper-deli'});
  waiting.group.position.set(DX + 0.35, FLOOR, DZ + 1.3);
  waiting.group.rotation.y = Math.PI - 0.45;
  const waitBasket = new THREE.Group();
  waiting.group.add(waitBasket);
  const wb = makeBatch(waitBasket, 'retail-shopper-deli-basket');
  basket(wb, -0.3, 0.52, 0.06, Math.PI / 2, mat.green, true);
  wb.finish();
  const stocker = storePerson({shirt: 0x2f6b4f, pants: 0x2a2a30, hair: 0xc9a46a, apron: 0x245640, name: 'retail-colleague-display'});
  stocker.group.position.set(6.0, FLOOR, 3.35);
  stocker.group.rotation.y = -2.4;
  stocker.pose({weight: 0, look: 0.45, lean: 0.12});

  // Deterministic loops: position at time t on a looping schedule of walk and hold legs.
  const SHOPPER_CYCLE = 27, DELI_CYCLE = 11;
  world.updates.push(t => {
    const s = ((t % SHOPPER_CYCLE) + SHOPPER_CYCLE) % SHOPPER_CYCLE;
    if (s < 8) { const m = actors.followPath(shopper.group, PATH_IN, 0, 8, s); shopper.pose({distance: m.distance, weight: m.weight}); }
    else if (s < 15) {
      shopper.group.position.set(...PATH_IN.at(-1)); shopper.group.rotation.y = 2.3;
      const u = (s - 8) / 7;
      shopper.pose({weight: 0, look: 0.45, point: u > 0.25 && u < 0.7 ? Math.sin((u - 0.25) / 0.45 * Math.PI) : 0});
    } else if (s < 24) { const m = actors.followPath(shopper.group, PATH_OUT, 15, 24, s); shopper.pose({distance: m.distance, weight: m.weight}); }
    else { shopper.group.position.set(...PATH_OUT.at(-1)); shopper.group.rotation.y = Math.PI * 0.6; shopper.pose({weight: 0, look: 0.2, turn: Math.sin(s * 1.3) * 0.25}); }
    const d = ((t % DELI_CYCLE) + DELI_CYCLE) % DELI_CYCLE;
    if (d < 3.5) { const m = actors.followPath(deliHand.group, [DELI_A, DELI_B], 0, 3.5, d); deliHand.pose({distance: m.distance, weight: m.weight * 0.8}); }
    else if (d < 5.5) { deliHand.group.position.set(...DELI_B); deliHand.group.rotation.y = Math.PI; deliHand.pose({weight: 0, look: 0.35}); }
    else if (d < 9) { const m = actors.followPath(deliHand.group, [DELI_B, DELI_A], 5.5, 9, d); deliHand.pose({distance: m.distance, weight: m.weight * 0.8}); }
    else { deliHand.group.position.set(...DELI_A); deliHand.group.rotation.y = Math.PI; deliHand.pose({weight: 0, look: 0.35}); }
    waiting.pose({weight: 0, look: 0.3 + 0.08 * Math.sin(t * 0.5), turn: 0.25 * Math.sin(t * 0.35)});
    browser.pose({weight: 0, look: 0.15 + 0.1 * Math.sin(t * 0.7), turn: 0.35 * Math.sin(t * 0.45)});
    cashier.pose({weight: 0, look: 0.25, turn: 0.2 * Math.sin(t * 0.6)});
    cabinet.update(t, false);
  });

  world.retail = {places: RETAIL_PLACES, views: Object.keys(RETAIL_VIEWS), people: ['retail-shopper-scales', 'retail-shopper-deli', 'retail-colleague-deli', 'retail-colleague-checkout', 'retail-shopper-aisle', 'retail-colleague-display']};
  return world;
}

// Generic names the shared viewer loads every extra world by.
export {createRetailScene as createWorld, RETAIL_SEED as WORLD_SEED, RETAIL_VIEWS as WORLD_VIEWS};
