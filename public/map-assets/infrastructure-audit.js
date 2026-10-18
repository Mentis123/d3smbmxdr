// Diagnostics operate on the production builders, not substitute test meshes.
export function auditInfrastructure(world){
  const root=world.root,d=world.infrastructureDiagnostics(0),checks=[];
  const check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
  check('Exactly three actual tank water disks',root.children.filter(o=>o.name.startsWith('treatment-water-')).length===3);
  check('Three actual independently parented arm pivots',root.children.filter(o=>o.name.startsWith('treatment-arm-')).length===3);
  check('Water below wall with arm clearance',d.tanks.every(t=>t.waterHeight<t.wallTop-.10&&t.maxArmRadius<t.radius-.14));
  const tanks=d.tanks;
  check('Tank walls do not intersect',tanks.every((t,i)=>tanks.slice(i+1).every(b=>Math.hypot(t.center[0]-b.center[0],t.center[1]-b.center[1])>t.radius+b.radius+.15)));
  let minRoadClearance=Infinity,minRoadGround=Infinity;
  for(const road of root.children.filter(o=>o.name==='service-road')){
    const p=road.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);minRoadGround=Math.min(minRoadGround,y-world.height(x,z));for(const tank of tanks)minRoadClearance=Math.min(minRoadClearance,Math.hypot(x-tank.center[0],z-tank.center[1])-tank.radius);}
  }
  check('Road edges clear tank walls',minRoadClearance>.04,minRoadClearance);
  check('Road surfaces above actual ground',minRoadGround>.03,minRoadGround);
  const yard=d.electrical;
  check('Three transformers and three pylons',yard.transformers.length===3&&yard.pylons.length===3);
  check('Nine conductors terminate exactly at authored attachments',yard.wires.length===9&&yard.wires.every(w=>w.sampledEndpoints.every((p,i)=>p.every((v,j)=>Math.abs(v-(i?w.b:w.a)[j])<1e-6))));
  check('Every overhead conductor remains above buswork',yard.wires.every(w=>w.lowest>=3.40),yard.wires.map(w=>w.lowest));
  const town=d.settlement;
  check('Ten physically separate buildings',town.buildingCount===10&&town.buildings.every((a,i)=>town.buildings.slice(i+1).every(b=>a.bounds[1]<b.bounds[0]||a.bounds[0]>b.bounds[1]||a.bounds[3]<b.bounds[2]||a.bounds[2]>b.bounds[3])));
  check('Foundations extend below building datum',town.buildings.every(b=>b.foundation[0]<b.foundation[1]));
  check('Bridge supported above actual water inlet',town.bridge.supportCount===3&&town.bridge.deckTop>d.site.bridgeWaterY+.5&&town.bridge.supports.every(([x,z])=>world.height(x,z)<d.site.bridgeWaterY-.2));
  check('Complete perimeter has open river outlet',!!root.getObjectByName('security-glass')&&d.site.perimeter.length===14);
  return{checks,pass:checks.every(c=>c.pass),details:d};
}
