const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.join(__dirname, '../lib/planner-layouts.ts');
const compiled = new Module(filename, module);
compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,filename);
const model = compiled.exports;
test('section selection tolerates stale and invalid 3D picks',()=>{
  for(const value of [undefined,NaN,Infinity,-1,1.5])assert.equal(model.selectedBayIndex(value,3),0);
  assert.equal(model.selectedBayIndex(7,2),1);
  assert.equal(model.selectedBayIndex(1,3),1);
  assert.equal(model.selectedBayIndex(0,0),-1);
});
const rooms=['Walk-in robe','Built-in wardrobe','Walk-in pantry','Garage storage'];
const base={room:'Walk-in robe',shape:'U-shaped',width:2400,wallB:2400,height:2100,depth:520,finish:'Classic White',doors:'Open wardrobe',layout:'Everyday balance',bays:model.presets[0].bays};

test('approved wardrobe presets are retained, pantry and garage have their own six presets',()=>{
  assert.equal(model.presets.length,6);
  assert.deepEqual(model.presetsForRoom('Built-in wardrobe').slice(0,6),model.presets);
  assert.equal(model.presetsForRoom('Built-in wardrobe').length,12);
  assert.equal(model.presetsForRoom('Walk-in pantry').length,6);
  assert.equal(model.presetsForRoom('Garage storage').length,6);
  for(const room of rooms.slice(2))for(const preset of model.presetsForRoom(room))assert(preset.bays.every(b=>['shelves','drawers'].includes(b.kind)));
  assert(model.defaultRoomBay('Walk-in pantry').shelves>model.defaultRoomBay('Garage storage').shelves);
});
test('default runs fit all supported room widths without adding clothes rails to pantry or garage',()=>{
  for(const room of rooms)for(let width=900;width<=6000;width+=50){
    const bays=model.defaultRun(room,width);
    assert(model.layoutFits(bays,width),`${room} ${width}`);
    const widths=model.bayWidths(bays,width);
    assert(Math.abs(widths.reduce((a,b)=>a+b,0)+16*(bays.length+1)-width)<.01);
    if(['Walk-in pantry','Garage storage'].includes(room))assert(bays.every(b=>b.kind==='shelves'||b.kind==='drawers'));
  }
});
test('wide shelving presets expand with shelves and preserve four-drawer module width',()=>{
  for(const room of rooms)for(const p of model.presetsForRoom(room))for(const width of [1800,2400,3500,6000]){
    const bays=model.fitPreset(p.bays,width,model.defaultRoomBay(room));
    if(!model.layoutFits(bays,width))continue;
    const widths=model.bayWidths(bays,width);
    widths.forEach((w,i)=>{assert(w>=350&&w<=1000);if(model.hasDrawers(bays[i].kind))assert.equal(w,508);});
    if(room==='Walk-in pantry'||room==='Garage storage')assert(bays.every(b=>!['double','long','shoes'].includes(b.kind)));
  }
});
test('shelf elevations use 50 mm pitch, remain ordered and clear of drawers and top panel',()=>{
  for(const kind of ['drawers','shelves','shoes'])for(const height of [1800,2100,2400,3000])for(const spacing of ['even','tall-bottom','tall-middle'])for(let shelves=1;shelves<=(kind==='drawers'?3:7);shelves++){
    const levels=model.shelfLevels({kind,shelves,spacing},height);
    assert.equal(levels.length,shelves);
    levels.forEach((y,i)=>{assert.equal(y%50,0);assert(y>=(kind==='drawers'?900:100));assert(y<height-150);if(i)assert(y-levels[i-1]>=50);});
  }
  assert(model.shelfLevels({kind:'shelves',shelves:3,spacing:'tall-bottom'},2100)[0]>model.shelfLevels({kind:'shelves',shelves:3,spacing:'even'},2100)[0]);
});
test('counts include only active walls and reflect changes to either side',()=>{
  const custom={...base,leftBays:[{kind:'drawers',shelves:2}],rightBays:[{kind:'shelves',shelves:5}]};
  const back=model.countsForDesign({...custom,shape:'Straight'});
  const all=model.countsForDesign(custom);
  assert.equal(all.drawers,back.drawers+4);
  assert.equal(all.shelves,back.shelves+7);
  assert.equal(model.countsForDesign({...custom,shape:'L-shaped'}).shelves,back.shelves+2);
  assert.equal(model.runWidth(base,'left'),1955);
});
test('saved v2 designs restore, side edits persist, corrupt data is rejected',()=>{
  const loaded=model.readSavedDesign(JSON.parse(JSON.stringify(base)));
  assert.deepEqual(loaded,base);
  assert.notEqual(loaded.bays,base.bays);
  const custom={...base,leftBays:[{kind:'shelves',shelves:3,spacing:'tall-bottom'}]};
  assert.deepEqual(model.readSavedDesign(JSON.parse(JSON.stringify(custom))),custom);
  for(const patch of [{width:NaN},{height:0},{bays:[]},{bays:[{kind:'bogus',shelves:4}]},{bays:[{kind:'drawers',shelves:7}]},{leftBays:'invalid'},{doors:'invalid'},{finish:'invalid'}])assert.equal(model.readSavedDesign({...base,...patch}),null);
});
test('empty, oversized and impossible all-drawer layouts are rejected',()=>{
  assert.equal(model.layoutFits([],2400),false);
  assert.equal(model.layoutFits([{kind:'drawers',shelves:2}],900),false);
  assert.equal(model.layoutFits([{kind:'drawers',shelves:2}],540),true);
  assert.equal(model.layoutFits(model.presets[4].bays,900),false);
});
test('room interiors never acquire wardrobe fronts, including restored legacy designs',()=>{
  for(const room of ['Walk-in robe','Walk-in pantry']){
    for(const doors of ['Mirrored sliding','Timber-look sliding','Hinged','Open wardrobe']){
      const input={...base,room,doors,bays:model.defaultRun(room,base.width)};
      assert.equal(model.normaliseFront(input).doors,'Open wardrobe');
      assert.equal(model.readSavedDesign(input).doors,'Open wardrobe');
      assert.equal(input.doors,doors);
    }
  }
  for(const room of ['Built-in wardrobe','Reach-in or niche','Garage storage']){
    assert.equal(model.normaliseFront({...base,room,doors:'Mirrored sliding'}).doors,'Mirrored sliding');
  }
});
test('photo-inspired modules keep low shoe shelves, four drawers and one hanging rail',()=>{
  for(const kind of ['hanging-shoes','hanging-drawers','low-shoes']){
    const bay=model.defaultBay(kind);
    const design={...base,shape:'Straight',bays:[bay]};
    const restored=model.readSavedDesign(design);
    assert.equal(restored.bays[0].kind,kind);
    const count=model.countsForDesign(design);
    assert.equal(count.rails,kind==='low-shoes'?0:1);
    assert.equal(count.drawers,kind==='hanging-drawers'?4:0);
    assert(model.shelfLevels(bay,2100).every(y=>y<=600));
  }
  assert.equal(model.bayWidths([{kind:'hanging-drawers',shelves:0}],540)[0],508);
  assert.equal(model.layoutFits([{kind:'hanging-drawers',shelves:0}],900),false);
  assert.equal(model.readSavedDesign({...base,bays:[{kind:'hanging-drawers',shelves:1}]}),null);
  assert.equal(model.supportDepth(445),290);
  assert(model.supportDepth(445)<445);
  for(const room of ['Walk-in pantry','Garage storage'])assert(!model.kindsForRoom(room).includes('hanging-shoes'));
});
test('all presets and edit types remain consistent across room widths and heights',()=>{
  const allRooms=[...rooms,'Reach-in or niche'];
  for(const room of allRooms){
    const presets=model.presetsForRoom(room);
    assert.equal(new Set(presets.map(p=>p.id)).size,presets.length);
    for(const preset of presets){
      assert(preset.bays.every(b=>model.validBay(b,room)));
      for(let width=900;width<=6000;width+=50){
        const run=model.fitPreset(preset.bays,width,model.defaultRoomBay(room));
        if(!model.layoutFits(run,width))continue;
        assert(run.every(b=>model.validBay(b,room)));
        assert(Math.abs(model.bayWidths(run,width).reduce((a,b)=>a+b,0)+16*(run.length+1)-width)<.001);
        for(const height of [1800,2100,2400,3000])for(const bay of run){
          const shelves=model.shelfLevels(bay,height),rails=model.railLevels(bay.kind,height);
          assert.equal(shelves.length,bay.shelves);
          assert.equal(rails.length,model.railCount(bay.kind));
          assert(shelves.every(y=>y<height-150));
          assert(rails.every(y=>y<height-150&&y>Math.max(0,...shelves)));
          if(model.hasDrawers(bay.kind))assert(rails.every(y=>y>model.drawerGeometry.cap));
        }
      }
    }
    for(const kind of model.kindsForRoom(room))assert(model.validBay(model.replaceBay(kind,room),room));
  }
});
test('saved schemas reject incompatible rooms and hidden shelves on hanging-only types',()=>{
  assert.equal(model.readSavedDesign({...base,room:'Walk-in pantry'}),null);
  assert.equal(model.readSavedDesign({...base,room:'Built-in wardrobe'}),null);
  for(const kind of ['long','double','hanging-drawers'])assert.equal(model.validBay({kind,shelves:1}),false);
  assert.equal(model.validBay({kind:'shelves',shelves:3,spacing:''}),false);
  assert.deepEqual(model.replaceBay('long','Walk-in robe'),{kind:'long',shelves:0});
  const restored=model.readSavedDesign({...base,bays:[{kind:'hanging-shoes',shelves:2,spacing:'tall-middle'}]});
  assert.equal(restored.bays[0].spacing,undefined);
});
test('drawer fronts have clearance below their cap and cabinet sides stay deep in every room',()=>{
  const fronts=model.drawerFronts();
  assert.equal(fronts.length,4);
  fronts.forEach((f,i)=>{assert(f.bottom+f.height<model.drawerGeometry.cap-8);if(i)assert(f.bottom>fronts[i-1].bottom+fronts[i-1].height);});
  for(const room of rooms){
    assert.equal(model.uprightDepth([{kind:'drawers',shelves:2}],room,400,520),445);
    assert.equal(model.uprightDepth([{kind:'long',shelves:0}],room,400,520),290);
  }
  assert.equal(model.uprightDepth([{kind:'shelves',shelves:6}],'Walk-in pantry',400,520),290);
  assert.equal(model.uprightDepth([{kind:'hanging-drawers',shelves:0}],'Walk-in robe',1000,520),290);
  for(let wallB=1000;wallB<=6000;wallB+=25){
    const design={...base,wallB};
    for(const wall of ['left','right'])assert(model.layoutFits(model.getRun(design,wall),model.runWidth(design,wall)));
  }
});
test('every fitting preset survives save/restore with independent side-wall edits',()=>{
  for(const room of [...rooms,'Reach-in or niche']){
    const shapes=['Built-in wardrobe','Reach-in or niche'].includes(room)?['Straight']:['Straight','L-shaped','U-shaped'];
    for(const preset of model.presetsForRoom(room))for(const width of [900,1800,2400,3600,6000]){
      const bays=model.fitPreset(preset.bays,width,model.defaultRoomBay(room));
      if(!model.layoutFits(bays,width))continue;
      for(const shape of shapes){
        const design={...base,room,shape,width,bays,layout:preset.name};
        design.leftBays=model.getRun(design,'left').map(b=>({...b}));
        design.rightBays=model.getRun(design,'right').map(b=>({...b}));
        const original=JSON.stringify(design);
        const restored=model.readSavedDesign(JSON.parse(original));
        assert(restored,`${room}: ${preset.id}, ${width}, ${shape}`);
        assert.deepEqual(model.countsForDesign(restored),model.countsForDesign(design));
        for(const wall of model.activeWalls(shape))assert.deepEqual(model.getRun(restored,wall),model.getRun(design,wall));
        restored.bays[0].shelves=99;
        assert.equal(JSON.stringify(design),original,'restore must not mutate the original design');
      }
    }
  }
});
