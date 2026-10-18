// Original tabletop controller. Birb's warmup/manual/hysteresis principles informed
// the policy; thresholds below are prototype choices verified with synthetic traces.
export const QUALITY_LEVELS=[
  {name:'Economy',dpr:.70,shadows:false,bloom:false,spray:.35,mist:.35,shadowSize:1024},
  {name:'Light',dpr:.90,shadows:false,bloom:false,spray:.55,mist:.5,shadowSize:1024},
  {name:'Balanced',dpr:1.10,shadows:false,bloom:false,spray:.75,mist:.75,shadowSize:1024},
  {name:'Detailed',dpr:1.35,shadows:true,bloom:true,spray:1,mist:1,shadowSize:1024},
  {name:'Full',dpr:1.50,shadows:true,bloom:true,spray:1,mist:1,shadowSize:2048},
];
export function createAdaptiveQuality({mobile=false,conservative=false,mode='auto',now=0,onChange=()=>{}}={}){
  let level=mobile?(conservative?1:2):3,requested=['auto','high','low'].includes(mode)?mode:'auto',samples=[],windowMs=0,warmUntil=now+4000,coolUntil=now,bad=0,good=0,decisions=0,lastP90=null;
  const effective=()=>requested==='high'?4:requested==='low'?1:level;
  const profile=()=>({...QUALITY_LEVELS[effective()],index:effective(),mode:requested});
  function reset(time){samples=[];windowMs=0;bad=good=0;warmUntil=time+4000;}
  function setMode(mode,time=0){if(!['auto','high','low'].includes(mode))return;requested=mode;reset(time);coolUntil=time+4000;onChange(profile());}
  function sample(ms,time,{hidden=false}={}){
    if(hidden||!Number.isFinite(ms)||ms<=0||ms>1000){reset(time);return;}
    if(requested!=='auto'||time<warmUntil)return;
    samples.push(ms);windowMs+=ms;if(windowMs<2000)return;
    const sorted=samples.sort((a,b)=>a-b);lastP90=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.9))];samples=[];windowMs=0;
    if(lastP90>25){bad++;good=0;}else if(lastP90<18.5){good++;bad=0;}else{bad=good=0;}
    if(time<coolUntil)return;
    let next=level;if((bad>=2||lastP90>40)&&level>0)next--;else if(good>=6&&level<4)next++;
    if(next!==level){level=next;decisions++;bad=good=0;coolUntil=time+(lastP90>25?6000:15000);warmUntil=time+2500;onChange(profile());}
  }
  return{profile,setMode,sample,reset,metrics:()=>({requested,effective:profile().name,level:effective(),lastP90,decisions,warming:windowMs===0})};
}
export function resolutionFor(profile,{width,height,deviceDpr=1,mobile=false,capture=false}){
  if(capture)return 1;
  const budget=mobile?1100000:2200000;
  return Math.max(.5,Math.min(deviceDpr,profile.dpr,Math.sqrt(budget/Math.max(1,width*height))));
}
