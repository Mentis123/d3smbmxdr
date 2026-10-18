import { useState } from 'react';
import { ALARM_CASES, deriveAlarm, type AlarmCase } from '../../lib/ai-lab/alarm';
import EvidenceTrend from './EvidenceTrend';

export default function AlarmObservation({caseId,connected,onCase,onConnected}:{caseId:AlarmCase;connected:boolean;onCase:(id:AlarmCase)=>void;onConnected:(value:boolean)=>void}){
  const result=deriveAlarm(caseId,connected),[check,setCheck]=useState('');
  const supported=caseId==='maintenance'?'record':caseId==='stale'?'freshness':'independent';
  return <div data-alarm data-case={caseId} data-fresh={result.fresh}>
    <div className="al-alarm-event"><span>RECORDED EVENT / 01:00</span><strong>AL-07 · Process rate low</strong><p>Same alarm in every case. Illustrative threshold: below 48 units. No current cause is established by the alarm alone.</p></div>
    <fieldset className="al-conditions"><legend>Change the preceding evidence</legend><label>Evidence case<select aria-label="Alarm evidence" value={caseId} onChange={e=>{setCheck('');onCase(e.target.value as AlarmCase);}}>{ALARM_CASES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label><span>Cloud enrichment available</span><input type="checkbox" checked={connected} onChange={e=>onConnected(e.target.checked)}/></label></fieldset>
    <EvidenceTrend samples={result.trend} label="PRIMARY PROCESS RATE" caption={result.fresh?'Recorded primary samples; compare with the evidence below. Values and alarm are fictional.':'Last sample at 00:20. Empty timestamps stay missing; no current process value is inferred.'}/>
    <section className="al-hypothesis"><p className="al-eyebrow">HYPOTHESIS / NOT A DIAGNOSIS</p><strong>{result.hypothesis}</strong><div className="al-source-list" aria-label="Hypothesis source references">{result.sourceIds.map(id=><a key={id} href={'#alarm-source-'+id}>{id} ↗</a>)}</div></section>
    <ol className="al-alarm-timeline" aria-label="Synthetic event timeline">{result.events.map(event=><li key={event.id} id={'alarm-source-'+event.id}><span>{event.time} · {event.id}</span><strong>{event.source}</strong><p>{event.detail}</p></li>)}</ol>
    <fieldset className="al-check-choice"><legend>Which evidence would you check next?</legend>{[{id:'independent',label:'Independent reading and tag identity'},{id:'record',label:'Authorised maintenance record'},{id:'freshness',label:'Freshness and current site reading'}].map(option=><button type="button" key={option.id} aria-pressed={check===option.id} onClick={()=>setCheck(option.id)}>{option.label}</button>)}</fieldset>
    {check&&<p className="al-choice-feedback" role="status" data-supported={check===supported}>{check===supported?'This is a supported next check for the selected evidence. ':'That may add context; first address the gap highlighted by this timeline. '}{result.nextCheck} Nothing has been diagnosed or actioned.</p>}
  </div>;
}
