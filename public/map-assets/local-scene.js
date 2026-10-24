import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {buildLaptop, buildDesk, seatedPerson, deskOn} from './lab/rigs/laptop.js';

// Local AI on your laptop: the fifth AI Lab world (id `local`). A warm, daylit desk diorama on the standard plinth
// with a premium 15-inch laptop (the look of the Surface Laptop Ultra, Nightfall finish) as the hero, a Data#3
// notebook, a coffee, a phone face down, a plant, a window, and a person seated at the desk typing. Come close and the
// keyboard deck fades to glass (the NEXTDC fade-on-approach pattern) to show the board: CPU and GPU on one package,
// memory, a separate NPU, the SSD, battery and fans. The board is artistic licence, said so in Explain more.
// Plan: docs/three-worlds/LOCAL-LAB-PLAN.md. Shared rig (also used by the three exhibit kits): lab/rigs/laptop.js.
//
// FIXED LAYOUT (the lab markers in lab/recipes/local.*.js anchor to these; keep them in step):
//   the room is built in metres and scaled 10x; room origin at world (0, FLOOR, -1), floor top y = FLOOR = 0.2
//   desk 1.5 x 0.75 m, centre at room z -0.15, top at 0.74 m (world y 7.6); laptop centre at room (0, 0.74, -0.01)
//   chips (world, top of die): CPU (-0.27, 7.65, -1.70) · GPU (0.08, 7.65, -1.70) · NPU (0.60, 7.65, -1.56)
//   deck top world y 7.73 (world.height(), so the lab ring sits on the keyboard)
//   marker anchors stagger in height (CPU 8.0, GPU 9.3, NPU 10.6): the hero shows the whole desk and person, so the
//   three labels sit close in x on screen and need ~1.3 units of height between them to clear the 52 px overlap rule
export const LOCAL_SEED = 241026;
export const FLOOR = 0.2;
export const S = 10;
const ROOM_Z = -1;

// Views (distance is about 36 / zoom on a desktop screen). Azimuth 0 looks from the front (+z), the user's side.
// Close views judge the cutaway by visible span: about 4.5 units across opens the deck, 6 or more keeps it closed.
const LOCAL_VIEWS_BASE = {
  hero: {yaw: 0, target: [0.1, 9.3, -0.3], zoom: 1.3, tilt: 0.5, azimuth: -1.2, fov: 24},
  cpu: {yaw: 0, target: [-0.22, 7.75, -1.62], zoom: 11, tilt: 0.95, azimuth: 0.15, fov: 38},
  gpu: {yaw: 0, target: [0.1, 7.75, -1.62], zoom: 11, tilt: 0.95, azimuth: 0.2, fov: 38},
  npu: {yaw: 0, target: [0.56, 7.75, -1.48], zoom: 11, tilt: 0.95, azimuth: 0.3, fov: 38},
};
export const LOCAL_VIEWS = Object.fromEntries(Object.entries(LOCAL_VIEWS_BASE).map(([id, v]) => [id, {...v, portraitZoom: id === 'hero' ? 1.6 : 1.55}]));

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

// Warm oak floorboards as a canvas texture.
function floorTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const g = c.getContext('2d'), r = rng(11);
  const rows = 8, h = c.height / rows;
  for (let j = 0; j < rows; j++) {
    let x = -r() * 300;
    while (x < c.width) {
      const w = 260 + r() * 260, k = 150 + Math.round(r() * 30);
      g.fillStyle = `rgb(${k + 40},${k},${k - 45})`;
      g.fillRect(x, j * h, w, h);
      for (let s = 0; s < 18; s++) {
        g.strokeStyle = `rgba(${r() > 0.5 ? '110,70,35' : '235,200,150'},${0.05 + r() * 0.08})`;
        g.lineWidth = 1 + r() * 2;
        const y = j * h + r() * h;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + (r() - 0.5) * 6); g.stroke();
      }
      g.fillStyle = 'rgba(70,40,20,.45)';
      g.fillRect(x, j * h, 2, h);
      x += w;
    }
    g.fillStyle = 'rgba(70,40,20,.5)';
    g.fillRect(0, j * h, c.width, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function warmEnvironment() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fff7ea'); grad.addColorStop(0.42, '#f3e2c8'); grad.addColorStop(0.6, '#8d7864'); grad.addColorStop(1, '#3b3129');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  g.fillStyle = 'rgba(255,250,238,0.9)';
  g.fillRect(180, 40, 150, 70);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 14, 64, 64, 64);
  grad.addColorStop(0, 'rgba(40,26,12,0.55)'); grad.addColorStop(0.6, 'rgba(40,26,12,0.28)'); grad.addColorStop(1, 'rgba(40,26,12,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// The world's own screen content: a writing app with a document in progress over the desktop.
function paintWorkScreen(desktop) {
  return (g, w, h) => {
    desktop(g, w, h);
    const x = w * 0.14, y = h * 0.08, ww = w * 0.62, wh = h * 0.78;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 8, y + 10, ww, wh);
    g.fillStyle = '#f7f8fa'; g.fillRect(x, y, ww, wh);
    g.fillStyle = '#e6ebf2'; g.fillRect(x, y, ww, h * 0.055);
    for (const [i, c] of [[0, '#ff6b5e'], [1, '#ffbd44'], [2, '#3fcf5d']]) { g.fillStyle = c; g.beginPath(); g.arc(x + ww - 70 + i * 22, y + h * 0.0275, 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#2b5797'; g.font = `700 ${h * 0.04}px "Segoe UI",Arial,sans-serif`; g.textBaseline = 'top';
    g.fillText('Quarterly review: notes', x + ww * 0.07, y + h * 0.1);
    g.fillStyle = '#9aa6b5';
    const r = rng(5);
    for (let i = 0; i < 11; i++) g.fillRect(x + ww * 0.07, y + h * 0.18 + i * h * 0.048, ww * (0.55 + r() * 0.33), h * 0.014);
    g.fillStyle = '#2b5797'; g.fillRect(x + ww * 0.07 + ww * 0.42, y + h * 0.18 + 10 * h * 0.048 - 4, 3, h * 0.03);
  };
}

export function createLocalScene() {
  const world = createWorldShell(LOCAL_SEED);
  const {root, scene} = world;
  world.stats.stage = 'local';

  // ---------------------------------------------------------------- warm daylit lighting (retail-like, not night blue)
  const oldEnv = scene.environment;
  scene.environment = warmEnvironment();
  scene.environmentIntensity = 0.5;
  world.extraTextures = world.extraTextures.filter(t => t !== oldEnv).concat(scene.environment);
  oldEnv.dispose();
  for (const light of scene.children) {
    if (light.isHemisphereLight) { light.color.set(0xfff1de); light.groundColor.set(0x6a5442); light.intensity = 0.6; }
    else if (light === world.key) { light.color.set(0xfff0da); light.intensity = 2.0; light.position.set(-8, 19, 12); }
    else if (light.isDirectionalLight && light.color.b > light.color.r) { light.color.set(0xffe2bd); light.intensity = 0.9; light.position.set(-3, 12, -14); }
    else if (light.isDirectionalLight) { light.intensity = 0.6; }
  }
  // Daylight through the window: a soft warm fill from behind-left that rims the lid and the person.
  const sun = new THREE.DirectionalLight(0xffe7c2, 0.8);
  sun.position.set(-6, 14, -12);
  scene.add(sun);
  // A small front fill so the screen side and the keyboard never fall into shadow.
  const fill = new THREE.DirectionalLight(0xfff5e8, 0.35);
  fill.position.set(6, 8, 14);
  scene.add(fill);

  // ---------------------------------------------------------------- kit shim (the rig builds straight into the world)
  const room = new THREE.Group();
  room.name = 'local-room';
  room.position.set(0, FLOOR, ROOM_Z);
  room.scale.setScalar(S);
  root.add(room);
  const kmat = (color, opts = {}) => new THREE.MeshStandardMaterial({color, roughness: 0.65, ...opts});
  const kmesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; room.add(o); return o; };
  const track = r => { if (r?.isTexture) world.extraTextures.push(r); return r; };
  const k = {THREE, root: room, mat: kmat, mesh: kmesh, track,
    box: (w, h, d, m, x, y, z) => kmesh(new THREE.BoxGeometry(w, h, d), m, x, y, z),
    cylinder: (r, len, m, x, y, z) => kmesh(new THREE.CylinderGeometry(r, r, len, 16), m, x, y, z)};

  // ---------------------------------------------------------------- floor, rug, back wall with the window
  const RW = 2.0, RD = 1.5;
  const slabM = kmat(0x6b4e36, {roughness: 0.8});
  k.box(RW + 0.02, FLOOR / S, RD + 0.02, slabM, 0, -FLOOR / S / 2 - 0.001, 0).name = 'local-slab';
  const floorTex = floorTexture();
  floorTex.repeat.set(2, 1.5);
  world.extraTextures.push(floorTex);
  const floor = kmesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({map: floorTex, roughness: 0.48, metalness: 0}));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.0005; floor.castShadow = false; floor.name = 'local-floor';
  const rugTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#c9b79a'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#a38f72'; g.lineWidth = 10; g.strokeRect(14, 14, 228, 228);
    g.strokeStyle = 'rgba(120,96,70,.35)'; g.lineWidth = 2; for (let i = 30; i < 230; i += 10) { g.beginPath(); g.moveTo(30, i); g.lineTo(226, i); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; world.extraTextures.push(t); return t;
  })();
  const rug = kmesh(new THREE.BoxGeometry(1.3, 0.006, 0.8), kmat(0xffffff, {map: rugTex, roughness: 1}), 0, 0.003, 0.35);
  rug.castShadow = false; rug.name = 'local-rug';
  // A side wall on the right with a framed print; it gives way when the camera swings past it.
  const sideWall = new THREE.Group(); sideWall.name = 'local-side-wall'; room.add(sideWall);
  {
    const wallM = kmat(0xeee4d4, {roughness: 0.95});
    sideWall.add(kmesh(new THREE.BoxGeometry(0.06, 1.65, RD), wallM, RW / 2 + 0.03, 0.825, 0));
    sideWall.add(kmesh(new THREE.BoxGeometry(0.03, 0.06, RD), kmat(0xf6f0e4, {roughness: 0.7}), RW / 2 - 0.015, 0.03, 0));
    const art = document.createElement('canvas'); art.width = 256; art.height = 320; const g = art.getContext('2d');
    g.fillStyle = '#f4ede1'; g.fillRect(0, 0, 256, 320);
    for (const [y, c] of [[90, '#d98a5f'], [160, '#e9b866'], [230, '#6d9c86']]) { g.fillStyle = c; g.beginPath(); g.ellipse(128, y, 90, 34, 0, 0, Math.PI * 2); g.fill(); }
    const at = new THREE.CanvasTexture(art); at.colorSpace = THREE.SRGBColorSpace; world.extraTextures.push(at);
    const frame = kmesh(new THREE.BoxGeometry(0.02, 0.5, 0.4), kmat(0x2b2622, {roughness: 0.5}), RW / 2 - 0.01, 1.15, -0.1); sideWall.add(frame);
    const print = kmesh(new THREE.PlaneGeometry(0.34, 0.44), kmat(0xffffff, {map: at, roughness: 0.8}), RW / 2 - 0.021, 1.15, -0.1); print.rotation.y = -Math.PI / 2; sideWall.add(print);
  }
  // Skirting along the back.
  k.box(RW, 0.06, 0.02, kmat(0xf6f0e4, {roughness: 0.7}), 0, 0.03, -RD / 2 + 0.03);

  // ---------------------------------------------------------------- the desk, the laptop, the person
  const desk = buildDesk(k, {parent: room, z: -0.15, window: {offset: 0.17, width: RW, height: 1.65}});
  const laptop = buildLaptop(k, {parent: room, x: desk.spots.laptop[0], y: desk.top, z: -0.15 + desk.spots.laptop[1], finish: 'nightfall'});
  laptop.screen.draw(paintWorkScreen(laptop.screen.desktop));
  const keyboard = deskOn(desk, laptop, 'keyboard'), screenPoint = deskOn(desk, laptop, 'screen'), touchpad = deskOn(desk, laptop, 'touchpad');
  const sitter = seatedPerson(k, {parent: room, x: 0, z: 0.42, ry: Math.PI, keyboard, screen: screenPoint, touchpad, shirt: 0x4a6a92, jacket: 0x3e5d86, pants: 0x2e323b, hair: 0x4a3324, name: 'local-person'});

  // A floor plant in the back-right corner and a small side cabinet with a lamp, for warmth.
  const plant = new THREE.Group(); plant.name = 'local-floor-plant'; plant.position.set(0.82, 0, -0.55); room.add(plant);
  {
    const pot = kmesh(new THREE.CylinderGeometry(0.12, 0.09, 0.3, 24), kmat(0xd6c6ae, {roughness: 0.85}), 0, 0.15, 0); plant.add(pot);
    const soil = kmesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 24), kmat(0x3a2a1e, {roughness: 1}), 0, 0.295, 0); plant.add(soil);
    const leafA = kmat(0x4a8a3c, {roughness: 0.7}), leafB = kmat(0x6aa64f, {roughness: 0.7}), stem = kmat(0x5a4630, {roughness: 0.9});
    const r = rng(3);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39, h = 0.55 + r() * 0.55;
      const s = kmesh(new THREE.CylinderGeometry(0.006, 0.008, h, 6), stem, Math.cos(a) * 0.04, 0.3 + h / 2, Math.sin(a) * 0.04); s.rotation.set(Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25); plant.add(s);
      const l = kmesh(new THREE.SphereGeometry(0.09, 12, 8), i % 2 ? leafA : leafB, Math.cos(a) * (0.08 + r() * 0.08), 0.3 + h, Math.sin(a) * (0.08 + r() * 0.08));
      l.scale.set(1.1, 0.12, 0.38); l.rotation.set(0, -a, -0.35 - 0.2 * r()); plant.add(l);
    }
  }
  const side = new THREE.Group(); side.name = 'local-side-cabinet'; side.position.set(-0.86, 0, -0.5); room.add(side);
  {
    const oak = kmat(0xa8774a, {roughness: 0.6}), white = kmat(0xf3eee6, {roughness: 0.55});
    side.add(kmesh(new THREE.BoxGeometry(0.26, 0.55, 0.36), white, 0, 0.275, 0));
    side.add(kmesh(new THREE.BoxGeometry(0.28, 0.025, 0.38), oak, 0, 0.5625, 0));
    for (const y of [0.16, 0.38]) side.add(kmesh(new THREE.BoxGeometry(0.004, 0.18, 0.3), kmat(0xd9d2c6), 0.131, y, 0));
    const books = [0x2f6b4f, 0xc8452f, 0x3a6ea5, 0xe8b840];
    books.forEach((c, i) => { const b = kmesh(new THREE.BoxGeometry(0.03, 0.2 - i * 0.012, 0.15), kmat(c, {roughness: 0.7}), -0.08 + i * 0.035, 0.575 + (0.2 - i * 0.012) / 2, 0.05); side.add(b); });
    const lampM = kmat(0xfff1d6, {emissive: 0xffd9a0, emissiveIntensity: 0.9, roughness: 0.5});
    side.add(kmesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), kmat(0x2a2a2c, {metalness: 0.6, roughness: 0.4}), 0.06, 0.725, -0.06));
    side.add(kmesh(new THREE.CylinderGeometry(0.05, 0.08, 0.1, 20, 1, true), lampM, 0.06, 0.9, -0.06));
  }

  // Soft contact shadows under the desk, chair and cabinet.
  const blobMat = new THREE.MeshBasicMaterial({map: blobTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
  world.extraTextures.push(blobMat.map);
  for (const [x, z, w, d] of [[0, -0.15, 1.7, 0.95], [0, 0.42, 0.75, 0.75], [-0.86, -0.5, 0.45, 0.5], [0.82, -0.55, 0.4, 0.4]]) {
    const b = kmesh(new THREE.PlaneGeometry(w, d), blobMat, x, 0.0015, z); b.rotation.x = -Math.PI / 2; b.castShadow = b.receiveShadow = false; b.renderOrder = -1;
  }
  // The laptop's own soft shadow on the desk (the chassis is thin, so a contact pool sells that it sits there).
  {
    const b = kmesh(new THREE.PlaneGeometry(0.38, 0.28), blobMat, 0, desk.top + 0.0008, -0.01); b.rotation.x = -Math.PI / 2; b.castShadow = b.receiveShadow = false;
  }

  // ---------------------------------------------------------------- behaviour: idle typing, fade-on-approach
  world.height = () => FLOOR + (desk.top + laptop.size.H) * S;
  const center = new THREE.Vector3(), boardLocal = new THREE.Vector3(0, laptop.size.H, -0.05);
  let cut = 0;
  const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  world.onCamera = camera => {
    center.copy(boardLocal);
    laptop.group.localToWorld(center);
    // Judge closeness by the larger visible span at the laptop (NEXTDC pattern), so a phone's tall frame of the whole
    // laptop stays closed while a close look at the board opens on any screen shape.
    const dist = camera.position.distanceTo(center), spanH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    cut = 1 - smooth(4.6, 6.0, Math.max(spanH, spanH * camera.aspect));
    laptop.setCutaway(cut);
    // The window wall gives way when the camera swings behind it.
    const local = room.worldToLocal(camera.position.clone());
    desk.window.visible = local.z > -0.68;
    sideWall.visible = local.x < RW / 2;
  };
  const CYCLE = 14;
  world.updates.push(t => {
    const s = ((t % CYCLE) + CYCLE) % CYCLE;
    // Type for ~9 s, look up and think for ~3 s, back to typing. When the camera comes close the person sits back.
    const think = smooth(9, 9.8, s) * (1 - smooth(12.4, 13.2, s));
    if (cut > 0.02) sitter.pose(t, {mode: think > 0.5 ? 'think' : 'type', to: 'lap', mix: cut});
    else sitter.pose(t, {mode: 'mouse', to: 'think', mix: think});
    laptop.update(t, {fans: 0.25});
    // The board breathes a little while it is open: the three engines idle at a low glow.
    for (const [id, ph] of [['cpu', 0], ['gpu', 2.1], ['npu', 4.2]]) laptop.lightChip(id, cut * (0.12 + 0.08 * Math.sin(t * 1.3 + ph)));
  });

  world.local = {laptop, desk, sitter, views: Object.keys(LOCAL_VIEWS),
    chips: () => Object.fromEntries(['cpu', 'gpu', 'npu', 'memory', 'ssd', 'battery'].map(id => { const v = new THREE.Vector3(); laptop.chips[id].getWorldPosition(v); root.worldToLocal(v); return [id, v.toArray().map(n => +n.toFixed(3))]; }))};
  return world;
}

// Generic names the shared viewer loads every extra world by.
export {createLocalScene as createWorld, LOCAL_SEED as WORLD_SEED, LOCAL_VIEWS as WORLD_VIEWS};
