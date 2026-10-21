"use client";
import { useState } from "react";
export default function AudienceTimerControl({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => Promise<void> }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <section className="dr-audience-timer"><label><input type="checkbox" checked={enabled} disabled={busy} onChange={async e => { const value = e.target.checked; setBusy(true); setError(""); try { await onChange(value); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }} />Show audience timer</label><p>Off by default. Applies to the projector and table devices. Your private clock stays visible; voting closes only when you choose.</p>{error ? <p role="alert">{error}</p> : null}</section>;
}
