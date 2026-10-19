// "Riverbend overview": a one-minute continuous flight for the narrated overview video.
// Fades in on the default wide view, descends to the river, climbs the spillway, crosses the crest
// with the inspection van mid-run, glides over the reservoir to the intake, then follows the flow:
// powerhouse, treatment, substation, power lines, town, bridge, and rises away into a fade to black.
// Beats line up with docs/three-worlds/voiceover/riverbend-overview.md.
export default {
  name:'riverbend-overview',
  world:'energy',
  title:'Riverbend overview',
  yaw:0,
  fov:42,
  // The final pull-back covers ~25 units in 5 s under the fade; it peaks near 8.4 units/s.
  audit:{maxSpeed:10},
  fade:[[0,1],[3.5,0],[55,0],[60,1]],
  clock:{actor:'dam-service-van',phase:'outbound',progress:.5,atShotTime:16},
  keys:[
    {t:0,  pos:{view:'hero'},          look:[0,1,0]},
    {t:6,  pos:[-1.2,6.8,9.6],         look:[-4.6,1.4,.6],                                    ease:'in'},
    {t:11, pos:[-5.1,1.45,4.3],        look:[-5.2,1.7,-.2]},
    {t:15, pos:[-5.5,3.7,.9],          look:{actor:'dam-service-van',offset:[0,.1,0]}},
    // Over the reservoir looking out to the ridge, intake just below; never back at the dam's upstream face.
    {t:20, pos:[-4.2,4.7,-2.0],        look:[-4.6,2.6,-7.2]},
    // Back over the crest to meet the powerhouse from downstream.
    {t:24, pos:[-.7,3.5,1.7],          look:[.65,1.9,-.8]},
    {t:29, pos:[.9,3.7,3.4],           look:[3.0,2.0,.4]},
    {t:34, pos:[4.4,4.2,4.0],          look:[7.3,2.4,-.65]},
    {t:39, pos:[5.9,5.6,.9],           look:[6.6,3.7,-2.9]},
    {t:44, pos:[4.0,5.4,-4.0],         look:[2.0,2.8,-7.1]},
    {t:49, pos:[7.4,3.9,-4.6],         look:[6.8,2.1,-6.75]},
    {t:55, pos:[11,10.5,12],           look:[0,1.3,0]},
    {t:60, pos:[16,21,31],             look:[0,1,0],                                          ease:'out'},
  ],
};
