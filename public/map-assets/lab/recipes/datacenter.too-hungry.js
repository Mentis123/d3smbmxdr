// D1. Pure data: read by the renderer and (via sync) by the Data#3 host.
// Source: Data#3 infographic "Your journey to AI-ready infrastructure", card 1 (Too hungry · Power density shock).
// Every figure here is the infographic's; no other numbers.
export default {
  id:'datacenter.too-hungry',world:'datacenter',featured:true,order:1,
  locationId:'datacenter.hungry',label:'Too hungry',view:'hungry',anchor:[-3.9,6.0,3.6],
  title:'Too hungry: power density shock',
  benefit:'AI doesn’t need more racks. It needs more power per rack.',
  limits:'The kW figures are the infographic’s typical ranges, not a measurement of any site, so the real feed is sized by an electrical engineer.',
  whereItRuns:['Racks','Power feed','Facilities engineer'],
  provenance:[
    {label:'Data#3 infographic: Your journey to AI-ready infrastructure',url:'https://www.data3.com',kind:'pattern'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The assumption',caption:'Ten racks, each built for about 10 kW',
      camera:{angle:.5,elevation:.36,distance:7.6,target:[-.45,1.15,-.2],ease:.001,portrait:{angle:.85,elevation:.36,distance:12.5,target:[-.35,1.5,-.2]}},
      say:'A typical enterprise row: ten traditional racks, each fed by a thin whip from the row panel and built for about 10 kW. Traditional enterprise racks run 5 to 20 kW. The facilities engineer asks what many teams ask: “I have ten racks. I should be good, right?”'},
    {id:'change',at:4,label:'The AI rack',caption:'One AI rack asks for up to 250 kW',
      camera:{angle:.3,elevation:.2,distance:8.4,target:[1.05,2.15,-.35],portrait:{angle:.3,elevation:.22,distance:9.4,target:[1.8,2.2,-.3]}},
      say:'One modern AI rack is wheeled in and fed from the same panel. Its gauge uses the same scale as the ten small ones, one block for every 10 kW, and it keeps climbing: a modern AI rack draws 100 to 250 kW or more. One rack now asks for more than the whole row was designed to carry.'},
    {id:'aiView',at:10,label:'Reality check',caption:'The old feed goes over capacity and the breaker trips',sensor:'power-view',
      overlay:{anchor:'feed',label:'Feed over capacity',state:'review'},
      say:'The power view follows the new rack’s feed: a thin whip and a breaker sized for a 10 kW rack. Counting racks hid the problem. The feed goes over capacity and the breaker trips. Not if those racks were designed for 10 kW and your AI rack needs 250 kW.'},
    {id:'review',at:16.5,label:'AI ready',caption:'AI-ready: high-density power, 100–250 kW+ per rack',
      camera:{angle:.85,elevation:.3,distance:9.2,target:[1.1,2.0,-.3],portrait:{angle:.8,elevation:.3,distance:13,target:[1.45,2.1,-.2]}},
      say:'AI-ready means high-density power: 100 to 250 kW or more per rack, from a new high-capacity feed and an overhead busway instead of another thin whip. Planned before the hardware lands, it lowers deployment risk: no expensive redesigns, delays or cost overruns. AI doesn’t need more racks. It needs more power per rack.'},
  ],
};
