"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {LabHeader,LabFooter} from './LabChrome';
import {LABS,LAB_WORLDS,type LabIndustry} from '../../lib/ai-lab/content';
import ExhibitEvidence from './ExhibitEvidence';
import {EXHIBITS} from '../../lib/ai-lab/exhibits';
import {CHAPTER_NAMES,chapterCaption,useLabRegistry,type LabRegistry,type RecipeState,useNarration} from '../../lib/ai-lab/lab-recipes';

type TabletopWindow=Window&{__tabletop?:{exhibit?:{prepare:()=>void}}};
const KIND_LABEL={verified:'Verified',vendor:'Vendor',pattern:'Pattern'} as const;

/** Recipe exhibits come from the synced registry for this world; the retired four stay openable by link on the legacy path. */
function allowed(registry:LabRegistry|null,industry:LabIndustry,id:string){
 if(!registry)return false;
 const recipe=Object.hasOwn(registry.RECIPES,id)?registry.RECIPES[id]:null;
 if(recipe)return recipe.world===industry;
 return registry.LEGACY_IDS.includes(id)&&id.startsWith(industry+'.')&&!!EXHIBITS[id];
}

export default function LabExplorer({industry}:{industry:LabIndustry}){
 const frame=useRef<HTMLIFrameElement>(null),dialog=useRef<HTMLDialogElement>(null),stage=useRef<HTMLDivElement>(null),loadTimer=useRef<ReturnType<typeof setTimeout>>(),closeButton=useRef<HTMLButtonElement>(null);
 const request=useRef(0),returnFocus=useRef<HTMLElement|null>(null),idRef=useRef<string|null>(null),pushed=useRef(false),full=useRef(false),nativeFull=useRef(false),ignoreCloseUntil=useRef(0),fullscreenButton=useRef<HTMLButtonElement>(null);
 const [id,setId]=useState<string|null>(null),[ready,setReady]=useState(false),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[phase,setPhase]=useState(0),[playing,setPlaying]=useState(true);
 const [fullscreen,setFullscreen]=useState(false),[rs,setRs]=useState<RecipeState|null>(null);
 const {registry,failed:registryFailed}=useLabRegistry(),registryRef=useRef(registry);registryRef.current=registry;
 const world=LAB_WORLDS[industry],featured=registry?.FEATURED[industry]??[];
 const recipe=id&&registry&&Object.hasOwn(registry.RECIPES,id)?registry.RECIPES[id]:null;
 const legacy=id&&!recipe?EXHIBITS[id]??null:null;
 const title=recipe?.title??legacy?.title;
 const send=useCallback((type:string,data:object={})=>frame.current?.contentWindow?.postMessage({type,requestId:request.current,...data},window.location.origin),[]);
 const command=useCallback((action:string,data:object={})=>send('exhibit:command',{action,...data}),[send]);
 const isModel=useCallback((next:string)=>!!(registryRef.current&&Object.hasOwn(registryRef.current.RECIPES,next))||!!EXHIBITS[next]?.model,[]);
 const prepare=()=>{try{(frame.current?.contentWindow as TabletopWindow|null)?.__tabletop?.exhibit?.prepare();}catch{/* The renderer prepares itself after loading. */}};
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
  if(!allowed(registryRef.current,industry,next))return;
  if(full.current)exitFullscreen();
  returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(history){const url=new URL(window.location.href);url.searchParams.set('example',next);window.history.pushState({...window.history.state,labExhibit:true},'',url);pushed.current=true;}
  // Same-origin preparation must happen before React changes the canvas dimensions.
  if(isModel(next))prepare();
  setId(next);
 },[industry,exitFullscreen,isModel]);
 const close=useCallback(()=>{
  if(pushed.current){pushed.current=false;window.history.back();}
  else{const url=new URL(window.location.href);url.searchParams.delete('example');window.history.replaceState({...window.history.state,labExhibit:false},'',url);setId(null);}
 },[]);
 useEffect(()=>{
  if(!registry)return;
  const read=()=>{pushed.current=!!window.history.state?.labExhibit;const query=new URLSearchParams(window.location.search).get('example');const ok=!!query&&allowed(registry,industry,query);if(ok&&isModel(query))prepare();setId(ok?query:null);};
  read();window.addEventListener('popstate',read);return()=>window.removeEventListener('popstate',read);
 },[industry,registry,isModel]);
 useEffect(()=>{
  const message=(e:MessageEvent)=>{
   if(e.origin!==window.location.origin||e.source!==frame.current?.contentWindow)return;
   if(e.data?.type==='scene:exit-fullscreen'){if(full.current)exitFullscreen();return;}
   if(e.data?.type==='lab:ready'&&e.data.industry===industry){setReady(true);send('scene:fullscreen',{active:full.current});}
   if(e.data?.type==='lab:hotspot'&&registryRef.current?.FEATURED[industry]?.some(r=>r.id===e.data.recipeId&&r.locationId===e.data.locationId))select(e.data.recipeId);
   if(e.data?.requestId!==request.current||e.data?.id!==idRef.current)return;
   if(e.data.type==='exhibit:ready'){clearTimeout(loadTimer.current);setLoaded(true);setFailed(false);
    // The host draws the chapter caption itself, so the renderer's in-scene caption placard is switched off.
    if(registryRef.current&&Object.hasOwn(registryRef.current.RECIPES,e.data.id))send('exhibit:command',{action:'captions',value:false});}
   if(e.data.type==='exhibit:error')setFailed(true);
   if(e.data.type==='exhibit:state'&&e.data.close){if(full.current)exitFullscreen();else if(performance.now()>ignoreCloseUntil.current)close();return;}
   if(e.data.type==='exhibit:state'&&typeof e.data.chapterId==='string'){const d=e.data;setRs({chapter:d.chapter,chapterId:d.chapterId,time:d.time,duration:d.duration,playing:d.playing,variation:d.variation??null,hold:!!d.hold,sensor:!!d.sensor,sensorLabel:typeof d.sensorLabel==='string'?d.sensorLabel:null,ended:!!d.ended});}
   else if(e.data.type==='exhibit:state'){setPhase(e.data.phase);setPlaying(e.data.playing);}
  };
  window.addEventListener('message',message);return()=>window.removeEventListener('message',message);
 },[industry,select,close,exitFullscreen,send]);
 useEffect(()=>{
  idRef.current=id;request.current++;setLoaded(false);setFailed(false);setPhase(0);setRs(null);
  if(!id){send('exhibit:close');dialog.current?.close();if(full.current)dialog.current?.showModal();else dialog.current?.show();returnFocus.current?.focus({preventScroll:true});return;}
  const modal=dialog.current;if(!modal)return;
  modal.close();modal.showModal();closeButton.current?.focus({preventScroll:true});
  if(isModel(id)){loadTimer.current=setTimeout(()=>setFailed(true),30000);if(ready)send('exhibit:open',{id});}
  else send('exhibit:close');
  return()=>{clearTimeout(loadTimer.current);};
 },[id,ready,send,isModel]);
 // Presenter keys on the host page (the canvas handles its own when it has focus): Space, ←/→, R. Esc keeps the dialog semantics.
 const rsRef=useRef(rs);rsRef.current=rs;
 useEffect(()=>{
  if(!recipe)return;
  const key=(e:KeyboardEvent)=>{
   if(e.metaKey||e.ctrlKey||e.altKey)return;
   const t=e.target as HTMLElement|null,control=!!t?.closest('button,a,input,select,textarea,summary,[contenteditable]');
   const s=rsRef.current;
   if(e.key===' '&&!control){e.preventDefault();command(s?.playing?'pause':'play');}
   else if(e.key==='ArrowRight'&&!t?.closest('input,select,textarea')){e.preventDefault();command('chapter',{index:Math.min(3,(s?.chapter??0)+1)});}
   else if(e.key==='ArrowLeft'&&!t?.closest('input,select,textarea')){e.preventDefault();command('chapter',{index:Math.max(0,(s?.chapter??0)-1)});}
   else if((e.key==='r'||e.key==='R')&&!t?.closest('input,select,textarea')){e.preventDefault();command('chapter',{index:s?.chapter??0});}
  };
  document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
 },[recipe,command]);
 const showModel=!!id&&(!!recipe||!!legacy?.model)&&!failed;
 const phaseLabel=legacy?.phases?.[phase]??'';
 const chapterIndex=rs?.chapter??0,chapter=recipe?.chapters[chapterIndex];
 const variationOn=!!recipe?.variation&&!!rs?.variation;
 const caption=recipe?chapterCaption(recipe,chapterIndex,variationOn):undefined;
 const narration=useNarration(recipe&&id===recipe.id?recipe:null,id&&recipe?rs:null);
 return <main className="al-container al-explorer al-exhibits" data-industry={industry}>
  <div><LabHeader/><div className="al-world-heading"><div><a className="al-back" href="/ai-lab">← Choose an industry</a><h1>{world.name}</h1><p className="ex-intro">Look around. Select a marker to watch AI help a person.</p></div></div></div>
  <section className="ex-world" aria-label="Explore the industry world">
   <img src={LABS[industry].poster} alt="Overview of the fictional industry world"/>
   <dialog ref={dialog} className="ex-dialog" data-exhibit={!!id} data-recipe={!!recipe} data-scene-fullscreen={fullscreen} role={id||fullscreen?'dialog':'region'} aria-label={id?undefined:'Interactive industry world'} aria-labelledby={id?'ex-title':undefined} onCancel={e=>{e.preventDefault();if(full.current)exitFullscreen();else if(id&&performance.now()>ignoreCloseUntil.current)close();}} onClick={e=>{if(full.current)return;if(id&&e.target===dialog.current)close();}}>
    {title&&<header className="ex-header"><div><span className="al-eyebrow">AI IN {world.eyebrow}</span><h2 id="ex-title">{title}</h2></div><button ref={closeButton} onClick={close} aria-label="Close exhibit">Close ×</button></header>}
    <div className="ex-body"><div className="ex-visual"><div ref={stage} className="ex-stage" aria-label={id?'Interactive close-up model':'Interactive world'}>
     <div className="ex-viewer-layer" style={id&&!showModel?{display:'none'}:undefined}>
      <iframe ref={frame} title={`${world.frame} interactive world and close-up exhibit`} src={`/lab-worlds/${industry}.html?embed=1&experience=lab&controls=compact&exhibits=1`} allow="fullscreen; pointer-lock"/>
     </div>
     <button ref={fullscreenButton} className="ex-fullscreen-toggle" aria-label={fullscreen?'Exit full screen':'Full screen'} aria-pressed={fullscreen} onClick={()=>fullscreen?exitFullscreen():enterFullscreen()}>{fullscreen?'Exit full screen ×':'⛶ Full screen'}</button>
     {id&&showModel&&!loaded&&<p className="ex-loading" role="status">Preparing the close-up…</p>}
     {legacy&&!showModel&&<div className="ex-flow-illustration"><span className="al-eyebrow">WORKFLOW OVERVIEW</span>{legacy.flow.map((label,i)=><div key={label}><span>{i===0?'◎':i===1?'▤':'◉'}</span><strong>{label}</strong>{i<2&&<i>↓</i>}</div>)}</div>}
     {legacy&&showModel&&<><p className="ex-phase" aria-live="polite"><span>{phase+1} / 3</span>{phaseLabel}</p><ExhibitEvidence id={id!} phase={phase}/><div className="ex-controls" aria-label="Animation playback"><button onClick={()=>command('pause')}>{playing?'Pause':'Play'}</button><button onClick={()=>command('next')} aria-label="Next animation step">Next →</button><button onClick={()=>command('replay')}>Replay</button><button onClick={()=>command('reset')}>Reset view</button></div></>}
     {recipe&&showModel&&loaded&&rs&&chapter&&<>
      <p className="ex-phase ex-caption" aria-live="polite" data-chapter={chapter.id} data-variation={variationOn&&chapterIndex>=2}><span>{chapterIndex+1} / 4 · {CHAPTER_NAMES[chapter.id]}</span>{caption}</p>
      <div className="ex-controls ex-chapterbar" aria-label="Exhibit playback">
      {rs?.sensor&&<div className="ex-sensor-tag" role="status"><span>Camera view{rs.sensorLabel?<small> · {rs.sensorLabel}</small>:null}</span><button onClick={()=>command('sensor',{value:false})}>Back to scene</button></div>}
       <div className="ex-stops" role="group" aria-label="Chapters">{recipe.chapters.map((c,i)=><button key={c.id} data-chapter-stop={c.id} aria-current={i===chapterIndex?'step':undefined} onClick={()=>command('chapter',{index:i})}><b>{i+1}</b>{CHAPTER_NAMES[c.id]}</button>)}</div>
       <div className="ex-actions">
        <button data-action="play" onClick={()=>command(rs?.playing?'pause':'play')}>{rs?.playing?'Pause':rs?.ended?'Play again':'Play'}</button>
        <button data-action="replay" onClick={()=>command('replay')}>Replay</button>
        <button data-action="hold" aria-pressed={!!rs?.hold} onClick={()=>command('hold',{value:!rs?.hold})} title="Pause at the end of each chapter">Hold at chapters</button>
        {narration.available&&(narration.blocked&&!narration.muted?<button data-action="sound" onClick={narration.tapForSound}>Tap for sound</button>:<button data-action="sound" aria-pressed={!narration.muted} onClick={narration.toggleMute} title="Narration">{narration.muted?'Sound off':'Sound on'}</button>)}
        {recipe.variation&&<button data-action="variation" aria-pressed={variationOn} onClick={()=>command('variation',{value:variationOn?null:recipe.variation!.id})} title={recipe.variation.caption}>{recipe.variation.label}</button>}
       </div>
      </div>
     </>}
    </div>
    {failed&&!loaded&&<p className="ex-error" role="status">The 3D close-up is unavailable. You can still explore the explanation.</p>}</div>
    {legacy&&<aside className="ex-copy"><div className="ex-benefit"><strong>{legacy.benefit}</strong></div><h3 className="ex-context-title">How AI helps</h3><p className="ex-explanation">{legacy.copy}</p><div className="ex-compute"><span>Where it runs</span><p>{legacy.flow.join(' → ')}</p></div><p className="ex-disclosure">Illustrative demonstration · simulated inputs</p></aside>}
    {recipe&&<aside className="ex-copy ex-recipe-copy">
     <div className="ex-benefit"><strong>{recipe.benefit}</strong></div>
     <section className="ex-say" aria-live="polite"><h3 className="ex-context-title">Say this{chapter?` · ${CHAPTER_NAMES[chapter.id]}`:''}</h3><p className="ex-explanation">{chapter?.say??recipe.chapters[0].say}</p></section>
     <section className="ex-compute"><span>Where this runs</span><ol className="ex-runs">{recipe.whereItRuns.map((s,i)=><li key={s}><b>{i+1}</b>{s}</li>)}</ol></section>
     <section className="ex-limits"><span>Limits</span><p>{recipe.limits}</p></section>
     <details className="ex-more"><summary>Explain more</summary><ul>{recipe.provenance.map(p=><li key={p.url+p.label}><span className="ex-kind" data-kind={p.kind}>{KIND_LABEL[p.kind]??p.kind}</span><a href={p.url} target="_blank" rel="noopener noreferrer">{p.label}</a></li>)}</ul><p className="ex-disclosure">Fictional site · illustrative AI workflow · simulated inputs</p></details>
    </aside>}</div>
   </dialog>
  </section>

  <div className="ex-bottom"><nav className="ex-places" aria-label="Places to explore"><span className="al-eyebrow">PLACES TO EXPLORE</span>{featured.map(r=><button key={r.id} data-recipe-choice={r.id} onClick={()=>select(r.id)}>{r.title}<span>↗</span></button>)}{!registry&&!registryFailed&&<p className="ex-places-loading">Loading places…</p>}{registryFailed&&<p className="ex-places-loading">Places could not load. Select a marker in the world.</p>}</nav><p className="ex-disclosure">Fictional industry worlds · illustrative AI workflows</p><LabFooter/></div>
 </main>;
}
