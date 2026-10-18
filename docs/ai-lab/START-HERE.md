# AI Lab continuation

> **Next direction — 19 October 2026:** Read [DIORAMA-EXHIBITS.md](https://github.com/Mentis123/adamrappaport/blob/main/docs/three-worlds/DIORAMA-EXHIBITS.md) and canonical state before coding. The user wants world-first exploration with clickable close-up animated exhibits and short explanations. Retire the lesson-step interface in the next implementation; do not extend it with A5/A6 first. First build EX0 shell/lifecycle, EX1 conveyor and EX2 intake, then obtain paired visual review before the other four. Preserve exact world view on close and existing example URLs. This checkpoint changes plans only; UX-R1 is still the live runtime.


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

## W03A first increment production acceptance

Tested runtime: 97d9cb200a2cb11e09e6e3bbdce5f230ab2117e9. Renderer pin: 8d319eb633dff1edc37a1805997647acb3609581. Vercel success; 24 new-journey assertions plus 45 existing Lab/host regression checks passed with no runtime exceptions. All 62 deployed renderer hashes match. The new gate includes 16 procedure/approval/cache combinations and eight historian/cloud combinations; normal/failure/phone captures were inspected by the primary integrator. An initial Decision Room probe ran before client tiles were ready; explicit readiness plus final deployed verification confirms both editions. No Decision Room application change was required.

This follow-up is documentation only; the tested runtime SHA above remains the release baseline. Canonical evidence is under docs/three-worlds/evidence/w03a-production-final, w03a-regression-final and w03a-renderer-final in adamrappaport. A0/A1/A2 are production verified; A3 drawing search/A4 alarms are the exact next implementation pair. A5/A6, sound, scenario maps and real inference remain planned. First-breakout human review and physical-phone/Safari checks remain outstanding, not inferred from browser emulation.

## W03A A3/A4 implementation

Six example definitions now include energy.drawing-search (west treatment) and energy.alarm-investigation (north treatment). Original fixtures live in drawing.ts/alarm.ts; EvidenceTrend.tsx is shared with historian and preserves null gaps. Drawing source regions, quality/rotation, superseded filenames and register connectivity are explorable. The same AL-07 alarm has four competing-evidence cases and a source-linked human next-check choice. All values/drawings are original fictional examples, not OCR/model inference or a customer deployment.

Host build/typecheck and canonical 30 renderer assertions/eight contracts passed. Renderer pin 9f43f629a20dcc8c6e99e4ee0b42b3065c74effe. Production acceptance pending: run canonical lab-energy-check.mjs (24 drawing conditions/eight alarm-cloud conditions), lab-journeys-check.mjs and ai-lab-check.mjs against deployed host, then inspect normal/failure/phone captures. A5 mixer/A6 handover remain planned; no new local host server/test suite was started.

## W03A A3/A4 production acceptance

Tested runtime 5e4efa8d1b513a0ad06d6f2e66866e6976bf5366; renderer pin 9f43f629a20dcc8c6e99e4ee0b42b3065c74effe. Vercel success. Live gates: 25 energy assertions covering 24 drawing conditions and eight alarm/cloud conditions; 24 previous mining-journey assertions; 45 host/original vision regressions. All 62 renderer hashes match; zero runtime exceptions. Desktop/phone normal and failure captures inspected. No real OCR, model inference, operational connection or customer deployment claim.

A0-A4 are production verified, six journeys total. Next: A5 fictional constrained mixer selection, then A6 checked shift handover; read canonical LAB-EXPANSION.md and state.json. Keep source pin updates via canonical sync tool; retain no-local-host-server/test constraint. W04 scenario fog, W05 authoring trial and W06 optional sound remain planned. Human first-breakout review and physical-phone/Safari checks remain outstanding. Full evidence and continuation history are in adamrappaport docs/three-worlds/evidence/w03a-energy-production, w03a-energy-mining-regression and w03a-energy-host-regression.

## 2026-10-19 UX refresh

User feedback supersedes earlier layout acceptance. Example-first cards, normal page scrolling and a wider lesson replace the nested scrolling sidebar. Phone site context is collapsed by default with explicit Explore in 3D; expandable camera tools are opt-in controls=compact in the pinned renderer. All six recipes and authority rules remain. Steps now read Try it, How it works, Human decision; final action chooses another example. This checkpoint is pending deployed UX/condition verification, not final acceptance. A5/A6 paused until this UX pass is verified.

## UX release acceptance — 19 October 2026

Tested runtime 397eb1ede800bc28f88c540cb8a1bf745fc4e414; pinned renderer 53d3cf1ce33d7dd8b8f5fa1136f1e4e13f22c12d (65 files). Vercel success. Final deployed gates: 211 UX assertions across six journeys at 320/390/820-landscape/1600 widths; 24 mining, 25 energy and 45 host assertions. Zero runtime exceptions; source hashes match; canonical 30 renderer checks passed. Primary inspected final choice screens, normal lessons, mobile input/result ordering and expanded world views. These are browser emulation checks; physical iPhone/Safari and user usability review remain outstanding.

The supported interaction is now: industry → example card → Try it / How it works / Decide → another example. No nested lesson scroller. Mobile site context expands deliberately; camera tools have their own disclosure and remain inside the scene at narrow widths. Hidden scenes skip GPU animation; the lesson works while 3D loads. World hotspots remain an alternative entry. Browser Back/deep links/reset/source links and human authority remain verified. Evidence and UX-R1.md are in canonical docs/three-worlds; use its state.json to continue. A5/A6 were deferred to prioritise this feedback.


## EX0–EX2 proof pair — 19 October 2026

World-first exploration replaces the lesson-step UI. One mounted iframe stays inside a native dialog that switches between inline world and modal exhibit (no reparenting or reload); renderer switches to deterministic conveyor/intake exhibit scenes. All six old example query IDs are retained. Other four examples currently show concise workflow overviews; their detailed dioramas await paired human review. Host build/type check passed before publication; deployed browser validation pending. Canonical scripts/exhibit-renderer-check.mjs passed 17 checks; selected captures and renderer pin are canonical evidence. Continue from canonical state for exact release status.


## EX0–EX2 production receipt

Runtime `fee3f26`, renderer pin `3a9fd9d4559aabe788e5db79781f3863214b80e3`: Vercel success and live interactive acceptance passed. Canonical evidence/exhibits-release contains 103 responsive checks, 76 pin/asset/route/reduced-motion checks and selected desktop/phone captures. The single iframe stays permanently inside an inline/modal native dialog; do not reparent or reload it. Synchronous prepare snapshots the world before layout changes; preserve Next history state. Two animated dioramas are live, four other examples remain concise workflow overviews until EX3. Await user paired review before adding their detailed scenes. Physical phone/Safari testing remains outstanding. Use the canonical exhibit-host-check and exhibit-release-check gates; historical lesson UI selectors are superseded. No host local server/test suite was run; production build/type validation passed.


## Scene fullscreen release — 19 October 2026

Host runtime `79422cc`; renderer pin `b32900c8682e3cf68f83a777d920dfa8e2bbad64`. World, both detailed exhibits and the four workflow stages have Full screen / Exit full screen × controls. Native stage fullscreen is used where supported; a modal viewport fallback handles unavailable/rejected APIs. Escape from iframe content exits fullscreen first, keeping an exhibit open. No iframe reparent/reload. Browser fullscreen changes and body scroll lock are synchronised. Production build/type validation and 97 live browser checks passed (native desktop, forced no-API phone and short landscape, both industries/all examples, X/Escape, one retained canvas). Canonical evidence/scene-fullscreen contains selected captures and verification.json. Physical Safari remains untested. EX3 still awaits paired user review.


## Camera controls/Fly repair — 19 October 2026

Runtime `4a8ed8a`, renderer pin `e2708a6a0437c665ea7f0d4df938cc8c5bf3656d`. Fixed automatic pointer capture blocking UI and conflicting landscape offsets stretching the camera panel. Compact embeds now use a 280x107 basic overlay with close × and More for advanced options, without reducing canvas size. Fly starts in drag-look and collapses the panel; Exit fly stays visible. Mouse capture is explicit via Lock mouse; Escape releases/exits. Touch movement uses a smaller two-row pad. Production build and Vercel succeeded; 81 deployed browser checks passed for both worlds at 1440/390/320/820 widths, including touch holds/release, fullscreen, close while flying, WASD, keyboard Fly, no automatic capture and retained exit pose. Canonical evidence/camera-controls-live has the receipt/captures. Use scripts/camera-controls-check.mjs. Paired exhibit review remains next; physical Safari remains untested.


## Space and context release - 19 October 2026

Runtime `5896473` (feature `3e9f01d`); renderer pin `b59d393ef515d18b09f73cd1d310ec656f13c6e5`. Close-up geometry now fits its actual viewport with a centred silhouette and 8% margin, with compact headers, a larger model column and readable copy. The phone sheet puts the model then its benefit/explanation in normal scrolling order. Two detailed models remain; the other four are workflow overviews pending EX3 paired review.

Decision Room now leads with the current question and response choices, keeping What changed/Still uncertain visible. Explain more opens the complete existing evidence, stakes, limits and glossary; Site status opens the original dashboard. Edition introductions, presenter briefings and private facilitator guidance use the same disclosure where applicable. Scenario data, votes, API permission boundaries and review packs are unchanged. Native dialogs support Close, Escape and focus return; drafts remain intact.

Production build/type validation passed. The canonical scripts/space-context-check.mjs passed 190 deployed browser checks: both scenarios/all six rounds at desktop and phone sizes, original options/costs and complete context, draft preservation, site status, projector, edition introduction/focus, model framing and readable layout. Decision Room uses intercepted browser-only current-round fixtures: no real room was created or changed; this validates deployed UI, not a new backend exercise. Primary inspected desktop/phone captures. Canonical deterministic renderer gate passed 21 checks; physical Safari and user acceptance remain outstanding. Read canonical state.json and evidence/space-context for receipts and continuation.
