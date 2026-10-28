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
 {
  "id": "pulse",
  "name": "CINEMATIC PULSE",
  "category": "Action / Ads",
  "bpm": 120,
  "key": 52,
  "melody": [
   0,
   3,
   7,
   10
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "cinema",
  "beat": true
 },
 {
  "id": "luxury",
  "name": "LUXURY MINIMAL",
  "category": "Beauty / Fashion",
  "bpm": 92,
  "key": 57,
  "melody": [
   0,
   7,
   5,
   3
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "ambient",
  "beat": false
 },
 {
  "id": "upbeat",
  "name": "UPBEAT PROMO",
  "category": "Reels / Retail",
  "bpm": 132,
  "key": 60,
  "melody": [
   0,
   4,
   7,
   12
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "dance",
  "beat": true
 },
 {
  "id": "tension",
  "name": "DARK TENSION",
  "category": "Teaser / Hook",
  "bpm": 104,
  "key": 48,
  "melody": [
   0,
   1,
   7,
   6
  ],
  "chord": [
   0,
   1,
   7
  ],
  "style": "cinema",
  "beat": true
 },
 {
  "id": "bright",
  "name": "BRAND MOTION",
  "category": "Corporate / B2B",
  "bpm": 112,
  "key": 55,
  "melody": [
   0,
   4,
   9,
   7
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "minimal",
  "beat": true
 },
 {
  "id": "neon",
  "name": "NEON RUSH",
  "category": "Electro / Nightlife",
  "bpm": 128,
  "key": 49,
  "melody": [
   0,
   5,
   7,
   10
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "electro",
  "beat": true
 },
 {
  "id": "phonk",
  "name": "NIGHT DRIVE PHONK",
  "category": "Phonk / Cars",
  "bpm": 148,
  "key": 46,
  "melody": [
   0,
   3,
   6,
   10
  ],
  "chord": [
   0,
   3,
   6
  ],
  "style": "phonk",
  "beat": true
 },
 {
  "id": "house",
  "name": "DEEP HOUSE FLOW",
  "category": "House / Lifestyle",
  "bpm": 124,
  "key": 53,
  "melody": [
   0,
   7,
   10,
   5
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "house",
  "beat": true
 },
 {
  "id": "afro",
  "name": "AFRO SUNSET",
  "category": "Afro / Travel",
  "bpm": 108,
  "key": 55,
  "melody": [
   0,
   2,
   7,
   9
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "afro",
  "beat": true
 },
 {
  "id": "hyper",
  "name": "HYPER POP SPARK",
  "category": "Hyperpop / Fashion",
  "bpm": 158,
  "key": 61,
  "melody": [
   0,
   4,
   12,
   7
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "electro",
  "beat": true
 },
 {
  "id": "future",
  "name": "FUTURE BASS LIFT",
  "category": "Future Bass / Ads",
  "bpm": 140,
  "key": 50,
  "melody": [
   0,
   5,
   9,
   12
  ],
  "chord": [
   0,
   4,
   9
  ],
  "style": "future",
  "beat": true
 },
 {
  "id": "drill",
  "name": "URBAN DARK BEAT",
  "category": "Urban / Street",
  "bpm": 142,
  "key": 45,
  "melody": [
   0,
   3,
   5,
   7
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "trap",
  "beat": true
 },
 {
  "id": "beauty",
  "name": "GLOSSY BEAUTY",
  "category": "Beauty / Minimal",
  "bpm": 86,
  "key": 58,
  "melody": [
   0,
   4,
   7,
   11
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "ambient",
  "beat": false
 },
 {
  "id": "runway",
  "name": "RUNWAY ELECTRO",
  "category": "Fashion / Runway",
  "bpm": 126,
  "key": 54,
  "melody": [
   0,
   5,
   8,
   12
  ],
  "chord": [
   0,
   3,
   8
  ],
  "style": "house",
  "beat": true
 },
 {
  "id": "tropical",
  "name": "TROPICAL CAMPAIGN",
  "category": "Summer / Reels",
  "bpm": 114,
  "key": 62,
  "melody": [
   0,
   4,
   9,
   7
  ],
  "chord": [
   0,
   4,
   9
  ],
  "style": "afro",
  "beat": true
 },
 {
  "id": "glitch",
  "name": "DIGITAL GLITCH",
  "category": "Tech / SaaS",
  "bpm": 135,
  "key": 51,
  "melody": [
   0,
   1,
   6,
   12
  ],
  "chord": [
   0,
   6,
   10
  ],
  "style": "electro",
  "beat": true
 },
 {
  "id": "sports",
  "name": "SPORTS IMPACT",
  "category": "Sports / Fitness",
  "bpm": 136,
  "key": 47,
  "melody": [
   0,
   7,
   10,
   12
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "cinema",
  "beat": true
 },
 {
  "id": "soft",
  "name": "SOFT LOUNGE",
  "category": "Wellness / Spa",
  "bpm": 78,
  "key": 59,
  "melody": [
   0,
   4,
   7,
   12
  ],
  "chord": [
   0,
   4,
   9
  ],
  "style": "ambient",
  "beat": false
 },
 {
  "id": "retail",
  "name": "FLASH SALE DRIVE",
  "category": "Retail / Offers",
  "bpm": 142,
  "key": 56,
  "melody": [
   0,
   3,
   7,
   12
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "dance",
  "beat": true
 },
 {
  "id": "retro",
  "name": "RETRO SYNTHWAVE",
  "category": "Retro / Auto",
  "bpm": 110,
  "key": 50,
  "melody": [
   0,
   3,
   7,
   10
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "electro",
  "beat": true
 },
 {
  "id": "fashion",
  "name": "FASHION BOUNCE",
  "category": "Fashion / Social",
  "bpm": 116,
  "key": 54,
  "melody": [
   0,
   4,
   7,
   11
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "house",
  "beat": true
 },
 {
  "id": "chill",
  "name": "CHILL BEATS",
  "category": "Coffee / Lifestyle",
  "bpm": 90,
  "key": 57,
  "melody": [
   0,
   4,
   9,
   7
  ],
  "chord": [
   0,
   4,
   9
  ],
  "style": "minimal",
  "beat": true
 },
 {
  "id": "uplift",
  "name": "CINEMATIC UPLIFT",
  "category": "Brand / Motivation",
  "bpm": 118,
  "key": 60,
  "melody": [
   0,
   5,
   9,
   12
  ],
  "chord": [
   0,
   4,
   9
  ],
  "style": "cinema",
  "beat": true
 },
 {
  "id": "club",
  "name": "CLUB ENERGY",
  "category": "Party / Events",
  "bpm": 130,
  "key": 48,
  "melody": [
   0,
   3,
   7,
   12
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "dance",
  "beat": true
 },
 {
  "id": "jersey",
  "name": "JERSEY CLUB BOUNCE",
  "category": "Jersey Club / Viral Edits",
  "bpm": 144,
  "key": 53,
  "melody": [
   0,
   3,
   7,
   10
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "dance",
  "beat": true
 },
 {
  "id": "funk",
  "name": "BAILE FUNK VOLTAGE",
  "category": "Brazilian Funk / Reels",
  "bpm": 132,
  "key": 49,
  "melody": [
   0,
   5,
   3,
   7
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "electro",
  "beat": true
 },
 {
  "id": "sped",
  "name": "SPEED UP GLOW",
  "category": "Speed-Up / Fashion",
  "bpm": 164,
  "key": 59,
  "melody": [
   0,
   4,
   12,
   7
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "dance",
  "beat": true
 },
 {
  "id": "slowed",
  "name": "MIDNIGHT SLOWED",
  "category": "Slowed / Atmosphere",
  "bpm": 78,
  "key": 48,
  "melody": [
   0,
   7,
   5,
   3
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "ambient",
  "beat": false
 },
 {
  "id": "reel-house",
  "name": "VIRAL HOUSE CUT",
  "category": "House / Hook",
  "bpm": 126,
  "key": 54,
  "melody": [
   0,
   5,
   7,
   12
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "house",
  "beat": true
 },
 {
  "id": "amapiano",
  "name": "AMAPIANO WAVE",
  "category": "Amapiano / Lifestyle",
  "bpm": 110,
  "key": 53,
  "melody": [
   0,
   4,
   7,
   11
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "afro",
  "beat": true
 },
 {
  "id": "ukg",
  "name": "UK GARAGE SWING",
  "category": "UK Garage / Street",
  "bpm": 136,
  "key": 57,
  "melody": [
   0,
   3,
   10,
   7
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "house",
  "beat": true
 },
 {
  "id": "hardgroove",
  "name": "HARD GROOVE DROP",
  "category": "Techno / Fitness",
  "bpm": 142,
  "key": 50,
  "melody": [
   0,
   7,
   8,
   3
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "electro",
  "beat": true
 },
 {
  "id": "reverb",
  "name": "DREAM REVERB",
  "category": "Ambient / Cinematic",
  "bpm": 86,
  "key": 60,
  "melody": [
   0,
   7,
   4,
   12
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "ambient",
  "beat": false
 },
 {
  "id": "dramatic",
  "name": "DRAMATIC EDIT CUT",
  "category": "Trailer / Ad Hook",
  "bpm": 118,
  "key": 45,
  "melody": [
   0,
   1,
   6,
   7
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "cinema",
  "beat": true
 },
 {
  "id": "luxury-club",
  "name": "FASHION CLUB MIX",
  "category": "Luxury / Runway",
  "bpm": 123,
  "key": 56,
  "melody": [
   0,
   4,
   9,
   7
  ],
  "chord": [
   0,
   4,
   7
  ],
  "style": "house",
  "beat": true
 },
 {
  "id": "trap-remix",
  "name": "TRAP ENERGY SWITCH",
  "category": "Trap / Transition",
  "bpm": 150,
  "key": 48,
  "melody": [
   0,
   3,
   7,
   10
  ],
  "chord": [
   0,
   3,
   7
  ],
  "style": "trap",
  "beat": true
 }
];
const SFX=[
 {
  "id": "whoosh",
  "name": "Motion Whoosh",
  "category": "Transitions",
  "symbol": "↗",
  "seconds": 0.85
 },
 {
  "id": "pop",
  "name": "Cartoon Pop",
  "category": "Stickers",
  "symbol": "●",
  "seconds": 0.45
 },
 {
  "id": "click",
  "name": "UI Click",
  "category": "UI / CTA",
  "symbol": "◉",
  "seconds": 0.22
 },
 {
  "id": "impact",
  "name": "Cinematic Impact",
  "category": "Ads / Hooks",
  "symbol": "✺",
  "seconds": 1.2
 },
 {
  "id": "rise",
  "name": "Riser",
  "category": "Transitions",
  "symbol": "↑",
  "seconds": 1.6
 },
 {
  "id": "bell",
  "name": "Notification Bell",
  "category": "Social",
  "symbol": "♫",
  "seconds": 1
 },
 {
  "id": "sparkle",
  "name": "Sparkle",
  "category": "Beauty",
  "symbol": "✧",
  "seconds": 1.1
 },
 {
  "id": "snap",
  "name": "Finger Snap",
  "category": "Transitions",
  "symbol": "⌁",
  "seconds": 0.3
 },
 {
  "id": "drop",
  "name": "Bass Drop",
  "category": "Drops",
  "symbol": "↓",
  "seconds": 1.35
 },
 {
  "id": "swoosh",
  "name": "Fast Swipe",
  "category": "Transitions",
  "symbol": "➜",
  "seconds": 0.55
 },
 {
  "id": "tada",
  "name": "Win Stinger",
  "category": "CTA / Offers",
  "symbol": "★",
  "seconds": 1.35
 },
 {
  "id": "tick",
  "name": "Countdown Tick",
  "category": "Timers",
  "symbol": "◷",
  "seconds": 0.24
 }
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
 if(motion==="rubber")scale*=1+.15*Math.sin(p*10)*Math.exp(-p*.4);
 if(motion==="squash")scale*=.9+.12*Math.abs(Math.sin(p*7));
 if(motion==="tada"){rotation+=Math.sin(p*16)*.18;scale*=1+.18*Math.max(0,Math.sin(p*8));}
 if(motion==="shake-x")x+=Math.sin(p*34)*w*.023;
 if(motion==="flip-y")rotation+=Math.PI*Math.sin(p*2);
 if(motion==="rise")y-=ease((p%3)/3)*h*.16;
 if(motion==="fall")y+=ease((p%3)/3)*h*.16;
 if(motion==="breath")scale*=1+.06*Math.sin(p*2.4);
 if(motion==="spiral"){x+=Math.cos(p*4)*w*.055*(1+p*.05);y+=Math.sin(p*4)*h*.034*(1+p*.05);}
 if(motion==="glitch"){x+=(Math.floor(p*14)%3-1)*w*.021;y+=(Math.floor(p*13)%3-1)*h*.012;}
 if(motion==="pendulum")rotation+=Math.sin(p*3)*.6;
 if(motion==="wave-float"){y+=Math.sin(p*4)*h*.025;rotation+=Math.sin(p*3)*.15;}
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
function makeWav(pcm,sr){
 const header=new ArrayBuffer(44+pcm.byteLength),v=new DataView(header);
 const str=(at,txt)=>{for(let i=0;i<txt.length;i++)v.setUint8(at+i,txt.charCodeAt(i));};
 str(0,"RIFF");v.setUint32(4,36+pcm.byteLength,true);str(8,"WAVE");str(12,"fmt ");
 v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
 str(36,"data");v.setUint32(40,pcm.byteLength,true);
 new Int16Array(header,44).set(pcm);return header;
}
function musicWav(track){
 // Original procedural composition: no recorded samples, no copyrighted melody.
 const sr=22050,beats=32,beat=60/track.bpm,total=Math.ceil(beats*beat*sr),seconds=total/sr;
 const pcm=new Int16Array(total),base=frequency(track.key-12),lead=track.melody.map(n=>frequency(track.key+n+12));
 const chord=track.chord.map(n=>frequency(track.key+n)),seed=MUSIC.indexOf(track)+1,style=track.style;
 for(let i=0;i<total;i++){
  const t=i/sr,b=Math.floor(t/beat),sub=t%(beat/2),p=(t%beat)/beat;
  const bassEnv=Math.exp(-p*2.4),melEnv=Math.exp(-sub*5);
  const root=base*(style==="cinema"&&b%8>=4?1.03:1),f=lead[Math.floor(t/(beat*2))%lead.length];
  let sample=Math.sin(2*Math.PI*root*t)*.22*bassEnv+Math.sin(2*Math.PI*root*2*t)*.05*bassEnv;
  if(style==="trap"||style==="phonk")sample+=Math.sin(2*Math.PI*root*.5*t)*.2*bassEnv;
  for(let k=0;k<chord.length;k++)sample+=Math.sin(2*Math.PI*chord[k]*t+k*.35)*.052*(.4+.2*Math.sin(2*Math.PI*t/(beat*8)));
  const osc=style==="electro"||style==="phonk"?Math.sign(Math.sin(2*Math.PI*f*t))*.55+Math.sin(2*Math.PI*f*t)*.45:Math.sin(2*Math.PI*f*t);
  sample+=osc*.14*melEnv*(style==="ambient"?.65:1);
  sample+=Math.sin(2*Math.PI*f*2*t)*.025*melEnv;
  if(track.beat){
   const kickT=t%beat,kickPhase=2*Math.PI*(48*kickT+60*(1-Math.exp(-kickT*30))/30);
   sample+=Math.sin(kickPhase)*Math.exp(-kickT*21)*.52;
   const clapT=t%(beat*2)>=beat?t%(beat*2)-beat:999;
   sample+=hash(i*13+seed*7)*Math.exp(-clapT*25)*.22;
   sample+=hash(i*17+seed)*Math.exp(-sub*40)*.09;
   if(["house","dance","electro"].includes(style))sample+=hash(i*19+seed*6)*Math.exp(-((t+beat/2)%beat)*55)*.1;
   if(style==="afro")sample+=hash(i*31+seed*13)*Math.exp(-((t+beat*.25)%(beat*.75))*45)*.11;
   if(style==="future")sample+=Math.sin(2*Math.PI*root*4*t)*Math.exp(-sub*7)*.07;
   if(style==="phonk")sample+=Math.sign(Math.sin(2*Math.PI*f*1.5*t))*.055*melEnv;
  }else sample+=hash(i*13+seed)*Math.exp(-sub*45)*.023;
  const fade=clamp(Math.min(1,t/.05,(seconds-t)/.07),0,1);
  pcm[i]=Math.round(clamp(Math.tanh(sample*1.7)*.83*fade,-1,1)*32767);
 }
 return makeWav(pcm,sr);
}
function sfxWav(preset){
 const sr=22050,total=Math.ceil(preset.seconds*sr),pcm=new Int16Array(total),N=preset.id,seconds=preset.seconds;
 for(let i=0;i<total;i++){
  const t=i/sr,p=t/seconds,noise=hash(i*31+SFX.indexOf(preset)*53);let value=0;
  if(N==="whoosh"||N==="swoosh")value=noise*Math.sin(Math.PI*p)*.42+Math.sin(2*Math.PI*(450+1300*p)*t)*.07*Math.sin(Math.PI*p);
  if(N==="pop")value=Math.sin(2*Math.PI*(650-430*p)*t)*Math.exp(-p*16)*.75;
  if(N==="click")value=(noise*.7+Math.sin(t*13000)*.3)*Math.exp(-p*25)*.35;
  if(N==="impact")value=Math.sin(2*Math.PI*(85-55*p)*t)*Math.exp(-p*8)*.82+noise*Math.exp(-p*35)*.35;
  if(N==="rise")value=(noise*.2+Math.sin(2*Math.PI*(280+1500*p*p)*t)*.32)*p*p;
  if(N==="bell")value=(Math.sin(2*Math.PI*880*t)+Math.sin(2*Math.PI*1320*t)*.4)*Math.exp(-p*7)*.38;
  if(N==="sparkle")value=(Math.sin(2*Math.PI*1570*t)+Math.sin(2*Math.PI*2011*t)*.45)*Math.exp(-p*5)*.29;
  if(N==="snap")value=noise*Math.exp(-p*30)*.56;
  if(N==="drop")value=Math.sin(2*Math.PI*(110-75*p)*t)*Math.exp(-p*3)*.76+noise*Math.exp(-p*45)*.2;
  if(N==="tada")value=Math.sin(2*Math.PI*(550+220*Math.floor(p*3))*t)*Math.exp(-p*3)*.4;
  if(N==="tick")value=(noise*.55+Math.sin(2*Math.PI*1200*t)*.15)*Math.exp(-p*24);
  const fade=clamp(Math.min(1,t/.009,(seconds-t)/.01),0,1);
  pcm[i]=Math.round(clamp(Math.tanh(value)*fade,-1,1)*32767);
 }
 return makeWav(pcm,sr);
}
async function sfxFile(id){
 if(fileCache.has("sfx:"+id))return fileCache.get("sfx:"+id);
 const preset=SFX.find(e=>e.id===id);if(!preset)throw Error("Unknown SFX");
 const file=new File([sfxWav(preset)],"PTS-SFX-"+id+".wav",{type:"audio/wav"});
 fileCache.set("sfx:"+id,file);return file;
}
async function musicFile(id){
 if(fileCache.has(id))return fileCache.get(id);
 const t=getMusic(id);if(!t)throw Error('Unknown track');
 await new Promise(resolve=>setTimeout(resolve,0));
 const buffer=musicWav(t);
 const file=new File([buffer],'PTS-'+t.name.replace(/[^a-zA-Z0-9-]+/g,'-')+'.wav',{type:'audio/wav'});
 fileCache.set(id,file);return file;
}
global.PTSCreative={STICKERS,EFFECTS,MUSIC,SFX,getSticker,getEffect,makePanel,stopPreview,drawSticker,beforeFrame,afterFrame,musicFile,sfxFile};
})(window);
