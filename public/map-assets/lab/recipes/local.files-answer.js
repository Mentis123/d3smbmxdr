// L3. Pure data: read by the renderer and (via sync) by the Data#3 host.
// Plan: docs/three-worlds/LOCAL-LAB-PLAN.md section 3. Documents, names, dates and clause text are fictional (the
// Agentic AI Builder workshop companies). No performance figures are quoted.
export default {
  id:'local.files-answer', world:'local', featured:true, order:3,
  locationId:'local.npu', label:'Ask my files', view:'npu', anchor:[0.6,10.6,-1.56],
  title:'Ask your own files, see the source',
  benefit:'Plain-word answers from your own files, with the source to check: nothing uploaded, no tokens per question, and it works offline.',
  // Why local, shown by the Data#3 host as its own panel. No figures; claims follow the Copilot+ PC semantic index.
  whyLocal:[
    {key:'Privacy',text:'Contracts and board papers stay on the laptop: nothing is uploaded to build the index or to answer.'},
    {key:'Cost',text:'No tokens per question. Asking a hundred questions costs the same as asking one.'},
    {key:'Latency',text:'The answer comes from the index on the SSD, with no round trip to a server, on a plane or in a basement.'},
    {key:'Security',text:'It only sees files you can already open, and the index stays on the device.'},
  ],
  limits:'The index lags until it re-reads changed files, a small model can be wrong, which is why every answer shows its source, and it only sees files you can open. This NPU story is how a Copilot+ PC does it; the board layout is illustrative.',
  whereItRuns:['Your files','NPU index','Answer with source'],
  provenance:[
    {label:'Windows semantic search on Copilot+ PCs',url:'https://blogs.windows.com/windows-insider/2025/01/17/previewing-improved-windows-search-on-copilot-pcs-with-windows-insiders-in-the-dev-channel',kind:'verified'},
    {label:'Windows AI APIs: Phi Silica and semantic search',url:'https://learn.microsoft.com/windows/ai/windows-ai-comparison',kind:'verified'},
    {label:'Copilot+ PC NPU requirement (40+ TOPS)',url:'https://learn.microsoft.com/windows/ai/windows-ai-comparison',kind:'verified'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The task',caption:'The answer is in one of forty documents',
      camera:{angle:.42,elevation:.46,distance:2.7,target:[.05,3.3,-.8],ease:.001,portrait:{angle:.22,elevation:.6,distance:4.0,target:[-.05,3.38,-.9]}},
      say:'A folder of forty documents: Meridian policies, Ashfield contracts, NovaCraft delivery papers. Somewhere in there are the payment terms agreed with Ashfield. Scrolling filenames does not find them, and a filename search only looks at names, not at what is inside.'},
    {id:'change',at:4,label:'Ask',caption:'You ask the question in plain words',
      camera:{angle:.2,elevation:.42,distance:1.95,target:[.02,3.45,-.95],portrait:{angle:.2,elevation:.6,distance:3.8,target:[-.05,3.45,-.97]}},
      say:'Instead, they open a local Ask my files box and type the question the way they would ask a colleague: what payment terms did we agree with Ashfield? There is no special syntax and no upload.'},
    {id:'aiView',at:10,label:'On the chip',caption:'The NPU searches on the laptop: no upload, no tokens',sensor:'npu-view',
      overlay:{anchor:'npu',label:'Searching on the NPU',state:'review'},
      say:'Under the keyboard, the index of those forty files is stored on the SSD. The NPU searches it by meaning, not by filename: three files match, and the answer comes back with two citations, the Services Agreement clause 7.2 and the Supplier Agreement clause 4. Wi-Fi is off; nothing left the laptop, and no tokens were spent on the question.'},
    {id:'review',at:16.5,label:'You decide',caption:'You open the source and check it',
      camera:{angle:.6,elevation:.42,distance:3.0,target:[0,3.33,-.82],portrait:{angle:.24,elevation:.6,distance:4.0,target:[-.05,3.4,-.92]}},
      say:'The answer is a pointer, not the final word. They click the first source, the clause opens with the sentence highlighted, they check it says 30 days from a valid invoice, and only then reply to the email. The person checks; the laptop found it.'},
  ],
  variation:{id:'versions',label:'Two versions',caption:'Two versions found · which is current?',
    captions:{review:'You check both dates and use the current version'},
    overlay:{anchor:'npu',label:'Two versions found',state:'unclear'}},
};
