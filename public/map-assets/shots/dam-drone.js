// "Dam drone": start on the default view, dive over the river, climb the spillway on the van's
// timing, chase it across the dam crest, then lift away as it turns, showing the whole table.
// Miniature-local units; the table stays at yaw 0.
export default {
  name:'dam-drone',
  world:'energy',
  title:'Dam drone shot',
  yaw:0,
  fov:42,
  // The opening dive starts wherever the hero orbit camera sits, which is farther out on small or
  // short viewports (orbitDistance), so it peaks at 13.5 units/s at 1280x720 and 14.8 at 640x360.
  audit:{maxSpeed:16},
  clock:{actor:'dam-service-van',phase:'outbound',progress:.15,atShotTime:10},
  keys:[
    {t:0,   pos:{view:'hero'},                                  look:[0,1,0]},
    {t:5.5, pos:[-3.2,1.6,5.4],                                 look:[-5.2,.5,1.8],   ease:'inOut'},
    {t:8,   pos:[-5.2,.95,2.3],                                 look:[-5.6,2.1,-.3]},
    {t:10,  pos:[-5.6,3.35,.7],                                 look:{actor:'dam-service-van',offset:[0,.12,0]}},
    {t:11.5,pos:{actor:'dam-service-van',offset:[-1.35,.65,.42]},look:{actor:'dam-service-van',offset:[.4,.12,0]}},
    {t:15.5,pos:{actor:'dam-service-van',offset:[-1.35,.65,.42]},look:{actor:'dam-service-van',offset:[.4,.12,0]}},
    {t:17.5,pos:[1.4,4.6,1.6],                                  look:[-2.2,2.1,-.8]},
    {t:22,  pos:[9.5,9.5,14],                                   look:[0,1.3,0]},
    {t:27,  pos:{view:'hero'},                                  look:[0,1,0],         ease:'out'},
  ],
};
