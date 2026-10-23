// D3. Pure data: read by the renderer and (via sync) by the Data#3 host. Facts are the Data#3 infographic's
// ("Your journey to AI-ready infrastructure", TOO HEAVY · Structural Constraints); the raised-floor point is the owner's.
export default {
  id:'datacenter.too-heavy',world:'datacenter',featured:true,order:3,
  locationId:'datacenter.heavy',label:'Too heavy',view:'heavy',anchor:[4.4,4.4,3.8],
  title:'Too heavy: structural constraints',
  benefit:'Not every datacenter can physically support modern AI racks.',
  limits:'Illustrative only: the sag is exaggerated, and real floor ratings vary by site and need a structural engineer\'s assessment.',
  whereItRuns:['Racks','Floor and paths','Structural engineer'],
  provenance:[
    {label:'Data#3 infographic: Your journey to AI-ready infrastructure',url:'https://www.data3.com',kind:'pattern'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The assumption',caption:'Racks sit on a raised floor built years ago',
      say:'This data hall was built years ago. Its racks stand on a raised access floor: tiles on short steel pedestals, with power cables and cooling pipes run through the void underneath. A new AI rack waits on the slab by the ramp.'},
    {id:'change',at:4,label:'The AI rack',caption:'An AI rack weighs 2,000 to 5,000+ pounds',
      camera:{angle:-.12,elevation:.26,distance:6.8,target:[.1,1.6,.7],portrait:{angle:-.1,elevation:.3,distance:7.4,target:[-.3,1.45,.7]}},
      say:'Modern AI racks are heavy: 2,000 to 5,000 pounds and more. The movers roll it up onto the floor. The tiles under it start to give, the pedestals bow, and cracks spread across the tiles around it.'},
    {id:'aiView',at:10,label:'Reality check',caption:'The structural view shows the floor past its limit',sensor:'structural-view',
      overlay:{anchor:'floor',label:'Floor limit exceeded',state:'review'},
      say:'A structural view makes it plain. The tiles and pedestals under the rack are past their limit: floor loading limits exceeded. And the void is already crowded, so new cables and pipes have no easy path. Many facilities weren\'t built to handle this load.'},
    {id:'review',at:16.5,label:'AI ready',caption:'AI-ready: structural validation of floors, weight and paths',
      camera:{angle:.55,elevation:.34,distance:7.6,target:[1.4,1.3,.3],portrait:{angle:.5,elevation:.4,distance:9.6,target:[2.1,1.35,.4]}},
      overlay:{anchor:'slab',label:'Validated on slab',state:'neutral'},
      say:'AI ready means structural validation: floors, weight, cabling and more. Here the rack goes back down onto a slab on grade, power and pipes run overhead, and a structural engineer signs it off. In our view, many raised floors were never built for this load. Not every datacenter can physically support modern AI racks.'},
  ],
};
