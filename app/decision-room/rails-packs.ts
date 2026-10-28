import { COASTWATER_MODULES as coastwaterModules, COASTWATER_STORY as coastwaterStory } from "../../lib/decision-room/coastwater-content";
import { COASTWATER_MODULES as coastwaterLegacyModules, COASTWATER_STORY as coastwaterLegacyStory } from "../../lib/decision-room/coastwater-content-v1";
import { MARLOWVALE_MODULES, MARLOWVALE_STORY } from "../../lib/decision-room/marlowvale-content";
import type { RailsFamily } from "../../lib/decision-room/rails";

/** One decision on the rails presenter. Coastwater revision 1 also uses reveal/reconsider/boundary screens. */
export type RailsModule = { readonly id: string; readonly title: string; readonly topic: string; readonly situation: string; readonly question: string; readonly options: readonly string[]; readonly tradeoffs: readonly string[]; readonly discuss: readonly string[]; readonly reveal: string; readonly reconsider: string; readonly boundary: string; readonly notes: string };

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
    welcome: { kicker: "MARLOW VALE · DATA#3 ACCOUNT TEAMS", title: ["Every commitment", "has a cost."], lead: "The customer wants AI. What will you put your name to?", footnote: "Fictional customer, people and events. No answer key." },
    role: { kicker: "YOUR ROLE · THE DATA#3 ACCOUNT TEAM", highlight: "The customer decides what to buy. You decide what you will commit to, and what you will not promise." },
    console: { title: "Every commitment has a cost", captureSummary: "Optional · capture the room's commitment", captureLabel: "Capture what the room would commit to", capturePlaceholder: "What we would propose, what it gives up, what we would not promise…" },
    discussHint: "Ask a table that went big and a table that held back to explain what each gave up.",
    closing: { kicker: "THE ROOM'S SELLING PATTERN", title: "What will we commit to?", lead: "Read back what each table led with, what it gave up and what it refused to promise.",
      prompts: [["What we led with", "Licences or services? The business or IT? Speed or readiness?"], ["What we gave up", "Which costs did we accept to keep the customer moving, and which did we refuse?"], ["What we will not promise", "Which scope, funding, dates or services stay out of writing until they are confirmed?"]],
      perDecision: "What would we propose here, and what would we refuse to promise?",
      highlight: "Which conversation will you open differently with your next customer?",
      footnote: "Captured commitments stay in this browser. Download them before changing devices." },
    record: { noun: "commitments", missing: "No commitment recorded.", exportTitle: "MARLOW VALE · EVERY COMMITMENT HAS A COST", exportFile: "marlow-vale-commitments.txt" },
    notes: { opening: "Introduce Marlow Vale: one fictional council, six moments across a year of selling. One response per table. Seek different reasoning without scoring the tables. Allow about five minutes per decision, including the discussion.", closing: "Read back each table's pattern: where it led with licences or services, the business or IT, speed or readiness, and what it refused to promise. Ask what each seller will do differently next week. Download the record." },
  },
};
