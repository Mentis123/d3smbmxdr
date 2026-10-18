// Development diagnostics: validate buffers and explicit closed-volume builders.
export function auditGeometry(root){
  const records=[],seen=new Set();root.traverse(o=>{if(!o.geometry||seen.has(o.geometry))return;seen.add(o.geometry);const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index;let nonFinite=0,badIndices=0,degenerate=0;for(const value of p.array)if(!Number.isFinite(value))nonFinite++;if(n)for(const value of n.array)if(!Number.isFinite(value))nonFinite++;
    const closed=['conifer-closed-cores','gorge-rocks','road-curb'].includes(o.name),edges=closed?new Map():null;
    const key=i=>`${Math.round(p.getX(i)*1e5)},${Math.round(p.getY(i)*1e5)},${Math.round(p.getZ(i)*1e5)}`;
    for(let i=0;i<(o.isMesh?(index?index.count:p.count):0);i+=3){const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;if(Math.max(a,b,c)>=p.count||Math.min(a,b,c)<0){badIndices++;continue;}const ux=p.getX(b)-p.getX(a),uy=p.getY(b)-p.getY(a),uz=p.getZ(b)-p.getZ(a),vx=p.getX(c)-p.getX(a),vy=p.getY(c)-p.getY(a),vz=p.getZ(c)-p.getZ(a);if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-10)degenerate++;if(edges){for(const [x,y]of [[a,b],[b,c],[c,a]]){const ka=key(x),kb=key(y),edge=ka<kb?ka+'|'+kb:kb+'|'+ka;edges.set(edge,(edges.get(edge)||0)+1);}}}
    records.push({name:o.name||o.type,vertices:p.count,triangles:o.isMesh?(index?index.count:p.count)/3:0,nonFinite,badIndices,degenerate,closedRequired:closed,boundaryEdges:edges?[...edges.values()].filter(v=>v===1).length:null,nonManifoldEdges:edges?[...edges.values()].filter(v=>v>2).length:null});
  });return{records,nonFinite:records.reduce((n,r)=>n+r.nonFinite,0),badIndices:records.reduce((n,r)=>n+r.badIndices,0),closedBuilderFailures:records.filter(r=>r.closedRequired&&(r.boundaryEdges||r.nonManifoldEdges||r.degenerate))};
}

export function auditLandmarks(world){
  const root=world.root,falls=root.getObjectByName('spillway-water'),g=falls.geometry,parent=Array.from({length:g.attributes.position.count},(_,i)=>i);
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  for(let i=0;i<g.index.count;i+=3){const a=find(g.index.getX(i)),b=find(g.index.getX(i+1)),c=find(g.index.getX(i+2));parent[b]=a;parent[c]=a;}
  const waterSheets=new Set(parent.map((_,i)=>find(i))).size;
  const beacons=root.children.filter(o=>o.name==='beacon-base').map(o=>({x:o.position.x,z:o.position.z,groundError:o.position.y-o.scale.y*.5-world.height(o.position.x,o.position.z)}));
  const road=root.getObjectByName('crest-road'),van=root.getObjectByName('dam-service-van');
  return{waterSheets,concretePiers:root.children.filter(o=>o.name==='dam-pier').length,beacons,vanWheelGroundError:van.position.y-(road.position.y+road.scale.y*.5)};
}
