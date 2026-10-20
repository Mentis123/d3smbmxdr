"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Maximize, Minimize, NotebookPen, Settings, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { COASTWATER_MODULES as modules, COASTWATER_STORY } from "../../lib/decision-room/coastwater-content";
import "./coastwater.css";

type Snapshot = {
  scenario: { family: string };
  session: { joinCode: string; activeRound: number; roundState: string; roundStartedAt: string | null; durationSeconds: number };
  counts: { total: number; joined: number; locked: number };
  decisions: { optionKey: string | null; isLocked: boolean; rationale: string; table: string }[];
};
const phases = ["The situation", "Your decision", "Explore the disagreement", "New information", "Set the boundary"];
const LAST = 2 + modules.length * phases.length;
const read = (key: string) => { try { return localStorage.getItem(key) || ""; } catch { return ""; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Storage may be unavailable. */ } };

async function api<T>(url: string, key: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method: body ? "POST" : "GET", headers: { "x-admin-key": key, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The room could not be updated.");
  return data as T;
}

export default function CoastwaterPresenter({ room = "" }: { room?: string }) {
  const store = `coastwater-presenter:1:${room || "rehearsal"}`;
  const [step, setStep] = useState(() => Math.max(0, Math.min(LAST, Number(read(`${store}:step`)) || 0)));
  const [records, setRecords] = useState<Record<string, string>>(() => { try { return JSON.parse(read(`${store}:records`) || "{}"); } catch { return {}; } });
  const [key, setKey] = useState(() => read("decision-room-admin-key"));
  const [draftKey, setDraftKey] = useState("");
  const [data, setData] = useState<Snapshot | null>(null);
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
  const restored = useRef(Boolean(read(`${store}:step`)));
  const base = `/api/decision-room/sessions/${encodeURIComponent(room)}`;

  const refresh = useCallback(async () => {
    if (!room || !key) return null;
    const snapshot = await api<Snapshot>(`${base}/admin`, key);
    if (snapshot.scenario.family !== "coastwater") throw new Error("This room belongs to another experience. Open it from Decision Room home.");
    if (!restored.current) {
      restored.current = true;
      const state = snapshot.session.roundState;
      if (state === "ended") setStep(LAST);
      else if (!["lobby", "launched"].includes(state)) setStep(2 + (snapshot.session.activeRound - 1) * 5 + (state === "open" ? 1 : state === "closed" ? 2 : 4));
    }
    setData(snapshot); setUpdated(Date.now()); setError(""); return snapshot;
  }, [room, key, base]);
  useEffect(() => {
    if (!room || !key) return;
    let active = true;
    const load = () => { if (active) refresh().catch(e => { if (active) setError(e.message); }); };
    load(); const interval = setInterval(load, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [refresh, room, key]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { write(`${store}:step`, String(step)); }, [step, store]);
  useEffect(() => { write(`${store}:records`, JSON.stringify(records)); }, [records, store]);
  useEffect(() => { const change = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener("fullscreenchange", change); return () => document.removeEventListener("fullscreenchange", change); }, []);

  const moduleIndex = step >= 2 && step < LAST ? Math.floor((step - 2) / 5) : -1;
  const phase = moduleIndex >= 0 ? (step - 2) % 5 : -1;
  const current = modules[moduleIndex];
  const live = Boolean(room);
  const stale = live && updated > 0 && now - updated > 15000;

  async function advance() {
    if (inFlight.current || step >= LAST) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const target = step + 1;
      if (live) {
        const s = await refresh();
        if (!s) throw new Error("Enter the facilitator key to control this room.");
        const act = (action: string) => api(`${base}/actions`, key, { action });
        if (target === LAST) {
          if (s.session.roundState !== "ended") await act("end");
        } else if (target >= 2 && s.session.roundState !== "ended") {
          const round = Math.floor((target - 2) / 5) + 1;
          const targetPhase = (target - 2) % 5;
          if (round > s.session.activeRound + 1) throw new Error("Open the current round before moving further.");
          if (targetPhase === 1) {
            if (s.session.roundState === "lobby" || s.session.roundState === "launched") await act("start");
            else if (round > s.session.activeRound) await act("advance");
          }
          if (round === s.session.activeRound && targetPhase === 2 && s.session.roundState === "open") await act("close");
          if (round === s.session.activeRound && targetPhase === 3 && (s.session.roundState === "open" || s.session.roundState === "closed")) await act("publish");
        }
        await refresh();
      }
      setStep(target); setNotes(false); setCapture(false);
    } catch (e) { setError((e as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function back() { if (!inFlight.current) { setStep(s => Math.max(0, s - 1)); setNotes(false); setCapture(false); } }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches("input, textarea, select") || event.target.isContentEditable || (event.key === " " && event.target.matches("button, a")))) return;
      if (menu || notes || capture) return;
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
      download(await response.blob(), `coastwater-${data?.session.joinCode || "room"}-votes.csv`);
    } catch (e) { setError((e as Error).message); }
  }
  function download(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function exportNotes() {
    const text = `COASTWATER · THE PILOT THAT BECAME POLICY\n${live ? `Room ${data?.session.joinCode || room}` : "Rehearsal / discussion"}\n${new Date().toLocaleString("en-AU")}\n\n` + modules.map((m, i) => `${i + 1}. ${m.title}\n${m.question}\n${records[m.id] || "No boundary recorded."}`).join("\n\n");
    download(new Blob([text], { type: "text/plain;charset=utf-8" }), "coastwater-board-boundaries.txt");
  }
  const sameRound = data?.session.activeRound === moduleIndex + 1;
  const decisions = sameRound ? (data?.decisions || []).filter(d => d.isLocked) : [];
  const clockSeconds = data?.session.roundStartedAt ? Math.max(0, data.session.durationSeconds - Math.floor((now - new Date(data.session.roundStartedAt).getTime()) / 1000)) : 240;
  const clock = `${Math.floor(clockSeconds / 60)}:${String(clockSeconds % 60).padStart(2, "0")}`;

  return <main className={`cw-shell ${full ? "cw-full" : ""}`}>
    <header className="cw-header"><a href="/decision-room" className="cw-brand">Data<sup>#</sup>3 <span>Decision Room</span></a><span className="cw-session">{live ? data ? <>ROOM <b>{data.session.joinCode}</b> · {stale ? "Reconnecting…" : "Live"}</> : "Opening live room…" : "REHEARSAL · NO LIVE VOTES"}</span><div className="cw-tools"><button onClick={() => setNotes(n => !n)} aria-pressed={notes} title="Facilitator notes"><NotebookPen size={18} /><span>Notes</span></button><button onClick={fullscreen} aria-label={full ? "Exit full screen" : "Full screen"}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</button><button onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label="Workshop controls"><Settings size={18} /></button></div></header>
    {live && !key ? <form className="cw-access" onSubmit={e => { e.preventDefault(); write("decision-room-admin-key", draftKey.trim()); setKey(draftKey.trim()); }}><label>Facilitator key<input type="password" value={draftKey} onChange={e => setDraftKey(e.target.value)} /></label><button disabled={!draftKey.trim()}>Open room controls</button></form> : null}
    {menu ? <section className="cw-menu" aria-label="Workshop controls"><button className="cw-close" onClick={() => setMenu(false)} aria-label="Close controls"><X /></button><h2>Workshop controls</h2><p>Arrow keys or Space advance the display. Back reviews a screen without reopening votes.</p><button onClick={exportNotes}><Download size={16} />Export captured boundaries</button>{live ? <><button onClick={exportVotes}><Download size={16} />Export table votes</button><a href={`/decision-room/admin/${room}`} target="_blank" rel="noreferrer">Open full room controls</a><a href={`/decision-room/report/${room}/rounds`} target="_blank" rel="noreferrer">Open round-by-round report</a><button onClick={() => { setKey(""); setDraftKey(""); write("decision-room-admin-key", ""); setMenu(false); }}>Use a different facilitator key</button></> : <button onClick={() => { setStep(0); setMenu(false); }}>Return to opening</button>}<a href="/decision-room/coastwater">Coastwater home</a></section> : null}
    {error ? <div role="alert" className="cw-error">{error}<button onClick={() => setError("")} aria-label="Dismiss error">×</button></div> : null}
    <section className="cw-stage" aria-label="Workshop presentation">
      {step === 0 ? <div className="cw-opening"><div className="cw-opening-art" /><div className="cw-opening-copy"><p className="cw-kicker">COASTWATER · BOARD AND SENIOR LEADERS</p><h1>The pilot that<br /><em>became policy.</em></h1><p className="cw-lead">Useful AI spreads. What has the board actually authorised?</p><p>{COASTWATER_STORY}</p><div className="cw-meta"><span>6 decisions</span><span>About 60 minutes</span><span>One response per table</span></div><small>Fictional exercise inspired by the SGW AI governance briefing.</small></div></div> : step === 1 ? <div className="cw-instructions"><p className="cw-kicker">YOUR ROLE · COASTWATER'S BOARD</p><h1>Different views are the point.</h1><div className="cw-instruction-grid"><div><h2>Make a call together</h2><ol><li>Read the situation and choose A–D.</li><li>Record why, including a minority view.</li><li>Hear another table's reasoning.</li><li>Consider new evidence, then set the boundary.</li></ol><p className="cw-highlight">The board sets risk appetite. Management proposes the uses and runs the controls.</p><p>No scores or prescribed winning answer. Compare the evidence and the trade-offs.</p></div><aside>{live && data ? <><QRCodeSVG value={`${location.origin}/decision-room/join/${data.session.joinCode}`} size={150} /><h2>{data.session.joinCode}</h2><p>{location.host}/decision-room/join</p><p>{data.counts.joined} of {data.counts.total} tables joined</p></> : <><h2>One device per table</h2><p>For live votes, create a room from Coastwater home. In rehearsal, discuss aloud or raise A–D cards.</p><a href="/decision-room/coastwater">Create a live room →</a></>}</aside></div></div> : step === LAST ? <div className="cw-closing"><p className="cw-kicker">THE BOARD'S FIRST VIEW OF RISK APPETITE</p><h1>What have we authorised?</h1><p className="cw-lead">Read back the permissions. Make the conditions explicit.</p><div className="cw-boundaries">{modules.map((m, i) => <article key={m.id}><b>{String(i + 1).padStart(2, "0")} · {m.topic}</b><p>{records[m.id] || "To capture: permission, conditions, accountable owner and escalation trigger."}</p></article>)}</div><p className="cw-highlight">What should management feel confident doing without asking us? What must they never assume we have authorised?</p><div className="cw-actions"><button onClick={exportNotes}><Download size={18} />Download boundaries</button>{live ? <button onClick={exportVotes}>Download table votes</button> : null}</div><small>Captured boundaries stay in this browser. Download them before changing devices. Management develops the formal policy and returns for approval.</small></div> : current ? <>
        <div className="cw-round-heading"><p className="cw-kicker">DECISION {moduleIndex + 1} OF 6 · {current.topic.toUpperCase()}</p><span>{phases[phase]}</span></div>
        <h1 className="cw-title">{phase === 2 ? "Where did we differ?" : phase === 3 ? "Does this change your view?" : phase === 4 ? "What permission are we giving?" : current.title}</h1>
        {phase === 0 ? <div className="cw-situation"><p className="cw-lead">{current.situation}</p><div className="cw-question"><span>THE DECISION AHEAD</span><h2>{current.question}</h2></div><p>You are the board. Decide what management may do and what evidence or conditions you require.</p></div> : null}
        {phase === 1 ? <><p className="cw-question-line">{current.question}</p><div className="cw-options">{current.options.map((option, i) => <button key={option} className={localChoices[current.id] === "ABCD"[i] ? "selected" : ""} onClick={() => !live && setLocalChoices(c => ({ ...c, [current.id]: "ABCD"[i] }))} disabled={live}><b>{"ABCD"[i]}</b><span>{option}</span></button>)}</div><div className="cw-vote-status">{live ? <><b>{sameRound ? data?.counts.locked || 0 : 0} / {data?.counts.total || "…"} tables locked</b><span>{sameRound && data?.session.roundState === "open" ? `Discussion time ${clock}` : "Voting opens when this decision is reached in the live room."}</span></> : <><b>Choose a position, then explain why.</b><span>Rehearsal choices are illustrative. No table votes are collected.</span></>}</div><p className="cw-subtle">Next closes voting. Hear the different views before revealing new information.</p></> : null}
        {phase === 2 ? <div className="cw-discussion"><div><p className="cw-question-line">{current.question}</p><ol>{current.discuss.map(q => <li key={q}>{q}</li>)}</ol></div><aside><h2>{live ? "The room's split" : "Invite two different views"}</h2>{live && sameRound ? <>{current.options.map((option, i) => { const count = decisions.filter(d => d.optionKey === "ABCD"[i]).length; return <div className="cw-bar" key={option}><b>{"ABCD"[i]}</b><span style={{ width: `${decisions.length ? count / decisions.length * 70 : 0}%` }} /><strong>{count}</strong></div>; })}<p>{decisions.length} locked responses. No table ranking.</p></> : <p>Ask a cautious table and a permissive table to explain their evidence thresholds.</p>}<p className="cw-highlight">Explain the strongest argument for another option before defending your own.</p></aside></div> : null}
        {phase === 3 ? <div className="cw-reveal"><p className="cw-kicker">NEW INFORMATION</p><p className="cw-lead">{current.reveal}</p><h2>{current.reconsider}</h2><p>Who would change their call? Name the evidence that changed your mind, and the boundary you would retain.</p></div> : null}
        {phase === 4 ? <div className="cw-capture"><p className="cw-lead">{current.boundary}</p><blockquote>We permit <em>___</em>, provided <em>___</em>;<br /><em>___</em> owns it; it returns to the board if <em>___</em>.</blockquote><button onClick={() => setCapture(c => !c)} aria-expanded={capture}>{capture ? "Hide capture" : "Capture the board's boundary"}</button>{capture ? <label className="cw-record-label">Permission, conditions, owner and escalation trigger<textarea rows={4} value={records[current.id] || ""} onChange={e => setRecords(r => ({ ...r, [current.id]: e.target.value }))} placeholder="Include unresolved disagreement and evidence still needed…" /><small>Saved on this device. Export at the end.</small></label> : <p>Include the minority view and anything management still needs to demonstrate.</p>}</div> : null}
      </> : null}
    </section>
    {notes ? <aside className="cw-notes"><button className="cw-close" onClick={() => setNotes(false)} aria-label="Close facilitator notes"><X /></button><b>Facilitator notes · visible on this screen</b><p>{current?.notes || (step === LAST ? "Read the boundaries back. Agree who will draft the policy, what remains unresolved and when management returns. Download the record." : "Introduce the fictional setting. One response per table. Seek different reasoning without scoring the tables. Allow about four minutes to decide and four to discuss each module.")}</p><p>Ask: What evidence would change your mind? Who owns the next step?</p></aside> : null}
    <footer className="cw-footer"><button onClick={back} disabled={step === 0 || busy}><ArrowLeft size={18} />Back</button><div className="cw-position"><span>{step === 0 ? "Welcome" : step === 1 ? "How to take part" : step === LAST ? "Read back and close" : `${moduleIndex + 1} / 6 · ${phases[phase]}`}</span><div className="cw-progress"><i style={{ width: `${step / LAST * 100}%` }} /></div></div>{step < LAST ? <button className="cw-next" onClick={() => void advance()} disabled={busy || (live && (!key || !data || stale))}>{busy ? "Updating…" : phase === 1 && live ? "Close votes & discuss" : "Next"}<ArrowRight size={18} /></button> : <a className="cw-next" href="/decision-room">All experiences<ArrowRight size={18} /></a>}</footer>
  </main>;
}
