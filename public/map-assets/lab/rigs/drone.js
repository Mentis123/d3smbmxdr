// Generic inspection quadcopter for lab exhibits: body, four arms, spinning props, a two-axis gimbal camera and
// landing skids. Everything is a pure function of time: flight is a deterministic path (Catmull-Rom through the
// given points, trapezoid speed profile), prop angle is the integral of a spin-up / spin-down window, so seeking
// to any t reproduces the same pose. Forward is local +z (the gimbal looks along it); the group's yaw is set by
// the caller, so a drone can crab sideways along a line with its camera on the asset, as inspection drones do.
//
//   const drone=createDrone(k,{size:1});
//   drone.update(t,{spinOn:.6,spinOff:26,yaw:0});              // props + hover bob
//   const f=drone.fly([[x,y,z],...],t0,t1,t);                 // position along the path, tilts into the motion
//   drone.aim(worldPoint,u);                                    // gimbal toward a point (u 0..1 blend from rest)
//   drone.lensPose(camera);                                     // put a sensor camera at the lens, looking out of it
export function createDrone(k,{size=1,body=0xe9edf0,accent=0xf2b134,arms=0x2a3238,name='drone',parent}={}){
  const {THREE,root,mat,track}=k;
  const group=new THREE.Group();group.name=name;(parent||root).add(group);
  const frame=new THREE.Group();group.add(frame);              // tilts with motion; group carries position + yaw
  const s=size,add=(p,o,x=0,y=0,z=0)=>{p.add(o);o.position.set(x,y,z);return o;};
  const shell=mat(body,{roughness:.35,metalness:.15}),armM=mat(arms,{roughness:.5,metalness:.35}),trim=mat(accent,{roughness:.5});
  const motorM=mat(0x1b2126,{metalness:.6,roughness:.35}),bladeM=mat(0x20262b,{roughness:.6});
  // Body: a rounded shell over a darker battery bay.
  const hull=k.mesh(new THREE.SphereGeometry(.13*s,20,12),shell);hull.scale.set(1,.42,1.45);add(frame,hull,0,.02*s,0);
  add(frame,k.box(.17*s,.05*s,.3*s,armM,0,0,0),0,-.02*s,-.01*s);
  add(frame,k.box(.12*s,.012*s,.2*s,trim,0,0,0),0,.075*s,-.04*s);
  // Arms on the diagonals, motors and two-blade props at the tips. Blur discs fade in with prop speed.
  const R=.27*s,props=[];
  const discGeo=track(new THREE.CircleGeometry(.12*s,28));discGeo.rotateX(-Math.PI/2);
  const discM=mat(0xcfd8dd,{transparent:true,opacity:0,depthWrite:false,roughness:.9,side:THREE.DoubleSide});
  for(let i=0;i<4;i++){
    const a=Math.PI/4+i*Math.PI/2,x=Math.sin(a)*R,z=Math.cos(a)*R;
    const arm=k.box(R*1.02,.022*s,.03*s,armM,0,0,0);add(frame,arm,x/2,.005*s,z/2);arm.rotation.y=a-Math.PI/2;
    add(frame,k.cylinder(.028*s,.05*s,motorM,0,0,0),x,.03*s,z);
    add(frame,k.box(.012*s,.012*s,.012*s,mat(i<2?0x7cff9a:0xff5a4a,{emissive:i<2?0x2fd05a:0xd8261a,emissiveIntensity:.9}),0,0,0),x*1.08,-.01*s,z*1.08);
    const hub=new THREE.Group();add(frame,hub,x,.062*s,z);
    for(const sgn of [-1,1]){const b=k.box(.115*s,.004*s,.022*s,bladeM,0,0,0);add(hub,b,sgn*.06*s,0,0);b.rotation.x=sgn*.18;}
    add(hub,k.cylinder(.012*s,.02*s,motorM,0,0,0),0,.008*s,0);
    const disc=k.mesh(discGeo,discM);add(hub,disc,0,.004*s,0);disc.castShadow=false;
    props.push({hub,disc,dir:i%2?1:-1});
  }
  // Landing skids: two legs per side down to a rail.
  for(const sx of [-1,1]){
    for(const sz of [-1,1]){const l=k.bar([sx*.07*s,-.03*s,sz*.07*s],[sx*.1*s,-.15*s,sz*.08*s],.007*s,armM);frame.add(l);l.position.sub(new THREE.Vector3());}
    const rail=k.box(.014*s,.014*s,.26*s,armM,0,0,0);add(frame,rail,sx*.1*s,-.152*s,0);
  }
  // Gimbal under the nose: yaw yoke, pitch cradle, camera with lens along local +z.
  const yoke=new THREE.Group();add(frame,yoke,0,-.05*s,.14*s);
  add(yoke,k.box(.06*s,.03*s,.03*s,armM,0,0,0),0,-.005*s,0);
  const pitch=new THREE.Group();add(yoke,pitch,0,-.05*s,0);
  for(const sx of [-1,1])add(pitch,k.box(.01*s,.06*s,.03*s,armM,0,0,0),sx*.045*s,.02*s,0);
  const cam=k.mesh(new THREE.SphereGeometry(.04*s,16,10),mat(0x30383e,{metalness:.4,roughness:.35}));add(pitch,cam,0,0,0);
  const lensRing=k.cylinder(.024*s,.03*s,mat(0xc9d2d7,{metalness:.7,roughness:.3}),0,0,0);add(pitch,lensRing,0,0,.035*s);lensRing.rotation.x=Math.PI/2;
  const glass=k.cylinder(.018*s,.01*s,mat(0x0a1720,{metalness:.8,roughness:.08}),0,0,0);add(pitch,glass,0,0,.05*s);glass.rotation.x=Math.PI/2;
  const lens=new THREE.Object3D();add(pitch,lens,0,0,.06*s);
  // Small antenna mast on the back: where the upload leaves from.
  add(frame,k.cylinder(.004*s,.07*s,armM,0,0,0),0,.1*s,-.12*s);
  const antenna=new THREE.Object3D();add(frame,antenna,0,.14*s,-.12*s);

  const v=new THREE.Vector3(),w=new THREE.Vector3(),q=new THREE.Quaternion();
  const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
  // Prop angle = integral of speed: ramp up over 0.6 s after spinOn, down over 1.2 s after spinOff.
  const RATE=38,UP=.6,DOWN=1.2;
  const spinAngle=(t,on,off)=>{
    const ramp=(x,d)=>x<=0?0:x<d?x*x/(2*d):d/2+(x-d);   // integral of a linear ramp to 1, then 1
    return RATE*(ramp(t-on,UP)-ramp(t-off,DOWN));};
  const spinSpeed=(t,on,off)=>Math.max(0,Math.min(1,(t-on)/UP))-Math.max(0,Math.min(1,(t-off)/DOWN));

  // Path flight. Returns {position, moving, done, speed (0..1 of cruise)}. Sets group.position; tilt goes on frame.
  const curves=new Map();
  function curveFor(points){const key=points.map(p=>p.join(',')).join(';');let c=curves.get(key);if(!c){c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');c.arcLengthDivisions=400;c.updateArcLengths();curves.set(key,c);}return c;}
  let tiltDir=new THREE.Vector3(),tiltAmt=0;
  function fly(points,t0,t1,t,{ease=.9}={}){
    const c=curveFor(points),total=c.getLength(),span=Math.max(1e-6,t1-t0),tt=Math.min(span,Math.max(0,t-t0));
    const e=Math.min(ease,span/2),vmax=total/(span-e);
    let d=tt<e?vmax*tt*tt/(2*e):tt>span-e?total-vmax*(span-tt)*(span-tt)/(2*e):vmax*e/2+vmax*(tt-e);d=Math.min(total,Math.max(0,d));
    const u=total>0?d/total:0;c.getPointAt(u,group.position);
    const speed=tt<e?tt/e:tt>span-e?(span-tt)/e:1,moving=t>t0&&t<t1;
    c.getTangentAt(Math.min(.999,Math.max(.001,u)),tiltDir);tiltDir.y=0;
    // Lean into acceleration and cruise, level off when stopping: forward lean follows speed, brief flare at the end.
    const flare=tt>span-e?.5*Math.sin(Math.PI*(1-(span-tt)/e)):0;
    tiltAmt=moving?.2*speed-.12*flare:0;
    return{position:group.position,moving,done:t>=t1,started:t>=t0,speed:moving?speed:0,u};
  }
  // Props, hover bob, yaw and the motion tilt. Call after fly() (or after setting group.position for a hover).
  function update(t,{spinOn=0,spinOff=1e9,yaw=0,bob=1}={}){
    const sp=spinSpeed(t,spinOn,spinOff),ang=spinAngle(t,spinOn,spinOff);
    for(const p of props){p.hub.rotation.y=p.dir*ang;p.disc.material.opacity=.32*sp*sp;p.disc.visible=sp>.15;}
    const air=sp>.5?1:0;group.position.y+=bob*air*(.012*s*Math.sin(t*2.1)+.006*s*Math.sin(t*3.7+1));
    group.rotation.set(0,yaw,0);
    // Tilt toward the direction of travel, in the drone's own frame.
    frame.quaternion.identity();
    if(tiltAmt&&tiltDir.lengthSq()>1e-8){w.copy(tiltDir).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),-yaw);v.set(w.z,0,-w.x);q.setFromAxisAngle(v.normalize(),tiltAmt);frame.quaternion.copy(q);}
    tiltAmt=0;
    return sp;
  }
  // Point the gimbal at a world point; u blends from the rest pose (straight ahead, pitched down a little).
  const REST_PITCH=.35;
  function aim(point,u=1,{restPitch=REST_PITCH}={}){
    group.updateWorldMatrix(true,true);
    const local=yoke.worldToLocal(v.copy(point));
    const yawT=Math.atan2(local.x,local.z),pitchT=Math.atan2(-local.y-.05*s,Math.hypot(local.x,local.z));
    yoke.rotation.set(0,yawT*u,0);pitch.rotation.set(restPitch+(pitchT-restPitch)*u,0,0);
    group.updateWorldMatrix(true,true);
  }
  function lensPose(camera,lookAt){
    lens.getWorldPosition(camera.position);
    if(lookAt)camera.lookAt(lookAt);
    else{lens.getWorldQuaternion(q);camera.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));}
    camera.updateMatrixWorld();
  }
  return{group,frame,gimbal:{yoke,pitch},lens,antenna,fly,update,aim,lensPose};
}
