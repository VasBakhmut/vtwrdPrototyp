import { Design, Wall, activeWalls, bayWidths, countsForDesign, drawerGeometry, getRun, hasDrawers, isOpenRoom, layoutFits, railLevels, readSavedDesign, runWidth, shelfLevels, uprightDepth } from './planner-layouts';

export type Part = {
  id:string; wall:Wall; section?:number;
  kind:'top-panel'|'shelf'|'upright'|'drawer-unit'|'drawer-cap'|'rail'|'door-panel'|'track-set';
  quantity:number; lengthMm:number; depthMm?:number; thicknessMm?:number;
  elevationMm?:number; note?:string;
};
export type PlannerResult = ReturnType<typeof buildPlannerResult>;
// No purchasing rates belong in this module: it is used in the browser.
// Dimensions describe the current design, NOT approved cutting dimensions.
export function buildPlannerResult(input:Design){
  const design=readSavedDesign(input);
  if(!design)throw new Error('Invalid planner design');
  const parts:Part[]=[];
  const issues:string[]=[];
  const depth=Math.min(445,design.depth),topHeight=design.height-150;
  for(const wall of activeWalls(design.shape)){
    const bays=getRun(design,wall),width=runWidth(design,wall),widths=bayWidths(bays,width);
    if(!layoutFits(bays,width)){issues.push(`${wall}: layout does not fit the run; adjust sections before calculating materials.`);continue;}
    const add=(p:Omit<Part,'id'|'wall'>)=>parts.push({...p,id:`${wall}-${parts.length+1}`,wall});
    add({kind:'top-panel',quantity:1,lengthMm:width,depthMm:depth,thicknessMm:16,elevationMm:topHeight,note:'Continuous design run; stock lengths and joints require confirmation.'});
    // One physical support per boundary, not one per neighbouring bay or per render segment.
    for(let boundary=0;boundary<=bays.length;boundary++){
      const neighbours=bays.slice(Math.max(0,boundary-1),Math.min(bays.length,boundary+1));
      const cuts=[0,...neighbours.flatMap(b=>shelfLevels(b,design.height)),drawerGeometry.cap,topHeight].filter(y=>y>=0&&y<=topHeight).sort((a,b)=>a-b);
      const profile=[...new Set(cuts)].slice(1).map((y,i,all)=>uprightDepth(neighbours,design.room,((i?all[i-1]:0)+y)/2,design.depth));
      const supportDepth=Math.max(...profile);
      add({kind:'upright',quantity:1,lengthMm:topHeight,depthMm:supportDepth,thicknessMm:16,note:`Boundary ${boundary+1}. ${new Set(profile).size>1?'Stepped profile: blank depth only; cut shape requires review.':'Preview support; wall-end fixing/need must be confirmed.'}`});
    }
    bays.forEach((bay,i)=>{
      const length=widths[i];
      for(const elevation of shelfLevels(bay,design.height)){
        const joinsLeft=i>0&&shelfLevels(bays[i-1],design.height).includes(elevation);
        const joinsRight=i<bays.length-1&&shelfLevels(bays[i+1],design.height).includes(elevation);
        add({kind:'shelf',section:i+1,quantity:1,lengthMm:length+8*(Number(joinsLeft)+Number(joinsRight)),depthMm:depth,thicknessMm:16,elevationMm:elevation,note:'Design segment; adjacent equal-height segments meet over the shared support.'});
      }
      if(hasDrawers(bay.kind)){
        add({kind:'drawer-unit',section:i+1,quantity:1,lengthMm:length,depthMm:depth,note:'Four-drawer unit; sides and cap counted separately. Width convention and drawer depth require supplier confirmation.'});
        add({kind:'drawer-cap',section:i+1,quantity:1,lengthMm:length,depthMm:depth,thicknessMm:16,elevationMm:drawerGeometry.cap});
      }
      for(const elevation of railLevels(bay.kind,design.height))add({kind:'rail',section:i+1,quantity:1,lengthMm:length,elevationMm:elevation,note:'Centreline 265 mm from wall. End fittings/cutting deductions not yet specified.'});
    });
  }
  if(!isOpenRoom(design.room)&&design.doors!=='Open wardrobe'){
    if(design.doors==='Hinged')issues.push('Hinged door sizes, hardware and rates require a separate specification.');
    else{
      const n=design.width<=2400?2:Math.max(3,Math.ceil(design.width/1180));
      const panelWidth=(design.width+20*(n-1))/n;
      parts.push({id:'front-panels',wall:'back',kind:'door-panel',quantity:n,lengthMm:panelWidth,depthMm:design.height,note:'Nominal overlapping coverage × opening height, not a glass/frame cutting size.'});
      parts.push({id:'front-tracks',wall:'back',kind:'track-set',quantity:1,lengthMm:design.width,depthMm:n===2?82:180,note:'Top/bottom track assembly; supplier PLM inclusions require confirmation.'});
      if(panelWidth>1200||panelWidth<400)issues.push('Door panel coverage is outside 400–1200 mm. Confirm frame deductions and door count.');
      issues.push('Door product family, height deductions, hardware and opening access require review.');
    }
  }
  issues.push('Interior top height currently follows the preview: opening height minus 150 mm. It is not a confirmed manufacturing rule.');
  issues.push('Fixings, cleats, brackets, fillers, edging, stock/waste, delivery and installation are not fully specified.');
  if(parts.some(p=>p.kind==='drawer-unit'))issues.push('Preview uses a 508 mm drawer unit inside a clear bay plus separate 16 mm sides. Confirm width convention before cutting or ordering.');
  if(design.shape!=='Straight')issues.push('Corner supports and continuous shelf joints require manufacturing review; this schedule follows the current preview.');
  if(design.finish!=='Classic White')issues.push('Special-order material requires supplier quote.');
  const boardKinds=['top-panel','shelf','upright','drawer-cap'];
  const boardMetresByDepth:Record<string,number>={};
  parts.filter(p=>boardKinds.includes(p.kind)).forEach(p=>{const key=String(p.depthMm);boardMetresByDepth[key]=(boardMetresByDepth[key]??0)+p.lengthMm*p.quantity/1000;});
  return {schemaVersion:1 as const,status:'review-required' as const,design,parts,
    totals:{...countsForDesign(design),drawerUnits:parts.filter(p=>p.kind==='drawer-unit').length,boardMetresByDepth,railMetres:parts.filter(p=>p.kind==='rail').reduce((sum,p)=>sum+p.lengthMm*p.quantity/1000,0)},
    estimate:{status:'unavailable' as const,amount:null,currency:'AUD',reason:'Component pricing, installation and margin must be approved before an estimate is shown.'},
    issues:[...new Set(issues)],disclaimer:'Design summary only. Final dimensions, specification and price are confirmed after the free measure.'};
}

export function customerSummary(result:PlannerResult){
  const {design,totals,estimate,disclaimer}=result;
  return {schemaVersion:1,configuration:design,room:design.room,shape:design.shape,finish:design.finish,front:design.doors,
    dimensions:{widthMm:design.width,sideWallMm:design.shape==='Straight'?null:design.wallB,openingHeightMm:design.height,clearDepthMm:design.depth},
    walls:activeWalls(design.shape).map(wall=>({wall,widthMm:runWidth(design,wall),sections:getRun(design,wall)})),
    includes:{internalShelves:totals.shelves,drawers:totals.drawers,hangingRails:totals.rails},estimate,disclaimer};
}
