import EvidenceTrend from './EvidenceTrend';
import { HISTORIAN_CASES, deriveHistorian, type HistorianCase } from '../../lib/ai-lab/historian';

export default function HistorianObservation({caseId,connected,onCase,onConnected}:{caseId:HistorianCase;connected:boolean;onCase:(c:HistorianCase)=>void;onConnected:(v:boolean)=>void}){
  const result=deriveHistorian(caseId,connected);
  return <div data-historian data-case={caseId} data-machine={result.machineState} data-observed={result.observedState}>
    <fieldset className="al-conditions"><legend>Change the source of evidence</legend><label>Example condition<select aria-label="Historian case" value={caseId} onChange={e=>onCase(e.target.value as HistorianCase)}>{HISTORIAN_CASES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label><span>Cloud uplink available</span><input type="checkbox" checked={connected} onChange={e=>onConnected(e.target.checked)}/></label></fieldset>
    <EvidenceTrend samples={result.samples} label="SYNTHETIC TREND / CV-01" caption="Illustrative units. Gaps remain absent; recorded zeros remain visible. This is fixed sample data, not live telemetry."/>
    <div className="al-evidence-states"><div><span>Trend interpretation</span><strong data-observed-state>{result.observedState}</strong></div><div><span>Gateway heartbeat</span><strong>{result.gateway}</strong></div><div><span>Independent indicator (simulated)</span><strong data-machine-state>{result.machineState}</strong></div></div>
    <p className="al-small">The scene illustrates the independent conveyor state. Sensor or gateway loss leaves the belt running; only the shutdown example stops it. Other mine activity continues.</p>
    <details className="al-evidence-details"><summary>Inspect timestamped evidence</summary><table><caption>Synthetic samples · CV-01</caption><thead><tr><th>Time</th><th>Recorded value</th></tr></thead><tbody>{result.samples.map(s=><tr key={s.second}><td>{s.second===60?'01:00':'00:'+String(s.second).padStart(2,'0')}</td><td>{s.value===null?'Missing — no measurement':s.value}</td></tr>)}</tbody></table><ol className="al-event-list">{result.events.map((event,i)=><li key={i}><b>{event.time} · {event.source}</b><p>{event.detail}</p></li>)}</ol></details>
    <p className="al-rule">{result.rule}</p>
  </div>;
}
