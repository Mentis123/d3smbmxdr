// "Ironvale overview": the mining world's one-minute narrated flight, companion to riverbend-overview.
// Fades in on the hero, drops into the pit over the loading face, picks up haul truck 01 on its final
// approach and arrives with it at the crusher (it turns, then tips from about 21 s), rides the overland
// conveyor into the plant, passes the workshop and control room, sweeps the power yard, and rises away
// into a fade to black. Beats line up with docs/three-worlds/voiceover/ironvale-overview.md.
export default {
  name:'ironvale-overview',
  world:'mining',
  title:'Ironvale overview',
  yaw:0,
  fov:42,
  audit:{maxSpeed:10},
  fade:[[0,1],[3.5,0],[55,0],[60,1]],
  // A loaded truck takes ~55 s to climb out, so the shot joins truck 01 near the top: clocked so it is
  // 15% into tipping at 22 s, which puts its arrival at the crusher at about 16.5 s.
  clock:{actor:'haul-truck-01',phase:'tipping-at-crusher',progress:.15,atShotTime:22},
  keys:[
    {t:0,  pos:{view:'hero'},                                          look:[0,1,0]},
    {t:6,  pos:[-1.5,6.2,6.5],                                         look:[-3.8,.4,-1.0],                     ease:'in'},
    {t:10.5,pos:[-1.6,3.0,1.4],                                        look:[-2.9,0,-1.9]},
    // Climb out over the rim instead of skimming the bench wall.
    {t:12, pos:[-.6,5.6,-.6],                                          look:[2.4,2.4,-4.4]},
    {t:13.5,pos:{actor:'haul-truck-01',offset:[-1.4,.85,.6]},          look:{actor:'haul-truck-01',offset:[.9,.2,0]}},
    {t:16.5,pos:{actor:'haul-truck-01',offset:[-1.4,.85,.6]},          look:{actor:'haul-truck-01',offset:[.9,.2,0]}},
    {t:21, pos:[2.3,4.2,-1.7],                                         look:[4.08,2.9,-4.6]},
    {t:25.5,pos:[4.3,3.7,-5.0],                                        look:[5.3,3.7,-2.6]},
    {t:30, pos:[5.0,6.0,-3.6],                                         look:[6.6,3.4,-.6]},
    {t:35, pos:[3.9,5.6,1.2],                                          look:[6.3,3.2,-.9]},
    {t:39.5,pos:[3.8,4.0,6.4],                                         look:[5.7,2.9,3.9]},
    {t:44, pos:[7.0,3.8,6.3],                                          look:[8.4,2.9,3.3]},
    // Over the plant tanks, not through them.
    {t:46.5,pos:[7.8,6.8,1.4],                                         look:[8.1,2.8,-5.3]},
    {t:49, pos:[6.6,5.8,-2.4],                                         look:[8.1,2.8,-5.3]},
    {t:54, pos:[10,9.5,10],                                            look:[0,1.2,0]},
    {t:60, pos:[15,19,28],                                             look:[0,1,0],                            ease:'out'},
  ],
};
