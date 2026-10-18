/** Synthetic, read-only alarm investigation cases for the energy example. */

export type AlarmCase = 'baseline' | 'maintenance' | 'sensor' | 'stale'

export const ALARM_INITIAL: AlarmCase = 'baseline'

export const ALARM_CASES: Array<{ id: AlarmCase; label: string }> = [
  { id: 'baseline', label: 'Limited independent evidence' },
  { id: 'maintenance', label: 'Recent maintenance recorded' },
  { id: 'sensor', label: 'Contradictory secondary reading' },
  { id: 'stale', label: 'Telemetry has gone stale' },
]

type AlarmEvent = { id: string; time: string; source: string; detail: string }
type TrendPoint = { second: number; value: number | null }

export type AlarmResult = {
  status: 'review' | 'attention'
  headline: string
  detail: string
  hypothesis: string
  events: AlarmEvent[]
  trend: TrendPoint[]
  fresh: boolean
  nextCheck: string
  sourceIds: string[]
  cloud: string
}

const baselineTrend: TrendPoint[] = [
  { second: 0, value: 52 }, { second: 10, value: 51 }, { second: 20, value: 52 },
  { second: 30, value: 50 }, { second: 40, value: 49 }, { second: 50, value: 48 },
  { second: 60, value: 47 },
]
const staleTrend: TrendPoint[] = [
  { second: 0, value: 52 }, { second: 10, value: 51 }, { second: 20, value: 52 },
  { second: 30, value: null }, { second: 40, value: null }, { second: 50, value: null },
  { second: 60, value: null },
]

/** Returns scripted source-linked hypotheses; connectivity adds no site data or inference. */
export function deriveAlarm(caseId: AlarmCase, connected: boolean): AlarmResult {
  const cloud = connected
    ? 'Illustrative optional cloud enrichment is available; no site data is transmitted and no inference or control occurs.'
    : 'Illustrative optional cloud enrichment is offline; no site data is transmitted and no inference or control occurs.'
  const alarm: AlarmEvent = { id: 'AL-07', time: '01:00', source: 'Synthetic alarm log', detail: 'Process rate low alarm recorded; illustrative threshold below 48 units.' }
  const alarmValues = baselineTrend.map((point) => ({ ...point }))

  if (caseId === 'maintenance') {
    const events = [
      { id: 'NOTE-07', time: '00:35', source: 'Synthetic maintenance history', detail: 'Approved work record logged a routine inspection on the fictional asset; it does not establish a cause.' },
      alarm,
    ]
    return {
      status: 'review', headline: 'Recorded maintenance precedes the alarm',
      detail: 'The timeline supports checking the authorised maintenance record and applicability. It does not show that the work caused the alarm.',
      hypothesis: 'Recent maintenance may be relevant context; confirm the authorised work record before drawing a conclusion.',
      events, trend: alarmValues, fresh: true,
      nextCheck: 'Compare NOTE-07 with the authorised site maintenance record and obtain a current independent process reading.',
      sourceIds: events.map((event) => event.id), cloud,
    }
  }

  if (caseId === 'sensor') {
    const events = [
      { id: 'SR-03', time: '00:58', source: 'Synthetic secondary indicator', detail: 'Secondary process reading: 53 illustrative units, within its stated normal band of 50–56; this conflicts with the primary trend reaching 47.' },
      alarm,
    ]
    return {
      status: 'attention', headline: 'Independent reading conflicts with the primary trend',
      detail: 'The two synthetic sources disagree. Neither reading is silently preferred, and no fault is diagnosed.',
      hypothesis: 'A sensor or tag-path issue is one possibility; verify both measurement paths and their timestamps.',
      events, trend: alarmValues, fresh: true,
      nextCheck: 'Verify the primary and secondary sensor paths, tag identity and timestamps with an authorised operator.',
      sourceIds: events.map((event) => event.id), cloud,
    }
  }

  if (caseId === 'stale') {
    const events = [
      { id: 'HIST-22', time: '00:20', source: 'Synthetic historian', detail: 'Last received process-rate sample: 52.' },
      { id: 'GAP-04', time: '00:30–01:00', source: 'Synthetic historian', detail: 'No subsequent samples recorded; the chart leaves these timestamps empty.' },
      alarm,
    ]
    return {
      status: 'attention', headline: 'Latest telemetry is stale',
      detail: 'The last sample is at 00:20. Later values are absent, so the 01:00 alarm is shown as a recorded event without an inferred current process value or cause.',
      hypothesis: 'Cause is unknown from the available timeline; missing samples are not zero and do not establish present process state.',
      events, trend: staleTrend.map((point) => ({ ...point })), fresh: false,
      nextCheck: 'Obtain a current approved reading and check historian freshness before investigating a process cause.',
      sourceIds: events.map((event) => event.id), cloud,
    }
  }

  const events = [
    { id: 'HIST-21', time: '00:00–01:00', source: 'Synthetic historian', detail: 'Seven timestamped primary samples trend downward before the alarm.' },
    alarm,
  ]
  return {
    status: 'review', headline: 'Low-rate alarm has limited independent evidence',
    detail: 'The primary trend and recorded alarm are available, but no independent corroboration is included in this case. Investigate conditions without asserting a fault.',
    hypothesis: 'A process condition may explain the reported trend; evidence is insufficient to distinguish it from a measurement issue.',
    events, trend: alarmValues, fresh: true,
    nextCheck: 'Compare with a current independent reading and verify the tag and alarm timestamps with the operator.',
    sourceIds: events.map((event) => event.id), cloud,
  }
}
