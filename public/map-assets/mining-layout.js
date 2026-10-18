// Shared recipe anchors: model units, Y up. Geographic fiction, not a site plan.
export const MINE={pit:{x:-3.8,z:-1,rx:4.7,rz:4.2,floor:-.25,top:2.25,benches:7},crusher:[3.2,2.3,-4.35],plant:[6.4,2.25,-.9],workshop:[5.6,2.25,4],control:[8.4,2.25,3.3],power:[8.1,2.25,-5.3],water:[1.9,2.25,4.8]};
export const MINING_VIEWS={
  hero:{yaw:0,target:[0,1,0],zoom:1.15,tilt:.72,azimuth:.36},
  reference:{yaw:0,target:[0,1,0],zoom:1.15,tilt:.72,azimuth:.36},
  quarter:{yaw:Math.PI/2,target:[0,1,0],zoom:1.1,tilt:.75},
  rear:{yaw:Math.PI,target:[0,1,0],zoom:1.1,tilt:.75},
  threeQuarter:{yaw:Math.PI*1.5,target:[0,1,0],zoom:1.1,tilt:.75},
  pit:{yaw:0,target:[-3.8,.65,-1],zoom:2.1,tilt:1.0,azimuth:.25},
  haul:{yaw:0,target:[-3.3,.5,-1],zoom:3.5,tilt:.85,azimuth:.4},
  crusher:{yaw:0,target:[3.2,2.8,-4.35],zoom:3.7,tilt:.62,azimuth:.4},
  conveyor:{yaw:0,target:[5,2.7,-2.8],zoom:3.4,tilt:.65,azimuth:.3},
  plant:{yaw:0,target:[6.4,3,-.9],zoom:3,tilt:.63,azimuth:.3},
  workshop:{yaw:0,target:[5.8,2.9,3.7],zoom:3.7,tilt:.58,azimuth:.3},
  control:{yaw:0,target:[8.4,2.75,3.3],zoom:4.5,tilt:.58,azimuth:.2},
  power:{yaw:0,target:[8,2.7,-5.2],zoom:4,tilt:.66,azimuth:.35},
  water:{yaw:0,target:[1.9,2.6,4.8],zoom:4,tilt:.65,azimuth:.3},
};
