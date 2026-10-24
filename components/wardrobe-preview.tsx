"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Bay, Wall, bayWidths, defaultRun, hasDrawers, railCount, railLevels, drawerFronts, drawerGeometry, uprightDepth, isOpenRoom, shelfLevels, storageStyle } from "@/lib/planner-layouts";

export type PreviewProps = { bays: Bay[]; width: number; height: number; depth: number; finish: string; doors: string; showDoors: boolean; shape?: string; wallB?: number; selected?: number; onSelect?: (index:number,wall:Wall)=>void; view?: string; zoomed?: boolean; thumbnail?: boolean; room?:string; leftBays?:Bay[]; rightBays?:Bay[]; selectedWall?:Wall };

export function WardrobePreview(props: PreviewProps) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable,setUnavailable] = useState(false);
  const [visible,setVisible]=useState(!props.thumbnail);
  useEffect(()=>{if(!props.thumbnail){setVisible(true);return;}const el=host.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:"60px"});observer.observe(el);return ()=>observer.disconnect();},[props.thumbnail]);
  const selection = useRef(props.onSelect);
  const cameraMemory=useRef<{key:string;position:THREE.Vector3;target:THREE.Vector3}|null>(null);
  selection.current = props.onSelect;
  useEffect(() => {
    if (!host.current || !visible) return;
    const el=host.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:false}); }
    catch { setUnavailable(true); return; }
    setUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,props.thumbnail?1:2));
    renderer.shadowMap.enabled=!props.thumbnail;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=.85;
    el.appendChild(renderer.domElement);
    const style=storageStyle(props.room??"Walk-in robe");
    const scene=new THREE.Scene(); scene.background=new THREE.Color(style==="garage"?"#e0e2df":"#e9e6df");
    const environment=new RoomEnvironment();
    const pmrem=new THREE.PMREMGenerator(renderer);
    const env=pmrem.fromScene(environment,.04); scene.environment=env.texture; scene.environmentIntensity=.55;
    environment.dispose();
    const camera=props.view==="Top view"?new THREE.OrthographicCamera(-2,2,2,-2,.01,100):new THREE.PerspectiveCamera(36,1,.01,100);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true; controls.enablePan=props.view === "Pan";
    controls.enabled=!props.thumbnail; controls.enableRotate=props.view!=="Top view"; controls.maxPolarAngle=Math.PI*.49;
    controls.minDistance=1.4; controls.maxDistance=15;
    const W=Math.max(.35,props.width/1000), H=Math.max(1.2,props.height/1000), D=Math.max(.3,props.depth/1000), T=.016;
    const shelfD=Math.min(.445,D);
    const materials:THREE.Material[]=[];
    const mat=(color:string,roughness=.6,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m;};
    const board=mat(({"Classic White":"#f5f3ed","Prime Oak":"#bca07a","Walnut":"#71523c","Charcoal":"#40413c"} as Record<string,string>)[props.finish]??"#f5f3ed");
    const wall=mat(style==="garage"?"#d2d4d0":style==="pantry"?"#eeebe3":"#e4dfd4"), floor=mat(style==="garage"?"#969b98":style==="pantry"?"#cfc7b6":"#b8a58c"), metal=mat("#a6aaa7",.22,.85), highlight=mat("#778465",.5);
    const mirror=mat("#e5eef0",.12,.82); mirror.envMapIntensity=2;
    const textures:THREE.Texture[]=[];
    const timber=mat(props.finish==="Walnut"?"#71523c":"#bca07a",.52);
    const grain=new Uint8Array(128*128*4);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){const index=(y*128+x)*4;const value=205+Math.sin(x*.8+Math.sin(y*.05)*1.5)*13+Math.sin(x*2.7+y*.03)*7;grain[index]=grain[index+1]=grain[index+2]=value;grain[index+3]=255;}
    const grainMap=new THREE.DataTexture(grain,128,128,THREE.RGBAFormat);grainMap.wrapS=grainMap.wrapT=THREE.RepeatWrapping;grainMap.repeat.set(3,1);grainMap.needsUpdate=true;grainMap.colorSpace=THREE.SRGBColorSpace;textures.push(grainMap);timber.map=grainMap;
    if(props.finish==="Prime Oak"||props.finish==="Walnut")board.map=grainMap;
    const group=new THREE.Group();scene.add(group);
    const targets:THREE.Mesh[]=[];
    const boardEdge=new THREE.LineBasicMaterial({color:"#716f66",transparent:true,opacity:props.thumbnail?.18:.12});materials.push(boardEdge);
    function box(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,bay=-1,wallKey:Wall="back") {
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.005,w),Math.max(.005,h),Math.max(.005,d)),material);
      mesh.position.set(x,y,z); mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
      if(material===board){const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),boardEdge);mesh.add(edges);}
      if(bay>=0){mesh.userData.bay=bay;mesh.userData.wall=wallKey;targets.push(mesh);}return mesh;
    }
    function run(parent:THREE.Object3D,bays:Bay[],width:number,wallKey:Wall) {
      const widths=bayWidths(bays,width*1000).map(w=>Math.max(.15,w/1000));
      let left=-width/2+T;
      box(parent,0,H-.15,shelfD/2,width,T,shelfD,board);
      // Shelf-led construction: recessed supports, with full-depth sides only at cabinets.
      function upright(x:number, neighbours:Bay[], id:number){
        const levels=[0,...neighbours.flatMap(b=>shelfLevels(b,props.height).map(v=>v/1000)),...(neighbours.some(b=>hasDrawers(b.kind))?[drawerGeometry.cap/1000]:[]),H-.15].filter(v=>v>=0&&v<=H-.15).sort((a,b)=>a-b);
        const cuts=[...new Set(levels)];
        for(let j=1;j<cuts.length;j++){
          const bottom=cuts[j-1],top=cuts[j],mid=(bottom+top)/2;
          const d=uprightDepth(neighbours,props.room??"Walk-in robe",mid*1000,props.depth)/1000;
          box(parent,x,mid,d/2,T,Math.max(.005,top-bottom-T),d,board,id,wallKey);
        }
      }
      upright(-width/2+T/2,[bays[0]],0);
      bays.forEach((bay,i)=>{
        const w=widths[i],x=left+w/2, id=i;
        if(!props.thumbnail){
          const selected=(props.selectedWall??"back")===wallKey&&props.selected===i;
          const pickMaterial=new THREE.MeshBasicMaterial({color:"#778465",transparent:true,opacity:selected?.12:0,depthWrite:false,side:THREE.DoubleSide});
          materials.push(pickMaterial);
          const pick=new THREE.Mesh(new THREE.PlaneGeometry(w,H-.16),pickMaterial);
          pick.position.set(x,(H-.16)/2,.006);pick.userData.bay=id;pick.userData.wall=wallKey;parent.add(pick);targets.push(pick);
        }
        upright(left+w+T/2,[bay,...(bays[i+1]?[bays[i+1]]:[])],id);
        if((props.selectedWall??"back")===wallKey && props.selected===i && !props.thumbnail) box(parent,x,.035,shelfD+.008,w,.014,.012,highlight,id,wallKey);
        if(hasDrawers(bay.kind)) {
          box(parent,x,.07,shelfD/2,w,.12,shelfD,board,id,wallKey);
          for(const front of drawerFronts()) {
            box(parent,x,(front.bottom+front.height/2)/1000,shelfD/2,w-.008,front.height/1000,shelfD-.016,board,id,wallKey);
            box(parent,x,(front.bottom+front.height*.65)/1000,shelfD+.006,.14,.008,.018,metal,id,wallKey);
          }
        }
        if(hasDrawers(bay.kind))box(parent,x,drawerGeometry.cap/1000,shelfD/2,w,T,shelfD,board,id,wallKey);
        for(const level of shelfLevels(bay,props.height)) {
          // Meet above the support instead of being boxed between full-depth partitions.
          const joinsLeft=i>0&&shelfLevels(bays[i-1],props.height).includes(level);
          const joinsRight=i<bays.length-1&&shelfLevels(bays[i+1],props.height).includes(level);
          box(parent,x+(Number(joinsRight)-Number(joinsLeft))*T/4,level/1000,shelfD/2,w+(Number(joinsLeft)+Number(joinsRight))*T/2,T,shelfD,board,id,wallKey);
        }
        if(railCount(bay.kind)>0) {
          const levels=railLevels(bay.kind,props.height).map(mm=>mm/1000);
          levels.forEach(y=>{
            const rail=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,w,16),metal);rail.rotation.z=Math.PI/2;rail.position.set(x,y,Math.min(.265,D-.04));parent.add(rail);
            for(let k=0;k<Math.min(7,Math.floor(w/.12));k++) {
              const hx=left+.07+k*.11;
              const hanger=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(hx,y-.05,.265),new THREE.Vector3(hx,y-.14,.09),new THREE.Vector3(hx,y-.14,.44),new THREE.Vector3(hx,y-.05,.265)]);
              const lm=new THREE.LineBasicMaterial({color:"#8a7760"});materials.push(lm);parent.add(new THREE.Line(hanger,lm));
            }
          });
        }
        left+=w+T;
      });
    }
    run(group,props.bays,W,"back");
    let roomDepth=D+.35;
    if(props.shape && props.shape!=="Straight") {
      roomDepth=(props.wallB??2400)/1000;
      const length=roomDepth-shelfD;
      const sideBays=defaultRun(props.room??"Walk-in robe",length*1000);
      const left=new THREE.Group();left.rotation.y=Math.PI/2;left.position.set(-W/2,0,shelfD+length/2);group.add(left);run(left,props.leftBays??sideBays,length,"left");
      if(props.shape==="U-shaped") { const right=new THREE.Group();right.rotation.y=-Math.PI/2;right.position.set(W/2,0,shelfD+length/2);group.add(right);run(right,props.rightBays??sideBays,length,"right"); }
    }
    box(scene,0,-.045,roomDepth/2,W+1,.08,roomDepth+2,floor);
    box(scene,0,H/2,-.055,W+.2,H+.2,.1,wall).castShadow=false;
    if(!props.thumbnail) {
      // Cutaway walls keep side runs visible while retaining the room footprint.
      const wallH=.12;
      box(scene,-W/2-.055,wallH/2,roomDepth/2,.1,wallH,roomDepth,wall).castShadow=false;
      box(scene,W/2+.055,wallH/2,roomDepth/2,.1,wallH,roomDepth,wall).castShadow=false;
    }
    if(props.showDoors && !isOpenRoom(props.room??"") && props.doors!=="Open wardrobe") {
      const hinged=props.doors==="Hinged";
      const n=hinged?Math.max(2,Math.ceil(W/.6)):W<=2.4?2:Math.max(3,Math.ceil(W/1.18));
      for(let i=0;i<n;i++) {
        const pw=hinged?W/n:(W+.02*(n-1))/n, x=-W/2+pw/2+i*(hinged?pw:pw-.02),z=D+.1+(hinged?0:(i%2)*.025);
        box(group,x,H/2,z,pw-.02,H-.04,.02,props.doors==="Mirrored sliding"?mirror:props.doors==="Timber-look sliding"?timber:board);
        if(hinged){box(group,x+(i%2===0?1:-1)*(pw/2-.055),H*.5,z+.025,.015,.18,.025,metal);continue;}
        box(group,x,H-.01,z,pw,.02,.04,metal);box(group,x,.01,z,pw,.02,.04,metal);
        box(group,x-pw/2+.009,H/2,z,.018,H,.04,metal);box(group,x+pw/2-.009,H/2,z,.018,H,.04,metal);
      }
    }
    scene.add(new THREE.HemisphereLight(0xffffff,0x9d8b70,.9));
    const sun=new THREE.DirectionalLight(0xfff4df,1.4);sun.position.set(-3,6,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;sun.shadow.normalBias=.003;sun.shadow.radius=4;scene.add(sun);
    const focus=new THREE.Vector3(0,props.view==="Top view"?0:H*.48,props.view==="Top view"?roomDepth*.5:roomDepth*.3);
    const cameraKey=[props.room,props.shape,props.width,props.wallB,props.height,props.depth,props.view,props.zoomed].join("|");
    let positioned=false;
    function resize(){
      const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
      const aspect=w/h;
      renderer.setSize(w,h);
      if(camera instanceof THREE.OrthographicCamera){
        const half=Math.max((W+.4)/aspect,roomDepth+.4)/2*(props.zoomed?.85:1);
        camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
      }else camera.aspect=aspect;
      camera.updateProjectionMatrix();
      if(!positioned){
        if(!props.thumbnail&&cameraMemory.current?.key===cameraKey){camera.position.copy(cameraMemory.current.position);controls.target.copy(cameraMemory.current.target);}
        else{
          const dist=Math.max(H,W/aspect,roomDepth)*1.9*(props.zoomed?.78:1);controls.target.copy(focus);
          if(props.view==="Top view")camera.position.set(0,H+5,focus.z+.001);
          else if(props.view==="Front view")camera.position.set(0,H*.48,roomDepth+dist);
          else camera.position.set(W*.32,H*1.2,roomDepth+dist*.84);
        }
        camera.lookAt(controls.target);positioned=true;
      }
      controls.update();renderer.render(scene,camera);
    }
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let downX=0,downY=0;
    const down=(event:PointerEvent)=>{downX=event.clientX;downY=event.clientY;};
    const click=(event:PointerEvent)=>{if(props.showDoors&&!isOpenRoom(props.room??"")&&props.doors!=="Open wardrobe")return;if(Math.hypot(event.clientX-downX,event.clientY-downY)>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,false)[0];if(hit){const {bay,wall}=hit.object.userData;if(Number.isInteger(bay)&&bay>=0&&["back","left","right"].includes(wall))selection.current?.(bay,wall);}};
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointerup",click);
    let frame=0;const draw=()=>{controls.update();renderer.render(scene,camera);if(!props.thumbnail)frame=requestAnimationFrame(draw);};draw();
    const redraw=()=>renderer.render(scene,camera);controls.addEventListener("change",redraw);
    return ()=>{if(!props.thumbnail)cameraMemory.current={key:cameraKey,position:camera.position.clone(),target:controls.target.clone()};cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener("change",redraw);controls.dispose();renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointerup",click);scene.traverse(o=>{if(o instanceof THREE.Mesh || o instanceof THREE.Line)o.geometry.dispose();});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());sun.shadow.map?.dispose();env.dispose();pmrem.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[visible,props.bays,props.width,props.height,props.depth,props.finish,props.doors,props.showDoors,props.shape,props.wallB,props.selected,props.view,props.zoomed,props.thumbnail,props.room,props.leftBays,props.rightBays,props.selectedWall]);
  return <div ref={host} className={props.thumbnail?"wardrobe-render wardrobe-thumbnail":"wardrobe-render"} role="img" aria-label={`Interactive ${props.shape??"Straight"} wardrobe with ${props.bays.length} sections in ${props.finish}`}>{unavailable&&<p className="render-unavailable">The 3D preview needs WebGL. You can still choose and save your layout below.</p>}</div>;
}
