import * as THREE from 'three';
import {makeBatch,metal} from './builder-utils.js';
import {propsArm} from './props/arm.js';
import {houseStyle,slotsFor,PROFILES} from './props/house-style.js';

// Prop treatment (A/B pilot P1, docs/three-worlds/ab/P1-MINING-PROPS-RUBRIC.md): 'procedural' (default) draws the
// trucks below; 'house' draws Polyfork's articulated dump truck forked into the mining look, on the same route and
// schedule. Loaded before the world builds, so neither arm pops in.
const ARM=propsArm();
const PF=ARM==='house'?await import('./props/pf/articulated-dump-truck-ee50f3.js'):null;
const PF_LENGTH=9.87,PF_WHEEL_R=1.0,HOUSE_LENGTH=.95;

// Two scale-model haul trucks sharing one open pit-to-crusher route. All state
// is derived from absolute scene time, so capture, pause and seek stay stable.
export function buildMiningHaulage(world){
  if(!world?.root?.isGroup||!Array.isArray(world.updates)||!world.haulRoute?.getPointAt||!world.haulRoute?.getTangentAt){
    throw new Error('buildMiningHaulage requires world.root, world.updates and a 3D world.haulRoute curve');
  }
  const paint=new THREE.MeshStandardMaterial({color:0xf2b51f,metalness:.28,roughness:.42});
  const darkPaint=new THREE.MeshStandardMaterial({color:0xc78712,metalness:.32,roughness:.48});
  const rubber=new THREE.MeshStandardMaterial({color:0x171a1b,roughness:.94});
  const tread=new THREE.MeshStandardMaterial({color:0x292d2d,roughness:.9});
  const steel=metal(0x87949a,.44,.72);
  const glass=new THREE.MeshStandardMaterial({color:0x28475a,metalness:.38,roughness:.2});
  const lamp=new THREE.MeshStandardMaterial({color:0xffedbd,emissive:0xffbd54,emissiveIntensity:1.3});
  const red=new THREE.MeshStandardMaterial({color:0xa02a1d,emissive:0xb62212,emissiveIntensity:.7});
  const ore=new THREE.MeshStandardMaterial({color:0x746b5a,roughness:1});
  const tireGeo=new THREE.CylinderGeometry(.12,.12,.075,16,1);tireGeo.rotateX(Math.PI/2);
  const hubGeo=new THREE.CylinderGeometry(.052,.052,.079,12);hubGeo.rotateX(Math.PI/2);
  const trucks=[];
  const smooth=u=>{u=THREE.MathUtils.clamp(u,0,1);return u*u*(3-2*u);};
  const routeLength=world.haulRoute.getLength();
  const speed=.42; // scene units/second; intentionally slow miniature traffic
  const legSeconds=routeLength/speed;
  const turnSeconds=4.8, serviceSeconds=5.2;
  const cycle=legSeconds*2+turnSeconds*2+serviceSeconds*2;
  const ramp=u=>u<.075?.04*smooth(u/.075):u>.925?1-.04*smooth((1-u)/.075):.04+(u-.075)/.85*.92;
  const configs=[{id:'haul-truck-01',lane:-.27,offset:0},{id:'haul-truck-02',lane:-.27,offset:cycle/2}];

  for(const config of configs){
    const group=new THREE.Group();group.name=config.id;group.visible=false;world.root.add(group);
    const wheels=[];
    const body=makeBatch(group,config.id+'-static');
    const bodyBox=(x,y,z,w,h,d,mat=paint)=>body.box(x,y,z,w,h,d,mat);
    const L=.7,W=.4;
    // Chassis, heavy front engine deck and glazed high cab.
    bodyBox(-.015,.205,0,.62,.10,.29,steel);
    bodyBox(.205,.275,0,.25,.105,.32,paint);
    bodyBox(.255,.356,0,.205,.16,.235,paint);
    bodyBox(.291,.365,0,.008,.104,.19,glass);
    for(const side of [-1,1]){
      bodyBox(.205,.36,side*.12,.12,.094,.008,glass);
      bodyBox(.11,.342,side*.126,.035,.067,.008,glass);
      bodyBox(.355,.282,side*.12,.022,.023,.028,lamp);
      bodyBox(-.333,.255,side*.115,.018,.032,.025,red);
      // Front grille and bumper are repeated geometry across each truck.
      bodyBox(.338,.225,0,.018,.06,.14,steel);
      bodyBox(.356,.181,0,.075,.035,.34,darkPaint);
      // Three axle positions give the oversized six-tyre dump-truck stance.
      for(const x of [-.22,-.005,.22]){
        const wheel=new THREE.Group();wheel.position.set(x,.12,side*.174);wheel.name=config.id+'-wheel';group.add(wheel);
        const tire=new THREE.Mesh(tireGeo,rubber);tire.name=config.id+'-tire';tire.castShadow=true;wheel.add(tire);
        const hub=new THREE.Mesh(hubGeo,steel);hub.name=config.id+'-wheel-hub';wheel.add(hub);
        // One instanced tread batch per wheel follows the tyre as it spins.
        const lugs=new THREE.InstancedMesh(new THREE.BoxGeometry(.035,.018,.082),tread,8);
        lugs.name=config.id+'-tread';lugs.castShadow=true;
        for(let i=0;i<8;i++){
          const a=i*Math.PI/4;
          const lug=new THREE.Object3D();lug.position.set(Math.sin(a)*.116,Math.cos(a)*.116,0);lug.rotation.z=-a;lug.updateMatrix();lugs.setMatrixAt(i,lug.matrix);
        }
        wheel.add(lugs);wheels.push(wheel);
      }
      // Access steps and handrails on both sides of the cab.
      bodyBox(.105,.165,side*.188,.12,.018,.065,steel);
      bodyBox(.115,.207,side*.205,.012,.07,.012,steel);
      bodyBox(.13,.246,side*.205,.055,.012,.012,steel);
      body.beam([.08,.16,side*.205],[.08,.25,side*.205],.005,steel,6);
    }
    // Bed is a separate pivot, hinged at the rear; its contents can disappear
    // at the crusher while the tray rises and settle back at the loading face.
    const bedPivot=new THREE.Group();bedPivot.name=config.id+'-bed-pivot';bedPivot.position.set(-.30,.255,0);group.add(bedPivot);
    const bed=makeBatch(bedPivot,config.id+'-tipping-bed');
    bed.box(.17,.025,0,.35,.05,.34,darkPaint);
    bed.box(.17,.079,0,.35,.065,.32,paint);
    bed.box(.17,.135,.157,.35,.105,.025,paint);
    bed.box(.17,.135,-.157,.35,.105,.025,paint);
    bed.box(.337,.118,0,.025,.105,.30,paint);
    bed.beam([.02,-.012,0],[.22,-.105,0],.012,steel,8);
    bed.finish();
    const load=new THREE.Group();load.name=config.id+'-ore-load';bedPivot.add(load);
    // Low-poly ore mound inside the tray; fixed deterministic arrangement.
    for(let i=0;i<9;i++){
      const x=.06+(i%3)*.09,z=-.09+Math.floor(i/3)*.09;
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.052+(i%2)*.008,0),ore);
      rock.position.set(x,.115+((i*7)%4)*.009,z);rock.scale.set(1.25,.63,.85);rock.rotation.set(i*.31,i*.7,i*.23);rock.castShadow=true;load.add(rock);
    }
    // Static side catwalk and rear work lights.
    bodyBox(-.15,.214,.15,.28,.015,.018,steel);
    bodyBox(-.15,.214,-.15,.28,.015,.018,steel);
    body.finish();
    let house=null;
    if(PF){
      // Same truck slot, house-styled model: procedural parts hidden, Polyfork's own rig driven by the same schedule.
      for(const child of group.children)child.visible=false;
      const k=HOUSE_LENGTH/PF_LENGTH;
      const m=houseStyle(PF.createAsset({...slotsFor(PROFILES['mining-day'],PF.params),tip:0,load:.85,wear:.45}),'mining-day',{id:config.id+'-house',scale:k});
      m.rotation.y=Math.PI/2;group.add(m);
      house={model:m,tip:m.getObjectByName('tip-pose'),load:m.getObjectByName('load'),wheels:['fl','fr','rl','rr'].map(n=>m.getObjectByName('wheel-'+n)).filter(Boolean),radius:PF_WHEEL_R*k};
    }
    trucks.push({config,group,bedPivot,load,wheels,cycle,house});
  }

  function sample(truck,time){
    const phase=((time+truck.config.offset)%cycle+cycle)%cycle;
    let u=0,direction=1,status,bedAngle=0,loaded=false,turnBlend=0,travel=0;
    const outboundEnd=legSeconds,crusherTurnEnd=outboundEnd+turnSeconds,tipEnd=crusherTurnEnd+serviceSeconds;
    const inboundEnd=tipEnd+legSeconds,loadTurnEnd=inboundEnd+turnSeconds;
    if(phase<outboundEnd){u=ramp(phase/legSeconds);travel=u*routeLength;status='loaded-outbound';loaded=true;}
    else if(phase<crusherTurnEnd){u=1;direction=1;status='turning-at-crusher';loaded=true;turnBlend=smooth((phase-outboundEnd)/turnSeconds);}
    else if(phase<tipEnd){u=1;direction=-1;status='tipping-at-crusher';bedAngle=.62*smooth((phase-crusherTurnEnd)/.9)*(1-smooth((phase-(tipEnd-.9))/.9));loaded=phase<crusherTurnEnd+serviceSeconds*.22;travel=routeLength;}
    else if(phase<inboundEnd){u=1-ramp((phase-tipEnd)/legSeconds);direction=-1;status='empty-return';travel=(2-u)*routeLength;}
    else if(phase<loadTurnEnd){u=0;direction=-1;status='turning-at-loading-face';turnBlend=smooth((phase-inboundEnd)/turnSeconds);loaded=false;travel=2*routeLength;}
    else{u=0;direction=1;status='loading';loaded=smooth((phase-loadTurnEnd)/serviceSeconds)>.72;travel=2*routeLength;}
    if(phase>=loadTurnEnd){u=0;direction=1;}
    const point=world.haulRoute.getPointAt(THREE.MathUtils.clamp(u,0,1));
    const tangent=world.haulRoute.getTangentAt(THREE.MathUtils.clamp(u,0,1)).normalize();
    const forward=new THREE.Vector3(tangent.x,0,tangent.z).normalize();
    // The truck points along the road direction of travel. During the terminal
    // turn it rotates in place while its lane smoothly crosses the road centre.
    const headingForward=forward.clone().multiplyScalar(direction);
    if(status==='turning-at-crusher')headingForward.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI*turnBlend);
    if(status==='turning-at-loading-face')headingForward.applyAxisAngle(new THREE.Vector3(0,1,0),-Math.PI*turnBlend);
    const heading=Math.atan2(-headingForward.z,headingForward.x);
    const side=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
    const laneOffset=status==='turning-at-crusher'
      ?THREE.MathUtils.lerp(truck.config.lane,-truck.config.lane,smooth(turnBlend))
      :status==='turning-at-loading-face'
        ?THREE.MathUtils.lerp(-truck.config.lane,truck.config.lane,smooth(turnBlend))
        :(direction===1?truck.config.lane:-truck.config.lane);
    point.addScaledVector(side,laneOffset);
    return {id:truck.config.id,phase:status,position:point,heading,u,loaded,bedAngle,laneOffset,cycleSeconds:cycle,routeLength,travel};
  }
  function update(time=0){
    for(const truck of trucks){
      const s=sample(truck,Number.isFinite(time)?time:0);
      truck.group.visible=true;truck.group.position.copy(s.position);truck.group.rotation.y=s.heading;
      truck.bedPivot.rotation.z=s.bedAngle;truck.load.visible=s.loaded;
      for(const wheel of truck.wheels)wheel.rotation.z=-s.travel/.12;
      const h=truck.house;
      if(h){if(h.tip)h.tip.rotation.x=-s.bedAngle;if(h.load)h.load.visible=s.loaded;for(const w of h.wheels)w.rotation.x=s.travel/h.radius;}
    }
  }
  world.updates.push(update);
  world.stats.props=PF?'house':'procedural';
  // Actor contract for fly-through shots (flythrough.js). Phase starts are in scene time, so each
  // truck's schedule is shifted back by its own offset (its phase clock runs time+offset).
  world.actors=world.actors||{};
  const outboundEnd=legSeconds,crusherTurnEnd=outboundEnd+turnSeconds,tipEnd=crusherTurnEnd+serviceSeconds,inboundEnd=tipEnd+legSeconds,loadTurnEnd=inboundEnd+turnSeconds;
  const schedule=[['loaded-outbound',0,outboundEnd],['turning-at-crusher',outboundEnd,crusherTurnEnd],['tipping-at-crusher',crusherTurnEnd,tipEnd],['empty-return',tipEnd,inboundEnd],['turning-at-loading-face',inboundEnd,loadTurnEnd],['loading',loadTurnEnd,cycle]];
  for(const truck of trucks){
    world.actors[truck.config.id]={
      cycle,
      phases:schedule.map(([name,a,b])=>({name,start:a-truck.config.offset,length:b-a})),
      stateAt:t=>{const s=sample(truck,t);return {position:s.position.toArray(),heading:s.heading,phase:s.phase};},
    };
  }
  const routePoints=Array.from({length:33},(_,i)=>world.haulRoute.getPointAt(i/32));
  const bounds=new THREE.Box3().setFromPoints(routePoints);
  world.haulageDiagnostics=time=>({route:{name:world.haulRoute.name||'haul-route',length:routeLength,min:bounds.min.toArray(),max:bounds.max.toArray(),finite:[...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite)},trucks:trucks.map(truck=>{const s=sample(truck,Number.isFinite(time)?time:0);return {...s,position:s.position.toArray(),actualPosition:truck.group.position.toArray(),actualHeading:truck.group.rotation.y,actualBedAngle:truck.bedPivot.rotation.z,actualLoadVisible:truck.load.visible,actualTires:truck.wheels.map(w=>({position:w.position.toArray(),rotation:w.rotation.z}))};})});
  update(0);
  return {diagnostics:world.haulageDiagnostics};
}
