// DC2 "Too hot". Pure data: read by the renderer and (via sync) by the Data#3 host.
// Source: Data#3 infographic "Your journey to AI-ready infrastructure", card 2 (Too hot · Cooling reality check).
// No numbers beyond the infographic's own words.
export default {
  id:'datacenter.too-hot',world:'datacenter',featured:true,order:2,
  locationId:'datacenter.hot',label:'Too hot',view:'hot',anchor:[-0.3,3.5,3.6],
  title:'Too hot: cooling reality check',
  benefit:'If your cooling strategy ends at air, your AI journey may end there too.',
  limits:'Illustrative only: real liquid-assisted designs vary (rear-door heat exchangers, direct-to-chip, immersion) and each needs its own engineering for the room.',
  whereItRuns:['Racks','Cooling plant','Facilities engineer'],
  provenance:[
    {label:'Data#3 infographic: Your journey to AI-ready infrastructure',url:'https://www.data3.com',kind:'pattern'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The assumption',caption:'Air cooling handles these racks comfortably',
      say:'A conventional row: in-row air coolers push cold air into the aisle, the racks draw it through and breathe warm air out the back. It works, and most rooms are built around it.'},
    {id:'change',at:4,label:'The AI rack',caption:'An AI rack throws more heat than air can carry',
      camera:{angle:.3,elevation:.2,distance:5.8,target:[-.95,1.85,-.45],portrait:{angle:.2,elevation:.22,distance:8.2,target:[-1.0,1.95,-.5]}},
      say:'Now one high-density AI rack powers up. Its hot exhaust climbs over the top and spills back into the cold aisle, and the coolers beside it run flat out. Air cooling hits its limits.'},
    {id:'aiView',at:10,label:'Reality check',caption:'The thermal camera shows the AI rack running hot',sensor:'thermal-cam',
      overlay:{anchor:'aiRack',label:'Air at its limit',state:'review'},
      say:'The thermal view makes it plain: the AI rack glows against cooler neighbours. Air cooled means limited capacity. More fans will not fix it; high-density AI racks demand liquid-assisted cooling.'},
    {id:'review',at:16.5,label:'AI ready',caption:'AI-ready: a liquid cooling strategy built for high performance',
      camera:{angle:.42,elevation:.36,distance:6.6,target:[.1,1.25,-.35],portrait:{angle:.3,elevation:.42,distance:10.4,target:[-.35,1.3,-.35]}},
      overlay:{anchor:'aiRack',label:'Fitting liquid cooling',state:'neutral',until:20.4,after:{label:'Liquid cooled'}},
      say:'A coolant distribution unit and a liquid loop now carry heat straight from the rack: liquid cooled means high capacity, and the air coolers settle back down. A facilities engineer checks it. If your cooling strategy ends at air, your AI journey may end there too.'},
  ],
};
