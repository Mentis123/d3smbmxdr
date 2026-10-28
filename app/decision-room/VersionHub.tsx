import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Activity, Radio, ShieldCheck } from "lucide-react";
import "./version-hub.css";
import ExplainMore from "./ExplainMore";

export type Edition = "ciso-basecamp" | "agent-0" | "coastwater" | "marlow-vale";
export const editions = {
  "ciso-basecamp": {
    number: "01", title: "CISO Basecamp", label: "Original edition", status: "Customer tested",
    image: "/decision-room-art/ciso-basecamp.webp", imageAlt: "Riverbend water and energy infrastructure within a luminous security perimeter",
    line: "The incident is unfolding. The next call is yours.",
    description: "Take the room from the SOC floor to the boardroom. Six decisions. Competing priorities. One critical infrastructure organisation to protect.",
    tags: ["Cyber leadership", "Critical infrastructure", "Six rounds"],
  },
  "agent-0": {
    number: "02", title: "Agent 0", label: "Next edition", status: "Preview",
    image: "/decision-room-art/agent-0.webp", imageAlt: "An autonomous AI maintenance agent connected to mining operations inside a glowing containment ring",
    line: "The mine keeps moving. Who decides what stops?",
    description: "Ironvale Mining runs a maintenance agent across its operations. Six decisions, from the SOC to the board, on what the agent may touch while the mine keeps moving.",
    tags: ["Agentic AI", "Mining operations", "Six decisions"],
  },
  coastwater: {
    number: "03", title: "Coastwater", label: "Board workshop", status: "Ready to run",
    image: "/decision-room-art/coastwater-ocean.webp", imageAlt: "Breaking blue ocean waves along sandstone headlands, with a coastal community and water utility at dusk",
    line: "The pilot that became policy.",
    description: "Six difficult AI decisions at a regional water utility. Make a call, weigh the cost, and hear why others disagree. Run the whole workshop from the app.",
    tags: ["AI governance", "Board and senior leaders", "Six decisions"],
  },
  "marlow-vale": {
    number: "04", title: "Marlow Vale", label: "Seller workshop", status: "Ready to run",
    image: "/decision-room-art/marlow-vale.webp", imageAlt: "Abstract artwork: a branching golden path rising over the night lights of a regional town",
    line: "Every commitment has a cost.",
    description: "Six selling decisions across a year with one fictional council. Choose the next commitment, name what it gives up, and hear why other account teams chose differently. Run it all from the display.",
    tags: ["Data & AI sellers", "Customer conversations", "Six decisions"],
  },
} as const;
const artCaption: Record<Edition, string> = { "ciso-basecamp": "RIVERBEND / WATER & ENERGY", "agent-0": "IRONVALE / MINING OPERATIONS", coastwater: "COASTWATER / AI GOVERNANCE", "marlow-vale": "MARLOW VALE / DATA & AI SELLING" };
const railsEditions: Edition[] = ["coastwater", "marlow-vale"];

function SignalTrace() {
  return <svg viewBox="0 0 360 56" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M0 35H50L57 28L65 42L74 14L84 48L94 27L103 35H160L174 26L185 35H245L252 29L260 43L270 8L281 48L291 30L300 35H360" /></svg>;
}

export default function VersionHub() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-AU", { hour12: false }));
    update(); const id = setInterval(update, 1000); return () => clearInterval(id);
  }, []);
  return <main className="vh-shell">
    <div className="vh-grid" aria-hidden="true" />
    <header className="vh-nav">
      <a className="vh-brand" href="/decision-room" aria-label="Decision Room home"><span>Data<sup>#</sup>3</span><i /><strong>Decision Room<small>LIVE TABLETOP EXPERIENCES</small></strong></a>
      <div className="vh-nav-signal"><span className="vh-led" />ROOM FOR YOUR NEXT CALL <time>{time || "--:--:--"}</time></div>
    </header>
    <section className="vh-intro" aria-labelledby="vh-title">
      <div><div className="vh-eyebrow"><Radio size={14} /> HUMAN JUDGEMENT. REAL CONSEQUENCES.</div>
        <h1 id="vh-title">The room is yours.<br /><span>Make the call.</span></h1>
        <p>A critical decision. A table of competing perspectives.<br className="vh-desktop-break" /> Choose your experience and put your judgement to the test.</p>
      </div>
      <div className="vh-instrument" aria-label="Tabletop format: six rounds, one device per table, every decision matters">
        <div className="vh-instrument-label"><Activity size={14} /> DECISION SIGNAL <span>ILLUSTRATIVE</span></div>
        <SignalTrace />
        <div className="vh-instrument-stats"><div><b>06</b><small>ROUNDS</small></div><div><b>01</b><small>DEVICE / TABLE</small></div><div><b>A–D</b><small>YOUR CALL</small></div></div>
      </div>
    </section>
    <div className="vh-section-label"><span><i />SELECT YOUR EXPERIENCE</span><small>{String(Object.keys(editions).length).padStart(2, "0")} EXPERIENCES <ArrowDown size={13} /></small></div>
    <section className="vh-editions" aria-label="Tabletop versions">
      {(Object.keys(editions) as Edition[]).map((id) => { const e = editions[id]; return <a key={id} className={`vh-tile vh-tile--${id}`} href={`/decision-room/${id}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${e.title}, opens in a new tab`}>
        <div className="vh-art"><img src={e.image} alt={e.imageAlt} width="1200" height="800" fetchPriority="high" /><div className="vh-art-scan" aria-hidden="true" /><div className="vh-tile-top"><span className="vh-version">{e.number} <i /> {e.label}</span><span className="vh-status"><i />{e.status}</span></div><span className="vh-art-caption" aria-hidden="true">{artCaption[id]}</span></div>
        <div className="vh-tile-copy"><div className="vh-title-row"><h2>{e.title}</h2><span className="vh-open"><ArrowRight size={23} /></span></div><p className="vh-tagline">{e.line}</p><p className="vh-description">{e.description}</p><div className="vh-tags">{e.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="vh-tile-bottom"><span>Enter {e.title}</span><span>EXP / {e.number} <ArrowRight size={15} /></span></div></div>
      </a>; })}
    </section>
    <aside className="vh-brief"><ShieldCheck size={22} /><div><strong>One room. Every perspective.</strong><p>Join as a table, facilitate the session or put the unfolding story on the big screen. Your facilitator will tell you which edition to open.</p></div><a href="/decision-room/join">Have a room code? <ArrowRight size={17} /></a></aside>
    <HomeFooter />
  </main>;
}

/** Shared home-page credit, matching the Cisco Live attribution and link. */
export function HomeFooter() {
  return <footer className="vh-footer">
    <div className="vh-footer-main"><span>Data<sup>#</sup>3 · Delivering the Digital Future</span><span className="vh-footer-motto">DISCUSS <i /> DECIDE <i /> SEE WHAT CHANGES</span><small>Artwork generated with AI</small></div>
    <p className="vh-credit">© {new Date().getFullYear()} Data<sup>#</sup>3. Experience Vibe Coded by our resident <a href="https://www.linkedin.com/in/adam-aka-mentis" target="_blank" rel="noopener noreferrer">Tech Wizard</a>.</p>
  </footer>;
}

/** Which scenario family a new room of each edition runs on this deployment (from the API, so the copy never overstates). */
function useEditionFamily(edition: Edition) {
  const [family, setFamily] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/decision-room/editions").then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive) setFamily(d?.[edition]?.family ?? null); }).catch(() => undefined);
    return () => { alive = false; };
  }, [edition]);
  return family;
}

export function EditionIntro({ edition }: { edition: Edition }) {
  const e = editions[edition];
  const family = useEditionFamily(edition);
  const agent0 = family === "riverbend"
    ? "Set at Ironvale Mining, where a maintenance agent works across the operation. The mining rounds are in review; until they are approved, rooms opened here run the original six rounds."
    : "Set at Ironvale Mining, where a maintenance agent works across the operation. Six rounds, from the SOC to the board, each with a sourced briefing. A preview edition, in review with Rich and Scott.";
  return <section className={`vh-edition-intro vh-edition-intro--${edition}`}>
    <a className="vh-back" href="/decision-room"><ArrowLeft size={15} />All experiences</a>
    <div className="vh-eyebrow">{e.number} / {e.label} <span className="vh-status"><i />{e.status}</span></div>
    <img className="vh-edition-art" src={e.image} alt="" width="1200" height="800" />
    <h1>{e.title}</h1><p className="vh-edition-line">{e.line}</p>
    <p>{edition === "coastwater" ? "Act as Coastwater's board. Six decisions. Different views welcome." : edition === "marlow-vale" ? "Act as the Data#3 account team for one council. Six decisions. Different views welcome." : edition === "agent-0" ? (family === "riverbend" ? "Mining preview. New rooms currently use the original scenario." : "A facilitated mining tabletop. One device per table.") : "Six rounds. One device per table."}</p>
    {railsEditions.includes(edition) ? <p><a className="vh-back" href={`/decision-room/${edition}/present`}>Rehearse the full presentation <ArrowRight size={15} /></a><small style={{ display: "block", fontSize: 14 }}>No key needed to rehearse. Create a live room to collect table votes.</small></p> : null}
    <ExplainMore title={`About ${e.title}`}><p>{edition === "marlow-vale" ? "Six customer conversations at a fictional regional council, from the first meeting to a two-year proposal: licences or services, funded entry or funded delivery, speed or readiness, the business or IT, demo or production, what exists or what is coming. Every option carries a visible cost. Run every screen with Next and Back." : edition === "coastwater" ? "Six governance decisions at a fictional water utility. Vote as a table, explain the disagreement, consider new information and capture the permission, conditions, owner and escalation trigger. Dan can run every screen with Next and Back." : edition === "agent-0" ? agent0 : "One device per table. Six rounds, from the SOC floor to the boardroom. Vote A–D, say why, lock it — then see where the room landed."}</p><p>{e.description}</p><div className="vh-tags">{e.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></ExplainMore>
    {edition === "agent-0" ? <a className="vh-back vh-review-link" href="/decision-room/agent-0/review">Facilitator review pack <ArrowRight size={15} /></a> : null}
  </section>;
}
