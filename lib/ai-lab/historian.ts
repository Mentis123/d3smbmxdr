/** Synthetic historian fixture. Rules detect gaps; explanatory summaries are scripted. */

export type HistorianCase = 'normal' | 'sensor' | 'network' | 'shutdown'

export const HISTORIAN_INITIAL: HistorianCase = 'normal'

export const HISTORIAN_CASES: Array<{ id: HistorianCase; label: string }> = [
  { id: 'normal', label: 'Normal trend' },
  { id: 'sensor', label: 'Sensor failure' },
  { id: 'network', label: 'Gateway communication loss' },
  { id: 'shutdown', label: 'Equipment shutdown' },
]

type Sample = { second: number; value: number | null }
type Event = { time: string; source: string; detail: string }

export type HistorianResult = {
  status: 'ready' | 'review' | 'attention'
  headline: string
  detail: string
  machineState: 'running' | 'stopped'
  observedState: 'running' | 'stopped' | 'unknown'
  gateway: 'online' | 'offline'
  samples: Sample[]
  events: Event[]
  nextCheck: string
  rule: string
  cloud: string
  independentEvidence: string
}

const trend: Sample[] = [
  { second: 0, value: 60 }, { second: 10, value: 61 }, { second: 20, value: 59 },
  { second: 30, value: 60 }, { second: 40, value: 62 }, { second: 50, value: 60 },
  { second: 60, value: 61 },
]

const missingTail: Sample[] = [
  { second: 0, value: 60 }, { second: 10, value: 61 }, { second: 20, value: 59 },
  { second: 30, value: 60 }, { second: 40, value: null }, { second: 50, value: null },
  { second: 60, value: null },
]

/** Produces fixed synthetic samples and event evidence; connected only describes cloud uplink. */
export function deriveHistorian(caseId: HistorianCase, connected: boolean): HistorianResult {
  const cloud = connected
    ? 'Illustrative queued transfer: uplink available; no observation data transmitted. No inference or control.'
    : 'Illustrative queued transfer: uplink offline; no observation data transmitted. No inference or control.'
  const base = {
    samples: trend.map((sample) => ({ ...sample })),
    rule: 'Site rule: flag three consecutive missing samples. Rules-based gap detection; no model inference.',
    cloud,
    independentEvidence: 'Verify with the independent local machine-state indicator and a separate approved reading.',
  }

  if (caseId === 'normal') {
    return {
      ...base,
      status: 'ready', headline: 'Synthetic trend is continuous',
      detail: 'All seven timestamped samples are present. This scripted fixture does not establish the real asset condition.',
      machineState: 'running', observedState: 'running', gateway: 'online',
      events: [{ time: '00:00–01:00', source: 'Synthetic historian', detail: 'Seven samples received at 10-second intervals.' }],
      nextCheck: 'Compare the tag and time range with the approved site record.',
    }
  }

  if (caseId === 'sensor' || caseId === 'network') {
    const network = caseId === 'network'
    return {
      ...base,
      samples: missingTail.map((sample) => ({ ...sample })),
      status: 'attention',
      headline: network ? 'Telemetry gap; gateway is offline' : 'Telemetry gap; sensor evidence is needed',
      detail: network
        ? 'Three consecutive samples are absent while the independent indicator says the machine is running. The missing readings are not zero.'
        : 'Three consecutive samples are absent while the gateway heartbeat remains online. The machine is running; its observed process value is unknown.',
      machineState: 'running', observedState: 'unknown', gateway: network ? 'offline' : 'online',
      events: network
        ? [
            { time: '00:30', source: 'Synthetic historian', detail: 'Last received sample: 60.' },
            { time: '00:40–01:00', source: 'Synthetic gateway heartbeat', detail: 'Heartbeat absent; three trend samples missing.' },
            { time: '01:00', source: 'Independent machine-state indicator', detail: 'Machine state reported running.' },
          ]
        : [
            { time: '00:30', source: 'Synthetic historian', detail: 'Last received sample: 60.' },
            { time: '00:40–01:00', source: 'Synthetic historian', detail: 'Three consecutive samples missing.' },
            { time: '01:00', source: 'Synthetic gateway heartbeat', detail: 'Heartbeat received; sensor/tag signal requires checking.' },
            { time: '01:00', source: 'Independent machine-state indicator', detail: 'Machine state reported running.' },
          ],
      nextCheck: network
        ? 'Check gateway heartbeat and local historian buffer; inspect an independent reading before assigning a cause.'
        : 'Check the sensor/tag path and an independent reading before assigning a cause.',
    }
  }

  const stopped: Sample[] = trend.map(({ second, value }) => ({
    second,
    value: second < 30 ? value : 0,
  }))
  return {
    ...base,
    samples: stopped,
    status: 'review',
    headline: 'Explicit zero readings align with shutdown evidence',
    detail: 'The samples are recorded zeros, not missing data. A synthetic shutdown event and independent stopped-state indicator support the stopped state.',
    machineState: 'stopped', observedState: 'stopped', gateway: 'online',
    events: [
      { time: '00:30', source: 'Synthetic equipment event log', detail: 'Shutdown event recorded.' },
      { time: '00:30–01:00', source: 'Synthetic historian', detail: 'Four timestamped zero readings received.' },
      { time: '01:00', source: 'Independent machine-state indicator', detail: 'Machine state reported stopped.' },
    ],
    nextCheck: 'Verify the event log and independent state indicator with the site operator.',
  }
}
