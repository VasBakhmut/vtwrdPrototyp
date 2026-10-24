"use client";
import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { BayDiagram } from "./bay-diagram";
import { Check } from "@phosphor-icons/react";
import { Bay, BayKind, Design, Wall, activeWalls, bayNames, bayWidths, replaceBay, defaultRoomBay, fitPreset, getRun, kindsForRoom, layoutFits, maxShelves, presetsForRoom, runWidth, shelfLevels, storageStyle, selectedBayIndex } from "@/lib/planner-layouts";

const Preview=dynamic(()=>import("./wardrobe-preview").then(m=>m.WardrobePreview),{ssr:false,loading:()=> <div className="preview-loading">Preparing layout…</div>});
export const wallNames:Record<Wall,string>={back:"Back wall · A",left:"Left wall · B",right:"Right wall · B"};
export function LayoutEditor({design,wall,onWall,selected,onSelect,onChange,part="presets"}:{part?:"presets"|"inspector";design:Design;wall:Wall;onWall:(w:Wall)=>void;selected:number;onSelect:(i:number)=>void;onChange:(patch:Partial<Design>)=>void}){
  const width=runWidth(design,wall),bays=getRun(design,wall),sizes=bayWidths(bays,width),valid=layoutFits(bays,width);
  const current=selectedBayIndex(selected,bays.length),bay=bays[current],style=storageStyle(design.room);
  const [addKind,setAddKind]=useState<BayKind>(style==="wardrobe"?"double":"shelves");
  useEffect(()=>{setAddKind(storageStyle(design.room)==="wardrobe"?"double":"shelves");},[design.room]);
  const available=kindsForRoom(design.room);
  const makeBay=(kind:BayKind):Bay=>replaceBay(kind,design.room);
  const layouts=useMemo(()=>presetsForRoom(design.room).map(p=>({...p,originalCount:p.bays.length,bays:fitPreset(p.bays,width,defaultRoomBay(design.room))})),[design.room,width]);
  const apply=(next:Bay[],name="Your custom layout")=>onChange({[wall==="back"?"bays":wall==="left"?"leftBays":"rightBays"]:next,layout:name});
  const edit=(patch:Partial<Bay>)=>apply(bays.map((b,i)=>i===current?{...b,...patch}:b));
  const move=(delta:number)=>{const to=current+delta;if(to<0||to>=bays.length)return;const next=[...bays];[next[current],next[to]]=[next[to],next[current]];apply(next);onSelect(to);};
  const sectionBays=useMemo(()=>bay?[{...bay}]:[],[bay]);
  if(part==="inspector"&&!bay)return <div className="layout-review" role="status">No section is available on this wall. Choose a ready layout to continue.</div>;
  return <>
    {part==="presets"&&<>
    {design.shape!=="Straight"&&<div className="wall-selector"><p>Edit a wall</p><div>{activeWalls(design.shape).map(w=><button type="button" key={w} aria-pressed={wall===w} className={wall===w?"active":""} onClick={()=>onWall(w)}>{wallNames[w]}</button>)}</div><small>{Math.round(width)} mm usable run{wall!=="back"?" · after the back shelf depth":""}</small></div>}
    <p>Ready layouts <span className="small-count">{layouts.length} {style==="wardrobe"?"wardrobe":style} starting points</span></p>
    <p className="control-help">{style==="pantry"?"Closer shelf levels for food and jars, with taller openings for appliances.":style==="garage"?"Taller openings for storage tubs and larger items. Shelf loads are confirmed at measure.":"Choose a layout, then adjust each section to suit your clothes."}</p>
    <div className="preset-grid">{layouts.map(p=>{const fits=layoutFits(p.bays,width),matches=JSON.stringify(p.bays)===JSON.stringify(bays);return <button type="button" key={p.id} disabled={!fits} aria-pressed={matches} className={`preset-card ${matches?"selected":""}`} onClick={()=>{apply(p.bays.map(b=>({...b})),p.name);onSelect(0);}}><Preview bays={p.bays} width={width} height={design.height} depth={design.depth} finish={design.finish} doors="Open wardrobe" showDoors={false} room={design.room} thumbnail/><span><b>{p.name}</b><small>{fits?p.description:"Does not fit this wall width"}</small>{fits&&p.bays.length>p.originalCount&&<small className="adapted-preset">+{p.bays.length-p.originalCount} section(s) to fit this width</small>}</span>{matches&&<Check aria-hidden/>}</button>;})}</div>
    <a className="edit-section-jump" href="#make-it-yours">Edit selected section ↓</a></>}
    {part==="inspector"&&<div className="bay-editor" id="make-it-yours"><p>Make it yours</p>
      <span className="section-context">{wallNames[wall]} · Section {current+1}</span>
      <div className="selected-section-preview" role="img" aria-label={`Section ${current+1}: ${bayNames[bay.kind]}, ${Math.round(sizes[current])} mm wide`}>
        <Preview bays={sectionBays} width={Math.max(350,sizes[current])+32} height={design.height} depth={design.depth} finish={design.finish} doors="Open wardrobe" showDoors={false} room={design.room} thumbnail/>
        <span>{bayNames[bay.kind]}</span>
      </div>{!valid&&<div className="layout-review" role="status">This wall needs a fitting layout. Choose a compatible preset or adjust the opening width.</div>}
      <div className="bay-tabs" aria-label="Select a section">{bays.map((b,i)=><button type="button" key={i} aria-label={`Section ${i+1}: ${bayNames[b.kind]}`} aria-pressed={current===i} className={current===i?"active":""} onClick={()=>onSelect(i)}>{i+1}</button>)}</div>
      <fieldset className="visual-field"><legend>Section {current+1} · {Math.round(sizes[current])} mm</legend><div className="bay-choice-grid">{available.map(kind=>{const fits=layoutFits(bays.map((b,i)=>i===current?makeBay(kind):b),width);return <button type="button" key={kind} className="bay-choice" aria-pressed={bay.kind===kind} disabled={!fits} onClick={()=>apply(bays.map((b,i)=>i===current?makeBay(kind):b))}><BayDiagram bay={makeBay(kind)} height={design.height}/><span>{bayNames[kind]}</span>{bay.kind===kind&&<Check className="choice-check" aria-hidden/>}{!fits&&<small>Needs more space</small>}</button>;})}</div></fieldset>
      {maxShelves(bay.kind)>0&&!["double","long"].includes(bay.kind)&&<><label>Shelves<span className="shelf-counter"><button type="button" aria-label="Remove shelf" disabled={bay.shelves<=1} onClick={()=>edit({shelves:bay.shelves-1})}>−</button><output>{bay.shelves}</output><button type="button" aria-label="Add shelf" disabled={bay.shelves>=maxShelves(bay.kind)} onClick={()=>edit({shelves:bay.shelves+1})}>+</button></span></label>{!["hanging-shoes","low-shoes"].includes(bay.kind)&&<fieldset className="visual-field"><legend>Shelf spacing</legend><div className="spacing-choice-grid">{([{value:"even",label:"Even"},{value:"tall-bottom",label:"Taller bottom"},{value:"tall-middle",label:"Taller middle"}] as const).map(option=><button type="button" key={option.value} className="bay-choice" aria-pressed={(bay.spacing??"even")===option.value} onClick={()=>edit({spacing:option.value})}><BayDiagram bay={{...bay,spacing:option.value}} height={design.height}/><span>{option.label}</span>{(bay.spacing??"even")===option.value&&<Check className="choice-check" aria-hidden/>}</button>)}</div></fieldset>}<p className="shelf-height-note">Shelf heights: {shelfLevels(bay,design.height).join(" / ")} mm from floor.</p></>}
      <div className="bay-actions"><button type="button" disabled={current===0} onClick={()=>move(-1)}>← Move</button><button type="button" disabled={current===bays.length-1} onClick={()=>move(1)}>Move →</button><button type="button" disabled={bays.length<=1||!layoutFits(bays.filter((_,i)=>i!==current),width)} onClick={()=>{apply(bays.filter((_,i)=>i!==current));onSelect(Math.max(0,current-1));}}>Remove</button></div>
      <button type="button" className="layout-action" onClick={()=>{apply([...bays].reverse());onSelect(bays.length-1-current);}}>Mirror this wall layout</button>
      <details className="add-section-options"><summary>Add a section</summary><fieldset className="visual-field"><legend>Choose the new section</legend><div className="bay-choice-grid">{available.map(kind=><button type="button" key={kind} className="bay-choice" aria-pressed={addKind===kind} onClick={()=>setAddKind(kind)}><BayDiagram bay={makeBay(kind)} height={design.height}/><span>{bayNames[kind]}</span>{addKind===kind&&<Check className="choice-check" aria-hidden/>}</button>)}</div></fieldset>
      <button type="button" className="layout-action" disabled={bays.length>=8||!layoutFits([...bays,makeBay(addKind)],width)} onClick={()=>{apply([...bays,makeBay(addKind)]);onSelect(bays.length);}}>+ Add {bayNames[addKind].toLowerCase()}</button>
      {!layoutFits([...bays,makeBay(addKind)],width)&&<p className="control-help">There is not enough space for another section of this type. You can change an existing section instead.</p>}
      </details>
    </div>}
  </>;
}
