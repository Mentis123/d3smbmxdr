import * as THREE from 'three';
import {makeBatch} from './builder-utils.js';

// Small reusable fleet kit: absolute scene time, distance-based road travel,
// terminal work stops and no simulation-time integration or random traffic.
export function buildServiceTraffic(world){
  const fleet=[];
  const rubber=new THREE.MeshStandardMaterial({color:0x111820,roughness:.92});
  const steel=new THREE.MeshStandardMaterial({color:0x849298,metalness:.65,roughness:.4});
  const glass=new THREE.MeshStandardMaterial({color:0x264c61,metalness:.35,roughness:.22});
  const lamp=new THREE.MeshStandardMaterial({color:0xffe2aa,emissive:0xffc475,emissiveIntensity:1.6});
  const red=new THREE.MeshStandardMaterial({color:0x9f2420,emissive:0xb92617,emissiveIntensity:1});

  const wheelGeometry=new THREE.CylinderGeometry(.031,.031,.025,10);wheelGeometry.rotateX(Math.PI/2);
  const configs=[
    {id:'water-service-patrol',role:'Water plant inspection patrol',road:0,start:0,end:.82,color:0xb8d9ce,offset:4,speed:.32,stop:7,truck:false},
    {id:'bridge-maintenance-truck',role:'Bridge approach maintenance and inspection',road:2,start:.30,end:1,color:0xe0ac4c,offset:0,speed:.29,stop:12,truck:true}
  ];
  for(const config of configs){
    const group=new THREE.Group();group.name=config.id;group.visible=false;world.root.add(group);
    const paint=new THREE.MeshStandardMaterial({color:config.color,metalness:.3,roughness:.48});
    const beacon=new THREE.MeshStandardMaterial({color:0xffbc37,emissive:0xff870d,emissiveIntensity:1.5});
    const wheels=[],bodyBatch=makeBatch(group,config.id+'-body');let mastBatch;
    function box(name,x,y,z,w,h,d,material=paint,parent=group){
      (parent===group?bodyBatch:mastBatch).box(x,y,z,w,h,d,material);
    }
    const length=config.truck?.37:.30,width=.15;
    box('chassis',0,.055,0,length,.045,width,steel);
    box('cab',.075,.107,0,.125,.09,.145);
    box('windscreen',.139,.121,0,.006,.043,.118,glass);
    for(const side of [-1,1]){
      box('side-window',.075,.122,side*.074,.072,.038,.004,glass);
      box('headlamp',length/2+.003,.077,side*.049,.006,.018,.024,lamp);
      box('tail-lamp',-length/2-.003,.078,side*.051,.006,.02,.022,red);
      for(const x of [-length*.31,length*.31]){
        const wheel=new THREE.Mesh(wheelGeometry,rubber);wheel.position.set(x,.031,side*(width/2+.003));wheel.name=config.id+'-wheel';group.add(wheel);wheels.push(wheel);
      }
    }
    box('bed',-.09,.082,0,config.truck?.18:.12,.025,.14);
    for(const side of [-1,1])box('bed-rail',-.09,.109,side*.066,config.truck?.18:.12,.04,.012);
    box('equipment-locker',-.11,.116,0,.065,.045,.095,steel);
    box('roof-beacon',.075,.159,0,.045,.015,.025,beacon);
    // The truck raises a telescoping inspection light only during its far stop.
    const mast=new THREE.Group();mast.name=config.id+'-work-mast';mast.position.set(-.045,.11,0);group.add(mast);mastBatch=makeBatch(mast,config.id+'-mast');
    box('mast',0,.065,0,.012,.13,.012,steel,mast);
    box('work-light',0,.135,0,.037,.025,.027,lamp,mast);
    mast.visible=config.truck;bodyBatch.finish();mastBatch.finish();
    fleet.push({config,group,wheels,beacon,mast,length,width});
  }
  const smooth=u=>{u=THREE.MathUtils.clamp(u,0,1);return u*u*(3-2*u);};
  function sample(vehicle,time){
    const {config}=vehicle,road=world.serviceRoadRoutes?.[config.road];if(!road)return null;
    const length=road.curve.getLength()*(config.end-config.start),leg=length/config.speed,cycle=leg*2+config.stop*2;
    const phase=((time+config.offset)%cycle+cycle)%cycle;
    let fraction,direction,status,work=0,travelled,turn=0;
    // A short smooth ramp at each terminal prevents a full-speed start/stop.
    const ramp=u=>u<.08?.04*smooth(u/.08):u>.92?1-.04*smooth((1-u)/.08):.04+(u-.08)/.84*.92;
    if(phase<leg){fraction=ramp(phase/leg);direction=1;status='travelling-out';travelled=fraction*length;}
    else if(phase<leg+config.stop){fraction=1;direction=1;status=config.truck?'working-at-bridge':'inspecting-service-building';travelled=length;work=smooth((phase-leg)/2)*smooth((leg+config.stop-phase-2)/2);turn=Math.PI*smooth((phase-leg-config.stop+2)/2);}
    else if(phase<leg*2+config.stop){fraction=1-ramp((phase-leg-config.stop)/leg);direction=-1;status='travelling-back';travelled=(2-fraction)*length;}
    else{fraction=0;direction=-1;status='waiting-at-depot';travelled=length*2;turn=-Math.PI*smooth((phase-cycle+2)/2);}
    const routeFraction=THREE.MathUtils.lerp(config.start,config.end,fraction);
    const point=road.curve.getPointAt(routeFraction),tangent=road.curve.getTangentAt(routeFraction).normalize();
    // Same centre curve and terrain clamp as expansion.js's asphalt ribbon.
    // Lane offset is fixed per route to avoid sideways jumps at the work stop.
    const side=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
    point.addScaledVector(side,.065);
    point.y=Math.max(point.y,world.height(point.x,point.z)+.045)+.003;
    return {id:config.id,role:config.role,road:config.road,position:point.toArray(),heading:Math.atan2(-tangent.z*direction,tangent.x*direction)+turn,phase:status,cycleSeconds:cycle,work,travelled,laneOffset:.065,width:vehicle.width,length:vehicle.length,routeRange:[config.start,config.end],roadWidth:road.width};
  }
  function update(time){
    for(const vehicle of fleet){
      const state=sample(vehicle,time);if(!state)continue;
      vehicle.group.visible=true;vehicle.group.position.fromArray(state.position);vehicle.group.rotation.y=state.heading;
      for(const wheel of vehicle.wheels)wheel.rotation.z=-state.travelled/.031;
      vehicle.beacon.emissiveIntensity=.6+1.8*Math.pow(Math.max(0,Math.sin(time*5+vehicle.config.offset)),6);
      vehicle.mast.scale.y=1+state.work*1.8;
    }
  }
  world.updates.push(update);
  return {diagnostics:time=>fleet.map(vehicle=>{const state=sample(vehicle,time);return state?{...state,actualPosition:vehicle.group.position.toArray(),actualHeading:vehicle.group.rotation.y,actualMastScale:vehicle.mast.scale.y,actualWheelAngle:vehicle.wheels[0].rotation.z}:null;}).filter(Boolean)};
}
