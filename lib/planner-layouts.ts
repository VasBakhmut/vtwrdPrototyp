export type BayKind = "double" | "long" | "drawers" | "shelves" | "shoes" | "hanging-shoes" | "hanging-drawers" | "low-shoes";
export type ShelfSpacing = "even" | "tall-bottom" | "tall-middle";
export type Bay = { kind: BayKind; shelves: number; spacing?: ShelfSpacing };
export type StorageStyle = "wardrobe" | "pantry" | "garage";
export type LayoutPreset = { id: string; name: string; description: string; bays: Bay[] };
export const bayNames: Record<BayKind, string> = {
  "hanging-shoes":"Hanging + low shoe shelves", "hanging-drawers":"Hanging + 4 drawers", "low-shoes":"Low shoe cabinet",
  double: "Double hanging", long: "Long hanging", drawers: "4 drawers + shelves", shelves: "Shelving", shoes: "Shoe shelves",
};
export const presets: LayoutPreset[] = [
  { id: "everyday", name: "Everyday balance", description: "A place for hanging and folded clothes.", bays: [{kind:"double",shelves:0},{kind:"drawers",shelves:2},{kind:"long",shelves:0}] },
  { id: "hanging", name: "Room to hang", description: "Long outfits and two levels of everyday hanging.", bays: [{kind:"long",shelves:0},{kind:"double",shelves:0},{kind:"double",shelves:0}] },
  { id: "compact", name: "Simply organised", description: "Four drawers beside a generous hanging section.", bays: [{kind:"double",shelves:0},{kind:"drawers",shelves:2}] },
  { id: "folded", name: "More folded storage", description: "Shelves, four drawers and space for shorter clothes.", bays: [{kind:"shelves",shelves:5},{kind:"drawers",shelves:2},{kind:"double",shelves:0}] },
  { id: "shared", name: "Made for two", description: "Matching drawer towers and hanging in the middle.", bays: [{kind:"drawers",shelves:2},{kind:"double",shelves:0},{kind:"double",shelves:0},{kind:"drawers",shelves:2}] },
  { id: "shelving", name: "Everything on a shelf", description: "Open shelving for pantry essentials or folded storage.", bays: [{kind:"shelves",shelves:5},{kind:"shelves",shelves:5},{kind:"shoes",shelves:6}] },
];
// Layouts interpreted from the client's installation photos, not fabrication drawings.
export const photoPresets: LayoutPreset[] = [
  {id:"photo-niche-shoes",name:"Niche with shoe storage",description:"Low shoe shelves below hanging, beside four drawers.",bays:[{kind:"hanging-shoes",shelves:2},{kind:"drawers",shelves:3}]},
  {id:"photo-centre-tower",name:"Central drawer tower",description:"A drawer tower between double hanging and shoes below long hanging.",bays:[{kind:"double",shelves:0},{kind:"drawers",shelves:3},{kind:"hanging-shoes",shelves:2}]},
  {id:"photo-side-tower",name:"Side tower & hanging",description:"Four drawers and open shelves at one side of the niche.",bays:[{kind:"long",shelves:0},{kind:"drawers",shelves:3}]},
  {id:"photo-low-shoes",name:"Low shoe corner",description:"A low shoe cabinet with clear space above, next to hanging.",bays:[{kind:"long",shelves:0},{kind:"low-shoes",shelves:3}]},
  {id:"photo-hanging-drawers",name:"Drawers below hanging",description:"A compact four-drawer unit under a single clothes rail.",bays:[{kind:"long",shelves:0},{kind:"hanging-drawers",shelves:0}]},
  {id:"photo-shelf-tower",name:"Open shelf tower",description:"A full-height shelf section beside two hanging levels.",bays:[{kind:"double",shelves:0},{kind:"shelves",shelves:5}]},
];
export function hasDrawers(kind:BayKind){return kind==="drawers"||kind==="hanging-drawers";}
export function railCount(kind:BayKind){return kind==="double"?2:["long","hanging-shoes","hanging-drawers"].includes(kind)?1:0;}
export function maxShelves(kind:BayKind){return ["double","long","hanging-drawers"].includes(kind)?0:kind==="drawers"||kind==="hanging-shoes"||kind==="low-shoes"?3:7;}
export function supportsSpacing(kind:BayKind){return ["drawers","shelves","shoes"].includes(kind);}
export function replaceBay(kind:BayKind,room:string):Bay{return kind==="shelves"&&storageStyle(room)!=="wardrobe"?defaultRoomBay(room):defaultBay(kind);}
export function railLevels(kind:BayKind,height:number):number[]{return railCount(kind)===2?[height-270,(height-270)/2]:railCount(kind)===1?[height-270]:[];}
// Preview geometry, not a fabrication specification. Shared with SVG cards.
export const drawerGeometry={count:4,bottom:100,pitch:180,frontHeight:170,cap:820} as const;
export function drawerFronts(){return Array.from({length:drawerGeometry.count},(_,i)=>({bottom:drawerGeometry.bottom+i*drawerGeometry.pitch,height:drawerGeometry.frontHeight}));}
export function uprightDepth(bays:Bay[],room:string,y:number,depth:number):number{
  const cabinet=bays.some(b=>hasDrawers(b.kind)&&(b.kind==="drawers"||y<drawerGeometry.cap)||storageStyle(room)==="wardrobe"&&(["shelves","shoes"].includes(b.kind)||b.kind==="low-shoes"&&y<=b.shelves*200));
  return cabinet?Math.min(445,depth):supportDepth(depth);
}
export function validBay(value:unknown,room?:string):value is Bay{
  if(!value||typeof value!=="object")return false;
  const b=value as Bay;
  return Object.hasOwn(bayNames,b.kind)&&(!room||kindsForRoom(room).includes(b.kind))&&Number.isInteger(b.shelves)&&b.shelves>=0&&b.shelves<=maxShelves(b.kind)&&(b.spacing===undefined||["even","tall-bottom","tall-middle"].includes(b.spacing));
}
export function supportDepth(depth:number){return Math.min(290,depth);}
export const pantryPresets: LayoutPreset[] = [
  {id:"pantry-everyday",name:"Everyday pantry",description:"Closely spaced shelves for jars, tins and staples.",bays:[{kind:"shelves",shelves:6},{kind:"shelves",shelves:6},{kind:"shelves",shelves:6}]},
  {id:"pantry-appliances",name:"Appliance space",description:"A taller lower opening for appliances and baskets.",bays:[{kind:"shelves",shelves:5,spacing:"tall-bottom"},{kind:"shelves",shelves:4,spacing:"tall-bottom"},{kind:"shelves",shelves:6}]},
  {id:"pantry-family",name:"Family pantry",description:"Small everyday items above, larger baskets below.",bays:[{kind:"shelves",shelves:6},{kind:"shelves",shelves:5,spacing:"tall-bottom"},{kind:"shelves",shelves:5,spacing:"tall-bottom"}]},
  {id:"pantry-drawers",name:"Shelves & drawers",description:"Four drawers for smaller items alongside open shelves.",bays:[{kind:"shelves",shelves:6},{kind:"drawers",shelves:3},{kind:"shelves",shelves:5}]},
  {id:"pantry-mixed",name:"Mixed shelf heights",description:"A tall middle opening between everyday shelf levels.",bays:[{kind:"shelves",shelves:5,spacing:"tall-middle"},{kind:"shelves",shelves:6},{kind:"shelves",shelves:5,spacing:"tall-middle"}]},
  {id:"pantry-compact",name:"Compact pantry",description:"Two simple shelf towers for a smaller opening.",bays:[{kind:"shelves",shelves:6},{kind:"shelves",shelves:5,spacing:"tall-bottom"}]},
];
export const garagePresets: LayoutPreset[] = [
  {id:"garage-everyday",name:"Boxes & equipment",description:"Fewer shelf levels with room for storage tubs.",bays:[{kind:"shelves",shelves:3,spacing:"tall-bottom"},{kind:"shelves",shelves:3,spacing:"tall-bottom"},{kind:"shelves",shelves:3,spacing:"tall-bottom"}]},
  {id:"garage-tall",name:"Tall storage",description:"Large lower openings for bulky everyday equipment.",bays:[{kind:"shelves",shelves:2,spacing:"tall-bottom"},{kind:"shelves",shelves:2,spacing:"tall-bottom"},{kind:"shelves",shelves:3}]},
  {id:"garage-organised",name:"Small parts & boxes",description:"A four-drawer tower between taller shelving bays.",bays:[{kind:"shelves",shelves:3},{kind:"drawers",shelves:2},{kind:"shelves",shelves:3,spacing:"tall-bottom"}]},
  {id:"garage-mixed",name:"Mixed-size storage",description:"Different shelf heights for different-size containers.",bays:[{kind:"shelves",shelves:4},{kind:"shelves",shelves:2,spacing:"tall-middle"},{kind:"shelves",shelves:3}]},
  {id:"garage-shelves",name:"Shelf wall",description:"Regular shelf levels across the whole wall.",bays:[{kind:"shelves",shelves:4},{kind:"shelves",shelves:4},{kind:"shelves",shelves:4}]},
  {id:"garage-compact",name:"Compact garage",description:"A smaller run for boxes and household supplies.",bays:[{kind:"shelves",shelves:3,spacing:"tall-bottom"},{kind:"shelves",shelves:4}]},
];
export function storageStyle(room: string): StorageStyle { return room === "Walk-in pantry" ? "pantry" : room === "Garage storage" ? "garage" : "wardrobe"; }
export function presetsForRoom(room: string): LayoutPreset[] { const style=storageStyle(room); return style === "pantry" ? pantryPresets : style === "garage" ? garagePresets : [...presets,...photoPresets]; }
export function kindsForRoom(room:string): BayKind[] { return storageStyle(room)==="wardrobe"?["double","long","drawers","shelves","shoes","hanging-shoes","hanging-drawers","low-shoes"]:["shelves","drawers"]; }
export function defaultRoomBay(room:string): Bay { const style=storageStyle(room); return style==="pantry"?{kind:"shelves",shelves:6}:style==="garage"?{kind:"shelves",shelves:3,spacing:"tall-bottom"}:defaultBay("double"); }
// Actual shelf elevations, shared by preview and tests. The larger opening is a
// layout preference, not a load-bearing claim. Snap to the confirmed 50 mm pitch.
export function shelfLevels(bay:Bay,height:number): number[] {
  if(!Number.isFinite(height)||bay.shelves<=0||maxShelves(bay.kind)===0)return [];
  if(bay.kind==="hanging-shoes"||bay.kind==="low-shoes")return Array.from({length:Math.min(3,bay.shelves)},(_,i)=>200*(i+1));
  if(bay.kind==="hanging-drawers")return [];
  const low=bay.kind==="drawers"?850:100, high=Math.max(low+200,height-200);
  const count=Math.min(7,Math.max(0,Math.floor(bay.shelves)));
  const weights=Array.from({length:count+1},(_,i)=>(bay.spacing==="tall-bottom"&&i===0)||(bay.spacing==="tall-middle"&&i===Math.floor((count+1)/2))?2.4:1);
  const unit=(high-low)/weights.reduce((a,b)=>a+b,0);
  let y=low;
  return weights.slice(0,count).map(weight=>{y+=weight*unit;return Math.round(y/50)*50;});
}
export function defaultBay(kind: BayKind): Bay { return {kind,shelves:kind==="hanging-shoes"?2:kind==="low-shoes"?3:kind === "drawers" ? 2 : kind === "shelves" ? 5 : kind === "shoes" ? 6 : 0}; }
// Preview dimensions only. Supplier costs are deliberately not exposed to the browser.
export function bayWidths(bays: Bay[], width: number): number[] {
  const drawerCount = bays.filter(b => hasDrawers(b.kind)).length;
  const drawerWidth = 508;
  const otherCount = bays.length - drawerCount;
  const remaining = width - 16 * (bays.length + 1) - drawerCount * drawerWidth;
  return bays.map(b => hasDrawers(b.kind) ? drawerWidth : remaining / Math.max(1, otherCount));
}
export function layoutFits(bays: Bay[], width: number) {
  if(!Number.isFinite(width)||bays.length===0||bays.length>8||!bays.every(b=>validBay(b)))return false;
  const widths = bayWidths(bays,width);
  return widths.every(w => w >= 350 && w <= 1000) && (bays.some(b => !hasDrawers(b.kind)) || Math.abs(width - (bays.length * 508 + 16 * (bays.length + 1))) < .01);
}
export function fitPreset(bays: Bay[], width: number, extra?: Bay): Bay[] {
  let result = bays.map(b => ({...b}));
  const addition=extra??(bays.some(b=>b.kind==="double"||b.kind==="long")?defaultBay("double"):bays.find(b=>b.kind==="shelves")??defaultBay("shelves"));
  while (!layoutFits(result,width) && result.length < 8 && bayWidths(result,width).some(w=>w>1000)) result.push({...addition});
  return result;
}
export function defaultRun(room:string,width:number): Bay[] {
  const template=presetsForRoom(room)[0].bays;
  const fitted=fitPreset(template,width,defaultRoomBay(room));
  if(layoutFits(fitted,width))return fitted;
  const count=Math.max(1,Math.min(8,Math.ceil((width-16)/1016)));
  return Array.from({length:count},()=>({...defaultRoomBay(room)}));
}
export type Design={room:string;shape:string;width:number;wallB:number;height:number;depth:number;finish:string;doors:string;layout:string;bays:Bay[];leftBays?:Bay[];rightBays?:Bay[]};
export function isOpenRoom(room:string):boolean {return room==="Walk-in robe"||room==="Walk-in pantry";}
export function normaliseFront(design:Design):Design {return isOpenRoom(design.room)?{...design,doors:"Open wardrobe"}:design;}
export type Wall = "back" | "left" | "right";
export function selectedBayIndex(selected:number,count:number):number {
  if(count<=0)return -1;
  return Number.isInteger(selected)?Math.max(0,Math.min(selected,count-1)):0;
}
export function runWidth(design:Design,wall:Wall):number {return wall==="back"?design.width:Math.max(350,design.wallB-Math.min(445,design.depth));}
export function getRun(design:Design,wall:Wall):Bay[]{
  if(wall==="back")return design.bays;
  const stored=wall==="left"?design.leftBays:design.rightBays;
  if(stored)return stored;
  const width=runWidth(design,wall),count=Math.max(1,Math.ceil((width-16)/1016));
  return Array.from({length:count},()=>({...defaultRoomBay(design.room)}));
}
export function activeWalls(shape:string):Wall[]{return shape==="U-shaped"?["back","left","right"]:shape==="L-shaped"?["back","left"]:["back"];}
export function countsForDesign(design:Design){return activeWalls(design.shape).flatMap(w=>getRun(design,w)).reduce((a,b)=>({drawers:a.drawers+(hasDrawers(b.kind)?4:0),shelves:a.shelves+b.shelves,rails:a.rails+railCount(b.kind)}),{drawers:0,shelves:0,rails:0});}
// Only accept the schema we can render; old v2 designs migrate without losing their back wall.
export function readSavedDesign(value:unknown):Design|null{
  if(!value||typeof value!=="object")return null;
  const d=value as Design;
  if(!["Walk-in robe","Built-in wardrobe","Walk-in pantry","Reach-in or niche","Garage storage"].includes(d.room)||!["Straight","L-shaped","U-shaped"].includes(d.shape))return null;
  if(![d.width,d.wallB,d.height,d.depth].every(Number.isFinite)||d.width<900||d.width>6000||d.wallB<1000||d.wallB>6000||d.height<1800||d.height>3000||d.depth<445||d.depth>900)return null;
  if(!["Classic White","Prime Oak","Walnut","Charcoal"].includes(d.finish)||!["Open wardrobe","Mirrored sliding","Timber-look sliding","Hinged"].includes(d.doors)||typeof d.layout!=="string")return null;
  if(["Built-in wardrobe","Reach-in or niche"].includes(d.room)&&d.shape!=="Straight")return null;
  const isRun=(run:unknown):run is Bay[]=>Array.isArray(run)&&run.length>0&&run.length<=8&&run.every(b=>validBay(b,d.room));
  if(!isRun(d.bays)||(d.leftBays!==undefined&&!isRun(d.leftBays))||(d.rightBays!==undefined&&!isRun(d.rightBays)))return null;
  const copy=structuredClone(d);
  for(const run of [copy.bays,copy.leftBays,copy.rightBays])run?.forEach(b=>{if(!supportsSpacing(b.kind))delete b.spacing;});
  return normaliseFront(copy);
}
