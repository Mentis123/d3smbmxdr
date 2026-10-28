// "Vale descent": the Marlow Vale money shot. Opens on the hero frame (the owner's reference image,
// docs/three-worlds/marlow-vale/reference.webp), drops off the lookout spur toward the bridge, passes the council,
// turns past the treatment plant and follows the river's long bend to the left, low over the water to the island and rises toward the
// notch where the river leaves the valley. Fixed points only, so it plays the same in every renderer.
// Audited against the real terrain and water in src/lib/worlds/marlow-vale.test.ts.
export default {
  name:'vale-descent',
  world:'marlow-vale',
  title:'Marlow Vale descent',
  yaw:0,
  fov:46,
  audit:{maxSpeed:6},
  fade:[[0,1],[2.5,0],[41,0],[44,1]],
  keys:[
    {t:0,  pos:[12.61,7.48,32.51], look:[1.79,0.78,-1.17]},
    {t:6,  pos:[8.2,4.8,15.5],     look:[4.6,0.6,0.4],      ease:'in'},
    {t:11, pos:[1.2,2.4,4.2],      look:[5.2,1.6,-7.4]},
    {t:16, pos:[3.0,3.2,-2.6],     look:[5.2,2.0,-7.4]},
    {t:21, pos:[0.4,3.4,-8.6],     look:[-9.2,0.6,-10.8]},
    {t:26, pos:[-10.2,2.8,-6.4],   look:[-17.5,0.4,-18]},
    {t:32, pos:[-15.2,1.8,-22],    look:[-24.6,0.4,-45.2]},
    {t:37, pos:[-20.4,1.5,-35.2],  look:[-24.6,0.5,-45.2]},
    {t:44, pos:[-19.5,4.2,-52.0],  look:[-36,5,-110],        ease:'out'},
  ],
};
