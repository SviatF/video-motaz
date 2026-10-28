/* PTS Creative Studio — no third-party dependencies, no paid APIs. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $("screen"), ctx = canvas.getContext("2d",{alpha:false});
const video = $("video-source");
const ASSET_DB = "pts-creative-assets-v1", PROJECT_KEY = "pts-creative-project-v1";
const assetUrls = new Map(), audioNodes = new Map();
let db, audioContext, mixDestination, videoSourceNode;
let selected = null, now = 0, playing = false, frame = 0, startedAt = 0, startedFrom = 0;
let exportRecorder = null, exportCancelled = false, micRecorder = null, micStream = null;
const PREVIEW_SHORT_SIDE=1080;
const EXPORT_QUALITY={"720":{label:"HD",bitrate:8000000},"1080":{label:"Full HD",bitrate:16000000},"1440":{label:"2K",bitrate:28000000},"2160":{label:"4K",bitrate:48000000}};
let renderShortSide=PREVIEW_SHORT_SIDE;
let dragClipId = null, toastTimeout = null, loading = false;
let timelineDrag = null, suppressClipClickUntil = 0, canvasDrag = null;
let state = {version:1,name:"Рекламний креатив 01",ratio:"9:16",media:[],clips:[],titles:[],captions:[],audios:[],stickers:[],effects:[],overlays:[]};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36));
const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
const num = (v,d=0) => Number.isFinite(Number(v)) ? Number(v) : d;
const timecode = s => { s=Math.max(0,s); const m=Math.floor(s/60), sec=Math.floor(s%60), tenth=Math.floor((s%1)*10); return String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0")+"."+tenth; };
const h = t => String(t).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = n => (Math.round(n*10)/10).toFixed(1);
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("visible");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove("visible"),3200);}
function getMedia(id){return state.media.find(x=>x.id===id);}
function duration(){const ends=[...state.clips.map(x=>x.start+x.duration),...state.titles.map(x=>x.start+x.duration),...state.captions.map(x=>x.start+x.duration),...state.audios.map(x=>x.start+x.duration),...state.stickers.map(x=>x.start+x.duration),...state.effects.map(x=>x.start+x.duration),...state.overlays.map(x=>x.start+x.duration)];return Math.max(state.clips.length||state.titles.length||state.captions.length||state.audios.length||state.stickers.length||state.effects.length||state.overlays.length?1:8,...ends);}
function videoEnd(){return state.clips.reduce((t,c)=>Math.max(t,c.start+c.duration),0);}
function reorder(){let at=0;state.clips.forEach(c=>{c.start=at;at+=c.duration;});}
function store(){state.name=$("project-name").value||"Без назви";try{localStorage.setItem(PROJECT_KEY,JSON.stringify(state));$("save-status").textContent="Збережено локально";}catch(e){toast("Не вдалось зберегти метадані: "+e.message);}}
function markDirty(){$("save-status").textContent="Не збережено";}
function persist(){store();redraw();}
function createDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(ASSET_DB,1);req.onupgradeneeded=()=>req.result.createObjectStore("files",{keyPath:"id"});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function putBlob(id,file){return new Promise((resolve,reject)=>{const tx=db.transaction("files","readwrite");tx.objectStore("files").put({id,file});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function allBlobs(){return new Promise((resolve,reject)=>{const tx=db.transaction("files","readonly");const req=tx.objectStore("files").getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function probe(file,kind){
 if(kind==="image")return 5;
 return new Promise(resolve=>{
  const el=document.createElement(kind==="video"?"video":"audio"),url=URL.createObjectURL(file);let done=false;
  const finish=sec=>{if(done)return;done=true;URL.revokeObjectURL(url);resolve(clamp(Number.isFinite(sec)&&sec>0?sec:8,.3,3600));};
  el.preload="metadata";el.onloadedmetadata=()=>finish(el.duration);el.onerror=()=>finish(8);setTimeout(()=>finish(8),7000);el.src=url;
 });
}
async function importFiles(files){
 if(!files||!files.length)return;
 let count=0;
 for(const file of [...files]){
  const kind=file.type.startsWith("video/")?"video":file.type.startsWith("image/")?"image":file.type.startsWith("audio/")?"audio":null;
  if(!kind){toast("Не підтримується тип "+file.name);continue;}
  const id=uid(),secs=await probe(file,kind);
  try{await putBlob(id,file);}catch(e){toast("Недостатньо локального сховища: "+e.message);continue;}
  assetUrls.set(id,URL.createObjectURL(file));state.media.push({id,name:file.name,kind,duration:secs});
  if(kind==="audio"){const item={id:uid(),mediaId:id,start:now,duration:secs,trim:0,volume:1,loop:false};state.audios.push(item);selected={kind:"audio",id:item.id};}
  else{const item={id:uid(),mediaId:id,start:videoEnd(),duration:kind==="image"?5:secs,trim:0};state.clips.push(item);selected={kind:"video",id:item.id};}
  count++;
 }
 if(count){persist();toast("Додано файлів: "+count);}
}
function renderAssets(){
 const el=$("asset-list");$("asset-count").textContent=String(state.media.length).padStart(2,"0");
 if(!state.media.length){el.innerHTML='<div class="empty">Завантаж матеріали, щоб розпочати монтаж.</div>';return;}
 el.innerHTML=state.media.map(a=>'<button class="asset" data-add="'+h(a.id)+'"><span class="asset-icon">'+(a.kind==="video"?"▣":a.kind==="image"?"▧":"♫")+'</span><span class="asset-info"><b title="'+h(a.name)+'">'+h(a.name)+'</b><small>'+({video:"ВІДЕО",image:"ЗОБРАЖЕННЯ",audio:"АУДІО"}[a.kind]||"ФАЙЛ")+' / '+fmt(a.duration)+' С</small></span><span class="plus">＋</span></button>').join("");
 el.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>{
  const a=getMedia(b.dataset.add);if(!a)return;
  if(a.kind==="audio"){const item={id:uid(),mediaId:a.id,start:now,duration:a.duration,trim:0,volume:1,loop:false};state.audios.push(item);selected={kind:"audio",id:item.id};}
  else{const item={id:uid(),mediaId:a.id,start:videoEnd(),duration:a.kind==="image"?5:a.duration,trim:0};state.clips.push(item);selected={kind:"video",id:item.id};}
  persist();
 }));
}
function selectClip(kind,id){selected={kind,id};redrawTimeline();renderInspector();}
function getSelected(){if(!selected)return null;return ({video:state.clips,title:state.titles,caption:state.captions,audio:state.audios,sticker:state.stickers,effect:state.effects,overlay:state.overlays}[selected.kind]||[]).find(x=>x.id===selected.id);}
const trackMap={video:"video-track",title:"text-track",sticker:"fx-track",effect:"fx-track",overlay:"overlay-track",caption:"caption-track",audio:"audio-track"};
function clipList(kind){return {video:state.clips,title:state.titles,sticker:state.stickers,effect:state.effects,overlay:state.overlays,caption:state.captions,audio:state.audios}[kind]||[];}
function snapTime(v,precise){return Math.max(0,Math.round(v*(precise?100:10))/(precise?100:10));}
function timelineDown(e,kind,id,mode){
 if(e.button!==0||exportRecorder)return;
 e.preventDefault();e.stopPropagation();
 const c=clipList(kind).find(v=>v.id===id);if(!c)return;
 stop();selected={kind,id};renderInspector();
 timelineDrag={kind,id,mode,fromX:e.clientX,start:c.start,duration:c.duration,trim:c.trim||0,moved:false};
}
function timelineMove(e){
 if(!timelineDrag)return;
 const d=timelineDrag,c=clipList(d.kind).find(v=>v.id===d.id);if(!c)return;
 const delta=(e.clientX-d.fromX)/num($("zoom").value,65),media=(d.kind==="video"||d.kind==="audio")?getMedia(c.mediaId):null;
 const startMin=0.1,maxLength=media&&media.kind!=="image"?Math.max(.2,media.duration):3600;
 if(Math.abs(e.clientX-d.fromX)<3&&!d.moved)return;
 d.moved=true;
 if(d.mode==="move"){c.start=snapTime(d.start+delta,e.shiftKey);}
 else if(d.mode==="right"){const max=media&&media.kind!=="image"&&!(d.kind==="audio"&&c.loop)?Math.max(.2,media.duration-(d.trim||0)):3600;c.duration=clamp(snapTime(d.duration+delta,e.shiftKey),startMin,max);}
 else if(d.mode==="left"){
  const minDelta=d.kind==="video"&&media&&media.kind!=="image"?-(d.trim||0):-d.start;
  const maxDelta=d.duration-startMin;
  const adj=clamp(snapTime(Math.max(0,d.start+delta),e.shiftKey)-d.start,minDelta,maxDelta);
  c.start=Math.max(0,d.start+adj);c.duration=clamp(d.duration-adj,startMin,3600);
  if(media&&media.kind!=="image"&&(d.kind==="video"||d.kind==="audio"))c.trim=clamp(d.trim+adj,0,Math.max(0,media.duration-.1));
 }
 markDirty();redrawTimeline();draw(now);
}
function timelineUp(){
 if(!timelineDrag)return;
 const moved=timelineDrag.moved;timelineDrag=null;
 if(moved){suppressClipClickUntil=performance.now()+350;const clip=getSelected();const t=clip?clip.start+Math.min(.3,clip.duration*.5):now;persist();seek(t);}
 else{redrawTimeline();renderInspector();}
}
document.addEventListener("pointermove",timelineMove);
document.addEventListener("pointerup",timelineUp);
document.addEventListener("pointercancel",timelineUp);
function redrawTimeline(){
 const pixels=num($("zoom").value,65),length=duration(),width=Math.max($("track-scroll").clientWidth,length*pixels+110);
 $("track-inner").style.width=width+"px";
 $("ruler").innerHTML="";
 for(let t=0;t<=Math.ceil(width/pixels);t+=2){const tick=document.createElement("span");tick.className="tick";tick.style.left=t*pixels+"px";tick.textContent=timecode(t).slice(0,5);$("ruler").appendChild(tick);}
 Object.values(trackMap).forEach(id=>$(id).innerHTML="");
 const groups={video:state.clips,title:state.titles,sticker:state.stickers,effect:state.effects,overlay:state.overlays,caption:state.captions,audio:state.audios};
 Object.keys(groups).forEach(kind=>{
  const list=groups[kind],track=$(trackMap[kind]);
  list.forEach(clip=>{
   const item=document.createElement("button");item.type="button";
   item.className="clip "+kind+(selected&&selected.id===clip.id?" selected":"");
   item.style.left=clip.start*pixels+"px";item.style.width=Math.max(11,clip.duration*pixels-3)+"px";
   item.title=(kind==="video"?getMedia(clip.mediaId)?.name:kind==="audio"?getMedia(clip.mediaId)?.name:kind==="sticker"?(clip.sticker==="emoji"?(PTSUk.emojiName(clip.emoji||"❤️")):PTSCreative.getSticker(clip.sticker)?.name):kind==="effect"?PTSCreative.getEffect(clip.effect)?.name:kind==="overlay"?PTSOverlays.getPreset(clip.overlay)?.name:clip.text)||"Фрагмент";
   item.textContent=(kind==="video"?"▣ ":kind==="audio"?"♫ ":kind==="title"?"T ":kind==="sticker"?"✦ ":kind==="effect"?"FX ":kind==="overlay"?"❄ ":"CC ")+(kind==="video"||kind==="audio"?(getMedia(clip.mediaId)?.name||"Файл недоступний"):kind==="sticker"?(clip.sticker==="emoji"?(clip.emoji||"❤️")+" ЕМОДЗІ":PTSCreative.getSticker(clip.sticker)?.name||"Стікер"):kind==="effect"?(PTSCreative.getEffect(clip.effect)?.name||"Ефект"):kind==="overlay"?(PTSOverlays.getPreset(clip.overlay)?.name||"Накладання"):(clip.text||"Текст"));
   item.dataset.clipId=clip.id;
   item.dataset.clipKind=kind;
   item.innerHTML='<span class="clip-handle clip-handle-left" title="Підрізати початок" data-handle="left"></span>'+
      '<span class="clip-label">'+h(item.textContent)+'</span>'+
      '<span class="clip-handle clip-handle-right" title="Розширити / скоротити" data-handle="right"></span>';
   item.addEventListener("click",e=>{
    e.stopPropagation();if(performance.now()<suppressClipClickUntil)return;
    selectClip(kind,clip.id);seek(Math.min(clip.start+.2,clip.start+clip.duration-.01));
   });
   item.addEventListener("pointerdown",e=>timelineDown(e,kind,clip.id,e.target.closest("[data-handle]")?.dataset.handle||"move"));
   track.appendChild(item);
  });
 });
 $("duration-label").textContent=fmt(length)+" С";$("total-time").textContent=timecode(length);
 positionHead();
}
function positionHead(){$("playhead").style.left=(now*num($("zoom").value,65))+"px";$("current-time").textContent=timecode(now);}
function field(label,id,value,opts=""){return '<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" value="'+h(value)+'" '+opts+'></div>';}
function inspectorInput(id,fn){const el=$(id);if(el)el.addEventListener("change",()=>{const c=getSelected();if(!c)return;fn(c,el.value);persist();});}
function renderInspector(){
 const node=$("inspector"),c=getSelected();
 if(!c){node.innerHTML='<p class="hint">Обери фрагмент на таймлайні, щоб налаштувати його параметри.</p>';return;}
 const labels={video:"ВІДЕО / ФОТО",title:"АНІМОВАНИЙ ТЕКСТ",caption:"СУБТИТРИ",audio:"АУДІО / ОЗВУЧКА",sticker:"НАЛІПКА / ЗАКЛИК",effect:"ВІДЕОЕФЕКТ",overlay:"ЕФЕКТ НА ВЕСЬ КАДР"};
 let html='<h3>'+(labels[selected.kind]||"ЕЛЕМЕНТ")+'</h3>';
 if(selected.kind==="video"||selected.kind==="audio"){const m=getMedia(c.mediaId);html+='<div class="mini">'+h(m?.name||"Медіа недоступне")+'</div>';}
 const editableText=selected.kind==="title"||selected.kind==="caption"||(selected.kind==="sticker"&&["sale","shop","new"].includes(c.sticker));
 if(editableText)html+='<div class="field"><label for="prop-text">ТЕКСТ</label><textarea id="prop-text">'+h(c.text||"")+'</textarea></div>';
 if(selected.kind==="title"||selected.kind==="sticker"){
  const choices=selected.kind==="title"
   ?[['fade','Плавна поява'],['slide','Підйом'],['pop','Масштабування'],['typewriter','Друкарська машинка'],['pulse','Пульсація'],['bounce','Підстрибування'],['none','Без анімації']]
   :[['pop','Pop In'],['bounce','Bounce'],['heartbeat','Heartbeat'],['bounce-in','Bounce In'],['pulse','Pulse'],['float','Floating'],['spin','Spin'],['slide','Slide In'],['jitter','Jitter'],['orbit','Orbit'],['rain','Drop'],['wave','Wiggle'],['flash','Blink'],['flip','Flip'],['swing','Swing'],['drift','Drift'],['rubber','Rubber'],['squash','Squash'],['tada','Tada'],['shake-x','Shake X'],['flip-y','Flip Y'],['rise','Rise'],['fall','Fall'],['breath','Breathe'],['spiral','Spiral'],['glitch','Glitch'],['pendulum','Pendulum'],['wave-float','Wave Float']];
  html+='<div class="field"><label for="prop-animation">АНІМАЦІЯ</label><select id="prop-animation">'+choices.map(([id,n])=>'<option value="'+id+'">'+(selected.kind==="sticker"?PTSUk.motion(id):n)+'</option>').join('')+'</select></div>';
 }
 if(selected.kind==="title"){
  html+=field("ПОЗИЦІЯ X, %","prop-x",c.x??50,'type="number" min="0" max="100" step="1"');
  html+=field("ПОВОРОТ, °","prop-rotation",c.rotation??0,'type="number" min="-360" max="360" step="5"');
  html+=field("РОЗМІР ТЕКСТУ, %","prop-size",c.size,'type="number" min="2" max="20" step=".5"');
  html+=field("ВИСОТА РОЗМІЩЕННЯ, %","prop-y",c.y,'type="number" min="5" max="95" step="1"');
 }
 if(selected.kind==="sticker"){
  if(c.sticker==="emoji")html+=field("ЕМОДЗІ / СИМВОЛ","prop-emoji",c.emoji||"❤️",'type="text" maxlength="48"');
  html+=field("ШВИДКІСТЬ АНІМАЦІЇ","prop-speed",c.speed??1,'type="number" min=".25" max="4" step=".25"');
  html+=field("ПОЗИЦІЯ X, %","prop-x",c.x,'type="number" min="0" max="100" step="1"');
  html+=field("ПОЗИЦІЯ Y, %","prop-y",c.y,'type="number" min="0" max="100" step="1"');
  html+=field("МАСШТАБ, %","prop-scale",c.scale,'type="number" min="3" max="90" step="1"');
  html+=field("ПОВОРОТ, °","prop-rotation",c.rotation,'type="number" min="-360" max="360" step="5"');
  if(c.sticker!=="emoji")html+='<div class="field"><label for="prop-color">КОЛІР СТІКЕРА</label><input type="color" id="prop-color" value="'+h(c.color||"#ffffff")+'"></div>';
 }
 if(selected.kind==="overlay"){
  const meta=PTSOverlays.getPreset(c.overlay);
  html+='<p class="overlay-help">Ефект охоплює весь відеокадр. Натисни «На всю довжину» для повного ролика або змінюй краї кліпу на таймлайні.</p>';
  html+='<div class="mini">'+h(meta?.name||c.overlay)+' · '+h(meta?.tag||"")+'</div>';
  if(state.overlays.length>1){
    html+='<div class="field"><label>ШАРИ FULLSCREEN FX</label><div class="overlay-layer-list">'+state.overlays.map(o=>'<button type="button" data-select-overlay="'+h(o.id)+'" class="'+(o.id===c.id?'current':'')+'">'+h(PTSOverlays.getPreset(o.overlay)?.name||o.overlay)+' <span>'+fmt(o.start)+' с</span></button>').join('')+'</div></div>';
  }

  html+=field("ІНТЕНСИВНІСТЬ, %","prop-density",c.intensity??65,'type="number" min="5" max="150" step="5"');
  html+=field("ШВИДКІСТЬ, ×","prop-overlay-speed",c.speed??1,'type="number" min=".05" max="5" step=".1"');
  html+=field("РОЗМІР ЧАСТИНОК, %","prop-overlay-size",c.size??100,'type="number" min="20" max="300" step="10"');
  html+=field("ПРОЗОРІСТЬ, %","prop-opacity",c.opacity??75,'type="number" min="0" max="100" step="5"');
  html+='<div class="field"><label for="prop-overlay-color">КОЛІР ЕФЕКТУ</label><input id="prop-overlay-color" type="color" value="'+h(c.tint||meta?.tint||"#ffffff")+'"></div>';
 }
 if(selected.kind==="effect"){
  html+='<div class="mini">'+h(PTSCreative.getEffect(c.effect)?.desc||"Ефект кадру")+'</div>';
  html+=field("ІНТЕНСИВНІСТЬ, %","prop-intensity",c.intensity,'type="number" min="0" max="150" step="5"');
 }
 if(selected.kind!=="video")html+=field("ПОЧАТОК, СЕК","prop-start",fmt(c.start),'type="number" min="0" step=".1"');
 html+=field("ТРИВАЛІСТЬ, СЕК","prop-duration",fmt(c.duration),'type="number" min=".2" step=".1"');
 if(selected.kind==="video"||selected.kind==="audio")html+=field("ПОЧАТОК В ФАЙЛІ, СЕК","prop-trim",fmt(c.trim),'type="number" min="0" step=".1"');
 if(selected.kind==="audio"){
  html+='<div class="field"><label class="loop-label"><input id="prop-loop" type="checkbox" '+(c.loop?'checked':'')+'> ПОВТОРЮВАТИ МУЗИКУ</label></div>';
  html+=field("ГУЧНІСТЬ, %","prop-volume",Math.round(c.volume*100),'type="number" min="0" max="200" step="5"');
 }
 if(selected.kind!=="video")html+='<div class="inspector-quick"><button type="button" id="fill-timeline" class="small-btn">↔ НА ВСЮ ДОВЖИНУ</button><button type="button" id="snap-begin" class="small-btn">|◀ НА ПОЧАТОК</button></div>';
 html+='<button class="small-btn" id="inspector-delete">✕ ВИДАЛИТИ ШАР</button>';node.innerHTML=html;
 if(editableText)inspectorInput("prop-text",(obj,v)=>obj.text=v);
 if(selected.kind==="title"||selected.kind==="sticker"){$("prop-animation").value=c.animation;inspectorInput("prop-animation",(obj,v)=>obj.animation=v);}
 if(selected.kind==="title"){inspectorInput("prop-x",(obj,v)=>obj.x=clamp(num(v,obj.x??50),0,100));inspectorInput("prop-rotation",(obj,v)=>obj.rotation=clamp(num(v,obj.rotation??0),-360,360));inspectorInput("prop-size",(obj,v)=>obj.size=clamp(num(v,obj.size),2,20));inspectorInput("prop-y",(obj,v)=>obj.y=clamp(num(v,obj.y),5,95));}
 if(selected.kind==="sticker"){
  if(c.sticker==="emoji")inspectorInput("prop-emoji",(obj,v)=>obj.emoji=v||"❤️");
  inspectorInput("prop-speed",(obj,v)=>obj.speed=clamp(num(v,obj.speed??1),.25,4));
  inspectorInput("prop-x",(obj,v)=>obj.x=clamp(num(v,obj.x),0,100));
  inspectorInput("prop-y",(obj,v)=>obj.y=clamp(num(v,obj.y),0,100));
  inspectorInput("prop-scale",(obj,v)=>obj.scale=clamp(num(v,obj.scale),3,90));
  inspectorInput("prop-rotation",(obj,v)=>obj.rotation=clamp(num(v,obj.rotation),-360,360));
  inspectorInput("prop-color",(obj,v)=>obj.color=v);
 }
 if(selected.kind==="overlay"){
  node.querySelectorAll("[data-select-overlay]").forEach(btn=>btn.onclick=()=>selectClip("overlay",btn.dataset.selectOverlay));
  inspectorInput("prop-density",(obj,v)=>obj.intensity=clamp(num(v,obj.intensity),5,150));
  inspectorInput("prop-overlay-speed",(obj,v)=>obj.speed=clamp(num(v,obj.speed),.05,5));
  inspectorInput("prop-overlay-size",(obj,v)=>obj.size=clamp(num(v,obj.size),20,300));
  inspectorInput("prop-opacity",(obj,v)=>obj.opacity=clamp(num(v,obj.opacity),0,100));
  inspectorInput("prop-overlay-color",(obj,v)=>obj.tint=v);
 }
 if(selected.kind==="effect")inspectorInput("prop-intensity",(obj,v)=>obj.intensity=clamp(num(v,obj.intensity),0,150));
 if(selected.kind!=="video")inspectorInput("prop-start",(obj,v)=>obj.start=Math.max(0,num(v,obj.start)));
 inspectorInput("prop-duration",(obj,v)=>{
  const media=(selected.kind==="video"||selected.kind==="audio")?getMedia(obj.mediaId):null;
  const max=media&&!(selected.kind==="audio"&&obj.loop)?Math.max(.2,media.duration-obj.trim):3600;
  obj.duration=clamp(num(v,obj.duration),.2,max);
 });
 if(selected.kind==="video"||selected.kind==="audio")inspectorInput("prop-trim",(obj,v)=>{
  const media=getMedia(obj.mediaId);obj.trim=clamp(num(v,obj.trim),0,Math.max(0,(media?.duration||0)-.2));
  obj.duration=Math.min(obj.duration,Math.max(.2,(media?.duration||.2)-obj.trim));
 });
 if(selected.kind!=="video"){
  $("fill-timeline").onclick=()=>{
   const obj=getSelected();if(!obj)return;
   const end=Math.max(videoEnd(),duration(),8);
   obj.start=0;obj.duration=clamp(end,.2,3600);
   if(selected.kind==="audio"){obj.loop=true;const n=audioNodes.get(obj.id);if(n)n.el.loop=true;}
   persist();toast("Шар розтягнуто на всю тривалість");
  };
  $("snap-begin").onclick=()=>{const obj=getSelected();if(!obj)return;obj.start=0;persist();};
 }
 if(selected.kind==="audio"){
  $("prop-loop").onchange=e=>{
   const obj=getSelected();if(!obj)return;obj.loop=e.target.checked;
   const n=audioNodes.get(obj.id);if(n)n.el.loop=obj.loop;
   if(!obj.loop){const media=getMedia(obj.mediaId);obj.duration=Math.min(obj.duration,Math.max(.2,(media?.duration||0)-(obj.trim||0)));}
   persist();
  };
 }
 if(selected.kind==="audio")inspectorInput("prop-volume",(obj,v)=>{obj.volume=clamp(num(v,100)/100,0,2);const n=audioNodes.get(obj.id);if(n)n.gain.gain.value=obj.volume;});
 $("inspector-delete").onclick=removeSelected;
}
function redraw(){renderAssets();redrawTimeline();renderInspector();setDimensions();draw(now);}
function addTitle(){const obj={id:uid(),text:"ВАШ НОВИЙ КРЕАТИВ",start:now,duration:3.5,animation:"fade",size:8,x:50,y:45,rotation:0};state.titles.push(obj);selected={kind:"title",id:obj.id};persist();}
function addSticker(id){
 const preset=PTSCreative.getSticker(id);if(!preset)return;
 const text={sale:"ЗНИЖКА −50%",shop:"КУПИТИ ЗАРАЗ ↗",new:"НОВИНКА"}[id]||"";
 const obj={id:uid(),sticker:id,text,start:now,duration:2.5,animation:"pop",speed:1,x:50,y:35,scale:20,rotation:0,color:"#ffffff"};
 state.stickers.push(obj);selected={kind:"sticker",id:obj.id};persist();toast(preset.name+" додано");
}
function addEmoji(emoji,name,animation="bounce"){
 const obj={id:uid(),sticker:"emoji",emoji,text:"",name:name||emoji,start:now,duration:3,animation,speed:1,x:50,y:40,scale:22,rotation:0,color:"#ffffff"};
 state.stickers.push(obj);selected={kind:"sticker",id:obj.id};persist();seek(Math.min(now+.3,duration()));
 toast("Емодзі додано: "+emoji);
}
function addMotion(name){
 const motions={bounce:"❤️",heartbeat:"💓",float:"✨",swing:"💫",spin:"🔄",pulse:"💗",jitter:"⚡",orbit:"🌍",rain:"💧",wave:"〰️",flash:"🌟",slide:"➡️",pop:"🎉",flip:"🃏","bounce-in":"🚀",drift:"🦋",rubber:"🎈",squash:"🫧",tada:"🎉","shake-x":"💥","flip-y":"🪙",rise:"📈",fall:"🍂",breath:"🧘",spiral:"🌀",glitch:"⚡",pendulum:"🔔","wave-float":"🌊"};
 addEmoji(motions[name]||"❤️",name,name);
}
function addEffect(id){
 const preset=PTSCreative.getEffect(id);if(!preset)return;
 const obj={id:uid(),effect:id,start:now,duration:preset.duration,intensity:65};
 state.effects.push(obj);selected={kind:"effect",id:obj.id};persist();toast(preset.name+" додано");
}
function addOverlay(id){
 const meta=PTSOverlays.getPreset(id);if(!meta)return;
 const base=videoEnd()||duration()||8;
 const layer={id:uid(),overlay:id,start:now,duration:Math.max(.5,base-now),intensity:65,speed:1,size:100,opacity:80,tint:meta.tint,seed:Math.floor(Math.random()*100000)};
 state.overlays.push(layer);selected={kind:"overlay",id:layer.id};persist();seek(Math.min(layer.start+.15,layer.start+layer.duration-.01));toast(meta.name+" — ефект на весь екран");
}
function addCaption(){const obj={id:uid(),text:"Ваш текст субтитрів",start:now,duration:3};state.captions.push(obj);selected={kind:"caption",id:obj.id};persist();}
function removeSelected(){
 const c=getSelected();if(!c)return;
 if(selected.kind==="video")state.clips=state.clips.filter(x=>x.id!==c.id);
 if(selected.kind==="title")state.titles=state.titles.filter(x=>x.id!==c.id);
 if(selected.kind==="caption")state.captions=state.captions.filter(x=>x.id!==c.id);
 if(selected.kind==="sticker")state.stickers=state.stickers.filter(x=>x.id!==c.id);
 if(selected.kind==="effect")state.effects=state.effects.filter(x=>x.id!==c.id);
 if(selected.kind==="overlay")state.overlays=state.overlays.filter(x=>x.id!==c.id);
 if(selected.kind==="audio"){state.audios=state.audios.filter(x=>x.id!==c.id);const n=audioNodes.get(c.id);if(n){n.el.pause();n.el.src="";n.source.disconnect();audioNodes.delete(c.id);}}
 selected=null;persist();
}
function splitSelected(){
 const c=getSelected();if(!c||selected.kind!=="video"){toast("Для розрізання обери відеофрагмент.");return;}
 const offset=now-c.start;if(offset<.15||offset>c.duration-.15){toast("Постав курсор всередині фрагмента.");return;}
 const second={...c,id:uid(),start:now,trim:c.trim+offset,duration:c.duration-offset};
 c.duration=offset;const ix=state.clips.findIndex(x=>x.id===c.id);state.clips.splice(ix+1,0,second);selected={kind:"video",id:second.id};persist();toast("Фрагмент розрізано");
}
function moveSelected(dir){
 const c=getSelected();if(!c)return;
 if(selected.kind==="video"){const ix=state.clips.indexOf(c),next=ix+dir;if(next<0||next>=state.clips.length)return;state.clips.splice(ix,1);state.clips.splice(next,0,c);reorder();}
 else c.start=Math.max(0,c.start+dir*.5);
 persist();
}
function frameDimensions(ratio=state.ratio,side=renderShortSide){
 const aspects={"9:16":[9,16],"4:5":[4,5],"1:1":[1,1],"16:9":[16,9]};
 const [rw,rh]=aspects[ratio]||aspects["9:16"];
 const scale=side/Math.min(rw,rh);
 // Keep integer even dimensions for broad hardware codec support.
 const even=n=>Math.max(2,Math.round(n/2)*2);
 return [even(rw*scale),even(rh*scale)];
}
function setDimensions(){
 const [w,h]=frameDimensions();
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 canvas.style.aspectRatio=w+"/"+h;
 const maxW=Math.min(680,Math.max(160,$("canvas-frame").parentElement.clientWidth-25));
 const maxH=Math.min(490,Math.max(150,$("canvas-frame").parentElement.clientHeight-36));
 const scale=Math.min(maxW/w,maxH/h);
 canvas.style.width=Math.round(w*scale)+"px";canvas.style.height=Math.round(h*scale)+"px";
 updateOverlay();
}
function drawCover(source,w,h){
 const sw=source.videoWidth||source.naturalWidth,sh=source.videoHeight||source.naturalHeight;
 if(!sw||!sh)return;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 const scale=Math.max(w/sw,h/sh),dw=sw*scale,dh=sh*scale;
 ctx.drawImage(source,(w-dw)/2,(h-dh)/2,dw,dh);
}
const imageCache=new Map();let activeVideoId=null;
function syncVideo(t,shouldPlay){
 const c=state.clips.find(c=>t>=c.start&&t<c.start+c.duration),media=c?getMedia(c.mediaId):null;
 if(!c||!media||media.kind!=="video"||!assetUrls.has(media.id)){video.pause();return null;}
 if(activeVideoId!==media.id){activeVideoId=media.id;video.src=assetUrls.get(media.id);video.load();}
 const desired=c.trim+(t-c.start);
 if(video.readyState>=1&&Math.abs(video.currentTime-desired)>.27){try{video.currentTime=desired;}catch(e){}}
 if(shouldPlay&&video.paused){video.play().catch(()=>{});}else if(!shouldPlay&&!video.paused)video.pause();
 return video;
}
function breakLines(text,maxWidth,font){
 ctx.font=font;const result=[];String(text).split("\n").forEach(p=>{let line="";for(const word of p.split(/\s+/)){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){result.push(line);line=word;}else line=test;}result.push(line);});return result;
}
function drawText(x){
 const t=(now-x.start)/x.duration,fade=Math.min(1,t*5,(1-t)*5);
 const cx=canvas.width*(x.x??50)/100,cy=canvas.height*(x.y??45)/100;
 ctx.save();ctx.globalAlpha=clamp(fade,0,1);if(x.animation==="none")ctx.globalAlpha=1;
 ctx.translate(cx,cy);ctx.rotate((x.rotation||0)*Math.PI/180);
 if(x.animation==="slide")ctx.translate(0,(1-clamp(t*5,0,1))*50);
 if(x.animation==="pop")ctx.scale(.85+.15*clamp(t*6,0,1),.85+.15*clamp(t*6,0,1));
 if(x.animation==="pulse"||x.animation==="bounce"){const scale=x.animation==="pulse"?1+.045*Math.sin((now-x.start)*9):.9+.12*Math.abs(Math.sin((now-x.start)*12));ctx.scale(scale,scale);}
 const fontSize=canvas.width*x.size/100,font="900 "+Math.round(fontSize)+"px Arial, sans-serif";
 const txt=x.animation==="typewriter"?x.text.slice(0,Math.ceil(x.text.length*Math.min(1,(now-x.start)/Math.min(.9,x.duration)*1.1))):x.text;
 const lines=breakLines(txt,canvas.width*.86,font),lineHeight=fontSize*1.13;
 ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=font;
 const top=-(lines.length-1)*lineHeight/2;
 lines.forEach((line,i)=>{ctx.shadowColor="#000";ctx.shadowBlur=8;ctx.fillText(line,0,top+i*lineHeight);});
 ctx.restore();
}
/* On-canvas element controls. HTML handles stay outside Canvas captureStream/export. */
const overlay=$("selection-overlay"),selectionBox=$("selection-box");
function activeSelection(){
 if(!selected||!["sticker","title"].includes(selected.kind))return null;
 const item=getSelected();if(!item||now<item.start-.05||now>item.start+item.duration+.05)return null;
 return item;
}
function overlayGeometry(c,kind){
 const w=canvas.width,h=canvas.height,S=Math.min(w,h);
 if(kind==="sticker"){
  const base=S*.28*((c.scale??20)/20);
  return {width:Math.max(25,c.sticker==="emoji"?base*.83:base*1.3),height:Math.max(25,base*.9)};
 }
 const size=w*(c.size||8)/100,font="900 "+Math.round(size)+"px Arial";
 ctx.save();ctx.font=font;
 const rows=String(c.text||"TEXT").split("\n");
 const width=clamp(Math.max(...rows.map(line=>ctx.measureText(line).width))+size*.5,36,w*.95);
 ctx.restore();return {width,height:Math.max(26,rows.length*size*1.15)};
}
function updateOverlay(){
 const item=activeSelection();
 if(!item||playing||exportRecorder){selectionBox.hidden=true;return;}
 const kind=selected.kind,dim=overlayGeometry(item,kind);
 const x=item.x??50,y=item.y??45;
 selectionBox.hidden=false;
 selectionBox.style.left=x+"%";selectionBox.style.top=y+"%";
 selectionBox.style.width=Math.max(2,Math.min(dim.width/canvas.width*100,2*Math.min(x,100-x)-4))+"%";
 selectionBox.style.height=Math.max(1,dim.height/canvas.height*100)+"%";
 selectionBox.style.transform="translate(-50%,-50%) rotate("+(item.rotation||0)+"deg)";
}
function pointInCanvas(e){
 const rect=canvas.getBoundingClientRect();
 return {x:(e.clientX-rect.left)/rect.width*canvas.width,y:(e.clientY-rect.top)/rect.height*canvas.height};
}
function selectElementAt(e){
 if(playing||exportRecorder)return;
 const p=pointInCanvas(e);
 const candidates=[...state.titles.map(c=>({kind:"title",c})),...state.stickers.map(c=>({kind:"sticker",c}))];
 for(let i=candidates.length-1;i>=0;i--){
  const {c,kind}=candidates[i];if(now<c.start||now>=c.start+c.duration)continue;
  const dim=overlayGeometry(c,kind),cx=canvas.width*(c.x??50)/100,cy=canvas.height*(c.y??45)/100;
  const a=-(c.rotation||0)*Math.PI/180,dx=p.x-cx,dy=p.y-cy;
  const xx=dx*Math.cos(a)-dy*Math.sin(a),yy=dx*Math.sin(a)+dy*Math.cos(a);
  if(Math.abs(xx)<dim.width*.6+12&&Math.abs(yy)<dim.height*.6+12){
   selectClip(kind,c.id);draw(now);return;
  }
 }
}
canvas.addEventListener("pointerdown",selectElementAt);
selectionBox.addEventListener("pointerdown",e=>{
 if(e.button!==0||!activeSelection())return;
 e.stopPropagation();e.preventDefault();stop();
 const item=activeSelection(),p=pointInCanvas(e),kind=selected.kind;
 const cx=(item.x??50)*canvas.width/100,cy=(item.y??45)*canvas.height/100;
 const startDistance=Math.max(16,Math.hypot(p.x-cx,p.y-cy));
 canvasDrag={id:item.id,kind,mode:e.target.closest("[data-transform]")?.dataset.transform||"move",
  pointerX:p.x,pointerY:p.y,x:item.x??50,y:item.y??45,scale:kind==="title"?item.size:item.scale,
  rotation:item.rotation||0,angle:Math.atan2(p.y-cy,p.x-cx),distance:startDistance,moved:false};
 selectionBox.setPointerCapture(e.pointerId);
});
selectionBox.addEventListener("pointermove",e=>{
 if(!canvasDrag)return;
 const d=canvasDrag,item=clipList(d.kind).find(c=>c.id===d.id);if(!item)return;
 const p=pointInCanvas(e),dx=p.x-d.pointerX,dy=p.y-d.pointerY;
 if(Math.abs(dx)+Math.abs(dy)<1&&!d.moved)return;d.moved=true;
 if(d.mode==="move"){
  item.x=clamp(d.x+dx/canvas.width*100,0,100);
  item.y=clamp(d.y+dy/canvas.height*100,0,100);
 }else if(d.mode==="resize"){
  // The bottom-right resize handle behaves like a design-tool handle:
  // dragging it right/down grows the object; left/up shrinks it.
  // Use pointer displacement, not distance from center (which can reverse
  // when the handle crosses the center or when a rotated box is selected).
  const delta=(dx+dy)/Math.max(80,Math.min(canvas.width,canvas.height)*.28);
  const ratio=clamp(1+delta,.15,5);
  if(d.kind==="title")item.size=clamp(d.scale*ratio,2,25);
  else item.scale=clamp(d.scale*ratio,3,90);
 }else if(d.mode==="rotate"){
  const cx=d.x*canvas.width/100,cy=d.y*canvas.height/100;
  const diff=(Math.atan2(p.y-cy,p.x-cx)-d.angle)*180/Math.PI;
  item.rotation=clamp(Math.round((d.rotation+diff)/2)*2,-360,360);
 }
 markDirty();draw(now);
});
function finishCanvasDrag(){
 if(!canvasDrag)return;
 const moved=canvasDrag.moved;canvasDrag=null;
 if(moved)persist();else updateOverlay();
}
selectionBox.addEventListener("pointerup",finishCanvasDrag);
selectionBox.addEventListener("pointercancel",finishCanvasDrag);
selectionBox.addEventListener("lostpointercapture",finishCanvasDrag);
function drawCaption(x){
 ctx.save();let fontSize=Math.round(canvas.width*.043);const font="700 "+fontSize+"px Arial, sans-serif",lines=breakLines(x.text,canvas.width*.86,font).slice(0,4),lineHeight=fontSize*1.35;
 const top=canvas.height*.84-(lines.length-1)*lineHeight/2,padding=15;
 ctx.fillStyle="rgba(0,0,0,.78)";ctx.fillRect(canvas.width*.055,top-fontSize*.65-padding,canvas.width*.89,lines.length*lineHeight+padding*1.8);
 ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff";ctx.font=font;
 lines.forEach((line,i)=>ctx.fillText(line,canvas.width/2,top+i*lineHeight));ctx.restore();
}
function draw(t){
 now=clamp(t,0,duration());const w=canvas.width,hh=canvas.height;ctx.fillStyle="#080809";ctx.fillRect(0,0,w,hh);
 const activeEffects=state.effects.filter(e=>now>=e.start&&now<e.start+e.duration);
 PTSCreative.beforeFrame(ctx,w,hh,activeEffects,now);
 const clip=state.clips.find(c=>now>=c.start&&now<c.start+c.duration),m=clip?getMedia(clip.mediaId):null;
 if(m){const url=assetUrls.get(m.id);
  if(m.kind==="video"){const el=syncVideo(now,playing);if(el&&el.readyState>=2){try{drawCover(el,w,hh);}catch(e){}}}
  else if(m.kind==="image"&&url){let img=imageCache.get(m.id);if(!img){img=new Image();img.src=url;imageCache.set(m.id,img);img.onload=()=>draw(now);}if(img.complete&&img.naturalWidth)drawCover(img,w,hh);video.pause();}
 }else{video.pause();if(!state.clips.length&&!state.titles.length&&!state.captions.length&&!state.stickers.length&&!state.effects.length){ctx.fillStyle="#f4f4f4";ctx.font="900 "+Math.round(w*.095)+"px Arial";ctx.textAlign="center";ctx.fillText("PTS",w/2,hh/2-20);ctx.fillStyle="#888";ctx.font=Math.round(w*.026)+"px Arial";ctx.fillText("ДОДАЙТЕ МЕДІА ДЛЯ ПОЧАТКУ",w/2,hh/2+28);}}
 ctx.restore();
 PTSCreative.afterFrame(ctx,w,hh,activeEffects,now);
 state.overlays.filter(c=>now>=c.start&&now<c.start+c.duration)
   .forEach(c=>PTSOverlays.draw(ctx,w,hh,c,now));
 state.titles.filter(c=>now>=c.start&&now<c.start+c.duration).forEach(drawText);
 state.stickers.filter(c=>now>=c.start&&now<c.start+c.duration).forEach(c=>PTSCreative.drawSticker(ctx,w,hh,c,now));
 state.captions.filter(c=>now>=c.start&&now<c.start+c.duration).forEach(drawCaption);
 positionHead();updateOverlay();
}
function seek(t){const wasPlaying=playing;now=clamp(t,0,duration());syncVideo(now,wasPlaying);syncAudio(now,wasPlaying);draw(now);}
async function initializeAudio(){
 if(audioContext)return;
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)return;
 audioContext=new AC();mixDestination=audioContext.createMediaStreamDestination();
 try{videoSourceNode=audioContext.createMediaElementSource(video);videoSourceNode.connect(audioContext.destination);videoSourceNode.connect(mixDestination);}catch(e){console.warn("Video audio routing",e);}
}
function getAudioNode(c){
 let n=audioNodes.get(c.id);if(n)return n;
 const url=assetUrls.get(c.mediaId);if(!url||!audioContext)return null;
 const el=new Audio(url);el.preload="auto";el.loop=!!c.loop;const source=audioContext.createMediaElementSource(el),gain=audioContext.createGain();
 gain.gain.value=c.volume;source.connect(gain);gain.connect(audioContext.destination);gain.connect(mixDestination);n={el,source,gain};audioNodes.set(c.id,n);return n;
}
function syncAudio(t,shouldPlay){
 if(!audioContext)return;
 const active=new Set();
 for(const c of state.audios){
  if(t<c.start||t>=c.start+c.duration)continue;active.add(c.id);
  const n=getAudioNode(c);if(!n)continue;
  const available=Math.max(.2,(getMedia(c.mediaId)?.duration||0)-c.trim);
  const desired=c.trim+(c.loop?(t-c.start)%available:(t-c.start));
  n.gain.gain.value=c.volume;
  if(n.el.readyState>0&&Math.abs(n.el.currentTime-desired)>.28){try{n.el.currentTime=desired;}catch(e){}}
  if(shouldPlay&&n.el.paused)n.el.play().catch(()=>{});
  else if(!shouldPlay&&!n.el.paused)n.el.pause();
 }
 for(const [id,n] of audioNodes)if(!active.has(id))n.el.pause();
}
function stop(){playing=false;cancelAnimationFrame(frame);video.pause();syncAudio(now,false);$("play-btn").textContent="▶";}
function tick(){
 if(!playing)return;
 const t=startedFrom+(performance.now()-startedAt)/1000;
 if(t>=duration()){seek(duration());stop();return;}
 now=t;syncVideo(now,true);syncAudio(now,true);draw(now);frame=requestAnimationFrame(tick);
}
async function play(){
 if(playing){stop();return;}
 PTSCreative.stopPreview();
 if(now>=duration()-.05)now=0;
 await initializeAudio();if(audioContext)await audioContext.resume();
 playing=true;startedAt=performance.now();startedFrom=now;$("play-btn").textContent="Ⅱ";tick();
}
function srtSeconds(str){const p=str.trim().replace(",",".").split(":");return p.length===3?num(p[0])*3600+num(p[1])*60+num(p[2]):0;}
async function importSrt(file){
 if(!file)return;const content=(await file.text()).replace(/\r/g,"");let count=0;
 for(const block of content.split(/\n\s*\n/)){
  const lines=block.split("\n").map(x=>x.trim()).filter(Boolean);const line=lines.findIndex(x=>x.includes("-->"));if(line<0)continue;
  const [start,end]=lines[line].split("-->").map(srtSeconds);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;
  const text=lines.slice(line+1).join("\n");if(!text)continue;
  state.captions.push({id:uid(),start,duration:end-start,text});count++;
 }
 if(count){selected={kind:"caption",id:state.captions[state.captions.length-1].id};persist();toast("Імпортовано субтитрів: "+count);}else toast("SRT не містить коректних таймкодів.");
}
function exportSettings(){
 const choices=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=avc1.42E01E","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp9","video/webm;codecs=vp8,opus","video/webm"];
 const type=typeof MediaRecorder!=="undefined"?choices.find(t=>MediaRecorder.isTypeSupported(t)):"";
 return {type,extension:type&&type.startsWith("video/mp4")?"mp4":"webm"};
}
function getExportQuality(){
 const value=$("export-quality").value;
 return {side:EXPORT_QUALITY[value]?Number(value):1080,...(EXPORT_QUALITY[value]||EXPORT_QUALITY["1080"])};
}
function updateExportDetails(){
 const {type,extension}=exportSettings(),quality=getExportQuality();
 const [w,h]=frameDimensions(state.ratio,quality.side);
 $("export-resolution").textContent=w+" × "+h;
 $("export-duration").textContent=fmt(duration())+" сек";
 $("export-format").textContent=type?extension.toUpperCase():"Недоступно";
 $("export-bitrate").textContent="Відеобітрейт: "+(quality.bitrate/1e6)+" Мбіт/с (запит до браузера) · 30 FPS · аудіо до 256 кбіт/с";
 $("quality-note").textContent=quality.side===2160
  ?"4K вимагає потужного пристрою та підтримки кодека; можливі пропущені кадри"
  :quality.side===1440?"2K · вищі вимоги до процесора та памʼяті"
  :quality.side===1080?"Full HD · рекомендований баланс якості та швидкості"
  :"HD · компактніший файл, менше деталей";
 $("start-export").disabled=!type||!canvas.captureStream;
 if(!type)$("export-message").textContent="Цей браузер не підтримує MediaRecorder.";
 else $("export-message").textContent="Експорт виконується в реальному часі. Вихідна роздільність не покращує деталі низькоякісного оригіналу. Кодек і фактичний бітрейт визначає браузер.";
}
function openExport(){
 $("export-quality").value=String(state.exportQuality||"1080");
 updateExportDetails();
 $("export-progress").hidden=true;
 $("export-progress").value=0;
 $("export-dialog").showModal();
}
async function startExport(){
 if(exportRecorder)return;
 const {type}=exportSettings();
 if(!type){toast("Браузер не підтримує експорт.");return;}
 const quality=getExportQuality();
 state.exportQuality=String(quality.side);store();
 stop();await initializeAudio();if(audioContext)await audioContext.resume();
 // A full-resolution canvas is created BEFORE captureStream. Preview
 // remains Full HD independently of selected output quality.
 renderShortSide=quality.side;
 setDimensions();
 seek(0);
 const stream=canvas.captureStream(30),tracks=[...stream.getVideoTracks()];
 if(mixDestination)tracks.push(...mixDestination.stream.getAudioTracks());
 const mixed=new MediaStream(tracks),chunks=[];exportCancelled=false;
 let recorder;
 try{
  recorder=new MediaRecorder(mixed,{mimeType:type,videoBitsPerSecond:quality.bitrate,audioBitsPerSecond:256000});
 }catch(e){
  mixed.getTracks().forEach(t=>t.stop());
  renderShortSide=PREVIEW_SHORT_SIDE;setDimensions();draw(now);
  toast("Не вдалося запустити експорт: "+e.message);return;
 }
 exportRecorder=recorder;
 $("export-progress").value=0;$("export-progress").hidden=false;
 $("start-export").disabled=true;$("export-quality").disabled=true;
 $("cancel-export").textContent="СКАСУВАТИ";
 $("export-message").textContent="Експорт "+quality.label+" у процесі. Бітрейт, запитаний у браузера: "+(quality.bitrate/1e6)+" Мбіт/с. Не закривай вкладку.";
 recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
 recorder.onerror=e=>{console.error("MediaRecorder export",e);exportCancelled=true;toast("Помилка відеорендера.");};
 recorder.onstop=()=>{
  exportRecorder=null;stop();mixed.getTracks().forEach(t=>t.stop());
  $("start-export").disabled=false;$("export-quality").disabled=false;
  $("cancel-export").textContent="ЗАКРИТИ";
  if(!exportCancelled&&chunks.length){
   const blob=new Blob(chunks,{type:recorder.mimeType});
   const url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;
   a.download=(state.name||"creative").replace(/[^\w\u0400-\u04FF-]+/g,"-")+"-"+quality.label.replace(/\s/g,"")+"."+(recorder.mimeType.startsWith("video/mp4")?"mp4":"webm");
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   toast("Відео експортовано: "+quality.label);
  }else if(!exportCancelled){toast("Запис не містить кадрів.");}
  renderShortSide=PREVIEW_SHORT_SIDE;
  setDimensions();seek(0);
  $("export-dialog").close();
 };
 // Avoid starting playback before the recorder has been armed.
 await new Promise(r=>setTimeout(r,180));
 try{recorder.start(400);await play();}
 catch(e){
  console.error("Export start failed",e);exportCancelled=true;
  if(recorder.state!=="inactive")recorder.stop();
  else {exportRecorder=null;mixed.getTracks().forEach(t=>t.stop());renderShortSide=PREVIEW_SHORT_SIDE;setDimensions();}
  toast("Експорт зупинено: "+e.message);return;
 }
 const progressLoop=()=>{
  if(!exportRecorder||exportRecorder!==recorder)return;
  $("export-progress").value=duration()?now/duration()*100:100;
  if(!playing||now>=duration()-.06){
   setTimeout(()=>{if(exportRecorder===recorder&&recorder.state!=="inactive")recorder.stop();},300);
  }else requestAnimationFrame(progressLoop);
 };
 requestAnimationFrame(progressLoop);
}
async function toggleMic(){
 if(micRecorder&&micRecorder.state==="recording"){micRecorder.stop();return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast("Для мікрофона потрібен HTTPS та підтримка MediaRecorder.");return;}
 try{
  micStream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];
  const type=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(t=>MediaRecorder.isTypeSupported(t));
  micRecorder=new MediaRecorder(micStream,type?{mimeType:type}:{});
  micRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  micRecorder.onstop=async()=>{
   const blob=new Blob(chunks,{type:micRecorder.mimeType||"audio/webm"});micStream.getTracks().forEach(t=>t.stop());$("record-btn").classList.remove("active-record");$("record-label").textContent="ЗАПИС ОЗВУЧКИ";$("record-icon").textContent="＋";
   micRecorder=null;if(blob.size){const ext=blob.type.includes("mp4")?"m4a":"webm";const f=new File([blob],"voiceover-"+Date.now()+"."+ext,{type:blob.type});await importFiles([f]);}
  };
  micRecorder.start();$("record-btn").classList.add("active-record");$("record-label").textContent="ЗУПИНИТИ ЗАПИС";$("record-icon").textContent="■";toast("Запис мікрофона розпочато.");
 }catch(e){toast("Немає доступу до мікрофона: "+e.message);}
}
async function boot(){
 try{
  db=await createDB();
  const old=JSON.parse(localStorage.getItem(PROJECT_KEY)||"null");
  if(old&&old.version===1){state={...state,...old,stickers:Array.isArray(old.stickers)?old.stickers:[],effects:Array.isArray(old.effects)?old.effects:[],overlays:Array.isArray(old.overlays)?old.overlays:[]};}
  const all=await allBlobs();for(const a of all)assetUrls.set(a.id,URL.createObjectURL(a.file));
  $("project-name").value=state.name;$("ratio").value=state.ratio;
  redraw();seek(0);
 }catch(e){console.error(e);toast("Помилка завантаження локальних даних.");}
}
$("file-input").addEventListener("change",async e=>{await importFiles(e.target.files);e.target.value="";});
$("srt-input").addEventListener("change",async e=>{await importSrt(e.target.files[0]);e.target.value="";});
document.querySelectorAll("[data-workspace]").forEach(button=>button.addEventListener("click",()=>{
 const target=button.dataset.workspace;
 document.querySelectorAll("[data-workspace]").forEach(el=>{const on=el===button;el.classList.toggle("active",on);el.setAttribute("aria-selected",String(on));});
 $("media-view").hidden=target!=="media";$("creative-view").hidden=target!=="creative";
 if(target!=="creative"){$("library-expand").setAttribute("aria-pressed","false");document.querySelector(".library").classList.remove("library-expanded");PTSCreative.stopPreview();}
}));
$("library-expand").addEventListener("click",()=>{
 const aside=document.querySelector(".library"),wide=aside.classList.toggle("library-expanded");
 $("library-expand").setAttribute("aria-pressed",String(wide));
 $("library-expand").textContent=wide?"⤡":"⤢";
});
PTSCreative.makePanel($("creative-library"),{
  addSticker,addEffect,addEmoji,addMotion,addOverlay,
  addMusic:async file=>{await importFiles([file]);toast("Музику додано на аудіодоріжку");},
  error:toast
 });
 $("add-title").onclick=addTitle;$("add-caption").onclick=addCaption;$("record-btn").onclick=toggleMic;
$("split-btn").onclick=splitSelected;$("delete-btn").onclick=removeSelected;
$("left-btn").onclick=()=>moveSelected(-1);$("right-btn").onclick=()=>moveSelected(1);
$("save-btn").onclick=()=>{store();toast("Проєкт збережено в цьому браузері.");};
$("project-name").addEventListener("change",store);
$("ratio").addEventListener("change",()=>{state.ratio=$("ratio").value;persist();});
$("zoom").addEventListener("input",redrawTimeline);
$("play-btn").onclick=play;$("to-start").onclick=()=>{stop();seek(0);};$("forward").onclick=()=>seek(now+1);
$("export-btn").onclick=openExport;$("export-quality").addEventListener("change",updateExportDetails);$("start-export").onclick=startExport;
$("cancel-export").onclick=()=>{if(exportRecorder){exportCancelled=true;exportRecorder.stop();}else $("export-dialog").close();};
$("export-dialog").addEventListener("cancel",e=>{if(exportRecorder){e.preventDefault();exportCancelled=true;exportRecorder.stop();}});
$("track-inner").addEventListener("click",e=>{if(e.target.classList.contains("track")||e.target.id==="ruler"){const box=$("track-inner").getBoundingClientRect();stop();seek((e.clientX-box.left)/num($("zoom").value,65));}});
$("drop-zone").addEventListener("dragover",e=>{e.preventDefault();$("drop-zone").classList.add("drag");});
$("drop-zone").addEventListener("dragleave",()=>$("drop-zone").classList.remove("drag"));
$("drop-zone").addEventListener("drop",e=>{e.preventDefault();$("drop-zone").classList.remove("drag");importFiles(e.dataTransfer.files);});
document.addEventListener("keydown",e=>{if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;if(e.code==="Space"){e.preventDefault();play();}if(e.code==="Delete"||e.code==="Backspace"){e.preventDefault();removeSelected();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();store();toast("Збережено");}});
window.addEventListener("resize",()=>{setDimensions();draw(now);redrawTimeline();});
window.addEventListener("beforeunload",()=>{stop();});
video.addEventListener("loadeddata",()=>draw(now));video.addEventListener("seeked",()=>{if(!playing)draw(now);});
boot();
})();