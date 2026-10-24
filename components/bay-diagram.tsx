import { Bay, hasDrawers, railCount, railLevels, drawerFronts, drawerGeometry, shelfLevels } from "@/lib/planner-layouts";

// Lightweight elevations: use the same shelf heights as the live 3D model.
export function BayDiagram({bay,height=2100}:{bay:Bay;height?:number}) {
  const y=(mm:number)=>112-mm/height*100;
  const hanging=railCount(bay.kind)>0;
  return <svg viewBox="0 0 88 124" aria-hidden="true" focusable="false" className="bay-diagram">
    <path d="M18 112V12H70V112M18 12L25 7H77V107L70 112M70 12L77 7" fill="var(--diagram-board, #f3f2ef)" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M22 112V17H66V112" fill="white" stroke="currentColor" strokeWidth="1"/>
    {shelfLevels(bay,height).map((level,i)=><path key={i} d={`M22 ${y(level)}H66l5 -3`} fill="none" stroke="currentColor" strokeWidth="2"/>)}
    {hasDrawers(bay.kind)&&<><path d={`M22 ${y(drawerGeometry.cap)}H66`} stroke="currentColor"/>{drawerFronts().map((front,i)=><g key={i}><rect x="23" y={y(front.bottom+front.height)} width="42" height={front.height/height*100} fill="var(--diagram-board, #f3f2ef)" stroke="currentColor"/><path d={`M40 ${y(front.bottom+front.height*.65)}h8`} stroke="currentColor" strokeWidth="1.5"/></g>)}</>}
    {hanging&&railLevels(bay.kind,height).map((level,i)=>{const top=y(level);return <g key={i} fill="none" stroke="currentColor" strokeWidth="1.5"><path d={`M23 ${top}H65M44 ${top}v3l-13 6h26l-13 -6`}/></g>;})}
  </svg>;
}
