import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {buildNetwork, P, BOARD_Y} from './lab/rigs/splunk-net.js';

// Inside the network: the seventh AI Lab world (id `splunk`). The owner's brief (28 Oct 2026): Splunk watches the whole
// network, from the campus to the data centres to the SaaS apps (via ThousandEyes); at 10:00 it forecasts the South
// data centre's SAP instance hitting 80 % by 10:30 and an outage at 11:00; its AI agent finds a North/South imbalance and
// asks to move a smaller site to the North data centre with the load balancers; the network team approves and the
// outage never happens. The world plays that story on a loop; the exhibit (lab/kits/splunk.sap-forecast.js) tells it in
// four chapters. Shared rig: lab/rigs/splunk-net.js (layout, utilisation model, flows, panel and cards).
//
// FIXED LAYOUT (lab markers in lab/recipes/splunk.*.js anchor to these world points; keep them in step):
//   board built in local units, scaled S = 1.55, origin at world (0, Y0, BOARD_Z); world = (x*S, Y0 + y*S, BOARD_Z + z*S)
//   South data centre centre local (3.6, 0, -2.25)  -> world (5.58, 0.05, -4.49); forecast panel -> world (5.58, 2.83, -6.43)
//   load balancers local (0, 0, -0.35) -> world (0, 0.05, -1.54); Splunk ring local (0, 3.35, 0.35) -> world (0, 5.15, -0.46)
export const SPLUNK_SEED = 281026;
export const S = 1.55;
const Y0 = -0.04, BOARD_Z = -1;
export const toWorld = ([x, y, z]) => [x * S, Y0 + y * S, BOARD_Z + z * S];

// Views for the shared viewer (distance is about 36 / zoom on a desktop screen). Azimuth 0 looks from the front (+z).
const SPLUNK_VIEWS_BASE = {
  hero: {yaw: 0, target: [0.3, 0.9, -0.2], zoom: 1.04, tilt: 0.7, azimuth: 0.3, fov: 34},
  sap: {yaw: 0, target: [5.2, 2.0, -4.6], zoom: 2.7, tilt: 0.42, azimuth: 0.28, fov: 36},
  balancers: {yaw: 0, target: [0, 1.2, -1.2], zoom: 2.6, tilt: 0.62, azimuth: -0.25, fov: 36},
  sites: {yaw: 0, target: [-1.5, 1.2, 3.2], zoom: 2.1, tilt: 0.55, azimuth: 0.15, fov: 36},
  splunk: {yaw: 0, target: [0, 4.4, -0.6], zoom: 2.0, tilt: 0.3, azimuth: 0.5, fov: 36},
  core: {yaw: 0, target: [-3.4, 1.0, 1.0], zoom: 3.0, tilt: 0.5, azimuth: -0.2, fov: 36},
  internet: {yaw: 0, target: [-9.4, 2.4, -0.6], zoom: 2.3, tilt: 0.36, azimuth: -0.75, fov: 36},
};
export const SPLUNK_VIEWS = Object.fromEntries(Object.entries(SPLUNK_VIEWS_BASE).map(([id, v]) => [id, {...v, portraitZoom: id === 'hero' ? 1.15 : 1.3}]));

// Night city glow for the glass and metal (no image asset).
function nightEnvironment() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#060b18'); grad.addColorStop(0.45, '#13243f'); grad.addColorStop(0.55, '#3a1a3a'); grad.addColorStop(0.62, '#0b1424'); grad.addColorStop(1, '#03060c');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = i % 3 ? 'rgba(25,211,255,.5)' : 'rgba(255,63,174,.45)'; g.fillRect((i * 83) % 512, 120 + (i * 7) % 18, 2, 2); }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * Math.min(1, Math.max(0, u));

// The story on a 50 s loop, as clock minutes after 09:00 and the rig's state. Same beats as the exhibit.
const CYCLE = 50;
function storyAt(s) {
  const clock = s < 6 ? lerp(52, 60, s / 6) : s < 23 ? lerp(60, 64, (s - 6) / 17) : lerp(64, 120, (s - 23) / 17);
  return {
    clock,
    redirectAt: s >= 23.5 ? 64.4 : null,
    forecast: smooth(6.4, 8.4, s),
    alert: s >= 6 ? 1 : 0,
    agent: s >= 14 ? (s >= 21.5 ? 'approved' : 'propose') : null,
    ghost: smooth(15, 16, s) * (1 - smooth(21.5, 22, s)),
    focus: smooth(14.5, 15.5, s) * (1 - smooth(23, 24, s)),
    approve: smooth(21.6, 22, s) * (1 - smooth(23.6, 24.4, s)),
    done: smooth(40, 41, s) * (1 - smooth(48.5, 49.5, s)),
  };
}

export function createSplunkScene() {
  const world = createWorldShell(SPLUNK_SEED);
  const {root, scene} = world;
  world.stats.stage = 'splunk';

  // ---------------------------------------------------------------- night lighting: cool key, magenta and cyan rims
  const oldEnv = scene.environment;
  scene.environment = nightEnvironment();
  scene.environmentIntensity = 0.6;
  world.extraTextures = world.extraTextures.filter(t => t !== oldEnv).concat(scene.environment);
  oldEnv.dispose();
  for (const light of scene.children) {
    if (light.isHemisphereLight) { light.color.set(0x9fc8ff); light.groundColor.set(0x0b1220); light.intensity = 0.9; }
    else if (light === world.key) { light.color.set(0xdfeaff); light.intensity = 2.2; light.position.set(-7, 18, 11); }
    else if (light.isDirectionalLight && light.color.b > light.color.r) { light.color.set(0x2fb8ff); light.intensity = 1.6; light.position.set(6, 7, -12); }
    else if (light.isDirectionalLight) { light.color.set(0xff3fae); light.intensity = 0.9; light.position.set(12, 6, 6); }
  }

  // ---------------------------------------------------------------- kit shim (the rig builds straight into the world)
  const holder = new THREE.Group();
  holder.name = 'splunk-holder';
  root.add(holder);
  const kmat = (color, opts = {}) => new THREE.MeshStandardMaterial({color, roughness: 0.65, ...opts});
  const kmesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; holder.add(o); return o; };
  const track = r => { if (r?.isTexture) world.extraTextures.push(r); return r; };
  const k = {THREE, root: holder, mat: kmat, mesh: kmesh, track,
    box: (w, h, d, m, x, y, z) => kmesh(new THREE.BoxGeometry(w, h, d), m, x, y, z),
    cylinder: (r, len, m, x, y, z) => kmesh(new THREE.CylinderGeometry(r, r, len, 16), m, x, y, z)};

  const net = buildNetwork(k, {parent: holder, scale: S, y: Y0, z: BOARD_Z, detail: 'world'});

  world.updates.push(t => {
    const s = ((t % CYCLE) + CYCLE) % CYCLE;
    net.update(t, storyAt(world.storyNow != null ? world.storyNow : s));
  });

  // ---------------------------------------------------------------- pins for the standalone wrapper
  const pin = (p, dy = 0) => new THREE.Vector3(...toWorld(p)).add(new THREE.Vector3(0, dy, 0));
  world.hotspots = [
    {id: 'sap', label: 'SAP, South data centre', caption: 'Splunk forecasts the SAP instance here hitting 80% by 10:30, and an outage at 11:00.', view: 'sap', anchor: pin([P.south[0], 1.6, P.south[1]], 0.4)},
    {id: 'balancers', label: 'Load balancers', caption: 'The load balancers decide which data centre serves each site. One approved change moves Riverside north.', view: 'balancers', anchor: pin([P.hub[0], 1.3, P.hub[1]])},
    {id: 'sites', label: 'Campus and sites', caption: 'ThousandEyes agents at every site test the paths to the data centres and the SaaS apps.', view: 'sites', anchor: pin([P.sites.campus[0], 1.9, P.sites.campus[1]])},
    {id: 'internet', label: 'Internet edge', caption: 'The board is your network; the providers float beyond its edge. ThousandEyes shows which side a slowdown is on.', view: 'internet', anchor: pin([P.edge[0], 1.5, P.edge[1]])},
    {id: 'splunk', label: 'Splunk', caption: 'Every device streams telemetry to Splunk: one place to see the campus, the data centres and SaaS.', view: 'splunk', anchor: pin([P.ring[0], P.ring[1] + 0.7, P.ring[2]])},
  ];

  world.height = () => Y0 + BOARD_Y * S;
  world.splunk = {net, toWorld, storyAt, views: Object.keys(SPLUNK_VIEWS)};
  return world;
}

// Generic names the shared viewer loads every extra world by.
export {createSplunkScene as createWorld, SPLUNK_SEED as WORLD_SEED, SPLUNK_VIEWS as WORLD_VIEWS};
