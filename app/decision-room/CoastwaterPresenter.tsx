"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Maximize, Minimize, NotebookPen, Settings, X } from "lucide-react";
import CoastwaterFacilitatorPanel, { CoastwaterFeaturedComments, type CoastwaterSnapshot } from "./CoastwaterFacilitatorPanel";
import CoastwaterJoinInstructions from "./CoastwaterJoinInstructions";
import SessionScheduleEditor from "./SessionScheduleEditor";
import { sessionTime, type SessionSchedule } from "../../lib/decision-room/timing";
import { RAILS_PACKS } from "./rails-packs";
import type { RailsFamily } from "../../lib/decision-room/rails";
import AudienceTimerControl from "./AudienceTimerControl";
import "./coastwater.css";

type Snapshot = CoastwaterSnapshot;
/** "Move fast (Fabric Foundation Rapid)" shows the offer in brackets as its own tag. */
const offerLabel = (option: string) => { const m = option.match(/^(.*) \(([^()]+)\)$/); return m ? <>{m[1]}<em className="cw-offer">{m[2]}</em></> : option; };
const legacyPhases = ["The situation", "Your decision", "Explore the disagreement", "New information", "Set the boundary"];

const read = (key: string) => { try { return localStorage.getItem(key) || ""; } catch { return ""; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Storage may be unavailable. */ } };

async function api<T>(url: string, key: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method: body ? "POST" : "GET", headers: { "x-admin-key": key, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The room could not be updated.");
  return data as T;
}

/** The on-rails presenter for every rails family (Coastwater first); words come from its pack. */
export default function CoastwaterPresenter({ family = "coastwater", room = "", operator = false, displayOnly = false, displayToken = "" }: { family?: RailsFamily; room?: string; operator?: boolean; displayOnly?: boolean; displayToken?: string }) {
  const pack = RAILS_PACKS[family], home = `/decision-room/${pack.edition}`;
  const store = `${family}-presenter:${room ? "1" : "2"}:${room || "rehearsal"}`;
  const [step, setStep] = useState(() => Math.max(0, Math.min(14, Number(read(`${store}:step`)) || 0)));
  const [records, setRecords] = useState<Record<string, string>>(() => { try { return JSON.parse(read(`${store}:records`) || "{}"); } catch { return {}; } });
  const [key, setKey] = useState(() => read("decision-room-admin-key"));
  const [draftKey, setDraftKey] = useState("");
  const [data, setData] = useState<Snapshot | null>(null);
  const legacy = family === "coastwater" && data?.scenario.revision === "1"; // coastwater@1 keeps its five screens per decision
  const modules = legacy && pack.legacyModules ? pack.legacyModules : pack.modules;
  const STORY = legacy && pack.legacyStory ? pack.legacyStory : pack.story;
  const phases = legacy ? legacyPhases : ["Situation and decision", "Room discussion"];
  const LAST = 2 + modules.length * phases.length;
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(false);
  const [capture, setCapture] = useState(false);
  const [menu, setMenu] = useState(false);
  const [full, setFull] = useState(false);
  const [localChoices, setLocalChoices] = useState<Record<string, string>>({});
  const inFlight = useRef(false);
  const latestRevision = useRef(0);
  const token = displayToken || read(`decision-room-display:${room}`);
  const base = `/api/decision-room/sessions/${encodeURIComponent(room)}`;

  const refresh = useCallback(async () => {
    if (!room || (!key && !token)) return null;
    if (operator && !key) return null;
    const endpoint = operator ? `${base}/admin` : `${base}/console?displayToken=${encodeURIComponent(token)}`;
    const snapshot = await api<Snapshot>(endpoint, operator || !token ? key : "");
    if (snapshot.scenario.family !== family) throw new Error("This room belongs to another experience. Open it from Decision Room home.");
    if (snapshot.session.revision < latestRevision.current) return snapshot;
    latestRevision.current = snapshot.session.revision;
    setStep(snapshot.session.presentationStep);
    setData(snapshot); setUpdated(Date.now()); setError(""); return snapshot;
  }, [room, key, base, token, operator, displayOnly, family]);
  useEffect(() => {
    if (!room || (operator ? !key : !key && !token)) return;
    let active = true;
    const load = () => { if (active) refresh().catch(e => { if (active) setError(e.message); }); };
    load(); const interval = setInterval(load, 1500);
    return () => { active = false; clearInterval(interval); };
  }, [refresh, room, key, operator, token]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!room) write(`${store}:step`, String(step)); }, [step, store, room]);
  useEffect(() => { write(`${store}:records`, JSON.stringify(records)); }, [records, store]);
  useEffect(() => { const change = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener("fullscreenchange", change); return () => document.removeEventListener("fullscreenchange", change); }, []);

  const moduleIndex = step >= 2 && step < LAST ? Math.floor((step - 2) / phases.length) : -1;
  const phase = moduleIndex >= 0 ? (step - 2) % phases.length : -1;
  const current = modules[moduleIndex];
  const votePhase = phase === (legacy ? 1 : 0);
  const discussionPhase = phase === (legacy ? 2 : 1);
  const live = Boolean(room);
  const stale = live && updated > 0 && now - updated > 15000;

  async function move(target: number) {
    if (inFlight.current || displayOnly || target < 0 || target > LAST) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      if (live) {
        if (!key) throw new Error("Enter the facilitator key to control this room.");
        await api(`${base}/actions`, key, { action: "present", step: target, expectedStep: step });
        await refresh();
      } else setStep(target);
      setNotes(false); setCapture(false);
    } catch (e) { setError((e as Error).message); await refresh().catch(() => undefined); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function advance() { await move(step + 1); }
  async function back() { await move(step - 1); }
  async function roomAction(body: unknown) {
    if (inFlight.current || !key) return;
    inFlight.current = true; setBusy(true); setError("");
    try { await api(`${base}/actions`, key, body); await refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === `${store}:records` && event.newValue) {
        try { setRecords(JSON.parse(event.newValue)); } catch { /* Ignore invalid browser storage. */ }
      }
    };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, [store]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches("input, textarea, select") || event.target.isContentEditable || (event.key === " " && event.target.matches("button, a")))) return;
      if (displayOnly || menu || notes || capture) return;
      if (["ArrowRight", " ", "PageDown"].includes(event.key)) { event.preventDefault(); void advance(); }
      if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); back(); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setFull(f => !f); }
  }
  async function exportVotes() {
    setError("");
    try {
      const response = await fetch(`${base}/export`, { headers: { "x-admin-key": key } });
      if (!response.ok) throw new Error("Could not export votes. Open the room controls to retry.");
      download(await response.blob(), `${pack.edition}-${data?.session.joinCode || "room"}-votes.csv`);
    } catch (e) { setError((e as Error).message); }
  }
  function download(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function exportNotes() {
    const text = `${pack.record.exportTitle}\n${live ? `Room ${data?.session.joinCode || room}` : "Rehearsal / discussion"}\n${new Date().toLocaleString("en-AU")}\n\n` + modules.map((m, i) => `${i + 1}. ${m.title}\n${m.question}\n${records[m.id] || pack.record.missing}`).join("\n\n");
    download(new Blob([text], { type: "text/plain;charset=utf-8" }), pack.record.exportFile);
  }
  const sameRound = data?.session.activeRound === moduleIndex + 1;
  const discussion = sameRound ? data?.discussion : null;
  const selectedComments = discussion?.featured || [];
  const clockSeconds = data?.session.roundStartedAt ? Math.min(data.session.durationSeconds, Math.max(0, data.session.durationSeconds - Math.floor((now - new Date(data.session.roundStartedAt).getTime()) / 1000))) : 240;
  const clock = `${Math.floor(clockSeconds / 60)}:${String(clockSeconds % 60).padStart(2, "0")}`;

  const displayUrl = `${home}/present?room=${encodeURIComponent(room)}&display=1${token ? `&displayToken=${encodeURIComponent(token)}` : ""}`;
  const label = step === 0 ? "Welcome" : step === 1 ? "How to take part" : step === LAST ? "Read back and close" : `Decision ${moduleIndex + 1} · ${phases[phase]}`;
  const access = live && !key && !displayOnly ? <form className="cw-access" onSubmit={e => { e.preventDefault(); write("decision-room-admin-key", draftKey.trim()); setKey(draftKey.trim()); }}><label>Facilitator key<input type="password" value={draftKey} onChange={e => setDraftKey(e.target.value)} /></label><button disabled={!draftKey.trim()}>Open room controls</button></form> : null;

  if (operator) return <main className="cw-shell cw-operator">
    <header className="cw-header"><a className="cw-brand" href="/decision-room">Data<sup>#</sup>3 <span>Facilitator console · private</span></a><span className="cw-session">ROOM <b>{data?.session.joinCode || "…"}</b> · {stale ? "Reconnecting…" : "Live"}</span></header>
    {!room ? <section className="cw-fac-card"><h1>Create a {pack.name} room</h1><a href={home}>Open {pack.name}, then choose Facilitate.</a></section> : null}
    {access}
    {error ? <div className="cw-error" role="alert">{error}<button onClick={() => { setKey(""); write("decision-room-admin-key", ""); }}>Change key</button></div> : null}
    <section className="cw-fac-navigation"><div><p className="cw-kicker">ON THE AUDIENCE SCREEN · {label}</p><h1>{current?.title || (step === LAST ? pack.closing.title : pack.console.title)}</h1>{current ? <p>{current.question}</p> : <p>Open the audience display on the projector. Keep this console on your private screen.</p>}</div><div className="cw-fac-navigation-actions"><a className="cw-next" href={displayUrl} target="_blank" rel="noreferrer">Open audience display ↗</a><div><button onClick={() => void back()} disabled={busy || step === 0 || !data || stale}><ArrowLeft size={18} />Back</button><button className="cw-next" onClick={() => void advance()} disabled={busy || step === LAST || !data || stale}>{busy ? "Updating…" : votePhase ? "Close votes" : "Next"}<ArrowRight size={18} /></button></div><small>Next updates both screens. Back reviews a screen without changing votes.</small></div></section>
    {data ? <CoastwaterFacilitatorPanel data={data} busy={busy} onAction={roomAction} notes={current?.notes || "Monitor the tables and hear different views. Select comments for projection when tables lock their responses."}>
      {current ? <details><summary>{pack.console.captureSummary}</summary><label className="cw-record-label">{pack.console.captureLabel}<textarea rows={3} value={records[current.id] || ""} onChange={e => setRecords(r => ({ ...r, [current.id]: e.target.value }))} placeholder={pack.console.capturePlaceholder} /><small>Saved in this browser. Download the {pack.record.noun} at the end.</small></label></details> : null}
    </CoastwaterFacilitatorPanel> : key && room ? <p className="cw-fac-loading">Connecting to the room…</p> : null}
    {data ? <div className="cw-private-settings"><b>Private timing · {clock}</b><AudienceTimerControl enabled={data.session.audienceTimer} onChange={enabled => roomAction({ action: "audience-timer", enabled })} /></div> : null}
    <section className="cw-fac-utilities"><a href={`/decision-room/admin/${room}`} target="_blank" rel="noreferrer">Full room settings and timing ↗</a><a href={`/decision-room/report/${room}/rounds`} target="_blank" rel="noreferrer">Round-by-round report ↗</a><button onClick={exportVotes} disabled={!data}>Export votes</button><button onClick={exportNotes}>Export {pack.record.noun}</button><a href={`${home}/present?room=${room}`} target="_blank" rel="noreferrer">Presentation with controls ↗</a></section>
  </main>;

  return <main className={`cw-shell cw-shell--${family} ${full ? "cw-full" : ""}`}>
    <header className="cw-header"><a href="/decision-room" className="cw-brand">Data<sup>#</sup>3 <span>Decision Room</span></a><span className="cw-session">{live ? data ? <>ROOM <b>{data.session.joinCode}</b> · {stale ? "Reconnecting…" : "Live"}{data.session.schedule && data.session.audienceTimer ? <small className="cw-session-plan">{data.session.schedule.durationMinutes} min · finish {sessionTime(Date.parse(data.session.schedule.startsAt) + data.session.schedule.durationMinutes * 60000)}</small> : null}</> : "Opening live room…" : "REHEARSAL · NO LIVE VOTES"}</span><div className="cw-tools">{!displayOnly ? <button onClick={() => setNotes(n => !n)} aria-pressed={notes} title="Facilitator notes"><NotebookPen size={18} /><span>Notes</span></button> : null}<button onClick={fullscreen} aria-label={full ? "Exit full screen" : "Full screen"}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</button>{!displayOnly ? <button onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label="Workshop controls"><Settings size={18} /></button> : null}</div></header>
    {access}
    {menu ? <section className="cw-menu" aria-label="Workshop controls"><button className="cw-close" onClick={() => setMenu(false)} aria-label="Close controls"><X /></button><h2>Workshop controls</h2>{live && data ? <SessionScheduleEditor key={data.session.schedule ? `${data.session.schedule.startsAt}:${data.session.schedule.durationMinutes}` : "unscheduled"} schedule={data.session.schedule} defaultMinutes={legacy ? 60 : 40} onSave={async (schedule) => { await api(`${base}/actions`, key, { action: "schedule", ...schedule }); await refresh(); }} /> : null}<p>Arrow keys or Space advance the display. Back reviews a screen without reopening votes.</p><button onClick={exportNotes}><Download size={16} />Export captured {pack.record.noun}</button>{live ? <><button onClick={exportVotes}><Download size={16} />Export table votes</button><a href={`/decision-room/admin/${room}`} target="_blank" rel="noreferrer">Full room settings</a><a href={`${home}/control?room=${room}`} target="_blank" rel="noreferrer">Open facilitator console</a><a href={`/decision-room/report/${room}/rounds`} target="_blank" rel="noreferrer">Open round-by-round report</a><button onClick={() => { setKey(""); setDraftKey(""); write("decision-room-admin-key", ""); setMenu(false); }}>Use a different facilitator key</button></> : <button onClick={() => { setStep(0); setMenu(false); }}>Return to opening</button>}<a href={home}>{pack.name} home</a></section> : null}
    {error ? <div role="alert" className="cw-error">{error}<button onClick={() => setError("")} aria-label="Dismiss error">×</button></div> : null}
    <section className="cw-stage" aria-label="Workshop presentation">
      {step === 0 ? <div className="cw-opening"><div className="cw-opening-art" /><div className="cw-opening-copy"><div className="cw-welcome-layout"><div><p className="cw-kicker">{pack.welcome.kicker}</p><h1>{pack.welcome.title[0]}<br /><em>{pack.welcome.title[1]}</em></h1><p className="cw-lead">{pack.welcome.lead}</p><p>{STORY}</p><div className="cw-meta"><span>6 decisions</span><span>About {data?.session.schedule?.durationMinutes || (legacy ? 60 : 40)} minutes</span><span>One response per table</span></div><small>{pack.welcome.footnote}</small></div><CoastwaterJoinInstructions code={data?.session.joinCode} name={pack.name} /></div></div></div> : step === 1 ? <div className="cw-instructions"><p className="cw-kicker">{pack.role.kicker}</p><h1>Different views are the point.</h1><div className="cw-instruction-grid"><div><h2>Make a call together</h2><ol><li>Read the situation and choose A–D.</li><li>Record why, including a minority view.</li><li>Hear another table's reasoning.</li><li>Name the downside you accept and what would change your mind.</li></ol><p className="cw-highlight">{pack.role.highlight}</p><p>No scores or prescribed winning answer. Compare the evidence and the trade-offs.</p></div><CoastwaterJoinInstructions code={data?.session.joinCode} name={pack.name} /></div></div> : step === LAST ? <div className="cw-closing"><p className="cw-kicker">{pack.closing.kicker}</p><h1>{pack.closing.title}</h1><p className="cw-lead">{pack.closing.lead}</p><div className="cw-boundaries">{!legacy && !Object.values(records).some(Boolean) ? <>{pack.closing.prompts.map(([title, body], i) => <article key={title}><b>{String(i + 1).padStart(2, "0")} · {title}</b><p>{body}</p></article>)}</> : modules.map((m, i) => <article key={m.id}><b>{String(i + 1).padStart(2, "0")} · {m.topic}</b><p>{records[m.id] || pack.closing.perDecision}</p></article>)}</div><p className="cw-highlight">{pack.closing.highlight}</p>{!displayOnly ? <div className="cw-actions"><button onClick={exportNotes}><Download size={18} />Download {pack.record.noun}</button>{live ? <button onClick={exportVotes}>Download table votes</button> : null}</div> : null}<small>{pack.closing.footnote}</small></div> : current ? <>
        <div className="cw-round-heading"><p className="cw-kicker">DECISION {moduleIndex + 1} OF 6 · {current.topic.toUpperCase()}</p><span>{phases[phase]}</span></div>
        <h1 className="cw-title">{discussionPhase ? "Where did we differ?" : phase === 3 ? "Does this change your view?" : phase === 4 ? "What permission are we giving?" : current.title}</h1>
        {legacy && phase === 0 ? <div className="cw-situation"><p className="cw-lead">{current.situation}</p><div className="cw-question"><span>THE DECISION AHEAD</span><h2>{current.question}</h2></div><p>You are the board. Decide what management may do and what evidence or conditions you require.</p></div> : null}
        {votePhase ? <>{!legacy ? <p className="cw-decision-context">{current.situation}</p> : null}<p className="cw-question-line">{current.question}</p><div className="cw-options">{current.options.map((option, i) => <button key={option} className={localChoices[current.id] === "ABCD"[i] ? "selected" : ""} onClick={() => !live && setLocalChoices(c => ({ ...c, [current.id]: "ABCD"[i] }))} disabled={live}><b>{"ABCD"[i]}</b><span>{offerLabel(option)}{!legacy ? <small className="cw-option-cost">{current.tradeoffs[i]}</small> : null}</span></button>)}</div><div className="cw-vote-status">{live ? <><b>{sameRound ? data?.counts.locked || 0 : 0} / {data?.counts.total || "…"} tables locked</b><span>{sameRound && data?.session.roundState === "open" ? data?.session.audienceTimer ? `Discussion time ${clock}` : "Voting open · agree a call and explain why." : "Voting closed · hear the different views."}</span></> : <><b>Choose a position, then explain why.</b><span>Rehearsal choices are illustrative. No table votes are collected.</span></>}</div><p className="cw-subtle">Next closes voting. Hear the different views and the downside each table accepts.</p></> : null}
        {discussionPhase ? <div className="cw-discussion"><div><p className="cw-question-line">{current.question}</p><ol>{current.discuss.map(q => <li key={q}>{q}</li>)}</ol></div><aside><h2>{live ? "The room's split" : "Invite two different views"}</h2>{live && sameRound ? <>{current.options.map((option, i) => { const count = (discussion?.options["ABCD"[i]] || 0); return <div className="cw-result-option" key={option}>{!legacy ? <small>{option}</small> : null}<div className="cw-bar"><b>{"ABCD"[i]}</b><span style={{ width: `${discussion?.locked ? count / discussion.locked * 70 : 0}%` }} /><strong>{count}</strong></div></div>; })}<p>{discussion?.locked || 0} locked responses. No table ranking.</p></> : <p>{pack.discussHint}</p>}<p className="cw-highlight">Explain the strongest argument for another option before defending your own.</p></aside><CoastwaterFeaturedComments entries={selectedComments} /></div> : null}
        {legacy && phase === 3 ? <div className="cw-reveal"><p className="cw-kicker">NEW INFORMATION</p><p className="cw-lead">{current.reveal}</p><h2>{current.reconsider}</h2><p>Who would change their call? Name the evidence that changed your mind, and the boundary you would retain.</p><CoastwaterFeaturedComments entries={selectedComments} /></div> : null}
        {legacy && phase === 4 ? <div className="cw-capture"><p className="cw-lead">{current.boundary}</p><blockquote>We permit <em>___</em>, provided <em>___</em>;<br /><em>___</em> owns it; it returns to the board if <em>___</em>.</blockquote><button onClick={() => setCapture(c => !c)} aria-expanded={capture}>{capture ? "Hide capture" : "Capture the board's boundary"}</button>{capture ? <label className="cw-record-label">Permission, conditions, owner and escalation trigger<textarea rows={4} value={records[current.id] || ""} onChange={e => setRecords(r => ({ ...r, [current.id]: e.target.value }))} placeholder="Include unresolved disagreement and evidence still needed…" /><small>Saved on this device. Export at the end.</small></label> : <p>Include the minority view and anything management still needs to demonstrate.</p>}</div> : null}
      </> : null}
    </section>
    {notes ? <aside className="cw-notes"><button className="cw-close" onClick={() => setNotes(false)} aria-label="Close facilitator notes"><X /></button><b>Facilitator notes · visible on this screen</b><p>{current?.notes || (step === LAST ? pack.notes.closing : pack.notes.opening)}</p><p>Ask: What evidence would change your mind? Who owns the next step?</p></aside> : null}
    <footer className="cw-footer">{!displayOnly ? <button onClick={() => void back()} disabled={step === 0 || busy}><ArrowLeft size={18} />Back</button> : <span className="cw-display-label">Audience display</span>}<div className="cw-position"><span>{step === 0 ? "Welcome" : step === 1 ? "How to take part" : step === LAST ? "Read back and close" : `${moduleIndex + 1} / 6 · ${phases[phase]}`}</span><div className="cw-progress"><i style={{ width: `${step / LAST * 100}%` }} /></div></div>{displayOnly ? <span className="cw-display-label">Controlled by facilitator</span> : step < LAST ? <button className="cw-next" onClick={() => void advance()} disabled={busy || (live && (!key || !data || stale))}>{busy ? "Updating…" : votePhase && live ? "Close votes & discuss" : "Next"}<ArrowRight size={18} /></button> : <a className="cw-next" href="/decision-room">All experiences<ArrowRight size={18} /></a>}</footer>
  </main>;
}
