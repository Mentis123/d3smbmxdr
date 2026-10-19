import * as THREE from 'three';

// Generic pins for worlds that define world.hotspots. Same marker style, placement and overlap rules as lab-layer.js,
// so every world shows its pins the same way. Anchors are model-space points; world.root carries the turntable yaw.
export function createHotspotLayer(world, hotspots, host, onSelect) {
  let active = null;
  const markers = hotspots.map(spot => {
    const marker = document.createElement('button');
    marker.className = 'lab-hotspot';
    marker.type = 'button';
    marker.textContent = '◉ ' + spot.label;
    marker.dataset.hotspot = spot.id;
    marker.setAttribute('aria-label', spot.label + '. ' + spot.caption);
    marker.style.cssText = 'position:absolute;z-index:4;left:0;top:0;transform:translate(-50%,-100%);border:1px solid #78dcff;background:#000025ed;color:#fff;border-radius:20px;padding:9px 13px;min-height:44px;font:600 12px Arial,sans-serif;white-space:nowrap;box-shadow:0 0 24px #00aeff35';
    marker.addEventListener('pointerdown', e => e.stopPropagation());
    marker.addEventListener('click', () => onSelect(spot));
    host.appendChild(marker);
    const width = Math.max(130, spot.label.length * 7 + 38);
    marker.style.width = width + 'px';
    return {spot, marker, width};
  });
  const projected = new THREE.Vector3();

  function select(id) {
    active = hotspots.find(s => s.id === id) || null;
    for (const {spot, marker} of markers) marker.setAttribute('aria-pressed', String(spot === active));
  }

  function update(camera) {
    world.root.updateWorldMatrix(true, false);
    const placed = [];
    // The selected pin wins when projected labels overlap; every pin stays reachable from the list of buttons.
    const ordered = [...markers].sort((a, b) => Number(b.spot === active) - Number(a.spot === active));
    for (const {spot, marker, width} of ordered) {
      // A world can scope a pin (for example, only inside a cage) with spot.hidden().
      if (spot.hidden?.()) { marker.hidden = true; continue; }
      projected.copy(spot.anchor);
      projected.y += 0.45;
      world.root.localToWorld(projected);
      projected.project(camera);
      const x = (projected.x * 0.5 + 0.5) * host.clientWidth, y = (-projected.y * 0.5 + 0.5) * host.clientHeight;
      const overlap = placed.some(p => Math.abs(p.x - x) < (p.width + width) / 2 + 8 && Math.abs(p.y - y) < 52);
      marker.hidden = overlap || x - width / 2 < 8 || x + width / 2 > host.clientWidth - 8 || y < 48 || projected.z > 1 || projected.z < -1;
      marker.style.left = x + 'px';
      marker.style.top = y + 'px';
      if (!marker.hidden) placed.push({x, y, width});
    }
  }

  // apply() exists so the viewer's shared state messages keep working; hotspot worlds have no lab state.
  function apply(input = {}) {
    if (input.hotspotId) select(input.hotspotId);
    return diagnostics();
  }
  function diagnostics() {
    return {hotspots: hotspots.map(s => s.id), active: active?.id ?? null, simulation: true, inference: false, controlConnected: false};
  }
  return {select, update, apply, diagnostics, dispose() { markers.forEach(({marker}) => marker.remove()); }};
}
