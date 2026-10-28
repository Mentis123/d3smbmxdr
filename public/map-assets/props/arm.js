// Which prop treatment a world draws: ?props=procedural|house, or an opaque A/B token ?arm=<token> resolved from the
// table the /ab page keeps in localStorage ('ab.arms', skills/ab-review/SKILL.md), so a review URL never names its arm.
// Each caller names its default (the arm that won its last A/B). Worlds report the arm they actually drew in
// world.stats.props (read back, not echoed).
export const AB_ARMS_KEY = 'ab.arms';
export function propsArm(fallback = 'procedural') {
  try {
    const q = new URLSearchParams(location.search), p = q.get('props');
    if (p === 'house' || p === 'procedural') return p;
    const t = q.get('arm');
    if (t) { const a = JSON.parse(localStorage.getItem(AB_ARMS_KEY) || '{}')[t]; if (a && (a.props === 'house' || a.props === 'procedural')) return a.props; }
  } catch { /* storage blocked: default */ }
  return fallback;
}
