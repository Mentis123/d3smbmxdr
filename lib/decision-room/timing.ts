import type { RunPlan } from "./types";

export type SessionSchedule = { startsAt: string; durationMinutes: number; timeZone: "Australia/Sydney" };
export const SESSION_TIME_ZONE = "Australia/Sydney" as const;

export function scheduleFields(iso: string, timeZone = SESSION_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (key: string) => parts.find(p => p.type === key)?.value || "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Convert the wall time explicitly, independent of the presenting device's zone. */
export function scheduleStart(date: string, time: string, timeZone = SESSION_TIME_ZONE) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error("Choose a valid session date and start time.");
  const [y, m, d] = date.split("-").map(Number), [h, min] = time.split(":").map(Number);
  const wanted = Date.UTC(y, m - 1, d, h, min);
  let candidate = wanted;
  for (let i = 0; i < 3; i++) {
    const wall = scheduleFields(new Date(candidate).toISOString(), timeZone);
    const [wy, wm, wd] = wall.date.split("-").map(Number), [wh, wmin] = wall.time.split(":").map(Number);
    candidate += wanted - Date.UTC(wy, wm - 1, wd, wh, wmin);
  }
  const result = new Date(candidate).toISOString(), wall = scheduleFields(result, timeZone);
  if (wall.date !== date || wall.time !== time) throw new Error("That local time does not exist because the clocks change. Choose another start time.");
  return result;
}

export function sessionTimeline(plan: RunPlan, schedule: SessionSchedule, launchedAt: string | null) {
  const start = Date.parse(schedule.startsAt), end = start + schedule.durationMinutes * 60000;
  const launchMinute = plan.segments[1].from;
  const launched = launchedAt ? Date.parse(launchedAt) : NaN;
  const refit = Number.isFinite(launched) && launched >= start && launched < end;
  const at = (minute: number) => refit && minute >= launchMinute
    ? launched + (minute - launchMinute) / (plan.totalMinutes - launchMinute) * (end - launched)
    : start + minute / plan.totalMinutes * (end - start);
  return { start, end, at, refit };
}

export function scheduledVoteSeconds(plan: RunPlan, schedule: SessionSchedule | null | undefined, launchedAt: string | null, round: number, fallback: number) {
  if (!schedule) return fallback;
  const segment = plan.segments[1 + round];
  if (!segment) return fallback;
  const { at } = sessionTimeline(plan, schedule, launchedAt);
  return Math.max(30, Math.round((at(Math.min(segment.to, segment.from + plan.decideMinutes)) - at(segment.from)) / 1000));
}

export function sessionTime(instant: number, timeZone = SESSION_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(instant);
}
