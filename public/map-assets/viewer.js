import * as THREE from 'three';
import {clampZoom,orbitDistance,MIN_ORBIT_DISTANCE} from './camera-limits.js';
import {createAdaptiveQuality,resolutionFor} from './adaptive-quality.js';
import {createScene as createEnergyScene,SEED as ENERGY_SEED} from './scene.js';
import {MINING_VIEWS} from './mining-layout.js';
import {createPipeline} from './pipeline.js';
import {createNavigation} from './navigation.js';
import {compileShot,auditShot} from './flythrough.js';
import {SHOTS,getShot} from './shots/index.js';
import {reservoirOutline,riverCenter,riverHalfWidth} from './hydro-profile.js';
import {auditGeometry,auditLandmarks} from './geometry-audit.js';
import {auditInfrastructure} from './infrastructure-audit.js';
const params=new URLSearchParams(location.search), capture=params.get('capture')==='1';
const isMining=document.body.dataset.world==='mining';
const createScene=isMining?(await import('./mining-scene.js')).createMiningScene:createEnergyScene;
const SEED=isMining?181026:ENERGY_SEED;
if(capture)document.body.classList.add('diagnostic');
// embed=1: the scene is hosted inside another page (the /worlds explorer), which supplies its own chrome.
if(params.get('embed')==='1')document.body.classList.add('embed');
// Learning embeds reveal camera tools deliberately instead of covering the scene.
if(params.get('controls')==='compact'){
  document.body.classList.add('compact-controls');
  const toggle=document.createElement('button');toggle.className='camera-tools-toggle';toggle.textContent='Camera controls';toggle.setAttribute('aria-expanded','false');
  toggle.addEventListener('click',()=>{const open=document.body.classList.toggle('camera-tools-open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Hide camera controls':'Camera controls';});
  document.querySelector('#viewer').append(toggle);
}
const host=document.querySelector('#scene'),loading=document.querySelector('#loading'),error=document.querySelector('#error');
const openingTilt=Math.atan2(15,Math.hypot(12,23));
let tilt=openingTilt,targetTilt=openingTilt,azimuth=Math.atan2(12,23);
let labLayer,exhibit=null,exhibitSaved=null,exhibitRequest=0;
const exhibitMode=params.get('exhibits')==='1';
let renderer,world,camera,pipeline,navigation,raf=0,elapsed=0,last=0,yaw=0,targetYaw=0,zoom=1,targetZoom=1,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,quality='auto',disposed=false,frameTimes=[];
try {quality=localStorage.getItem('tabletop-quality')||quality;}catch{}
if(params.has('quality'))quality=['auto','high','low'].includes(params.get('quality'))?params.get('quality'):'auto';if(!['auto','high','low'].includes(quality))quality='auto';if(capture&&!params.has('quality'))quality='high';
if(params.get('paused')==='1'||capture)paused=true;
const mobileDevice=matchMedia('(pointer:coarse)').matches;document.body.classList.toggle('touch-ui',mobileDevice);
const tuner=createAdaptiveQuality({mobile:mobileDevice,conservative:navigator.hardwareConcurrency<=4||(navigator.deviceMemory!==undefined&&navigator.deviceMemory<=4),mode:quality,now:performance.now(),onChange:()=>applyQualityProfile()});
let effectiveProfile=tuner.profile();
const qSelect=document.querySelector('#quality');qSelect.value=quality;
const views=isMining?MINING_VIEWS:{intake:{yaw:0,target:[-4.4,1.75,-1.05],zoom:3.3,tilt:.9,azimuth:Math.PI+.35,fov:38},maintenance:{yaw:0,target:[4.5,2,-6.65],zoom:6,tilt:.6,azimuth:1.1,fov:38},patrol:{yaw:0,target:[5.55,1.95,-.8],zoom:5,tilt:.72,azimuth:.4,fov:38},reference:{yaw:0,target:[.61875,.1,-.028125],zoom:1.4864516,tilt:.58775,azimuth:.2175},hero:{yaw:0,target:[0,1.0,0],zoom:1},quarter:{yaw:Math.PI/2,target:[0,1,0],zoom:1},rear:{yaw:Math.PI,target:[0,1,0],zoom:1},threeQuarter:{yaw:Math.PI*1.5,target:[0,1,0],zoom:1},dam:{yaw:0,target:[-4,1.0,.6],zoom:1.9},vehicle:{yaw:0,target:[-4.2,2.4,-.72],zoom:2.2},tanks:{yaw:0,target:[3.3,1.9,1.4],zoom:2.2},grid:{yaw:0,target:[7,2.2,-.8],zoom:2.2},town:{yaw:0,target:[3.8,2.0,-6.9],zoom:2.2},bridge:{yaw:Math.PI,target:[-6.5,1.6,6.8],zoom:2.2},'tank-detail':{yaw:0,target:[2.1,2.1,1.25],zoom:2.2,fov:24},'grid-detail':{yaw:0,target:[7.3,2.6,-.65],zoom:2.2,fov:28},'town-detail':{yaw:0,target:[2.5,2.7,-7],zoom:2.2,fov:24}};
let target=new THREE.Vector3(0,1,0);
async function handleExhibit(data){
  if(!Number.isSafeInteger(data.requestId)||data.requestId<0)return;
  const reply=(type,extra={})=>window.parent.postMessage({type,requestId:data.requestId,id:data.id,...extra},location.origin);
  if(data.type==='exhibit:close'){
    exhibitRequest=data.requestId;exhibit?.dispose();exhibit=null;
    const resumeFly=exhibitSaved?.mode==='fly';if(exhibitSaved){paused=exhibitSaved.paused;exhibitSaved=null;}
    document.body.classList.remove('exhibit-active');last=0;fit();render();if(resumeFly)navigation?.enterFly({capture:false});reply('exhibit:closed');return;
  }
  if(data.type==='exhibit:command'){if(['pause','replay','reset'].includes(data.action))exhibit?.command(data.action);return;}
  if(data.type!=='exhibit:open'||!((isMining&&data.id==='mining.conveyor-vision')||(!isMining&&data.id==='energy.intake-vision')))return;
  const request=exhibitRequest=data.requestId;
  try{
    const {createExhibit}=await import('./exhibits.js');if(request!==exhibitRequest)return;
    if(!exhibitSaved){exhibitSaved={paused,mode:navigation?.mode};navigation?.exitFly();navigation?.cancelInput();}
    exhibit?.dispose();document.body.classList.add('exhibit-active');
    exhibit=createExhibit(data.id,host,state=>reply('exhibit:state',state));last=0;render();reply('exhibit:ready');
  }catch(err){reply('exhibit:error',{message:'The close-up could not load.'});}
}
function fit(){if(!renderer||!camera)return;const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;zoom=clampZoom(zoom,w,h);targetZoom=clampZoom(targetZoom,w,h);renderer.setPixelRatio(resolutionFor(effectiveProfile,{width:w,height:h,deviceDpr:devicePixelRatio,mobile:mobileDevice,capture}));renderer.setSize(w,h);pipeline?.resize(w,h,renderer.getPixelRatio(),effectiveProfile.bloom);camera.aspect=w/h;camera.updateProjectionMatrix();if(!exhibit)positionCamera();}
function positionCamera(){if(shot){placeShotCamera();return;}if(navigation?.mode==='fly')return;const dist=orbitDistance(host.clientWidth,host.clientHeight);const direction=new THREE.Vector3(Math.sin(azimuth)*Math.cos(tilt),Math.sin(tilt),Math.cos(azimuth)*Math.cos(tilt));camera.position.copy(target).addScaledVector(direction,Math.max(MIN_ORBIT_DISTANCE,dist/zoom));camera.lookAt(target);camera.updateMatrixWorld();}
function metrics(){const gl=renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');const box=new THREE.Box3().setFromObject(world.root),xs=[],ys=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);xs.push(p.x);ys.push(p.y);}return{stage:world.stats.stage,seed:SEED,time:elapsed,paused,yaw,tilt,zoom,quality,adaptive:tuner.metrics(),effectiveQuality:effectiveProfile.name,navigation:navigation?.metrics(),viewport:[host.clientWidth,host.clientHeight],dpr:renderer.getPixelRatio(),projectedBounds:{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)},camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),target:target.toArray(),fov:camera.fov,near:camera.near,far:camera.far},renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),threeRevision:THREE.REVISION,calls:pipeline.stats.calls,triangles:pipeline.stats.triangles,postprocess:pipeline.stats.postprocessEnabled,countsNote:'calls/triangles describe main scene pass, excluding reservoir reflection, shadow and bloom passes',geometryCount:renderer.info.memory.geometries,textures:renderer.info.memory.textures,frameTimes:[...frameTimes],activity:world.activityDiagnostics?.(elapsed),infrastructure:world.infrastructureDiagnostics?.(elapsed),reflection:world.reflection?.stats,terrain:world.terrainDiagnostics?.(),sceneStats:world.stats,lab:labLayer?.diagnostics()};}
function render(){if(exhibit){exhibit.update(0);renderer.render(exhibit.scene,exhibit.camera);return;}positionCamera();navigation?.update(0);world.root.rotation.y=yaw;world.update(elapsed,0);labLayer?.update(camera);world.reflection?.render(renderer,camera,effectiveProfile.index>=3&&!mobileDevice&&!params.has('material'));pipeline.render(world.scene,camera,effectiveProfile.bloom);}
function pauseButton(){const b=document.querySelector('[data-action=pause]');b.textContent=paused?'Play':'Pause';b.setAttribute('aria-pressed',String(paused));}
// ---- Fly-through player. A shot is compiled against the live scene (see flythrough.js) and
// drives camera position, look target, fov and the turntable yaw by scene time, so playback is
// deterministic and a recorder can step it frame by frame with seek().
let shot=null,shotSaved=null,recorder=null;
function localToWorld(v){world.root.updateMatrixWorld(true);return v.clone().applyMatrix4(world.root.matrixWorld);}
function shotContext(shotYaw){
  return {
    actors:world.actors||{},
    objectPosition:name=>{const o=world.root.getObjectByName(name);if(!o)return null;const p=new THREE.Vector3();o.getWorldPosition(p);world.root.updateMatrixWorld(true);return p.applyMatrix4(world.root.matrixWorld.clone().invert()).toArray();},
    // Where the orbit camera sits for a preset at the current viewport, expressed in the turntable's frame at the shot's yaw.
    viewPosition:name=>{const v=views[name];if(!v)return null;const az=v.azimuth??Math.atan2(12,23),tl=v.tilt??openingTilt,dist=Math.max(MIN_ORBIT_DISTANCE,orbitDistance(host.clientWidth,host.clientHeight)/v.zoom);
      const p=new THREE.Vector3().fromArray(v.target).addScaledVector(new THREE.Vector3(Math.sin(az)*Math.cos(tl),Math.sin(tl),Math.cos(az)*Math.cos(tl)),dist);
      return p.applyAxisAngle(new THREE.Vector3(0,1,0),-shotYaw).toArray();},
  };
}
// Water surface height under a point, for the shot audit: lake inside the reservoir outline, river in the channel.
function waterLevel(x,z){
  const lake=world.root.getObjectByName('reservoir'),river=world.root.getObjectByName('river-surface');
  const inside=(poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;};
  if(lake&&inside(reservoirOutline))return new THREE.Box3().setFromObject(lake).max.y;
  if(river&&z>-.55&&Math.abs(x-riverCenter(z))<riverHalfWidth(z))return new THREE.Box3().setFromObject(river).max.y;
  return -Infinity;
}
function compileNamed(nameOrSpec){const spec=typeof nameOrSpec==='string'?getShot(nameOrSpec):nameOrSpec;const here=isMining?'mining':'energy';if((spec.world||'energy')!==here)throw Error(`shot ${spec.name} is for the ${spec.world||'energy'} world; this is ${here}`);return compileShot(spec,shotContext(spec.yaw||0));}
function placeShotCamera(){
  const s=shot.compiled.sample(elapsed-shot.compiled.startSceneTime);
  camera.position.copy(localToWorld(s.position));camera.lookAt(localToWorld(s.lookAt));
  if(camera.fov!==s.fov){camera.fov=s.fov;camera.updateProjectionMatrix();}
  camera.updateMatrixWorld();shot.last=s;
}
function tickShot(){const t=elapsed-shot.compiled.startSceneTime;if(t>=shot.compiled.duration){if(shot.loop)elapsed=shot.compiled.startSceneTime;else if(shot.hold){if(!shot.done){shot.done=true;if(recorder)finishRecording();shot.onEnd?.('held');}}else stopShot('finished');}}
function playShot(nameOrSpec,{loop=false,record=false,hold=false,lockQuality=false,onEnd}={}){
  stopShot('replaced');
  const compiled=compileNamed(nameOrSpec);
  navigation?.exitFly();
  shotSaved={azimuth,tilt,targetTilt,yaw,targetYaw,zoom,targetZoom,target:target.clone(),fov:camera.fov,paused,elapsed};
  shot={compiled,loop,hold,onEnd,done:false,last:null,startedAt:performance.now(),qualityBefore:lockQuality?quality:null};
  if(lockQuality&&quality!=='high')tuner.setMode('high',performance.now());
  elapsed=compiled.startSceneTime;
  const hintEl=document.querySelector('#hint');shotSaved.hint=hintEl.textContent;hintEl.textContent=`Fly-through: ${compiled.title} Â· Esc or drag to stop`;
  if(record)startRecording(compiled);
  render();
  return status();
}
function stopShot(reason='stopped'){
  if(!shot)return;const ended=shot,saved=shotSaved;shot=null;shotSaved=null;
  if(recorder)finishRecording();
  if(ended.qualityBefore&&ended.qualityBefore!=='high')tuner.setMode(ended.qualityBefore,performance.now());
  if(saved){azimuth=saved.azimuth;tilt=saved.tilt;targetTilt=saved.targetTilt;yaw=saved.yaw;targetYaw=saved.targetYaw;zoom=saved.zoom;targetZoom=saved.targetZoom;target.copy(saved.target);camera.fov=saved.fov;camera.updateProjectionMatrix();}
  if(saved?.hint!==undefined)document.querySelector('#hint').textContent=saved.hint;
  render();
  ended.onEnd?.(reason);
}
function seekShot(t){if(!shot)throw Error('no shot playing');elapsed=shot.compiled.startSceneTime+Math.max(0,Math.min(shot.compiled.duration,t));render();return status();}
function status(){if(!shot)return {playing:false};if(shot.done)return {playing:false,held:true,name:shot.compiled.name,t:shot.compiled.duration,duration:shot.compiled.duration};const t=elapsed-shot.compiled.startSceneTime,l=shot.last;return {playing:true,name:shot.compiled.name,t,duration:shot.compiled.duration,sceneTime:elapsed,segment:l?.segment,position:l?.position.toArray(),lookAt:l?.lookAt.toArray(),fov:l?.fov,recording:!!recorder};}
// In-browser recording: the canvas stream into a WebM download. Real-time, so it records what the
// device actually renders; the headless recorder (scripts/map-flythrough.mjs) is the frame-exact path.
function startRecording(compiled){
  const canvas=renderer.domElement;if(!canvas.captureStream||typeof MediaRecorder==='undefined'){console.warn('MediaRecorder unavailable');return;}
  const stream=canvas.captureStream(30),type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';
  const chunks=[];recorder=new MediaRecorder(stream,type?{mimeType:type,videoBitsPerSecond:12e6}:undefined);
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||'video/webm'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${compiled.name}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);recorder=null;};
  recorder.start(250);
}
function finishRecording(){if(recorder&&recorder.state!=='inactive')recorder.stop();else recorder=null;}
// ---- Studio mode (/map?studio=1[&shot=name]): a clean full-window frame for screen capture (OBS etc.).
// No chrome; a small panel picks the shot and starts it after a countdown, then hides with the cursor.
// Quality is pinned to high for the shot, the adaptive tuner pauses, shot time follows the wall clock,
// and the final frame holds. Space plays, Esc stops and returns, H toggles the panel.
function setupStudio(){
  document.body.classList.add('studio');
  const panel=document.createElement('div');panel.className='studio-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Fly-through studio');
  const shots=flythrough.list(),pre=params.get('shot');
  panel.innerHTML=`<p class="studio-title">Fly-through studio</p>
    <label>Shot <select id="studio-shot">${shots.map(s=>`<option value="${s.name}"${s.name===pre?' selected':''}>${s.title} Â· ${s.duration}s</option>`).join('')}</select></label>
    <label>Countdown <select id="studio-count"><option value="3" selected>3 s</option><option value="5">5 s</option><option value="0">none</option></select></label>
    <label class="studio-check"><input type="checkbox" id="studio-record"> Also save a WebM from the browser</label>
    <button id="studio-play">Play</button>
    <p class="studio-help">Start your recorder, then Play. The panel and cursor hide; the last frame holds. Space plays Â· Esc returns Â· H hides this panel.</p>`;
  const count=document.createElement('div');count.className='studio-count';count.hidden=true;
  document.querySelector('#viewer').append(panel,count);
  let timer=0;
  const showPanel=v=>{panel.hidden=!v;};
  const finish=()=>{document.body.classList.remove('studio-playing');};
  const go=()=>{
    if(shot&&!shot.done)return;clearInterval(timer);
    const name=panel.querySelector('#studio-shot').value,record=panel.querySelector('#studio-record').checked;let n=+panel.querySelector('#studio-count').value;
    showPanel(false);document.body.classList.add('studio-playing');
    // Park on the shot's first frame during the countdown so the recording opens on it, not on a jump.
    playShot(name,{hold:true,lockQuality:!params.get('quality'),onEnd:r=>{if(r!=='held')finish();}});paused=true;
    const start=()=>{count.hidden=true;if(record)startRecording(shot.compiled);last=0;paused=false;};
    if(n<=0){start();return;}
    count.hidden=false;count.textContent=n;
    timer=setInterval(()=>{n--;if(n<=0){clearInterval(timer);start();}else count.textContent=n;},1000);
  };
  panel.querySelector('#studio-play').addEventListener('click',go);
  window.addEventListener('keydown',e=>{
    if(e.target.closest?.('select'))return;
    if(e.code==='Space'){e.preventDefault();go();}
    else if(e.code==='KeyH'){showPanel(panel.hidden);}
    else if(e.code==='Escape'){clearInterval(timer);count.hidden=true;stopShot('escaped');paused=false;finish();showPanel(true);}
  });
  return {go};
}
const flythrough={
  list:()=>Object.values(SHOTS).filter(s=>(s.world||'energy')===(isMining?'mining':'energy')).map(s=>({name:s.name,title:s.title,duration:s.keys[s.keys.length-1].t})),
  play:playShot,stop:()=>stopShot('stopped'),seek:seekShot,status,
  compile:nameOrSpec=>{const c=compileNamed(nameOrSpec);return {name:c.name,duration:c.duration,startSceneTime:c.startSceneTime,yaw:c.yaw};},
  audit:(nameOrSpec,opts={})=>auditShot(compileNamed(nameOrSpec),{height:world.height,waterLevel,actors:world.actors,...opts}),
};
function setView(name){navigation?.exitFly();const v=views[name]||views.hero;camera.fov=v.fov||42;camera.updateProjectionMatrix();azimuth=v.azimuth??Math.atan2(12,23);tilt=targetTilt=v.tilt??openingTilt;yaw=targetYaw=v.yaw;zoom=targetZoom=v.zoom;target.fromArray(v.target);render();}
function reset(){azimuth=Math.atan2(12,23);targetTilt=openingTilt;target.set(0,1,0);targetYaw=0;targetZoom=1;if(matchMedia('(prefers-reduced-motion: reduce)').matches){yaw=0;zoom=1;tilt=targetTilt;}}
function animate(now){if(disposed)return;if(document.hidden||host.clientWidth<1||host.clientHeight<1){last=0;raf=requestAnimationFrame(animate);return;}const rawDt=last?(now-last)/1000:0,dt=Math.min(rawDt,shot?.25:.05);last=now;if(rawDt>0){frameTimes.push(rawDt*1000);if(frameTimes.length>2000)frameTimes.shift();}if(exhibit){exhibit.update(dt);renderer.render(exhibit.scene,exhibit.camera);raf=requestAnimationFrame(animate);return;}if(!paused){elapsed+=dt;if(!capture&&!shot&&rawDt>0)tuner.sample(rawDt*1000,now);}if(shot&&!paused)tickShot();const k=1-Math.exp(-dt*10);yaw+=(targetYaw-yaw)*k;tilt+=(targetTilt-tilt)*k;zoom+=(targetZoom-zoom)*k;navigation?.update(dt);render();raf=requestAnimationFrame(animate);}
function action(name){if(navigation?.action(name))return;if(name==='rotate-left')targetYaw-=Math.PI/8;if(name==='rotate-right')targetYaw+=Math.PI/8;if(name==='zoom-in')targetZoom=clampZoom(targetZoom*1.2,host.clientWidth,host.clientHeight);if(name==='zoom-out')targetZoom=clampZoom(targetZoom/1.2,host.clientWidth,host.clientHeight);if(name==='reset')reset();if(name==='pause'){paused=!paused;tuner.reset(performance.now());pauseButton();}if(name==='retry')location.reload();}
function key(e){if(e.target!==host||e.shiftKey||navigation?.mode==='fly')return;const map={ArrowLeft:'rotate-left',ArrowRight:'rotate-right','+':'zoom-in','=':'zoom-in','-':'zoom-out',Home:'reset',' ':'pause'};if(map[e.key]){e.preventDefault();action(map[e.key]);}}
const onResize=()=>fit(),click=e=>{const b=e.target.closest('[data-action]');if(b)action(b.dataset.action);};
function applyQualityProfile(){effectiveProfile=tuner.profile();if(!renderer||!world)return;renderer.shadowMap.enabled=effectiveProfile.shadows;const shadow=world.key.shadow;if(shadow.mapSize.x!==effectiveProfile.shadowSize){shadow.map?.dispose();shadow.map=null;shadow.mapSize.set(effectiveProfile.shadowSize,effectiveProfile.shadowSize);shadow.needsUpdate=true;}const spray=world.root.getObjectByName('spillway-droplets-and-spray');if(spray)spray.geometry.setDrawRange(0,Math.floor(world.stats.sprayParticles*effectiveProfile.spray));let mistIndex=0;world.root.traverse(o=>{if(o.name==='impact-mist')o.visible=!o.userData.diagnosticHidden&&mistIndex++<Math.ceil(42*effectiveProfile.mist);});const auto=qSelect.querySelector('option[value=auto]');if(auto)auto.textContent='Auto Â· '+effectiveProfile.name;fit();}
const onQuality=()=>{quality=qSelect.value;try{localStorage.setItem('tabletop-quality',quality);}catch{}tuner.setMode(quality,performance.now());};
const onVisibility=()=>{last=0;tuner.reset(performance.now());if(document.hidden)navigation?.cancelInput();};
let resizeObserver;
try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:capture,powerPreference:'high-performance'});renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=quality==='high';renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);pipeline=createPipeline(renderer);
  camera=new THREE.PerspectiveCamera(42,1,.1,160);world=createScene();await world.ready;
  if(params.get('experience')==='lab'){
    const {createLabLayer}=await import('./lab-layer.js');
    labLayer=createLabLayer(world,isMining?'mining':'energy',host,recipe=>{
      if(!exhibitMode){labLayer.apply({recipeId:recipe.id});setView(recipe.view);}
      if(window.parent!==window)window.parent.postMessage({type:'lab:hotspot',locationId:recipe.locationId,recipeId:recipe.id},location.origin);
    });
  }
  if(capture&&params.has('only')){const prefix={tanks:'treatment-',grid:'electrical-yard',town:'settlement-'}[params.get('only')];if(prefix)for(const o of world.root.children)if(!o.isLight&&!o.name.startsWith(prefix)){o.visible=false;o.userData.diagnosticHidden=true;}}
  if(capture&&['normal','clay'].includes(params.get('material'))){const normal=params.get('material')==='normal'?new THREE.MeshNormalMaterial():new THREE.MeshStandardMaterial({color:0x91979b,roughness:.85}),originals=[];world.root.traverse(o=>{if(o.isMesh){originals.push([o,o.material]);o.material=normal;}});const originalDispose=world.dispose;world.dispose=()=>{for(const[o,m]of originals)o.material=m;originalDispose();normal.dispose();};}
  applyQualityProfile();pauseButton();
  navigation=createNavigation({host,camera,getOrbit:()=>({target,yaw,tilt,zoom,targetZoom}),setOrbit(s){if(s.target)target.copy(s.target);if(s.azimuth!==undefined)azimuth=s.azimuth;if(s.deltaYaw)targetYaw+=s.deltaYaw;if(s.deltaTilt!==undefined)targetTilt=THREE.MathUtils.clamp(targetTilt+s.deltaTilt,-Math.PI/2+.03,Math.PI/2-.03);if(s.tilt!==undefined)targetTilt=s.tilt;if(s.yaw!==undefined)targetYaw=s.yaw;if(s.zoom!==undefined)targetZoom=clampZoom(s.zoom,host.clientWidth,host.clientHeight);if(s.immediate){yaw=targetYaw;zoom=targetZoom;tilt=targetTilt;}},resetOrbit:reset,onChange({mode,tool,locked}){
    const flying=mode==='fly',fly=document.querySelector('[data-action=fly]');fly.textContent=flying?'Exit fly':'Fly';fly.setAttribute('aria-pressed',String(flying));document.querySelector('[data-action=pan]').setAttribute('aria-pressed',String(tool==='pan'));document.querySelector('[data-action=mouse-look]').hidden=!flying||locked;
    document.body.classList.toggle('flying',flying);document.querySelector('#hint').textContent=flying?'WASD move Â· Q/E down/up Â· Shift faster Â· '+(locked?'Mouse look':'Drag to look')+' Â· Esc return':(tool==='pan'?'Drag to pan':'Drag rotate/tilt Â· Shift/right-drag pan')+' Â· Alt-drag crane Â· Scroll zoom';
    if(document.body.classList.contains('touch-ui')){document.querySelector('[data-action=mouse-look]').hidden=true;document.querySelector('#hint').textContent=flying?'Hold arrows to move Â· Drag to look Â· â†‘/â†“ height':(tool==='pan'?'Drag to pan':'One finger: rotate / tilt')+' Â· Two fingers: pan / pinch zoom';}
    document.querySelector('#navigation-status').textContent=flying?'Fly mode. WASD moves, Q and E change height. Escape returns to tabletop.':'Tabletop mode';
  }});
  host.addEventListener('keydown',key);window.addEventListener('resize',onResize);document.addEventListener('click',click);qSelect.addEventListener('change',onQuality);document.addEventListener('visibilitychange',onVisibility);resizeObserver=new ResizeObserver(fit);resizeObserver.observe(host);window.visualViewport?.addEventListener('resize',onResize);
  const onWorldFocus=e=>{if(e.origin!==location.origin||e.source!==window.parent)return;
    if(exhibitMode&&e.data?.type?.startsWith('exhibit:')){handleExhibit(e.data);return;}
    if(e.data?.type==='worlds:focus'&&Object.hasOwn(views,e.data.view))setView(e.data.view);if(labLayer&&e.data?.type==='lab:conditions'){labLayer.apply(e.data.conditions);render();window.parent.postMessage({type:'lab:applied',state:labLayer.diagnostics()},location.origin);}};
  window.addEventListener('message',onWorldFocus);
  const dispose=()=>{if(disposed)return;disposed=true;window.removeEventListener('message',onWorldFocus);cancelAnimationFrame(raf);exhibit?.dispose();navigation.dispose();host.removeEventListener('keydown',key);window.removeEventListener('resize',onResize);document.removeEventListener('click',click);qSelect.removeEventListener('change',onQuality);document.removeEventListener('visibilitychange',onVisibility);resizeObserver?.disconnect();window.visualViewport?.removeEventListener('resize',onResize);labLayer?.dispose();pipeline.dispose();world.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  window.addEventListener('pagehide',dispose,{once:true});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  host.addEventListener('pointerdown',()=>{if(shot)stopShot('grabbed');},true);
  window.addEventListener('keydown',e=>{if(shot&&e.code==='Escape'){e.preventDefault();stopShot('escaped');}},true);
  window.__tabletop={ready:false,flythrough,exhibit:{metrics:()=>exhibit?.metrics()||null,setTime:t=>{exhibit?.setTime(t);render();}},setLabState:s=>labLayer?.apply(s),setState(s={}){if(s.view)setView(s.view);if(s.timeSeconds!==undefined)elapsed=s.timeSeconds;if(s.paused!==undefined)paused=s.paused;if(s.yaw!==undefined)yaw=targetYaw=s.yaw;if(s.zoom!==undefined)zoom=targetZoom=clampZoom(s.zoom,host.clientWidth,host.clientHeight);if(s.quality){quality=s.quality;qSelect.value=quality;onQuality();}pauseButton();render();return metrics();},metrics,auditHydro:()=>world.hydroDiagnostics?.(),auditInfrastructure:()=>isMining?world.audit():auditInfrastructure(world),auditGeometry:()=>auditGeometry(world.root),auditLandmarks:()=>isMining?world.audit():auditLandmarks(world),clearFrameTimes(){frameTimes=[];},reset(){navigation.reset();yaw=targetYaw;zoom=targetZoom;tilt=targetTilt;render();},dispose};
  renderer.compile(world.scene,camera);setView(params.get('view')||'hero');loading.hidden=true;window.__tabletop.ready=true;if(labLayer&&window.parent!==window)window.parent.postMessage({type:'lab:ready',industry:isMining?'mining':'energy'},location.origin);raf=requestAnimationFrame(animate);
  if(params.get('studio')==='1')setupStudio();
  else if(params.get('shot')){try{playShot(params.get('shot'),{loop:params.get('loop')==='1',record:params.get('record')==='1'});}catch(e){console.error(e);}}
}catch(e){navigation?.dispose();loading.hidden=true;error.hidden=false;document.querySelector('#error-message').textContent='WebGL is unavailable or a scene asset could not load. Check your connection and browser hardware acceleration, then try again.';world?.dispose();pipeline?.dispose();renderer?.dispose();renderer?.forceContextLoss();console.error(e);document.addEventListener('click',click);}
