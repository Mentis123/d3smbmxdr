import type { RunPlan } from "../../lib/decision-room/types";
import { sessionTime, sessionTimeline, scheduledVoteSeconds, type SessionSchedule } from "../../lib/decision-room/timing";
import SessionScheduleEditor from "./SessionScheduleEditor";

function elapsed(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}` : `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function SessionRunClock({ plan, state, round, now, launchedAt, schedule, onSchedule }: {
  plan: RunPlan; state: string; round: number; now: number; launchedAt: string | null;
  schedule: SessionSchedule | null; onSchedule: (schedule: SessionSchedule) => Promise<void>;
}) {
  const editor = <SessionScheduleEditor key={schedule ? `${schedule.startsAt}:${schedule.durationMinutes}` : "unscheduled"} schedule={schedule} defaultMinutes={plan.totalMinutes} onSave={onSchedule} />;
  if (!schedule) return <section className="dr-card dr-session-plan">{editor}<p className="dr-hint">No session plan saved yet. Set the date, time and length to start the run-of-show clock.</p></section>;
  const { start, end, at, refit } = sessionTimeline(plan, schedule, launchedAt);
  const segments = plan.segments;
  const segment = state === "lobby" ? segments[0] : state === "launched" ? segments[1] : state === "ended" ? segments[segments.length - 1] : segments[1 + Math.min(round, segments.length - 3)];
  const inRound = !["lobby", "launched", "ended"].includes(state);
  const from = inRound && state !== "open" ? segment.from + plan.decideMinutes : segment.from;
  const to = inRound && state === "open" ? Math.min(segment.to, segment.from + plan.decideMinutes) : segment.to;
  const before = now < start, over = now > end;
  const drift = before ? 0 : Math.max(0, now - at(to)) / 60000;
  const tone = before || state === "ended" ? "idle" : over || drift >= 5 ? "red" : drift >= 2 ? "amber" : "green";
  const pct = (value: number) => Math.max(0, Math.min(100, (value - start) / (end - start) * 100));
  const clock = (value: number) => sessionTime(value, schedule.timeZone);
  const vote = scheduledVoteSeconds(plan, schedule, launchedAt, round, plan.decideMinutes * 60);
  const advice = state === "ended" ? "Session ended. Export the decisions and captured boundaries."
    : before ? `Starts ${new Intl.DateTimeFormat("en-AU", { timeZone: schedule.timeZone, dateStyle: "medium" }).format(start)} at ${clock(start)}.`
    : over ? `Scheduled finish has passed by ${elapsed(now - end)}. Agree what to close or defer.`
    : `${refit ? "Adjusted to the actual start. " : "Agenda scaled to your session length. "}Finish ${clock(end)}; about ${Math.round(vote / 6) / 10} minutes to decide each round.${drift >= 2 ? ` Current segment is ${Math.round(drift)} min behind.` : ""}`;
  return <section className="dr-card dr-session-plan">{editor}<section className={`dr-runclock dr-runclock--${tone}`} aria-label="Run of show">
    <div className="dr-runclock-main"><span className="dr-runclock-light" aria-hidden="true" /><div><small>{state === "ended" ? "Ended" : before ? "Starts in" : over ? "Over time" : "Remaining"}</small><strong>{state === "ended" ? "Complete" : elapsed(before ? start - now : over ? now - end : end - now)}</strong></div><div><small>Now · Sydney</small><b>{clock(now)}</b></div><div><small>Where we are</small><b>{segment.label}{inRound ? state === "open" ? " · tables deciding" : " · discussion and reveal" : ""}</b><em>planned {clock(at(from))}–{clock(at(to))}</em></div><p className="dr-runclock-advice">{advice}</p><span className="dr-schedule-window">{clock(start)}–{clock(end)} · {schedule.durationMinutes} min</span></div>
    <div className="dr-runclock-track" aria-hidden="true">{segments.map(s => <span key={s.key} className={`seg ${s.key === segment.key ? "is-here" : ""}`} style={{ left: `${pct(at(s.from))}%`, width: `${Math.max(0, pct(at(s.to)) - pct(at(s.from)))}%` }}><i>{s.label}</i></span>)}<b className="pos" style={{ left: `${pct(at(from))}%` }} />{!before ? <b className="now" style={{ left: `${pct(now)}%` }} /> : null}</div>
  </section><details className="dr-schedule-agenda"><summary>View adjusted agenda</summary><ol>{segments.map(s => <li key={s.key}><time>{clock(at(s.from))}–{clock(at(s.to))}</time><span>{s.label}</span></li>)}</ol></details><p className="dr-hint">Timing is advisory. The facilitator still advances the presentation and closes votes.</p></section>;
}
