import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {buildMeetingRoom, speechRibbon, ACCENT, P} from './lab/rigs/cisco-room.js';

// The Town Hall room: the sixth AI Lab world (id `meeting`). A presenter-and-audience meeting room at dusk with the
// three Cisco Pro room devices the exhibits are about: two Room Vision PTZ cameras, two Ceiling Microphone Pros and four
// Ceiling Speaker Pros, each on ONE cable along the open cable tray into the credenza, where the Room Kit Pro G2 (the
// room engine) and a PoE switch sit behind glass. Roof off; the devices hang from the tray on drop rods, as in an
// exposed-ceiling office, so the opening camera sees them over the table and the audience.
// Plan: docs/three-worlds/MEETING-ROOM-LAB-PLAN.md. Shared rig (also used by the exhibit kits): lab/rigs/cisco-room.js.
//
// FIXED LAYOUT (lab markers in lab/recipes/meeting.*.js anchor to these world points; keep them in step):
//   room built in metres, scaled S = 1.6, origin at world (0, FLOOR, ROOM_Z); world = (x*S, FLOOR + y*S, ROOM_Z + z*S)
//   front Ceiling Microphone Pro room (0, 2.42, -1.0)  -> world (0, 4.07, -2.6)
//   rear Room Vision PTZ        room (0, 2.42, 4.0)   -> world (0, 4.07, 5.4)
//   front-left Ceiling Speaker Pro room (-2.3, 2.45, -1.7) -> world (-3.68, 4.12, -3.72)
//   credenza / Room Kit Pro G2  room (0, 0.45, -3.95) -> world (0, 0.92, -7.32)
export const MEETING_SEED = 261026;
export const FLOOR = 0.2;
export const S = 1.6;
const ROOM_Z = -1;
export const toWorld = ([x, y, z]) => [x * S, FLOOR + y * S, ROOM_Z + z * S];

// Views for the shared viewer (distance is about 36 / zoom on a desktop screen). Azimuth 0 looks from the open back.
const MEETING_VIEWS_BASE = {
  hero: {yaw: 0, target: [0.2, 1.8, -1.6], zoom: 1.38, tilt: 0.6, azimuth: 0.36, fov: 36},
  camera: {yaw: 0, target: [1.6, 2.6, 0.6], zoom: 2.6, tilt: 0.34, azimuth: -0.35, fov: 38},
  mic: {yaw: 0, target: [0, 2.6, -2.4], zoom: 2.9, tilt: 0.3, azimuth: 0.75, fov: 38},
  speakers: {yaw: 0, target: [-1.2, 3.1, -1.2], zoom: 2.3, tilt: 0.36, azimuth: 0.45, fov: 38},
  engine: {yaw: 0, target: [0, 1.0, -7.15], zoom: 4.3, tilt: 0.56, azimuth: 0.16, fov: 38},
};
export const MEETING_VIEWS = Object.fromEntries(Object.entries(MEETING_VIEWS_BASE).map(([id, v]) => [id, {...v, portraitZoom: id === 'hero' ? 1.2 : 1.35}]));

// Dusk city glow for reflections on the glass, walnut and the displays (no image asset).
function duskEnvironment() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1d2338'); grad.addColorStop(0.38, '#6a4a5a'); grad.addColorStop(0.5, '#e09a62'); grad.addColorStop(0.6, '#3a2c28'); grad.addColorStop(1, '#151210');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,${200 + (i % 40)},140,${0.25 + (i % 5) * 0.1})`; g.fillRect((i * 97) % 512, 118 + (i * 13) % 20, 2, 2); }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createMeetingScene() {
  const world = createWorldShell(MEETING_SEED);
  const {root, scene} = world;
  world.stats.stage = 'meeting';

  // ---------------------------------------------------------------- executive dusk lighting
  const oldEnv = scene.environment;
  scene.environment = duskEnvironment();
  scene.environmentIntensity = 0.55;
  world.extraTextures = world.extraTextures.filter(t => t !== oldEnv).concat(scene.environment);
  oldEnv.dispose();
  for (const light of scene.children) {
    if (light.isHemisphereLight) { light.color.set(0xfff3e6); light.groundColor.set(0x6a5c50); light.intensity = 1.45; }
    else if (light === world.key) { light.color.set(0xfff2df); light.intensity = 2.7; light.position.set(-5, 20, 10); }
    else if (light.isDirectionalLight && light.color.b > light.color.r) { light.color.set(0xb9cbff); light.intensity = 0.7; light.position.set(0, 9, -16); }
    else if (light.isDirectionalLight) { light.color.set(0xffb070); light.intensity = 0.7; light.position.set(16, 6, 3); }
  }
  const fill = new THREE.DirectionalLight(0xfff3e4, 0.45);
  fill.position.set(4, 10, 16);
  scene.add(fill);

  // ---------------------------------------------------------------- kit shim (the rig builds straight into the world)
  const holder = new THREE.Group();
  holder.name = 'meeting-holder';
  root.add(holder);
  const kmat = (color, opts = {}) => new THREE.MeshStandardMaterial({color, roughness: 0.65, ...opts});
  const kmesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; holder.add(o); return o; };
  const track = r => { if (r?.isTexture) world.extraTextures.push(r); return r; };
  const k = {THREE, root: holder, mat: kmat, mesh: kmesh, track,
    box: (w, h, d, m, x, y, z) => kmesh(new THREE.BoxGeometry(w, h, d), m, x, y, z),
    cylinder: (r, len, m, x, y, z) => kmesh(new THREE.CylinderGeometry(r, r, len, 16), m, x, y, z)};

  // A slab under the room so it stands on the plinth like the other worlds.
  // Its top stops 2 cm under the carpet: coplanar faces z-fight into stripes at some camera distances.
  const slab = kmesh(new THREE.BoxGeometry(P.W * S + 0.3, FLOOR + 0.03, P.D * S + 0.3), kmat(0x2a221d, {roughness: 0.75}), 0, (FLOOR - 0.06) / 2, ROOM_Z);
  slab.name = 'meeting-slab';
  // Devices are drawn 1.5x life size in the overview so they read from across the room (true size in the exhibits).
  const room = buildMeetingRoom(k, {parent: holder, y: FLOOR, z: ROOM_Z, scale: S, deviceScale: 1.5});

  // ---------------------------------------------------------------- the conversation: who talks when (a 30 s cycle)
  const ribbons = [0x5dff9a, 0xffb02e, 0x19d3ff].map(colour => speechRibbon(k, {parent: room.group, colour}));
  const seat = id => room.seats.find(s => s.id === id);
  const TALK = [ // [t0, t1, who]: a seat id, 'presenter' or a remote tile index (r0..r3)
    [0, 6, 'presenter'], [6.5, 10, 't2'], [10.5, 14, 'r1'], [14.5, 19, 'presenter'], [19.5, 23, 'r2-4'], [23.5, 29.5, 'presenter']];
  const CYCLE = 30;
  const presenterHead = () => { const p = room.presenter.group.position; return [p.x, 1.68, p.z]; };
  const headOf = who => who === 'presenter' ? presenterHead() : who.startsWith('r') && !who.includes('-') ? [P.displays.x[0], P.displays.y, P.displays.z + 0.1] : seat(who).head;
  const micFor = h => (h[2] > 1.2 ? P.micRear : P.micFront);

  // ---------------------------------------------------------------- one cable each: a heartbeat along all eight runs
  const cableIds = Object.keys(room.cables);

  world.updates.push(t => {
    const s = ((t % CYCLE) + CYCLE) % CYCLE;
    let now = null;
    for (const [a, b, who] of TALK) if (s >= a && s < b) now = {a, b, who};
    const level = now ? Math.min(1, (s - now.a) / 0.4, (now.b - s) / 0.4) : 0;
    // Everyone turns toward whoever is talking; the far-end tiles light when a remote person speaks.
    const focus = now ? headOf(now.who) : presenterHead();
    for (const q of room.seats) {
      if (!q.occupied || q.hero) continue;
      const dx = focus[0] - q.x, dz = focus[2] - q.z;
      let turn = Math.atan2(dx, dz) - q.ry; turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      room.crowd.pose(q.id, {turn: Math.max(-1.1, Math.min(1.1, turn)) + 0.05 * Math.sin(t * 0.4 + q.x), look: 0.12, lean: 0.06 + 0.03 * Math.sin(t * 0.3 + q.z)});
    }
    room.crowd.commit();
    // Ribbons: a voice in the room rises to its ceiling microphone; a remote voice comes out of the ceiling speakers.
    ribbons.forEach(r => r.draw([0, 0, 0], [0, 0, 0], 0, t));
    if (now && level > 0) {
      const h = headOf(now.who);
      if (now.who.startsWith('r') && !now.who.includes('-')) {
        ribbons[2].draw([h[0], h[1] + 0.4, h[2] + 0.05], P.spk[0].map((v, i) => v + (i === 1 ? -0.06 : 0)), level, t, {lift: 0.15});
      } else {
        ribbons[now.who === 'presenter' ? 0 : 1].draw([h[0], h[1] + 0.08, h[2]], micFor(h).map((v, i) => v + (i === 1 ? -0.05 : 0)), level, t, {lift: 0.1});
      }
    }
    // Presenter: stands by the lectern, turns between the room and the right-hand display while talking.
    const talking = now?.who === 'presenter' ? level : 0;
    room.presenter.group.rotation.y = -0.9 + 0.5 * Math.sin(t * 0.35);
    room.presenter.pose({distance: 0, weight: 0, look: 0.08, point: talking * Math.max(0, Math.sin(t * 0.5)) * 0.8, pointPitch: 1.2});
    room.farEnd(room.displays.left, {talk: now && now.who === 'r1' ? 1 : -1, self: 'wide'});
    // Devices: idle lights, a microphone glows while someone in the room talks, speakers while a remote voice plays.
    room.update(t);
    if (now && level > 0) {
      if (now.who.startsWith('r') && !now.who.includes('-')) room.devices.spk.forEach((d, i) => d.led(level * (i % 2 ? 0.6 : 1), t));
      else (micFor(headOf(now.who)) === P.micRear ? room.devices.micRear : room.devices.micFront).led(level, t);
    }
    // PTZ heads settle on the presenter (rear) and the room (front), with small corrections.
    room.devices.camRear.pan(-0.42 + 0.03 * Math.sin(t * 0.6));
    room.devices.camFront.pan(0.02 * Math.sin(t * 0.4));
    // Heartbeat: every 15 s the eight cables pulse once, one after another, into the credenza.
    const hb = ((t % 15) + 15) % 15;
    cableIds.forEach((id, i) => room.cables[id].update(t, hb > 11 && hb < 14.6 && hb > 11 + i * 0.25 ? 1 : 0));
  });

  // ---------------------------------------------------------------- walls give way to the camera
  const camPos = new THREE.Vector3();
  world.onCamera = camera => { camPos.copy(camera.position); room.onCamera(camPos); };

  // ---------------------------------------------------------------- pins for the standalone wrapper
  const pin = (p, dy = 0) => new THREE.Vector3(...toWorld(p)).add(new THREE.Vector3(0, dy, 0));
  world.hotspots = [
    {id: 'camera', label: 'Room Vision PTZ', caption: 'Room Vision PTZ: head detection on the camera; the room engine picks the shot.', view: 'camera', anchor: pin(P.camRear, 0.9)},
    {id: 'mic', label: 'Ceiling Microphone Pro', caption: 'Ceiling Microphone Pro: 64 microphones, 8 AI adaptive beams, noise removed on the device.', view: 'mic', anchor: pin(P.micFront, 0.9)},
    {id: 'speakers', label: 'Ceiling Speaker Pro', caption: 'Ceiling Speaker Pro: no amplifier rack. Power and audio on one cable; it tunes its own level and timing.', view: 'speakers', anchor: pin(P.spk[3], 0.7)},
    {id: 'engine', label: 'Room engine', caption: 'One cable each into the Room Kit Pro G2: power, control and audio over IP. No amplifier or DSP rack.', view: 'engine', anchor: pin([1.5, 0.75, -3.95], 0.2)},
  ];
  world.onHotspot = spot => {
    // The room engine pin runs the heartbeat at once so the eight cables light while the camera arrives.
    if (spot.id === 'engine') world.heartbeatNow = true;
  };

  world.height = () => FLOOR + P.table.top * S;
  world.meeting = {room, toWorld, views: Object.keys(MEETING_VIEWS)};
  return world;
}

// Generic names the shared viewer loads every extra world by.
export {createMeetingScene as createWorld, MEETING_SEED as WORLD_SEED, MEETING_VIEWS as WORLD_VIEWS};
