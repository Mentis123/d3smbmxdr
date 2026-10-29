/**
 * Ironvale Mining, revision 0.2: the Agent 0 edition on the Decision Room rails (29 Oct 2026).
 *
 * Same six rounds, branching, consequences, reveals and facilitator guidance as 0.1, option by option
 * (A–D keep their intent, so consequences still fit). What changes is what the room reads: a situation
 * of at most 55 words, a short question, options of at most eight words, and a cost on every option in
 * the form "what you gain; what you give up", written so the facilitator's preferred option bites too.
 * 0.1 stays registered for rooms already pinned to it.
 */
import { IRONVALE } from "./ironvale";
import type { Scenario } from "./types";

type Tight = { situation: string; question: string; options: [string, string][] };

const TIGHT: Record<string, Tight> = {
  triage: {
    situation: "18:31: an unfamiliar sign-in used Agent 0's identity. 18:36: Defender saw an unexpected process on its integration host contact an unknown address. The SOC summary calls it scheduled maintenance but cites no change record. The night shift is waiting on Agent 0's work packs. Nothing shows the plant is affected.",
    question: "What do you do before trusting the summary?",
    options: [
      ["Declare a major incident; isolate the host", "Cuts the active path in minutes; the night shift loses work packs before scope is known."],
      ["Wait for the service owner to confirm", "Protects a possibly legitimate job; the process keeps running for as long as the callback takes."],
      ["Escalate, check the source, block the outbound path", "Bounded and evidence-led; ties up an analyst and may still break the integration."],
      ["Make Agent 0 read-only, then check its identity", "Stops the agent writing anything; the suspicious process on the host keeps running."],
    ],
  },
  inject1: {
    situation: "The host got tokens as spn-agent0-ops and read a vault secret the old maintenance connector uses. The identity reaches more storage than its job needs, and Agent 0 is in no governed inventory. Your last call changed the host, not the identity or a copied secret. The site can run on manual requests.",
    question: "Where do you draw the containment line?",
    options: [
      ["Restrict the identity; rotate the exposed secret", "Closes the stolen path properly; breaks the integration and needs the service owner tonight."],
      ["Disable Agent 0's front end only", "Maintenance integrations keep running; stolen tokens and the copied secret may still work."],
      ["Rotate every maintenance credential at once", "Nothing copied still works; site-wide integrations fail and recovery spreads across teams."],
      ["Block new sign-ins, observe, rotate later", "Little business impact now; tokens already issued and non-Entra access stay unknown."],
    ],
  },
  inject2: {
    situation: "Analysts are buried in repeat activity. A Sentinel playbook can enrich evidence and contain listed IT assets. A proposed extension would add the site broker and engineering systems, which are not approved targets. Defender may apply its own disruption separately. An AI recommendation quotes a contractor document without a source.",
    question: "What authority do you delegate tonight?",
    options: [
      ["Analyst approval for every action", "Full human control; a stretched team falls behind on repetitive containment."],
      ["Full playbook on every related asset, 15 minutes", "Fastest coverage; a wrong asset link can stop something the site depends on."],
      ["Enrich only; contain by hand", "Evidence arrives fast; containment stays the bottleneck while activity repeats."],
      ["Auto-act on listed IT assets; site needs approval", "Speed inside a tested scope; two authority paths to run, and site actions still wait."],
    ],
  },
  inject3: {
    situation: "OT sensors show unfamiliar traffic from the contractor access broker to an engineering workstation: a suspicious path, not proof controller logic changed. The site lead says the process is stable. The broker isn't part of the safety system but is needed for tonight's vendor task. A caller claiming to be you wants broader changes.",
    question: "What do you authorise at the site boundary?",
    options: [
      ["Site begins its controlled safe-state procedure", "The plant is in a known state; production stops even if only the broker is affected."],
      ["Verify the caller; restrict the broker with site", "Closes the suspect route; the vendor task slips and the site carries the coordination."],
      ["Keep the broker connected under close watch", "Vendor support continues; the suspicious path stays open while you watch."],
      ["Cut the wider OT uplink now", "Closes every path at once; you lose visibility and integrations far beyond the broker."],
    ],
  },
  inject4: {
    situation: "Defender shows unusual reads tied to the incident, and Purview finds sensitive contractor documents in an over-shared location; neither proves what left. A protected backup exists but has not been checked in isolation. The next shift needs work packs. Legal and privacy are assessing notification.",
    question: "What recovery do you approve for the next shift?",
    options: [
      ["Restore the backup straight into production", "Work packs are back fastest; you trust a restore nobody has checked."],
      ["Hold recovery until the full assessment ends", "Nothing restored on guesswork; services that were safe to restore stay down longer than needed."],
      ["Validate a clean restore in isolation, then release", "Recovery you can evidence; the next shift works on manual packs while it is validated."],
      ["Rebuild the integration from known-good source", "Cleanest break from the compromised runtime; the longest outage and the most rework."],
    ],
  },
  inject5: {
    situation: "The site is stable and essential services have a documented recovery position. The incident exposed gaps in agent ownership, credential scope and automated response authority. Maintenance coordination has real value, but full access is not justified yet. The action log shows what is fixed, what is uncertain and what is only proposed.",
    question: "What mandate do you give management for Agent 0?",
    options: [
      ["Staged return, gated on named owners", "Value returns step by step; a slower rollout, and owners must sign off each gate."],
      ["Suspend until an independent review concludes", "Most assurance before reuse; manual work continues and other agents go unreviewed meanwhile."],
      ["Return it with extra SOC monitoring", "Productivity back fastest; the ownership and scope gaps that caused this stay open."],
      ["Replace it with a new managed platform", "A fresh operating model; migration still needs owners, permissions and testing, and takes longest."],
    ],
  },
};

export const IRONVALE_V02: Scenario = {
  ...IRONVALE,
  key: "ironvale@0.2",
  revision: "0.2",
  rounds: IRONVALE.rounds.map((round) => {
    const t = TIGHT[round.id];
    if (!t) throw new Error(`ironvale@0.2 has no tightened text for round ${round.id}`);
    return {
      ...round,
      prompt: t.question,
      situation: [t.situation],
      ...(round.briefing ? { briefing: { ...round.briefing, changed: t.situation } } : {}),
      options: round.options.map((option, i) => ({ ...option, label: t.options[i][0], cost: t.options[i][1] })),
    };
  }),
};
