"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {LabHeader,LabFooter} from './LabChrome';
import {LABS,type LabIndustry} from '../../lib/ai-lab/content';
import {recipesFor} from '../../lib/ai-lab/recipes';
import ExhibitEvidence from './ExhibitEvidence';
import {EXHIBITS} from '../../lib/ai-lab/exhibits';

export default function LabExplorer({industry}:{industry:LabIndustry}){
 const frame=useRef<HTMLIFrameElement>(null),dialog=useRef<HTMLDialogElement>(null),stage=useRef<HTMLDivElement>(null),loadTimer=useRef<ReturnType<typeof setTimeout>>(),closeButton=useRef<HTMLButtonElement>(null);
 const request=useRef(0),returnFocus=useRef<HTMLElement|null>(null),idRef=useRef<string|null>(null),pushed=useRef(false),full=useRef(false),nativeFull=useRef(false),ignoreCloseUntil=useRef(0),fullscreenButton=useRef<HTMLButtonElement>(null);
 const [id,setId]=useState<string|null>(null),[ready,setReady]=useState(false),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[phase,setPhase]=useState(0),[playing,setPlaying]=useState(true);
 const [fullscreen,setFullscreen]=useState(false);
 const recipes=recipesFor(industry),exhibit=id?EXHIBITS[id]:null;
 const send=useCallback((type:string,data:object={})=>frame.current?.contentWindow?.postMessage({type,requestId:request.current,...data},window.location.origin),[]);
 const exitFullscreen=useCallback(()=>{
  full.current=false;nativeFull.current=false;ignoreCloseUntil.current=performance.now()+300;setFullscreen(false);
  send('scene:fullscreen',{active:false});
  if(document.fullscreenElement)void document.exitFullscreen?.().catch(()=>{});
  if(!idRef.current&&dialog.current?.matches(':modal')){dialog.current.close();dialog.current.show();}
  fullscreenButton.current?.focus({preventScroll:true});
 },[send]);
 const enterFullscreen=useCallback(()=>{
  full.current=true;setFullscreen(true);send('scene:fullscreen',{active:true});
  if(!dialog.current?.matches(':modal')){dialog.current?.close();dialog.current?.showModal();}
  // Keep the same scene mounted. CSS supplies a viewport-sized fallback on browsers without this API.
  try{const result=stage.current?.requestFullscreen?.();result?.catch(()=>{});}catch{/* Viewport fallback remains active. */}
 },[send]);
 useEffect(()=>{
  const changed=()=>{if(document.fullscreenElement===stage.current){nativeFull.current=true;if(!full.current)void document.exitFullscreen().catch(()=>{});}else if(nativeFull.current)exitFullscreen();};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&full.current){e.preventDefault();e.stopImmediatePropagation();exitFullscreen();}};
  document.addEventListener('fullscreenchange',changed);document.addEventListener('keydown',escape,true);
  return()=>{document.removeEventListener('fullscreenchange',changed);document.removeEventListener('keydown',escape,true);};
 },[exitFullscreen]);
 useEffect(()=>{
  if(!id&&!fullscreen)return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=overflow;};
 },[id,fullscreen]);
 const select=useCallback((next:string,history=true)=>{
  if(!recipesFor(industry).some(r=>r.id===next))return;
  if(full.current)exitFullscreen();
  returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(history){const url=new URL(window.location.href);url.searchParams.set('example',next);window.history.pushState({...window.history.state,labExhibit:true},'',url);pushed.current=true;}
  // Same-origin preparation must happen before React changes the canvas dimensions.
  if(EXHIBITS[next].model){try{(frame.current?.contentWindow as (Window&{__tabletop?:{exhibit?:{prepare:()=>void}}})|null)?.__tabletop?.exhibit?.prepare();}catch{/* The renderer will prepare itself after loading. */}}
  setId(next);
 },[industry,exitFullscreen]);
 const close=useCallback(()=>{
  if(pushed.current){pushed.current=false;window.history.back();}
  else{const url=new URL(window.location.href);url.searchParams.delete('example');window.history.replaceState({...window.history.state,labExhibit:false},'',url);setId(null);}
 },[]);
 useEffect(()=>{
  const read=()=>{pushed.current=!!window.history.state?.labExhibit;const query=new URLSearchParams(window.location.search).get('example');if(query&&EXHIBITS[query]?.model){try{(frame.current?.contentWindow as (Window&{__tabletop?:{exhibit?:{prepare:()=>void}}})|null)?.__tabletop?.exhibit?.prepare();}catch{/* Initial direct links may still be loading. */}}setId(query&&recipesFor(industry).some(r=>r.id===query)?query:null);};
  read();window.addEventListener('popstate',read);return()=>window.removeEventListener('popstate',read);
 },[industry]);
 useEffect(()=>{
  const message=(e:MessageEvent)=>{
   if(e.origin!==window.location.origin||e.source!==frame.current?.contentWindow)return;
   if(e.data?.type==='scene:exit-fullscreen'){if(full.current)exitFullscreen();return;}
   if(e.data?.type==='lab:ready'&&e.data.industry===industry){setReady(true);send('scene:fullscreen',{active:full.current});}
   if(e.data?.type==='lab:hotspot'&&recipesFor(industry).some(r=>r.id===e.data.recipeId&&r.locationId===e.data.locationId))select(e.data.recipeId);
   if(e.data?.requestId!==request.current||e.data?.id!==idRef.current)return;
   if(e.data.type==='exhibit:ready'){clearTimeout(loadTimer.current);setLoaded(true);setFailed(false);}
   if(e.data.type==='exhibit:error')setFailed(true);
   if(e.data.type==='exhibit:state'&&e.data.close){if(full.current)exitFullscreen();else if(performance.now()>ignoreCloseUntil.current)close();return;}
   if(e.data.type==='exhibit:state'){setPhase(e.data.phase);setPlaying(e.data.playing);}
  };
  window.addEventListener('message',message);return()=>window.removeEventListener('message',message);
 },[industry,select,close,exitFullscreen,send]);
 useEffect(()=>{
  idRef.current=id;request.current++;setLoaded(false);setFailed(false);setPhase(0);
  if(!id){send('exhibit:close');dialog.current?.close();if(full.current)dialog.current?.showModal();else dialog.current?.show();returnFocus.current?.focus({preventScroll:true});return;}
  const modal=dialog.current;if(!modal)return;
  modal.close();modal.showModal();closeButton.current?.focus({preventScroll:true});
  if(EXHIBITS[id].model){loadTimer.current=setTimeout(()=>setFailed(true),30000);if(ready)send('exhibit:open',{id});}
  else if(!EXHIBITS[id].model)send('exhibit:close');
  return()=>{clearTimeout(loadTimer.current);};
 },[id,ready,send]);
 const showModel=!!exhibit?.model&&!failed;
 const phaseLabel=exhibit?.phases?.[phase]??(phase===0?(industry==='mining'?'Material moving normally':'Water passing through the rack'):phase===1?(industry==='mining'?'Material gathering at the transfer point':'Debris gathering against the rack'):'AI flags a possible build-up for an operator to inspect');
 return <main className="al-container al-explorer al-exhibits" data-industry={industry}>
  <div><LabHeader/><div className="al-world-heading"><div><a className="al-back" href="/ai-lab">← Choose an industry</a><h1>{industry==='energy'?'Water and energy':'Mining operations'}</h1><p className="ex-intro">Look around. Select a marker to discover how AI helps.</p></div></div></div>
  <section className="ex-world" aria-label="Explore the industry world">
   <img src={LABS[industry].poster} alt="Overview of the fictional industry world"/>
   <dialog ref={dialog} className="ex-dialog" data-exhibit={!!id} data-scene-fullscreen={fullscreen} role={id||fullscreen?'dialog':'region'} aria-label={id?undefined:'Interactive industry world'} aria-labelledby={id?'ex-title':undefined} onCancel={e=>{e.preventDefault();if(full.current)exitFullscreen();else if(id&&performance.now()>ignoreCloseUntil.current)close();}} onClick={e=>{if(full.current)return;if(id&&e.target===dialog.current)close();}}>
    {exhibit&&<header className="ex-header"><div><span className="al-eyebrow">AI IN {industry==='mining'?'MINING':'WATER AND ENERGY'}</span><h2 id="ex-title">{exhibit.title}</h2></div><button ref={closeButton} onClick={close} aria-label="Close exhibit">Close ×</button></header>}
    <div className="ex-body"><div className="ex-visual"><div ref={stage} className="ex-stage" aria-label={id?'Interactive close-up model':'Interactive world'}>
     <div className="ex-viewer-layer" style={id&&!showModel?{display:'none'}:undefined}>
      <iframe ref={frame} title={`${industry==='energy'?'Energy':'Mining'} interactive world and close-up exhibit`} src={`/lab-worlds/${industry}.html?embed=1&experience=lab&controls=compact&exhibits=1`} allow="fullscreen; pointer-lock"/>
     </div>
     <button ref={fullscreenButton} className="ex-fullscreen-toggle" aria-label={fullscreen?'Exit full screen':'Full screen'} aria-pressed={fullscreen} onClick={()=>fullscreen?exitFullscreen():enterFullscreen()}>{fullscreen?'Exit full screen ×':'⛶ Full screen'}</button>
     {id&&showModel&&!loaded&&<p className="ex-loading" role="status">Preparing the close-up…</p>}
     {exhibit&&!showModel&&<div className="ex-flow-illustration"><span className="al-eyebrow">WORKFLOW OVERVIEW</span>{exhibit.flow.map((label,i)=><div key={label}><span>{i===0?'◎':i===1?'▤':'◉'}</span><strong>{label}</strong>{i<2&&<i>↓</i>}</div>)}</div>}
     {id&&showModel&&<><p className="ex-phase" aria-live="polite"><span>{phase+1} / 3</span>{phaseLabel}</p><ExhibitEvidence id={id} phase={phase}/><div className="ex-controls" aria-label="Animation playback"><button onClick={()=>send('exhibit:command',{action:'pause'})}>{playing?'Pause':'Play'}</button><button onClick={()=>send('exhibit:command',{action:'next'})} aria-label="Next animation step">Next →</button><button onClick={()=>send('exhibit:command',{action:'replay'})}>Replay</button><button onClick={()=>send('exhibit:command',{action:'reset'})}>Reset view</button></div></>}
    </div>
    {failed&&!loaded&&<p className="ex-error" role="status">The 3D close-up is unavailable. You can still explore the explanation.</p>}</div>
    {exhibit&&<aside className="ex-copy"><div className="ex-benefit"><strong>{exhibit.benefit}</strong></div><h3 className="ex-context-title">How AI helps</h3><p className="ex-explanation">{exhibit.copy}</p><div className="ex-compute"><span>Where it runs</span><p>{exhibit.flow.join(' → ')}</p></div><p className="ex-disclosure">Illustrative demonstration · simulated inputs</p></aside>}</div>
   </dialog>
  </section>

  <div className="ex-bottom"><nav className="ex-places" aria-label="Places to explore"><span className="al-eyebrow">PLACES TO EXPLORE</span>{recipes.map(r=><button key={r.id} data-recipe-choice={r.id} onClick={()=>select(r.id)}>{EXHIBITS[r.id].title}<span>↗</span></button>)}</nav><p className="ex-disclosure">Fictional industry worlds · illustrative AI workflows</p><LabFooter/></div>
 </main>;
}
