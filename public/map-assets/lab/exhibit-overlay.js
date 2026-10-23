import * as THREE from 'three';

// The "AI sees" layer: one outline box, one 2-4 word label, one scan sweep, and the camera-view frame.
// DOM over the canvas, projected like hotspot-layer.js. Never more than one box: there is only one element.
export const OVERLAY_COLOURS={neutral:'#d9f4ff',noticed:'#ffb02e',review:'#ff4b3e',unclear:'#a4aeb6'};

const box3=new THREE.Box3(),tmp=new THREE.Box3(),corner=new THREE.Vector3();
// Bounds of an anchor object including hidden parts, so a zone or a not-yet-grown subject still has a size.
export function anchorBounds(object){
  box3.makeEmpty();object.updateWorldMatrix(true,true);
  object.traverse(o=>{if(!o.geometry)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);box3.union(tmp);});
  if(box3.isEmpty())box3.setFromCenterAndSize(object.getWorldPosition(corner),new THREE.Vector3(.01,.01,.01));
  return box3;
}
// Projected rectangle in CSS pixels, or null when the object is behind the camera.
export function projectRect(object,camera,width,height){
  const b=anchorBounds(object);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(let i=0;i<8;i++){corner.set(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(camera.matrixWorldInverse);if(corner.z>-camera.near)return null;corner.applyMatrix4(camera.projectionMatrix);
    minX=Math.min(minX,corner.x);maxX=Math.max(maxX,corner.x);minY=Math.min(minY,corner.y);maxY=Math.max(maxY,corner.y);}
  return{left:(minX*.5+.5)*width,right:(maxX*.5+.5)*width,top:(-maxY*.5+.5)*height,bottom:(-minY*.5+.5)*height};
}

export function createOverlay(host){
  const layer=document.createElement('div');layer.className='exhibit-overlay';layer.setAttribute('aria-hidden','true');
  layer.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden;font:600 12px/1.2 Arial,Helvetica,sans-serif';
  const frame=document.createElement('div');
  frame.style.cssText='position:absolute;inset:0;display:none;box-shadow:inset 0 0 90px 10px #000a;background:repeating-linear-gradient(0deg,#ffffff06 0 1px,transparent 1px 3px)';
  for(const [v,h] of [['top','left'],['top','right'],['bottom','left'],['bottom','right']]){const c=document.createElement('i');c.style.cssText=`position:absolute;${v}:14px;${h}:14px;width:26px;height:26px;border-${v}:2px solid #ffffffb0;border-${h}:2px solid #ffffffb0`;frame.appendChild(c);}
  const tag=document.createElement('div');tag.style.cssText='position:absolute;left:50%;top:14px;transform:translateX(-50%);background:#000c;color:#fff;border:1px solid #ffffff55;border-radius:3px;padding:5px 9px;letter-spacing:.06em;text-transform:uppercase;font-size:11px;white-space:nowrap';
  const dot=document.createElement('b');dot.style.cssText='display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff4b3e;margin-right:7px;vertical-align:1px';
  const tagText=document.createElement('span');tag.append(dot,tagText);frame.appendChild(tag);
  // Embedded in a host page, the host draws the camera-view tag (with Back to scene) next to its caption, so skip ours.
  if(new URLSearchParams(location.search).has('embed'))tag.style.display='none';
  const box=document.createElement('div');box.style.cssText='position:absolute;display:none;border:2px solid;border-radius:3px;box-sizing:border-box';
  const sweep=document.createElement('div');sweep.style.cssText='position:absolute;left:-2px;right:-2px;height:3px;display:none';box.appendChild(sweep);
  const label=document.createElement('div');label.style.cssText='position:absolute;display:none;white-space:nowrap;padding:5px 8px;border-radius:3px;color:#081018;font-size:12px;letter-spacing:.01em';
  layer.append(frame,box,label);host.appendChild(layer);
  let last={};
  // spec: {rect:{left,right,top,bottom}|null, label, state, sweep:0..1|null, camera:{active,label}}
  function update(spec){
    const w=host.clientWidth,h=host.clientHeight;
    frame.style.display=spec.camera?.active?'block':'none';
    if(spec.camera?.active&&tagText.textContent!==spec.camera.label)tagText.textContent=spec.camera.label;
    const r=spec.rect;
    if(!r||!spec.label){box.style.display=label.style.display='none';last={};return;}
    const pad=8,left=Math.max(4,r.left-pad),top=Math.max(4,r.top-pad),right=Math.min(w-4,r.right+pad),bottom=Math.min(h-4,r.bottom+pad);
    if(right-left<6||bottom-top<6){box.style.display=label.style.display='none';return;}
    const colour=OVERLAY_COLOURS[spec.state]||OVERLAY_COLOURS.neutral;
    Object.assign(box.style,{display:'block',left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px',borderColor:colour,boxShadow:`0 0 0 1px #0008, 0 0 18px ${colour}66, inset 0 0 0 1px #0006`,background:spec.state==='unclear'?'#a4aeb614':'transparent'});
    if(spec.sweep!=null&&spec.sweep>=0&&spec.sweep<=1){Object.assign(sweep.style,{display:'block',top:(spec.sweep*100)+'%',background:`linear-gradient(${colour},${colour})`,boxShadow:`0 0 14px 4px ${colour}aa`});}else sweep.style.display='none';
    if(label.textContent!==spec.label)label.textContent=spec.label;
    label.style.display='block';label.style.background=colour;
    const lw=label.offsetWidth||spec.label.length*7+16,lh=label.offsetHeight||24;
    const lx=Math.min(Math.max(4,left),w-lw-4),ly=top-lh-4>=4?top-lh-4:Math.min(h-lh-4,bottom+4);
    label.style.left=lx+'px';label.style.top=ly+'px';
    last={left,top,right,bottom,state:spec.state,label:spec.label};
  }
  return{update,get state(){return last;},dispose(){layer.remove();}};
}
