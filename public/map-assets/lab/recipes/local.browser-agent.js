// L2. Pure data: read by the renderer and (via sync) by the Data#3 host. Storyboard: docs/three-worlds/LOCAL-LAB-PLAN.md
// section 3. The expense portal (Meridian Technologies) and its amounts are fictional; no performance figures are claimed.
export default {
  id:'local.browser-agent', world:'local', featured:true, order:2,
  locationId:'local.gpu', label:'Browser agent', view:'gpu', anchor:[0.08,9.3,-1.7],
  title:'The agent fills it in, you press send',
  benefit:'The browser agent does the typing on the laptop, with no screenshots sent to the cloud and no tokens billed; you check and press send.',
  // Why local, shown by the Data#3 host as its own panel. Honest: a local vision model is slower per step than the cloud.
  whyLocal:[
    {key:'Cost',text:'An agent looks at the screen after every step. Run locally, those screenshots cost no tokens, however many steps the form takes.'},
    {key:'Privacy',text:'The page and the receipts show names, card details and amounts. They are read on the laptop, not uploaded.'},
    {key:'Security',text:'The agent works in the signed-in browser on this device; it never submits, pays or signs in by itself.'},
    {key:'Offline',text:'It keeps working when the Wi-Fi drops, and on networks that block cloud AI services.'},
  ],
  limits:'A local vision model is slower than the cloud and needs a strong GPU like this laptop’s. The agent never submits, pays or signs in on its own, and stops when a page asks for a person.',
  whereItRuns:['Browser','GPU','You approve'],
  provenance:[
    {label:'Microsoft Edge Copilot Actions: permission levels',url:'https://geekrewind.com/how-to-enable-or-disable-copilot-actions-in-microsoft-edge-on-windows-11/',kind:'vendor'},
    {label:'Microsoft OmniParser V2 with a local vision model',url:'https://github.com/microsoft/OmniParser',kind:'pattern'},
    {label:'Surface Laptop Ultra: NVIDIA RTX Spark (Blackwell GPU)',url:'https://www.microsoft.com/en-us/surface/devices/surface-laptop-ultra',kind:'verified'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The task',caption:'A long expense claim and a pile of receipts',
      camera:{angle:1.0,elevation:.34,distance:7.2,target:[.25,3.6,-.5],ease:.001,portrait:{angle:1.0,elevation:.36,distance:9.5,target:[.15,3.4,-.5]}},
      say:'An expense claim is open in the browser: ten fields for one trip. Beside the laptop sits a pile of paper receipts. The receipts were already photographed, so the photos are on the laptop.'},
    {id:'change',at:4,label:'Ask',caption:'You ask the agent to fill in the claim',
      camera:{angle:.85,elevation:.3,distance:3.0,target:[.25,3.4,-1.15],portrait:{angle:.85,elevation:.3,distance:3.6,target:[.3,3.35,-1.1]}},
      say:'Instead of typing every line, the person asks the browser agent in one sentence: fill this claim from my receipts.'},
    {id:'aiView',at:10,label:'On the chip',caption:'The GPU reads each screen here: no tokens, no upload',sensor:'chip-view',
      overlay:{anchor:'gpu',label:'Reading the page on the GPU',state:'review'},
      say:'This is the laptop with its keyboard made see-through. The page goes to the GPU, which finds each field and the Submit button, then fills the fields one by one from the receipt photos. Wi-Fi is off: the reading and the typing happen on this laptop. An agent looks at the screen after every step; in the cloud each look is billed in tokens and leaves the device, here it is neither.'},
    {id:'review',at:16.5,label:'You decide',caption:'It stops at Submit. You press send',
      camera:{angle:.8,elevation:.32,distance:3.4,target:[.2,3.4,-1.1],portrait:{angle:.8,elevation:.32,distance:4.0,target:[.25,3.35,-1.05]}},
      say:'The agent stops at the Submit button and asks. The person checks two amounts against the receipts, the hotel and the total, and presses Submit themselves. The claim is sent.'},
  ],
  variation:{id:'login',label:'Login wall',caption:'Sign-in needed · the agent stops and asks',overlay:{anchor:'screen',label:'Sign-in needed',state:'unclear'}},
};
