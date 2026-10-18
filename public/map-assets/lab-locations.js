// Stable experience recipes bind onto physical world locations. No scenario state.
export const LAB_LOCATIONS={
  energy:[
    {id:'energy.intake-vision',locationId:'energy.dam.intake',label:'Intake vision',view:'intake',anchor:[-4.4,1.8,-1.02],kind:'vision'},
    {id:'energy.drawing-search',locationId:'energy.treatment.west',label:'Drawing search',view:'tank-detail',anchor:[2.1,2.75,1.25],kind:'drawing'},
    {id:'energy.alarm-investigation',locationId:'energy.treatment.north',label:'Alarm investigation',view:'tanks',anchor:[4.1,2.8,-.65],kind:'alarm'},
  ],
  mining:[
    {id:'mining.conveyor-vision',locationId:'mining.processing.conveyor',label:'Conveyor vision',view:'conveyor',anchor:[4.82,3.42,-3.12],kind:'vision'},
    {id:'mining.procedure-control',locationId:'mining.workshop',label:'Approved procedure',view:'workshop',anchor:[5.6,3.1,4],kind:'procedure'},
    {id:'mining.historian-gap',locationId:'mining.control-room',label:'Historian gap',view:'control',anchor:[8.4,3.1,3.3],kind:'historian'},
  ],
};
