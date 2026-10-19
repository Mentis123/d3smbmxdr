import * as THREE from 'three';

// Four bounded, fictional operational slices. All resources belong to the exhibit kit.
export function buildWorkflow(id,k){
 const {root,box,cylinder,bar,mesh,mat,steel,dark,yellow,cyan,amber,concrete}=k;
 const paper=mat(0xd6e5e9,{roughness:.95}),blue=mat(0x164f72),green=mat(0x55d6af,{emissive:0x146b51,emissiveIntensity:.3});
 const rotors=[],signals=[];
 function screen(x,y,z,w=1.6,h=1){box(w+.14,h+.14,.16,dark,x,y,z);return box(w,h,.025,blue,x,y,z+.095);}
 function pipe(a,b,r=.105){return bar(a,b,r,steel);}
 function pump(x=-1.5,z=.15){
  box(2.5,.12,1.5,dark,x,.12,z);
  for(const dx of [-.8,.65])for(const dz of [-.48,.48]){box(.24,.34,.2,steel,x+dx,.32,z+dz);cylinder(.055,.055,yellow,x+dx,.51,z+dz);}
  const motor=cylinder(.38,1.1,steel,x-.2,.77,z);motor.rotation.z=Math.PI/2;
  for(let i=0;i<9;i++){const fin=cylinder(.41,.025,dark,x-.68+i*.12,.77,z);fin.rotation.z=Math.PI/2;}
  const housing=mesh(new THREE.TorusGeometry(.43,.17,12,32),steel,x+.72,.78,z);housing.rotation.y=Math.PI/2;
  const cap=cylinder(.32,.18,blue,x+.81,.78,z);cap.rotation.z=Math.PI/2;
  pipe([x+.7,.8,z],[x+.7,1.6,z]);pipe([x+.7,1.6,z],[x+1.45,1.6,z]);pipe([x+.72,.8,z],[x+.72,.8,z+1]);
  const fan=new THREE.Group();fan.position.set(x-.8,.77,z);root.add(fan);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7,o=bar([x-.8,.77,z],[x-.8,.77+Math.cos(a)*.29,z+Math.sin(a)*.29],.025,yellow);fan.attach(o);}rotors.push(fan);
  const sensor=box(.2,.17,.2,cyan,x+.7,1.76,z);return{sensor};
 }
 function sheet(x,y,z,w=1.65,h=2){const body=box(w,h,.045,paper,x,y,z);for(let i=0;i<4;i++)box(w*.65,.025,.012,blue,x-w*.06,y+h*.3-i*.13,z+.03);box(w*.8,h*.15,.016,blue,x,y-h*.33,z+.032);return body;}
 function cabinet(x,z){box(.8,1.55,.72,dark,x,.8,z);box(.68,1.35,.035,steel,x,.82,z+.38);for(let i=0;i<7;i++)box(.4,.025,.025,dark,x,.4+i*.12,z+.41);const light=box(.1,.07,.025,cyan,x+.19,1.35,z+.42);return light;}
 function trend(x,y,z,gap=false,drop=false){
  for(let i=0;i<5;i++)bar([x-1,y-.4+i*.2,z],[x+1,y-.4+i*.2,z],.004,steel);
  const segments=[];for(let i=0;i<17;i++){const a=i/8-1,b=(i+1)/8-1;if(gap&&i>=7&&i<=11)continue;segments.push(bar([x+a,y+.12*Math.sin(i*1.3)-(drop&&i>=10?.25:0),z+.01],[x+b,y+.12*Math.sin((i+1)*1.3)-(drop&&i+1>=10?.25:0),z+.01],.018,cyan));}return segments;
 }
 let draw,stats;
 if(id==='energy.drawing-search'){
  pump(-1.65,.35);
  for(const x of [.5,2.7])bar([x,.1,-.6],[x,2.8,-.6],.035,steel);
  box(2.65,2.65,.11,dark,1.65,1.65,-.6);box(2.5,2.5,.025,blue,1.65,1.65,-.53);
  // Original pump schematic, with title-block geometry echoed by readable host fields.
  const ring=mesh(new THREE.TorusGeometry(.4,.025,8,40),cyan,1.45,1.85,-.5);
  bar([.65,1.85,-.5],[1.05,1.85,-.5],.025,cyan);bar([1.85,1.85,-.5],[2.55,1.85,-.5],.025,cyan);bar([1.45,2.25,-.5],[1.45,2.65,-.5],.025,cyan);
  box(2.25,.42,.02,paper,1.65,.67,-.49);for(const x of [1.05,1.85])box(.018,.42,.018,blue,x,.67,-.46);
  const tag=box(.52,.22,.06,yellow,-.9,1.47,.38);
  const selected=mesh(new THREE.TorusGeometry(.55,.025,8,48),amber,1.45,1.85,-.43);
  const fields=[box(.66,.34,.025,cyan,.69,.67,-.43),box(.66,.34,.025,cyan,1.45,.67,-.43),box(.66,.34,.025,cyan,2.23,.67,-.43)];
  draw=(t,p)=>{tag.material=p===0?amber:yellow;fields.forEach((o,i)=>o.visible=p>0&&i<=(p===1?1:2));selected.visible=p===2;ring.rotation.z=t*.08;};stats={kind:'drawing',asset:'P-204',revision:'B',source:'fictional title block',authority:'engineer verifies controlled register'};
 }else if(id==='energy.alarm-investigation'){
  const {sensor}=pump(-1.6,.4);cabinet(2.55,-.75);
  bar([1.35,.1,-.25],[1.35,1.65,-.25],.05,steel);screen(1.35,2.15,-.25,2.3,1.3);const normalTrend=trend(1.35,2.15,-.14),alarmTrend=trend(1.35,2.15,-.12,false,true);
  const alert=mesh(new THREE.TorusGeometry(.22,.025,8,32),amber,-.9,1.77,.4);alert.rotation.x=Math.PI/2;
  const evidence=[];for(let i=0;i<3;i++){const x=.5+i*.82;bar([x,0,1.15],[x,.35,1.15],.025,steel);const o=box(.62,.4,.1,i===1?yellow:paper,x,.35,1.15);evidence.push(o);}
  for(let i=0;i<10;i++)signals.push(mesh(new THREE.SphereGeometry(.035,6,5),cyan));
  draw=(t,p)=>{normalTrend.forEach(o=>o.visible=p===0);alarmTrend.forEach(o=>o.visible=p>0);alert.visible=p>0;alert.scale.setScalar(1+.06*Math.sin(t*3));sensor.material=p?amber:cyan;evidence.forEach((o,i)=>o.material=p===2?amber:(i===1?yellow:paper));signals.forEach((o,i)=>{o.visible=p>0;o.position.set(-.9+((t*.15+i/10)%1)*3.3,1.8,-.1);});};stats={kind:'alarm',controlCommands:0,conclusion:'check sensor and recent maintenance'};
 }else if(id==='mining.procedure-control'){
  box(5.8,.18,2.5,steel,0,1.1,0);for(const x of [-2.5,2.5])for(const z of [-1,1]){bar([x,.05,z],[x,1.1,z],.07,dark);box(.32,.04,.3,dark,x,.03,z);}
  const part=cylinder(.4,.55,steel,-1.5,1.63,.48);part.rotation.x=Math.PI/2;
  mesh(new THREE.TorusGeometry(.42,.045,8,24),yellow,-1.5,1.63,.8);
  sheet(-1.4,2.22,-.75,1.5,1.8);sheet(.35,2.22,-.75,1.5,1.8);for(const x of [-1.4,.35])bar([x,1.19,-.75],[x,1.4,-.75],.035,steel);
  const draft=box(1.36,.18,.02,yellow,-1.4,2.82,-.71),approved=box(1.36,.18,.02,green,.35,2.82,-.71);
  const tablet=screen(1.45,1.8,.75,1.35,.85);box(1.5,.2,.9,dark,1.45,1.29,.55);cabinet(2.5,-1.15);
  const document=box(.72,.62,.03,paper,1.45,1.8,.88);for(let i=0;i<4;i++)box(.5,.018,.02,blue,1.45,2-i*.12,.91);
  const check=mesh(new THREE.TorusGeometry(.23,.025,8,32),green,.35,2.2,-.69);
  draw=(t,p)=>{draft.material=p===1?amber:yellow;check.visible=p===2;document.visible=p===2;tablet.material=p===2?green:blue;approved.material=p===2?green:steel;};stats={kind:'procedure',approvedRevision:'3',draftRevision:'4',authority:'controlled register',automaticApproval:false};
 }else if(id==='mining.historian-gap'){
  pump(-1.7,.5);const heartbeat=cabinet(2.55,-.7);
  bar([.9,.08,-.35],[.9,1.5,-.35],.055,steel);screen(.9,2.08,-.35,2.35,1.35);
  const complete=trend(.9,2.08,-.24),broken=trend(.9,2.08,-.21,true);
  const cable=bar([-.95,1.75,.5],[2.55,1.35,-.7],.014,cyan);
  for(let i=0;i<10;i++)signals.push(mesh(new THREE.SphereGeometry(.035,6,5),cyan));
  draw=(t,p)=>{heartbeat.material=p===0?cyan:amber;cable.visible=p===0;complete.forEach(o=>o.visible=p===0);broken.forEach(o=>o.visible=p>0);signals.forEach((o,i)=>{o.visible=p===0;const a=(t*.2+i/10)%1;o.position.set(-.95+3.5*a,1.75-.4*a,.5-1.2*a);});};stats={kind:'historian',motorKeepsRunning:true,missingSamples:4,imputedSamples:0,gapDetection:'freshness rule',explanation:'illustrative AI-assisted summary'};
 }else throw Error('Unsupported workflow exhibit');
 return{update(t,phase){rotors.forEach(o=>o.rotation.x=t*2);draw(t,phase);},metrics:()=>stats};
}
