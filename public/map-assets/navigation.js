import * as THREE from 'three';
import {clampZoom,orbitDistance} from './camera-limits.js';

/** Camera navigation is independent of decorative scene time. */
export function createNavigation({host,camera,getOrbit,setOrbit,resetOrbit,onChange,captureOnFly=true}) {
  let mode='tabletop',tool='rotate',drag=null,flyYaw=0,flyPitch=0,speed=4,lockedBefore=false,disposed=false;
  let flightLimit=35,ceiling=25,touchInput=matchMedia('(pointer:coarse)').matches;
  const touches=new Map(),held=new Map();let gesture=null;
  const active=(code,name)=>keys.has(code)||[...held.values()].some(h=>h.name===name);
  const keys=new Set(),flyPosition=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),forward=new THREE.Vector3(),motion=new THREE.Vector3();
  const euler=new THREE.Euler(0,0,0,'YXZ');
  const editable=e=>e.target?.matches?.('input,textarea,select,[contenteditable=true]');
  function notify(){onChange({mode,tool,speed,locked:document.pointerLockElement===host});}
  function clearHeld(){for(const [id,h]of held){h.button.setAttribute('aria-pressed','false');if(h.button.hasPointerCapture(id))h.button.releasePointerCapture(id);}held.clear();}
  function release(){const ids=[...touches.keys()];touches.clear();gesture=null;const previous=drag;drag=null;for(const id of ids)if(host.hasPointerCapture(id))host.releasePointerCapture(id);if(previous&&host.hasPointerCapture(previous.id))host.releasePointerCapture(previous.id);clearHeld();host.classList.remove('dragging');}
  function limitTarget(target){const current=getOrbit().target;for(const [axis,low,high]of [['x',-14,14],['z',-14,14],['y',-2,12]])target[axis]=THREE.MathUtils.clamp(target[axis],Math.min(low,current[axis]),Math.max(high,current[axis]));}
  function pan(dx,dy){const orbit=getOrbit();camera.updateMatrixWorld();const units=2*camera.position.distanceTo(orbit.target)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/host.clientHeight;right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);const target=orbit.target.clone().addScaledVector(right,-dx*units).addScaledVector(up,dy*units);limitTarget(target);setOrbit({target});}
  function crane(amount){if(mode==='fly'){flyPosition.y=THREE.MathUtils.clamp(flyPosition.y+amount,.18,ceiling);}else{const target=getOrbit().target.clone();target.y+=amount;limitTarget(target);setOrbit({target});}}
  function look(dx,dy){flyYaw-=dx*.0024;flyPitch=THREE.MathUtils.clamp(flyPitch-dy*.0024,-Math.PI/2+.03,Math.PI/2-.03);}
  function requestLook(){if(mode!=='fly'||disposed||touchInput)return;try{const request=host.requestPointerLock?.();request?.catch(()=>notify());}catch{notify();}}
  function enterFly({capture=captureOnFly}={}){if(mode==='fly')return;release();keys.clear();const orbit=getOrbit();setOrbit({yaw:orbit.yaw,zoom:orbit.zoom,immediate:true});flyPosition.copy(camera.position);flightLimit=Math.max(35,Math.abs(flyPosition.x)+5,Math.abs(flyPosition.z)+5);ceiling=Math.max(25,flyPosition.y+5);euler.setFromQuaternion(camera.quaternion,'YXZ');flyYaw=euler.y;flyPitch=euler.x;lockedBefore=false;mode='fly';host.focus({preventScroll:true});notify();if(capture)requestLook();}
  function exitFly(preserveView=true){
    if(mode!=='fly')return;
    // Rebase orbit around a point on the current sightline. The turntable yaw is
    // independent of camera azimuth; retaining it keeps every world feature fixed.
    if(preserveView){
      const orbit=getOrbit(),base=orbitDistance(host.clientWidth,host.clientHeight);
      const zoom=clampZoom(base/Math.max(3,camera.position.distanceTo(orbit.target)),host.clientWidth,host.clientHeight);
      camera.getWorldDirection(forward);
      const target=camera.position.clone().addScaledVector(forward,base/zoom);
      setOrbit({target,azimuth:Math.atan2(-forward.x,-forward.z),tilt:Math.asin(THREE.MathUtils.clamp(-forward.y,-1,1)),yaw:orbit.yaw,zoom,immediate:true});
    }
    mode='tabletop';keys.clear();release();if(document.pointerLockElement===host)document.exitPointerLock();lockedBefore=false;notify();
  }
  function reset(){exitFly(false);keys.clear();resetOrbit();tool='rotate';notify();}
  function action(name){
    if(name==='fly'){mode==='fly'?exitFly():enterFly();return true;}
    if(name==='mouse-look'){requestLook();return true;}
    if(name==='pan'){if(mode==='fly')exitFly();tool=tool==='pan'?'rotate':'pan';notify();return true;}
    if(name==='crane-up'||name==='crane-down'){crane(name==='crane-up'?.5:-.5);return true;}
    if(name==='reset'){reset();return true;}
    if(mode==='fly'&&['rotate-left','rotate-right','zoom-in','zoom-out'].includes(name)){
      if(name==='rotate-left')flyYaw+=Math.PI/8;if(name==='rotate-right')flyYaw-=Math.PI/8;
      if(name==='zoom-in'||name==='zoom-out'){camera.getWorldDirection(forward);flyPosition.addScaledVector(forward,name==='zoom-in'?1:-1);}return true;
    }return false;
  }
  function kind(e){return mode==='fly'?'look':e.altKey?'crane':e.shiftKey||e.button!==0||tool==='pan'?'pan':'rotate';}
  function pair(){const [a,b]=[...touches.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y))};}
  function down(e){if(e.button!==0&&e.button!==1&&e.button!==2)return;host.focus({preventScroll:true});if(mode==='fly'&&document.pointerLockElement===host)return;
    if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size>1){drag=null;gesture=pair();}else drag={id:e.pointerId,x:e.clientX,y:e.clientY,kind:kind(e)};}
    else drag={id:e.pointerId,x:e.clientX,y:e.clientY,kind:kind(e)};
    host.setPointerCapture(e.pointerId);host.classList.add('dragging');e.preventDefault();}
  function move(e){
    if(touches.has(e.pointerId)){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size>1){const p=pair(),old=gesture||p,dx=p.x-old.x,dy=p.y-old.y,ratio=p.d/old.d;gesture=p;
      if(mode==='fly'){camera.getWorldDirection(forward);right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);flyPosition.addScaledVector(forward,Math.log(ratio)*5).addScaledVector(right,-dx*.02).addScaledVector(up,dy*.02);}
      else{pan(dx,dy);setOrbit({zoom:clampZoom(getOrbit().targetZoom*ratio,host.clientWidth,host.clientHeight)});}e.preventDefault();return;}}
    if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;if(drag.kind==='look')look(dx,dy);if(drag.kind==='pan')pan(dx,dy);if(drag.kind==='crane')crane(-dy*.025);if(drag.kind==='rotate')setOrbit({deltaYaw:dx*.006,deltaTilt:dy*.004});}
  function end(e){if(touches.has(e.pointerId)){touches.delete(e.pointerId);if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);gesture=touches.size>1?pair():null;if(touches.size===1){const [id,p]=[...touches.entries()][0];drag={id,x:p.x,y:p.y,kind:mode==='fly'?'look':tool==='pan'?'pan':'rotate'};}else drag=null;if(!touches.size)host.classList.remove('dragging');return;}if(drag?.id===e.pointerId){drag=null;host.classList.remove('dragging');if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);}}
  function inputKind(e){const next=e.pointerType==='touch';if(next!==touchInput){touchInput=next;if(!next)clearHeld();document.body.classList.toggle('touch-ui',next);notify();}}
  function movementDown(e){const button=e.target.closest?.('[data-move]');if(!button||mode!=='fly')return;e.preventDefault();button.setPointerCapture(e.pointerId);button.setAttribute('aria-pressed','true');held.set(e.pointerId,{name:button.dataset.move,button});}
  function movementEnd(e){const h=held.get(e.pointerId);if(!h)return;held.delete(e.pointerId);h.button.setAttribute('aria-pressed','false');if(h.button.hasPointerCapture(e.pointerId))h.button.releasePointerCapture(e.pointerId);}
  function movementClick(e){if(e.detail!==0||mode!=='fly')return;const button=e.target.closest?.('[data-move]');if(!button)return;camera.getWorldDirection(forward);right.setFromMatrixColumn(camera.matrixWorld,0);const name=button.dataset.move;if(name==='forward'||name==='back')flyPosition.addScaledVector(forward,name==='forward'?.4:-.4);if(name==='left'||name==='right')flyPosition.addScaledVector(right,name==='right'?.4:-.4);if(name==='up'||name==='down')crane(name==='up'?.4:-.4);}
  function wheel(e){e.preventDefault();if(mode==='fly'){speed=THREE.MathUtils.clamp(speed*Math.exp(-e.deltaY*.001),.5,12);notify();}else if(e.shiftKey){crane(-e.deltaY*.004);}else{setOrbit({zoom:clampZoom(getOrbit().targetZoom*Math.exp(-e.deltaY*.001),host.clientWidth,host.clientHeight)});}}
  function keydown(e){if(editable(e))return;if(mode==='fly'){
      if(e.code==='Escape'){e.preventDefault();exitFly();return;}if(e.code==='Home'){e.preventDefault();reset();return;}
      if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight','AltLeft','AltRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
    }else if(e.target===host){if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();crane(e.key==='PageUp'?.5:-.5);}else if(e.shiftKey&&e.key.startsWith('Arrow')){e.preventDefault();pan(e.key==='ArrowLeft'?35:e.key==='ArrowRight'?-35:0,e.key==='ArrowUp'?35:e.key==='ArrowDown'?-35:0);}else if(e.code==='KeyF'){e.preventDefault();enterFly();}}
  }
  function keyup(e){keys.delete(e.code);}
  function mousemove(e){if(mode==='fly'&&document.pointerLockElement===host)look(e.movementX,e.movementY);}
  function pointerlockchange(){if(mode!=='fly')return;if(document.pointerLockElement===host){lockedBefore=true;notify();}else if(lockedBefore)exitFly();else notify();}
  function blur(){keys.clear();release();}
  function contextmenu(e){e.preventDefault();}
  function pointerlockerror(){notify();}
  host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);host.addEventListener('lostpointercapture',end);host.addEventListener('wheel',wheel,{passive:false});host.addEventListener('contextmenu',contextmenu);
  document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);document.addEventListener('mousemove',mousemove);document.addEventListener('pointerlockchange',pointerlockchange);document.addEventListener('pointerlockerror',pointerlockerror);window.addEventListener('blur',blur);
  document.addEventListener('pointerdown',inputKind,true);document.addEventListener('pointerdown',movementDown);document.addEventListener('pointerup',movementEnd);document.addEventListener('pointercancel',movementEnd);document.addEventListener('lostpointercapture',movementEnd);document.addEventListener('click',movementClick);
  notify();
  return {
    action,enterFly,exitFly,reset,cancelInput:blur,
    get mode(){return mode;},
    metrics(){return{mode,tool,speed,pointerLocked:document.pointerLockElement===host,touchPointers:touches.size,heldMoves:held.size,flyPosition:flyPosition.toArray()};},
    update(dt){if(mode!=='fly')return;camera.quaternion.setFromEuler(euler.set(flyPitch,flyYaw,0));forward.set(0,0,-1).applyQuaternion(camera.quaternion);right.set(1,0,0).applyQuaternion(camera.quaternion);motion.set(0,0,0).addScaledVector(forward,Number(active('KeyW','forward'))-Number(active('KeyS','back'))).addScaledVector(right,Number(active('KeyD','right'))-Number(active('KeyA','left')));motion.y+=Number(active('KeyE','up'))-Number(active('KeyQ','down'));if(motion.lengthSq()>0){const fast=keys.has('ShiftLeft')||keys.has('ShiftRight'),slow=keys.has('AltLeft')||keys.has('AltRight');flyPosition.addScaledVector(motion.normalize(),speed*(fast?3:slow ? .25 : 1)*dt);}flyPosition.x=THREE.MathUtils.clamp(flyPosition.x,-flightLimit,flightLimit);flyPosition.z=THREE.MathUtils.clamp(flyPosition.z,-flightLimit,flightLimit);flyPosition.y=THREE.MathUtils.clamp(flyPosition.y,.18,ceiling);camera.position.copy(flyPosition);camera.updateMatrixWorld();},
    dispose(){disposed=true;exitFly(false);host.removeEventListener('pointerdown',down);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',end);host.removeEventListener('pointercancel',end);host.removeEventListener('lostpointercapture',end);host.removeEventListener('wheel',wheel);host.removeEventListener('contextmenu',contextmenu);document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);document.removeEventListener('mousemove',mousemove);document.removeEventListener('pointerlockchange',pointerlockchange);document.removeEventListener('pointerlockerror',pointerlockerror);window.removeEventListener('blur',blur);document.removeEventListener('pointerdown',inputKind,true);document.removeEventListener('pointerdown',movementDown);document.removeEventListener('pointerup',movementEnd);document.removeEventListener('pointercancel',movementEnd);document.removeEventListener('lostpointercapture',movementEnd);document.removeEventListener('click',movementClick);keys.clear();}
  };
}
