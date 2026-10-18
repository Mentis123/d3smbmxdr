import * as THREE from 'three';
import {LAYOUT} from './scene-layout.js';
import {makeBatch,metal} from './builder-utils.js';

export function buildElectrical(world){
  const group=new THREE.Group();group.name='electrical-yard';world.root.add(group);
  const batch=makeBatch(group,'yard'),steel=metal(0x889aa4),dark=metal(0x273b45,.62),copper=metal(0x92745c),porcelain=metal(0xa6c0bc,.24,.12),concrete=metal(0x65716f,.95,0),gravel=metal(0x434e50,.96,0),
    transformerPaint=[metal(0x46575a,.68,.28),metal(0x5a625b,.72,.2),metal(0x4a5558,.65,.25)],radiatorPaint=metal(0x748186,.75,.25);
  const signal=new THREE.MeshBasicMaterial({color:0xffb46a,toneMapped:false}),cyan=new THREE.MeshBasicMaterial({color:0x40d9ff,toneMapped:false});
  const {x,z,w,d,y}=LAYOUT.yard;
  batch.box(x,y-.10,z,w,.32,d,concrete);batch.box(x,y+.05,z,w-.12,.025,d-.12,gravel);
  // Individual cooling banks and porcelain bushings remain visible in the close view.
  const transformers=[];
  function insulator(px,py,pz,h=.26){batch.cylinder(px,py+h/2,pz,.016,.016,h,copper,8);for(let k=0;k<5;k++)batch.cylinder(px,py+.035+k*h/5,pz,.045,.045,.021,porcelain,10);}
  for(let i=0;i<3;i++){
    const px=x-1.13+i*1.13,pz=z+1.03;
    batch.box(px,y+.12,pz,.86,.18,.69,concrete);batch.box(px,y+.43,pz,.55,.52,.43,transformerPaint[i]);batch.box(px,y+.72,pz,.6,.08,.49,steel);
    for(const side of [-1,1])for(let j=0;j<8;j++)batch.box(px+side*.36,y+.43,pz-.25+j*.07,.075,.37,.025,(j+i)%3===0?steel:radiatorPaint);
    for(const off of [-.18,0,.18])insulator(px+off,y+.76,pz,.33);
    batch.cylinder(px+.27,y+.76,pz-.18,.11,.11,.23,dark);batch.box(px,y+.56,pz+.225,.13,.10,.014,signal);
    // Small oil sight glass and paired conduit risers add readable service detail.
    batch.box(px-.23,y+.47,pz+.222,.055,.10,.012,signal);
    for(const side of [-1,1]){batch.beam([px+side*.22,y+.48,pz+.24],[px+side*.22,y+.79,pz+.24],.009,copper,5);batch.box(px+side*.22,y+.80,pz+.24,.035,.025,.035,steel);}
    transformers.push({x:px,z:pz,base:y+.03,top:y+1.09});
  }
  for(let row=0;row<2;row++)for(let i=0;i<3;i++){
    const px=x-1.15+i*1.15,pz=z-.34-row*.83;
    batch.box(px,y+.08,pz,.48,.1,.4,concrete);
    for(const off of [-.14,.14]){batch.cylinder(px+off,y+.31,pz,.035,.04,.43,steel,8);insulator(px+off,y+.48,pz,.40);}
    batch.beam([px-.18,y+.94,pz],[px+.24,y+1.03,pz],.021,copper);
    batch.box(px+.23,y+.28,pz,.14,.33,.21,dark);
  }
  for(const pz of [z-.35,z-1.18]){
    for(const px of [x-1.55,x+1.55]){batch.beam([px,y,pz],[px,y+1.64,pz],.031,steel);batch.beam([px,y+.2,pz],[px+(px<x?.28:-.28),y+1.54,pz],.018,steel);}
    batch.beam([x-1.55,y+1.64,pz],[x+1.55,y+1.64,pz],.03,steel);
    for(const px of [x-1.15,x,x+1.15]){insulator(px,y+1.20,pz,.35);batch.beam([px,y+.94,pz],[px,y+1.18,pz],.021,copper);}
  }
  // Low perimeter fence; front gate gives the access road an actual opening.
  for(const sx of [-1,1])for(let k=0;k<=10;k++){const pz=z-d/2+k*d/10;batch.beam([x+sx*w/2,y+.04,pz],[x+sx*w/2,y+.57,pz],.012,steel,5);}
  for(const zz of [z-d/2,z+d/2])for(let k=0;k<=11;k++){const px=x-w/2+k*w/11;if(zz>z&&Math.abs(px-x)<.48)continue;batch.beam([px,y+.04,zz],[px,y+.57,zz],.012,steel,5);}
  for(const yy of [y+.22,y+.48]){
    for(const sx of [-1,1])batch.beam([x+sx*w/2,yy,z-d/2],[x+sx*w/2,yy,z+d/2],.009,steel,5);
    batch.beam([x-w/2,yy,z-d/2],[x+w/2,yy,z-d/2],.009,steel,5);
    for(const sx of [-1,1])batch.beam([x+sx*.48,yy,z+d/2],[x+sx*w/2,yy,z+d/2],.009,steel,5);
  }
  const pylons=[];
  for(const [px,pz,ph]of [[4.7,-3.15,2.7],[6.65,-2.75,2.95],[8.8,-2.75,2.7]]){
    const ground=world.height(px,pz)+.02,levels=[0,.62,1.22,1.83,ph],widths=[.43,.32,.22,.15,.08];
    for(const sx of [-1,1])for(const sz of [-1,1]){
      batch.box(px+sx*.43,ground+.04,pz+sz*.43,.18,.10,.18,concrete);
      for(let j=0;j<levels.length-1;j++){
        const a=[px+sx*widths[j],ground+levels[j],pz+sz*widths[j]],b=[px+sx*widths[j+1],ground+levels[j+1],pz+sz*widths[j+1]];batch.beam(a,b,.019,steel);
        batch.beam(a,[px-sx*widths[j+1],ground+levels[j+1],pz+sz*widths[j+1]],.012,steel);
        batch.beam(a,[px+sx*widths[j+1],ground+levels[j+1],pz-sz*widths[j+1]],.012,steel);
      }
    }
    const attachment=[];
    for(const off of [-.63,0,.63]){
      const yy=ground+ph-(off===0?.06:.40);batch.beam([px,yy,pz],[px,yy,pz+off],.026,steel);
      insulator(px,yy-.24,pz+off,.22);attachment.push([px,yy-.24,pz+off]);
    }
    pylons.push({x:px,z:pz,ground,top:ground+ph,attachment});
  }
  const cable=metal(0x374c59,.75,.3),wireChecks=[];
  function wire(a,b,sag){const middle=new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5);middle.y-=sag;const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(...a),middle,new THREE.Vector3(...b)]);batch.geometry(new THREE.TubeGeometry(curve,32,.012,4,false),cable);wireChecks.push({a,b,sag,lowest:Math.min(...curve.getPoints(64).map(p=>p.y)),sampledEndpoints:[curve.getPoint(0).toArray(),curve.getPoint(1).toArray()]});}
  for(let i=0;i<2;i++)for(let phase=0;phase<3;phase++)wire(pylons[i].attachment[phase],pylons[i+1].attachment[phase],.24);
  for(let phase=0;phase<3;phase++)wire(pylons[2].attachment[phase],[x-1.15+phase*1.15,y+1.55,z-1.18],.18);
  for(const [px,pz]of [[x-1.6,z+1.52],[x+1.6,z+1.52],[x+1.6,z-1.55]]){
    batch.beam([px,y,pz],[px,y+1.10,pz],.021,steel);batch.box(px,y+1.12,pz,.17,.08,.12,signal);
  }
  batch.box(x+1.51,y+.12,z+1.35,.07,.04,.05,cyan);
  const result=batch.finish();world.stats.electrical={transformers:transformers.length,pylons:pylons.length,wires:wireChecks.length,...result};
  world.electricalDiagnostics=()=>({yard:LAYOUT.yard,transformers,pylons,wires:wireChecks});
}
