import { MARLOWVALE_MODULES, MARLOWVALE_STORY } from "./marlowvale-content";
import type { OptionKey, Scenario } from "./types";

/** Seller workshop on the Coastwater rails: 15 screens, two per decision, driven from the display. */
export const MARLOWVALE: Scenario = {
  key: "marlowvale@1", family: "marlowvale", revision: "1", status: "live",
  brand: {
    kicker: "EVERY COMMITMENT HAS A COST · MARLOW VALE", short: "Marlow Vale",
    reportTitle: "Marlow Vale · the account team's calls", pathTitle: "The account decisions",
    lobby: { title: "Welcome to the Marlow Vale account", hint: "One device per table. Agree a call, record why and keep any disagreement for the discussion." },
    launched: { title: "One customer, six commitments", body: MARLOWVALE_STORY },
    ended: { title: "What will we commit to?", body: "Read back what each table led with, what it gave up and what it refused to promise. Export your decisions before closing the workshop." },
    consoleLobby: "Marlow Vale · the account team is gathering", consoleLaunched: "Every commitment has a cost",
    reportNote: "Fictional seller exercise. No preferred answer, scores or table rankings. Choices record judgements, not deal outcomes.",
    reportMode: "conditional",
  },
  organisation: { name: "Marlow Vale", tagline: "A fictional regional council · Data#3 seller workshop", estate: MARLOWVALE_STORY,
    holds: "Resident, planning, child-protection and personnel records.", reach: "AI conversations range from Copilot licences to agents, data platforms and ongoing services.", objective: "Practise choosing the next customer commitment, and naming what each choice gives up." },
  launch: { profileTitle: "One customer, six commitments", notePrefix: "Context", profileHint: "The customer, people and events are fictional. These are discussion choices, not an answer key.",
    profile: [{ label: "Executive pressure", value: "The CEO wants AI everywhere", note: "Momentum is real and perishable" }, { label: "IT", value: "Wants a roadmap and proof first", note: "Can slow or stop a deal" }, { label: "Budget", value: "One meaningful AI spend this year", note: "Every commitment must be delivered" }],
    terminal: "Marlow Vale · account plan", lines: [{ t: "Today", text: MARLOWVALE_STORY, tone: "plain" }], steps: [{ note: "The customer decides what to buy. The account team decides what it will commit to.", path: [] }] },
  stages: [],
  rounds: MARLOWVALE_MODULES.map((m, i) => ({ roundNo: i + 1, id: m.id, seat: "Data#3 account team", when: `Decision ${i + 1} of 6`, title: m.title, prompt: m.question,
    situation: [m.situation], feed: [], path: [], durationSeconds: 150,
    options: m.options.map((label, j) => ({ key: "ABCD"[j] as OptionKey, label, cost: m.tradeoffs[j], consequence: { you: `Your table chose ${"ABCD"[j]}: ${label}.`, body: `${m.tradeoffs[j]} ${m.boundary}`, changes: [] } })),
    reveal: { boundary: "Compare the downsides each table accepts.", lesson: "What would change your call?", questions: [...m.discuss] },
  })),
  runPlan: { totalMinutes: 40, decideMinutes: 2.5,
    segments: [{ key: "open", label: "Meet Marlow Vale and agree the format", from: 0, to: 3, slides: "Opening screens" }, { key: "launch", label: "The account team's task", from: 3, to: 5, slides: "How to take part" }, ...MARLOWVALE_MODULES.map((m, i) => ({ key: `r${i + 1}`, label: m.title, from: 5 + i * 5, to: 10 + i * 5, slides: "Situation and decision · room discussion" })), { key: "close", label: "Read back the commitments and next steps", from: 35, to: 40, slides: "Closing screens" }],
    advice: { openingBehind: "Introduce the customer briefly, then begin.", closingBehind: "Capture what each table would and would not promise before closing.", roundBehind: "Hear two different views and capture what each gives up.", openingTighten: "Explain one response per table and begin.", roundTighten: "Ask which cost each table accepts and what would change its call." } },
};
