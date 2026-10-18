import {createWorldShell} from './world-shell.js';
import {buildSlice} from './slice.js';
import {buildTanks} from './tanks.js';
import {buildElectrical} from './electrical.js';
import {buildSettlement} from './settlement.js';
import {buildExpansion} from './expansion.js';
import {buildLandscapeDetails} from './landscape-details.js';
import {createReservoirReflection} from './reservoir-reflection.js';

export const SEED = 161026;
export function random(seed = SEED) { let s=seed>>>0; return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;}; }
export function createScene() {
  const world=createWorldShell(SEED);
  const stage=new URLSearchParams(location.search).get('stage');
  if(stage!=='shell'){buildSlice(world);if(stage!=='slice'){buildTanks(world);buildElectrical(world);buildSettlement(world);buildExpansion(world);buildLandscapeDetails(world);world.reflection=createReservoirReflection(world);world.stats.stage='complete-miniature';world.stats.scope='Integrated terrain, structures, water and lighting realism pass';}}
  world.infrastructureDiagnostics=t=>({actualArmAngles:['west','north','south'].map(id=>world.root.getObjectByName('treatment-arm-'+id)?.rotation.y),tanks:world.tankDiagnostics?.(t),electrical:world.electricalDiagnostics?.(),settlement:world.settlementDiagnostics?.(),site:world.siteDiagnostics?.()});
  return world;
}
