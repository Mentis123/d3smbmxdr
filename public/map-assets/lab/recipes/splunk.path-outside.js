// S3. Pure data: read by the renderer and (via sync) by the Data#3 host. Chosen by the owner (28 Oct 2026) as visual:
// you can see WHERE the slowdown is. Claims checked 28 Oct 2026: the AI here is ThousandEyes' (Cisco AI Assistant in
// ThousandEyes, GA July 2025; AI explanations with fault-domain analysis of test rounds, GA October 2025); Internet
// Insights' outage detection is algorithmic (not called machine learning); ThousandEyes alerts reach Splunk ITSI through
// the documented integration. No Splunk AI verdict on inside-vs-outside is claimed: none is documented as shipping.
// Telco A/B, AS 64500 (a documentation number), the figures and times are illustrative.
export default {
  id:'splunk.path-outside', world:'splunk', featured:true, order:3,
  locationId:'splunk.internet.edge', label:'It’s not us', view:'internet', anchor:[-9.4,2.4,0.8],
  title:'It’s not us',
  benefit:'When Microsoft 365 slows down and everyone blames the network, ThousandEyes shows where the slowdown really is, and the team acts on the answer in Splunk instead of hunting inside its own network.',
  limits:'Illustrative: the providers, figures and times are made up. ThousandEyes measures each segment of the path from its own agents; Internet Insights spots outages that many customers see at once (it is a paid add-on). The Cisco AI Assistant and its explanations summarise what ThousandEyes measured; they do not change anything. Splunk receives the alert as an episode; the decision to move traffic or open a ticket is the team’s.',
  whereItRuns:['ThousandEyes agents','Cisco AI Assistant','Splunk ITSI'],
  provenance:[
    {label:'ThousandEyes release notes, July 2025: Cisco AI Assistant in ThousandEyes, generally available; troubleshoots from events, alerts and Internet Insights outage data',url:'https://docs.thousandeyes.com/archived-release-notes/2025/2025-07-release-notes',kind:'verified'},
    {label:'ThousandEyes changelog: AI explanations (natural-language summaries and fault-domain analyses of test rounds), October 2025',url:'https://docs.thousandeyes.com/whats-new/changelog',kind:'verified'},
    {label:'ThousandEyes Internet Insights: outages isolated to specific networks (autonomous systems) and locations, including ISPs and SaaS providers',url:'https://docs.thousandeyes.com/product-documentation/internet-insights.md',kind:'verified'},
    {label:'ThousandEyes and Splunk ITSI integration: test data and alerts into ITSI, episodes back on the ThousandEyes timeline',url:'https://docs.thousandeyes.com/product-documentation/integration-guides/custom-built-integrations/splunk-app/itsi',kind:'verified'},
  ],
  duration:32,
  chapters:[
    {id:'scene',at:0,label:'Working',caption:'The board is your network. The providers float beyond its edge',
      say:'What: the campus reaches Microsoft 365 through its internet edge, out through the provider, Telco A, and across the internet. ThousandEyes tests that path all the time. So what: everything on the board is yours; everything off it is not. Now what: watch the calls start coming in.'},
    {id:'change',at:6,label:'Tickets',caption:'Microsoft 365 slows. The help desk blames the network',
      camera:{angle:-.55,elevation:.32,distance:5.3,target:[-2.35,.75,.15],portrait:{angle:-.5,elevation:.38,distance:7.6,target:[-2.5,.8,.05]}},
      overlay:{anchor:'campus',label:'Users: Microsoft 365 slow',state:'noticed'},
      say:'What: Teams stutters, Outlook hangs and SharePoint times out. Twelve tickets in a few minutes, and every one says the network is slow. So what: the team could spend the morning checking its own switches. Now what: look along the path.'},
    {id:'aiView',at:13,label:'Where it is',caption:'ThousandEyes shows the slowdown is inside Telco A, not you',sensor:'te-view',
      overlay:{anchor:'ispA',label:'Outside · Telco A',state:'noticed'},
      say:'What: this is the ThousandEyes view. Every segment of the path gets its own reading: your network is normal, Telco A is slow and dropping packets, Microsoft is normal. The Cisco AI Assistant in ThousandEyes sums it up: the fault domain is the provider, and other customers are seeing it too. So what: the problem is outside, and the team can see it. Now what: act on it.'},
    {id:'review',at:21,label:'Acted on',caption:'In Splunk the team moves Microsoft 365 to Telco B',
      camera:{angle:-.62,elevation:.42,distance:6.6,target:[-2.3,.95,-.15],ease:1.6,portrait:{angle:-.55,elevation:.48,distance:9.4,target:[-2.4,1.0,-.2]}},
      overlay:{anchor:'ispB',label:'Now via Telco B',state:'neutral'},
      say:'What: the ThousandEyes alert lands in Splunk ITSI as an episode, next to everything else the team watches. They approve sending Microsoft 365 through the second provider, Telco B, and open a ticket with Telco A. So what: users are back to normal and nobody spent the morning hunting inside. Now what: when Telco A recovers, the traffic can move back.'},
  ],
  variation:{id:'inside',label:'It is us',caption:'This time the red segment is on the board: the campus edge',
    captions:{review:'Inside: the team fixes its own edge router'},
    overlay:{anchor:'edge',label:'Inside · campus edge',state:'unclear'}},
};
