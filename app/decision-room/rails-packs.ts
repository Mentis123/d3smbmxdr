import { COASTWATER_MODULES as coastwaterModules, COASTWATER_STORY as coastwaterStory } from "../../lib/decision-room/coastwater-content";
import { COASTWATER_MODULES as coastwaterLegacyModules, COASTWATER_STORY as coastwaterLegacyStory } from "../../lib/decision-room/coastwater-content-v1";
import { MARLOWVALE_MODULES, MARLOWVALE_STORY } from "../../lib/decision-room/marlowvale-content";
import type { RailsFamily } from "../../lib/decision-room/rails";

/** One decision on the rails presenter. Coastwater revision 1 also uses reveal/reconsider/boundary screens. */
export type RailsModule = { readonly id: string; readonly title: string; readonly topic: string; readonly situation: string; readonly question: string; readonly options: readonly string[]; readonly tradeoffs: readonly string[]; readonly discuss: readonly string[]; readonly reveal: string; readonly reconsider: string; readonly boundary: string; readonly notes: string; readonly lesson?: { boundary: string; lesson: string } | null };

/** Everything the rails presenter says that belongs to one workshop rather than to the format. */
export type RailsPack = {
  family: RailsFamily; edition: string; name: string;
  modules: readonly RailsModule[]; story: string; legacyModules?: readonly RailsModule[]; legacyStory?: string;
  welcome: { kicker: string; title: [string, string]; lead: string; footnote: string };
  role: { kicker: string; highlight: string };
  console: { title: string; captureSummary: string; captureLabel: string; capturePlaceholder: string };
  discussHint: string;
  closing: { kicker: string; title: string; lead: string; prompts: [string, string][]; perDecision: string; highlight: string; footnote: string };
  /** What the facilitator captures and exports: "boundaries" for Coastwater. */
  record: { noun: string; missing: string; exportTitle: string; exportFile: string };
  notes: { opening: string; closing: string };
  /** Workshop length shown on the welcome screen when no schedule is set. */
  minutes?: number;
  /** Load the decisions from the server deck (/api/decision-room/deck/<family>) instead of bundling them. */
  deck?: boolean;
  /** Show the round's reveal (what the tools did and did not do) on the discussion screen. */
  showLesson?: boolean;
};

export const RAILS_PACKS: Record<RailsFamily, RailsPack> = {
  coastwater: {
    family: "coastwater", edition: "coastwater", name: "Coastwater",
    modules: coastwaterModules, story: coastwaterStory, legacyModules: coastwaterLegacyModules, legacyStory: coastwaterLegacyStory,
    welcome: { kicker: "COASTWATER · BOARD AND SENIOR LEADERS", title: ["The pilot that", "became policy."], lead: "Useful AI spreads. What has the board actually authorised?", footnote: "Fictional exercise inspired by the SGW AI governance briefing." },
    role: { kicker: "YOUR ROLE · COASTWATER'S BOARD", highlight: "The board sets risk appetite. Management proposes the uses and runs the controls." },
    console: { title: "The pilot that became policy", captureSummary: "Optional · capture an appetite note", captureLabel: "Capture the board's boundary", capturePlaceholder: "Permission, conditions, accountable owner and escalation trigger…" },
    discussHint: "Ask a cautious table and a permissive table to explain their evidence thresholds.",
    closing: { kicker: "THE BOARD'S EMERGING RISK APPETITE", title: "What have we authorised?", lead: "Read back the choices, conditions and unresolved differences.",
      prompts: [["The downsides we accept", "Where would we accept uncertainty to improve service? Where would we wait for stronger evidence?"], ["What would change our minds", "Which conditions or evidence would expand, limit or stop permission?"], ["Where we still disagree", "What remains unresolved, and who should return with evidence?"]],
      perDecision: "What downside would we accept here, and what would make us reconsider?",
      highlight: "What should management feel confident doing without asking us? What must they never assume we have authorised?",
      footnote: "Captured boundaries stay in this browser. Download them before changing devices. Management develops the formal policy and returns for approval." },
    record: { noun: "boundaries", missing: "No boundary recorded.", exportTitle: "COASTWATER · THE PILOT THAT BECAME POLICY", exportFile: "coastwater-board-boundaries.txt" },
    notes: { opening: "Introduce the fictional setting. One response per table. Seek different reasoning without scoring the tables. Allow about five minutes per scenario, including the decision and discussion.", closing: "Read the boundaries back. Agree who will draft the policy, what remains unresolved and when management returns. Download the record." },
  },
  marlowvale: {
    family: "marlowvale", edition: "marlow-vale", name: "Marlow Vale",
    modules: MARLOWVALE_MODULES, story: MARLOWVALE_STORY,
    welcome: { kicker: "MARLOW VALE · DATA#3 ACCOUNT TEAMS", title: ["Every commitment", "has a cost."], lead: "The customer wants AI. Which offer do you put forward, when, and how?", footnote: "Fictional customer, people and events. No answer key." },
    role: { kicker: "YOUR ROLE · THE DATA#3 ACCOUNT TEAM", highlight: "Think like the customer, then decide what you will put your name to, and what you will not promise." },
    console: { title: "Every commitment has a cost", captureSummary: "Optional · capture the room's commitment", captureLabel: "Capture what the room would commit to", capturePlaceholder: "What we would propose, what it gives up, what we would not promise…" },
    discussHint: "Ask one table to argue the customer's side first, then hear a table that went big and one that held back.",
    closing: { kicker: "THE ROOM'S SELLING PATTERN", title: "What will we commit to?", lead: "Read back what each table led with, what it gave up and what it refused to promise.",
      prompts: [["What we led with", "Which offers did we put forward, and when? Licences or services, the business or IT, speed or readiness?"], ["What we gave up", "Which costs did we accept to keep the customer moving, and which did we refuse?"], ["What we will not promise", "Which scope, funding, dates or services stay out of writing until they are confirmed?"]],
      perDecision: "What would we propose here, and what would we refuse to promise?",
      highlight: "Which conversation will you open differently with your next customer?",
      footnote: "Captured commitments stay in this browser. Download them before changing devices." },
    record: { noun: "commitments", missing: "No commitment recorded.", exportTitle: "MARLOW VALE · EVERY COMMITMENT HAS A COST", exportFile: "marlow-vale-commitments.txt" },
    notes: { opening: "Introduce Marlow Vale: one fictional council, six moments across a year of selling. One response per table. Seek different reasoning without scoring the tables. Allow about five minutes per decision, including the discussion.", closing: "Read back each table's pattern: where it led with licences or services, the business or IT, speed or readiness, and what it refused to promise. Ask what each seller will do differently next week. Download the record." },
  },
  ironvale: {
    family: "ironvale", edition: "agent-0", name: "Agent 0",
    modules: [], story: "Ironvale Mining is a fictional hard-rock miner: a remote open pit, a processing plant and a SOC in Perth. Agent 0 builds the night shift's maintenance work packs. On Friday evening it starts behaving oddly. Take six seats through the night, from the duty analyst to the board. Decide as a table, say why, and see what your call changes.",
    deck: true, showLesson: true, minutes: 90,
    welcome: { kicker: "AGENT 0 · IRONVALE MINING", title: ["The mine keeps moving.", "Who decides what stops?"], lead: "One agent, one night shift, six calls from the SOC to the board.", footnote: "Synthetic exercise: every organisation, host, identity and alert is fictional. A preview in review." },
    role: { kicker: "YOUR ROLE · THE SEAT ON EACH SCREEN", highlight: "Keep people safe, keep the plant in a known state, preserve evidence and keep maintenance moving." },
    console: { title: "The mine keeps moving", captureSummary: "Optional · capture the room's improvement", captureLabel: "Capture what to improve and who owns it", capturePlaceholder: "What supported the process, what was missing, who owns the fix…" },
    discussHint: "Ask a table that acted fast and one that held back what evidence each relied on.",
    closing: { kicker: "THE WHOLE-CHAIN DEBRIEF", title: "That is the night.", lead: "Walk the chain from the first alert to the board: what held, what was missing, and who owns the fix.",
      prompts: [["What supported the process", "Which evidence, controls and people let each seat act with confidence?"], ["What was missing", "Where did a tool, an owner or an authority leave a gap?"], ["Who owns the improvement", "Name an owner and a first step for each gap before you leave."]],
      perDecision: "What supported the process here, and what was missing?",
      highlight: "Take one control to test, an owner and a date back to your organisation.",
      footnote: "Captured improvements stay in this browser. Download them before changing devices." },
    record: { noun: "improvements", missing: "No improvement recorded.", exportTitle: "AGENT 0 · IRONVALE MINING", exportFile: "agent-0-improvements.txt" },
    notes: { opening: "Introduce Ironvale and Agent 0: synthetic, a preview in review. One response per table. After each split, every table's phone shows its own consequence and state; this screen shows the room's split and what the tools did and did not do. Allow about twelve minutes per decision, including the debrief.", closing: "Run the whole-chain debrief: from the first alert to the board, what supported the process, what was missing and who owns each improvement. Download the record." },
  },
};
