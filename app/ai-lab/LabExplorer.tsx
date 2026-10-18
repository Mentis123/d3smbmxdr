'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LABS, deriveLabState, type LabConditions, type LabIndustry } from '../../lib/ai-lab/content';
import { recipeFor, recipesFor } from '../../lib/ai-lab/recipes';
import { deriveProcedure, PROCEDURE_INITIAL, type ProcedureConditions } from '../../lib/ai-lab/procedure';
import { deriveHistorian, HISTORIAN_INITIAL, type HistorianCase } from '../../lib/ai-lab/historian';
import { LabHeader, LabFooter } from './LabChrome';
import Observation from './Observation';
import ProcedureObservation from './ProcedureObservation';
import HistorianObservation from './HistorianObservation';
import DrawingObservation from './DrawingObservation';
import AlarmObservation from './AlarmObservation';
import { deriveDrawing, DRAWING_INITIAL, type DrawingConditions } from '../../lib/ai-lab/drawing';
import { deriveAlarm, ALARM_INITIAL, type AlarmCase } from '../../lib/ai-lab/alarm';

const INITIAL:LabConditions={lighting:'day',occlusion:false,connected:true,condition:true};
const STEPS=['Try it','How it works','Decide'] as const;
export default function LabExplorer({industry}:{industry:LabIndustry}){
  const frame=useRef<HTMLIFrameElement>(null),panel=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const [recipeId,setRecipeId]=useState(()=>recipesFor(industry)[0].id);
  const [conditions,setConditions]=useState<LabConditions>(INITIAL),[procedure,setProcedure]=useState<ProcedureConditions>(PROCEDURE_INITIAL);
  const [historianCase,setHistorianCase]=useState<HistorianCase>(HISTORIAN_INITIAL),[uplink,setUplink]=useState(true);
  const [drawing,setDrawing]=useState<DrawingConditions>(DRAWING_INITIAL),[alarmCase,setAlarmCase]=useState<AlarmCase>(ALARM_INITIAL),[alarmConnected,setAlarmConnected]=useState(true),[resetVersion,setResetVersion]=useState(0);
  const [ready,setReady]=useState(false),[selected,setSelected]=useState(false),[step,setStep]=useState(0),[synced,setSynced]=useState(false),[linkNotice,setLinkNotice]=useState(false);
  const [choosing,setChoosing]=useState(true),[worldOpen,setWorldOpen]=useState(false);
  const lab=recipeFor(industry,recipeId),recipes=recipesFor(industry),proc=deriveProcedure(procedure),hist=deriveHistorian(historianCase,uplink),draw=deriveDrawing(drawing),alarm=deriveAlarm(alarmCase,alarmConnected);
  const procedureMode=!procedure.connected?'offline':procedure.conflict?'conflict':procedure.approvalRemoved?'removed':procedure.selected==='draft'?'draft':'approved';
  const connected=lab.kind==='drawing'?drawing.connected:lab.kind==='alarm'?alarmConnected:lab.kind==='procedure'?procedure.connected:lab.kind==='historian'?uplink:conditions.connected;
  const payload=useMemo(()=>({...conditions,connected,recipeId,historianCase,procedureMode,drawingScan:drawing.scan,drawingRotated:drawing.rotated,alarmCase}),[conditions,connected,recipeId,historianCase,procedureMode,drawing.scan,drawing.rotated,alarmCase]);
  const latestPayload=useRef(payload);
  const result=lab.kind==='drawing'?{status:draw.status==='ready'?'clear':draw.status,headline:draw.headline,detail:draw.detail,local:draw.register,cloud:draw.cloud}:lab.kind==='alarm'?{status:alarm.status,headline:alarm.headline,detail:alarm.detail,local:alarm.fresh?'Recorded site samples are present; corroboration still required.':'Last site sample 00:20; present process state is unknown.',cloud:alarm.cloud}:lab.kind==='procedure'?{status:proc.status==='ready'?'clear':proc.status,headline:proc.headline,detail:proc.detail,local:'Endpoint: fictional document view. '+proc.cacheLabel,cloud:'Illustrative authority: central register. No document or observation data is transmitted.'}:lab.kind==='historian'?{status:hist.status==='ready'?'clear':hist.status,headline:hist.headline,detail:hist.detail,local:hist.rule,cloud:hist.cloud}:deriveLabState(industry,conditions);
  function send(type:string,data:object={}){frame.current?.contentWindow?.postMessage({type,...data},window.location.origin);}
  function resetFixtures(){setConditions({...INITIAL});setProcedure({...PROCEDURE_INITIAL});setHistorianCase(HISTORIAN_INITIAL);setUplink(true);setDrawing({...DRAWING_INITIAL});setAlarmCase(ALARM_INITIAL);setAlarmConnected(true);setResetVersion(v=>v+1);}
  function choose(id:string,history=true){
    const recipe=recipeFor(industry,id);setLinkNotice(false);setRecipeId(recipe.id);setSelected(true);setChoosing(false);setStep(0);resetFixtures();setSynced(false);
    if(history){const url=new URL(window.location.href);url.hash='';url.searchParams.set('example',recipe.id);window.history.pushState({},'',url);}
    panel.current?.scrollTo({top:0});
  }
  useEffect(()=>{
    const readLink=()=>{const id=new URLSearchParams(window.location.search).get('example');if(id&&recipesFor(industry).some(r=>r.id===id))choose(id,false);else{setRecipeId(recipesFor(industry)[0].id);setSelected(false);setChoosing(true);resetFixtures();setLinkNotice(!!id);if(id){const url=new URL(window.location.href);url.searchParams.delete('example');window.history.replaceState({},'',url);}}};
    readLink();window.addEventListener('popstate',readLink);return()=>window.removeEventListener('popstate',readLink);
    // Industry is the route identity; browser history owns the example query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[industry]);
  useEffect(()=>{
    function message(e:MessageEvent){
      if(e.origin!==window.location.origin||e.source!==frame.current?.contentWindow)return;
      if(e.data?.type==='lab:ready'&&e.data.industry===industry)setReady(true);
      if(e.data?.type==='lab:applied'&&e.data.state&&Object.entries(latestPayload.current).every(([key,value])=>e.data.state[key]===value))setSynced(true);
      if(e.data?.type==='lab:hotspot'){
        const recipe=recipesFor(industry).find(r=>r.id===e.data.recipeId&&r.locationId===e.data.locationId);
        if(recipe){choose(recipe.id);heading.current?.focus({preventScroll:true});panel.current?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
      }
    }
    window.addEventListener('message',message);return()=>window.removeEventListener('message',message);
    // Message payloads are validated against the static industry registry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[industry]);
  useEffect(()=>{latestPayload.current=payload;if(ready){setSynced(false);send('lab:conditions',{conditions:payload});}},[ready,payload]);
  useEffect(()=>{if(ready&&selected)send('worlds:focus',{view:lab.view});},[ready,recipeId,selected,lab.view]);
  useEffect(()=>{if(selected&&!choosing){heading.current?.focus({preventScroll:true});document.querySelector('.al-workspace')?.scrollIntoView({block:'start'});}},[selected,choosing,recipeId]);
  function goStep(next:number){setStep(next);heading.current?.scrollIntoView({block:'start'});heading.current?.focus({preventScroll:true});}
  function close(){setChoosing(true);setSelected(false);setStep(0);resetFixtures();const url=new URL(window.location.href);url.hash='';url.searchParams.delete('example');window.history.pushState({},'',url);window.scrollTo({top:0});}
  function change<K extends keyof LabConditions>(key:K,value:LabConditions[K]){setConditions(c=>({...c,[key]:value}));}
  const sourceLabel=lab.kind==='drawing'?(draw.canUseAsCurrent?'MATCHES EXAMPLE REGISTER':'REVIEW REQUIRED'):lab.kind==='alarm'?(alarm.fresh?'CORROBORATION REQUIRED':'STALE EVIDENCE'):lab.kind==='vision'?(result.status==='review'?'UNCERTAIN':result.status==='attention'?'ADVISORY':'NO FLAG'):lab.kind==='procedure'?(proc.canUseAsCurrent?'APPROVED IN EXAMPLE':'REVIEW REQUIRED'):(hist.observedState==='unknown'?'OBSERVATION UNKNOWN':'EVIDENCE AVAILABLE');
  const resultView=<div className="al-result" data-status={result.status} aria-live="polite"><span className="al-eyebrow">{lab.processingLabel.toUpperCase()} / {sourceLabel}</span><strong>{result.headline}</strong><p>{result.detail}</p>{lab.kind==='procedure'&&proc.sourceRevision&&<a className="al-source-link" href={'#document-'+proc.sourceRevision} onClick={()=>setStep(0)}>Inspect fictional source PX-014 / Rev {proc.sourceRevision} ↗</a>}</div>;
  return <main className="al-container al-explorer" data-industry={industry} data-recipe={lab.id}>
    <LabHeader/>
    <div className="al-world-heading"><div><a href="/ai-lab" className="al-back">← All laboratories</a><h1>{industry==='energy'?'Water and energy':'Mining operations'}</h1></div><span className="al-simulation">SIMULATED DEMONSTRATION · NO LIVE AI</span></div>
    <section className="al-choose" hidden={!choosing} aria-label="Choose an example">
      <p className="al-eyebrow">START HERE · ABOUT 2 MINUTES EACH</p><h2>What would you like to explore?</h2><p>Pick a question. Change the evidence, see what changes, then decide what a person should check.</p>
      {linkNotice&&<p className="al-question" role="status">That example is not available in this world. Choose one below.</p>}
      <nav className="al-recipe-picker" aria-label="Learning examples">{recipes.map((recipe,i)=><button key={recipe.id} data-recipe-choice={recipe.id} aria-pressed={selected&&lab.id===recipe.id} onClick={()=>choose(recipe.id)}><span className="al-card-number">0{i+1}</span><strong>{recipe.title}</strong><small>{recipe.question}</small><span className="al-card-action">Try this example →</span></button>)}</nav>
      {selected&&<button onClick={()=>setChoosing(false)}>Return to current example →</button>}
      <p className="al-small">These are hands-on, scripted examples. You do not need to navigate the 3D site to take part.</p>
    </section>
    <div className="al-workspace" hidden={choosing}>
      <section className="al-world" data-expanded={worldOpen} aria-label="Explore the industry world">
        <div className="al-world-label"><div><span className="al-eyebrow">SITE CONTEXT</span><strong>{lab.subtitle}</strong></div><button className="al-world-toggle" aria-expanded={worldOpen} aria-controls="lab-world-stage" onClick={()=>setWorldOpen(v=>!v)}>{worldOpen?'Close 3D view':'Explore in 3D'}</button></div>
        <img className="al-site-preview" src={LABS[industry].poster} alt="Overview of the fictional industry site"/>
        <div className="al-world-stage" id="lab-world-stage"><iframe ref={frame} title={`${industry==='energy'?'Energy':'Mining'} AI Lab world`} src={`/lab-worlds/${industry}.html?embed=1&experience=lab&controls=compact`} allow="fullscreen; pointer-lock" onLoad={()=>{setSynced(false);send('lab:conditions',{conditions:latestPayload.current});}}/></div>
        <div className="al-scene-caption"><span>Optional exploration · drag to turn, pinch to zoom</span><button onClick={()=>send('worlds:focus',{view:lab.view})} disabled={!ready}>Return to site</button></div>
      </section>
      <aside ref={panel} className="al-panel" aria-label="AI demonstration" data-lab-panel>
        {!selected?<div className="al-start"><p className="al-eyebrow">A LOCATION. A USEFUL QUESTION.</p><h2>{lab.title}</h2><p>{lab.question}</p><div className="al-start-diagram"><span>Observe</span><b>→</b><span>Understand</span><b>→</b><span>Verify</span></div><p>Choose a world hotspot or an example above. Inspect the evidence, change one condition, and see which checks a person still needs to make.</p><button className="al-primary" onClick={()=>choose(lab.id)}>Open demonstration →</button><p className="al-small">Synthetic inputs and fixed rules explain the workflow. No inference, sensor connection or equipment control is running.</p></div>:<>
          <button className="al-change-example" onClick={()=>{setChoosing(true);window.scrollTo({top:0});}}>← Choose another example</button>
          <div className="al-panel-heading"><div><p className="al-eyebrow">STEP {step+1} OF 3 · {lab.kind==='vision'?'EDGE VISION':'DECISION SUPPORT'}</p><h2 ref={heading} tabIndex={-1}>{lab.title}</h2></div></div>
          <p className="al-lesson-goal">{lab.question}</p>
          <div className="al-stepper" role="group" aria-label="Demonstration steps">{STEPS.map((s,i)=><button key={s} onClick={()=>goStep(i)} aria-pressed={step===i} aria-current={step===i?'step':undefined}>{i+1}. {s}</button>)}</div>
          {step===0&&<div className="al-try-hint"><strong>Try one change</strong><p>{lab.kind==='vision'?'Change the lighting or obscure the view below. Watch the result change.':lab.kind==='drawing'?'Change the scan quality or select the file named “latest”. Can you still trust the drawing?':lab.kind==='alarm'?'Choose a different evidence case. The alarm stays the same—does the next check change?':lab.kind==='procedure'?'Select the newer draft, or remove the approval. Which version can a worker rely on?':'Choose a different telemetry case. Is the machine stopped, or is its data missing?'}</p></div>}
          <div className="al-step-body" data-step={step}>
            {step===0?<>
              {lab.kind==='drawing'?<DrawingObservation key={resetVersion} conditions={drawing} onChange={setDrawing}/>:lab.kind==='alarm'?<AlarmObservation key={resetVersion} caseId={alarmCase} connected={alarmConnected} onCase={setAlarmCase} onConnected={setAlarmConnected}/>:lab.kind==='procedure'?<ProcedureObservation conditions={procedure} onChange={setProcedure}/>:lab.kind==='historian'?<HistorianObservation caseId={historianCase} connected={uplink} onCase={setHistorianCase} onConnected={setUplink}/>:<>
                <fieldset className="al-conditions"><legend>Change the illustrated observation</legend><label>Lighting<select aria-label="Lighting" value={conditions.lighting} onChange={e=>change('lighting',e.target.value==='low'?'low':'day')}><option value="day">Daylight</option><option value="low">Low light</option></select></label><label><span>Include {industry==='energy'?'intake debris':'spilled material'}</span><input type="checkbox" checked={conditions.condition} onChange={e=>change('condition',e.target.checked)}/></label><label><span>Obscure the view</span><input type="checkbox" checked={conditions.occlusion} onChange={e=>change('occlusion',e.target.checked)}/></label><label><span>Cloud uplink available</span><input type="checkbox" checked={conditions.connected} onChange={e=>change('connected',e.target.checked)}/></label></fieldset>
                {resultView}
                <Observation industry={industry} conditions={conditions}/>
                <p className="al-small">{lab.observation} Toggling the example changes the illustration; it does not clear real equipment.</p>
              </>}
              <button className="al-text-button" onClick={resetFixtures}>Reset example conditions</button>
            </>:step===1?<>
              <p className="al-eyebrow">WHAT THE OUTPUT MEANS</p><h3>{lab.kind==='vision'?'An advisory needs context.':'Evidence before a conclusion.'}</h3><p>{lab.interpretation}</p><h3>Where could it run?</h3><p>{lab.compute}</p>
              <div className="al-compute" aria-label="Example compute locations">{lab.computeNodes.map(node=><span key={node.label}>{node.label}<small>{node.detail}</small></span>)}</div>
              <p className="al-small">Processing locations are proposed, not live connections. The browser runs example rules; it does not measure model accuracy, confidence or latency.</p>
            </>:<>
              <p className="al-eyebrow">HUMAN AUTHORITY / VERIFICATION</p><h3>Operator decides. Procedures apply.</h3><p>{lab.response}</p><h3>Close the loop with evidence.</h3><p>{lab.verification}</p>
              {['historian','drawing','alarm'].includes(lab.kind)&&<div className="al-callout"><strong>Next supported check</strong><p>{lab.kind==='drawing'?draw.nextCheck:lab.kind==='alarm'?alarm.nextCheck:hist.nextCheck}</p></div>}
              <div className="al-callout"><strong>Advisory only</strong><p>No automatic shutdown, clearance, permit or controller command is connected. The demonstration never marks an inspection as completed.</p></div>
              <h3>Potential value</h3><p>{lab.benefit}</p><h3>Limits to keep in view</h3><p>{lab.limitation}</p>
            </>}
          </div>
          {!(step===0&&lab.kind==='vision')&&resultView}
          {step===1&&<div className="al-connection"><p><b>{lab.kind==='procedure'||lab.kind==='drawing'?'Source authority':'Site edge'}</b> {result.local}</p><p><b>{lab.kind==='procedure'?'Document authority':'Cloud'}</b> {result.cloud}</p></div>}
          <details className="al-evidence-details al-provenance"><summary>How this example is constructed</summary><dl><dt>Input</dt><dd>{lab.inputLabel}</dd><dt>Processing</dt><dd>{lab.processingLabel}; no model inference</dd><dt>Evidence basis</dt><dd>{lab.evidenceLabel}</dd><dt>Authority</dt><dd>Human review and approved site processes; no controller connection</dd></dl></details>
          <div className="al-panel-actions"><button onClick={()=>goStep(Math.max(0,step-1))} disabled={step===0}>← Previous step</button>{step<2?<button className="al-next" onClick={()=>goStep(step+1)}>Next: {STEPS[step+1]} →</button>:<button className="al-next" onClick={close}>Explore another example →</button>}</div>
        </>}
        <p className="al-sync" role="status">{ready?(synced?'World and example connected':'Applying illustration conditions…'):'Loading the world. The example can be explored while the 3D view prepares.'}</p>
      </aside>
    </div>
    <p className="al-boundary">An educational AI Lab, separate from the Decision Room tabletop games. Fictional geography, synthetic inputs and scripted results. No safety certification or operational capability is implied.</p><LabFooter/>
  </main>;
}
