import * as THREE from 'three';
import {makeBatch,metal} from './builder-utils.js';
import {MINE} from './mining-layout.js';

// Reusable mine-site support buildings. Geometry is authored around a local
// ground origin so the same recipe can be moved to another flat site datum.
export function buildMiningBuildings(world){
  if(!world?.root?.isGroup)throw new Error('buildMiningBuildings requires world.root');
  const paint=metal(0xb5b6ae,.78,.12),concrete=metal(0x6a7477,.82,.12),roof=metal(0x35464d,.68,.3);
  const trim=metal(0x596970,.55,.55),steel=metal(0x879398,.42,.72),glass=metal(0x253e4b,.22,.35);
  const warm=new THREE.MeshStandardMaterial({color:0xffc982,emissive:0xffa94f,emissiveIntensity:1.05,roughness:.4});
  const yellow=metal(0xe0a91d,.55,.25),rubber=metal(0x202425,.92,.02);
  const diagnostics=[];
  const heightAt=(x,z)=>typeof world.height==='function'?world.height(x,z):MINE.workshop[1];

  // Three-sided, open-front maintenance shed. The +Z facade has three broad
  // drive-in bays; headers, tracks and folded slats make the open doors legible.
  {
    const [x,,z]=MINE.workshop,ground=heightAt(x,z),w=3.2,d=1.6,h=1.0;
    const group=new THREE.Group();group.name='mining-workshop';group.position.set(x,ground,z);world.root.add(group);
    const b=makeBatch(group,'mining-workshop');
    b.box(0,.045,0,3.28,.09,1.68,concrete); // raised, clean workshop pad
    b.box(0,.18,-.70,3.14,.22,.12,paint); // solid rear wall
    b.box(-1.53,.48,0,.14,.76,1.48,paint);b.box(1.53,.48,0,.14,.76,1.48,paint);
    // Back-wall clerestory glazing and a continuous wall plate.
    for(const wx of [-1.12,-.38,.38,1.12]){
      b.box(wx,.65,-.632,.30,.16,.012,glass);
      b.box(wx,.65,-.641,.19,.095,.009,warm);
      b.box(wx,.57,-.65,.32,.018,.035,trim);
    }
    const bayCenters=[-1.01,0,1.01];
    for(const bx of [-1.46,-.51,.51,1.46]){
      b.box(bx,.46,.70,.15,.82,.16,paint); // open-front piers
      b.box(bx,.43,.791,.018,.62,.022,trim); // roller track
      b.box(bx+Math.sign(bx||1)*.035,.43,.791,.012,.62,.022,steel);
      b.box(bx,.87,.70,.17,.11,.18,roof); // bay header
      b.box(bx,.91,.798,.18,.025,.022,trim);
    }
    for(const bx of bayCenters){
      // A rolled-up slatted door remains above each clear opening.
      b.box(bx,.765,.756,.78,.035,.035,steel);
      for(let slat=0;slat<4;slat++)b.box(bx,.69+slat*.019,.754,.75,.009,.018,trim);
      // Amber bay marker lights, fully emissive material rather than new lights.
      b.box(bx-.39,.83,.795,.035,.035,.018,warm);b.box(bx+.39,.83,.795,.035,.035,.018,warm);
      // Floor guide stripes lead into the service positions.
      b.box(bx-.39,.096,.30,.018,.012,.68,warm);b.box(bx+.39,.096,.30,.018,.012,.68,warm);
    }
    // Roof deck with exposed purlins, cross frames and bracing visible from above.
    b.box(0,.91,-.03,3.34,.08,1.72,roof);
    for(const rx of [-1.42,-.72,0,.72,1.42]){
      b.beam([rx,.99,-.79],[rx,.99,.78],.018,steel,6);
      b.beam([rx,.98,-.72],[rx,.91,-.57],.012,trim,6);
    }
    for(const rz of [-.67,-.25,.18,.60])b.box(0,.96,rz,3.22,.018,.035,steel);
    // Workshop side windows, utility pipework and an accessible service step.
    b.box(-1.606,.61,-.35,.014,.27,.34,glass);b.box(-1.616,.61,-.35,.009,.17,.21,warm);
    b.beam([-1.60,.2,-.59],[-1.60,.2,.53],.025,steel,8);
    b.beam([-1.60,.25,-.59],[-1.60,.83,-.59],.023,steel,8);
    b.beam([-1.60,.83,-.59],[-1.60,.83,.53],.023,steel,8);
    b.beam([1.57,.24,-.62],[1.57,.61,-.62],.019,steel,8);
    b.beam([1.57,.61,-.62],[1.57,.61,.18],.019,steel,8);
    b.box(1.65,.12,.66,.42,.06,.22,concrete); // entry step by the side service door
    b.box(1.65,.26,.67,.33,.25,.025,trim);b.box(1.65,.27,.688,.22,.19,.012,warm);
    // Two rooftop extraction cowls and a compact duct run.
    for(const vx of [-1.08,.94]){
      b.box(vx,.99,-.20,.32,.045,.27,steel);
      b.box(vx,1.08,-.20,.20,.14,.18,trim);
      b.box(vx,1.16,-.20,.27,.025,.24,steel);
      for(let fin=0;fin<3;fin++)b.box(vx,.085+1.0,-.27+fin*.07,.18,.012,.012,roof);
    }
    b.beam([-.62,1.0,-.20],[.67,1.0,-.20],.025,steel,8);
    b.finish();

    // Parked yellow service ute in the middle bay gives a clear human-scale cue.
    const vehicle=makeBatch(group,'mining-workshop-parked-ute');
    const vx=0,vy=.105,vz=.19;
    vehicle.box(vx,vy+.105,vz,.27,.17,.47,yellow);
    vehicle.box(vx,vy+.235,vz-.035,.24,.13,.22,yellow);
    vehicle.box(vx,vy+.238,vz+.079,.19,.09,.012,glass);
    vehicle.box(vx,vy+.29,vz-.035,.25,.022,.23,trim);
    vehicle.box(vx,vy+.105,vz+.241,.28,.045,.035,trim);
    vehicle.box(vx,vy+.14,vz+.262,.035,.03,.012,warm);
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,.035,10),rubber);
      wheel.rotation.z=Math.PI/2;wheel.position.set(vx+sx*.145,vy+.06,vz+sz*.15);wheel.name='workshop-ute-wheel';group.add(wheel);
    }
    vehicle.finish();
    diagnostics.push({group,footprint:[w,d],nominalHeight:h,baseY:ground,contactY:ground,topY:ground+1.18,bays:3});
  }

  // Compact glazed operations room at the right-hand plateau. Its warm panes,
  // rooftop HVAC and antenna distinguish control from the larger service shed.
  {
    const [x,,z]=MINE.control,ground=heightAt(x,z),w=1.5,d=1.2,h=.85;
    const group=new THREE.Group();group.name='mining-control-room';group.position.set(x,ground,z);world.root.add(group);
    const b=makeBatch(group,'mining-control-room');
    b.box(0,.045,0,1.58,.09,1.28,concrete);
    b.box(0,.42,-.02,1.44,.66,1.12,paint);
    b.box(0,.77,-.02,1.52,.065,1.20,roof);
    // Three broad forward windows with luminous inner panes and dark mullions.
    for(const wx of [-.48,0,.48]){
      b.box(wx,.53,.548,.36,.30,.018,glass);
      b.box(wx,.53,.56,.25,.20,.009,warm);
      b.box(wx,.53,.57,.015,.30,.012,trim);
    }
    b.box(.57,.39,.55,.18,.43,.025,trim);b.box(.57,.39,.567,.13,.34,.012,glass);
    b.box(.57,.12,.64,.43,.06,.25,concrete);
    b.box(.57,.19,.65,.34,.08,.21,steel);
    // Side glazing and neat perimeter fascia.
    b.box(-.728,.49,-.08,.014,.25,.34,glass);b.box(-.738,.49,-.08,.009,.17,.23,warm);
    b.box(0,.79,-.63,1.54,.025,.025,steel);b.box(0,.79,.59,1.54,.025,.025,steel);
    b.box(-.77,.79,-.02,.025,.025,1.22,steel);b.box(.77,.79,-.02,.025,.025,1.22,steel);
    // Rooftop package unit and short screened communications mast.
    b.box(-.35,.85,-.14,.42,.12,.34,steel);
    b.box(-.35,.92,-.14,.30,.025,.24,trim);
    for(let fin=0;fin<5;fin++)b.box(-.49+fin*.07,.855,-.14,.012,.07,.27,roof);
    b.beam([.48,.81,-.38],[.48,1.18,-.38],.012,steel,8);
    b.beam([.37,1.12,-.38],[.59,1.12,-.38],.009,trim,6);
    b.beam([.41,1.01,-.38],[.55,1.01,-.38],.008,trim,6);
    b.beam([.48,1.18,-.38],[.48,1.24,-.38],.008,steel,6);
    b.finish();
    diagnostics.push({group,footprint:[w,d],nominalHeight:h,baseY:ground,contactY:ground,topY:ground+1.24,bays:0});
  }
  world.buildingDiagnostics=()=>diagnostics.map(d=>({name:d.group.name,footprint:d.footprint.slice(),nominalHeight:d.nominalHeight,baseY:d.baseY,contactY:d.contactY,topY:d.topY,bays:d.bays}));
  return {diagnostics:world.buildingDiagnostics};
}
