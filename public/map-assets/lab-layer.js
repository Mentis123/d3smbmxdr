import * as THREE from 'three';
import {LAB_LOCATIONS} from './lab-locations.js';

// Experience-only, fictional observation geometry. No detector or control API.
export function createLabLayer(world, industry, host, onSelect) {
  const mining=industry==='mining', recipes=LAB_LOCATIONS[industry]||[];
  if(!recipes.length)return{apply(){return{};},update(){},diagnostics(){return{};},dispose(){}};
  // The illustrated debris, cover and ring anchor belong to the energy intake and mining conveyor; other worlds get the ring only.
  const illustrated=industry==='energy'||mining;
  let active=recipes[0];
  const anchor=new THREE.Vector3(...(mining?[4.82,3.42,-3.12]:[-4.4,1.8,-1.02]));
  const group=new THREE.Group();group.name='ai-lab-observation';world.root.add(group);
  const material=new THREE.MeshStandardMaterial({color:mining?0x8e704d:0x675237,roughness:.98});
  const issue=new THREE.Group();issue.name=mining?'illustrated-conveyor-spillage':'illustrated-intake-debris';group.add(issue);
  for(let i=0;i<18;i++) {
    const geometry=mining?new THREE.DodecahedronGeometry(.045+(i%3)*.012,0):new THREE.CylinderGeometry(.025,.035,.28+(i%4)*.06,6);
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.copy(anchor).add(new THREE.Vector3(Math.sin(i*2.4)*.31,mining?-.30+(i%3)*.035:.025,Math.cos(i*1.7)*.26));
    mesh.rotation.set(mining?i*.41:Math.PI/2,i*.72,i*.29);mesh.castShadow=true;issue.add(mesh);
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(mining?.48:.63,.018,6,48),new THREE.MeshBasicMaterial({color:0x00aeff,toneMapped:false}));
  ring.name='ai-lab-location-ring';ring.rotation.x=-Math.PI/2;ring.position.copy(anchor);ring.position.y+=.10;group.add(ring);
  const cover=new THREE.Mesh(new THREE.SphereGeometry(.55,12,8),new THREE.MeshBasicMaterial({color:0x7c8590,transparent:true,opacity:.72,depthWrite:false}));
  cover.name='illustrated-occlusion';cover.scale.set(1,.35,.8);cover.position.copy(anchor);cover.position.y+=.20;group.add(cover);
  const markers=recipes.map(recipe=>{
    const marker=document.createElement('button');marker.className='lab-hotspot';marker.type='button';marker.textContent='◉ '+recipe.label;marker.dataset.recipe=recipe.id;marker.setAttribute('aria-label','Open '+recipe.label+' demonstration');
    marker.style.cssText='position:absolute;z-index:4;left:0;top:0;transform:translate(-50%,-100%);border:1px solid #78dcff;background:#000025ed;color:#fff;border-radius:20px;padding:9px 13px;min-height:44px;font:600 12px Arial,sans-serif;white-space:nowrap;box-shadow:0 0 24px #00aeff35';
    marker.addEventListener('pointerdown',e=>e.stopPropagation());marker.addEventListener('click',()=>onSelect(recipe));host.appendChild(marker);const width=Math.max(host.clientWidth<480?96:130,recipe.label.length*7+38);marker.style.width=width+'px';return{recipe,marker,width};
  });
  const keyIntensity=world.key.intensity;
  let state={lighting:'day',occlusion:false,connected:true,condition:true};
  function apply(input={}) {
    input=input&&typeof input==='object'?input:{};
    if(recipes.some(r=>r.id===input.recipeId))active=recipes.find(r=>r.id===input.recipeId);
    state={recipeId:active.id,drawingScan:['clear','poor','missing'].includes(input.drawingScan)?input.drawingScan:'clear',drawingRotated:input.drawingRotated===true,alarmCase:['baseline','maintenance','sensor','stale'].includes(input.alarmCase)?input.alarmCase:'baseline',historianCase:['normal','sensor','network','shutdown'].includes(input.historianCase)?input.historianCase:'normal',procedureMode:['approved','draft','conflict','offline','removed'].includes(input.procedureMode)?input.procedureMode:'approved',lighting:input.lighting==='low'?'low':'day',occlusion:input.occlusion===true,connected:input.connected!==false,condition:input.condition!==false};
    const vision=active.kind==='vision';
    issue.visible=illustrated&&vision&&state.condition;cover.visible=illustrated&&vision&&state.occlusion;world.key.intensity=keyIntensity*(vision&&state.lighting==='low'?.28:1);
    ring.position.fromArray(active.anchor);ring.position.y=illustrated?active.anchor[1]+.1:(world.height?.()??0)+.03;
    world.setIllustratedConveyorRunning?.(active.kind!=='historian'||state.historianCase!=='shutdown');
    for(const {recipe,marker}of markers)marker.setAttribute('aria-pressed',String(recipe.id===active.id));
    ring.material.color.set((active.kind==='alarm'&&['sensor','stale'].includes(state.alarmCase))||(active.kind==='drawing'&&(state.drawingScan!=='clear'||!state.connected))||state.occlusion||state.lighting==='low'?0xffc875:state.condition?0x00aeff:0x78dcff);
    return diagnostics();
  }
  const projected=new THREE.Vector3();
  function update(camera) {
    group.updateWorldMatrix(true,false);const placed=[];
    // Prefer the selected label when projected labels overlap; chooser remains accessible.
    const ordered=[...markers].sort((a,b)=>Number(b.recipe.id===active.id)-Number(a.recipe.id===active.id));
    for(const {recipe,marker,width}of ordered){
      projected.fromArray(recipe.anchor);projected.y+=.65;world.root.localToWorld(projected);projected.project(camera);
      // A marker whose anchor is on screen is never dropped for space (30 Oct 2026: on a phone-sized AI Lab canvas the
      // third marker vanished, e.g. "Speakers"): it is clamped inside the edges and, if it would cover a marker already
      // placed, it steps up or down a row until it fits. Only an anchor behind the camera or well off screen hides it.
      const W=host.clientWidth,H=host.clientHeight,ax=(projected.x*.5+.5)*W,ay=(-projected.y*.5+.5)*H;
      const offscreen=projected.z>1||projected.z< -1||Math.abs(projected.x)>1.02||Math.abs(projected.y)>.98;
      const clampX=v=>Math.min(Math.max(v,width/2+8),W-width/2-8);let x=clampX(ax),y=null;
      const tries=[[0,0],[0,-54],[0,54],[width+12,0],[-width-12,0],[0,-108],[0,108],[width+12,-54],[-width-12,-54]];
      for(const [dx,dy] of tries){const cx=clampX(ax+dx),cy=ay+dy;if(cy<48||cy>H-4)continue;if(!placed.some(p=>Math.abs(p.x-cx)<(p.width+width)/2+8&&Math.abs(p.y-cy)<52)){x=cx;y=cy;break;}}
      marker.hidden=offscreen||y===null||W<width+16;
      marker.style.left=x+'px';marker.style.top=(y??ay)+'px';if(!marker.hidden)placed.push({x,y,width});
    }
  }
  function diagnostics(){return{locationId:active.locationId,recipeId:active.id,industry,...state,recipes:recipes.map(r=>({id:r.id,locationId:r.locationId,view:r.view})),issueVisible:issue.visible,occlusionVisible:cover.visible,keyIntensity:world.key.intensity,issuePieces:issue.children.length,simulation:true,inference:false,controlConnected:false};}
  apply();
  return{apply,update,diagnostics,dispose(){markers.forEach(({marker})=>marker.remove());world.key.intensity=keyIntensity;world.setIllustratedConveyorRunning?.(true);}};
}
