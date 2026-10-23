// Shared exhibit actors. A stylised worker with a planted-foot walk: foot phase is driven by distance walked, not
// time, and each stance foot moves backwards at exactly body speed, so feet never slide. Legs are solved with
// two-bone IK. Robots and drones live in lab/rigs/.
export function createActors(k){
  const {THREE,root,mat}=k;
  const THIGH=.44,SHIN=.44,ANKLE=.075,CYCLE=.92,STANCE=.62,LIFT=.11;
  // Pelvis height from leg reach: nearly straight standing (reach .993), a little less at full stride, and low enough
  // that a foot at the end of the stride still reaches the ground. HIP is the standing height.
  const hipFor=w=>{const R=(THIGH+SHIN)*(.993-.02*w),half=CYCLE*STANCE/2*w;return Math.sqrt(R*R-half*half)+ANKLE+.02;},HIP=hipFor(0);

  function person({vest=0xff7a1a,shirt=0x2b4b6b,pants=0x1f2a36,helmet=0xf4f4f0,skin=0xd6a27e,scale=1,name='person'}={}){
    const group=new THREE.Group();group.name=name;group.scale.setScalar(scale);root.add(group);
    const at=(parent,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
    const pelvis=at(group,0,HIP,0);
    const hips=k.box(.32,.16,.19,mat(pants),0,0,0);pelvis.add(hips);hips.position.set(0,.02,0);
    const torso=at(pelvis,0,.06,0);
    const chest=k.box(.36,.5,.21,mat(shirt,{roughness:.8}),0,0,0);torso.add(chest);chest.position.set(0,.27,0);
    const vestMat=mat(vest,{emissive:vest,emissiveIntensity:.12,roughness:.7});
    const vestMesh=k.box(.375,.36,.225,vestMat,0,0,0);torso.add(vestMesh);vestMesh.position.set(0,.3,0);
    for(const y of [.2,.34]){const band=k.box(.38,.035,.23,mat(0xe8eef0,{emissive:0x8a9599,emissiveIntensity:.3}),0,0,0);torso.add(band);band.position.set(0,y,0);}
    const neck=at(torso,0,.56,0);
    const head=at(neck,0,.06,0);
    const face=k.mesh(new THREE.SphereGeometry(.105,14,10),mat(skin,{roughness:.8}));head.add(face);face.position.set(0,.1,0);face.scale.set(.92,1.08,.98);
    const hat=k.mesh(new THREE.SphereGeometry(.122,14,8,0,Math.PI*2,0,Math.PI/2),mat(helmet,{roughness:.4}));head.add(hat);hat.position.set(0,.14,0);
    const brim=k.mesh(new THREE.CylinderGeometry(.15,.15,.018,16),mat(helmet,{roughness:.4}));head.add(brim);brim.position.set(0,.145,.025);
    const legs=[],arms=[];
    for(const side of [-1,1]){
      const hip=at(pelvis,side*.095,-.02,0);
      const thigh=k.box(.13,THIGH,.14,mat(pants),0,0,0);hip.add(thigh);thigh.position.set(0,-THIGH/2,0);
      const knee=at(hip,0,-THIGH,0);
      const shin=k.box(.115,SHIN,.12,mat(pants),0,0,0);knee.add(shin);shin.position.set(0,-SHIN/2,0);
      const ankle=at(knee,0,-SHIN,0);
      const boot=k.box(.12,.09,.24,mat(0x2a2018,{roughness:.9}),0,0,0);ankle.add(boot);boot.position.set(0,-.03,.05);
      legs.push({side,hip,knee,ankle});
      const shoulder=at(torso,side*.235,.5,0);
      const upper=k.box(.095,.3,.1,mat(shirt,{roughness:.8}),0,0,0);shoulder.add(upper);upper.position.set(0,-.15,0);
      const elbow=at(shoulder,0,-.3,0);
      const fore=k.box(.085,.27,.09,mat(shirt,{roughness:.8}),0,0,0);elbow.add(fore);fore.position.set(0,-.135,0);
      const hand=k.mesh(new THREE.SphereGeometry(.05,8,6),mat(skin,{roughness:.8}));elbow.add(hand);hand.position.set(0,-.3,0);
      arms.push({side,shoulder,elbow});
    }
    // Two-bone IK in the sagittal plane (forward = +z local, up = +y). Foot target relative to the hip joint.
    function solve(leg,fz,fy){
      const d=Math.min(THIGH+SHIN-1e-4,Math.max(.05,Math.hypot(fz,fy)));
      const phi=Math.atan2(fz,-fy),alpha=Math.acos(Math.min(1,(THIGH*THIGH+d*d-SHIN*SHIN)/(2*THIGH*d))),beta=Math.acos(Math.min(1,(THIGH*THIGH+SHIN*SHIN-d*d)/(2*THIGH*SHIN)));
      leg.hip.rotation.x=-(phi+alpha);leg.knee.rotation.x=Math.PI-beta;leg.ankle.rotation.x=-(leg.hip.rotation.x+leg.knee.rotation.x);
    }
    // distance: metres walked along the path; weight: 0 standing .. 1 full stride; look: head pitch (+ = down);
    // lean: torso pitch (+ = forward); point: 0..1 raises the right arm to point forward and down; pointPitch: how far
    // the pointing arm lifts (radians, .9 = forward and down, about 2.4 = up at something overhead).
    function pose({distance=0,weight=1,look=0,turn=0,lean=0,point=0,pointPitch=.9}={}){
      const w=Math.max(0,Math.min(1,weight)),stride=CYCLE*STANCE,half=stride/2;
      const hipY=hipFor(w)-.014*w*Math.abs(Math.sin(distance/CYCLE*Math.PI*2));pelvis.position.y=hipY;
      for(const leg of legs){
        const p=((distance/CYCLE+(leg.side>0?.5:0))%1+1)%1;let fz,lift=0;
        if(p<STANCE){fz=half-(p/STANCE)*stride;}else{const u=(p-STANCE)/(1-STANCE);fz=-half+(u*u*(3-2*u))*stride;lift=Math.sin(u*Math.PI)*LIFT;}
        solve(leg,fz*w,(ANKLE+lift*w)-(hipY-.02));
      }
      for(const arm of arms){const p=distance/CYCLE*Math.PI*2+(arm.side>0?0:Math.PI),pt=arm.side<0?Math.max(0,Math.min(1,point)):0;
        arm.shoulder.rotation.x=Math.sin(p)*.42*w*(1-pt)-pointPitch*pt;arm.elbow.rotation.x=(-.18-.2*w*Math.max(0,Math.sin(p)))*(1-pt)-.05*pt;arm.shoulder.rotation.z=arm.side*(.06+.1*pt);}
      torso.rotation.x=lean;head.rotation.x=look;neck.rotation.y=turn;
    }
    pose();
    return{group,pose,head};
  }

  // Deterministic path motion: position on a polyline (root coordinates) at time t, easing in and out over t0..t1.
  // Returns the distance walked (drives the planted-foot walk), whether it is moving, and the stride weight.
  function followPath(object,points,t0,t1,t,{ease=.6}={}){
    const segs=[];let total=0;
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);segs.push({a,b,len,start:total});total+=len;}
    const span=Math.max(1e-6,t1-t0),u=Math.min(1,Math.max(0,(t-t0)/span));
    // Trapezoid velocity profile: accelerate over `ease` s, cruise, decelerate. Distance is its integral.
    const e=Math.min(ease,span/2),v=total/(span-e),tt=u*span;
    let s=tt<e?v*tt*tt/(2*e):tt>span-e?total-v*(span-tt)*(span-tt)/(2*e):v*e/2+v*(tt-e);s=Math.min(total,Math.max(0,s));
    let seg=segs[0];for(const g of segs)if(s>=g.start-1e-9)seg=g;
    const f=seg.len>0?(s-seg.start)/seg.len:0;
    object.position.set(seg.a[0]+(seg.b[0]-seg.a[0])*f,seg.a[1]+(seg.b[1]-seg.a[1])*f,seg.a[2]+(seg.b[2]-seg.a[2])*f);
    object.rotation.y=Math.atan2(seg.b[0]-seg.a[0],seg.b[2]-seg.a[2]);
    const speed=tt<e?v*tt/e:tt>span-e?v*(span-tt)/e:v;
    return{distance:s,total,moving:u>0&&u<1,done:u>=1,started:t>=t0,weight:Math.min(1,speed/Math.max(1e-6,v)*1.4),heading:object.rotation.y};
  }
  return{person,followPath};
}
