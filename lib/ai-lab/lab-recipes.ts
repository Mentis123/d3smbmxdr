"use client";
import {useCallback,useEffect,useRef,useState} from 'react';

/** Typed view over the synced renderer registry (/map-assets/lab/recipes/index.js). One source for the words. */
export type ChapterId='scene'|'change'|'aiView'|'review';
export type LabChapter={id:ChapterId;at:number;caption:string;say:string;label?:string;sensor?:string;overlay?:{anchor:string;label:string;state:string}};
export type LabRecipe={
 id:string;world:string;featured:boolean;order:number;locationId:string;label:string;
 title:string;benefit:string;limits:string;whereItRuns:[string,string,string];
 /** Optional: why running this on the device matters (privacy, cost, latency, security, offline). Shown as its own panel. */
 whyLocal?:{key:string;text:string}[];
 provenance:{label:string;url:string;kind:'verified'|'vendor'|'pattern'|'press'}[];
 duration:number;chapters:LabChapter[];
 variation?:{id:string;label:string;caption:string;captions?:Partial<Record<ChapterId,string>>};stub?:boolean;
 narration?:{base:string;lines:Partial<Record<ChapterId,string>>;variation?:Partial<Record<ChapterId,string|null>>;delay?:Partial<Record<ChapterId,number>>};
};
export type LabRegistry={RECIPES:Record<string,LabRecipe>;FEATURED:Record<string,LabRecipe[]>;LEGACY_IDS:readonly string[]};
export type RecipeState={chapter:number;chapterId:ChapterId;time:number;duration:number;playing:boolean;variation:string|null;hold:boolean;sensor:boolean;sensorLabel:string|null;sensorTitle?:string|null;ended:boolean};

/** The caption the renderer would show: from the AI view on, the variation's caption (or its per-chapter override) replaces the chapter's. */
export function chapterCaption(recipe:LabRecipe,index:number,variationOn:boolean){
 const chapter=recipe.chapters[index],v=variationOn?recipe.variation:undefined,ai=recipe.chapters.findIndex(c=>c.id==='aiView');
 if(!chapter)return undefined;
 if(!v||ai<0||index<ai)return chapter.caption;
 return v.captions?.[chapter.id]??v.caption??chapter.caption;
}

export const CHAPTER_NAMES:Record<ChapterId,string>={scene:'Scene',change:'Change',aiView:'AI view',review:'Review'};
/** A recipe may name its chapters (e.g. 'The assumption'); otherwise the four generic names apply. */
export const chapterName=(chapter:LabChapter)=>chapter.label??CHAPTER_NAMES[chapter.id];
const REGISTRY_URL='/map-assets/lab/recipes/index.js';
let cached:Promise<LabRegistry>|null=null;

export function loadLabRegistry(){
 // A variable URL plus webpackIgnore keeps the bundler away: the browser loads the synced file the world also reads.
 const url=REGISTRY_URL;
 cached??=import(/* webpackIgnore: true */ url).then(m=>({RECIPES:m.RECIPES,FEATURED:m.FEATURED,LEGACY_IDS:m.LEGACY_IDS}) as LabRegistry).catch(e=>{cached=null;throw e;});
 return cached;
}

export function useLabRegistry(){
 const [registry,setRegistry]=useState<LabRegistry|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let live=true;loadLabRegistry().then(r=>{if(live)setRegistry(r);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[]);
 return {registry,failed};
}

/** The narration clip for a chapter: the variation's own clip (or deliberate silence, null) overrides the normal line. */
export function narrationClip(recipe:LabRecipe,chapterId:ChapterId,variationOn:boolean){
 const n=recipe.narration;if(!n)return null;
 const file=variationOn&&n.variation&&chapterId in n.variation?n.variation[chapterId]:n.lines[chapterId];
 return file?n.base+file:null;
}

const MUTE_KEY='ailab.narration.muted';

// A 50 ms silent WAV, built once. Playing it inside a tap marks the shared audio element as allowed, which WebKit
// (Safari, every iPhone browser) requires: its play() must happen during the gesture, and narration starts a moment later.
let silence:string|null=null;
function silentClip(){
 if(silence)return silence;
 const n=400,b=new DataView(new ArrayBuffer(44+n*2)),w=(o:number,t:string)=>[...t].forEach((c,i)=>b.setUint8(o+i,c.charCodeAt(0)));
 w(0,'RIFF');b.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);
 b.setUint32(24,8000,true);b.setUint32(28,16000,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,'data');b.setUint32(40,n*2,true);
 return silence=URL.createObjectURL(new Blob([b],{type:'audio/wav'}));
}

/**
 * Plays a recipe's narration in step with the renderer's chapter state. Sound is ON by default (owner decision,
 * 23 Oct 2026): opening an exhibit is a click, so the browser allows it. A mute is remembered per browser. If the
 * browser still refuses, `blocked` is set and the page offers "Tap for sound"; captions carry the same words.
 */
export function useNarration(recipe:LabRecipe|null,state:RecipeState|null){
 const unlocked=useRef(false),audio=useRef<HTMLAudioElement|null>(null),last=useRef({key:'',time:0}),timer=useRef<ReturnType<typeof setTimeout>>();
 const [muted,setMuted]=useState(false),[blocked,setBlocked]=useState(false);
 useEffect(()=>{try{setMuted(localStorage.getItem(MUTE_KEY)==='1');}catch{/* Storage may be unavailable; sound stays on. */}},[]);
 const clip=recipe&&state?narrationClip(recipe,state.chapterId,!!state.variation):null;
 const start=useCallback(()=>{const a=audio.current;if(!a)return;a.play().then(()=>setBlocked(false)).catch(()=>setBlocked(true));},[]);
 useEffect(()=>{
  if(!recipe?.narration||!state){audio.current?.pause();last.current={key:'',time:0};return;}
  audio.current??=new Audio();const a=audio.current;
  const key=`${recipe.id}|${state.chapterId}|${state.variation??''}`;
  // A new chapter, a variation switch, or the same chapter restarted (time jumped back) starts the clip again.
  const restart=key!==last.current.key||state.time<last.current.time-.5;
  last.current={key,time:state.time};
  // A line may start a moment into its chapter (narration.delay, seconds) so it lands on the event it describes.
  const delay=(recipe.narration.delay?.[state.chapterId]??0)*1000;
  if(restart){clearTimeout(timer.current);timer.current=undefined;a.pause();if(!clip){a.removeAttribute('src');return;}a.src=clip;a.currentTime=0;}
  if(!clip)return;
  if(!state.playing||muted){clearTimeout(timer.current);timer.current=undefined;a.pause();return;}
  if(restart&&delay>0){timer.current=setTimeout(()=>{timer.current=undefined;start();},delay);return;}
  // Resumed during the delay (timer cleared by the pause): start now rather than replay the wait.
  if(!timer.current&&(restart||(a.paused&&!a.ended)))start();
 },[recipe,state,clip,muted,start]);
 useEffect(()=>()=>{clearTimeout(timer.current);audio.current?.pause();audio.current=null;},[]);
 const toggleMute=useCallback(()=>{setMuted(m=>{const next=!m;try{localStorage.setItem(MUTE_KEY,next?'1':'0');}catch{/* Not persisted. */}if(next){clearTimeout(timer.current);timer.current=undefined;audio.current?.pause();}return next;});},[]);
 // Call from a pointerdown/keydown listener (host page or the same-origin world iframe) so the play() runs inside the tap.
 const unlock=useCallback(()=>{
  // Once per page, and only before any narration clip has been loaded, so a later tap (Pause, Tap for sound) never
  // swaps the silence in over a line. WebKit lifts its gesture restriction when play() is called, so an abort is fine.
  if(unlocked.current)return;audio.current??=new Audio();const a=audio.current;
  if(a.getAttribute('src'))return;
  unlocked.current=true;a.src=silentClip();a.play().then(()=>{if(a.src===silence)a.pause();}).catch(()=>{});
 },[]);
 // The host calls rewind() when the visitor jumps to a chapter or replays: the next state restarts that chapter's line.
 const rewind=useCallback(()=>{last.current={key:'',time:0};},[]);
 return {available:!!recipe?.narration,muted,blocked,toggleMute,tapForSound:start,rewind,unlock};
}
