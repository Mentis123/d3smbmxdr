// R3 "Keep produce available": a fresh-produce display in a fictional store. Three sloping crates (bananas, apples,
// lemons). Over a time-lapsed morning (the clock on the header spins) shoppers take apples until the middle crate is
// sparse while its neighbours stay full. The display camera on its mast sees how full each crate looks; a fullness
// rule raises "check display"; a colleague checks the stock record, brings the stock trolley out of the stockroom and
// refills the crate. Variation "hand-over": a shopper is reaching into the crate when the camera looks, so the view
// is blocked and nothing is concluded. The kit also carries a "no-stock" branch (stock record says none: no trolley,
// the colleague tags the crate for follow-up) for when the framework supports a second variation.
// Everything is a pure function of t (and the variation).
import {createRetailProps} from '../rigs/retail-props.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const lerpAngle=(a,b,u)=>a+wrap(b-a)*u;

const DX=-.6,DZ=-.15,SLOPE=.3;                    // display table centre and crate slope
const LOW=.14;                                    // the middle crate's fill after the morning (fraction of slots)
const TAKE0=4.9,TAKE1=9.0,CLOCK0=4.4,CLOCK1=9.6;
const SX=DX-.33;
const pathIn=(x,z=.62)=>[[-2.95,0,1.7],[-1.6,0,1.25],[x,0,z]],pathOut=(x,z=.62)=>[[x,0,z],[-1.7,0,1.3],[-3.0,0,1.75]];
const S_IN=pathIn(SX),S_OUT=pathOut(SX),S_IN_V=pathIn(DX-.42,.6),S_OUT_V=pathOut(DX-.42,.6),S_T0=1.0,S_T1=4.3,S_O0=9.15,S_O1=11.6;
const S_OUT_V0=16.4,S_OUT_V1=18.9;                // variation: the shopper is still reaching while the camera looks
const DOOR=[2.25,-2.04];
const C_START=[DOOR[0],0,-1.72];
// Review (the camera has pulled out by 17.5 s): the colleague checks the stock record in the stockroom doorway,
// pushes the stock trolley out and parks it by the display, steps round it to the crate's side and refills it.
const CHECK0=18.0,CHECK1=19.3;
const A_PATH=[C_START,[DOOR[0],0,-.25],[1.75,0,.95],[1.12,0,1.05]],A_T0=19.5,A_T1=22.7;     // pushing the trolley
const B_PATH=[[1.12,0,1.05],[.95,0,.56],[.1,0,.56],[DX+.46,0,.64]],B_T0=22.8,B_T1=24.3;      // round it to the crate
const FILL0=24.5,FILL1=26.7,PULSE_END=20.2;

export function buildKit(k){
  const {THREE,root,props,actors}=k;
  const R=createRetailProps(k);
  R.storeStage({wallColour:0xe8dac2});

  // ---- Display table and three crates; header frame with sign and the time-lapse clock ----
  const table=new THREE.Group();table.name='display-table';table.position.set(DX,0,DZ);root.add(table);
  for(const [x,z,h] of [[-1.0,-.32,.86],[1.0,-.32,.86],[-1.0,.32,.62],[1.0,.32,.62]])table.add(k.box(.05,h,.05,R.M.woodDark,x,h/2,z));
  const top=k.box(2.12,.04,.78,R.M.wood,0,.74,0);top.rotation.x=SLOPE;table.add(top);
  table.add(k.box(2.12,.12,.03,R.M.green,0,.5,.38));
  const crates=[['banana',-.69],['apple',0],['lemon',.69]].map(([kind,x],i)=>R.crate({kind,w:.62,d:.52,h:.15,layers:kind==='banana'?1:2,parent:table,x,y:.765,z:0,rx:SLOPE,seed:i*13+2,name:kind+'-crate'}));
  const middle=crates[1];
  const HZ=DZ-.62;
  const HY=1.52;
  for(const s of [-1,1])k.box(.05,HY+.15,.05,R.M.woodDark,DX+s*1.05,(HY+.15)/2,HZ);
  k.box(2.15,.32,.04,R.M.green,DX,HY,HZ);
  props.plate('FRESH PRODUCE',.9,.2,{x:DX-.35,y:HY,z:HZ+.025,bg:'#2f6b4f',fg:'#f6f1e8'});
  // Clock: face, ticks, two hands. Spins fast through the change chapter to show time passing.
  const clock=new THREE.Group();clock.position.set(DX+.62,HY,HZ+.03);root.add(clock);
  const face=k.mesh(k.track(new THREE.CylinderGeometry(.14,.14,.02,28)),R.M.warmWhite);face.rotation.x=Math.PI/2;clock.add(face);
  const rim=k.mesh(k.track(new THREE.TorusGeometry(.14,.012,6,28)),R.M.blackPlastic);clock.add(rim);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,tk=k.box(.012,i%3?.02:.035,.006,R.M.blackPlastic,Math.sin(a)*.115,Math.cos(a)*.115,.012);tk.rotation.z=-a;clock.add(tk);}
  const hourHand=new THREE.Group(),minHand=new THREE.Group();clock.add(hourHand,minHand);hourHand.position.z=minHand.position.z=.016;
  const hh=k.box(.018,.07,.006,R.M.blackPlastic,0,.03,0);hourHand.add(hh);const mh=k.box(.012,.105,.006,mat(0xc8372d),0,.048,.003);minHand.add(mh);
  function mat(c){return k.mat(c,{roughness:.5});}

  // Overlay / subject zone: the middle crate and the space its stock fills (invisible, tilted with the crate).
  const zone=new THREE.Group();zone.name='middle-crate-zone';middle.group.add(zone);
  const zm=k.mesh(k.track(new THREE.BoxGeometry(.64,.2,.54)),k.mat(0xffffff),0,.1,0);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);

  // ---- Display camera on a mast at the front, looking over the shopper's shoulder into the crates ----
  const POST=[DX-1.25,1.72],LENS=[DX-.05,2.42,1.42];
  k.box(.06,2.55,.06,R.M.stainless,POST[0],1.275,POST[1]);k.box(.24,.03,.24,R.M.blackPlastic,POST[0],.015,POST[1]);
  k.bar([POST[0],2.5,POST[1]],[LENS[0],2.5,LENS[2]],.022,R.M.stainless);k.box(.04,.1,.04,R.M.stainless,LENS[0],2.47,LENS[2]);
  const cam=R.storeCamera(LENS,[DX,.82,DZ-.02],{fov:40});
  props.plate('CAMERA',.3,.09,{x:POST[0],y:2.2,z:POST[1]+.04,ry:.4,bg:'#1d2124',fg:'#f6f1e8'});

  // ---- Back of house: wall, stockroom door, stock trolley with a full crate; shelves; store GPU ----
  k.box(1.1,2.2,.06,k.mat(0x1c1a17,{roughness:1}),DOOR[0],1.1,DOOR[1]+.01);
  for(const s of [-1,1])k.box(.08,2.25,.1,R.M.green,DOOR[0]+s*.59,1.125,DOOR[1]+.03);
  k.box(1.26,.1,.1,R.M.green,DOOR[0],2.27,DOOR[1]+.03);
  for(let i=0;i<7;i++)k.box(.14,2.05,.01,k.mat(0xcfe3e8,{transparent:true,opacity:.35,roughness:.2,depthWrite:false}),DOOR[0]-.45+i*.15,1.1,DOOR[1]+.07).castShadow=false;
  props.plate('STOCKROOM',.62,.15,{x:DOOR[0],y:2.45,z:DOOR[1]+.06,bg:'#f6f1e8',fg:'#2f6b4f'});
  const trolley=R.stockTrolley({x:C_START[0],z:C_START[2]+.65,ry:-Math.PI/2});
  const stock=R.crate({kind:'apple',w:.62,d:.46,h:.15,layers:2,parent:trolley,x:.05,y:.235,z:0,seed:91,name:'stock-crate'});
  R.shelfBay({x:-.1,z:-1.82,w:1.3,seed:11});R.shelfBay({x:-2.75,z:.55,ry:Math.PI/2,w:1.3,seed:4});
  // The store GPU stands against the back wall between the shelves and the stockroom: camera -> GPU -> colleague.
  const cabinet=props.siteCabinet(1.08,-1.66,{rotation:0,label:'STORE GPU'});
  const port=cabinet.port();
  const pulse=props.pulse([[LENS[0],2.5,LENS[2]],[POST[0],2.52,POST[1]],[POST[0]+.04,.03,POST[1]],[POST[0]+.04,.03,-1.96],[port[0]-.3,.03,-1.96],[port[0]-.3,.03,port[2]+.3],[port[0],.03,port[2]+.3],port,
    [port[0]+.06,.03,port[2]+.32],[DOOR[0]-.7,.03,port[2]+.32],[DOOR[0]-.7,.03,-1.6],[C_START[0]-.2,.03,-1.6]]);

  // ---- People: a shopper taking apples, a colleague with a handheld ----
  const shopper=actors.person({vest:0x7a5aa8,shirt:0x7a5aa8,pants:0x34303a,name:'shopper'});
  const shopperShoulder=R.dress(shopper,{hair:0xc9a46a,top:0x7a5aa8}).hand.parent.parent;
  const colleague=actors.person({vest:0x2f6b4f,shirt:0xf2efe8,pants:0x2b2f36,name:'colleague'});
  const dc=R.dress(colleague,{hair:0x2a1c14,apron:0x2f6b4f});
  const device=R.handheld(colleague.group);
  const pocket=new THREE.Object3D();pocket.position.set(.09,.2,.125);dc.torso.add(pocket);
  const grip=new THREE.Object3D();grip.position.set(0,-.33,.045);grip.rotation.set(-1.25,0,0);dc.hand.parent.add(grip);
  pocket.add(device.group);
  const shoulder=dc.hand.parent.parent;
  // Follow-up tag for the no-stock branch.
  const tag=k.box(.12,.08,.006,k.mat(0xf2b134,{roughness:.6}),0,0,0);middle.group.add(tag);tag.position.set(0,.2,.27);tag.rotation.x=-.25;

  function update(t,ctx){
    const blocked=ctx.variation==='hand-over',noStock=ctx.variation==='no-stock';
    // Time-lapse clock: the minute hand runs five turns over the change chapter.
    const lapse=smooth(CLOCK0,CLOCK1,t);minHand.rotation.z=-(lapse*5+.05)*Math.PI*2;hourHand.rotation.z=-(.25+lapse*5/12)*Math.PI*2;
    // Middle crate: taken down over the morning; refilled from the trolley crate at the end.
    const taken=smooth(TAKE0,TAKE1,t),refill=noStock||blocked?0:smooth(FILL0,FILL1,t);
    middle.show(middle.total*(1-(1-LOW)*taken+(1-LOW)*refill));
    stock.show(stock.total*(1-.75*refill));
    crates[0].show(crates[0].total);crates[2].show(crates[2].total);
    // Shopper: walks in, reaches into the middle crate over and over, walks off (stays longer when blocking the view).
    const inF=actors.followPath(shopper.group,blocked?S_IN_V:S_IN,S_T0,S_T1,t);
    const o0=blocked?S_OUT_V0:S_O0,o1=blocked?S_OUT_V1:S_O1;
    let f=inF,leaving=t>=o0;
    if(leaving)f=actors.followPath(shopper.group,blocked?S_OUT_V:S_OUT,o0,o1,t);
    else if(inF.done)shopper.group.rotation.y=lerpAngle(inF.heading,Math.PI,smooth(S_T1,S_T1+.5,t));
    shopper.group.visible=t>=S_T0-.2&&!(leaving&&f.done);
    const reaching=inF.done&&!leaving?smooth(S_T1+.3,S_T1+.8,t):0,cycle=.5+.5*Math.sin((t-S_T1)*3.1);
    const hold=blocked&&t>=9.4&&t<o0?1:0;   // in the variation the hand stays over the crate while the camera looks
    if(inF.done&&!leaving&&blocked)shopper.group.rotation.y=lerpAngle(Math.PI,2.8,smooth(S_T1,S_T1+.6,t));   // turned toward the crate, reaching arm across it
    shopper.pose({distance:(leaving?inF.total:0)+f.distance,weight:f.moving?f.weight:0,look:hold?.15:.15+.45*reaching,lean:reaching*(hold?.38:.3+.08*cycle),point:reaching*(hold?1:.8+.2*cycle)});
    if(reaching>0)shopperShoulder.rotation.x+=((hold?-1.0:-1.05-.15*cycle)-shopperShoulder.rotation.x)*reaching;
    R.stand(shopper,f.moving?f.weight:0);
    // Colleague: appears in the stockroom doorway, checks the stock record on the handheld, brings the trolley,
    // walks to the crate and refills it. No stock: no trolley; the crate gets a follow-up tag.
    const goes=!blocked;
    const shown=goes&&t>=CHECK0-.3;colleague.group.visible=shown;device.group.visible=shown;
    const checking=goes?smooth(CHECK0,CHECK0+.5,t)*(1-smooth(CHECK1,CHECK1+.4,t)):0;
    let cf={distance:0,moving:false,weight:0,done:false};
    if(t<A_T0){colleague.group.position.set(...C_START);colleague.group.rotation.y=0;}
    else if(t<B_T0){cf=actors.followPath(colleague.group,A_PATH,A_T0,A_T1,t);}
    else{const a=actors.followPath(colleague.group,A_PATH,A_T0,A_T1,A_T1);cf=actors.followPath(colleague.group,B_PATH,B_T0,B_T1,t);cf={...cf,distance:a.total+cf.distance};
      if(cf.done)colleague.group.rotation.y=lerpAngle(cf.heading,-2.45,smooth(B_T1,B_T1+.5,t));}
    // The trolley rolls ahead of the colleague on the first leg (not in the no-stock branch), then stays parked.
    if(goes&&!noStock){const tt=Math.min(t,A_T1),pf=actors.followPath(trolley,A_PATH,A_T0,A_T1,tt);const h=pf.heading;
      trolley.position.set(pf.started?trolley.position.x+Math.sin(h)*.62:C_START[0],0,pf.started?trolley.position.z+Math.cos(h)*.62:C_START[2]+.65);trolley.rotation.y=pf.started?h-Math.PI/2:-Math.PI/2;
      if(!pf.started){trolley.position.set(C_START[0],0,C_START[2]+.65);}}
    else{trolley.position.set(C_START[0],0,C_START[2]+.65);trolley.rotation.y=-Math.PI/2;}
    const filling=goes&&!noStock?smooth(FILL0-.2,FILL0+.2,t)*(1-smooth(FILL1,FILL1+.5,t)):0,fc=.5+.5*Math.sin((t-FILL0)*4.2);
    colleague.pose({distance:cf.distance,weight:cf.moving?cf.weight:0,look:.05+.5*checking+.4*filling,lean:.1*checking+filling*(.25+.1*fc),point:Math.max(.7*checking,filling*(.8+.2*fc))});
    if(filling>0)shoulder.rotation.x+=((-1.0-.25*fc)-shoulder.rotation.x)*filling;
    R.stand(colleague,cf.moving?cf.weight:0);
    const inHand=checking>.05;device.group.scale.setScalar(inHand?1.7:.9);const want=inHand?grip:pocket;if(device.group.parent!==want)want.add(device.group);
    device.set(!shown?'off':t<CHECK0+.4?'alert':noStock?'none':'ok');
    tag.visible=noStock&&t>B_T1+.6;
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==='review'&&goes&&t<PULSE_END);
    cabinet.update(t,active);pulse.update(t,active);
  }
  return{anchors:{crate:zone,display:table},sensors:{'display-cam':{camera:cam.camera,mode:'mask',targets:[middle.group],label:'Display camera'}},update,
    metrics:()=>({middleCount:middle.instanced.count,middleTotal:middle.total,stockCount:stock.instanced.count,shopperVisible:shopper.group.visible,colleague:colleague.group.visible?colleague.group.position.toArray().map(v=>+v.toFixed(2)):null,trolley:trolley.position.toArray().map(v=>+v.toFixed(2))}),
    dispose:()=>R.dispose()};
}
