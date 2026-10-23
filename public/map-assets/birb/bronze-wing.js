// Bronze-winged Pionus geometry ported from Mentis123/birb@53d5071. See docs/three-worlds/BIRB.md.
import * as THREE from 'three';
import { mergeGeometries } from '../vendor/addons/utils/BufferGeometryUtils.js';
const _bakePos = new THREE.Vector3(), _bakeEuler = new THREE.Euler(), _bakeQuat = new THREE.Quaternion(), _bakeScale = new THREE.Vector3(), _bakeMatrix = new THREE.Matrix4();
const pionusPlumageRequested = () => true, plumageRequested = () => false, birbRimUniforms = [];
const addRimLight = () => null, addFeatherSheen = () => { };
const bakeGeometryTRS = (geometry, { position, rotation, scale } = {}) => {
    _bakePos.set(...(position || [0, 0, 0]));
    _bakeEuler.set(...(rotation || [0, 0, 0]));
    _bakeQuat.setFromEuler(_bakeEuler);
    _bakeScale.set(...(scale || [1, 1, 1]));
    _bakeMatrix.compose(_bakePos, _bakeQuat, _bakeScale);
    geometry.applyMatrix4(_bakeMatrix);
    return geometry;
};
const paintGeometryColor = (geometry, colorHex, band = null) => {
    const c = new THREE.Color(colorHex);
    const position = geometry.attributes.position;
    const count = position.count;
    const colors = new Float32Array(count * 3);
    let bandColor = null;
    let comp = 0;
    let rootAt = 0;
    let span = 0;
    if (band && band.color) {
        bandColor = new THREE.Color(band.color);
        const negative = String(band.axis || 'z').startsWith('-');
        const letter = String(band.axis || 'z').replace('-', '');
        comp = letter === 'x' ? 0 : letter === 'y' ? 1 : 2;
        let lo = Infinity;
        let hi = -Infinity;
        for (let i = 0; i < count; i++) {
            const v = position.array[i * 3 + comp];
            if (v < lo)
                lo = v;
            if (v > hi)
                hi = v;
        }
        span = hi - lo;
        rootAt = negative ? hi : lo;
        if (!(span > 1e-6))
            bandColor = null;
    }
    for (let i = 0; i < count; i++) {
        let r = c.r;
        let g = c.g;
        let b = c.b;
        if (bandColor) {
            const t = Math.abs(position.array[i * 3 + comp] - rootAt) / span;
            const until = band.until ?? 0.25;
            const soft = Math.max(1e-4, band.softness ?? 0.1);
            const w = Math.max(0, Math.min(1, (until - t) / soft + 1));
            r += (bandColor.r - r) * w;
            g += (bandColor.g - g) * w;
            b += (bandColor.b - b) * w;
        }
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
};
const mergeAndDispose = (geometries) => {
    const merged = mergeGeometries(geometries, false);
    for (const g of geometries)
        g.dispose();
    return merged;
};
const remapUV = (geometry, rect) => {
    const uv = geometry.attributes.uv;
    if (!uv)
        return geometry;
    for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i), v = uv.getY(i);
        uv.setXY(i, rect.u0 + u * (rect.u1 - rect.u0), rect.v0 + v * (rect.v1 - rect.v0));
    }
    uv.needsUpdate = true;
    return geometry;
};
const buildFeatherPlateGeometry = ({ length, frontW, backW, tipTaper = 0.12, segments = 3, bow = 0.02, axis = 'z', uvRect, }) => {
    const rows = segments + 1;
    const positions = new Float32Array(rows * 2 * 3);
    const uvs = new Float32Array(rows * 2 * 2);
    for (let i = 0; i < rows; i++) {
        const t = i / segments;
        const shape = tipTaper + (1 - tipTaper) * Math.pow(1 - t, 0.85);
        const fw = frontW * shape;
        const bw = backW * shape;
        const bowVal = bow * Math.sin(Math.PI * t);
        const len = length * t;
        let lead, trail;
        if (axis === '-x') {
            lead = [-len, bowVal, fw];
            trail = [-len, bowVal, -bw];
        }
        else if (axis === 'y') {
            lead = [fw, len, bowVal];
            trail = [-bw, len, bowVal];
        }
        else {
            lead = [fw, bowVal, len];
            trail = [-bw, bowVal, len];
        }
        const li = i * 2, ti = i * 2 + 1;
        positions[li * 3] = lead[0];
        positions[li * 3 + 1] = lead[1];
        positions[li * 3 + 2] = lead[2];
        positions[ti * 3] = trail[0];
        positions[ti * 3 + 1] = trail[1];
        positions[ti * 3 + 2] = trail[2];
        const v = uvRect.v0 + t * (uvRect.v1 - uvRect.v0);
        uvs[li * 2] = uvRect.u1;
        uvs[li * 2 + 1] = v;
        uvs[ti * 2] = uvRect.u0;
        uvs[ti * 2 + 1] = v;
    }
    const indices = [];
    for (let i = 0; i < segments; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        indices.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    geo.computeVertexNormals();
    return geo;
};
const tipPointOfFeather = ({ length, axis = 'z' }) => {
    if (axis === '-x')
        return [-length, 0, 0];
    if (axis === 'y')
        return [0, length, 0];
    return [0, 0, length];
};
const transformedLocalPoint = (point, trs) => {
    _bakePos.set(...(trs.position || [0, 0, 0]));
    _bakeEuler.set(...(trs.rotation || [0, 0, 0]));
    _bakeQuat.setFromEuler(_bakeEuler);
    _bakeScale.set(...(trs.scale || [1, 1, 1]));
    _bakeMatrix.compose(_bakePos, _bakeQuat, _bakeScale);
    return new THREE.Vector3(...point).applyMatrix4(_bakeMatrix);
};
export const createProceduralBirbV3 = () => {
    const birbModel = new THREE.Group();
    const pionus = pionusPlumageRequested(window.location?.search || '');
    const backColor = new THREE.Color(pionus ? 0x8a6c39 : 0x2b5dcc);
    const bodyColor = new THREE.Color(pionus ? 0x6b6494 : 0x4a7cf0);
    const bellyColor = new THREE.Color(pionus ? 0xa89fc0 : 0xe6efff);
    const headTint = new THREE.Color(pionus ? 0x3a3260 : 0x5a8cf5);
    const chinBand = new THREE.Color(0xf0c9d2);
    const ventRed = new THREE.Color(0xd4343c);
    const beakColor = new THREE.Color(pionus ? 0xe8dcb4 : 0xf5b942);
    const beakDark = new THREE.Color(pionus ? 0xad9764 : 0xdb9a2e);
    const flightFeather = new THREE.Color(pionus ? 0x1e3f52 : 0x2b5dcc);
    const featherEdge = new THREE.Color(pionus ? 0x2f8378 : 0x4df0ff);
    const bronzeLit = new THREE.Color(0xc79a4e);
    const footColor = new THREE.Color(0x1a2438);
    const plumage = plumageRequested(window.location?.search || '');
    const contourMat = plumage ? new THREE.MeshPhysicalMaterial(plumageMaterialParams(THREE, 'contour', { pionus })) : new THREE.MeshStandardMaterial({
        vertexColors: true, metalness: 0.12, roughness: 0.55,
        emissive: pionus ? 0x1c1828 : 0x0f1f45,
        emissiveIntensity: 0.34,
    });
    const vaneMat = plumage ? new THREE.MeshPhysicalMaterial(plumageMaterialParams(THREE, 'vane', { pionus })) : new THREE.MeshStandardMaterial({
        vertexColors: true,
        metalness: pionus ? 0.34 : 0.16,
        roughness: pionus ? 0.36 : 0.48,
        emissive: pionus ? 0x1c1828 : 0x0f1f45,
        emissiveIntensity: 0.34,
        side: THREE.DoubleSide,
    });
    const footMat = new THREE.MeshStandardMaterial({
        vertexColors: true, metalness: 0.2, roughness: 0.6,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const TILES_PER_UNIT = 1.8;
    const tileUV = (geometry, uSpanUnits, vSpanUnits) => {
        const uv = geometry.attributes.uv;
        if (!uv)
            return geometry;
        const uRep = Math.max(0.35, uSpanUnits * TILES_PER_UNIT);
        const vRep = Math.max(0.35, vSpanUnits * TILES_PER_UNIT);
        for (let i = 0; i < uv.count; i++) {
            uv.setXY(i, uv.getX(i) * uRep, uv.getY(i) * vRep);
        }
        uv.needsUpdate = true;
        return geometry;
    };
    const FULL_UV = { u0: 0, v0: 0, u1: 1, v1: 1 };
    const buildBody = () => {
        const rows = [
            { x: -0.86, y: -0.03, rT: 0.050, rB: 0.050, rZ: 0.050 },
            { x: -0.72, y: -0.03, rT: 0.150, rB: 0.140, rZ: 0.150 },
            { x: -0.54, y: -0.02, rT: 0.245, rB: 0.250, rZ: 0.245 },
            { x: -0.32, y: 0.00, rT: 0.305, rB: 0.345, rZ: 0.305 },
            { x: -0.10, y: 0.02, rT: 0.335, rB: 0.425, rZ: 0.340 },
            { x: 0.10, y: 0.05, rT: 0.335, rB: 0.450, rZ: 0.350 },
            { x: 0.27, y: 0.08, rT: 0.300, rB: 0.385, rZ: 0.315 },
            { x: 0.40, y: 0.13, rT: 0.235, rB: 0.270, rZ: 0.245 },
            { x: 0.50, y: 0.20, rT: 0.165, rB: 0.175, rZ: 0.170 },
            { x: 0.60, y: 0.27, rT: 0.205, rB: 0.215, rZ: 0.210 },
            { x: 0.72, y: 0.32, rT: 0.225, rB: 0.215, rZ: 0.248 },
            { x: 0.84, y: 0.34, rT: 0.185, rB: 0.175, rZ: 0.202 },
            { x: 0.93, y: 0.33, rT: 0.085, rB: 0.080, rZ: 0.085 },
        ];
        const segs = 16;
        const positions = [], uvs = [], colors = [], indices = [];
        const ringColor = (topness, rowT) => {
            const c = bodyColor.clone();
            if (topness > 0.35)
                c.lerp(backColor, Math.min(1, (topness - 0.35) / 0.65));
            else if (topness < -0.30)
                c.lerp(bellyColor, Math.min(0.78, (-0.30 - topness) / 0.70));
            if (rowT > 0.70)
                c.lerp(headTint, Math.min(1, (rowT - 0.70) / 0.18) * 0.55);
            if (!pionus)
                return c;
            if (rowT < 0.16 && topness < 0.10) {
                const along = 1 - rowT / 0.16;
                const under = Math.min(1, (0.10 - topness) / 0.55);
                c.lerp(ventRed, Math.min(1, along * under) * 0.92);
            }
            if (rowT > 0.74 && topness < 0.42) {
                const along = Math.min(1, (rowT - 0.74) / 0.20);
                const low = Math.min(1, (0.42 - topness) / 0.80);
                c.lerp(chinBand, along * low * 0.80);
            }
            return c;
        };
        let run = 0;
        const runs = rows.map((row, i) => {
            if (i > 0)
                run += Math.hypot(row.x - rows[i - 1].x, row.y - rows[i - 1].y);
            return run;
        });
        const girth = 2 * Math.PI * 0.32;
        for (let ri = 0; ri < rows.length; ri += 1) {
            const row = rows[ri];
            const rowT = ri / (rows.length - 1);
            for (let k = 0; k <= segs; k += 1) {
                const a = (k / segs) * Math.PI * 2;
                const cosA = Math.cos(a), sinA = Math.sin(a);
                const rV = row.rB + (row.rT - row.rB) * (cosA * 0.5 + 0.5);
                positions.push(row.x, row.y + rV * cosA, row.rZ * sinA);
                uvs.push((k / segs) * girth * TILES_PER_UNIT, runs[ri] * TILES_PER_UNIT);
                const c = ringColor(cosA, rowT);
                colors.push(c.r, c.g, c.b);
            }
        }
        const stride = segs + 1;
        for (let ri = 0; ri < rows.length - 1; ri += 1) {
            for (let k = 0; k < segs; k += 1) {
                const a = ri * stride + k, b = a + 1, c = a + stride, d = c + 1;
                indices.push(a, b, c, b, d, c);
            }
        }
        const capOf = (ri, flip) => {
            const centre = positions.length / 3;
            positions.push(rows[ri].x, rows[ri].y, 0);
            uvs.push(0.5 * girth * TILES_PER_UNIT, runs[ri] * TILES_PER_UNIT);
            const c = ringColor(0, ri / (rows.length - 1));
            colors.push(c.r, c.g, c.b);
            for (let k = 0; k < segs; k += 1) {
                const a = ri * stride + k, b = a + 1;
                if (flip)
                    indices.push(centre, b, a);
                else
                    indices.push(centre, a, b);
            }
        };
        capOf(0, true);
        capOf(rows.length - 1, false);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    };
    const bodyParts = [buildBody()];
    const beakUpper = new THREE.ConeGeometry(0.10, 0.30, 8);
    const beakLower = new THREE.ConeGeometry(0.085, 0.22, 8);
    bodyParts.push(paintGeometryColor(bakeGeometryTRS(tileUV(remapUV(beakUpper, FULL_UV), 0.2, 0.3), { position: [1.02, 0.325, 0], rotation: [0, 0, -Math.PI / 2 + 0.06] }), beakColor));
    bodyParts.push(paintGeometryColor(bakeGeometryTRS(tileUV(remapUV(beakLower, FULL_UV), 0.2, 0.22), { position: [0.99, 0.268, 0], rotation: [0, 0, -Math.PI / 2 - 0.05] }), beakDark));
    const bodyMesh = new THREE.Mesh(mergeAndDispose(bodyParts), contourMat);
    bodyMesh.name = 'birbBody';
    birbModel.add(bodyMesh);
    const eyeParts = [];
    for (const z of [0.163, -0.163]) {
        const sign = Math.sign(z);
        const lens = new THREE.SphereGeometry(0.070, 12, 10);
        eyeParts.push(paintGeometryColor(bakeGeometryTRS(lens, {
            position: [0.790, 0.378, z], rotation: [0, -sign * 0.62, 0], scale: [0.42, 1, 1],
        }), new THREE.Color(0x0a0a12)));
        const glint = new THREE.SphereGeometry(0.024, 8, 6);
        eyeParts.push(paintGeometryColor(bakeGeometryTRS(glint, { position: [0.824, 0.401, z + sign * 0.018] }), new THREE.Color(0xffffff)));
    }
    const eyeMesh = new THREE.Mesh(mergeAndDispose(eyeParts), eyeMat);
    eyeMesh.name = 'birbEyes';
    birbModel.add(eyeMesh);
    const WING_PROFILES = {
        v3: { wrist: 0.86, chord: 1.00, prim: 1.00, round: 0 },
        slim: { wrist: 0.78, chord: 1.14, prim: 0.93, round: 1 },
        parrot: { wrist: 0.70, chord: 1.26, prim: 0.86, round: 1 },
        stocky: { wrist: 0.62, chord: 1.38, prim: 0.78, round: 1 },
    };
    const wingProfile = WING_PROFILES[(/[?&]wing=([a-z0-9]+)/i.exec(window.location?.search || '') || [])[1]] || WING_PROFILES.parrot;
    const WRIST_Z = wingProfile.wrist;
    const WING_CHORD = wingProfile.chord;
    const buildWingV3 = (side) => {
        const arm = new THREE.Group();
        const armParts = [];
        const SEC = 5;
        for (let i = 0; i < SEC; i++) {
            const t = i / (SEC - 1);
            const len = 0.54 + t * 0.22;
            const plate = buildFeatherPlateGeometry({
                length: len, frontW: 0.165 * (WING_CHORD + 0.10), backW: 0.250 * (WING_CHORD + 0.10),
                tipTaper: 0.14, segments: 4,
                bow: 0.018, axis: 'z', uvRect: FULL_UV,
            });
            tileUV(plate, 0.18, len);
            armParts.push(paintGeometryColor(bakeGeometryTRS(plate, {
                position: [-0.03 - t * 0.10, 0.005, 0.08 + t * (WRIST_Z - 0.14)],
                rotation: [0, -0.16 - t * 0.10, -0.04],
            }), pionus
                ? backColor.clone().lerp(flightFeather, 0.18 + t * 0.42)
                : bodyColor.clone().lerp(backColor, 0.25 + t * 0.3)));
        }
        const COV = 4;
        for (let i = 0; i < COV; i++) {
            const t = i / (COV - 1);
            const len = 0.30 + t * 0.10;
            const plate = buildFeatherPlateGeometry({
                length: len, frontW: 0.115 * (WING_CHORD + 0.10), backW: 0.150 * (WING_CHORD + 0.10),
                tipTaper: 0.16, segments: 3,
                bow: 0.012, axis: 'z', uvRect: FULL_UV,
            });
            tileUV(plate, 0.13, len);
            armParts.push(paintGeometryColor(bakeGeometryTRS(plate, {
                position: [0.05, 0.06, 0.06 + t * (WRIST_Z - 0.16)],
                rotation: [0, -0.13 - t * 0.08, -0.10],
            }), pionus
                ? backColor.clone().lerp(bronzeLit, 0.10 + t * 0.30)
                : backColor.clone().lerp(bodyColor, 0.15 + t * 0.25)));
        }
        const armMesh = new THREE.Mesh(mergeAndDispose(armParts), vaneMat);
        armMesh.name = 'birbWingArm';
        arm.add(armMesh);
        const hand = new THREE.Group();
        hand.name = 'hand';
        hand.position.set(-0.05, 0.0, WRIST_Z);
        hand.userData.baseRotation = new THREE.Euler(0, 0, 0);
        const handParts = [];
        const PRIM = 7;
        let outermost = null;
        for (let i = 0; i < PRIM; i++) {
            const t = i / (PRIM - 1);
            const ramp = 0.74 + t * 0.26;
            const hump = 1.00 * (1 - 0.42 * Math.pow(Math.abs(t - 0.32) / 0.68, 1.6));
            const len = (wingProfile.round ? hump : ramp) * wingProfile.prim;
            const plate = buildFeatherPlateGeometry({
                length: len, frontW: 0.150 * WING_CHORD, backW: 0.215 * WING_CHORD,
                tipTaper: 0.16, segments: 4,
                bow: 0.022, axis: 'z', uvRect: FULL_UV,
            });
            tileUV(plate, 0.13, len);
            const trs = {
                position: [-t * 0.15, t * 0.02, t * 0.055],
                rotation: [0, -0.04 - t * 0.26, -0.02 - t * 0.05],
            };
            handParts.push(paintGeometryColor(bakeGeometryTRS(plate, trs), pionus
                ? flightFeather.clone().lerp(featherEdge, 0.10 + t * 0.30)
                : backColor.clone().lerp(featherEdge, 0.06 + t * 0.22)));
            const reach = transformedLocalPoint(tipPointOfFeather({ length: len, axis: 'z' }), trs);
            if (!outermost || reach.z > outermost.z)
                outermost = reach;
        }
        const handMesh = new THREE.Mesh(mergeAndDispose(handParts), vaneMat);
        handMesh.name = 'birbWingHand';
        hand.add(handMesh);
        arm.add(hand);
        const tip = new THREE.Object3D();
        tip.name = 'tipFeather';
        tip.position.copy(outermost);
        hand.add(tip);
        const secondary = new THREE.Object3D();
        secondary.name = 'secondaryFeather';
        secondary.position.set(-0.08, 0.005, 0.46);
        arm.add(secondary);
        arm.userData.tipFeather = tip;
        arm.userData.secondaryFeather = secondary;
        arm.userData.hand = hand;
        arm.scale.z = side;
        return arm;
    };
    const leftWing = buildWingV3(1);
    leftWing.name = 'leftWing';
    leftWing.position.set(0.02, 0.29, 0.28);
    leftWing.rotation.set(-0.08, -0.20, 0.14);
    leftWing.userData.baseRotation = leftWing.rotation.clone();
    birbModel.add(leftWing);
    const rightWing = buildWingV3(-1);
    rightWing.name = 'rightWing';
    rightWing.position.set(0.02, 0.29, -0.28);
    rightWing.rotation.set(0.08, 0.20, 0.14);
    rightWing.userData.baseRotation = rightWing.rotation.clone();
    birbModel.add(rightWing);
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    tailGroup.position.set(-0.84, -0.02, 0);
    tailGroup.userData.baseRotation = new THREE.Euler(0, 0, 0.05);
    tailGroup.rotation.copy(tailGroup.userData.baseRotation);
    const tailParts = [];
    const TAILN = 9;
    for (let i = 0; i < TAILN; i++) {
        const t = i / (TAILN - 1);
        const spread = (t - 0.5) * 2;
        const len = 0.86 - Math.abs(spread) * 0.20;
        const plate = buildFeatherPlateGeometry({
            length: len, frontW: 0.105, backW: 0.130, tipTaper: 0.30, segments: 3,
            bow: 0.016, axis: '-x', uvRect: FULL_UV,
        });
        tileUV(plate, 0.12, len);
        tailParts.push(paintGeometryColor(bakeGeometryTRS(plate, {
            position: [0, -Math.abs(spread) * 0.012, spread * 0.105],
            rotation: [spread * 0.40, 0, 0],
        }), pionus
            ? flightFeather.clone().lerp(featherEdge, 0.08 + Math.abs(spread) * 0.22)
            : backColor.clone().lerp(featherEdge, 0.05 + Math.abs(spread) * 0.18), pionus ? { color: ventRed, until: 0.30, softness: 0.12, axis: '-x' } : null));
    }
    for (let i = 0; i < 4; i += 1) {
        const t = i / 3;
        const side = i % 2 === 0 ? 1 : -1;
        const cov = buildFeatherPlateGeometry({
            length: 0.30 - t * 0.07, frontW: 0.105, backW: 0.125, tipTaper: 0.34,
            segments: 2, bow: 0.012, axis: '-x', uvRect: FULL_UV,
        });
        tileUV(cov, 0.11, 0.30);
        tailParts.push(paintGeometryColor(bakeGeometryTRS(cov, {
            position: [0.06, 0.055 - t * 0.02, side * t * 0.075],
            rotation: [side * t * 0.30, 0, -0.16],
        }), pionus
            ? backColor.clone().lerp(bodyColor, 0.18 - t * 0.10)
            : backColor.clone().lerp(bodyColor, 0.30 - t * 0.18)));
    }
    const tailMesh = new THREE.Mesh(mergeAndDispose(tailParts), vaneMat);
    tailMesh.name = 'birbTail';
    tailGroup.add(tailMesh);
    birbModel.add(tailGroup);
    const buildFoot = (z) => {
        const g = new THREE.Group();
        const parts = [];
        const leg = new THREE.CylinderGeometry(0.022, 0.018, 0.11, 6);
        parts.push(paintGeometryColor(bakeGeometryTRS(leg, { position: [0, -0.055, 0] }), footColor));
        for (const [dx, dz, rot] of [[0.05, 0, 0], [0.038, 0.032, 0.5], [0.038, -0.032, -0.5]]) {
            const toe = new THREE.CylinderGeometry(0.012, 0.007, 0.065, 5);
            parts.push(paintGeometryColor(bakeGeometryTRS(toe, {
                position: [dx, -0.115, dz], rotation: [0, rot, Math.PI / 2 - 0.35],
            }), footColor));
        }
        const mesh = new THREE.Mesh(mergeAndDispose(parts), footMat);
        mesh.name = 'birbFootMesh';
        g.add(mesh);
        g.position.set(-0.20, -0.34, z);
        g.rotation.set(0, 0, -1.35);
        g.userData.tuck = -2.20;
        return g;
    };
    const leftFoot = buildFoot(0.085);
    leftFoot.name = 'leftFoot';
    birbModel.add(leftFoot);
    const rightFoot = buildFoot(-0.085);
    rightFoot.name = 'rightFoot';
    birbModel.add(rightFoot);
    const seenRimMaterialsV3 = new Set();
    birbModel.traverse((child) => {
        if (!child.material)
            return;
        const list = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of list) {
            if (seenRimMaterialsV3.has(m))
                continue;
            seenRimMaterialsV3.add(m);
            const u = addRimLight(m, THREE, { color: 0x9fe8ff, power: 3.0, strength: 0.42 });
            if (u)
                birbRimUniforms.push(u);
        }
    });
    if (pionus)
        addFeatherSheen(vaneMat, THREE, { warm: 0xffc266, cool: 0x3f8f6e, power: 1.9, strength: 0.72 });
    if (plumage) {
        const table = plumageFor(pionus);
        for (const m of [contourMat, vaneMat]) {
            installPlumageLighting(m, THREE);
            if (m.userData?.birbRim)
                m.userData.birbRim.uBirbRimStrength.value *= table.rimScale;
        }
        if (vaneMat.userData?.birbSheen)
            vaneMat.userData.birbSheen.uSheenStrength.value *= table.featherSheenScale;
        birbModel.userData.plumageMaterials = { contour: contourMat, vane: vaneMat };
    }
    birbModel.userData.featherMaterials = { contour: contourMat, vane: vaneMat };
    return birbModel;
};
