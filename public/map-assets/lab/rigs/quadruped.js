// Generic four-legged inspection robot (one rig for energy and mining). Procedural, no binary assets.
// Body, pan/tilt camera head on a mast, four two-segment legs (all knees bend backward), a trot that never slides,
// a docking pose. Everything is a pure function of t, so seeking is exact.
//
// Planted feet: the gait phase is driven by progress along a route (metres walked plus heading turned times a hip
// radius), never by time. Each stance has ONE world-space foothold, so a stance foot cannot move, whatever the speed,
// curve or turn. A swing carries the foot from one foothold to the next. A move starts and ends with all four feet at
// their nominal stand positions: stances that began before the move use the start pose, stances (or swings) that run
// past the end use the end pose, and a swing still in the air when the body stops finishes over 0.35 s.
//
//   const robot=createQuadruped(k,{name:'robot'});
//   const out=robot.route([[x,z],...]);             // Catmull-Rom path, heading follows the tangent
//   const back=robot.route([...].reverse(),{back:true});   // walk the same path backwards (heading kept)
//   const spin=robot.turn([x,z],h0,h1);              // turn on the spot
//   robot.plan([{route:out,t0:1.5,t1:6.6},{route:back,t0:18,t1:23}]);
//   robot.update(t,{dock, aim:[x,y,z], aimWeight, idlePan, idleTilt, tally});
//   robot.camera  -> PerspectiveCamera on the head (use as a kit sensor camera)
const CYCLE=.62,DUTY=.6,LIFT=.075,TURN_R=.42,SETTLE=.35;
const H_STAND=.44,H_DOCK=.2,THIGH=.3,SHIN=.3,FOOT_R=.032;
const HX=.225,HZ=.34,FOOT_OUT=.01;
const LEGS=[{side:1,end:1,o:0},{side:-1,end:1,o:.5},{side:1,end:-1,o:.5},{side:-1,end:-1,o:0}];   // trot: diagonal pairs
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

export function createQuadruped(k,{name='inspection-robot',paint=0xf0c22e,trim=0x1b2329,plate=true,fov=34}={}){
  const {THREE,root,mat}=k;
  const body=mat(paint,{roughness:.45,metalness:.15}),dark=mat(trim,{roughness:.55,metalness:.4}),joint=mat(0x39444b,{roughness:.4,metalness:.6}),
    rubber=mat(0x101418,{roughness:.95}),glass=mat(0x0a1822,{roughness:.08,metalness:.85}),lensRing=mat(0xc9d2d7,{metalness:.7,roughness:.3});
  const tallyMat=mat(0x3a1512,{emissive:0xff2a1a,emissiveIntensity:0});
  const group=new THREE.Group();group.name=name;root.add(group);
  const add=(parent,o)=>{parent.add(o);return o;};
  const box=(p,w,h,d,m,x,y,z)=>add(p,k.box(w,h,d,m,x,y,z));
  const cyl=(p,r,len,m,x,y,z,axis)=>{const o=add(p,k.cylinder(r,len,m,x,y,z));if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o;};

  // ---- Body (local +z is forward) ----
  const torso=new THREE.Group();torso.name='robot-body';group.add(torso);
  box(torso,.36,.17,.9,body,0,.03,0);
  box(torso,.3,.05,.62,dark,0,.14,-.04);                                  // payload rail
  for(const s of [-1,1])box(torso,.012,.11,.6,dark,s*.184,.03,0);         // side panels
  box(torso,.3,.13,.03,dark,0,.03,.455);box(torso,.3,.13,.03,dark,0,.03,-.455);
  for(const x of [-.07,.07]){const w=box(torso,.07,.045,.012,glass,x,.04,.472);w.castShadow=false;}   // front stereo windows
  const status=box(torso,.16,.018,.012,mat(0x9ff4d4,{emissive:0x2fd39a,emissiveIntensity:.8}),0,.105,-.472);status.castShadow=false;

  // ---- Mast and pan/tilt camera head ----
  const MAST={y:.16,z:.27,h:.12};
  cyl(torso,.025,MAST.h,joint,0,MAST.y+MAST.h/2,MAST.z);
  const pan=new THREE.Group();pan.position.set(0,MAST.y+MAST.h,MAST.z);torso.add(pan);
  cyl(pan,.05,.035,dark,0,.0175,0);
  for(const s of [-1,1])box(pan,.018,.1,.05,dark,s*.1,.06,0);
  const tilt=new THREE.Group();tilt.position.set(0,.085,0);pan.add(tilt);
  box(tilt,.17,.11,.15,mat(0x2a3238,{roughness:.45,metalness:.3}),0,0,0);
  box(tilt,.19,.018,.17,dark,0,.064,.005);
  cyl(tilt,.04,.03,lensRing,-.035,0,.085,'z');cyl(tilt,.032,.012,glass,-.035,0,.1,'z');      // zoom lens
  cyl(tilt,.024,.03,joint,.045,.012,.085,'z');cyl(tilt,.019,.012,mat(0x3b2a12,{roughness:.2,metalness:.5}),.045,.012,.1,'z');   // thermal lens
  const tally=box(tilt,.022,.022,.01,tallyMat,.05,-.03,.077);tally.castShadow=false;
  // CAMERA plates where no bracket can hide them: the back of the head (low views) and its top cap (views from above).
  if(plate&&k.props?.plate){k.props.plate('CAMERA',.14,.045,{parent:tilt,x:0,y:0,z:-.0765,ry:Math.PI,bg:'#10161c',fg:'#e8f6ff'});
    const top=k.props.plate('CAMERA',.15,.05,{parent:tilt,x:0,y:.0745,z:-.01,bg:'#10161c',fg:'#e8f6ff'});top.rotation.set(-Math.PI/2,0,Math.PI);}
  const camera=new THREE.PerspectiveCamera(fov,1,.05,30);camera.position.set(0,0,.1);camera.rotation.y=Math.PI;tilt.add(camera);

  // ---- Legs: hip roll -> hip pitch -> thigh, knee -> shin, foot ----
  const legs=LEGS.map(L=>{
    const hx=L.side*HX,hz=L.end*HZ;
    const roll=new THREE.Group();roll.position.set(hx,0,hz);group.add(roll);
    cyl(roll,.06,.1,joint,-L.side*.035,0,0,'x');
    const hip=new THREE.Group();roll.add(hip);
    box(hip,.075,THIGH,.085,body,0,-THIGH/2,0);
    const knee=new THREE.Group();knee.position.set(0,-THIGH,0);hip.add(knee);
    cyl(knee,.04,.08,joint,0,0,0,'x');
    const shin=box(knee,.045,SHIN,.05,dark,0,-SHIN/2,0);shin.scale.set(1,1,1);
    const foot=add(knee,k.mesh(new THREE.SphereGeometry(FOOT_R+.006,10,8),rubber));foot.position.set(0,-SHIN,0);
    return{...L,hx,hz,roll,hip,knee,foot,world:new THREE.Vector3(),planted:true};
  });

  // ---- Routes ----
  function route(points,{back=false,samples=140}={}){
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
    const length=curve.getLength(),table=[];let prev=null;
    for(let i=0;i<=samples;i++){const u=i/samples,p=curve.getPointAt(u),d=curve.getTangentAt(u);let h=Math.atan2(d.x,d.z)+(back?Math.PI:0);
      if(prev!==null)h=prev+wrap(h-prev);prev=h;table.push({s:length*u,x:p.x,z:p.z,h});}
    return{length,table,at:s=>sample(table,s)};
  }
  function turn([x,z],h0,h1){const dh=wrap(h1-h0),length=Math.abs(dh)*TURN_R,table=[];
    for(let i=0;i<=24;i++){const u=i/24;table.push({s:length*u,x,z,h:h0+dh*u});}
    return{length,table,at:s=>sample(table,s)};}
  function sample(table,s){
    const n=table.length-1,len=table[n].s;if(len<=0)return{...table[0]};
    const f=Math.min(n,Math.max(0,s/len*n)),i=Math.min(n-1,Math.floor(f)),u=f-i,a=table[i],b=table[i+1];
    return{x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,h:a.h+(b.h-a.h)*u};
  }

  // ---- Plan: moves in time order; between and around them the robot stands still ----
  let moves=[],rest={x:0,z:0,h:0};
  function plan(list,restPose=null){moves=list.slice().sort((a,b)=>a.t0-b.t0);rest=restPose||(moves[0]?moves[0].route.at(0):rest);}
  function progress(m,t){
    const total=m.route.length,span=Math.max(1e-6,m.t1-m.t0),tt=Math.min(span,Math.max(0,t-m.t0));
    const e=Math.min(.7,span/2),v=total/(span-e);
    const s=tt<e?v*tt*tt/(2*e):tt>span-e?total-v*(span-tt)*(span-tt)/(2*e):v*e/2+v*(tt-e);
    const speed=tt<=0||tt>=span?0:tt<e?v*tt/e:tt>span-e?v*(span-tt)/e:v;
    return{s:Math.min(total,Math.max(0,s)),speed,v};
  }
  const nominal=(pose,L)=>{const lx=L.side*(HX+FOOT_OUT),lz=L.end*HZ,c=Math.cos(pose.h),sn=Math.sin(pose.h);return[pose.x+lx*c+lz*sn,pose.z-lx*sn+lz*c];};
  function footFor(m,L,s,t){
    const total=m.route.length,PHI=total/CYCLE,phi=s/CYCLE,n=Math.floor(phi+L.o),p=phi+L.o-n;
    const hold=j=>{const ps=j-L.o,pe=ps+DUTY,d=ps<=1e-9?0:pe>=PHI-1e-9?total:(ps+DUTY/2)*CYCLE;return nominal(m.route.at(d),L);};
    if(p<DUTY)return{xz:hold(n),lift:0,planted:true};
    const a=n-L.o+DUTY,b=n+1-L.o,aa=Math.max(a,0);let u=Math.min(1,Math.max(0,(phi-aa)/Math.max(1e-6,b-aa)));
    if(t>m.t1)u+=(1-u)*smooth(m.t1,m.t1+SETTLE,t);
    const A=hold(n),B=hold(n+1),e=u*u*(3-2*u);
    return{xz:[A[0]+(B[0]-A[0])*e,A[1]+(B[1]-A[1])*e],lift:Math.sin(u*Math.PI)*LIFT,planted:u>=1};
  }

  // ---- Leg IK (knees bend backward) ----
  function solve(L,F,pose,H){
    const dx=F[0]-pose.x,dz=F[2]-pose.z,c=Math.cos(pose.h),sn=Math.sin(pose.h);
    const lx=dx*c-dz*sn,lz=dx*sn+dz*c;
    const rx=lx-L.hx,ry=F[1]-H,rz=lz-L.hz;
    const roll=Math.atan2(rx,-ry),v=Math.hypot(rx,ry);L.roll.rotation.z=roll;
    const d=Math.min(THIGH+SHIN-1e-4,Math.max(.05,Math.hypot(rz,v)));
    const phi=Math.atan2(rz,v),alpha=Math.acos(Math.min(1,(THIGH*THIGH+d*d-SHIN*SHIN)/(2*THIGH*d))),beta=Math.acos(Math.min(1,(THIGH*THIGH+SHIN*SHIN-d*d)/(2*THIGH*SHIN)));
    L.hip.rotation.x=alpha-phi;L.knee.rotation.x=-(Math.PI-beta);
  }

  let state={x:0,z:0,h:0,moving:false,speed:0,H:H_STAND,pan:0,tilt:0};
  // dock: 0 standing .. 1 docked (body lowered, feet stay put). aim: world point the head tracks, blended by aimWeight.
  function update(t,{dock=0,aim=null,aimWeight=0,idlePan=0,idleTilt=.28,tally:tallyOn=false}={}){
    let m=null;for(const mv of moves)if(t>=mv.t0)m=mv;
    let pose,speed=0,v=1,s=0;
    if(!m)pose={...rest};else{const P=progress(m,t);s=P.s;speed=P.speed;v=P.v;pose=m.route.at(s);}
    const w=Math.min(1,speed/Math.max(1e-6,v)),phi=s/CYCLE;
    const H=H_STAND+(H_DOCK-H_STAND)*dock-.012*w*(1-Math.cos(phi*Math.PI*4))/2;
    group.position.set(pose.x,0,pose.z);group.rotation.y=pose.h;
    torso.position.y=H+.02;
    for(const L of legs){
      let f;if(!m){const xz=nominal(pose,L);f={xz,lift:0,planted:true};}else f=footFor(m,L,s,t);
      L.world.set(f.xz[0],FOOT_R+f.lift,f.xz[1]);L.planted=f.planted;
      L.roll.position.y=H;solve(L,[L.world.x,L.world.y,L.world.z],pose,H);
    }
    // Head: idle look while walking, then track the aim point.
    let p=idlePan,ti=idleTilt;
    if(aim&&aimWeight>0){
      const c=Math.cos(pose.h),sn=Math.sin(pose.h),my=H+.02+MAST.y+MAST.h+.085;
      const mx=pose.x+MAST.z*sn,mz=pose.z+MAST.z*c,dx=aim[0]-mx,dz=aim[2]-mz,lx=dx*c-dz*sn,lz=dx*sn+dz*c;
      const ap=Math.atan2(lx,lz),at=-Math.atan2(aim[1]-my,Math.hypot(lx,lz));
      p=idlePan+wrap(ap-idlePan)*aimWeight;ti=idleTilt+(at-idleTilt)*aimWeight;
    }
    pan.rotation.y=p;tilt.rotation.x=ti;
    tallyMat.emissiveIntensity=tallyOn?1.2:0;tallyMat.color.set(tallyOn?0xff4b3e:0x3a1512);
    state={x:pose.x,z:pose.z,h:pose.h,moving:speed>1e-4,speed,H,pan:p,tilt:ti};
    return state;
  }
  // Foot targets in root coordinates with a planted flag (for no-slide checks) and how far the drawn foot is from its
  // target (non-zero only if a leg is asked to reach further than it can).
  const tmp=new THREE.Vector3();
  const feet=()=>legs.map(L=>{L.foot.updateWorldMatrix(true,false);L.foot.getWorldPosition(tmp);root.worldToLocal(tmp);
    return{x:L.world.x,y:L.world.y,z:L.world.z,planted:L.planted,reachError:tmp.distanceTo(L.world)};});
  return{group,torso,head:tilt,pan,camera,route,turn,plan,update,feet,get state(){return state;},
    dims:{length:.9,width:.36,standHeight:H_STAND,dockHeight:H_DOCK,eye:H_STAND+.02+MAST.y+MAST.h+.085}};
}
