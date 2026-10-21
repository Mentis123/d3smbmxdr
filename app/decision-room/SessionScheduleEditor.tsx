import { useState } from "react";
import { scheduleFields, scheduleStart, SESSION_TIME_ZONE, type SessionSchedule } from "../../lib/decision-room/timing";

export default function SessionScheduleEditor({ schedule, defaultMinutes, onSave }: { schedule: SessionSchedule | null; defaultMinutes: number; onSave: (schedule: SessionSchedule) => Promise<void> }) {
  const fields = scheduleFields(schedule?.startsAt || new Date().toISOString());
  const [date, setDate] = useState(fields.date);
  const [time, setTime] = useState(fields.time);
  const [minutes, setMinutes] = useState(schedule?.durationMinutes || defaultMinutes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setSaved(false);
    try {
      if (!Number.isInteger(minutes) || minutes < 15 || minutes > 480) throw new Error("Choose a session length from 15 to 480 minutes.");
      await onSave({ startsAt: scheduleStart(date, time), durationMinutes: minutes, timeZone: SESSION_TIME_ZONE }); setSaved(true);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <form className="dr-schedule" onSubmit={save} onChange={() => setSaved(false)}>
    <div><h2>Session timing</h2><p>Date and time in Australia/Sydney. The agenda and voting time adjust to the session length and actual start.</p></div>
    <div className="dr-schedule-fields"><label>Session date<input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label><label>Start time<input type="time" value={time} onChange={e => setTime(e.target.value)} required /></label><label>Length (minutes)<input type="number" min={15} max={480} step={1} value={minutes} onChange={e => setMinutes(Number(e.target.value))} required /></label><button className="dr-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save session plan"}</button></div>
    {error ? <p role="alert" className="dr-schedule-error">{error}</p> : saved ? <p role="status" className="dr-schedule-saved">Session plan saved for this room. All connected screens use the updated timing.</p> : null}
  </form>;
}
