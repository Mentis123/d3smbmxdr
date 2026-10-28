import * as THREE from 'three';
import {toCreasedNormals} from './../vendor/addons/utils/BufferGeometryUtils.js';

// House style: fork any outside low-poly model (Polyfork modules first) into the look of a world, deterministically.
// Same model + same profile = same result, every time. Plan: docs/three-worlds/POLYFORK-PLAN.md section 3a.
// Contains no third-party geometry: it only transforms a THREE.Group handed to it.
//
//   houseStyle(group, profile, {id, scale}) -> group (in place)
//     1. colour: the module's named colour slots are set by profile.slots BEFORE the model is built (pass
//        slotsFor(profile, moduleParams) to createAsset); then every vertex colour is graded the same way (saturation,
//        tint, lift for our ACES tone mapping at exposure 1);
//     2. shape: hard facets are softened with creased normals (edges sharper than profile.crease stay crisp);
//     3. material: one of our materials per role (base / glass), replacing the module's flat ones;
//     4. glow (optional, profile.glow): strongly saturated, bright vertex colours (status LEDs, lamps) emit light;
//     5. hooks: shadows, a name, userData.source, bounding-box anchors (top, front, centre) for markers and overlays.
//   Profiles are data (PROFILES below), one per world mood; add one when a world needs it.

export const PROFILES = {
  // Meeting room at dusk: walnut, charcoal fabric, brushed steel; warm grade.
  'meeting-dusk': {grade: {sat: .82, tint: '#ffe2c4', tintAmt: .08, lift: 1.12, gamma: .95}, crease: 32, roughness: .62, metalness: .08,
    slots: {wool: '#3d434f', timber: '#6b4a33', stem: '#a7afb6', mech: '#5e646b', castor: '#23262b', body: '#2b3038', frame: '#1f2328'}},
  // Mining in daylight: dusty, sun-bleached; plant yellow kept but muddied.
  'mining-day': {grade: {sat: .92, tint: '#e9d2b0', tintAmt: .04, lift: .96, gamma: 1.04}, crease: 30, roughness: .78, metalness: .05,
    slots: {body: '#d7a13a', frame: '#3a3d40', steel: '#9a9d9c', tyre: '#1b1c1d', glass: '#4a5559', spoil: '#7a6248', mud: '#4b3a2a'}},
  // Datacenter / Splunk night: black steel, smoked glass, cyan status light.
  'datacenter-night': {grade: {sat: 1, tint: '#bfe6ff', tintAmt: .05, lift: 1.2, gamma: .95}, crease: 28, roughness: .38, metalness: .5, glow: 1.8,
    slots: {body: '#36414e', glass: '#3a4654', interior: '#0e1218', rail: '#0b0d10', gear: '#2a313a', plastic: '#2f3640', led: '#19d3ff', leadA: '#19d3ff', leadB: '#ff3fae', leadC: '#ffb02e', leadD: '#3fe08a'}},
};

// The module's colour options (its exported `params`), filled from the profile's slot table where the names match.
export function slotsFor(profile, moduleParams = {}) {
  const out = {};
  for (const [k, v] of Object.entries(profile.slots)) if (k in moduleParams) out[k] = v;
  return out;
}

const tmp = new THREE.Color(), tint = new THREE.Color();
function grade(colors, g) {
  tint.set(g.tint);
  for (let i = 0; i < colors.count; i++) {
    tmp.fromBufferAttribute(colors, i);
    const l = tmp.r * .2126 + tmp.g * .7152 + tmp.b * .0722;
    tmp.r = l + (tmp.r - l) * g.sat; tmp.g = l + (tmp.g - l) * g.sat; tmp.b = l + (tmp.b - l) * g.sat;
    tmp.lerp(tint.clone().multiplyScalar(l * 1.4), g.tintAmt);
    tmp.r = Math.pow(Math.min(1, tmp.r * g.lift), g.gamma); tmp.g = Math.pow(Math.min(1, tmp.g * g.lift), g.gamma); tmp.b = Math.pow(Math.min(1, tmp.b * g.lift), g.gamma);
    colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
  }
  colors.needsUpdate = true;
}

export function houseStyle(group, profile, {id = group.name || 'prop', scale = 1} = {}) {
  const p = typeof profile === 'string' ? PROFILES[profile] : profile;
  const mats = new Map();
  const matFor = (old) => {
    const glass = old.roughness < .4 || old.transparent;
    const key = glass ? 'glass' : 'base';
    if (!mats.has(key)) mats.set(key, glass
      ? new THREE.MeshStandardMaterial({vertexColors: true, roughness: .12, metalness: .1, transparent: true, opacity: .78, envMapIntensity: 1.2})
      : new THREE.MeshStandardMaterial({vertexColors: true, roughness: p.roughness, metalness: p.metalness, envMapIntensity: .9}));
    const m = mats.get(key);
    if (p.glow && !m.userData.glow) {
      m.userData.glow = true;
      m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 hc = vColor.rgb; float mx = max(max(hc.r, hc.g), hc.b), mn = min(min(hc.r, hc.g), hc.b);
          totalEmissiveRadiance += hc * ${p.glow.toFixed(2)} * smoothstep(.55, .8, (mx - mn) / max(mx, 1e-3)) * smoothstep(.35, .6, mx); }`); };
      m.customProgramCacheKey = () => 'house-glow-' + p.glow;
    }
    return m;
  };
  group.traverse(o => {
    if (!o.isMesh) return;
    let g = o.geometry;
    if (g.attributes.color) grade(g.attributes.color, p.grade);
    g = toCreasedNormals(g, THREE.MathUtils.degToRad(p.crease));
    o.geometry.dispose(); o.geometry = g;
    o.material = Array.isArray(o.material) ? o.material.map(matFor) : matFor(o.material);
    o.castShadow = o.receiveShadow = true;
  });
  group.scale.multiplyScalar(scale);
  group.name = id;
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group), c = box.getCenter(new THREE.Vector3());
  group.userData.source = {id, style: Object.keys(PROFILES).find(k => PROFILES[k] === p) || 'custom'};
  group.userData.anchors = {top: [c.x, box.max.y, c.z], front: [c.x, c.y, box.max.z], centre: c.toArray()};
  return group;
}
