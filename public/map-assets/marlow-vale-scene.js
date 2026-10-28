import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {applyAtmosphere,SKY_GLSL} from './atmosphere.js';
import {makeBatch,metal} from './builder-utils.js';
import {buildTanks} from './tanks.js';
import {buildElectrical} from './electrical.js';
import {LAYOUT} from './scene-layout.js';
import {
  WATER, FLOOR, RIVER, ISLAND, PLACES, ROADS, ROAD_WIDTH, LAMP_SPACING, HOUSES, dropAt, spurFrame,
  height, riverQuery, roadDistance, roadAt, noise2, fbm2,
} from './marlow-vale-layout.js';

// Marlow Vale: a sweeping dusk valley, the upstream council town of the Riverbend basin (28 Oct 2026).
// Layout, river, roads and lots are pure data in marlow-vale-layout.js; this module only draws them.
// Reused as-is: world shell, atmosphere (dusk), Riverbend's clarifiers (tanks.js) and substation (electrical.js), each
// placed on this world's datum through a proxy world. Regenerated procedurally: the long terrain, the spline river,
// eucalypts, houses with lit windows, lamp-lit roads, the bridge, the council chambers and the glass building.
// Reference frame: docs/three-worlds/marlow-vale/reference.webp (the owner's image); the hero view is matched to it.

export const MARLOW_SEED = 281026;

export const MARLOW_VIEWS = {
  // The hero is fitted to the owner's reference image: a long lens from the lookout ridge behind the town, solved so the
  // council, bridge, glass hall, plant, far river and river exit land where the reference has them. Phones get a wider lens.
  hero: {yaw: 0, target: [1.79, 0.78, -1.17], zoom: 1.0, tilt: 0.187, azimuth: 0.311, fov: 27.9, portraitFov: 50, portraitZoom: 2.65},
  council: {yaw: 0, target: [5.2, 1.9, -7.4], zoom: 3.2, tilt: 0.42, azimuth: -0.25, fov: 38},
  bridge: {yaw: 0, target: [4.6, 0.6, 0.4], zoom: 3.4, tilt: 0.38, azimuth: 0.55, fov: 38},
  plant: {yaw: 0, target: [-6.6, 0.8, -10.6], zoom: 3.4, tilt: 0.5, azimuth: -0.6, fov: 38},
  town: {yaw: 0, target: [7.5, 1.2, -6], zoom: 2.2, tilt: 0.55, azimuth: 0.35, fov: 40},
  hill: {yaw: 0, target: [11.6, 3.4, -18.5], zoom: 3.0, tilt: 0.36, azimuth: 0.2, fov: 38},
  substation: {yaw: 0, target: [14.2, 1.2, -5.6], zoom: 3.4, tilt: 0.5, azimuth: 0.7, fov: 38},
  island: {yaw: 0, target: [-4.7, 0.7, -40.2], zoom: 3.0, tilt: 0.3, azimuth: -0.2, fov: 38},
  valley: {yaw: 0, target: [-3.5, 2.5, -42], zoom: 0.95, tilt: 0.18, azimuth: -0.3, fov: 46},
};

// Walking range for this world: the camera target may roam down the valley to the island; flight reaches past it.
export const MARLOW_BOUNDS = {target: {x: [-26, 26], z: [-48, 16], y: [-2, 14]}, flight: {x: [-46, 46], z: [-70, 34]}, ceiling: 34};

const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b);
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// Fog chunks for ShaderMaterials (river, mist) so they fade into the same dusk as everything else.
const FOG_PARS_V = '\n#include <fog_pars_vertex>\n', FOG_V = '\n#include <fog_vertex>\n';
const FOG_PARS_F = '\n#include <fog_pars_fragment>\n', FOG_F = '\n#include <fog_fragment>\n';

export function createMarlowValeScene() {
  const world = createWorldShell(MARLOW_SEED);
  const {root, scene, updates} = world;
  world.stats.stage = 'marlow-vale';
  // No plinth: this world is a landscape that runs to the horizon, not a tabletop.
  for (const name of ['plinth']) { const o = root.getObjectByName(name); if (o) o.visible = false; }
  root.children.filter(o => o.isLineLoop).forEach(o => { o.visible = false; });
  world.key.shadow.camera.left = -22; world.key.shadow.camera.right = 22; world.key.shadow.camera.top = 22; world.key.shadow.camera.bottom = -22;
  world.key.shadow.camera.far = 80; world.key.shadow.camera.updateProjectionMatrix();
  const atmosphere = applyAtmosphere(world, 'dusk', {sun: [0.4, -0.03, -1]});
  world.height = (x, z) => height(x, z);
  world.navigationBounds = MARLOW_BOUNDS;
  const counts = {};

  // A local copy of the camera in turntable space, for shaders that work in it (river lamp streaks).
  const camLocal = new THREE.Vector3();
  world.onCamera = camera => { camLocal.copy(camera.position); root.worldToLocal(camLocal); };

  buildTerrain(root, counts);
  const lamps = buildRoads(root, counts);
  const bridge = buildBridge(root, lamps, counts);
  buildRiver(world, atmosphere, lamps, camLocal, counts);
  buildIsland(root, lamps, counts);
  buildHouses(root, counts);
  buildCouncil(root, lamps, updates, counts);
  buildGlassHall(root, lamps, counts);
  buildPlant(world, lamps, counts);
  buildPower(world, counts);
  buildLampLights(root, lamps, counts);
  buildTrees(root, counts);
  buildSpur(root, counts);
  buildRanges(root, counts);
  buildMist(root, updates, counts);
  buildTraffic(root, updates, bridge, counts);

  world.stats.props = null;
  world.stats.marlow = counts;
  world.marlow = {views: Object.keys(MARLOW_VIEWS), counts, houses: HOUSES.length, lamps: lamps.length};
  return world;
}

// ---------------------------------------------------------------- terrain
// One mesh on a warped grid: vertices crowd the hero band and thin out toward the far ridges, so the near banks are
// smooth and the far land costs little.
function warp(t, center, negExt, posExt, kNeg, kPos) {
  const c = 2 * t - 1;
  return c < 0 ? center - negExt * Math.sinh(kNeg * -c) / Math.sinh(kNeg) : center + posExt * Math.sinh(kPos * c) / Math.sinh(kPos);
}
function terrainColor(x, z, y, slope, out) {
  const r = riverQuery(x, z), n = fbm2(x * 0.5, z * 0.5, 3), field = noise2(Math.floor(x / 2.3) * 3.1 + 0.5, Math.floor(z / 1.7) * 2.3 + 0.5);
  // Pasture, with paddocks of lighter grass and the odd ploughed or dry field on the valley floor.
  let c = [0.022 + n * 0.015, 0.045 + n * 0.028, 0.04 + n * 0.014];
  const floor = 1 - smooth(1.1, 2.4, y - FLOOR);
  if (floor > 0 && z > -48) {
    const pick = field < 0.3 ? [0.05, 0.075, 0.045] : field < 0.42 ? [0.045, 0.042, 0.035] : field < 0.55 ? [0.035, 0.065, 0.04] : null;
    if (pick) c = c.map((v, i) => v + (pick[i] - v) * floor * 0.8);
  }
  // Forest and scrub darken the hills; the far ridges go blue-black under the trees.
  const hill = smooth(0.9, 3.5, y - FLOOR);
  c = c.map((v, i) => v + ([0.015, 0.025, 0.03][i] - v) * hill * 0.75);
  // Rock on steep faces.
  const rock = smooth(0.55, 1.1, slope);
  c = c.map((v, i) => v + ([0.075, 0.07, 0.066][i] - v) * rock * 0.8);
  // Wet banks.
  const bank = 1 - smooth(r.half, r.half + 0.5, r.d);
  c = c.map((v, i) => v + ([0.03, 0.035, 0.03][i] - v) * bank);
  out.setRGB(c[0], c[1], c[2]);
}
function buildTerrain(root, counts) {
  const NX = 300, NZ = 320, pos = new Float32Array(NX * NZ * 3), col = new Float32Array(NX * NZ * 3), c = new THREE.Color();
  for (let j = 0; j < NZ; j++) {
    const z = warp(j / (NZ - 1), -6, 144, 40, 3.2, 2.2);
    for (let i = 0; i < NX; i++) {
      const x = warp(i / (NX - 1), 0, 100, 100, 3.1, 3.1), y = height(x, z), k = (j * NX + i) * 3;
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
    }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = (j * NX + i) * 3, x = pos[k], z = pos[k + 2];
    const slope = Math.abs(height(x + 0.25, z) - height(x - 0.25, z)) * 2 + Math.abs(height(x, z + 0.25) - height(x, z - 0.25)) * 2;
    terrainColor(x, z, pos[k + 1], slope, c); col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
  }
  const index = new Uint32Array((NX - 1) * (NZ - 1) * 6); let n = 0;
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, d = a + NX, e = d + 1; index.set([a, d, b, b, d, e], n); n += 6; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeVertexNormals(); g.computeBoundingSphere();
  const mat = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.97, metalness: 0});
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'marlow-terrain'; mesh.receiveShadow = true; root.add(mesh);
  counts.terrainVertices = NX * NZ;
}

// ---------------------------------------------------------------- river
// A ribbon along the layout's centreline, a little wider than the channel so the banks close over its edges.
// The shader reflects the shared dusk sky (SKY_GLSL), so the water is brightest toward the sunset, and draws the
// reflected streaks of the nearest lamps (bridge, riverside, plant) toward the camera.
function buildRiver(world, atmosphere, lamps, camLocal, counts) {
  const {root, updates} = world;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < RIVER.length; i++) {
    const p = RIVER[i], q = RIVER[Math.min(RIVER.length - 1, i + 1)], o = RIVER[Math.max(0, i - 1)];
    let tx = q.x - o.x, tz = q.z - o.z; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
    const w = p.half + 0.04 + (p.z < -46 ? (-46 - p.z) * 0.01 : 0);
    const y = WATER - dropAt(p.z);
    pos.push(p.x - tz * w, y, p.z + tx * w, p.x + tz * w, y, p.z - tx * w);
    uv.push(0, p.s, 1, p.s);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  // Lamps that reflect: those within reach of the water, brightest first (at most 32).
  const near = lamps.map(l => ({...l, d: riverQuery(l.x, l.z)})).filter(l => l.d.d < l.d.half + 2.2).slice(0, 32);
  while (near.length < 32) near.push({x: 0, y: -50, z: 0, color: [0, 0, 0]});
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: {value: 0}, uCam: {value: new THREE.Vector3()},
    uLamps: {value: near.map(l => new THREE.Vector3(l.x, l.y, l.z))}, uLampColors: {value: near.map(l => new THREE.Vector3(...l.color))},
  }]);
  Object.assign(uniforms, atmosphere.uniforms);
  const mat = new THREE.ShaderMaterial({
    name: 'marlow-river', uniforms, fog: true, transparent: false,
    vertexShader: `varying vec3 vLocal;varying vec2 vUv;${FOG_PARS_V}
      void main(){vLocal=position;vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;${FOG_V}}`,
    fragmentShader: `${SKY_GLSL}
      uniform float uTime;uniform vec3 uCam;uniform vec3 uLamps[32];uniform vec3 uLampColors[32];varying vec3 vLocal;varying vec2 vUv;${FOG_PARS_F}
      float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float n1(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);}
      void main(){
        // Flow runs down the ribbon (vUv.y is arc length upstream to downstream); ripples advect with it.
        vec2 f=vec2(vUv.x*3.,vUv.y*1.6-uTime*.55);
        float a=n1(f*2.1),b=n1(f*5.3+vec2(3.,uTime*.3)),c=n1(f*13.+7.);
        vec3 nrm=normalize(vec3((a-.5)*.16+(b-.5)*.08+(c-.5)*.03,1.,(b-.5)*.12+(c-.5)*.04));
        vec3 eye=normalize(uCam-vLocal),r=reflect(-eye,nrm);
        float fres=.04+.96*pow(1.-max(dot(nrm,eye),0.),5.);
        vec3 sky=skyColor(vec3(r.x,max(r.y,.02),r.z),false);
        vec3 deep=vec3(.004,.012,.03);
        vec3 tint=vec3(.05,.16,.55);vec3 col=mix(deep,sky*1.4+tint*.55,clamp(fres*1.1+.3,0.,1.));
        // Lamp streaks: each lamp's mirror image seen in the water, stretched toward the eye by the ripples.
        for(int i=0;i<32;i++){vec3 L=uLamps[i];if(L.y<-10.)continue;vec3 m=vec3(L.x,2.*${WATER.toFixed(3)}-L.y,L.z);
          vec3 d=m-uCam;float t=(${WATER.toFixed(3)}-uCam.y)/d.y;vec3 q=uCam+d*t;vec2 toward=normalize((uCam-q).xz+1e-4),side=vec2(-toward.y,toward.x);
          vec2 rel=vLocal.xz-q.xz;float along=dot(rel,toward),across=dot(rel,side)+(a-.5)*.05;
          float streak=exp(-across*across/.0016)*exp(-max(along,0.)*1.6)*exp(-max(-along,0.)*9.)*(.55+.45*b);
          col+=uLampColors[i]*streak*1.6;}
        // A faint foam line where the water meets the bank.
        float edge=smoothstep(.0,.1,vUv.x)*smoothstep(1.,.9,vUv.x);col=mix(deep*2.,col,edge);
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        ${FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'marlow-river'; mesh.renderOrder = 1; root.add(mesh);
  updates.push(t => { uniforms.uTime.value = t; });
  // world.onCamera feeds camLocal every frame; the uniform reads it by reference.
  uniforms.uCam.value = camLocal;
  counts.riverSamples = RIVER.length; counts.riverLamps = near.filter(l => l.y > -10).length;
}

// ---------------------------------------------------------------- roads, lamps and light pools
function buildRoads(root, counts) {
  const lamps = [];
  const asphalt = new THREE.MeshStandardMaterial({color: lin(0.05, 0.045, 0.04), emissive: lin(0.55, 0.3, 0.09), emissiveIntensity: 0.55, roughness: 0.6, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
  const pos = [], idx = [];
  let lampId = 0;
  for (const [id, pts] of Object.entries(ROADS)) {
    const half = ROAD_WIDTH[id] / 2, base = pos.length / 3, L = pts[pts.length - 1].s, steps = Math.ceil(L / 0.18);
    for (let k = 0; k <= steps; k++) {
      const s = (k / steps) * L, p = roadAt(id, s), tx = Math.sin(p.heading), tz = Math.cos(p.heading), nx = tz, nz = -tx;
      const deck = bridgeDeck(p.x, p.z);
      for (const sgn of [-1, 1]) { const x = p.x + nx * half * sgn, z = p.z + nz * half * sgn; pos.push(x, deck ?? height(x, z) + 0.03, z); }
      if (k) { const a = base + (k - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    // Lamps alternate sides; the valley road is a country road and only the first stretch is lit.
    const lit = id === 'valley' ? Math.min(L, 6) : L, spacing = id === 'plant' ? 0.6 : LAMP_SPACING;
    for (let s = 0.2, side = 1; s < lit; s += spacing, side = -side) {
      const p = roadAt(id, s), nx = Math.cos(p.heading), nz = -Math.sin(p.heading), off = half + 0.08;
      const x = p.x + nx * off * side, z = p.z + nz * off * side, deck = bridgeDeck(p.x, p.z);
      if (deck == null && riverQuery(x, z).d < riverQuery(x, z).half + 0.1) continue;
      lamps.push({id: `lamp-${lampId++}`, road: id, x, z, ground: deck ?? height(x, z), y: (deck ?? height(x, z)) + 0.32, color: [1.0, 0.62, 0.26]});
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, asphalt); mesh.name = 'marlow-roads'; mesh.receiveShadow = true; root.add(mesh);
  counts.roads = Object.keys(ROADS).length;
  return lamps;
}
// Height of the bridge deck where the main road crosses the river, else null.
const DECK_Y = WATER + 0.42;
function bridgeDeck(x, z) {
  const b = PLACES.bridge;
  if (Math.hypot(x - b.x, z - b.z) > 3) return null;
  const r = riverQuery(x, z), out = r.d - r.half;
  if (out > 0.9) return null;
  return out < 0.25 ? DECK_Y : DECK_Y + (height(x, z) + 0.03 - DECK_Y) * smooth(0.25, 0.9, out);
}

// One instanced set for every lamp in the world: post, head (bloom) and a warm pool on the ground.
function buildLampLights(root, lamps, counts) {
  const n = lamps.length, m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.012, 1, 5), metal(0x1a1d22, 0.6, 0.5), n);
  const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({color: lin(4.2, 2.4, 0.9), toneMapped: false}), n);
  const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,190,110,1)'); r.addColorStop(0.35, 'rgba(255,150,70,.45)'); r.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const pool = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: poolTex, color: lin(0.9, 0.55, 0.25), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}), n);
  lamps.forEach((l, i) => {
    const h = l.y - l.ground;
    m.compose(p.set(l.x, l.ground + h / 2, l.z), q.identity(), s.set(1, h, 1)); post.setMatrixAt(i, m);
    m.compose(p.set(l.x, l.y, l.z), q.identity(), s.set(1, 1, 1)); head.setMatrixAt(i, m);
    const r = l.pool ?? 0.5; m.compose(p.set(l.x, l.ground + 0.035, l.z), q.identity(), s.set(r, 1, r)); pool.setMatrixAt(i, m);
  });
  post.name = 'marlow-lamp-posts'; head.name = 'marlow-lamp-heads'; pool.name = 'marlow-lamp-pools';
  pool.renderOrder = 2; pool.frustumCulled = head.frustumCulled = post.frustumCulled = false;
  root.add(post, head, pool);
  counts.lamps = n;
}

// ---------------------------------------------------------------- bridge
function buildBridge(root, lamps, counts) {
  const batch = makeBatch(root, 'marlow-bridge');
  const stone = new THREE.MeshStandardMaterial({color: lin(0.12, 0.11, 0.1), roughness: 0.9}), rail = metal(0x2a2e33, 0.5, 0.6);
  // Walk the main road and keep the stretch over the water.
  const span = [];
  const L = roadAt('main', 0).length;
  for (let s = 0; s < L; s += 0.1) { const p = roadAt('main', s); const r = riverQuery(p.x, p.z); if (r.d < r.half + 0.3) span.push({...p, s}); }
  const a = span[0], b = span[span.length - 1];
  const len = Math.hypot(b.x - a.x, b.z - a.z) + 0.5, mid = new THREE.Vector3((a.x + b.x) / 2, DECK_Y - 0.05, (a.z + b.z) / 2);
  const heading = Math.atan2(b.x - a.x, b.z - a.z), rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading);
  const deck = new THREE.BoxGeometry(0.46, 0.08, len); deck.applyQuaternion(rot); deck.translate(mid.x, mid.y, mid.z); batch.geometry(deck, stone);
  // Three piers with cutwaters, and parapets.
  for (const t of [-0.28, 0, 0.28]) {
    const x = mid.x + Math.sin(heading) * len * t, z = mid.z + Math.cos(heading) * len * t;
    const pier = new THREE.BoxGeometry(0.34, DECK_Y - WATER + 0.2, 0.14); pier.applyQuaternion(rot); pier.translate(x, (DECK_Y + WATER - 0.2) / 2 - 0.05, z); batch.geometry(pier, stone);
  }
  for (const side of [-1, 1]) {
    const nx = Math.cos(heading) * 0.23 * side, nz = -Math.sin(heading) * 0.23 * side;
    const parapet = new THREE.BoxGeometry(0.03, 0.07, len); parapet.applyQuaternion(rot); parapet.translate(mid.x + nx, DECK_Y + 0.03, mid.z + nz); batch.geometry(parapet, rail);
    // Bridge lamps, closer together than the street's.
    for (let t = -0.45; t <= 0.451; t += 0.15) {
      const x = mid.x + Math.sin(heading) * len * t + nx, z = mid.z + Math.cos(heading) * len * t + nz;
      lamps.push({id: `bridge-lamp-${lamps.length}`, road: 'bridge', x, z, ground: DECK_Y, y: DECK_Y + 0.3, color: [1, 0.66, 0.3], pool: 0.6});
    }
  }
  batch.finish();
  counts.bridgeLength = +len.toFixed(2);
  return {heading, mid, len};
}

// ---------------------------------------------------------------- the island
function buildIsland(root, lamps, counts) {
  // A small boathouse with a lit window and a jetty lamp: the last light before the river leaves the view.
  const batch = makeBatch(root, 'marlow-island');
  const y = height(ISLAND.x + 0.1, ISLAND.z + 0.6);
  batch.box(ISLAND.x + 0.1, y + 0.1, ISLAND.z + 0.6, 0.3, 0.2, 0.24, new THREE.MeshStandardMaterial({color: lin(0.14, 0.12, 0.1), roughness: 0.8}));
  batch.box(ISLAND.x + 0.1, y + 0.1, ISLAND.z + 0.73, 0.08, 0.06, 0.005, new THREE.MeshStandardMaterial({color: 0xffb060, emissive: 0xffa040, emissiveIntensity: 3}));
  batch.box(ISLAND.x + 0.75, WATER + 0.04, ISLAND.z + 1.1, 0.6, 0.03, 0.09, new THREE.MeshStandardMaterial({color: lin(0.08, 0.06, 0.05), roughness: 0.9}));
  batch.finish();
  lamps.push({id: 'island-lamp', road: 'island', x: ISLAND.x + 1.0, z: ISLAND.z + 1.1, ground: WATER + 0.05, y: WATER + 0.3, color: [1, 0.7, 0.35], pool: 0.4});
  counts.island = 1;
}

// ---------------------------------------------------------------- houses with lit windows
// Instanced bodies and hipped roofs. The window grid is drawn in the shader from each house's own size and position,
// so one draw call carries every lit and unlit pane in the valley.
function buildHouses(root, counts) {
  const n = HOUSES.length, m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  const bodyMat = new THREE.MeshStandardMaterial({roughness: 0.85, metalness: 0});
  bodyMat.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBoxPos;varying vec3 vBoxNormal;varying vec3 vBoxScale;varying vec3 vBoxOrigin;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBoxPos=position;vBoxNormal=normal;vBoxScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));vBoxOrigin=instanceMatrix[3].xyz;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBoxPos;varying vec3 vBoxNormal;varying vec3 vBoxScale;varying vec3 vBoxOrigin;\nfloat wHash(vec3 p){p=fract(p*.3183099+vec3(.11,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      if(abs(vBoxNormal.y)<.5){
        float u=(abs(vBoxNormal.x)>.5?vBoxPos.z*vBoxScale.z:vBoxPos.x*vBoxScale.x),v=(vBoxPos.y+.5)*vBoxScale.y;
        float cw=.085,ch=.1;vec2 cell=vec2(floor(u/cw),floor((v-.025)/ch));vec2 f=vec2(fract(u/cw),fract((v-.025)/ch));
        float pane=step(.28,f.x)*step(f.x,.72)*step(.25,f.y)*step(f.y,.72)*step(.025,v)*step(v,vBoxScale.y-.03);
        float r=wHash(vec3(cell,dot(vBoxOrigin,vec3(1.3,.7,2.1))+vBoxNormal.x*3.+vBoxNormal.z*5.));
        vec3 warm=mix(vec3(1.,.48,.15),vec3(1.,.66,.32),wHash(vec3(cell.yx,7.)));
        float lit=step(.55,r)*(.6+.8*wHash(vec3(cell,3.)));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.02,.025,.035),pane*.85);
        totalEmissiveRadiance+=vec3(.16,.08,.03)*(1.-pane)*smoothstep(vBoxScale.y,0.,v);
        totalEmissiveRadiance+=warm*pane*lit*2.2;
      }`);
  };
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bodyMat, n);
  const roofGeo = new THREE.ConeGeometry(0.7071, 1, 4, 1); roofGeo.rotateY(Math.PI / 4); roofGeo.translate(0, 0.5, 0);
  const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({roughness: 0.75, metalness: 0.1}), n);
  const walls = [[0.42, 0.36, 0.3], [0.48, 0.42, 0.34], [0.34, 0.22, 0.17], [0.5, 0.48, 0.44], [0.3, 0.3, 0.3]];
  const roofTones = [[0.2, 0.08, 0.05], [0.1, 0.1, 0.11], [0.16, 0.07, 0.05], [0.13, 0.13, 0.14]];
  HOUSES.forEach((h, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h.rot);
    m.compose(p.set(h.x, h.y + h.h / 2 - 0.04, h.z), q, s.set(h.w, h.h + 0.08, h.d)); bodies.setMatrixAt(i, m);
    m.compose(p.set(h.x, h.y + h.h - 0.001, h.z), q, s.set(h.w * 1.12, 0.14 + h.w * 0.12, h.d * 1.12)); roofs.setMatrixAt(i, m);
    const w = walls[Math.floor(h.tone * walls.length)]; bodies.setColorAt(i, c.setRGB(w[0] * 0.5, w[1] * 0.5, w[2] * 0.5));
    const r = roofTones[Math.floor(((h.tone * 13.7) % 1) * roofTones.length)]; roofs.setColorAt(i, c.setRGB(...r));
  });
  bodies.name = 'marlow-houses'; roofs.name = 'marlow-roofs';
  for (const o of [bodies, roofs]) { o.castShadow = o.receiveShadow = true; root.add(o); }
  counts.houses = n;
}

// ---------------------------------------------------------------- council chambers and clock tower
// Sandstone, floodlit from below, two storeys of arched windows and a clock tower whose hands tell the real time.
function buildCouncil(root, lamps, updates, counts) {
  const {x, z, top} = PLACES.council;
  const g = new THREE.Group(); g.name = 'marlow-council'; g.position.set(x, top, z); g.rotation.y = -0.5; g.scale.setScalar(1.45); root.add(g);
  const stone = new THREE.MeshStandardMaterial({color: lin(0.42, 0.3, 0.18), roughness: 0.8, emissive: lin(0.5, 0.28, 0.12), emissiveIntensity: 0.35});
  const roof = new THREE.MeshStandardMaterial({color: lin(0.06, 0.07, 0.08), roughness: 0.6, metalness: 0.3});
  const glow = new THREE.MeshStandardMaterial({color: 0xffc078, emissive: 0xffa850, emissiveIntensity: 2.6, roughness: 0.4});
  const add = (geo, mat, px, py, pz) => { const mesh = new THREE.Mesh(geo, mat); mesh.position.set(px, py, pz); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); return mesh; };
  add(new THREE.BoxGeometry(1.7, 0.46, 0.8), stone, 0, 0.23, 0);
  add(new THREE.BoxGeometry(1.78, 0.05, 0.88), stone, 0, 0.48, 0);
  const hip = new THREE.ConeGeometry(1, 1, 4, 1); hip.rotateY(Math.PI / 4);
  add(hip, roof, 0, 0.62, 0).scale.set(1.25, 0.26, 0.6);
  // Wings.
  for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.5, 0.36, 0.9), stone, sx * 1.05, 0.18, 0.12); add(hip.clone(), roof, sx * 1.05, 0.44, 0.12).scale.set(0.38, 0.17, 0.66); }
  // Portico: columns and a pediment.
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.022, 0.025, 0.36, 8), stone, -0.3 + i * 0.12, 0.18, 0.47);
  const ped = add(new THREE.ConeGeometry(0.42, 0.16, 3, 1), stone, 0, 0.44, 0.47); ped.rotation.set(Math.PI / 2, 0, 0); ped.scale.set(1, 0.18, 1); ped.rotation.z = Math.PI;
  // Arched windows, two rows, lit.
  for (const row of [0.12, 0.31]) for (let i = 0; i < 9; i++) { const w = add(new THREE.BoxGeometry(0.06, 0.1, 0.01), glow, -0.72 + i * 0.18, row, 0.405); if (Math.abs(-0.72 + i * 0.18) < 0.33 && row < 0.2) w.visible = false; }
  // The tower.
  const tx = -0.45, tz = 0;
  add(new THREE.BoxGeometry(0.3, 1.3, 0.3), stone, tx, 0.65, tz);
  add(new THREE.BoxGeometry(0.34, 0.05, 0.34), stone, tx, 1.31, tz);
  add(new THREE.BoxGeometry(0.26, 0.28, 0.26), stone, tx, 1.48, tz);
  const spire = add(new THREE.ConeGeometry(0.2, 0.42, 4, 1), roof, tx, 1.83, tz); spire.rotation.y = Math.PI / 4;
  // Belfry openings glow.
  for (const [ox, oz, ry] of [[0, 0.131, 0], [0, -0.131, 0], [0.131, 0, Math.PI / 2], [-0.131, 0, Math.PI / 2]]) { const b = add(new THREE.BoxGeometry(0.1, 0.16, 0.005), glow, tx + ox, 1.48, tz + oz); b.rotation.y = ry; }
  // Clock faces on all four sides with hands on real local time.
  const face = new THREE.MeshStandardMaterial({color: 0xfff1d6, emissive: 0xffe2b0, emissiveIntensity: 1.6}), hand = new THREE.MeshBasicMaterial({color: 0x15120f});
  const hands = [];
  for (const [ox, oz, ry] of [[0, 0.153, 0], [0, -0.153, Math.PI], [0.153, 0, Math.PI / 2], [-0.153, 0, -Math.PI / 2]]) {
    const f = new THREE.Group(); f.position.set(tx + ox, 1.06, tz + oz); f.rotation.y = ry; g.add(f);
    f.add(new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), face));
    const hh = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.055).translate(0, 0.024, 0.002), hand), mm = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.08).translate(0, 0.036, 0.003), hand);
    f.add(hh, mm); hands.push([hh, mm]);
  }
  updates.push(() => { const d = new Date(), mins = d.getMinutes() + d.getSeconds() / 60, hrs = (d.getHours() % 12) + mins / 60; for (const [hh, mm] of hands) { hh.rotation.z = -hrs / 12 * Math.PI * 2; mm.rotation.z = -mins / 60 * Math.PI * 2; } });
  // Floodlights on the lawn throw warm pools up the facade.
  const world = new THREE.Vector3();
  for (const [ox, oz] of [[-0.6, 0.9], [0.6, 0.9], [-1.2, 0.8], [1.2, 0.8]]) {
    world.set(ox, 0, oz).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y).add(g.position);
    lamps.push({id: `council-flood-${lamps.length}`, road: 'council', x: world.x, z: world.z, ground: top, y: top + 0.06, color: [1, 0.7, 0.4], pool: 1.4});
  }
  counts.council = 1;
}

// ---------------------------------------------------------------- the glass hall on the hill
function buildGlassHall(root, lamps, counts) {
  const {x, z, top} = PLACES.glass;
  const g = new THREE.Group(); g.name = 'marlow-glass-hall'; g.position.set(x, top, z); g.rotation.y = 0.35; root.add(g);
  const slab = new THREE.MeshStandardMaterial({color: lin(0.5, 0.5, 0.48), roughness: 0.6, emissive: lin(0.3, 0.26, 0.2), emissiveIntensity: 0.25});
  const glass = new THREE.MeshStandardMaterial({color: lin(0.35, 0.28, 0.2), emissive: lin(1, 0.58, 0.26), emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.3});
  const floors = [[1.5, 0.95], [1.3, 0.85], [1.05, 0.7]];
  floors.forEach(([w, d], i) => {
    const y = i * 0.2;
    const band = new THREE.Mesh(new THREE.BoxGeometry(w * 0.97, 0.15, d * 0.97), glass); band.position.y = y + 0.09; g.add(band);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.035, d), slab); plate.position.y = y + 0.18; g.add(plate);
  });
  for (const o of g.children) { o.castShadow = true; o.receiveShadow = true; }
  lamps.push({id: 'glass-flood', road: 'glass', x, z: z + 0.9, ground: top, y: top + 0.06, color: [1, 0.75, 0.45], pool: 1.6});
  counts.glassHall = 1;
}

// ---------------------------------------------------------------- treatment plant (Riverbend's own clarifiers)
// Repurposed: tanks.js builds three clarifiers at Riverbend's LAYOUT.tanks on a foundation at y 1.91. A proxy world
// carries them here: its root is a group moved so that datum lands on this plant's terrace.
function buildPlant(world, lamps, counts) {
  const {x, z, top} = PLACES.plant;
  const cx = LAYOUT.tanks.reduce((a, t) => a + t.x, 0) / 3, cz = LAYOUT.tanks.reduce((a, t) => a + t.z, 0) / 3;
  const group = new THREE.Group(); group.name = 'marlow-plant'; const S = 0.55;
  group.scale.setScalar(S); group.position.set(x - cx * S, top - 1.91 * S, z - cz * S); world.root.add(group);
  const proxy = {root: group, updates: world.updates, scene: world.scene, stats: {}, height: () => 1.84};
  buildTanks(proxy);
  // Two white digesters and a control building beside the clarifiers, floodlit like the reference image.
  const white = new THREE.MeshStandardMaterial({color: lin(0.62, 0.64, 0.66), roughness: 0.5, metalness: 0.2, emissive: lin(0.3, 0.32, 0.36), emissiveIntensity: 0.25});
  const batch = makeBatch(world.root, 'marlow-plant-buildings');
  batch.cylinder(x + 1.35, top + 0.3, z - 0.9, 0.32, 0.32, 0.6, white, 28);
  batch.cylinder(x + 1.35, top + 0.62, z - 0.9, 0.05, 0.32, 0.06, white, 28);
  batch.cylinder(x + 1.6, top + 0.24, z - 0.2, 0.26, 0.26, 0.48, white, 28);
  batch.cylinder(x + 0.4, top + 0.55, z - 1.3, 0.05, 0.05, 1.1, white, 10);
  batch.box(x - 1.2, top + 0.14, z - 1.0, 0.7, 0.28, 0.4, new THREE.MeshStandardMaterial({color: lin(0.3, 0.3, 0.3), roughness: 0.7}));
  batch.box(x - 1.2, top + 0.15, z - 0.79, 0.5, 0.06, 0.005, new THREE.MeshStandardMaterial({color: 0xbfe2ff, emissive: 0x9fd4ff, emissiveIntensity: 2.2}));
  batch.finish();
  for (const [ox, oz] of [[-1.6, 1.2], [1.8, 0.7], [0.2, -1.8], [-1.4, -1.5], [1.9, -1.4]]) lamps.push({id: `plant-flood-${lamps.length}`, road: 'plant', x: x + ox, z: z + oz, ground: top, y: top + 0.45, color: [0.85, 0.92, 1], pool: 1.1});
  counts.plant = 1;
}

// ---------------------------------------------------------------- power from Riverbend
// Repurposed: Riverbend's substation (electrical.js) on this world's datum, plus a line of pylons arriving from the
// front right, downstream, where the dam is.
function buildPower(world, counts) {
  const {x, z, top} = PLACES.substation, Y = LAYOUT.yard, S = 0.45;
  const group = new THREE.Group(); group.name = 'marlow-substation'; group.scale.setScalar(S);
  group.position.set(x - Y.x * S, top - Y.y * S, z - Y.z * S); world.root.add(group);
  buildElectrical({root: group, updates: world.updates, scene: world.scene, stats: {}, height: () => Y.y - 0.05});
  const steel = metal(0x5b6670, 0.5, 0.7), batch = makeBatch(world.root, 'marlow-line');
  const towers = [[x + 2.4, z + 3.2], [x + 5.5, z + 9], [x + 8.6, z + 15], [x + 12, z + 21]];
  const tops = [];
  for (const [px, pz] of towers) {
    const y = height(px, pz), H = 1.5;
    for (const [dx, dz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) batch.beam([px + dx * 1.6, y, pz + dz * 1.6], [px + dx * 0.4, y + H, pz + dz * 0.4], 0.012, steel, 4);
    batch.beam([px - 0.4, y + H - 0.1, pz], [px + 0.4, y + H - 0.1, pz], 0.015, steel, 4);
    tops.push([px, y + H - 0.12, pz]);
  }
  tops.unshift([x + 0.5, top + 0.55, z + 0.4]);
  for (let i = 0; i < tops.length - 1; i++) for (const off of [-0.36, 0.36]) {
    const a = new THREE.Vector3(tops[i][0] + off, tops[i][1], tops[i][2]), b = new THREE.Vector3(tops[i + 1][0] + off, tops[i + 1][1], tops[i + 1][2]);
    const midp = a.clone().lerp(b, 0.5); midp.y -= 0.18;
    const curve = new THREE.QuadraticBezierCurve3(a, midp, b);
    batch.geometry(new THREE.TubeGeometry(curve, 12, 0.006, 3, false), new THREE.MeshBasicMaterial({color: 0x30363d}));
  }
  batch.finish();
  counts.pylons = towers.length;
}

// ---------------------------------------------------------------- eucalypts
// Open, clumpy crowns on leaning trunks: three or four lumps, not a cone. Near trees are instanced with full crowns;
// the far band uses one lump each, in blue-black.
function eucalyptGeometry(lumps, seed) {
  const r = rng(seed), parts = [];
  for (let i = 0; i < lumps; i++) {
    const g = new THREE.IcosahedronGeometry(0.5, 1), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const nx = p.getX(k), ny = p.getY(k), nz = p.getZ(k), j = 0.82 + 0.3 * noise2(nx * 4 + i * 7 + seed, nz * 4 + ny * 3); p.setXYZ(k, nx * j, ny * j * 0.62, nz * j); }
    const sx = 0.32 + r() * 0.34;
    g.scale(sx * (0.8 + r() * 0.5), sx * (0.7 + r() * 0.6), sx * (0.8 + r() * 0.5)); g.translate((r() - 0.5) * 0.7, 0.5 + r() * 0.42, (r() - 0.5) * 0.7);
    parts.push(g);
  }
  const trunk = new THREE.CylinderGeometry(0.02, 0.045, 0.6, 5); trunk.translate(0.03, 0.3, 0); trunk.rotateZ(0.08);
  return {crown: mergeParts(parts), trunk};
}
function mergeParts(parts) {
  let count = 0; for (const g of parts) count += g.attributes.position.count;
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), idx = []; let o = 0;
  for (const g of parts) { const ng = g.index ? g.toNonIndexed() : g; ng.computeVertexNormals(); pos.set(ng.attributes.position.array, o * 3); nor.set(ng.attributes.normal.array, o * 3); for (let i = 0; i < ng.attributes.position.count; i++) idx.push(o + i); o += ng.attributes.position.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, o * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor.subarray(0, o * 3), 3)); return g;
}
function buildTrees(root, counts) {
  const r = rng(91), near = [], far = [];
  const houseGrid = new Map(); for (const h of HOUSES) { const k = `${Math.floor(h.x)},${Math.floor(h.z)}`; (houseGrid.get(k) || houseGrid.set(k, []).get(k)).push(h); }
  const nearHouse = (x, z) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const h of houseGrid.get(`${Math.floor(x) + i},${Math.floor(z) + j}`) || []) if (Math.hypot(h.x - x, h.z - z) < 0.42) return true; return false; };
  const clear = [[PLACES.council.x, PLACES.council.z, 1.9], [PLACES.plant.x, PLACES.plant.z, 2.5], [PLACES.substation.x, PLACES.substation.z, 1.8], [PLACES.glass.x, PLACES.glass.z, 1.4], [PLACES.square.x, PLACES.square.z, 0.9]];
  const tryTree = (x, z, list, minScale, maxScale, density) => {
    if (Math.hypot((x - ISLAND.x) / ISLAND.rx, (z - ISLAND.z) / ISLAND.rz) < 0.75) { list.push({x, z, y: height(x, z), s: minScale + r() * (maxScale - minScale), a: r() * 6.28, t: r()}); return; }
    const rv = riverQuery(x, z); if (rv.d < rv.half + 0.3) return;
    { const f = spurFrame(x, z); if (f.along > -6 && f.along < 15 && Math.abs(f.across) < 4.5) return; }
    if (roadDistance(x, z) < 0.3) return; if (clear.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) return; if (nearHouse(x, z)) return;
    const y = height(x, z);
    // Riparian belts along the banks, woods on the hills, scattered paddock trees on the floor.
    const riparian = Math.exp(-((rv.d - rv.half - 0.7) ** 2) / 0.35), hill = smooth(0.6, 2.2, y - FLOOR), clump = smooth(0.5, 0.75, fbm2(x * 0.18, z * 0.18, 3));
    const p = Math.min(1, 0.04 + riparian * 0.75 + hill * 0.55 + clump * 0.5) * density;
    if (r() > p) return;
    list.push({x, z, y, s: minScale + r() * (maxScale - minScale), a: r() * 6.28, t: r()});
  };
  for (let z = -50; z < 44; z += 0.42) for (let x = -34; x < 34; x += 0.42) tryTree(x + (r() - 0.5) * 0.4, z + (r() - 0.5) * 0.4, near, 0.38, 0.72, 0.9);
  for (let z = -125; z < -50; z += 1.0) for (let x = -70; x < 70; x += 1.0) tryTree(x + (r() - 0.5) * 1, z + (r() - 0.5) * 1, far, 0.7, 1.2, 0.85);
  // The island's own trees.
  for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = r() * 0.7; tryTree(ISLAND.x + Math.cos(a) * ISLAND.rx * d, ISLAND.z + Math.sin(a) * ISLAND.rz * d, near, 0.5, 0.8, 1); }
  const {crown, trunk} = eucalyptGeometry(6, 3);
  const farCrown = new THREE.IcosahedronGeometry(0.5, 0); farCrown.scale(1, 0.7, 1); farCrown.translate(0, 0.75, 0);
  const crownMat = new THREE.MeshStandardMaterial({roughness: 0.95, flatShading: false});
  const trunkMat = new THREE.MeshStandardMaterial({color: lin(0.2, 0.18, 0.16), roughness: 1});
  const place = (list, geo, mat, name, tint) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    list.forEach((t, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.a); m.compose(p.set(t.x, t.y - 0.03, t.z), q, s.set(t.s, t.s * (0.9 + t.t * 0.4), t.s)); mesh.setMatrixAt(i, m); if (tint) { tint(t, c); mesh.setColorAt(i, c); } });
    mesh.name = name; mesh.castShadow = name.includes('near'); mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  place(near, crown, crownMat, 'marlow-trees-near', (t, c) => c.setRGB(0.05 + t.t * 0.035, 0.075 + t.t * 0.03, 0.05 + t.t * 0.015));
  place(near, trunk, trunkMat, 'marlow-trunks-near');
  place(far, farCrown, crownMat.clone(), 'marlow-trees-far', (t, c) => c.setRGB(0.03 + t.t * 0.015, 0.045 + t.t * 0.02, 0.045 + t.t * 0.02));
  counts.treesNear = near.length; counts.treesFar = far.length;
}

// ---------------------------------------------------------------- the spur: rocks and big foreground gums
function buildSpur(root, counts) {
  const r = rng(707), rocks = [];
  for (let i = 0; i < 520; i++) {
    const along = -3 + r() * 16.5, across = (r() - 0.65) * 2 * (3.2 + Math.max(0, along) * 0.3), d = along / 3.5, x = PLACES.spur.x + PLACES.spur.fx * along - PLACES.spur.fz * across, z = PLACES.spur.z + PLACES.spur.fz * along + PLACES.spur.fx * across;
    rocks.push({x, z, s: (0.06 + r() * 0.34 * Math.max(0.2, 1 - Math.abs(d) / 5)) * Math.min(1, Math.max(0.12, (along + 4) / 9)), a: r() * 6.28, t: r()});
  }
  const geo = new THREE.DodecahedronGeometry(1, 0), p = geo.attributes.position;
  for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), j = 0.7 + 0.55 * noise2(x * 1.9 + 4, z * 1.9 + y * 1.3); p.setXYZ(k, x * j * 1.3, y * j * 0.5, z * j); }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({roughness: 0.95, metalness: 0, flatShading: true});
  mat.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRockP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockP=position*3.;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRockP;float rh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}')
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat lich=rh(floor(vRockP*2.))*.5+rh(floor(vRockP*5.))*.5;diffuseColor.rgb*=mix(.7,1.25,lich);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.12,.08),step(.82,lich)*.5);');
  };
  const mesh = new THREE.InstancedMesh(geo, mat, rocks.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), c = new THREE.Color();
  rocks.forEach((k, i) => { q.setFromEuler(new THREE.Euler((k.t - 0.5) * 0.4, k.a, (k.t - 0.5) * 0.3)); m.compose(v.set(k.x, height(k.x, k.z) + k.s * 0.18, k.z), q, s.set(k.s, k.s, k.s)); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.setRGB(0.045 + k.t * 0.03, 0.044 + k.t * 0.028, 0.045 + k.t * 0.025)); });
  mesh.name = 'marlow-spur-rocks'; mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
  // Tussock grass between the rocks, its tips catching the last warm light.
  const tuftGeo = new THREE.ConeGeometry(0.02, 0.16, 3, 1, true); tuftGeo.translate(0, 0.07, 0);
  const tuftMat = new THREE.MeshStandardMaterial({color: lin(0.09, 0.08, 0.035), emissive: lin(0.12, 0.07, 0.02), emissiveIntensity: 0.4, roughness: 1, side: THREE.DoubleSide});
  const tuftCount = 7000, tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftCount);
  for (let i = 0; i < tuftCount; i++) {
    const along = -3 + r() * 17.3, across = (r() - 0.6) * 2 * (3.6 + Math.max(0, along) * 0.35), x = PLACES.spur.x + PLACES.spur.fx * along - PLACES.spur.fz * across, z = PLACES.spur.z + PLACES.spur.fz * along + PLACES.spur.fx * across;
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5)); const k = (0.6 + r() * 1.1) * Math.min(1, Math.max(0.15, (along + 4) / 9));
    m.compose(v.set(x, height(x, z) - 0.02, z), q, s.set(k, k * (0.7 + r() * 0.8), k)); tufts.setMatrixAt(i, m);
  }
  tufts.name = 'marlow-spur-grass'; root.add(tufts);
  // Two big gums on the spur, at the left edge of the opening view: a recursive branching trunk with hundreds of small
  // leaf clumps at the twig ends, so the crown reads as a gum's open, ragged canopy against the sky, not a ball.
  const bark = new THREE.MeshStandardMaterial({color: lin(0.05, 0.045, 0.04), roughness: 0.95});
  const leafMat = new THREE.MeshStandardMaterial({color: lin(0.03, 0.045, 0.03), roughness: 0.95, side: THREE.DoubleSide});
  const limbs = [], clumps = [];
  const grow = (gr, from, dir, len, radius, depth) => {
    const to = from.clone().addScaledVector(dir, len);
    limbs.push([from, to, radius, radius * 0.62]);
    if (depth === 0 || len < 0.14) { for (let j = 0; j < 34; j++) clumps.push({p: to.clone().add(new THREE.Vector3((gr() - 0.5) * 0.5, (gr() - 0.6) * 0.3, (gr() - 0.5) * 0.5)), s: 0.022 + gr() * 0.022, a: gr() * 6.28, b: (gr() - 0.5) * 2.4}); return; }
    const kids = depth > 2 ? 2 : 3;
    for (let k = 0; k < kids; k++) {
      const spread = 0.45 + gr() * 0.5;
      // Keep the crown out to the left of the opening view: limbs that would cross into the frame are turned back.
      let d;
      for (let tries = 0; tries < 6; tries++) { const yaw = gr() * Math.PI * 2; d = dir.clone().applyAxisAngle(new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw)), spread); if (d.x * 0.952 - d.z * 0.306 < 0.42) break; }
      d.y = Math.max(d.y, 0.05) * (0.8 + gr() * 0.3); d.normalize();
      grow(gr, to, d, len * (0.62 + gr() * 0.18), radius * 0.62, depth - 1);
    }
  };
  for (const [gx, gz, H, lean, seed] of [[8.3, 27.7, 1.8, 0.04, 11], [9.0, 29.0, 1.5, 0.04, 12]]) {
    const gr = rng(seed), base = new THREE.Vector3(gx, height(gx, gz) - 0.1, gz);
    grow(gr, base, new THREE.Vector3(lean, 1, -0.08).normalize(), H, 0.07, 7);
  }
  const limbGeo = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true), limbMesh = new THREE.InstancedMesh(limbGeo, bark, limbs.length);
  const lm = new THREE.Matrix4(), lq = new THREE.Quaternion(), ls = new THREE.Vector3(), lp = new THREE.Vector3(), upv = new THREE.Vector3(0, 1, 0);
  limbs.forEach(([a0, b0, r0], i) => { const d = b0.clone().sub(a0); lq.setFromUnitVectors(upv, d.clone().normalize()); lm.compose(lp.copy(a0).add(b0).multiplyScalar(0.5), lq, ls.set(r0, d.length(), r0)); limbMesh.setMatrixAt(i, lm); });
  // A gum leaf: a narrow hanging diamond, two triangles.
  const clumpGeo = new THREE.BufferGeometry();
  clumpGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.22, -0.5, 0, 0, -1.6, 0, -0.22, -0.5, 0], 3)); clumpGeo.setIndex([0, 1, 2, 0, 2, 3]); clumpGeo.computeVertexNormals();
  const clumpMesh = new THREE.InstancedMesh(clumpGeo, leafMat, clumps.length);
  clumps.forEach((c, i) => { lq.setFromEuler(new THREE.Euler(c.b * 0.4, c.a, c.b)); lm.compose(c.p, lq, ls.set(c.s, c.s, c.s)); clumpMesh.setMatrixAt(i, lm); });
  limbMesh.name = 'marlow-spur-gum-limbs'; clumpMesh.name = 'marlow-spur-gum-leaves';
  for (const o of [limbMesh, clumpMesh]) { o.castShadow = true; o.frustumCulled = false; root.add(o); }
  counts.gumLeafClumps = clumps.length;
  counts.spurRocks = rocks.length;
}

// ---------------------------------------------------------------- distant ranges
// Three ridgelines far down the valley, beyond where the land falls away: plain dark curtains the fog turns blue, each
// layer paler than the one in front. From the lookout their tops sit just under the sunset band, as in the reference.
function buildRanges(root, counts) {
  const mat = new THREE.MeshStandardMaterial({color: lin(0.02, 0.03, 0.06), roughness: 1});
  const layers = [[-96, 0.6, 4.2, 1], [-106, 0.4, 5.0, 2], [-114, 0.2, 5.8, 3]];
  for (const [z0, base, amp, seed] of layers) {
    const pos = [], idx = [], N = 140;
    for (let i = 0; i <= N; i++) {
      const x = -150 + (i / N) * 300, z = z0 + Math.sin(x * 0.02 + seed) * 6;
      const top = base + amp * (fbm2(x * 0.025 + seed * 9, seed * 3.1, 4) - 0.25) * 1.6;
      pos.push(x, top, z, x, -40, z);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'marlow-range'; mesh.material.side = THREE.DoubleSide; root.add(mesh);
  }
  counts.ranges = layers.length;
}

// ---------------------------------------------------------------- mist
// Low banks of drifting mist on the river and in the far valleys: noise-alpha sheets, fog-aware, no depth writes.
function buildMist(root, updates, counts) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uTime: {value: 0}, uColor: {value: lin(0.36, 0.42, 0.7)}}]);
  const mat = new THREE.ShaderMaterial({
    name: 'marlow-mist', uniforms, transparent: true, depthWrite: false, fog: true,
    vertexShader: `varying vec2 vUv;varying vec3 vP;${FOG_PARS_V}void main(){vUv=uv;vP=(modelMatrix*vec4(position,1.)).xyz;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;${FOG_V}}`,
    fragmentShader: `uniform float uTime;uniform vec3 uColor;varying vec2 vUv;varying vec3 vP;${FOG_PARS_F}
      float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
      float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=n(p)*a;p=p*2.1+3.;a*=.5;}return v;}
      void main(){vec2 p=vP.xz*.16+vec2(uTime*.012,uTime*.004);float m=fb(p)*fb(p*.5+7.);
        float edge=smoothstep(0.,.25,vUv.x)*smoothstep(1.,.75,vUv.x)*smoothstep(0.,.3,vUv.y)*smoothstep(1.,.7,vUv.y);
        float a=smoothstep(.2,.48,m)*edge*.34;gl_FragColor=vec4(uColor,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        ${FOG_F}}`,
  });
  // Sheets follow the river's middle and far reaches, plus a few across the far valleys.
  const sheets = [];
  for (let i = 0; i < RIVER.length; i += 9) { const p = RIVER[i]; if (p.z > -12 || p.z < -130) continue; sheets.push([p.x, WATER - dropAt(p.z) + 0.25 + (p.z < -50 ? 0.6 : 0), p.z, 9 + (-p.z) * 0.08, 6 + (-p.z) * 0.05]); }
  for (const [x, z, y] of [[-25, -62, 1.6], [18, -72, 2.4], [-40, -92, 3.4], [8, -104, 4.2], [30, -58, 2.2], [-6, -52, 1.2], [-16, -15, 0.75], [-13, -27, 0.8], [-20, -36, 1.0]]) sheets.push([x, y - dropAt(z), z, 26, 14]);
  for (const [x, y, z, w, d] of sheets) { const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2); const mesh = new THREE.Mesh(g, mat); mesh.position.set(x, y, z); mesh.renderOrder = 3; mesh.name = 'marlow-mist'; root.add(mesh); }
  updates.push(t => { uniforms.uTime.value = t; });
  counts.mistSheets = sheets.length;
}

// ---------------------------------------------------------------- traffic
// Cars with headlights and tail lights run the lit roads; positions are a pure function of time.
function buildTraffic(root, updates, bridge, counts) {
  const cars = [];
  const plan = [['main', 4, 0.55], ['riverside', 3, 0.5], ['estate', 2, 0.45], ['ring', 2, 0.4], ['valley', 2, 0.7]];
  let seed = 0;
  for (const [road, n, speed] of plan) for (let i = 0; i < n; i++) cars.push({road, speed: speed * (0.85 + ((seed * 0.37) % 0.3)), phase: (i / n) + seed++ * 0.13, back: i % 2 === 1});
  const n = cars.length;
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.06, 0.2), new THREE.MeshStandardMaterial({roughness: 0.4, metalness: 0.6}), n);
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.015, 0.01), new THREE.MeshBasicMaterial({color: lin(6, 5.5, 4.5), toneMapped: false}), n);
  const tail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.015, 0.01), new THREE.MeshBasicMaterial({color: lin(3.5, 0.15, 0.08), toneMapped: false}), n);
  const tones = [[0.5, 0.52, 0.55], [0.05, 0.05, 0.06], [0.35, 0.05, 0.04], [0.6, 0.6, 0.62], [0.08, 0.12, 0.25]], c = new THREE.Color();
  cars.forEach((car, i) => body.setColorAt(i, c.setRGB(...tones[i % tones.length])));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), off = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const o of [body, head, tail]) { o.frustumCulled = false; root.add(o); }
  body.name = 'marlow-cars'; head.name = 'marlow-headlights'; tail.name = 'marlow-taillights'; body.castShadow = true;
  const place = t => {
    cars.forEach((car, i) => {
      const L = roadAt(car.road, 0).length, u = ((t * car.speed / L + car.phase) % 1 + 1) % 1, s = (car.back ? 1 - u : u) * L;
      const at = roadAt(car.road, s), side = car.back ? -0.07 : 0.07, nx = Math.cos(at.heading), nz = -Math.sin(at.heading);
      const x = at.x + nx * side, z = at.z + nz * side, deck = bridgeDeck(x, z), y = (deck ?? height(x, z)) + 0.06;
      q.setFromAxisAngle(up, at.heading + (car.back ? Math.PI : 0));
      m.compose(p.set(x, y, z), q, one); body.setMatrixAt(i, m);
      m.compose(p.set(x, y, z).add(off.set(0, 0.005, 0.102).applyQuaternion(q)), q, one); head.setMatrixAt(i, m);
      m.compose(p.set(x, y, z).add(off.set(0, 0.008, -0.102).applyQuaternion(q)), q, one); tail.setMatrixAt(i, m);
    });
    body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = tail.instanceMatrix.needsUpdate = true;
  };
  place(0); updates.push(t => place(t));
  counts.cars = n;
}

// Generic names the shared viewer loads every extra world by.
export {createMarlowValeScene as createWorld, MARLOW_SEED as WORLD_SEED, MARLOW_VIEWS as WORLD_VIEWS};
