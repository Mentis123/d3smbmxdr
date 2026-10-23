// Location pins: one per location-bar stop (the first manifest location to name each camera), with an
// anchor in miniature-local units where the label should float. `group` pins show from mid distance;
// the rest only up close. Labels and views must match src/lib/worlds/manifest.ts (chip ?? label,
// camera); src/lib/worlds/pins.test.ts enforces that, so edit both together.
export const PINS={
  energy:[
    {id:'energy.reservoir',label:'Dam',view:'dam',anchor:[-5.6,3.0,-.48],group:true},
    {id:'energy.dam.intake',label:'Intake',view:'intake',anchor:[-4.4,2.0,-1.05]},
    {id:'energy.dam.service-road',label:'Service road',view:'vehicle',anchor:[-2.0,2.85,-.72]},
    {id:'energy.treatment.west',label:'Clarifier',view:'tank-detail',anchor:[2.1,2.55,1.25]},
    {id:'energy.treatment.north',label:'Treatment',view:'tanks',anchor:[4.8,2.6,3.15],group:true},
    {id:'energy.grid.substation',label:'Substation',view:'grid-detail',anchor:[7.3,3.3,-.65],group:true},
    {id:'energy.grid.network',label:'Network',view:'grid',anchor:[6.65,4.95,-2.75]},
    {id:'energy.town',label:'Town',view:'town-detail',anchor:[2.0,4.9,-7.0],group:true},
    {id:'energy.town.bridge',label:'Bridge',view:'bridge',anchor:[6.8,2.55,-6.75]},
    {id:'energy.forest',label:'Forest',view:'quarter',anchor:[-6.9,3.0,-5.4]},
  ],
  mining:[
    {id:'mining.pit',label:'Pit',view:'pit',anchor:[-3.8,1.7,-1.0],group:true},
    {id:'mining.haul-road',label:'Haul road',view:'haul',anchor:[.6,2.95,-4.35]},
    {id:'mining.crusher',label:'Crusher',view:'crusher',anchor:[4.05,3.7,-4.35],group:true},
    {id:'mining.processing.conveyor',label:'Conveyor',view:'conveyor',anchor:[5.55,4.45,-2.2]},
    {id:'mining.processing.plant',label:'Plant',view:'plant',anchor:[6.6,4.8,-.7],group:true},
    {id:'mining.workshop',label:'Workshop',view:'workshop',anchor:[5.6,3.45,4.0]},
    {id:'mining.control-room',label:'Control',view:'control',anchor:[8.4,3.35,3.3],group:true},
    {id:'mining.power',label:'Power',view:'power',anchor:[8.1,3.7,-5.3]},
    {id:'mining.water',label:'Water',view:'water',anchor:[1.9,3.45,4.8]},
  ],
  // Neighbourhood Market (retail-scene.js RETAIL_PLACES): floor top is y 0.2.
  retail:[
    // Over the weighing plate (in front of the crate line), over the customer side of the deli glass (clear of the
    // server), on the front lip of the display crates (below the FRUIT sign). Back office shows only up close.
    {id:'retail.produce.scales',label:'Scales',view:'scales',anchor:[-5.08,1.3,3.1],group:true},
    {id:'retail.deli.counter',label:'Deli',view:'deli',anchor:[-3.6,1.9,-2.6],group:true},
    {id:'retail.produce.display',label:'Display',view:'display',anchor:[4.5,1.5,2.4],group:true},
    {id:'retail.backoffice',label:'Back office',view:'backoffice',anchor:[6,1.9,-4]},
  ],
};
