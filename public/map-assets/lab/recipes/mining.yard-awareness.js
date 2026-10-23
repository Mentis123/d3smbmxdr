// M3. Pure data: read by the renderer and (via sync) by the Data#3 host.
export default {
  id:'mining.yard-awareness',world:'mining',featured:true,order:3,
  locationId:'mining.workshop',label:'Yard corner',view:'workshop',anchor:[5.05,2.75,5.05],
  title:'See around the loading-bay corner',
  benefit:'The loader operator knows someone is in the review zone before turning the corner.',
  limits:'This is an advisory, not a safety system. Barriers, the walkway, site rules and spotters all stay in place, and a person the camera cannot see is treated as unknown, never as clear.',
  whereItRuns:['Yard camera','Site GPU','Supervisor'],
  provenance:[
    {label:'Pattern: region, line and persistence rules on video analytics (NVIDIA DeepStream nvdsanalytics)',url:'https://docs.nvidia.com/metropolis/deepstream/8.0/text/DS_plugin_gst-nvdsanalytics.html',kind:'pattern'},
    {label:'Vendor offering: mining zone and proximity analytics (viAct)',url:'https://www.viact.ai/industry/mining-ai-safety-solution',kind:'vendor'},
    {label:'Vendor offering: mining site cameras (Axis)',url:'https://www.axis.com/solutions/industrial/mining',kind:'vendor'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,caption:'A loader moves stock through the workshop yard',
      say:'This is the workshop yard. A loader carries stock down the lane, and a painted walkway leads out of the workshop. Rails and bollards are in place. Nothing is wrong.'},
    {id:'change',at:4,caption:'The container hides the worker and the loader from each other',
      camera:{angle:.1,elevation:1.0,distance:9.6,target:[.85,.9,-.2],portrait:{angle:.08,elevation:1.05,distance:12.6,target:[.6,1.2,-.2]}},
      say:'The container blocks the corner. The worker walking out to the crossing cannot see the loader, and the operator cannot see the worker: each line of sight ends at the container. Each is doing the right thing; neither knows the other is there.'},
    {id:'aiView',at:10,caption:'The yard camera sees a person and loader in the zone',sensor:'yard-cam',
      overlay:{anchor:'pair',label:'Person and loader in zone',state:'review'},
      say:'The camera on the pole looks down over the container. The site GPU picks out the person and the loader, and a zone rule raises an advisory only because both are inside the painted review zone at once. It has to be quick, so it runs on site; no face or identity is needed.'},
    {id:'review',at:16,caption:'The supervisor alerts the operator, who holds while the worker crosses',
      camera:{angle:.08,elevation:.44,distance:12.6,target:[-.4,1.95,-.1],portrait:{angle:.42,elevation:.66,distance:13,target:[-.5,2.3,-.2]}},
      overlay:{anchor:'supervisor',label:'Supervisor alerts operator',state:'review',until:21.9,after:{label:'Corner clear',state:'neutral'}},
      say:'The advisory reaches the supervisor\'s tablet and the lamp on the loader cab. The supervisor signals, the operator holds at the stop line, the worker crosses and steps behind the rail, then the loader carries on. The camera advised; people acted.'},
  ],
  variation:{id:'occlusion',label:'Worker hidden',caption:'Limited visibility · treat as unknown',
    captions:{review:'Worker hidden, so the operator holds until the corner clears'},
    overlay:{anchor:'pair',label:'Limited visibility',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 23 Oct 2026). Delays land lines on the blocked corner (5.4 s) and the hold (17.4 s). The variation line describes the review (operator holds), so it plays there and the AI view stays silent.
  narration:{base:'/map-assets/lab/audio/mining.yard-awareness/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:null,review:'variation.mp3'},delay:{change:1.4,review:1.2}},
};
