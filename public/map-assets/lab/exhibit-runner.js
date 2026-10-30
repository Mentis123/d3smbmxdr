import * as THREE from 'three';
import {KITS} from './kits/index.js';
import {createTimeline,guidedPose} from './exhibit-timeline.js';
import {createSensorView,fitSensorCamera} from './exhibit-sensor.js';
import {createOverlay,projectRect} from './exhibit-overlay.js';
import {createProps} from './exhibit-props.js';
import {createActors} from './exhibit-actors.js';
import {createMediaClock} from './exhibit-media-clock.js';

// Runs one recipe exhibit on the shared stage: timeline, guided camera, sensor view, overlay, controls, messages.
const OVERLAY_DELAY=.5,SWEEP_SECONDS=1.2,REVIEW_AFTER=2.2,HOME={angle:.55,elevation:.42};

// buildKit defaults to the shared registry; a world-local registry (exhibits.js `extra`) passes its own.
export function runRecipe(recipe,stage,host,notify,buildKit=KITS[recipe.id]){
  const {scene,root,camera:orbit,k}=stage;
  k.props=createProps(k);k.actors=createActors(k);
  const kit=buildKit(k);
  const sensors=kit.sensors||{},anchors=kit.anchors||{};
  for(const s of Object.values(sensors))if(!s.camera.parent)root.add(s.camera);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tl=createTimeline(recipe,{reduced});
  const chapters=recipe.chapters,idOf=i=>chapters[i].id;
  const ctxFor=i=>({variation:tl.variation,chapterId:idOf(i),chapter:i,sensor:false});
  kit.update(0,ctxFor(0));
  const sensorView=createSensorView(scene,root),overlay=createOverlay(host);

  // Fitted home view: the existing fit (actual mesh corners), from the visible scene at t=0.
  root.updateMatrixWorld(true);
  const framePoints=[],center=new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  const shown=o=>{for(let p=o;p&&p!==root;p=p.parent)if(!p.visible||p.userData.noFit)return false;return true;};
  root.traverse(o=>{if(!o.isMesh||!shown(o))return;const a=o.geometry.attributes.position,step=Math.max(1,Math.floor(a.count/240));for(let i=0;i<a.count;i+=step)framePoints.push(new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(center));});
  const vertical=new THREE.Vector3(0,1,0);
  function fitHome(aspect){
    const outward=new THREE.Vector3(Math.sin(HOME.angle)*Math.cos(HOME.elevation),Math.sin(HOME.elevation),Math.cos(HOME.angle)*Math.cos(HOME.elevation));
    const right=new THREE.Vector3().crossVectors(vertical,outward).normalize(),up=new THREE.Vector3().crossVectors(outward,right).normalize();
    // Portrait canvases may crop the plinth's sides a little rather than leave empty bands above and below.
    const tanV=Math.tan(THREE.MathUtils.degToRad(orbit.fov/2)),tanH=tanV*aspect*(aspect<1?1.3:1),coords=framePoints.map(p=>({x:p.dot(right),y:p.dot(up),z:p.dot(outward)}));
    let sx=0,sy=0,fit=0;
    for(let it=0;it<4;it++){fit=0;for(const p of coords)fit=Math.max(fit,p.z+Math.abs(p.x-sx)/tanH,p.z+Math.abs(p.y-sy)/tanV);if(it===3)break;
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of coords){const d=fit-p.z;minX=Math.min(minX,(p.x-sx)/d);maxX=Math.max(maxX,(p.x-sx)/d);minY=Math.min(minY,(p.y-sy)/d);maxY=Math.max(maxY,(p.y-sy)/d);}
      sx+=(minX+maxX)*.5*fit;sy+=(minY+maxY)*.5*fit;}
    return{angle:HOME.angle,elevation:HOME.elevation,distance:fit*1.08,target:center.clone().addScaledVector(right,sx).addScaledVector(up,sy).toArray()};
  }
  // Tall, narrow canvases: guided close-ups back off a little so the subject keeps its context horizontally,
  // or use the chapter's own camera.portrait pose (merged over its camera) when the recipe gives one.
  let aspectKey=-1,home=null,camChapters=chapters;
  function framesFor(aspect){
    if(aspect===aspectKey)return;aspectKey=aspect;home=fitHome(aspect);
    const f=aspect<1.2?Math.min(1.6,Math.sqrt(1.2/aspect)):1;
    camChapters=chapters.map(c=>{if(!c.camera)return c;const {portrait,...cam}=c.camera;
      return{...c,camera:portrait&&aspect<1?{...cam,...portrait}:{...cam,distance:cam.distance*f}};});
  }

  let captions=true,user=null,easeFrom=null,sensorOff=false,lastIndex=-1,sig='',pose=null,activeCamera=orbit,overlayInfo=null,mediaClock=null;
  const points=new Map();let gesture=null;
  const outward=new THREE.Vector3();
  function placeOrbit(p){outward.set(Math.sin(p.angle)*Math.cos(p.elevation),Math.sin(p.elevation),Math.cos(p.angle)*Math.cos(p.elevation));
    orbit.position.fromArray(p.target).addScaledVector(outward,p.distance);orbit.lookAt(new THREE.Vector3().fromArray(p.target));orbit.updateMatrixWorld();}
  function overlayFor(i,t){
    const c=chapters[i];let ov=c.overlay;if(!ov)return null;
    const unclear=tl.variation&&recipe.variation&&i>=chapters.findIndex(x=>x.id==='aiView');
    if(unclear)ov={anchor:recipe.variation.overlay?.anchor||ov.anchor,label:recipe.variation.overlay?.label||'View unclear',state:'unclear'};
    // A chapter overlay may clear (or settle to a neutral label) at a set time: overlay.until + optional overlay.after.
    if(!unclear&&ov.until!=null&&t>=ov.until){const after=ov.after;if(!after)return null;return{anchor:anchors[after.anchor||ov.anchor],label:after.label,state:after.state||'neutral',sweep:null};}
    const first=chapters.findIndex(x=>x.overlay)===i,since=t-c.at;
    if(first&&since<OVERLAY_DELAY)return null;
    const s=first?since-OVERLAY_DELAY:SWEEP_SECONDS;let state=ov.state;
    if(s<SWEEP_SECONDS&&first)state=unclear?'unclear':'neutral';
    else if(ov.state==='review'&&first&&s<SWEEP_SECONDS+REVIEW_AFTER)state='noticed';
    return{anchor:anchors[ov.anchor],label:ov.label,state,sweep:first&&s<SWEEP_SECONDS?s/SWEEP_SECONDS:null};
  }
  const aiIndex=chapters.findIndex(x=>x.id==='aiView');
  // From the AI view on, the variation's caption replaces the chapter's; variation.captions[chapterId] overrides it per chapter.
  const captionFor=i=>{const v=tl.variation&&recipe.variation;if(!v||aiIndex<0||i<aiIndex)return chapters[i].caption;return v.captions?.[chapters[i].id]??v.caption??chapters[i].caption;};
  function subjectAnchor(i){const id=chapters[i].overlay?.anchor||chapters.find(c=>c.id==='aiView')?.overlay?.anchor||Object.keys(anchors)[0];return anchors[id];}
  function state(){const i=tl.index;return{id:recipe.id,chapter:i,chapterId:idOf(i),time:tl.time,duration:recipe.duration,playing:mediaClock?mediaClock.playing:tl.playing,variation:tl.variation,hold:tl.hold,sensor:activeCamera!==orbit,sensorLabel:activeCamera!==orbit?(sensors[chapters[i].sensor]?.label||'site camera'):null,sensorTitle:activeCamera!==orbit?(sensors[chapters[i].sensor]?.title||null):null,ended:tl.ended};}

  function update(dt){
    if(mediaClock)tl.seek(mediaClock.at(performance.now()));else tl.step(dt);
    const t=tl.time,i=tl.index,w=host.clientWidth,h=host.clientHeight;
    if(i!==lastIndex){if(!mediaClock){if(lastIndex>=0&&user)easeFrom={index:i,pose:user};else if(lastIndex>=0&&i!==lastIndex+1)easeFrom=null;user=null;sensorOff=false;}lastIndex=i;}
    const c=chapters[i],sensor=c.sensor&&!sensorOff?sensors[c.sensor]:null;
    kit.update(t,{...ctxFor(i),sensor:!!sensor});
    if(w>0&&h>0){const aspect=w/h;framesFor(aspect);orbit.aspect=aspect;orbit.updateProjectionMatrix();if(sensor)fitSensorCamera(sensor.camera,aspect);}
    pose=user||guidedPose(camChapters,t,home||fitHome(1.6),easeFrom);placeOrbit(pose);
    activeCamera=sensor?sensor.camera:orbit;activeCamera.updateWorldMatrix(true,false);
    overlayInfo=overlayFor(i,t);
    // The mask wears the overlay's state colour, so the outlined object and its label tell one story.
    sensorView.apply(c.sensor,sensor,tl.variation&&aiIndex>=0&&i>=aiIndex?'unclear':overlayInfo?.state||'neutral');
    const rect=overlayInfo?.anchor&&w>0?projectRect(overlayInfo.anchor,activeCamera,w,h):null;
    const sub=captions&&!rect&&w>0?subjectAnchor(i):null,caption=captions?{text:captionFor(i),rect:sub?projectRect(sub,activeCamera,w,h):null,pinned:!!sensor}:null;
    overlay.update({rect,label:overlayInfo?.label,state:overlayInfo?.state,sweep:overlayInfo?.sweep,caption,camera:{active:!!sensor,label:(sensor?.title||'Camera view')+' · '+(sensor?.label||'site camera')}});
    const s=state(),next=[s.chapter,s.playing,s.variation,s.hold,s.sensor,s.ended].join('|');
    if(next!==sig){sig=next;notify(s);}
  }
  const send=()=>{sig='';update(0);};
  function seekChapter(n){const i=Math.max(0,Math.min(chapters.length-1,n));tl.seek(tl.chapterTime(i));user=null;easeFrom=null;sensorOff=false;lastIndex=i;if(!reduced)tl.play();send();}
  function takeOver(){if(!user)user={...pose,target:[...pose.target]};if(activeCamera!==orbit)sensorOff=true;}

  const stop=e=>{e.stopImmediatePropagation();};
  // Same gestures as the worlds (navigation.js): drag rotates; right, middle or Shift-drag pans; Alt-drag lifts the target;
  // two fingers pan and pinch together; the wheel zooms.
  const panRight=new THREE.Vector3(),panUp=new THREE.Vector3();
  function pan(dx,dy){orbit.updateMatrixWorld();const units=2*user.distance*Math.tan(THREE.MathUtils.degToRad(orbit.fov/2))/Math.max(1,host.clientHeight);
    panRight.setFromMatrixColumn(orbit.matrixWorld,0);panUp.setFromMatrixColumn(orbit.matrixWorld,1);
    const t=new THREE.Vector3().fromArray(user.target).addScaledVector(panRight,-dx*units).addScaledVector(panUp,dy*units);
    t.x=THREE.MathUtils.clamp(t.x,-8,8);t.y=THREE.MathUtils.clamp(t.y,-1,6);t.z=THREE.MathUtils.clamp(t.z,-8,8);user.target=t.toArray();}
  const pair=()=>{const [a,b]=[...points.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y))};};
  const dragKind=e=>e.altKey?'crane':e.shiftKey||e.button===1||e.button===2?'pan':'rotate';
  function down(e){stop(e);if(e.button>2)return;host.focus({preventScroll:true});points.set(e.pointerId,{x:e.clientX,y:e.clientY,kind:dragKind(e)});host.setPointerCapture(e.pointerId);gesture=points.size>1?pair():null;e.preventDefault();}
  function move(e){if(!points.has(e.pointerId))return;stop(e);const old=points.get(e.pointerId);points.set(e.pointerId,{...old,x:e.clientX,y:e.clientY});takeOver();
    if(points.size>1){const g=pair();
      if(gesture){pan(g.x-gesture.x,g.y-gesture.y);user.distance=THREE.MathUtils.clamp(user.distance*gesture.d/g.d,1.2,24);}gesture=g;}
    else{const dx=e.clientX-old.x,dy=e.clientY-old.y;
      if(old.kind==='pan')pan(dx,dy);
      else if(old.kind==='crane'){const t=[...user.target];t[1]=THREE.MathUtils.clamp(t[1]-dy*.01,-1,6);user.target=t;}
      else{user.angle-=dx*.007;user.elevation=THREE.MathUtils.clamp(user.elevation+dy*.005,.05,1.25);}}send();}
  function up(e){if(!points.has(e.pointerId))return;stop(e);points.delete(e.pointerId);gesture=points.size>1?pair():null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);}
  function wheel(e){stop(e);e.preventDefault();takeOver();user.distance=THREE.MathUtils.clamp(user.distance*Math.exp(e.deltaY*.001),1.2,24);send();}
  function keydown(e){
    if(e.key==='Escape'){stop(e);e.preventDefault();notify({close:true});return;}
    if(e.target!==host)return;
    if(e.shiftKey&&e.key.startsWith('Arrow')){stop(e);e.preventDefault();takeOver();pan(e.key==='ArrowLeft'?35:e.key==='ArrowRight'?-35:0,e.key==='ArrowUp'?35:e.key==='ArrowDown'?-35:0);send();return;}
    if(mediaClock){
      if(e.key===' '){notify({mediaAction:'toggle'});return;}
      if(e.key==='ArrowRight'||e.key==='PageDown'){notify({mediaAction:'chapter',index:tl.index+1});return;}
      if(e.key==='ArrowLeft'||e.key==='PageUp'){notify({mediaAction:'chapter',index:tl.index-1});return;}
      if(e.key==='r'||e.key==='R'){notify({mediaAction:'chapter',index:tl.index});return;}
    }
    const keys={ArrowLeft:1,ArrowRight:1,PageUp:1,PageDown:1,ArrowUp:1,ArrowDown:1,'+':1,'-':1,' ':1,Home:1,r:1,R:1};if(!keys[e.key]&&e.code!=='KeyF')return;
    stop(e);e.preventDefault();
    if(e.key==='ArrowRight'||e.key==='PageDown')seekChapter(tl.index+1);
    else if(e.key==='ArrowLeft'||e.key==='PageUp')seekChapter(tl.index-1);
    else if(e.key==='r'||e.key==='R')seekChapter(tl.index);
    else if(e.key===' '){tl.playing?tl.pause():tl.play();send();}
    else if(e.key==='Home'||e.code==='KeyF'){user=null;easeFrom=null;send();}
    else{takeOver();if(e.key==='ArrowUp')user.elevation=Math.min(1.25,user.elevation+.1);if(e.key==='ArrowDown')user.elevation=Math.max(.05,user.elevation-.1);if(e.key==='+')user.distance=Math.max(1.2,user.distance/1.1);if(e.key==='-')user.distance=Math.min(24,user.distance*1.1);send();}
  }
  const menu=e=>{stop(e);e.preventDefault();}; // right-drag pans, so no context menu over the close-up
  const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['wheel',wheel],['contextmenu',menu]];
  listeners.forEach(([n,f])=>host.addEventListener(n,f,{capture:true,passive:false}));document.addEventListener('keydown',keydown,true);
  if(reduced)tl.seek(tl.chapterTime(0));
  update(0);

  function command(action,data={}){
    const v=data?.value;
    if(action==='play')tl.play();
    else if(action==='pause')tl.pause();
    else if(action==='replay'){tl.seek(0);user=null;easeFrom=null;sensorOff=false;if(!reduced)tl.play();}
    else if(action==='reset'){user=null;easeFrom=null;}
    else if(action==='chapter'){seekChapter(Number(data?.index??v)|0);return;}
    else if(action==='next'){seekChapter(tl.index+1);return;}
    else if(action==='back'){seekChapter(tl.index-1);return;}
    else if(action==='variation')tl.setVariation(v===undefined?(tl.variation?null:recipe.variation?.id):v);
    else if(action==='hold')tl.setHold(v===undefined?!tl.hold:!!v);
    else if(action==='sensor'){sensorOff=v===undefined?!sensorOff:!v;if(sensorOff)user=null;}
    else if(action==='captions')captions=v===undefined?!captions:!!v;
    else return;
    send();
  }
  function metrics(){
    const i=tl.index,w=host.clientWidth,h=host.clientHeight,anchor=subjectAnchor(i);activeCamera.updateWorldMatrix(true,false);
    const r=anchor&&h>0?projectRect(anchor,activeCamera,w,h):null;
    const top=r?Math.max(0,r.top):0,bottom=r?Math.min(h,r.bottom):0;
    return{...state(),title:recipe.title,subjectFraction:r?Math.max(0,bottom-top)/h:0,subjectRect:r,overlay:overlay.state,caption:overlay.caption,overlayBoxes:host.querySelectorAll('.exhibit-overlay').length,
      camera:pose&&{angle:pose.angle,elevation:pose.elevation,distance:pose.distance,target:pose.target},userCamera:!!user,kit:kit.metrics?.()||null};
  }
  return{scene,get camera(){return activeCamera;},update,command,
    setTime(t){const before=tl.index;tl.pause();tl.seek(t);user=null;easeFrom=null;if(tl.index!==before)sensorOff=false;lastIndex=tl.index;send();},
    // A host that owns the clock (an audio narration, /mining/lab on the Data#3 site) drives time with setClock; the timeline follows it.
    setClock(sample){mediaClock??=createMediaClock(recipe.duration);mediaClock.sample(sample,performance.now());tl.pause();update(0);},
    chapter(n){seekChapter(n);tl.pause();send();},
    metrics,
    dispose(){listeners.forEach(([n,f])=>host.removeEventListener(n,f,true));document.removeEventListener('keydown',keydown,true);points.clear();overlay.dispose();sensorView.dispose();kit.dispose?.();for(const s of Object.values(sensors))s.camera.removeFromParent();stage.dispose();}};
}
