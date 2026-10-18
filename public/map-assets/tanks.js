import * as THREE from 'three';
import { LAYOUT } from './scene-layout.js';
import { makeBatch, metal } from './builder-utils.js';
import { createWaterMaterial } from './water.js';
import { mergeVertices } from './vendor/addons/utils/BufferGeometryUtils.js';

const FOUNDATION_TOP = 1.91;
const WALL_TOP = 2.26;
const WATER_HEIGHT = 2.11;

function ringGeometry(radius, thickness, height) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius - thickness, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = mergeVertices(new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 64,
    steps: 1,
  }));
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addCylinder(batch, x, y, z, radius, height, material, segments = 12) {
  batch.cylinder(x, y, z, radius, radius, height, material, segments);
}

function addLadder(batch, x, z, radius, angle, steel, warm) {
  const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
  const center = new THREE.Vector3(x, 2.12, z).addScaledVector(radial, radius + .045);
  const halfWidth = .12;
  const bottomY = 1.83;
  const topY = 2.32;
  for (const side of [-1, 1]) {
    const px = center.x + tangent.x * halfWidth * side;
    const pz = center.z + tangent.z * halfWidth * side;
    batch.beam([px, bottomY, pz], [px, topY, pz], .018, steel, 8);
  }
  for (let i = 0; i < 6; i++) {
    const y = bottomY + .08 + i * .095;
    batch.beam(
      [center.x - tangent.x * halfWidth, y, center.z - tangent.z * halfWidth],
      [center.x + tangent.x * halfWidth, y, center.z + tangent.z * halfWidth],
      .013, warm, 6,
    );
  }
  // Short handholds extend above the coping for a readable access point.
  for (const side of [-1, 1]) {
    const px = center.x + tangent.x * halfWidth * side;
    const pz = center.z + tangent.z * halfWidth * side;
    batch.beam([px, 2.24, pz], [px, 2.43, pz], .018, steel, 8);
  }
}

function addDynamicArm(root, tank, steel) {
  const pivot = new THREE.Group();
  pivot.name = `treatment-arm-${tank.id}`;
  pivot.position.set(tank.x, 2.31, tank.z);
  root.add(pivot);

  const armBatch = makeBatch(pivot, `treatment-arm-${tank.id}`);
  const span = tank.r - .25;
  // A pair of radial trusses reach almost to the inside face of the basin wall.
  for (const side of [-1, 1]) {
    const z = side * .075;
    armBatch.beam([0, 0, z], [span, 0, z], .021, steel, 8);
    armBatch.beam([span * .68, 0, z], [span, -.19, z], .014, steel, 6);
    armBatch.beam([span * .68, -.19, z], [span, 0, z], .014, steel, 6);
    // Fine vertical scraper blades end just above the basin floor.
    for (const f of [.45, .74, .97]) {
      const px = span * f;
      armBatch.beam([px, -.02, z], [px, -.32, z], .009, steel, 6);
    }
  }
  addCylinder(armBatch, 0, .025, 0, .075, .26, steel, 16);
  addCylinder(armBatch, 0, -.105, 0, .12, .055, steel, 20);
  armBatch.finish();
  return pivot;
}

export function buildTanks(world) {
  const { root, updates } = world;
  const concrete = new THREE.MeshStandardMaterial({ color: 0x777f80, roughness: .88, metalness: .04 });
  concrete.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTankLocalPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTankLocalPosition = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vTankLocalPosition;
float tankHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float tankNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(tankHash(i), tankHash(i + vec3(1.0, 0.0, 0.0)), f.x);
  float b = mix(tankHash(i + vec3(0.0, 1.0, 0.0)), tankHash(i + vec3(1.0, 1.0, 0.0)), f.x);
  float c = mix(tankHash(i + vec3(0.0, 0.0, 1.0)), tankHash(i + vec3(1.0, 0.0, 1.0)), f.x);
  float d = mix(tankHash(i + vec3(0.0, 1.0, 1.0)), tankHash(i + vec3(1.0, 1.0, 1.0)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float tankGrain = tankNoise(vTankLocalPosition * 13.0) - 0.5;
float tankWeather = tankNoise(vTankLocalPosition * 1.7 + vec3(8.0)) - 0.5;
diffuseColor.rgb *= 1.0 + tankGrain * 0.075 + tankWeather * 0.055;`);
  };
  concrete.customProgramCacheKey = () => 'tank-concrete-weathering-v1';
  const coping = new THREE.MeshStandardMaterial({ color: 0xa2aaa7, roughness: .62, metalness: .12 });
  const steel = metal(0x8d9ba0, .38, .72);
  const warm = new THREE.MeshStandardMaterial({ color: 0xffbd76, emissive: 0x6c3512, emissiveIntensity: .42, roughness: .52 });
  const water = createWaterMaterial(3, world.scene.environment);
  updates.push(t => { water.uniforms.uTime.value = t; });

  const staticParts = makeBatch(root, 'treatment-static');
  const armPivots = [];
  const tankRecords = LAYOUT.tanks.map(tank => {
    const outerR = tank.r;
    const wallThickness = .09;
    const insideR = outerR - wallThickness;
    const foundationBottom = typeof world.height === 'function' ? world.height(tank.x, tank.z) : 1.72;
    const baseThickness = Math.max(.06, FOUNDATION_TOP - foundationBottom);
    const base = new THREE.CylinderGeometry(outerR + .10, outerR + .10, baseThickness, 64);
    base.translate(tank.x, FOUNDATION_TOP - baseThickness / 2, tank.z);
    staticParts.geometry(base, concrete);
    const wall = ringGeometry(outerR, wallThickness, WALL_TOP - FOUNDATION_TOP);
    wall.translate(tank.x, FOUNDATION_TOP, tank.z);
    staticParts.geometry(wall, concrete);

    // The coping is a second closed ring, giving the wall a clear visible rim.
    const rim = ringGeometry(outerR + .018, .11, .075);
    rim.translate(tank.x, WALL_TOP - .05, tank.z);
    staticParts.geometry(rim, coping);

    const waterGeometry = new THREE.CircleGeometry(insideR - .095, 64); // inside the launder weir
    waterGeometry.rotateX(-Math.PI / 2);
    const surface = new THREE.Mesh(waterGeometry, water);
    surface.name = `treatment-water-${tank.id}`;
    surface.position.set(tank.x, WATER_HEIGHT, tank.z);
    root.add(surface);

    // Every circular clarifier has a centre feed well (influent enters here and is baffled down) and a
    // peripheral launder: an effluent trough inside the wall that clear water spills into over a weir.
    // Feed well inner radius clears the arm's centre drum (.12); blades start at span*.45 (>.35), outside it.
    const feedWell = ringGeometry(.27, .028, .15);
    feedWell.translate(tank.x, WATER_HEIGHT - .07, tank.z);
    staticParts.geometry(feedWell, coping);
    // Launder: basin water stands at the weir crest and spills outward into a lower trough. The arm
    // (2.31, reaching r-.25) passes well above and inside it.
    const launderFloorTop = WATER_HEIGHT - .05;
    const launderFloor = ringGeometry(insideR - .004, .085, .022);
    launderFloor.translate(tank.x, launderFloorTop - .022, tank.z);
    staticParts.geometry(launderFloor, concrete);
    const weir = ringGeometry(insideR - .081, .012, WATER_HEIGHT + .012 - launderFloorTop);
    weir.translate(tank.x, launderFloorTop, tank.z);
    staticParts.geometry(weir, coping);
    const troughWater = new THREE.RingGeometry(insideR - .081, insideR - .004, 64);
    troughWater.rotateX(-Math.PI / 2);
    const trough = new THREE.Mesh(troughWater, water);
    trough.name = `treatment-launder-water-${tank.id}`;
    trough.position.set(tank.x, launderFloorTop + .018, tank.z);
    root.add(trough);

    // Four low, warm work lamps sit on the coping.
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const px = tank.x + Math.cos(a) * (outerR - .075);
      const pz = tank.z + Math.sin(a) * (outerR - .075);
      addCylinder(staticParts, px, WALL_TOP + .018, pz, .032, .036, warm, 8);
    }

    const ladderAngle = tank.id === 'north' ? Math.PI * .78 : (tank.id === 'south' ? Math.PI * 1.36 : Math.PI * 1.12);
    addLadder(staticParts, tank.x, tank.z, outerR, ladderAngle, steel, warm);

    // A narrow radial service landing with guard rails at one basin edge.
    const catwalkAngle = ladderAngle + Math.PI;
    const radial = new THREE.Vector3(Math.cos(catwalkAngle), 0, Math.sin(catwalkAngle));
    const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
    const start = new THREE.Vector3(tank.x, 2.45, tank.z).addScaledVector(radial, insideR * .55);
    const end = new THREE.Vector3(tank.x, 2.45, tank.z).addScaledVector(radial, outerR + .42);
    staticParts.beam(start.toArray(), end.toArray(), .035, steel, 8);
    const landingLength = end.distanceTo(start);
    for (let d = .08; d < landingLength; d += .22) {
      const point = start.clone().addScaledVector(radial, d);
      staticParts.beam(
        [point.x - tangent.x * .11, 2.45, point.z - tangent.z * .11],
        [point.x + tangent.x * .11, 2.45, point.z + tangent.z * .11], .009, steel, 6,
      );
    }
    for (const side of [-1, 1]) {
      const ox = tangent.x * .11 * side;
      const oz = tangent.z * .11 * side;
      staticParts.beam([start.x + ox, 2.68, start.z + oz], [end.x + ox, 2.68, end.z + oz], .014, steel, 6);
      for (const f of [.92, .99]) {
        const px = THREE.MathUtils.lerp(start.x, end.x, f) + ox;
        const pz = THREE.MathUtils.lerp(start.z, end.z, f) + oz;
        staticParts.beam([px, 2.45, pz], [px, 2.68, pz], .012, steel, 6);
      }
    }
    armPivots.push(addDynamicArm(root, tank, steel));
    return { id: tank.id, x: tank.x, z: tank.z, radius: outerR, insideRadius: insideR, foundationBottom };
  });

  // Short inter-basin pipes run through the gap between each pair of treatment cells.
  for (const [aIndex, bIndex] of [[0, 1], [0, 2], [1, 2]]) {
    const a = tankRecords[aIndex], b = tankRecords[bIndex];
    const direction = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    const gap = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).length() - a.radius - b.radius;
    if (gap < .14) continue;
    const from = new THREE.Vector3(a.x, 2.02, a.z).addScaledVector(direction, a.radius + .035);
    const to = new THREE.Vector3(b.x, 2.02, b.z).addScaledVector(direction, -(b.radius + .035));
    staticParts.beam(from.toArray(), to.toArray(), .032, steel, 8);
    for (const p of [from, to]) {
      staticParts.beam([p.x, 1.96, p.z], [p.x, 2.02, p.z], .04, steel, 8);
    }
  }

  const staticStats = staticParts.finish();
  world.stats.tanks = 3;
  world.stats.tankDrawParts = tankRecords.length + staticStats.batches + armPivots.length;
  const initialAngles = armPivots.map((_, i) => i * Math.PI * 2 / 3);
  updates.push(t => armPivots.forEach((pivot, i) => { pivot.rotation.y = initialAngles[i] + t * .08; }));

  world.tankDiagnostics = t => tankRecords.map((tank, i) => ({
    id: tank.id,
    center: [tank.x, tank.z],
    radius: tank.radius,
    foundationBottom: tank.foundationBottom,
    wallTop: WALL_TOP,
    waterHeight: WATER_HEIGHT,
    armAngle: initialAngles[i] + (Number.isFinite(t) ? t : 0) * .08,
    maxArmRadius: Math.hypot(tank.radius - .25, .075),
  }));
  world.tankGeometryDiagnostics = {
    foundationTop: FOUNDATION_TOP,
    wallTop: WALL_TOP,
    waterHeight: WATER_HEIGHT,
    ringWallThickness: .09,
    maxArmClearance: Math.min(...tankRecords.map(tank => tank.insideRadius - Math.hypot(tank.radius - .25, .075))),
    basinCount: tankRecords.length,
    staticBatchCount: staticStats.batches,
    dynamicArmCount: armPivots.length,
  };
  return tankRecords;
}
