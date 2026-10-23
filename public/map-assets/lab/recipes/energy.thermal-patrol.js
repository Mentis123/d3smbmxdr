// E2. Pure data: read by the renderer and (via sync) by the Data#3 host.
export default {
  id:'energy.thermal-patrol',world:'energy',featured:true,order:2,
  locationId:'energy.grid.substation',label:'Thermal patrol',view:'grid-detail',anchor:[7.3,2.2,.3],
  title:'A robot spots an unusual hot connection',
  benefit:'Inspectors see a connector running warmer than its neighbours between rounds, without walking the live yard.',
  limits:'Thermal shows heat, not cause: load, sun and reflections change the picture, and the robot reads it uncalibrated, so an inspector reviews the image before any outage is planned.',
  whereItRuns:['Robot camera','Site GPU','Inspector'],
  provenance:[
    {label:'Verified pattern: Tomago Aluminium trialled a legged robot with thermal imaging in its substation',url:'https://www.tomago.com.au/tomago-aluminium-puts-spot-on-the-spot/',kind:'verified'},
    {label:'Verified pattern: Woodside uses a legged robot for routine inspection rounds at Pluto LNG (Control Global)',url:'https://controlglobal.com/control/industrial-computers/article/55267857/safety-on-four-legs-at-lng-plant',kind:'verified'},
    {label:'Vendor case: robot thermal rounds at National Grid substations (Boston Dynamics)',url:'https://bostondynamics.com/case-studies/spot-becomes-part-of-the-team-at-national-grid/',kind:'vendor'},
    {label:'Counterexample: one utility pilot sent robot data to cloud processing instead (Boston Dynamics, Southern Company)',url:'https://bostondynamics.com/case-studies/southern-company/',kind:'vendor'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,caption:'A robot leaves its dock to walk the substation round',
      camera:{angle:.55,elevation:.42,distance:7.2,target:[0,.35,.1],ease:.001,portrait:{angle:.42,elevation:.5,distance:8.6,target:[-.35,.5,-.15]}},
      say:'This is one bay of a substation: transformer T1 and its cable connectors, phases A, B and C. A four-legged robot walks the same round inside the live yard. Nothing is wrong.'},
    {id:'change',at:4,caption:'The robot stops where it checks the same connectors every round',
      camera:{angle:-.85,elevation:.48,distance:2.9,target:[.22,.58,-.45],portrait:{angle:-1.25,elevation:.5,distance:2.6,target:[.38,.62,-.45]}},
      say:'It stops at the same spot every round and points its camera head at the same three connectors, the same way. To the eye they look identical. That repeatability is what makes the next picture comparable.'},
    {id:'aiView',at:10,caption:'Its thermal camera shows one connector warmer than its neighbours',sensor:'robot-thermal',
      overlay:{anchor:'connector',label:'Warm connector',state:'review'},
      say:'The robot only walks and captures; its own computer handles navigation. The thermal image goes over site Wi-Fi to the GPU in the yard hut, which matches it to T1 phase B and compares it with A and C. B reads warmer than both, so it is flagged for review, not diagnosed.'},
    {id:'review',at:16.5,caption:'An inspector reviews the image at the gate, outside the yard',
      camera:{angle:-.8,elevation:.48,distance:6.4,target:[-.1,.7,.1],portrait:{angle:-.8,elevation:.55,distance:8.6,target:[-.75,.85,.1]}},
      overlay:{anchor:'connector',label:'Check T1 phase B',state:'review'},
      say:'The inspector gets the image, the asset and the comparison on a tablet at the gate. Nobody had to walk into the live yard to find it. They decide whether it needs a closer look or a planned outage; the robot goes back to its dock.'},
  ],
  variation:{id:'reflection',label:'Sun reflection',caption:'View unclear · another look needed',captions:{review:'An inspector asks the robot for another look later'},overlay:{anchor:'connector',label:'View unclear',state:'unclear'}},
  // Narration (ElevenLabs, owner-supplied 23 Oct 2026): one clip per chapter, played by the host from the chapter's start.
  // With the variation on, its clip plays at the AI view and the review stays silent (the normal lines would contradict it).
  narration:{base:'/map-assets/lab/audio/energy.thermal-patrol/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{change:1.6}},
};
