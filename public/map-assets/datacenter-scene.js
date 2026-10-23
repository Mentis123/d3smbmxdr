import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {buildElectrical} from './electrical.js';
import {createFlowMaterial} from './flow-effects.js';
import {makeBatch, metal, slabTexture} from './builder-utils.js';
import {LAYOUT} from './scene-layout.js';
import {ITEMS as DC_ITEMS, STORIES as DC_STORIES, TAGLINE as DC_TAGLINE} from './datacenter-data.js';

// AI-ready datacenter world: the "Your journey to AI-ready infrastructure" infographic as four dioramas.
// Front row, left to right, are its three warning cards (too hungry, too hot, too heavy). Behind them is the
// AI-ready hall, fed by the energy world's real substation. Facts are written into the scene (placards and tags),
// because the viewer hides its caption on phones. Brief and rules: docs/DATACENTER-DESIGN.md.
export const DC_SEED = 201026;
// The energy yard datum. The pad sits at this height so buildElectrical's substation lines up.
export const DECK = LAYOUT.yard.y;
const TOP = DECK + 0.12;

// The infographic's cards as platforms. Accents follow the infographic's card colours.
export const ZONES = {
  hungry: {x0: -8.9, x1: -3.5, z0: 1.8, z1: 6.2, accent: 0x2aa8ff, css: '#2aa8ff'},
  hot: {x0: -3.0, x1: 2.4, z0: 1.8, z1: 6.2, accent: 0xc24dff, css: '#c24dff'},
  heavy: {x0: 2.8, x1: 8.4, z0: 1.8, z1: 6.2, accent: 0x22d6e8, css: '#22d6e8'},
  ready: {x0: -8.9, x1: 3.6, z0: -6.9, z1: 0.9, accent: 0x5dff6a, css: '#5dff6a'},
};

export const DC_ANCHORS = {
  hungry: new THREE.Vector3(-4.55, TOP + 5.5, 3.6),
  hot: new THREE.Vector3(-0.3, TOP + 4.0, 3.6),
  heavy: new THREE.Vector3(5.6, TOP + 4.4, 3.8),
  ready: new THREE.Vector3(-3.6, TOP + 3.9, -3.25),
};

// Views for the shared viewer (same shape as MINING_VIEWS). Distance is about 36 / zoom on a desktop screen.
const DATACENTER_VIEWS_BASE = {
  hero: {yaw: 0, target: [-0.4, 2.6, -0.2], zoom: 1.5, tilt: 0.62, azimuth: 0.18, fov: 38},
  // Opening step: the ten racks and the question over them.
  hungryWide: {yaw: 0, target: [-6.4, 3.0, 3.8], zoom: 2.4, tilt: 0.44, azimuth: 0.3, fov: 38},
  hungry: {yaw: 0, target: [-6.0, 4.3, 3.6], zoom: 2.5, tilt: 0.34, azimuth: 0.22, fov: 38},
  hot: {yaw: 0, target: [-0.3, 3.2, 3.8], zoom: 3.5, tilt: 0.36, azimuth: 0.12, fov: 38},
  heavy: {yaw: 0, target: [5.6, 2.9, 3.8], zoom: 3.4, tilt: 0.4, azimuth: 0.1, fov: 38},
  ready: {yaw: 0, target: [-2.6, 2.8, -3.0], zoom: 2.2, tilt: 0.75, azimuth: 0.28, fov: 38},
};
// On phones the hero pulls in a little and close-ups a little more (viewer.js viewZoom), keeping the outer cards in frame.
export const DATACENTER_VIEWS = Object.fromEntries(Object.entries(DATACENTER_VIEWS_BASE).map(([id, v]) => [id, {...v, portraitZoom: id === 'hero' ? 1.3 : 1.25}]));

// Pins. Captions are each card's lead line from datacenter-data.js, so the world and the panel say the same thing.
const LEAD = Object.fromEntries(DC_ITEMS.map(i => [i.id, `${i.label}: ${i.lead}`]));
export const DC_HOTSPOTS = [
  {id: 'hungry', label: '1 · Too hungry', view: 'hungry', anchor: DC_ANCHORS.hungry, caption: LEAD.hungry},
  {id: 'hot', label: '2 · Too hot', view: 'hot', anchor: DC_ANCHORS.hot, caption: LEAD.hot},
  {id: 'heavy', label: '3 · Too heavy', view: 'heavy', anchor: DC_ANCHORS.heavy, caption: LEAD.heavy},
  {id: 'ready', label: '4 · AI ready', view: 'ready', anchor: DC_ANCHORS.ready, caption: LEAD.ready},
];

// --- Procedural textures and labels (regenerated: the kit has no text or slab assets) ---

function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function crackTexture() {
  // Jagged cracks radiating from the rack's corners; drawn once, faded in as the floor gives way.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d');
  g.strokeStyle = '#050607';
  g.lineCap = 'round';
  // Plane is 3 m wide; the rack is 0.9 x 1.3 m, so its corners sit 77 px and 111 px from the centre.
  const seeds = [[179, 145], [333, 145], [333, 367], [179, 367]];
  seeds.forEach(([sx, sy], k) => {
    for (let branch = 0; branch < 3; branch++) {
      let x = sx, y = sy;
      const angle = Math.atan2(sy - 256, sx - 256) + (branch - 1) * 0.55;
      g.lineWidth = 9 - branch * 2;
      g.beginPath();
      g.moveTo(x, y);
      for (let step = 0; step < 8; step++) {
        const jitter = Math.sin((k + 1) * 7.3 + step * 3.1 + branch) * 0.6;
        x += Math.cos(angle + jitter) * 26;
        y += Math.sin(angle + jitter) * 26;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
  return canvasTexture(canvas);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Flat placard on a platform's front strip: number, card title and the infographic's one-line takeaway.
function floorLabel(zone, number, title, line) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 190;
  const g = canvas.getContext('2d');
  g.fillStyle = 'rgba(2,11,23,0.86)';
  roundRect(g, 4, 4, 1016, 182, 22);
  g.fill();
  g.strokeStyle = zone.css;
  g.lineWidth = 5;
  g.stroke();
  g.fillStyle = zone.css;
  g.beginPath();
  g.arc(78, 95, 46, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#020b17';
  g.font = 'bold 56px "Helvetica Neue", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(number), 78, 97);
  g.textAlign = 'left';
  g.fillStyle = zone.css;
  g.font = 'bold 50px "Helvetica Neue", Arial, sans-serif';
  g.fillText(title, 148, 66);
  g.fillStyle = '#e8f4ff';
  g.font = '34px "Helvetica Neue", Arial, sans-serif';
  g.fillText(line, 148, 132, 850);
  // Capped so the wide AI-ready platform gets a placard the same size as the others.
  const width = Math.min(zone.x1 - zone.x0 - 0.4, 5.0);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * canvas.height / canvas.width), new THREE.MeshBasicMaterial({map: canvasTexture(canvas), transparent: true, toneMapped: false, depthWrite: false}));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set((zone.x0 + zone.x1) / 2, TOP + 0.008, zone.z1 - 0.55);
  mesh.renderOrder = 2;
  return mesh;
}

// Billboard tag (always faces the camera, drawn on top) for a fact the infographic states next to a picture.
function tag(lines, css, width = 2.1) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 64 + lines.length * 62;
  const g = canvas.getContext('2d');
  g.fillStyle = 'rgba(2,11,23,0.88)';
  roundRect(g, 4, 4, 760, canvas.height - 8, 18);
  g.fill();
  g.strokeStyle = css;
  g.lineWidth = 4;
  g.stroke();
  g.textBaseline = 'middle';
  lines.forEach((text, i) => {
    g.fillStyle = i === 0 ? css : '#e8f4ff';
    g.font = (i === 0 ? 'bold 46px' : '40px') + ' "Helvetica Neue", Arial, sans-serif';
    g.fillText(text, 30, 62 + i * 62, 710);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: canvasTexture(canvas), transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
  sprite.scale.set(width, width * canvas.height / canvas.width, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function warningSign() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d');
  g.fillStyle = '#e8263b';
  g.beginPath();
  g.moveTo(128, 18);
  g.lineTo(242, 230);
  g.lineTo(14, 230);
  g.closePath();
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = 'bold 150px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('!', 128, 150);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: canvasTexture(canvas), transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
  sprite.renderOrder = 11;
  return sprite;
}

// Speech bubble for the infographic's opening question, drawn as a billboard over the ten racks.
function speechBubble(lines) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 300;
  const g = canvas.getContext('2d');
  g.fillStyle = 'rgba(2,11,23,0.9)';
  g.strokeStyle = '#2aa8ff';
  g.lineWidth = 6;
  roundRect(g, 8, 8, 884, 220, 44);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(160, 224);
  g.lineTo(130, 292);
  g.lineTo(230, 224);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(2,11,23,0.9)';
  g.fillRect(150, 214, 90, 16);
  g.fillStyle = '#e8f4ff';
  g.font = '56px "Helvetica Neue", Arial, sans-serif';
  g.textBaseline = 'middle';
  lines.forEach((line, i) => g.fillText(line, 52, 82 + i * 76, 800));
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: canvasTexture(canvas), transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
  sprite.center.set(0.15, 0);
  sprite.scale.set(2.7, 0.9, 1);
  sprite.renderOrder = 12;
  return sprite;
}

// A flat chevron on the deck, pointing along +x before rotation.
function chevronGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.1, 0.26);
  shape.lineTo(0.16, 0);
  shape.lineTo(-0.1, -0.26);
  shape.lineTo(-0.2, -0.26);
  shape.lineTo(0.06, 0);
  shape.lineTo(-0.2, 0.26);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

// The infographic's closing line, lettered along the pad's front face; the three words take the card colours.
function taglineStrip(text, width) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 110;
  const g = canvas.getContext('2d');
  g.font = '600 54px "Helvetica Neue", Arial, sans-serif';
  g.textBaseline = 'middle';
  const words = text.split(' ');
  const colors = ['#2aa8ff', '#c24dff', '#22d6e8'];
  const spaced = w => w.split('').join('\u200a');
  let total = 0;
  const parts = words.map((w, i) => { const t = spaced(w) + ' '; const m = g.measureText(t).width; total += m; return {t, m, c: colors[i] || '#e8f4ff'}; });
  let x = (2048 - total) / 2;
  for (const part of parts) { g.fillStyle = part.c; g.fillText(part.t, x, 58); x += part.m; }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * canvas.height / canvas.width), new THREE.MeshBasicMaterial({map: canvasTexture(canvas), transparent: true, toneMapped: false, depthWrite: false}));
  return mesh;
}

function tubeFlow(parent, points, radius, options) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const material = createFlowMaterial(options);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 24, radius, 10, false), material);
  parent.add(mesh);
  return material;
}

// Power pulses amber; coolant keeps the flow shader's default cyan.
const POWER = {base: [0.03, 0.018, 0.004], glow: [2.6, 1.5, 0.28]};

export function createDatacenterScene() {
  const world = createWorldShell(DC_SEED);
  const {root} = world;
  world.key.color.set(0xffe4bb);
  world.key.intensity = 3;
  world.height = () => DECK;

  const concrete = metal(0x65716f, 0.95, 0);
  const platformTop = metal(0x4e5960, 0.9, 0.05);
  const paint = metal(0xb5b6ae, 0.78, 0.12);
  const steel = metal(0x879398, 0.42, 0.72);
  const dark = metal(0x1c2834, 0.6, 0.4);
  const rackStd = metal(0x1a2636, 0.6, 0.35);
  const rackAI = metal(0x17324f, 0.55, 0.4);
  const tileMetal = metal(0x8d979d, 0.6, 0.3);
  const flowMats = [];
  const updates = world.updates;
  const glow = hex => new THREE.MeshBasicMaterial({color: hex, toneMapped: false});

  // Substation: the energy world's own yard, unchanged, on the same datum. It feeds the AI-ready hall.
  buildElectrical(world);

  // Two-step concrete pad under everything.
  const pad = makeBatch(root, 'dc-pad');
  pad.box(0, DECK * 0.25, -0.4, 19.6, DECK * 0.5, 15.0, concrete);
  pad.box(0, DECK * 0.75, -0.4, 18.8, DECK * 0.5, 14.0, concrete);
  pad.finish();
  const slab = slabTexture();
  slab.repeat.set(6.3, 4.7);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(18.8, 14), new THREE.MeshStandardMaterial({map: slab, roughness: 0.9, metalness: 0.02}));
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, DECK + 0.004, -0.4);
  deck.receiveShadow = true;
  root.add(deck);

  // Platforms: one per card, edged in its accent colour (bloom picks the edge up).
  const platforms = makeBatch(root, 'dc-platforms');
  const edges = {};
  for (const [key, zone] of Object.entries(ZONES)) {
    const w = zone.x1 - zone.x0, d = zone.z1 - zone.z0, cx = (zone.x0 + zone.x1) / 2, cz = (zone.z0 + zone.z1) / 2;
    platforms.box(cx, DECK + 0.06, cz, w, 0.12, d, platformTop);
    const edge = glow(zone.accent);
    edges[key] = edge;
    platforms.box(cx, TOP + 0.01, zone.z0 + 0.03, w, 0.03, 0.06, edge);
    platforms.box(cx, TOP + 0.01, zone.z1 - 0.03, w, 0.03, 0.06, edge);
    platforms.box(zone.x0 + 0.03, TOP + 0.01, cz, 0.06, 0.03, d, edge);
    platforms.box(zone.x1 - 0.03, TOP + 0.01, cz, 0.06, 0.03, d, edge);
  }
  platforms.finish();

  const warnings = [];
  // Tags draw on top of the scene, so a close-up would show other zones' tags through it.
  // With no pin selected every tag shows; once a pin is selected only that zone's tags do.
  const zoneTags = [];
  let activeZone = null;
  // Journey state: the card in focus ('opener' and 'outcomes' are the first and last steps) and when it began.
  // Embedded in a host page with a side panel, floating tags show only for the card in focus.
  let focus = null, storyStart = 0;
  // In the AI Lab (experience=lab) the three lab markers carry the places, so the floating tags wait for a focus as in an embed.
  const query = new URLSearchParams(location.search);
  const EMBED = query.get('embed') === '1' || query.get('experience') === 'lab';
  const placards = {};
  const place = (zone, ...sprites) => { for (const sprite of sprites) zoneTags.push({zone, sprite}); };

  // ---------------------------------------------------------------- 1 · TOO HUNGRY
  // Ten traditional racks against one AI rack, on one power scale (1 kW = 1.2 cm of gauge), so the gauges are honest.
  {
    const zone = ZONES.hungry, KW = 0.012;
    const b = makeBatch(root, 'dc-hungry');
    const gaugeLow = glow(0x2aa8ff);
    const tradX = [-8.45, -7.9, -7.35, -6.8, -6.25], tradZ = [3.0, 4.4], ledGreen = glow(0x4cff9a);
    for (const z of tradZ) for (const x of tradX) {
      b.box(x, TOP + 0.75, z, 0.42, 1.5, 0.7, rackStd);
      b.box(x, TOP + 1.5 + 0.02, z, 0.08, 0.04, 0.08, steel);
      b.box(x, TOP + 1.54 + 10 * KW / 2, z, 0.3, 10 * KW, 0.3, gaugeLow);
      b.box(x + 0.12, TOP + 0.75, z + 0.36, 0.03, 1.1, 0.01, ledGreen);
    }
    // PDU with thin feeds along the top of each row.
    b.box(-8.6, TOP + 0.5, 2.15, 0.4, 1.0, 0.35, dark);
    // Switchgear and the AI rack. Its feed is a fat busway with many fast pulses.
    b.box(-4.2, TOP + 0.8, 2.15, 1.0, 1.6, 0.5, paint);
    b.box(-4.55, TOP + 1.2, 3.9, 0.9, 2.4, 1.3, rackAI);
    b.box(-4.55 + 0.3, TOP + 1.2, 3.9 + 0.66, 0.04, 2.0, 0.01, glow(0x7fe9ff));
    // The 250 kW gauge: ten segments on a steel frame, the same scale as the small racks' 10 kW.
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.beam([-4.55 + sx * 0.32, TOP + 2.4, 3.6 + sz * 0.32], [-4.55 + sx * 0.32, TOP + 2.4 + 250 * KW + 0.1, 3.6 + sz * 0.32], 0.02, steel);
    b.finish();
    const aiGauge = glow(0x1a6fd0);
    const seg = 250 * KW / 10, gaugeSegs = [];
    for (let i = 0; i < 10; i++) {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(0.5, seg - 0.03, 0.5), aiGauge);
      piece.position.set(-4.55, TOP + 2.45 + i * seg + seg / 2, 3.6);
      root.add(piece);
      gaugeSegs.push(piece);
    }
    // When its step begins, the gauge fills from empty, 25 kW per segment.
    updates.push(t => {
      const lit = focus === 'hungry' ? Math.max(1, Math.min(10, Math.floor((t - storyStart) / 0.35) + 1)) : 10;
      gaugeSegs.forEach((piece, i) => { piece.visible = i < lit; });
    });
    const bubble = speechBubble(['“I have ten racks.', 'I should be good, right?”']);
    bubble.position.set(-8.3, TOP + 2.0, 3.7);
    root.add(bubble);
    updates.push(() => { bubble.visible = focus === 'opener' || (focus === null && activeZone === null); });
    flowMats.push(tubeFlow(root, [[-8.6, TOP + 1.0, 2.15], [-8.75, TOP + 1.62, 3.0], [-6.0, TOP + 1.62, 3.0]], 0.022, {...POWER, speed: 0.05, phase: 0.1}));
    flowMats.push(tubeFlow(root, [[-8.6, TOP + 1.0, 2.15], [-8.8, TOP + 1.62, 4.4], [-6.0, TOP + 1.62, 4.4]], 0.022, {...POWER, speed: 0.05, phase: 0.6}));
    flowMats.push(tubeFlow(root, [[-4.2, TOP + 1.6, 2.15], [-4.2, TOP + 2.75, 2.6], [-4.45, TOP + 2.6, 3.35], [-4.5, TOP + 2.42, 3.6]], 0.1, {...POWER, speed: 0.6, repeat: 4}));

    const trad = tag(['TRADITIONAL RACK', '5–20 kW each · 10 racks'], zone.css, 2.0);
    trad.position.set(-7.35, TOP + 2.35, 3.7);
    const ai = tag(['MODERN AI RACK', '100–250+ kW in one rack'], zone.css, 2.0);
    ai.position.set(-5.9, TOP + 4.3, 3.6);
    place('hungry', trad, ai);
    placards.hungry = floorLabel(zone, 1, 'TOO HUNGRY · POWER DENSITY', 'AI doesn’t need more racks. It needs more power per rack.');
    root.add(trad, ai, placards.hungry);
    updates.push(t => aiGauge.color.setRGB(0.05, 0.38 + 0.1 * Math.sin(t * 3), 0.85 + 0.1 * Math.sin(t * 3)));
  }

  // ---------------------------------------------------------------- 2 · TOO HOT
  // Air-cooled rack overheating beside a liquid-cooled rack, split down the middle like the infographic card.
  {
    const zone = ZONES.hot;
    const b = makeBatch(root, 'dc-hot');
    const rackHot = new THREE.MeshStandardMaterial({color: 0x3a1a1a, roughness: 0.5, metalness: 0.4, emissive: 0x7a1a08});
    const airX = -1.65, liqX = 1.0, rz = 4.0;
    b.box(-0.3, TOP + 0.012, 3.6, 0.04, 0.024, 3.4, glow(zone.accent));
    // Air side: rack with front fans.
    for (const y of [0.55, 1.15, 1.75]) b.beam([airX, TOP + y, rz + 0.55], [airX, TOP + y, rz + 0.6], 0.24, dark, 16);
    // Liquid side: rack, CDU and a calm status strip.
    b.box(liqX, TOP + 1.15, rz, 0.8, 2.3, 1.1, rackAI);
    b.box(liqX + 0.25, TOP + 1.15, rz + 0.56, 0.03, 1.8, 0.01, glow(0x7fe9ff));
    b.box(2.0, TOP + 0.6, 2.6, 0.55, 1.2, 0.55, metal(0x233b58, 0.4, 0.6));
    b.finish();
    const hotRack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.3, 1.1), rackHot);
    hotRack.position.set(airX, TOP + 1.15, rz);
    hotRack.castShadow = true;
    root.add(hotRack);
    flowMats.push(tubeFlow(root, [[2.0, TOP + 1.2, 2.6], [2.0, TOP + 2.65, 2.95], [1.25, TOP + 2.65, 3.6], [1.15, TOP + 2.32, 3.85]], 0.05, {speed: 0.22, repeat: 3}));
    flowMats.push(tubeFlow(root, [[0.85, TOP + 2.32, 3.6], [0.75, TOP + 2.85, 3.2], [1.8, TOP + 2.85, 2.6], [1.8, TOP + 1.2, 2.6]], 0.05, {speed: 0.22, repeat: 3, phase: 0.5}));

    // Air: cool air drawn in at the front, hot air leaving the back and rising. The hot side never cools down.
    const N = 180, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const air = new THREE.Points(geo, new THREE.PointsMaterial({size: 0.08, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending}));
    air.frustumCulled = false;
    root.add(air);
    const cool = new THREE.Color(0x8fd8ff), hot = new THREE.Color(0xff5a2a), tint = new THREE.Color();
    updates.push(t => {
      for (let i = 0; i < N; i++) {
        const seed = (i * 0.618034) % 1, lane = ((i * 0.3819) % 1) - 0.5, h = 0.25 + ((i * 0.7071) % 1) * 1.9;
        const u = (seed + t * 0.28) % 1;
        let x = airX + lane * 0.6, y = TOP + h, z;
        if (u < 0.45) { z = rz + 1.6 - (u / 0.45) * 1.0; tint.copy(cool); }
        else if (u < 0.55) { z = rz; tint.setRGB(0, 0, 0); }
        else { const k = (u - 0.55) / 0.45; z = rz - 0.6 - k * 0.9; y += k * k * 1.6; tint.copy(hot).multiplyScalar(1 - k * 0.5); }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        col[i * 3] = tint.r; col[i * 3 + 1] = tint.g; col[i * 3 + 2] = tint.b;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      const heat = focus === 'hot' ? Math.min(1, (t - storyStart) / 3) : 1;
      rackHot.emissive.setRGB(0.06 + heat * (0.44 + 0.22 * Math.sin(t * 4)), 0.02 + 0.08 * heat, 0.02);
    });
    const warn = warningSign();
    warn.position.set(airX, TOP + 2.75, rz);
    warnings.push({sprite: warn, base: 0.55});
    const airTag = tag(['AIR COOLED', 'Limited capacity'], '#ff6b6b', 1.7);
    airTag.position.set(airX, TOP + 3.45, rz);
    const liqTag = tag(['LIQUID COOLED', 'High capacity'], zone.css, 1.7);
    liqTag.position.set(liqX, TOP + 3.45, rz);
    place('hot', airTag, liqTag);
    placards.hot = floorLabel(zone, 2, 'TOO HOT · COOLING REALITY', 'If your cooling strategy ends at air, your AI journey may end there too.');
    root.add(warn, airTag, liqTag, placards.hot);
  }

  // ---------------------------------------------------------------- 3 · TOO HEAVY
  // A heavy AI rack on a raised access floor. The front row of tiles is cut away to show the pedestals and the
  // tangle of cables and pipes underneath. The tiles under the rack sag and crack on a loop.
  let heavyStart = 0, lastT = 0;
  {
    const zone = ZONES.heavy;
    const b = makeBatch(root, 'dc-heavy');
    const STEP = 0.6, xs = Array.from({length: 8}, (_, i) => 3.5 + i * STEP), zs = Array.from({length: 5}, (_, j) => 2.3 + j * STEP);
    const tileY = TOP + 0.46;
    const under = new Set(['3,2', '4,2', '3,3', '4,3']);
    xs.forEach((x, i) => zs.forEach((z, j) => {
      b.cylinder(x, TOP + 0.22, z, 0.028, 0.04, 0.44, steel, 8);
      if (j < 4 && !under.has(i + ',' + j)) b.box(x, tileY, z, 0.58, 0.04, 0.58, tileMetal);
    }));
    b.finish();
    // Under-floor cables and pipes, crossing the pedestal grid.
    const runs = [[0xd98a2b, 0.11, 0.035], [0x2f7fbf, 0.17, 0.045], [0xe0c03a, 0.24, 0.025], [0x8a96a0, 0.3, 0.03], [0xd9534f, 0.14, 0.02]];
    runs.forEach(([color, y, r], k) => {
      const pts = [];
      for (let s = 0; s <= 6; s++) pts.push(new THREE.Vector3(3.3 + s * 0.8, TOP + y + 0.03 * Math.sin(s * 2 + k), 2.4 + ((k * 0.6 + s * 0.45) % 2.6)));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, r, 8, false), metal(color, 0.5, 0.3));
      tube.castShadow = true;
      root.add(tube);
    });
    // The four tiles under the rack, the rack, cracks and the weight arrow move together.
    const sagTiles = [];
    [[3, 2], [4, 2], [3, 3], [4, 3]].forEach(([i, j]) => {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.58), tileMetal);
      tile.position.set(xs[i], tileY, zs[j]);
      tile.castShadow = tile.receiveShadow = true;
      root.add(tile);
      sagTiles.push({tile, x: xs[i], z: zs[j]});
    });
    const cx = (xs[3] + xs[4]) / 2, cz = (zs[2] + zs[3]) / 2;
    const rack = new THREE.Group();
    rack.position.set(cx, tileY + 0.02, cz);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 1.3), metal(0x15202c, 0.55, 0.45));
    body.position.y = 1.2;
    body.castShadow = true;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.0, 0.01), glow(0x7fe9ff));
    strip.position.set(0.3, 1.2, 0.66);
    rack.add(body, strip);
    root.add(rack);
    const cracks = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({map: crackTexture(), transparent: true, opacity: 0, depthWrite: false}));
    cracks.rotation.x = -Math.PI / 2;
    cracks.position.set(cx, tileY + 0.025, cz);
    cracks.renderOrder = 3;
    root.add(cracks);
    const arrow = new THREE.Group();
    const arrowMat = glow(0xff5a4a);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12), arrowMat);
    shaft.position.y = 0.55;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.32, 16), arrowMat);
    head.rotation.x = Math.PI;
    head.position.y = 0.06;
    arrow.add(shaft, head);
    root.add(arrow);
    const warn = warningSign();
    warn.position.set(cx + 1.0, tileY + 0.9, cz + 0.75);
    warnings.push({sprite: warn, base: 0.5, gate: () => sagNow > 0.3});
    let sagNow = 0;
    updates.push(t => {
      lastT = t;
      const p = ((t - heavyStart) % 7 + 7) % 7 / 7;
      const sag = p < 0.6 ? THREE.MathUtils.smoothstep(p, 0, 0.6) : p < 0.85 ? 1 : 1 - THREE.MathUtils.smoothstep(p, 0.85, 1);
      sagNow = sag;
      for (const s of sagTiles) {
        s.tile.position.y = tileY - 0.16 * sag;
        s.tile.rotation.x = -(s.z - cz) * 0.4 * sag;
        s.tile.rotation.z = (s.x - cx) * 0.4 * sag;
      }
      rack.position.y = tileY + 0.02 - 0.17 * sag;
      rack.rotation.z = 0.035 * sag;
      cracks.material.opacity = sag;
      arrow.position.set(cx, tileY + 2.55 + 0.12 * Math.abs(Math.sin(t * 2.2)), cz);
    });
    const weight = tag(['RACK WEIGHT', '2,000–5,000+ lbs'], zone.css, 1.7);
    weight.position.set(cx + 1.6, tileY + 2.6, cz);
    const floorTag = tag(['FLOOR LOADING', 'Limits exceeded'], '#ff6b6b', 1.7);
    floorTag.position.set(cx - 1.7, tileY + 1.4, cz);
    const paths = tag(['CABLE & PIPE PATHS', 'Congested under the floor'], zone.css, 1.9);
    paths.position.set(7.2, TOP + 1.05, 4.75);
    place('heavy', weight, floorTag, paths);
    placards.heavy = floorLabel(zone, 3, 'TOO HEAVY · STRUCTURE', 'Not every datacenter can physically support modern AI racks.');
    root.add(warn, weight, floorTag, paths, placards.heavy);
  }

  // ---------------------------------------------------------------- 4 · AI READY
  // The destination: slab on grade, open truss roof so the rows show, overhead power and liquid, the real substation.
  {
    const zone = ZONES.ready;
    const b = makeBatch(root, 'dc-ready');
    const cx = (zone.x0 + zone.x1) / 2;
    // Low parapet on three sides and an open truss at 3.2 m.
    b.box(cx, TOP + 0.3, zone.z0 + 0.1, zone.x1 - zone.x0, 0.6, 0.2, paint);
    b.box(zone.x0 + 0.1, TOP + 0.3, (zone.z0 + zone.z1) / 2, 0.2, 0.6, zone.z1 - zone.z0, paint);
    b.box(zone.x1 - 0.1, TOP + 0.3, (zone.z0 + zone.z1) / 2, 0.2, 0.6, zone.z1 - zone.z0, paint);
    const H = TOP + 3.2;
    // Front truss line sits between the front rack row and the placard, so no post stands on the placard.
    const trussZ = [zone.z0 + 0.2, zone.z1 - 1.9];
    for (const x of [zone.x0 + 0.2, -4.6, -0.3, zone.x1 - 0.2]) for (const z of trussZ) b.beam([x, TOP, z], [x, H, z], 0.06, steel);
    for (const z of trussZ) b.beam([zone.x0 + 0.2, H, z], [zone.x1 - 0.2, H, z], 0.05, steel);
    for (let x = zone.x0 + 0.2; x <= zone.x1 - 0.2 + 1e-6; x += 1.5) b.beam([x, H, trussZ[0]], [x, H, trussZ[1]], 0.03, steel);
    // Two rows of AI racks facing a shared cold aisle.
    const rowZ = [-4.6, -1.9], rackX = Array.from({length: 7}, (_, i) => -8.0 + i * 1.15);
    const led = glow(0x5dff6a);
    rowZ.forEach((z, r) => rackX.forEach(x => {
      b.box(x, TOP + 1.2, z, 0.9, 2.4, 1.3, rackAI);
      const face = r === 0 ? 0.66 : -0.66;
      b.box(x + 0.3, TOP + 1.2, z + face, 0.03, 2.0, 0.01, led);
      b.box(x, TOP + 2.52, z, 0.12, 0.24, 0.12, steel);
    }));
    // CDU and switchgear at the open end of the rows.
    b.box(1.6, TOP + 0.75, -5.4, 0.9, 1.5, 0.9, metal(0x233b58, 0.4, 0.6));
    b.box(1.6, TOP + 0.9, -1.6, 1.2, 1.8, 0.6, paint);
    // Rooftop dry coolers on the truss.
    for (const x of [-2.6, 0.8]) b.box(x, H + 0.32, -6.0, 2.0, 0.5, 1.1, paint);
    b.finish();
    const fans = [];
    for (const x of [-2.6, 0.8]) for (const dx of [-0.5, 0.5]) {
      const fan = new THREE.Group();
      fan.position.set(x + dx, H + 0.6, -6.0);
      for (let k = 0; k < 3; k++) {
        const arm = new THREE.Group();
        arm.rotation.y = (k * Math.PI * 2) / 3;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.36), metal(0x9ed9f2, 0.4, 0.2));
        blade.position.z = 0.18;
        arm.add(blade);
        fan.add(arm);
      }
      root.add(fan);
      fans.push(fan);
    }
    // Power from the substation transformers, then busway over each row.
    flowMats.push(tubeFlow(root, [[6.17, DECK + 1.1, 0.38], [4.4, TOP + 3.6, 0.3], [2.6, TOP + 3.0, -1.2], [1.0, TOP + 2.9, -1.9], [-8.3, TOP + 2.9, -1.9]], 0.08, {...POWER, speed: 0.25, repeat: 6}));
    flowMats.push(tubeFlow(root, [[1.0, TOP + 2.9, -1.9], [1.2, TOP + 2.9, -3.4], [1.0, TOP + 2.9, -4.6], [-8.3, TOP + 2.9, -4.6]], 0.08, {...POWER, speed: 0.25, repeat: 5, phase: 0.3}));
    // Liquid: CDU to manifolds over each row's aisle face, and up to the rooftop dry coolers.
    flowMats.push(tubeFlow(root, [[1.6, TOP + 1.5, -5.4], [1.2, TOP + 2.65, -4.4], [0.4, TOP + 2.65, -3.92], [-8.3, TOP + 2.65, -3.92]], 0.05, {speed: 0.2, repeat: 5}));
    flowMats.push(tubeFlow(root, [[1.6, TOP + 1.5, -5.4], [1.4, TOP + 2.65, -3.2], [0.4, TOP + 2.65, -2.58], [-8.3, TOP + 2.65, -2.58]], 0.05, {speed: 0.2, repeat: 5, phase: 0.5}));
    flowMats.push(tubeFlow(root, [[1.8, TOP + 1.5, -5.6], [1.8, TOP + 3.0, -5.8], [0.8, H + 0.1, -6.0], [-2.6, H + 0.1, -6.0]], 0.05, {speed: 0.18, repeat: 3, phase: 0.2}));
    updates.push(t => { for (const fan of fans) fan.rotation.y = t * 5; });

    const checklist = tag(['AI READY DATACENTER', '✓ High-density power 100–250 kW+', '✓ Liquid cooling strategy', '✓ Structural validation', '✓ GPU-ready infrastructure'], zone.css, 2.6);
    // Back-left above the hall: inside the frame of the 'ready' view, clear of the rooftop coolers.
    checklist.position.set(-6.0, TOP + 3.75, -6.0);
    const slabTag = tag(['SLAB ON GRADE', 'No raised floor under AI racks'], zone.css, 1.9);
    slabTag.position.set(-6.9, TOP + 0.9, 0.25);
    place('ready', checklist, slabTag);
    placards.ready = floorLabel(zone, 4, 'AI READY DATACENTER', 'Power, cooling and structure ready before the GPUs arrive.');
    root.add(checklist, slabTag, placards.ready);
  }

  // Journey arrows on the deck, card to card (1 -> 2 -> 3 -> 4), in the colour of the card they leave.
  const chevrons = [];
  const chevGeo = chevronGeometry();
  // [x, z, direction x, direction z, colour]: 1 -> 2 and 2 -> 3 run along +x; 3 -> 4 runs back (-z) to the hall.
  for (const [x, z, dx, dz, color] of [[-3.25, 4.0, 1, 0, 0x2aa8ff], [2.6, 4.0, 1, 0, 0xc24dff], [3.2, 1.35, 0, -1, 0x22d6e8]]) {
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false});
      const mesh = new THREE.Mesh(chevGeo, mat);
      const along = (i - 1) * 0.14;
      mesh.position.set(x + dx * along, DECK + 0.02, z + dz * along);
      // Rotating by atan2(-dz, dx) turns the chevron's +x tip onto the direction of travel.
      mesh.rotation.y = Math.atan2(-dz, dx);
      mesh.renderOrder = 2;
      root.add(mesh);
      chevrons.push({mat, i});
    }
  }
  const tagline = taglineStrip(DC_TAGLINE.toUpperCase(), 13.5);
  tagline.position.set(0, DECK * 0.75, 6.6 + 0.012);
  root.add(tagline);

  // Warning signs pulse; the floor warning only shows while the floor is giving way.
  updates.push(t => {
    for (const w of warnings) {
      const on = w.gate ? w.gate() : true;
      w.sprite.visible = on;
      w.sprite.scale.setScalar(w.base * (1 + 0.12 * Math.sin(t * 5)));
    }
    for (const m of flowMats) m.uniforms.uTime.value = t;
    // The card in focus stays lit; the others dim. The opening step belongs to card 1; the last step lights everything.
    const card = focus === 'opener' ? 'hungry' : focus === 'outcomes' ? null : focus;
    for (const [key, edge] of Object.entries(edges)) {
      const k = !card || card === key ? 1 : 0.2;
      edge.color.setHex(ZONES[key].accent).multiplyScalar(k);
      if (placards[key]) placards[key].material.opacity = 0.3 + 0.7 * k;
    }
    // During the opening question only the speech bubble speaks; tags wait for the cards.
    const shown = focus === 'opener' ? 'none' : card || activeZone;
    for (const {zone, sprite} of zoneTags) sprite.visible = shown ? shown === zone : !EMBED;
    // Chevrons run in sequence; brighter on the last step.
    const bright = focus === 'outcomes' ? 1 : 0.7;
    for (const {mat, i} of chevrons) mat.opacity = bright * (0.25 + 0.75 * Math.max(0, Math.sin((t * 2.2 - i * 0.9))));
  });

  // Selecting a pin narrows the tags to its zone; the heavy pin also replays the floor giving way.
  world.onHotspot = spot => {
    activeZone = spot.id;
    focus = spot.id;
    storyStart = lastT;
    if (spot.id === 'heavy') heavyStart = lastT;
  };
  // Journey steps (host page): focus a card, restart its animation, return the view to glide to.
  world.setStory = (id, step = 0) => {
    const story = DC_STORIES.find(s => s.id === id);
    const current = story?.steps[Math.max(0, Math.min(story.steps.length - 1, step | 0))];
    focus = current ? current.focus : null;
    activeZone = null;
    storyStart = lastT;
    if (focus === 'heavy') heavyStart = lastT;
    return current?.view || null;
  };
  world.hotspots = DC_HOTSPOTS;
  return world;
}

// Generic names the shared viewer loads every extra world by.
export {createDatacenterScene as createWorld, DC_SEED as WORLD_SEED, DATACENTER_VIEWS as WORLD_VIEWS};
