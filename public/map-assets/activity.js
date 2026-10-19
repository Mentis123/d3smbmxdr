import * as THREE from 'three';
import {buildServiceTraffic} from './service-traffic.js';

// A compact inspection van follows the straight service road across the dam.
// Coordinates are slice-local: the road deck is y=2.557 at z=-.72.
export function buildActivity(world){
  const {root,updates}=world;
  const groundY=2.557,roadZ=-.72;
  const van=new THREE.Group();van.name='dam-service-van';root.add(van);
  const paint=new THREE.MeshStandardMaterial({color:0x172831,metalness:.58,roughness:.34});
  const glass=new THREE.MeshStandardMaterial({color:0x183746,metalness:.38,roughness:.2});
  const rubber=new THREE.MeshStandardMaterial({color:0x101619,roughness:.92});
  const alloy=new THREE.MeshStandardMaterial({color:0x83939a,metalness:.78,roughness:.27});
  const trim=new THREE.MeshStandardMaterial({color:0x48545a,metalness:.62,roughness:.42});
  const lamp=new THREE.MeshStandardMaterial({color:0xffdba0,emissive:0xffa94f,emissiveIntensity:2.4,roughness:.2});
  const tail=new THREE.MeshStandardMaterial({color:0xff2820,emissive:0xc81710,emissiveIntensity:1.5,roughness:.24});
  const beaconMat=new THREE.MeshStandardMaterial({color:0xffa313,emissive:0xff7800,emissiveIntensity:2.2,roughness:.22});
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const wheels=[];
  function box(name,x,y,z,w,h,d,material){const m=new THREE.Mesh(boxGeo,material);m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;van.add(m);return m;}
  function cylinder(name,x,y,z,radius,depth,material,segments=12){const g=new THREE.CylinderGeometry(radius,radius,depth,segments);const m=new THREE.Mesh(g,material);m.name=name;m.position.set(x,y,z);m.rotation.x=Math.PI/2;m.castShadow=true;m.receiveShadow=true;van.add(m);return m;}
  // Body sits just above the tyres; all dimensions stay within the assigned envelope.
  box('van lower body',0,.075,0,.405,.105,.205,paint);
  box('van bonnet',.137,.132,0,.115,.042,.198,paint);
  box('van cabin',-.035,.126,0,.205,.104,.194,paint);
  box('front windscreen',.072,.132,0,.008,.067,.158,glass);
  box('rear window',-.145,.131,0,.007,.061,.125,glass);
  box('near side window',-.023,.136,.099,.125,.05,.006,glass);
  box('far side window',-.023,.136,-.099,.125,.05,.006,glass);
  box('roof rack base',-.035,.184,0,.205,.008,.16,trim);
  box('roof rack rail near',-.035,.193,.071,.205,.008,.009,alloy);
  box('roof rack rail far',-.035,.193,-.071,.205,.008,.009,alloy);
  box('front bumper',.211,.055,0,.025,.026,.21,alloy);
  box('rear bumper',-.211,.055,0,.025,.026,.21,alloy);
  for(const z of [-.075,.075]){
    box('warm headlamp',.207,.113,z,.009,.025,.038,lamp);
    box('red tail lamp',-.207,.119,z,.009,.033,.025,tail);
    for(const x of [-.137,.137]){
      const wheel=cylinder(`rubber wheel ${x} ${z}`,x,.035,z,.035,.027,rubber,14);wheels.push(wheel);
      cylinder(`alloy wheel hub ${x} ${z}`,x,.035,z+Math.sign(z)*.014,.018,.003,alloy,12);
    }
  }
  // A small amber beacon glows without adding shadow-casting point lights.
  const beaconBase=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.012,12),trim);beaconBase.name='beacon base';beaconBase.position.set(-.035,.202,0);beaconBase.castShadow=true;van.add(beaconBase);
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.021,12,8),beaconMat);beacon.name='amber roof beacon';beacon.position.set(-.035,.219,0);van.add(beacon);
  const beaconHalo=new THREE.Mesh(new THREE.SphereGeometry(.023,12,8),new THREE.MeshBasicMaterial({color:0xff9a14,transparent:true,opacity:.13,depthWrite:false}));beaconHalo.name='beacon glow';beaconHalo.position.copy(beacon.position);van.add(beaconHalo);
  const headlight=new THREE.SpotLight(0xffd99c,1.4,2.1,.34,.75,2);headlight.position.set(.20,.12,0);const aim=new THREE.Object3D();aim.position.set(1.2,-.03,0);van.add(headlight,aim);headlight.target=aim;
  const cycle=18.4,leg=8.0,dwell=1.2,from=-7.5,to=-.7;
  const smooth=u=>{u=THREE.MathUtils.clamp(u,0,1);return u*u*(3-2*u);};
  function stateAt(t){
    const phase=((t%cycle)+cycle)%cycle;
    let x,heading,phaseName;
    if(phase<leg){x=THREE.MathUtils.lerp(from,to,smooth(phase/leg));heading=0;phaseName='outbound';}
    else if(phase<leg+dwell){x=to;heading=Math.PI*smooth((phase-leg)/dwell);phaseName='turnaround';}
    else if(phase<leg+dwell+leg){const u=(phase-leg-dwell)/leg;x=THREE.MathUtils.lerp(to,from,smooth(u));heading=Math.PI;phaseName='returning';}
    else{x=from;heading=Math.PI*(1-smooth((phase-leg-dwell-leg)/dwell));phaseName='turnaround';}
    return {x,heading,phase:phaseName,cycleSeconds:cycle};
  }
  function update(t){
    const s=stateAt(t);van.position.set(s.x,groundY,roadZ);van.rotation.y=s.heading;
    const phase=((t%cycle)+cycle)%cycle;
    const length=to-from;const travelled=phase<leg ? s.x-from : phase<leg+dwell ? length : phase<2*leg+dwell ? length+to-s.x : length*2;
    for(const wheel of wheels)wheel.rotation.y=travelled/.035;
    const pulse=.65+.35*(.5+.5*Math.sin(t*Math.PI*2/1.15));
    beaconMat.emissiveIntensity=1.1+2.2*pulse;beaconHalo.material.opacity=.07+.13*pulse;
    beacon.rotation.y=t*2.4;
  }
  updates.push(update);
  const traffic=buildServiceTraffic(world);
  world.activityDiagnostics=t=>{const s=stateAt(t);return {route:{from,to,z:roadZ,roadY:groundY},position:{x:s.x,y:groundY,z:roadZ},heading:s.heading,phase:s.phase,cycleSeconds:s.cycleSeconds,bounds:{length:.432,width:.224,height:.24,withinRoute:s.x>=from&&s.x<=to},fleet:traffic.diagnostics(t)};};
  update(0);
  // Actor contract for fly-through shots (flythrough.js): where the van is at any scene time, in
  // what frame, and the schedule of its cycle so a shot can be pinned to a leg of it.
  world.actors=world.actors||{};
  world.actors['dam-service-van']={
    cycle,
    phases:[{name:'outbound',start:0,length:leg},{name:'turnaround',start:leg,length:dwell},{name:'returning',start:leg+dwell,length:leg},{name:'turnaround-home',start:2*leg+dwell,length:dwell}],
    // stateAt() calls both dwells 'turnaround'; the contract names the second one so a shot can pin it.
    stateAt:t=>{const s=stateAt(t),p=((t%cycle)+cycle)%cycle;return {position:[s.x,groundY,roadZ],heading:s.heading,phase:s.phase==='turnaround'&&p>=2*leg+dwell?'turnaround-home':s.phase};},
  };
  return {diagnostics:world.activityDiagnostics};
}
