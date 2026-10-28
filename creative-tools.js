/* PTS Creative Studio · Original creative tools
 * All animation, shapes and procedural music are generated on-device.
 * No external media, copyrighted recordings, AI endpoints, or paid SDKs.
 */
(function(global){
"use strict";
const STICKERS=[
 {id:"sale",name:"SALE / -50%",symbol:"−50%",group:"CTA"},
 {id:"shop",name:"SHOP NOW",symbol:"↗",group:"CTA"},
 {id:"new",name:"NEW DROP",symbol:"NEW",group:"CTA"},
 {id:"arrow",name:"Motion Arrow",symbol:"↗",group:"SHAPES"},
 {id:"star",name:"Starburst",symbol:"★",group:"SHAPES"},
 {id:"heart",name:"Heart",symbol:"♥",group:"SHAPES"},
 {id:"check",name:"Verified",symbol:"✓",group:"SHAPES"},
 {id:"sparkles",name:"Sparkles",symbol:"✧",group:"SHAPES"},
 {id:"badge",name:"Best Seller",symbol:"BEST",group:"AD BADGES"},
 {id:"bubble",name:"Speech Bubble",symbol:"💬",group:"SOCIAL"},
 {id:"price",name:"Price Drop",symbol:"$ ↓",group:"AD BADGES"},
 {id:"free",name:"FREE SHIPPING",symbol:"FREE",group:"AD BADGES"},
 {id:"notification",name:"Notification",symbol:"🔔",group:"SOCIAL"},
 {id:"comment",name:"New Comment",symbol:"♥",group:"SOCIAL"},
 {id:"countdown",name:"Countdown",symbol:"03",group:"CTA"},
 {id:"click",name:"Tap Here",symbol:"☝",group:"CTA"},
 {id:"arrow-down",name:"Arrow Down",symbol:"↓",group:"CTA"},
 {id:"double-arrow",name:"Swipe Arrows",symbol:"»",group:"CTA"},
 {id:"play",name:"Play Button",symbol:"▶",group:"CTA"},
 {id:"crown",name:"Premium Crown",symbol:"♛",group:"LUXURY"},
 {id:"gift",name:"Gift Box",symbol:"🎁",group:"LIFESTYLE"},
 {id:"fire",name:"Flame",symbol:"🔥",group:"LIFESTYLE"},
 {id:"ring",name:"Highlight Ring",symbol:"◉",group:"SHAPES"},
 {id:"progress",name:"Loading Ring",symbol:"◌",group:"SHAPES"},
 {id:"burst",name:"Impact Burst",symbol:"✺",group:"SHAPES"},
 {id:"underline",name:"Underline",symbol:"＿",group:"SHAPES"},
 {id:"location",name:"Map Pin",symbol:"⌖",group:"SHAPES"}];
const EFFECTS=[
 {id:"flash",name:"Flash Cut",desc:"Світловий спалах",symbol:"✺",duration:1},
 {id:"shake",name:"Impact Shake",desc:"Кінематографічний поштовх",symbol:"⌁",duration:2},
 {id:"zoom",name:"Dynamic Zoom",desc:"Плавне наближення",symbol:"⤢",duration:3},
 {id:"grain",name:"Film Grain",desc:"Фактура плівки",symbol:"▦",duration:4},
 {id:"vignette",name:"Dark Vignette",desc:"Фокус на центрі",symbol:"◎",duration:5},
 {id:"mono",name:"Monochrome",desc:"Чорно-біла експозиція",symbol:"◑",duration:4},
 {id:"letterbox",name:"Cinema Bars",desc:"Кіношні чорні смуги",symbol:"▰",duration:4},
 {id:"sweep",name:"Light Sweep",desc:"Світловий прохід",symbol:"╱",duration:2},
 {id:"contrast",name:"Sharp Contrast",desc:"Високий контраст",symbol:"◐",duration:3},
 {id:"blur",name:"Dream Blur",desc:"Плавна м'якість",symbol:"◌",duration:3},
 {id:"sepia",name:"Vintage Film",desc:"Сепія",symbol:"⌘",duration:4},
 {id:"invert",name:"Negative Cut",desc:"Інверсія кольору",symbol:"◩",duration:1},
 {id:"strobe",name:"Strobe Pulse",desc:"Ритмічний строб",symbol:"✳",duration:2},
 {id:"glow",name:"Soft Glow",desc:"М'яке світіння",symbol:"☼",duration:3},
 {id:"fade-black",name:"Fade to Black",desc:"Затемнення",symbol:"◕",duration:2},
 {id:"cool",name:"Cool Tone",desc:"Холодна експозиція",symbol:"❄",duration:4}];
const MUSIC=[
 {id:"pulse",name:"CINEMATIC PULSE",category:"Action / Ads",bpm:120,key:52,melody:[0,3,7,10],chord:[0,3,7],beat:true},
 {id:"luxury",name:"LUXURY MINIMAL",category:"Beauty / Fashion",bpm:92,key:57,melody:[0,7,5,3],chord:[0,4,7],beat:false},
 {id:"upbeat",name:"UPBEAT PROMO",category:"Reels / Retail",bpm:132,key:60,melody:[0,4,7,12],chord:[0,4,7],beat:true},
 {id:"tension",name:"DARK TENSION",category:"Teaser / Hook",bpm:104,key:48,melody:[0,1,7,6],chord:[0,1,7],beat:true},
 {id:"bright",name:"BRAND MOTION",category:"Corporate / B2B",bpm:112,key:55,melody:[0,4,9,7],chord:[0,4,7],beat:true}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const hash=n=>{const s=Math.sin(n*78.233+12.981)*43758.5453;return (s-Math.floor(s))*2-1;};
const chosen={tab:"stickers"};
const fileCache=new Map();let previewAudio=null,previewObjectUrl=null;
function getSticker(id){return STICKERS.find(s=>s.id===id);}
function getEffect(id){return EFFECTS.find(s=>s.id===id);}
function getMusic(id){return MUSIC.find(s=>s.id===id);}
function makePanel(node,actions){
 function show(tab){
  chosen.tab=tab;
  node.innerHTML='<div class="creative-tabs" role="tablist" aria-label="Бібліотека креативів">'+
    [['stickers','СТІКЕРИ'],['effects','ЕФЕКТИ'],['music','МУЗИКА']].map(([id,label])=>'<button type="button" role="tab" aria-selected="'+(tab===id)+'" data-library-tab="'+id+'" class="'+(tab===id?'active':'')+'">'+label+'</button>').join('')+'</div>'+
    '<div class="creative-list">'+(
     tab==='stickers'?
     '<div class="creative-subtitle">Анімації та CTA</div>'+STICKERS.map(s=>'<button type="button" class="creative-card" data-sticker="'+s.id+'"><span class="creative-symbol">'+s.symbol+'</span><span class="creative-text"><b>'+s.name+'</b><small>'+s.group+' / MOTION</small></span><span class="creative-add">＋</span></button>').join(''):
     tab==='effects'?
     '<div class="creative-subtitle">Ефекти кадру</div>'+EFFECTS.map(s=>'<button type="button" class="creative-card" data-effect="'+s.id+'"><span class="creative-symbol">'+s.symbol+'</span><span class="creative-text"><b>'+s.name+'</b><small>'+s.desc+'</small></span><span class="creative-add">＋</span></button>').join(''):
     '<div class="creative-subtitle">5 оригінальних синтезованих лупів · без роялті</div>'+MUSIC.map(s=>'<div class="music-card"><button type="button" class="music-preview" aria-label="Прослухати '+s.name+'" data-preview="'+s.id+'">▶</button><span class="creative-text"><b>'+s.name+'</b><small>'+s.category+' · '+s.bpm+' BPM</small></span><button type="button" class="music-add" data-music="'+s.id+'" aria-label="Додати '+s.name+'">＋</button></div>').join('')
     )+'</div>'+
    '<p class="library-fineprint">'+(tab==='music'?'Музика синтезується локально, без чужих аудіозаписів.':'Елементи редагуються в інспекторі та потрапляють у відео.')+'</p>';
  node.querySelectorAll('[data-library-tab]').forEach(b=>b.onclick=()=>{stopPreview();show(b.dataset.libraryTab);});
  node.querySelectorAll('[data-sticker]').forEach(b=>b.onclick=()=>actions.addSticker(b.dataset.sticker));
  node.querySelectorAll('[data-effect]').forEach(b=>b.onclick=()=>actions.addEffect(b.dataset.effect));
  node.querySelectorAll('[data-music]').forEach(b=>b.onclick=async()=>{b.disabled=true;b.textContent="…";try{await actions.addMusic(await musicFile(b.dataset.music));}catch(e){actions.error('Помилка музики: '+e.message);}finally{if(b.isConnected){b.disabled=false;b.textContent="＋";}}});
  node.querySelectorAll('[data-preview]').forEach(b=>b.onclick=async()=>{
   const id=b.dataset.preview;
   if(previewAudio&&previewAudio.dataset.trackId===id){stopPreview();return;}
   stopPreview();b.disabled=true;b.textContent="…";
   try{
    const file=await musicFile(id);
    const url=URL.createObjectURL(file);
    const audio=new Audio(url);audio.dataset.trackId=id;audio.loop=true;audio.volume=.6;
    previewAudio=audio;previewObjectUrl=url;
    audio.addEventListener('ended',()=>stopPreview(),{once:true});
    await audio.play();
    if(b.isConnected){b.textContent="■";b.disabled=false;}
   }catch(e){stopPreview();actions.error('Не вдається відтворити музику: '+e.message);}
  });
 }
 show(chosen.tab);
 return {show,stopPreview};
}
function stopPreview(){
 if(previewAudio){previewAudio.pause();previewAudio.src='';previewAudio=null;}
 if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null;}
}
function stickerMotion(ctx,w,h,c,t){
 const total=Math.max(.01,c.duration),local=Math.max(0,t-c.start);
 const speed=clamp(c.speed??1,.25,4),p=local*speed,enter=ease(local/.2),exit=ease((total-local)/.2);
 let scale=clamp((c.scale||18)/20,.15,5),x=w*(c.x??50)/100,y=h*(c.y??50)/100,rotation=(c.rotation||0)*Math.PI/180;
 const motion=c.animation||"pop";
 if(motion==="pop")scale*=.52+.48*enter;
 if(motion==="bounce"){const jump=Math.abs(Math.sin(p*5.5));y-=Math.pow(jump,1.5)*h*.065;scale*=1+.085*Math.cos(p*11);}
 if(motion==="heartbeat"){const beat=Math.pow(Math.max(0,Math.sin(p*5)),6);scale*=1+beat*.32;}
 if(motion==="bounce-in"){const spring=Math.exp(-p*3)*Math.cos(p*11);scale*=clamp(1-spring,.08,1.42);}
 if(motion==="pulse")scale*=1+.1*Math.sin(p*6);
 if(motion==="spin")rotation+=p*Math.PI*1.6;
 if(motion==="float")y+=Math.sin(p*3.2)*h*.025;
 if(motion==="slide")x+=(1-enter)*w*.28;
 if(motion==="jitter"){x+=Math.sin(p*42)*w*.009;y+=Math.cos(p*55)*h*.009;}
 if(motion==="swing")rotation+=Math.sin(p*4)*.33;
 if(motion==="wave")rotation+=Math.sin(p*9)*.23;
 if(motion==="orbit"){x+=Math.cos(p*3)*w*.075;y+=Math.sin(p*3)*h*.048;}
 if(motion==="rain"){y+=((p*.42)%1)*h*.5-h*.25;}
 if(motion==="drift"){x+=Math.sin(p*1.5)*w*.025+(p%8)*w*.008;y-=p*h*.008;}
 if(motion==="flash")ctx.globalAlpha*=Math.sin(p*13)>0?1:.18;
 if(motion==="flip")scale*=Math.max(.12,Math.abs(Math.cos(p*3)));
 ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);ctx.globalAlpha*=enter*exit;
}
function rounded(ctx,x,y,w,h,r,fill){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
}
function drawSticker(ctx,w,h,c,t){
 const type=c.sticker||'sale',S=Math.min(w,h);
 ctx.save();stickerMotion(ctx,w,h,c,t);
 const size=S*.28,white=c.color||'#ffffff',dark='#090909';
 ctx.lineJoin='round';ctx.lineCap='round';
 if(type==='emoji'){
  ctx.font=Math.round(size*.78)+'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(c.emoji||"❤️",0,0);
  ctx.restore();return;
 }
 if(type==='sale'||type==='shop'||type==='new'){
  const text=c.text||({sale:'−50% OFF',shop:'SHOP NOW ↗',new:'NEW DROP'}[type]);
  ctx.font='900 '+Math.round(size*.23)+'px Arial, sans-serif';
  const tw=ctx.measureText(text).width;
  rounded(ctx,-tw/2-24,-size*.18,tw+48,size*.40,Math.max(6,size*.05),white);
  ctx.fillStyle=dark;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,0,size*.015);
 }else if(type==='arrow'){
  ctx.strokeStyle=white;ctx.lineWidth=size*.09;ctx.beginPath();ctx.moveTo(-size*.34,size*.22);ctx.lineTo(size*.33,-size*.27);
  ctx.moveTo(size*.03,-size*.26);ctx.lineTo(size*.33,-size*.27);ctx.lineTo(size*.29,size*.03);ctx.stroke();
 }else if(type==='star'||type==='sparkles'){
  function star(x,y,r,points){ctx.beginPath();for(let i=0;i<points*2;i++){const a=-Math.PI/2+i*Math.PI/points,rad=i%2?r*.34:r;const px=x+rad*Math.cos(a),py=y+rad*Math.sin(a);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();}
  ctx.fillStyle=white;
  if(type==='star')star(0,0,size*.4,8);
  else {star(0,0,size*.3,4);star(size*.35,-size*.32,size*.14,4);star(-size*.34,size*.28,size*.1,4);}
 }else if(type==='heart'){
  ctx.fillStyle=white;ctx.beginPath();ctx.moveTo(0,size*.28);ctx.bezierCurveTo(-size*.7,-size*.06,-size*.43,-size*.55,0,-size*.22);
  ctx.bezierCurveTo(size*.43,-size*.55,size*.7,-size*.06,0,size*.28);ctx.fill();
 }else if(type!=='check'){
  const preset=getSticker(type);
  if(preset){
   const label=preset.symbol;
   ctx.fillStyle=white;ctx.textAlign='center';ctx.textBaseline='middle';
   if(['ring','progress','burst'].includes(type)){
    ctx.strokeStyle=white;ctx.lineWidth=size*.046;
    ctx.beginPath();ctx.arc(0,0,size*.32,0,Math.PI*2*(type==='progress'?.72:1));ctx.stroke();
    if(type==='burst'){ctx.font='900 '+Math.round(size*.22)+'px Arial';ctx.fillText("✺",0,0);}
   }else if(type==='underline'){
    ctx.strokeStyle=white;ctx.lineWidth=size*.05;ctx.beginPath();ctx.moveTo(-size*.4,0);ctx.lineTo(size*.4,0);ctx.stroke();
   }else{
    const fontsize=Math.round(size*.25);ctx.font='900 '+fontsize+'px "Segoe UI Emoji", Arial, sans-serif';
    const tw=ctx.measureText(label).width;
    rounded(ctx,-tw/2-18,-size*.20,tw+36,size*.41,9,'#ffffff');
    ctx.fillStyle=dark;ctx.fillText(label,0,0);
   }
  }
 }else if(type==='check'){
  ctx.fillStyle=white;ctx.beginPath();ctx.arc(0,0,size*.38,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=dark;ctx.lineWidth=size*.09;ctx.beginPath();ctx.moveTo(-size*.18,0);ctx.lineTo(-size*.03,size*.16);ctx.lineTo(size*.20,-size*.16);ctx.stroke();
 }
 ctx.restore();
}
function beforeFrame(ctx,w,h,effects,t){
 ctx.save();let scale=1,dx=0,dy=0,mono=false;
 effects.forEach(e=>{
  const local=t-e.start,k=clamp((e.intensity??60)/100,0,1.5);
  if(e.effect==='zoom')scale*=1+.2*k*ease(local/Math.max(.2,e.duration));
  if(e.effect==='shake'){const decay=1-ease(local/Math.max(.01,e.duration));dx+=Math.sin(local*76)*w*.014*k*decay;dy+=Math.cos(local*92)*h*.014*k*decay;}
  if(e.effect==='mono')mono=true;
  if(e.effect==='contrast')ctx.filter='contrast('+(1+.9*k)+') saturate('+(1+.18*k)+')';
  if(e.effect==='blur')ctx.filter='blur('+(2.3*k)+'px)';
  if(e.effect==='sepia')ctx.filter='sepia('+(k*.95)+') contrast(1.1)';
  if(e.effect==='invert')ctx.filter='invert('+(k*.85)+')';

 });
 if(scale!==1||dx||dy){ctx.translate(w/2+dx,h/2+dy);ctx.scale(scale,scale);ctx.translate(-w/2,-h/2);}
 if(mono)ctx.filter='grayscale(1) contrast(1.13)';
}
function afterFrame(ctx,w,h,effects,t){
 ctx.save();
 for(const e of effects){
  const local=t-e.start,k=clamp((e.intensity??60)/100,0,1.5);
  if(e.effect==='flash'){
   const v=Math.pow(1-((local%(Math.max(.15,e.duration/2)))/Math.max(.15,e.duration/2)),7);
   ctx.fillStyle='rgba(255,255,255,'+clamp(v*k*.88,0,1)+')';ctx.fillRect(0,0,w,h);
  }
  if(e.effect==='vignette'){
   const grad=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.16,w/2,h/2,Math.max(w,h)*.78);
   grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,'+clamp(k*.92,0,.97)+')');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  }
  if(e.effect==='grain'){
   const opacity=clamp(.07*k,0,.16);ctx.fillStyle='rgba(255,255,255,'+opacity+')';
   const seed=Math.floor(t*24);for(let i=0;i<Math.round(450*k);i++){const x=(hash(i+seed*59)+1)*.5*w,y=(hash(i*7+seed*41)+1)*.5*h;ctx.fillRect(x,y,2,2);}
  }
  if(e.effect==='letterbox'){
   ctx.fillStyle='#050505';const bar=h*.085*k;ctx.fillRect(0,0,w,bar);ctx.fillRect(0,h-bar,w,bar);
  }

  if(e.effect==='strobe'){
   const alpha=Math.sin(local*19)>0?0:clamp(.55*k,0,.72);
   ctx.fillStyle='rgba(255,255,255,'+alpha+')';ctx.fillRect(0,0,w,h);
  }
  if(e.effect==='glow'){
   const gr=ctx.createRadialGradient(w*.5,h*.45,0,w*.5,h*.45,w*.75);
   gr.addColorStop(0,'rgba(255,255,255,'+clamp(.16*k,0,.3)+')');
   gr.addColorStop(1,'rgba(255,255,255,0)');
   ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
  }
  if(e.effect==='fade-black'){
   const alpha=clamp((local/Math.max(.1,e.duration))*.95*k,0,.99);
   ctx.fillStyle='rgba(0,0,0,'+alpha+')';ctx.fillRect(0,0,w,h);
  }
  if(e.effect==='cool'){
   ctx.fillStyle='rgba(48,120,255,'+clamp(.15*k,0,.3)+')';ctx.fillRect(0,0,w,h);
  }
  if(e.effect==='sweep'){
   const progress=local/Math.max(.1,e.duration);
   const pos=w*(-.65+2.3*progress),ww=w*.42;
   const grad=ctx.createLinearGradient(pos-ww,0,pos+ww,0);
   grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(.5,'rgba(255,255,255,'+clamp(.38*k,0,.55)+')');grad.addColorStop(1,'rgba(255,255,255,0)');
   ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  }
 }
 ctx.restore();
}
const notes=[0,2,3,5,7,8,10,12];
function frequency(midi){return 440*Math.pow(2,(midi-69)/12);}
function musicWav(track){
 // 8 bars, 4/4, deterministic original instrumental, 22.05 kHz mono WAV.
 const sr=22050,beats=32,beat=60/track.bpm,total=Math.ceil(beats*beat*sr),seconds=total/sr;
 const pcm=new Int16Array(total),noteBase=track.key;
 const bassF=frequency(noteBase-12),step=beat/2;
 const seq=track.melody.map(n=>frequency(noteBase+n+12));
 const chords=track.chord.map(n=>frequency(noteBase+n));
 const rseed=MUSIC.findIndex(x=>x.id===track.id)+1;
 for(let i=0;i<total;i++){
  const t=i/sr,b=t/beat,bIndex=Math.floor(b),frac=b-bIndex,sub=t%step;
  const bassEnvelope=Math.exp(-((t%beat)/beat)*2.4),harmony=0;
  let sample=0;
  const mod=(track.id==='luxury'?.23:.34);
  const base=bassF*(track.id==='tension'&&bIndex%8>=4?1.06:1);
  sample+=Math.sin(2*Math.PI*base*t)*.22*bassEnvelope;
  sample+=Math.sin(2*Math.PI*base*2*t)*.05*bassEnvelope;
  const chordEnv=.4+.2*Math.sin(2*Math.PI*t/(beat*8));
  for(let k=0;k<chords.length;k++)sample+=Math.sin(2*Math.PI*chords[k]*t+(k*.35))*.052*chordEnv;
  const melF=seq[Math.floor(t/(beat*2))%seq.length],mEnv=Math.exp(-sub*5);
  sample+=Math.sin(2*Math.PI*melF*t)*.14*mEnv;
  sample+=Math.sin(2*Math.PI*melF*2*t)*.025*mEnv;
  if(track.beat){
   const kickTime=t%beat,kickPhase=2*Math.PI*(48*kickTime+60*(1-Math.exp(-kickTime*30))/30);
   sample+=Math.sin(kickPhase)*Math.exp(-kickTime*21)*.52;
   const clapTime=t% (beat*2),clapT=clapTime>=beat?clapTime-beat:999;
   const noise=hash(i*13+rseed*7);
   sample+=noise*Math.exp(-clapT*25)*.22;
   sample+=hash(i*17+rseed)*Math.exp(-sub*40)*.09;
  }else{
   sample+=hash(i*13+rseed)*Math.exp(-sub*45)*.023;
  }
  const fade=Math.min(1,t/.05,(seconds-t)/.07);
  const value=Math.tanh(sample*1.7)*.83*clamp(fade,0,1);
  pcm[i]=Math.round(clamp(value,-1,1)*32767);
 }
 const header=new ArrayBuffer(44+pcm.byteLength),view=new DataView(header);
 const str=(at,text)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,36+pcm.byteLength,true);str(8,'WAVE');str(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,sr,true);view.setUint32(28,sr*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
 str(36,'data');view.setUint32(40,pcm.byteLength,true);
 new Int16Array(header,44).set(pcm);
 return header;
}
async function musicFile(id){
 if(fileCache.has(id))return fileCache.get(id);
 const t=getMusic(id);if(!t)throw Error('Unknown track');
 await new Promise(resolve=>setTimeout(resolve,0));
 const buffer=musicWav(t);
 const file=new File([buffer],'PTS-'+t.name.replace(/[^a-zA-Z0-9-]+/g,'-')+'.wav',{type:'audio/wav'});
 fileCache.set(id,file);return file;
}
global.PTSCreative={STICKERS,EFFECTS,MUSIC,getSticker,getEffect,makePanel,stopPreview,drawSticker,beforeFrame,afterFrame,musicFile};
})(window);
