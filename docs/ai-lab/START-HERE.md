# AI Lab continuation

Canonical project: https://github.com/Mentis123/adamrappaport/tree/main/docs/three-worlds
Read its START-HERE.md, state.json, ROADMAP.md, AI-LAB.md and latest JOURNAL.md before extending this experience. Keep this repository's CLAUDE.md rules: update /links for routes, no local dev server/test suite; use deployment-based interactive validation. The host's production build/type validation is permitted.

## W03 implementation

Native Next14/React18 routes: /ai-lab, /ai-lab/energy, /ai-lab/mining. Pages/CSS are scoped under app/ai-lab; content/state rules under lib/ai-lab/content.ts. The existing Decision Room is untouched. Hub and footer follow the Data#3 brand and resident Tech Wizard attribution.

Static 3D scenes use public/lab-worlds/{energy,mining}.html and public/map-assets. public/lab-worlds/version.json pins the canonical source revision and every copied file hash. Update only through the canonical scripts/sync-lab-worlds.mjs then --check; no personal-site runtime dependency and no manual divergence. Preserve asset-manifest.json and vendor licenses.

Controls change a clearly synthetic observation and the optional 3D layer. Outputs are fixed rules, not inference. Low light/occlusion requests manual review; no flag does not mean clearance. Local advisory persists in the illustrated offline state; no cloud observation data is transmitted. Operator procedures/verification remain necessary. No equipment or scenario-control API is connected.

## Verification / continuation

Canonical scripts/lab-renderer-check.mjs covers optional scene behaviour; scripts/ai-lab-check.mjs targets the deployed host and captures Observe, Understand, Respond plus mobile layouts and Decision Room/index regressions. Selected evidence and release receipts live in the canonical repository, so any agent can resume there. W03 first breakout human review is outstanding until explicitly received. Physical phone/Safari remain untested. W04 scenario maps/fog are a separate future phase.

## Build note

An initial sparse-checkout build lacked public/data3-brand-guidelines.skill required by /brand. Restoring that tracked file resolved it; no route/asset workaround was introduced. Existing framework/dependency versions are retained; npm reported pre-existing advisories, which are a separate maintenance concern.

## W03A first increment

Four delivered example definitions: energy intake vision; mining conveyor vision, procedure authority and historian-gap triage. lib/ai-lab/recipes.ts is the typed registry, with original fixtures in procedure.ts and historian.ts. Select examples from world markers or the chooser; ?example=mining.procedure-control and ?example=mining.historian-gap are deep links. Invalid/wrong-world ids are explained and cleared. Only the synthetic shutdown case freezes illustrated conveyor motion; missing observations never stop it. No scenario or operational API is connected.

Primary retained architecture, rendering, integration and acceptance; Luna owned bounded fixtures and a read-only review. Host production build/typecheck passed; canonical renderer 24 checks, ordinary mining 23 checks and eight contracts passed. Deployed interactive acceptance is pending this implementation commit. Canonical scripts/lab-journeys-check.mjs exercises 16 procedure combinations and eight historian/cloud combinations; scripts/ai-lab-check.mjs retains the original examples, asset hashes and host regressions. Record exact runtime and production receipts in the canonical docs/three-worlds state/journal. A3 drawing search, A4 alarms, A5 mixer and A6 handover remain planned; no extra completed cards should imply otherwise.
