import { COASTWATER_MODULES, COASTWATER_STORY } from "./coastwater-content";
import type { OptionKey, Scenario } from "./types";

export const COASTWATER: Scenario = {
  key: "coastwater@1", family: "coastwater", revision: "1", status: "live",
  brand: {
    kicker: "THE PILOT THAT BECAME POLICY · COASTWATER", short: "Coastwater",
    reportTitle: "Coastwater · the board's decisions", pathTitle: "The governance questions",
    lobby: { title: "Welcome to Coastwater's board", hint: "One device per table. Agree a call, record why and keep any disagreement for the discussion." },
    launched: { title: "Six weeks before summer", body: COASTWATER_STORY },
    ended: { title: "What have we authorised?", body: "Read back the permission, conditions, accountable owner and escalation trigger. Export your decisions before closing the workshop." },
    consoleLobby: "Coastwater · the board is gathering", consoleLaunched: "The pilot that became policy",
    reportNote: "Fictional discussion exercise inspired by the SGW briefing. No preferred answer, scores or table rankings. Choices record judgements, not measured safety outcomes.",
    reportMode: "conditional",
  },
  organisation: { name: "Coastwater", tagline: "A fictional regional water utility · board and senior leadership workshop", estate: COASTWATER_STORY,
    holds: "Customer information, operational records and confidential board papers.", reach: "AI proposals range from drafting to customer profiling and operational advice. No scenario authorises autonomous plant control.", objective: "Set a first view of AI risk appetite and make the limits of management's authority explicit." },
  launch: { profileTitle: "Six weeks before summer", notePrefix: "Context", profileHint: "All organisations, events and outcomes are fictional. These are discussion choices, not an answer key.",
    profile: [{ label: "Service pressure", value: "Customer backlog and summer demand", note: "Delaying improvements also has costs" }, { label: "People", value: "An operations expert is retiring", note: "Experience must be captured" }, { label: "Readiness", value: "Information assessment unfinished", note: "Permission needs boundaries" }],
    terminal: "Coastwater · board agenda", lines: [{ t: "Today", text: COASTWATER_STORY, tone: "plain" }], steps: [{ note: "The board sets risk appetite. Management proposes uses and runs controls.", path: [] }] },
  stages: [],
  rounds: COASTWATER_MODULES.map((m, i) => ({ roundNo: i + 1, id: m.id, seat: "Board and senior leaders", when: `Decision ${i + 1} of 6`, title: m.title, prompt: m.question,
    situation: [m.situation], feed: [], path: [], durationSeconds: 240,
    options: m.options.map((label, j) => ({ key: "ABCD"[j] as OptionKey, label, cost: m.tradeoffs[j], consequence: { you: `Your table chose ${"ABCD"[j]}: ${label}.`, body: `${m.tradeoffs[j]} ${m.boundary}`, changes: [] } })),
    reveal: { boundary: m.reveal, lesson: m.reconsider, questions: [...m.discuss] },
  })),
  runPlan: { totalMinutes: 60, decideMinutes: 4,
    segments: [{ key: "open", label: "Meet Coastwater and agree the format", from: 0, to: 5, slides: "Opening screens" }, { key: "launch", label: "The board's task", from: 5, to: 6, slides: "How to take part" }, ...COASTWATER_MODULES.map((m, i) => ({ key: `r${i + 1}`, label: m.title, from: 6 + i * 8, to: 14 + i * 8, slides: "Situation · decision · discussion · reveal · boundary" })), { key: "close", label: "Read back the appetite and next steps", from: 54, to: 60, slides: "Closing screens" }],
    advice: { openingBehind: "Introduce the setting briefly, then begin.", closingBehind: "Capture the conditions and owners before closing.", roundBehind: "Hear two different views and capture the boundary.", openingTighten: "Explain one response per table and begin.", roundTighten: "Use the main discussion question, then reveal the new information." } },
};
