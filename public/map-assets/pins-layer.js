// Location pins ("digital pins"): DOM buttons projected from miniature-local anchors each frame, in the
// AI Lab hotspot's visual family but a tier quieter. Visibility follows camera distance (group pins
// from mid range, the rest up close, the selected pin always), labels never overlap (selected first,
// then nearest), and a throttled raycast dims pins hidden behind terrain or buildings.
import * as THREE from 'three';
import {PINS} from './pins.js';

export const PIN_RANGE={group:28,all:16}; // camera-to-pin distance, world units
const OCCLUDERS={energy:n=>n==='terrain'||n==='plinth'||n.startsWith('settlement-')||n.startsWith('treatment-static'),
  mining:n=>n==='mining-open-pit'||n==='mining-island-skirt'||n.startsWith('mining-processing')||n.startsWith('mining-workshop')};

export function createPinsLayer(world,worldId,host,{onSelect}={}){
  const pins=(PINS[worldId]||[]).map(p=>({...p,anchor:new THREE.Vector3(...p.anchor),world:new THREE.Vector3(),occluded:false,shown:false}));
  const box=document.createElement('div');box.className='loc-pins';box.setAttribute('role','list');box.setAttribute('aria-label','Locations');
  for(const p of pins){
    const b=document.createElement('button');b.type='button';b.className='loc-pin';b.dataset.loc=p.id;b.dataset.view=p.view;b.setAttribute('role','listitem');b.setAttribute('aria-label','Fly to '+p.label);
    const label=document.createElement('span');label.className='loc-pin-label';label.textContent=p.label;
    const stem=document.createElement('span');stem.className='loc-pin-stem';
    const dot=document.createElement('span');dot.className='loc-pin-dot';
    b.append(label,stem,dot);
    b.addEventListener('pointerdown',e=>e.stopPropagation());
    b.addEventListener('click',e=>{e.stopPropagation();select(p.id);onSelect?.(p);});
    box.append(b);p.el=b;p.labelEl=label;
  }
  host.append(box);
  let visible=true,suppressed=false,selected=null,cursor=0,lastRay=0;
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector3(),dir=new THREE.Vector3();
  let occluders=null;
  const occluderList=()=>{if(!occluders){occluders=[];const test=OCCLUDERS[worldId]||(()=>false);world.root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&test(o.name||''))occluders.push(o);});}return occluders;};
  function select(id){selected=id;for(const p of pins)p.el.classList.toggle('selected',p.id===id);}
  function selectView(view){const p=pins.find(q=>q.view===view);select(p?p.id:null);}
  // rangeScale stretches the ranges with the viewport's orbit distance: a phone's camera sits ~2.6x farther
  // away for the same framing, so tiers follow what is on screen, not raw distance.
  function update(camera,{coarse=false,rangeScale=1,now=performance.now()}={}){
    const on=visible&&!suppressed;box.hidden=!on;if(!on)return;
    world.root.updateMatrixWorld();
    const W=host.clientWidth,H=host.clientHeight;
    // One occlusion ray per frame, at most every 60 ms, round-robin over the pins.
    if(pins.length&&now-lastRay>60){lastRay=now;const p=pins[cursor++%pins.length];p.world.copy(p.anchor).applyMatrix4(world.root.matrixWorld);
      const d=camera.position.distanceTo(p.world);dir.copy(p.world).sub(camera.position).normalize();ray.set(camera.position,dir);ray.far=d-.3;
      p.occluded=ray.intersectObjects(occluderList(),false).length>0;}
    const cands=[];
    for(const p of pins){
      p.world.copy(p.anchor).applyMatrix4(world.root.matrixWorld);
      const dist=camera.position.distanceTo(p.world);ndc.copy(p.world).project(camera);
      const onScreen=ndc.z>-1&&ndc.z<1&&Math.abs(ndc.x)<.97&&Math.abs(ndc.y)<.94;
      const range=(p.group?PIN_RANGE.group:PIN_RANGE.all)*rangeScale,isSel=p.id===selected;
      const fade=isSel?1:THREE.MathUtils.clamp((range-dist)/(range*.15),0,1);
      if(!onScreen||fade<=0){p.el.hidden=true;p.shown=false;continue;}
      cands.push({p,dist,fade,x:(ndc.x+1)/2*W,y:(1-ndc.y)/2*H,isSel});
    }
    cands.sort((a,b)=>(b.isSel-a.isSel)||(a.dist-b.dist));
    const kept=coarse?cands.filter((c,i)=>c.isSel||i<6):cands,placed=[];
    for(const c of cands)if(!kept.includes(c)){c.p.el.hidden=true;c.p.shown=false;}
    for(const c of kept){
      const {p}=c;p.el.hidden=false;p.shown=true;
      p.el.style.transform=`translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px) translate(-50%,-100%)`;
      p.el.style.opacity=String(c.fade);
      p.el.classList.toggle('occluded',p.occluded&&!c.isSel);
      const w=p.labelEl.offsetWidth||60,h=26,top=c.y-h-22,rect=[c.x-w/2,top,c.x+w/2,top+h];
      const clash=placed.some(r=>rect[0]<r[2]+6&&rect[2]>r[0]-6&&rect[1]<r[3]+4&&rect[3]>r[1]-4)||(coarse&&!c.isSel&&c.dist>PIN_RANGE.all*rangeScale*.75);
      p.el.classList.toggle('no-label',clash);if(!clash)placed.push(rect);
    }
  }
  return {
    update,select,selectView,
    setVisible(v){visible=!!v;if(!visible)box.hidden=true;},
    setSuppressed(v){suppressed=!!v;},
    get visible(){return visible;},
    diagnostics:()=>({visible,suppressed,selected,pins:pins.map(p=>({id:p.id,shown:p.shown&&!p.el.hidden,label:!p.el.classList.contains('no-label'),occluded:p.occluded,selected:p.id===selected}))}),
    dispose(){box.remove();},
  };
}
