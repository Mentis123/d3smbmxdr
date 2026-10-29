/**
 * Decision Room scenario check: `node scripts/decision-room-scenario-check.mjs`.
 *
 * A static content check, not a server test: compiles the scenario modules to a
 * temp folder and replays every possible A–D path (4^6 per scenario), asserting
 * that each revision is well formed, branches resolve, earlier choices change
 * later evidence, nothing facilitator-only leaks into a participant round, the
 * Riverbend revision still produces the values V1 rooms have always seen, and
 * the mining preview avoids the claims the concept rules out.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "dr-scenarios-"));
execFileSync(process.execPath, [join("node_modules", "typescript", "bin", "tsc"), "lib/decision-room/scenarios.ts", "--outDir", out, "--module", "commonjs", "--target", "es2022", "--skipLibCheck", "--esModuleInterop"], { stdio: "inherit" });
writeFileSync(join(out, "package.json"), '{"type":"commonjs"}');
const { AGENT0_PRODUCTION_RELEASE } = createRequire(import.meta.url)(join(out, "release.js"));
const { SCENARIOS, consequenceFor, publicRound, replay, resolveScenario, scenarioKeyForNewRoom, LEGACY_SCENARIO_KEY } = createRequire(import.meta.url)(join(out, "scenarios.js"));

let failures = 0;
const fail = (label, detail) => { failures += 1; console.log(`  FAIL ${label}${detail ? ` :: ${JSON.stringify(detail).slice(0, 300)}` : ""}`); };
const check = (label, condition, detail) => { if (condition) console.log(`  ok   ${label}`); else fail(label, detail); };
const KEYS = ["A", "B", "C", "D"];

function conditionOk(scenario, condition, roundNo) {
  if ("all" in condition) return condition.all.every((c) => conditionOk(scenario, c, roundNo));
  if ("fact" in condition) { const fact = scenario.facts?.find((f) => f.id === condition.fact); return Boolean(fact) && condition.anyOf.every((v) => v in fact.values); }
  return condition.round >= 1 && condition.round < roundNo && ("option" in condition ? KEYS.includes(condition.option) : condition.anyOf.every((k) => KEYS.includes(k)));
}
function consequenceOk(scenario, consequence) {
  if (!consequence?.you || !consequence.body || !Array.isArray(consequence.changes)) return false;
  for (const key of Object.keys(consequence.meters ?? {})) if (!scenario.meters?.some((m) => m.id === key)) return false;
  for (const [key, value] of Object.entries(consequence.sets ?? {})) { const fact = scenario.facts?.find((f) => f.id === key); if (!fact || !(value in fact.values)) return false; }
  return true;
}
function* paths(n) { const total = 4 ** n; for (let i = 0; i < total; i += 1) { const m = new Map(); let x = i; for (let r = 1; r <= n; r += 1) { m.set(r, KEYS[x % 4]); x = Math.floor(x / 4); } yield m; } }

console.log("\n1. Revision pinning");
check("a room with no stored scenario resolves to riverbend@1", resolveScenario(null)?.key === "riverbend@1" && LEGACY_SCENARIO_KEY === "riverbend@1");
check("an unknown stored scenario is refused, not reinterpreted", resolveScenario("riverbend@99") === null);
check("new V1 rooms pin riverbend@1", scenarioKeyForNewRoom("riverbend") === "riverbend@1");
const env = { ...process.env };
delete process.env.DECISION_ROOM_AGENT0_SCENARIO;
process.env.VERCEL_ENV = "preview"; check("new Agent 0 rooms pin the Ironvale preview outside production", scenarioKeyForNewRoom("agent0") === "ironvale@0.2");
process.env.VERCEL_ENV = "production"; check(`new Agent 0 rooms in production follow this site's release (${AGENT0_PRODUCTION_RELEASE ?? "none, so riverbend@1"})`, scenarioKeyForNewRoom("agent0") === (AGENT0_PRODUCTION_RELEASE ?? "riverbend@1"));
process.env.DECISION_ROOM_AGENT0_SCENARIO = "ironvale@0.1"; check("the environment variable overrides the site release", scenarioKeyForNewRoom("agent0") === "ironvale@0.1");
process.env.DECISION_ROOM_AGENT0_SCENARIO = "ironvale@nope"; check("a misnamed release falls back to riverbend@1", scenarioKeyForNewRoom("agent0") === "riverbend@1");
Object.assign(process.env, env); if (!env.VERCEL_ENV) delete process.env.VERCEL_ENV; if (!env.DECISION_ROOM_AGENT0_SCENARIO) delete process.env.DECISION_ROOM_AGENT0_SCENARIO;

for (const scenario of Object.values(SCENARIOS)) {
  console.log(`\n2. ${scenario.key}: structure`);
  const n = scenario.rounds.length;
  check("six rounds, numbered in order", n === 6 && scenario.rounds.every((r, i) => r.roundNo === i + 1));
  // On-rails rooms (Coastwater, Marlow Vale) carry no state model: discussion, not consequences.
  const rails = ["coastwater", "marlowvale"].includes(scenario.family);
  if (rails) check("on-rails: no meters, facts or stages", !scenario.meters && !scenario.facts && scenario.stages.length === 0);
  else check("either meters or named facts", Boolean(scenario.meters) !== Boolean(scenario.facts));
  if (!rails) check("launch steps cover every terminal line", scenario.launch.steps.length === scenario.launch.lines.length + 1 && scenario.launch.steps.every((s) => s.path.length === scenario.stages.length));
  check("run plan: opening, launch, six rounds, close", scenario.runPlan.segments.length === 9 && scenario.runPlan.segments.at(-1).to === scenario.runPlan.totalMinutes);
  for (const round of scenario.rounds) {
    const where = `round ${round.roundNo}`;
    check(`${where}: four options A–D with valid consequences`, round.options.map((o) => o.key).join("") === "ABCD" && round.options.every((o) => consequenceOk(scenario, o.consequence) && (o.variants ?? []).every((v) => conditionOk(scenario, v.when, round.roundNo) && consequenceOk(scenario, v.consequence))));
    check(`${where}: paths sized to the stages`, round.path.length === scenario.stages.length && (round.pathVariants ?? []).every((v) => v.path.length === scenario.stages.length && conditionOk(scenario, v.when, round.roundNo)));
    if (round.briefing) check(`${where}: briefing variants read only earlier history`, (round.briefing.variants ?? []).every((v) => conditionOk(scenario, v.when, round.roundNo)));
    if (scenario.family === "ironvale") {
      const b = round.briefing;
      check(`${where}: briefing, reveal and conditional guidance present`, Boolean(b && b.evidence.length === 3 && b.unknown && b.stakes && b.controls.length && round.reveal?.questions.length && round.guidance && KEYS.includes(round.guidance.preferred)));
      check(`${where}: every evidence card is sourced, timed and scoped`, [b, ...(b?.variants ?? [])].every((x) => (x?.evidence ?? []).every((e) => e.source && e.at && e.scope && e.observation && e.implication)));
    }
  }

  console.log(`\n3. ${scenario.key}: every one of ${4 ** n} paths`);
  let broken = 0, leaks = 0; const seen = new Map();
  const secret = scenario.rounds.flatMap((r) => [r.guidance?.conditions, r.guidance?.changeEvidence, r.reveal?.lesson, r.reveal?.boundary, ...r.options.flatMap((o) => [o.consequence.body, ...(o.variants ?? []).map((v) => v.consequence.body)])]).filter(Boolean);
  for (const choices of paths(n)) {
    for (let r = 1; r <= n; r += 1) {
      const history = new Map([...choices].filter(([k]) => k < r));
      if (!consequenceFor(scenario, r, choices.get(r), history)) broken += 1;
      const shown = publicRound(scenario, scenario.rounds[r - 1], history);
      const text = JSON.stringify(shown);
      if (secret.some((s) => text.includes(s))) leaks += 1;
      const key = `${r}`; if (!seen.has(key)) seen.set(key, new Set()); seen.get(key).add(JSON.stringify([shown.briefing?.evidence, shown.path]));
    }
    replay(scenario, choices, n);
  }
  check("every path resolves a consequence in every round", broken === 0, { broken });
  check("no consequence, guidance or reveal text in any participant round", leaks === 0, { leaks });
  if (scenario.family === "ironvale") for (let r = 2; r <= n; r += 1) check(`round ${r}: earlier choices change what the table is shown`, seen.get(`${r}`).size >= 2, { variants: seen.get(`${r}`).size });
}

console.log("\n4. riverbend@1 is unchanged for V1 rooms");
const rb = SCENARIOS["riverbend@1"];
check("triage B: trust 38", replay(rb, new Map([[1, "B"]]), 1).meters.trust === 38);
check("triage C: trust 82", replay(rb, new Map([[1, "C"]]), 1).meters.trust === 82);
check("inject 4 C after a bounded agent keeps cover at 100", replay(rb, new Map([[1, "C"], [2, "A"], [3, "D"], [4, "B"], [5, "C"]]), 5).meters.cover === 100);
check("inject 4 C without one cuts cover to 30", replay(rb, new Map([[1, "C"], [2, "A"], [3, "A"], [4, "B"], [5, "C"]]), 5).meters.cover === 30);
check("best moves as in the deck", JSON.stringify(rb.bestMove) === JSON.stringify({ 1: "C", 2: "A", 3: "D", 4: "B", 5: "D", 6: "C" }));

for (const ivKey of ["ironvale@0.1", "ironvale@0.2"]) {
console.log(`\n5. ${ivKey} avoids claims the concept rules out`);
// Everything a table or the projector can see; facilitator notes may name a claim in order to rule it out.
const iv = JSON.stringify({ ...SCENARIOS[ivKey], rounds: SCENARIOS[ivKey].rounds.map(({ guidance, ...round }) => round) });
for (const [label, pattern] of [["no Riverbend carry-over", /Riverbend|JADEPUFFER|boil-water|billing/i], ["no SOCI status inferred from mining", /\bSOCI\b/], ["no insurance figure", /insur/i], ["no invented AI-incident report", /AI-incident report/i], ["no numeric safety score", /\d+\s*%\s*safe/i], ["no 'passive' sensor claim", /\bpassive\b/i]])
  check(label, !pattern.test(iv), iv.match(pattern)?.[0]);
}

console.log("\n6. Rails rooms: few words, real trade-offs");
// Doctrine (owner, 29 Oct 2026): a room reads fast and every option costs something, including the one the
// facilitator leans to. Rooms written before the rule (coastwater@1, coastwater@2, ironvale@0.1) are exempt.
const RAILS_FAMILIES = ["coastwater", "marlowvale", "ironvale"], GRANDFATHERED = ["coastwater@1", "coastwater@2", "ironvale@0.1"];
const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
for (const s of Object.values(SCENARIOS)) {
  if (!RAILS_FAMILIES.includes(s.family) || GRANDFATHERED.includes(s.key)) continue;
  for (const r of s.rounds) {
    const situation = r.briefing?.changed ?? r.situation.join(" ");
    check(`${s.key} r${r.roundNo}: situation at most 55 words`, words(situation) <= 55, words(situation));
    check(`${s.key} r${r.roundNo}: question at most 12 words`, words(r.prompt) <= 12, words(r.prompt));
    for (const o of r.options) {
      const label = o.label.replace(/ \([^()]+\)$/, "");
      check(`${s.key} r${r.roundNo}${o.key}: option at most 8 words`, words(label) <= 8, label);
      check(`${s.key} r${r.roundNo}${o.key}: cost is "gain; give-up" in at most 16 words`, Boolean(o.cost) && /;/.test(o.cost) && o.cost.split(";").every((p) => words(p) >= 2) && words(o.cost) <= 16, o.cost);
    }
    check(`${s.key} r${r.roundNo}: four different costs`, new Set(r.options.map((o) => o.cost)).size === r.options.length);
  }
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
