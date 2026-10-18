import * as THREE from 'three';
import {makeBatch,metal} from './builder-utils.js';
export function buildMiningLoader(world){
  const group=new THREE.Group();group.name='mining-face-excavator';world.root.add(group);
  const p=world.loadingPoint;group.position.set(p.x-1.05,world.height(p.x-1.05,p.z)+.025,p.z);
  const yellow=metal(0xe2a521,.53,.25),steel=metal(0x545e63,.65,.55),rubber=metal(0x222425,.9,.05),glass=metal(0x31566b,.19,.4);
  const tracks=makeBatch(group,'excavator-tracks');
  for(const side of [-1,1]){
    tracks.box(0,.09,side*.23,.72,.18,.15,rubber);
    for(let i=0;i<12;i++)tracks.box(-.33+i*.06,.185,side*.23,.026,.014,.16,steel);
  }tracks.finish();
  const turret=new THREE.Group();turret.position.y=.22;group.add(turret);
  const body=makeBatch(turret,'excavator-body');body.box(-.15,.12,0,.49,.24,.44,yellow);body.box(.05,.27,-.08,.25,.29,.24,yellow);body.box(.18,.30,-.08,.008,.18,.18,glass);body.box(.06,.30,-.205,.16,.18,.008,glass);body.finish();
  const boom=new THREE.Group();boom.position.set(.1,.2,.13);turret.add(boom);
  const boomBatch=makeBatch(boom,'excavator-boom');boomBatch.box(.36,0,0,.74,.085,.075,yellow);boomBatch.beam([0,-.06,0],[.55,-.02,0],.018,steel,8);boomBatch.finish();
  const stick=new THREE.Group();stick.position.x=.7;boom.add(stick);
  const arm=makeBatch(stick,'excavator-stick');arm.box(.27,0,0,.56,.065,.065,yellow);arm.beam([.03,.05,0],[.39,.035,0],.014,steel,8);arm.finish();
  const bucket=new THREE.Group();bucket.position.x=.54;stick.add(bucket);
  const scoop=makeBatch(bucket,'excavator-bucket');scoop.box(.055,-.04,0,.16,.11,.19,steel);for(let i=0;i<4;i++)scoop.box(.16,-.09,-.07+i*.047,.07,.025,.022,steel);scoop.finish();
  let state={};
  world.updates.push(t=>{
    const loading=world.haulageDiagnostics(t).trucks.some(v=>v.phase==='loading'||v.phase==='turning-at-loading-face');
    const phase=t*.55;
    turret.rotation.y=loading?.15:Math.sin(phase)*.55;
    boom.rotation.z=.7+Math.sin(phase)*.15;stick.rotation.z=-1.3+Math.sin(phase+.8)*.25;bucket.rotation.z=-.5+Math.sin(phase+1.2)*.3;
    state={loading,boom:boom.rotation.z,stick:stick.rotation.z,bucket:bucket.rotation.z};
  });
  world.loaderDiagnostics=()=>state;
}
