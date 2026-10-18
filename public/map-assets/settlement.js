import * as THREE from 'three';
import {rearZ} from './hydro-profile.js';
import {LAYOUT} from './scene-layout.js';
import {makeBatch,metal} from './builder-utils.js';

// Rear settlement and inlet crossing, modelled as compact repeated concrete forms.
export function buildSettlement(world){
  const {root}=world;
  const concrete=[0x929b9b,0xa6aaa6,0x858f92,0xb2b2aa,0x777f80,0xb0a89c].map(c=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).multiplyScalar(.74),roughness:.84}));
  const foundation=metal(0x626f75,.72,.18),parapet=metal(0x293943,.63,.38),roofPlant=metal(0x65747a,.58,.42);
  // Lit units vary the way a real block does at night: a few bright, most mid or dim behind curtains,
  // the odd cool screen. Index 0-2 keep their original warm hues so other parts that borrow them match.
  const windowMats=[[0xffbd68,1.4],[0xffd596,1.15],[0xffa94f,.95],[0xffc982,.55],[0xf2a35a,.38],[0xa9cdff,.62]]
    .map(([color,i])=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:i,roughness:.4}));
  // Unlit panes are glass, not holes: dark, glossy and reflective, so they pick up the environment and sky.
  const darkWindow=new THREE.MeshStandardMaterial({color:0x40566a,roughness:.14,metalness:.55,emissive:0x1d3346,emissiveIntensity:1,envMapIntensity:2});
  const trim=metal(0x66747a,.7,.24),canopy=metal(0x354a53,.52,.46);
  const batch=makeBatch(root,'settlement');
  const buildings=[
    {x:1.34,z:-5.86,w:.66,d:.48,h:1.02,seed:1},
    {x:2.08,z:-5.93,w:.72,d:.53,h:1.73,seed:2},
    {x:2.91,z:-5.82,w:.58,d:.48,h:.84,seed:3},
    {x:3.60,z:-5.79,w:.57,d:.47,h:1.32,seed:4},
    {x:1.58,z:-5.02,w:.59,d:.50,h:.72,seed:5},
    {x:2.27,z:-5.03,w:.60,d:.49,h:2.16,seed:6},
    {x:2.98,z:-5.01,w:.67,d:.52,h:1.12,seed:7},
    {x:3.68,z:-4.99,w:.50,d:.50,h:1.82,seed:8},
    {x:2.02,z:-4.22,w:.57,d:.44,h:.95,seed:9},
    {x:2.70,z:-4.22,w:.58,d:.46,h:1.48,seed:10},
  ];
  for(const b of buildings){b.z=rearZ(b.z);b.x=2.6+(b.x-2.6)*1.9;b.w*=1.12;b.h*=b.h>1.6?1.22:1;}
  for(const b of buildings){
    const ground=Math.min(...[-1,1].flatMap(sx=>[-1,1].map(sz=>world.height(b.x+sx*(b.w/2+.05),b.z+sz*(b.d/2+.05)))))-.025,baseTop=2.0,baseH=Math.max(.05,baseTop-ground),top=baseTop+b.h;
    // Each plinth fills the small terrain relief under the fixed town datum.
    batch.box(b.x,(ground+baseTop)/2,b.z,b.w+.10,baseH,b.d+.10,foundation);
    const facade=concrete[(b.seed*7)%concrete.length];
    const bodyH=b.h*(b.h>1.6?.62:b.h>1?.68:.56),bodyTop=baseTop+bodyH;
    const sections=[{x:b.x,z:b.z,w:b.w,d:b.d,y0:baseTop,y1:bodyTop}];
    if(b.h>1.6){
      sections.push({x:b.x+(b.seed%2?.025:-.025),z:b.z-.015,w:b.w*.78,d:b.d*.78,y0:bodyTop,y1:top});
    } else if(b.h>1){
      sections.push({x:b.x+(b.seed%2?-.018:.018),z:b.z+.01,w:b.w*.84,d:b.d*.82,y0:bodyTop,y1:top});
    } else {
      sections.push({x:b.x,z:b.z,w:b.w*.56,d:b.d*.68,y0:bodyTop,y1:top});
      const wingTop=top-.08;
      for(const side of [-1,1])sections.push({x:b.x+side*b.w*.38,z:b.z+side*.012,w:b.w*.24,d:b.d*.82,y0:bodyTop,y1:wingTop});
    }
    const roofMass=sections.reduce((highest,s)=>s.y1>highest.y1?s:highest,sections[0]);
    for(const s of sections){
      batch.box(s.x,(s.y0+s.y1)/2,s.z,s.w,s.y1-s.y0,s.d,facade);
      const midY=(s.y0+s.y1)/2;
      for(const side of [-1,1]){
        batch.box(s.x,midY,s.z+side*(s.d/2-.009),.018,s.y1-s.y0-.025,.018,trim);
        for(const edge of [-1,1])batch.box(s.x+edge*(s.w/2-.009),midY,s.z+side*(s.d/2-.009),.018,s.y1-s.y0-.025,.018,trim);
        batch.box(s.x+side*(s.w/2-.009),midY,s.z,.018,s.y1-s.y0-.025,.018,trim);
      }
      const floors=Math.max(1,Math.floor((s.y1-s.y0)/.27)),colsFront=Math.max(1,Math.floor(s.w/.19)),colsSide=Math.max(1,Math.floor(s.d/.19));
      const rowH=(s.y1-s.y0)/floors,wh=Math.min(.11,rowH*.48),wwFront=Math.min(.074,s.w/(colsFront+1)*.46),wwSide=Math.min(.072,s.d/(colsSide+1)*.46);
      function pane(x,y,z,wide,tall,axis,faceSign,lit){
        const depth=.012,px=axis==='front'?wide:depth,pz=axis==='front'?depth:wide;
        if(axis==='front')z+=faceSign*.005;else x+=faceSign*.005;
        batch.box(x,y,z,px,tall,pz,darkWindow);
        if(lit){
          const warmMat=windowMats[(b.seed*3+Math.round(y*10)+Math.round(x*10)*7)%windowMats.length];
          if(axis==='front')z+=faceSign*.005;else x+=faceSign*.005;
          batch.box(x,y,z,px*.64,tall*.58,pz*.40,warmMat);
        }
      }
      // Floor-slab bands read storeys and break the flat slab faces.
      for(let row=1;row<floors;row++){
        const by=s.y0+row*rowH,proud=.008,bh=.014;
        for(const side of [-1,1]){
          batch.box(s.x,by,s.z+side*(s.d/2+proud/2),s.w+proud*2,bh,proud,trim);
          batch.box(s.x+side*(s.w/2+proud/2),by,s.z,proud,bh,s.d,trim);
        }
      }
      for(let row=0;row<floors;row++){
        const wy=s.y0+(row+.5)*rowH;
        for(let col=0;col<colsFront;col++){
          const wx=s.x+(col-(colsFront-1)/2)*(s.w*.78)/Math.max(1,colsFront-1),lit=(b.seed*13+row*7+col*11)%7<3;
          for(const side of [-1,1])pane(wx,wy,s.z+side*s.d/2,wwFront,wh,'front',side,lit&&side===1);
        }
        for(let col=0;col<colsSide;col++){
          const wz=s.z+(col-(colsSide-1)/2)*(s.d*.72)/Math.max(1,colsSide-1),lit=(b.seed*5+row*3+col*7)%9<3;
          for(const side of [-1,1])pane(s.x+side*s.w/2,wy,wz,wwSide,wh,'side',side,lit&&side===1);
        }
      }
    }
    batch.box(roofMass.x,top+.035,roofMass.z,roofMass.w,.07,roofMass.d,parapet);
    // Roof lip follows the uppermost footprint so stepped towers have a grounded crown.
    const lip=.024;
    for(const [x,z,w,d] of [
      [roofMass.x,roofMass.z-roofMass.d/2+lip/2,roofMass.w,lip],
      [roofMass.x,roofMass.z+roofMass.d/2-lip/2,roofMass.w,lip],
      [roofMass.x-roofMass.w/2+lip/2,roofMass.z,lip,roofMass.d],
      [roofMass.x+roofMass.w/2-lip/2,roofMass.z,lip,roofMass.d],
    ])batch.box(x,top+.105,z,w,.14,d,parapet);
    // Facade pilasters and a shallow entry canopy break up the repeated block forms.
    batch.box(b.x,baseTop+.14,b.z+b.d/2-.055,Math.min(.22,b.w*.48),.025,.09,canopy);
    batch.box(b.x,baseTop+.095,b.z+b.d/2-.055,.012,.08,.012,trim);
    // Distinct rooftop plant, water tank, or antenna silhouettes.
    const acx=roofMass.x-roofMass.w*.19, acz=roofMass.z+roofMass.d*.17;
    if(b.seed%3===0){
      batch.cylinder(acx,top+.20,acz,Math.min(roofMass.w,roofMass.d)*.20,Math.min(roofMass.w,roofMass.d)*.20,.22,roofPlant,10);
      batch.cylinder(acx,top+.32,acz,.012,.012,.10,trim,7);
    } else {
      batch.box(acx,top+.16,acz,roofMass.w*.30,.11,roofMass.d*.32,roofPlant);
      batch.box(acx,top+.235,acz,roofMass.w*.17,.05,roofMass.d*.18,parapet);
    }
    if(b.seed%2===0){
      batch.cylinder(roofMass.x+roofMass.w*.22,top+.23,roofMass.z-roofMass.d*.18,.018,.018,.24,roofPlant,7);
      batch.cylinder(roofMass.x+roofMass.w*.22,top+.37,roofMass.z-roofMass.d*.18,.035,.035,.035,windowMats[1],7);
    }
  }

  // Town terrace: a levelled, paved platform with retaining walls, kerbed edge, two streets with
  // dashed centre lines, a few street lamps and parked cars for scale. Before this the towers stood on
  // storey-high pedestals in the grass with no streets between them.
  {
    const t=LAYOUT.townTerrace,cx=(t.x0+t.x1)/2,cz=(t.z0+t.z1)/2,w=t.x1-t.x0,d=t.z1-t.z0;
    let low=Infinity;for(let i=0;i<=12;i++)for(let j=0;j<=8;j++)low=Math.min(low,world.height(t.x0+w*i/12,t.z0+d*j/8));
    const bottom=low-.04,kerb=.03,paveH=.012;
    const asphalt=new THREE.MeshStandardMaterial({color:0x232a2f,roughness:.86,metalness:.05});
    const paint=new THREE.MeshStandardMaterial({color:0xc9c6b4,roughness:.7,emissive:0x2a2920,emissiveIntensity:.5});
    const carMats=[0x8a1f22,0xd8d8d2,0x26313a,0x2f5a7a].map(c=>metal(c,.32,.55));
    batch.box(cx,(bottom+t.top-paveH)/2,cz,w,t.top-paveH-bottom,d,foundation);
    batch.box(cx,t.top-paveH/2,cz,w-kerb*2,paveH,d-kerb*2,asphalt);
    for(const [x,z,ww,dd] of [[cx,t.z0+kerb/2,w,kerb],[cx,t.z1-kerb/2,w,kerb],[t.x0+kerb/2,cz,kerb,d],[t.x1-kerb/2,cz,kerb,d]])batch.box(x,t.top-paveH/2+.004,z,ww,paveH+.008,dd,trim);
    let parked=0,lamps=0;
    for(const [si,sz] of t.streets.entries()){
      for(let x=t.x0+.18;x<t.x1-.12;x+=.2)batch.box(x,t.top+.001,sz,.09,.002,.012,paint);
      for(const [k,px] of [.55,1.85,3.2].entries()){
        const lz=sz+(k%2?.10:-.10),lx=px+si*.35;
        batch.cylinder(lx,t.top+.12,lz,.007,.009,.24,trim,6);
        batch.box(lx,t.top+.245,lz,.04,.014,.022,windowMats[1]);lamps++;
      }
      for(const [k,px] of [.95,2.45,3.75].entries()){
        const x=px-si*.4,z=sz+(k%2?-.042:.042),m=carMats[(si*3+k)%carMats.length],y=t.top;
        batch.box(x,y+.024,z,.15,.03,.066,m);
        batch.box(x-.012,y+.05,z,.082,.026,.058,darkWindow);parked++;
      }
    }
    world.stats.townTerrace={bottom,top:t.top,lamps,parked};
  }

  // Inlet bridge deck, two continuous guardrails, frequent posts and three deep piers.
  // Reuse roofPlant/foundation finishes so all settlement and bridge parts stay in eleven batches.
  const bridgeConcrete=foundation,bridgeSteel=roofPlant,road=metal(0x293942,.73,.28);
  const bx0=4.55,bx1=9.05,bz=rearZ(-4.75),deckTop=2.14,deckBottom=2.04,width=.65;
  batch.box((bx0+bx1)/2,(deckTop+deckBottom)/2,bz,bx1-bx0,deckTop-deckBottom,width,road);
  // Raised shoulders on the carriageway and bright double rails.
  for(const side of [-1,1]){
    const rz=bz+side*(width/2-.035);
    batch.box((bx0+bx1)/2,deckTop+.035,rz,bx1-bx0,.07,.045,bridgeConcrete);
    batch.box((bx0+bx1)/2,deckTop+.28,rz,bx1-bx0,.024,.026,bridgeSteel);
    batch.box((bx0+bx1)/2,deckTop+.13,rz,bx1-bx0,.018,.022,bridgeSteel);
    for(let x=bx0+.08;x<=bx1-.02;x+=.34)batch.box(x,deckTop+.14,rz,.022,.28,.024,bridgeSteel);
    // Fine warm marker lights sit just inside each parapet.
    for(let x=bx0+.22;x<=bx1-.10;x+=.72)batch.box(x,deckTop+.018,bz+side*(width/2-.11),.035,.012,.025,windowMats[0]);
  }
  // Structural longitudinal stringers beneath the deck edges.
  for(const side of [-1,1])batch.box((bx0+bx1)/2,deckBottom-.045,bz+side*(width/2-.065),bx1-bx0,.045,.035,bridgeSteel);
  const supports=[5.72,7.06,8.40];
  for(const x of supports){
    const bed=world.height(x,bz)-.04;
    batch.box(x,(bed+deckBottom)/2,bz,.22,deckBottom-bed,.20,bridgeConcrete);
    batch.box(x,bed+.04,bz,.42,.08,.38,bridgeConcrete);
    // Narrow cap at the deck bearing line.
    batch.box(x,deckBottom-.015,bz,.38,.08,.31,bridgeSteel);
  }
  // Short tapered approach slabs bring both abutments down to the general 1.72 terrain.
  for(const [x,sign] of [[bx0+.12,1],[bx1-.12,-1]]){
    batch.box(x,1.93,bz,.34,.13,width,bridgeConcrete);
    batch.box(x,1.80,bz,.16,.13,width*.9,bridgeConcrete);
  }
  batch.finish();
  world.stats.settlementBuildings=buildings.length;
  world.stats.bridge={span:4.5,deckTop};
  world.settlementDiagnostics=()=>({
    buildings:buildings.map(b=>({center:[b.x,b.z],bounds:[b.x-b.w/2,b.x+b.w/2,b.z-b.d/2,b.z+b.d/2],foundation:[world.height(b.x,b.z),2.0],height:b.h})),
    buildingCount:buildings.length,
    bridge:{endpoints:[[bx0,bz],[bx1,bz]],supports:supports.map(x=>[x,bz]),supportCount:supports.length,deckTop,width},
  });
}
