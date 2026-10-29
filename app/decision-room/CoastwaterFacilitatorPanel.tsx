import type { ReactNode } from "react";

export type CoastwaterSnapshot = {
  scenario: { family: string; revision: string; key?: string };
  results?: { reveal?: { boundary: string; lesson: string } | null } | null;
  session: { joinCode: string; mode?: "physical" | "virtual"; revision: number; activeRound: number; roundState: string; roundStartedAt: string | null; durationSeconds: number; schedule: import("../../lib/decision-room/timing").SessionSchedule | null; audienceTimer: boolean; presentationStep: number };
  counts: { total: number; joined: number; locked: number; notJoined: number };
  teams: { id: string; displayName: string; state: string; viewers?: number }[];
  decisions?: { id: string; teamId: string; optionKey: string | null; isLocked: boolean; isFeatured: boolean; rationale: string; table: string; confidence: number | null }[];
  discussion: { locked: number; options: Record<string, number>; featured: { id: string; rationale: string; confidence: number | null }[] } | null;
};

export default function CoastwaterFacilitatorPanel({ data, busy, onAction, notes, children }: {
  data: CoastwaterSnapshot; busy: boolean; onAction: (body: unknown) => Promise<void>; notes: string; children?: ReactNode;
}) {
  const decisions = data.decisions || [];
  const selected = decisions.filter(d => d.isFeatured).length;
  const labels: Record<string, string> = { not_joined: "Not joined", reading: "Reading", debating: "Drafting", locked: "Locked" };
  return <section className="cw-facilitator" aria-label="Private table monitoring">
    <div className="cw-fac-metrics"><div><strong>{data.counts.locked}/{data.counts.total}</strong><span>Tables locked</span></div><div><strong>{data.counts.joined}</strong><span>Reading / drafting</span></div><div><strong>{data.counts.notJoined}</strong><span>Not joined</span></div><div><strong>{selected}/2</strong><span>Selected for projection</span></div></div>
    <div className="cw-fac-grid"><section className="cw-fac-card"><h2>Tables · live status</h2><div className="cw-fac-tables">{data.teams.map(t => <div key={t.id} className={`cw-fac-table ${t.state === "locked" ? "locked" : ""}`}><span><b>{t.displayName}</b><small>{labels[t.state] || t.state}{t.viewers ? ` · ${t.viewers} watching` : ""}</small></span>{t.state === "locked" && data.session.roundState !== "published" && data.session.roundState !== "ended" ? <button onClick={() => void onAction({ action: "reopen", teamId: t.id })} disabled={busy}>Reopen vote</button> : null}</div>)}</div><h3>Facilitator notes · private</h3><p>{notes}</p>{children}</section>
    <section className="cw-fac-card cw-fac-responses"><h2>Incoming comments · decision {data.session.activeRound}</h2><p className="cw-fac-hint">All comments stay here. Select up to two locked responses. Only your selections appear on the discussion screen, after voting closes.</p>{decisions.length ? decisions.map(d => <article key={d.id} className={d.isFeatured ? "selected" : ""}><div className="cw-fac-response-heading"><b>{d.optionKey || "–"}</b><strong>{d.table}</strong><span>{d.isLocked ? "Locked" : "Draft"} · confidence {d.confidence ?? "–"}/5</span></div><p>{d.rationale || "No comment saved yet."}</p><button aria-pressed={d.isFeatured} onClick={() => void onAction({ action: "feature", decisionId: d.id, featured: !d.isFeatured })} disabled={busy || (!d.isFeatured && (!d.isLocked || !d.rationale || selected >= 2))}>{d.isFeatured ? "Remove from projection" : "Select for projection"}</button>{d.isFeatured && data.session.roundState === "open" ? <small>Queued until voting closes.</small> : null}</article>) : <p className="cw-fac-empty">Waiting for table responses. They appear here as participants save their drafts.</p>}</section></div>
  </section>;
}

export function CoastwaterFeaturedComments({ entries }: { entries: NonNullable<CoastwaterSnapshot["discussion"]>["featured"] }) {
  if (!entries.length) return null;
  return <section className="cw-featured" aria-label="Selected table comments"><h3>Voices from the room</h3>{entries.map(e => <blockquote key={e.id}><p>“{e.rationale}”</p><small>Selected table response{e.confidence != null ? ` · confidence ${e.confidence}/5` : ""}</small></blockquote>)}</section>;
}
