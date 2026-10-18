import * as THREE from 'three';

// Experience-only, fictional observation geometry. No detector or control API.
export function createLabLayer(world, industry, host, onSelect) {
  const mining=industry==='mining', locationId=mining?'mining.processing.conveyor':'energy.dam.intake';
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
  const marker=document.createElement('button');marker.className='lab-hotspot';marker.type='button';marker.textContent=mining?'◉ Conveyor vision':'◉ Intake vision';marker.setAttribute('aria-label','Open '+(mining?'conveyor':'intake')+' AI demonstration');
  marker.style.cssText='position:absolute;z-index:4;left:0;top:0;transform:translate(-50%,-100%);border:1px solid #78dcff;background:#000025ed;color:#fff;border-radius:20px;padding:9px 13px;min-height:44px;font:600 12px Arial,sans-serif;white-space:nowrap;box-shadow:0 0 24px #00aeff35';
  marker.addEventListener('pointerdown',e=>e.stopPropagation());marker.addEventListener('click',()=>onSelect(locationId));host.appendChild(marker);
  const keyIntensity=world.key.intensity;
  let state={lighting:'day',occlusion:false,connected:true,condition:true};
  function apply(input={}) {
    input=input&&typeof input==='object'?input:{};
    state={lighting:input.lighting==='low'?'low':'day',occlusion:input.occlusion===true,connected:input.connected!==false,condition:input.condition!==false};
    issue.visible=state.condition;cover.visible=state.occlusion;world.key.intensity=keyIntensity*(state.lighting==='low'?.28:1);
    ring.material.color.set(state.occlusion||state.lighting==='low'?0xffc875:state.condition?0x00aeff:0x78dcff);
    return diagnostics();
  }
  const projected=new THREE.Vector3();
  function update(camera) {
    group.updateWorldMatrix(true,false);projected.copy(anchor);projected.y+=.65;world.root.localToWorld(projected);projected.project(camera);
    marker.hidden=projected.z>1||projected.z< -1||Math.abs(projected.x)>.95||Math.abs(projected.y)>.92;
    marker.style.left=(projected.x*.5+.5)*host.clientWidth+'px';marker.style.top=(-projected.y*.5+.5)*host.clientHeight+'px';
  }
  function diagnostics(){return{locationId,industry,...state,issueVisible:issue.visible,occlusionVisible:cover.visible,keyIntensity:world.key.intensity,issuePieces:issue.children.length,simulation:true,inference:false,controlConnected:false};}
  apply();
  return{apply,update,diagnostics,dispose(){marker.remove();world.key.intensity=keyIntensity;}};
}
