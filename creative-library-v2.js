/* PTS Creative Library v2 — a dedicated catalog with offline Unicode Emoji 18.0. */
(function(global){
"use strict";
const catalog=global.PTSEmojis,tools=global.PTSCreative;
const groupLabels={
 "Smileys & Emotion":"Емоції","People & Body":"Люди та жести",
 "Animals & Nature":"Тварини","Food & Drink":"Їжа",
 "Travel & Places":"Подорожі","Activities":"Активності",
 "Objects":"Предмети","Symbols":"Символи","Flags":"Прапори"};
const queries={
 "серце":"heart","сердеч":"heart","любов":"love","кохання":"heart",
 "вогонь":"fire","вогн":"fire","сміх":"laugh","смайл":"face",
 "усмішка":"smile","радість":"smile","поцілунок":"kiss","гроші":"money",
 "долар":"dollar","подарунок":"gift","корона":"crown","зірка":"star",
 "зіроч":"star","ракета":"rocket","рука":"hand","квіти":"flower",
 "квітка":"flower","блискавка":"lightning","сум":"sad","сльоз":"cry",
 "собака":"dog","кіт":"cat","спорт":"sport","авто":"car","машин":"car",
 "дівчина":"woman","хлопець":"man","прапор":"flag","сніг":"snow","сніж":"snow","вогонь":"fire","полум":"flame","дощ":"rain","дим":"fog","туман":"fog","іскр":"spark","конфеті":"confetti","світл":"light","пелюст":"petal","сердеч":"heart"};
const featured=["❤️","💖","💕","💗","💘","💝","😍","🥰","😘","🤩","🔥","✨","💫","🎉","🎁","💰","💸","💵","👀","🫶","👍","👏","🚀","⭐","🌟","😎","😂","🥹","🤯","💯","⚡","✅","❣️","🤍","🖤","💜","💙","💚","💛","🧡"];
const motions=[
 ["bounce","BOUNCE","❤️"],["heartbeat","HEARTBEAT","💓"],
 ["float","FLOAT","✨"],["swing","SWING","💫"],["spin","SPIN","🔄"],
 ["pulse","PULSE","💗"],["jitter","JITTER","⚡"],["orbit","ORBIT","🌍"],
 ["rain","DROP","💧"],["wave","WIGGLE","〰️"],["flash","BLINK","🌟"],
 ["slide","SLIDE","➡️"],["pop","POP","🎉"],["flip","FLIP","🃏"],
 ["bounce-in","BOUNCE IN","🚀"],["drift","DRIFT","🦋"],
 ["rubber","RUBBER","🎈"],["squash","SQUASH","🫧"],["tada","TADA!","🎉"],
 ["shake-x","SHAKE X","💥"],["flip-y","FLIP Y","🪙"],
 ["rise","RISE UP","📈"],["fall","FALL DOWN","🍂"],
 ["breath","BREATHE","🧘"],["spiral","SPIRAL","🌀"],
 ["glitch","GLITCH","⚡"],["pendulum","PENDULUM","🔔"],["wave-float","WAVE FLOAT","🌊"]];
let audio=null,audioUrl=null;
function stopAudio(){if(audio){audio.pause();audio.src="";audio=null;}if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}}
const safe=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const emojiItems=catalog.all;
const featuredItems=featured.map(v=>emojiItems.find(e=>e.emoji===v)).filter(Boolean);
const featuredIds=new Set(featuredItems.map(e=>e.id));
const emojiOrdered=featuredItems.concat(emojiItems.filter(e=>!featuredIds.has(e.id)));
function makePanel(node,actions){
 const state={tab:"emoji",category:"all",search:"",limit:96};
 const tabs=[["emoji","ЕМОДЗІ"],["motions","АНІМАЦІЇ"],["stickers","СТІКЕРИ"],["overlays","ПОГОДА / ЕФЕКТИ"],["effects","ВІДЕОЕФЕКТИ"],["music","МУЗИКА"],["sfx","ЗВУКОВІ ЕФЕКТИ"]];
 node.innerHTML='<div class="asset-lib-toolbar">'+
  '<div class="asset-lib-nav" role="tablist" aria-label="Вкладки бібліотеки">'+
  tabs.map(t=>'<button type="button" data-library-tab="'+t[0]+'" role="tab" aria-selected="'+(t[0]===state.tab)+'" class="'+(t[0]===state.tab?'active':'')+'">'+t[1]+'</button>').join('')+
  '</div><label class="asset-lib-search"><span>⌕</span><input id="asset-search" type="search" placeholder="Пошук емодзі, музики та ефектів…" autocomplete="off" aria-label="Пошук креативів"></label></div>'+
  '<div class="asset-lib-guide" aria-live="polite">ОБИРАЙ ЕМОДЗІ · НАЛАШТОВУЙ РУХ НА ВІДЕО</div>'+
  '<div id="creative-results" class="asset-lib-results"></div>'+
  '<div class="asset-lib-license">ЕМОДЗІ UNICODE 18.0 · ЛОКАЛЬНІ АНІМАЦІЇ · БЕЗ ПЛАТНИХ API</div>';
 const search=node.querySelector("#asset-search");
 const results=node.querySelector("#creative-results");
 const guides={
  emoji:"ОБИРАЙ ЕМОДЗІ · НАЛАШТОВУЙ РУХ НА ВІДЕО",
  motions:"АНІМАЦІЇ РУХУ · РЕДАГУЙ ШВИДКІСТЬ ТА МАСШТАБ",
  stickers:"НАЛІПКИ ТА ЗАКЛИКИ · ДОДАВАЙ НА ШКАЛУ",
  overlays:"АТМОСФЕРА НА ВЕСЬ КАДР · СНІГ, ВОГОНЬ, ДОЩ",
  effects:"ОБРОБКА ЗОБРАЖЕННЯ · НАЛАШТОВУЙ ІНТЕНСИВНІСТЬ",
  music:"АВТОРСЬКА МУЗИКА · ПРОСЛУХОВУЙ І ДОДАВАЙ",
  sfx:"ЗВУКОВІ АКЦЕНТИ · СТВОРЮЙ РИТМ МОНТАЖУ"
 };
 function matches(text){
  const q=state.search.toLowerCase().trim();if(!q)return true;
  const translation=queries[q]||Object.keys(queries).filter(k=>q.includes(k)).map(k=>queries[k])[0]||q;
  const words=String(text).toLowerCase();
  return words.includes(q)||words.includes(translation);
 }
 function header(title,number,detail){
  return '<div class="asset-lib-lead"><div><span class="kicker">'+safe(title)+'</span><b>'+safe(number)+'</b></div><small>'+safe(detail)+'</small></div>';
 }
 function redraw(){
  results.classList.remove("library-reveal");
  void results.offsetWidth;
  results.classList.add("library-reveal");
  if(state.tab==="emoji"){
   const list=emojiOrdered.filter(x=>(state.category==="all"||x.group===state.category)&&matches(x.name+" "+global.PTSUk.emojiName(x.emoji)+" "+x.emoji+" "+(groupLabels[x.group]||x.group)));
   const current=list.slice(0,state.limit);
   results.innerHTML=header("ЕМОДЗІ UNICODE 18.0",list.length.toLocaleString("uk-UA")+" СИМВОЛІВ","Натисни, щоб додати")+
    '<div class="asset-category-scroll" aria-label="Категорії emoji">'+
    ['all'].concat(catalog.groups).map(c=>'<button type="button" data-emoji-category="'+safe(c)+'" class="'+(state.category===c?'active':'')+'">'+(c==="all"?"УСІ":groupLabels[c]||c)+'</button>').join('')+
    '</div><div class="emoji-grid">'+
    current.map(e=>'<button type="button" class="emoji-item" title="'+safe(global.PTSUk.emojiName(e.emoji))+'" aria-label="'+safe(global.PTSUk.emojiName(e.emoji))+'" data-emoji-id="'+e.id+'">'+e.emoji+'</button>').join('')+'</div>'+
    (current.length<list.length?'<button type="button" class="asset-more" id="emoji-more">ПОКАЗАТИ ЩЕ ＋ ('+(list.length-current.length)+' залишилось)</button>':'')+
    (!list.length?'<p class="asset-empty">Нічого не знайдено. Спробуй іншу назву чи категорію.</p>':'');
   results.querySelectorAll("[data-emoji-id]").forEach(b=>b.onclick=()=>{const e=emojiItems[Number(b.dataset.emojiId)];if(e)actions.addEmoji(e.emoji,global.PTSUk.emojiName(e.emoji));});
   results.querySelectorAll("[data-emoji-category]").forEach(b=>b.onclick=()=>{state.category=b.dataset.emojiCategory;state.limit=96;redraw();});
   const more=results.querySelector("#emoji-more");if(more)more.onclick=()=>{const before=state.limit;state.limit+=96;redraw();const next=results.querySelectorAll(".emoji-item")[before];if(next)next.focus({preventScroll:true});};
   return;
  }
  if(state.tab==="motions"){
   const list=motions.filter(m=>matches(m[0]+" "+m[1]+" "+global.PTSUk.motion(m[0])));
   results.innerHTML=header("ШАБЛОНИ РУХУ / "+motions.length,"АНІМАЦІЇ","Натисни, щоб додати анімований шар")+
    '<p class="motion-hint">Обери рух, а потім зміни emoji, розмір і швидкість в інспекторі.</p>'+
    '<div class="motion-grid">'+list.map(m=>'<button type="button" class="motion-tile" data-motion="'+m[0]+'"><span class="motion-icon motion-'+m[0]+'">'+m[2]+'</span><b>'+safe(global.PTSUk.motion(m[0]))+'</b><small>ДОДАТИ ШАР ＋</small></button>').join('')+'</div>';
   results.querySelectorAll("[data-motion]").forEach(b=>b.onclick=()=>actions.addMotion(b.dataset.motion));
   return;
  }
  if(state.tab==="stickers"){
   const list=tools.STICKERS.filter(s=>matches(s.id+" "+(s._searchEnglish||"")+" "+s.name+" "+s.group));
   results.innerHTML=header("ВЕКТОРНІ НАЛІПКИ","СТІКЕРИ · "+list.length,"Додаються на таймлайн")+
    '<div class="sticker-grid">'+list.map(s=>'<button type="button" class="sticker-tile" data-sticker="'+s.id+'"><span class="sticker-art">'+safe(s.symbol)+'</span><b>'+safe(s.name)+'</b><small>'+safe(s.group)+'</small></button>').join('')+'</div>';
   results.querySelectorAll("[data-sticker]").forEach(b=>b.onclick=()=>actions.addSticker(b.dataset.sticker));
   return;
  }
  if(state.tab==="overlays"){
   const list=global.PTSOverlays.PRESETS.filter(p=>matches(p.id+" "+(p._searchEnglish||"")+" "+p.name+" "+p.desc+" "+p.tag));
   results.innerHTML=header("АНІМАЦІЇ НА ВЕСЬ КАДР","ЕФЕКТІВ КАДРУ · "+list.length,"На весь екран / Поверх кадру")+
    '<p class="motion-hint">Сніг, полум’я, туман, світлові частинки й атмосферні ефекти. Обери, щоб додати як окрему доріжку з регулюванням інтенсивності.</p>'+
    '<div class="overlay-grid">'+list.map(p=>'<button type="button" class="overlay-tile" data-overlay="'+p.id+'"><span class="overlay-thumbnail"><canvas class="overlay-thumb" width="192" height="108" data-thumb="'+p.id+'"></canvas><i>'+p.icon+'</i></span><span class="overlay-copy"><b>'+safe(p.name)+'</b><small>'+safe(p.desc)+'</small></span><em>＋</em></button>').join('')+'</div>';
   results.querySelectorAll("[data-overlay]").forEach(b=>b.onclick=()=>actions.addOverlay(b.dataset.overlay));
   const thumbs=results.querySelectorAll("[data-thumb]");
   for(const el of thumbs){
    const c=el.getContext("2d");if(!c)continue;c.fillStyle="#090a0e";c.fillRect(0,0,192,108);
    global.PTSOverlays.draw(c,192,108,{overlay:el.dataset.thumb,start:0,duration:20,intensity:90,opacity:90,size:140,speed:1,seed:37,tint:global.PTSOverlays.getPreset(el.dataset.thumb)?.tint},2.5);
   }
   return;
  }
  if(state.tab==="effects"){
   const list=tools.EFFECTS.filter(s=>matches(s.id+" "+(s._searchEnglish||"")+" "+s.name+" "+s.desc));
   results.innerHTML=header("РУХ І ОБРОБКА КАДРУ","ЕФЕКТІВ · "+list.length,"Редагуй в інспекторі")+
    '<div class="fx-grid">'+list.map(s=>'<button type="button" class="fx-tile" data-effect="'+s.id+'"><span>'+safe(s.symbol)+'</span><div><b>'+safe(s.name)+'</b><small>'+safe(s.desc)+'</small></div><em>＋</em></button>').join('')+'</div>';
   results.querySelectorAll("[data-effect]").forEach(b=>b.onclick=()=>actions.addEffect(b.dataset.effect));
   return;
  }
  const isSound=state.tab==="sfx";
  if(!isSound){
   const list=tools.MUSIC.filter(s=>matches(s.id+" "+(s._searchEnglish||"")+" "+s.name+" "+s.category+" "+s.bpm));
   results.innerHTML=header("АВТОРСЬКА МУЗИКА / БІБЛІОТЕКА","МУЗИКА · "+tools.MUSIC.length+" ТРЕКІВ","Прослуховування та додавання → таймлайн")+
    '<div class="music-info">36 авторських музичних лупів. Для реальних треків, які ліцензовані для реклами, скористайся офіційними каталогами нижче та перевір дозволені платформи.</div>'+
    '<div class="licensed-music-links"><a href="https://ads.tiktok.com/resources/help/article/how-to-use-the-commercial-music-library?lang=en" target="_blank" rel="noopener noreferrer">TikTok · Музика для реклами ↗</a><a href="https://www.facebook.com/sound/collection/" target="_blank" rel="noopener noreferrer">Meta · Звукова бібліотека ↗</a></div>'+
    '<p class="music-license-note">Музика з платформ може бути ліцензована лише для їхніх власних майданчиків. Ми не завантажуємо й не копіюємо хіти автоматично. Ліцензований файл можна імпортувати у вкладці «МЕДІА».</p>'+
    '<div class="fx-grid">'+list.map(s=>'<div class="music-card"><button type="button" class="music-preview" aria-label="Прослухати '+safe(s.name)+'" data-preview="'+s.id+'">▶</button><span class="creative-text"><b>'+safe(s.name)+'</b><small>'+safe(s.category)+' · '+s.bpm+' BPM</small></span><button type="button" class="music-add" data-music="'+s.id+'" aria-label="Додати '+safe(s.name)+'">＋</button></div>').join('')+'</div>'+
    (!list.length?'<p class="asset-empty">Немає збігів. Очисти пошук, щоб побачити всі треки.</p>':'');
  } else {
   const list=tools.SFX.filter(s=>matches(s.id+" "+(s._searchEnglish||"")+" "+s.name+" "+s.category));
   results.innerHTML=header("ЗВУКОВЕ ОФОРМЛЕННЯ","ЗВУКОВІ ЕФЕКТИ · "+tools.SFX.length,"Прольоти · Хлопки · Удари · Сповіщення")+
    '<div class="music-info">Окрема бібліотека коротких звукових акцентів, переходів, ударів і повідомлень.</div>'+
    '<div class="fx-grid">'+list.map(s=>'<div class="music-card"><button type="button" class="music-preview" data-sfx-preview="'+s.id+'" aria-label="Прослухати '+safe(s.name)+'">▶</button><span class="creative-text"><b>'+safe(s.name)+'</b><small>'+safe(s.category)+' · '+s.seconds+' s</small></span><button type="button" class="music-add" data-sfx="'+s.id+'" aria-label="Додати '+safe(s.name)+'">＋</button></div>').join('')+'</div>'+
    (!list.length?'<p class="asset-empty">Немає звукових ефектів за цим пошуком.</p>':'');
  }
  results.querySelectorAll("[data-music]").forEach(b=>b.onclick=async()=>{b.disabled=true;b.textContent="…";try{await actions.addMusic(await tools.musicFile(b.dataset.music));}catch(e){actions.error("Помилка музики: "+e.message);}finally{if(b.isConnected){b.disabled=false;b.textContent="＋";}}});
  results.querySelectorAll("[data-sfx]").forEach(b=>b.onclick=async()=>{
   b.disabled=true;b.textContent="…";
   try{await actions.addMusic(await tools.sfxFile(b.dataset.sfx));}
   catch(e){actions.error("Помилка SFX: "+e.message);}
   finally{if(b.isConnected){b.disabled=false;b.textContent="＋";}}
  });
  results.querySelectorAll("[data-sfx-preview]").forEach(b=>b.onclick=async()=>{
   const id=b.dataset.sfxPreview;
   if(audio&&audio.dataset.trackId==="sfx:"+id){stopAudio();b.textContent="▶";return;}
   stopAudio();b.disabled=true;b.textContent="…";
   try{
    const file=await tools.sfxFile(id),url=URL.createObjectURL(file);
    const player=new Audio(url);player.dataset.trackId="sfx:"+id;player.volume=.55;
    audio=player;audioUrl=url;player.addEventListener("ended",()=>{stopAudio();if(b.isConnected)b.textContent="▶";},{once:true});
    await player.play();if(b.isConnected){b.disabled=false;b.textContent="■";}
   }catch(e){stopAudio();actions.error("Не вдалося відтворити звук: "+e.message);if(b.isConnected){b.disabled=false;b.textContent="▶";}}
  });
  results.querySelectorAll("[data-preview]").forEach(b=>b.onclick=async()=>{
   const id=b.dataset.preview;
   if(audio&&audio.dataset.trackId===id){stopAudio();b.textContent="▶";return;}
   stopAudio();results.querySelectorAll("[data-preview]").forEach(x=>x.textContent="▶");
   b.disabled=true;b.textContent="…";
   try{const file=await tools.musicFile(id),url=URL.createObjectURL(file);
    const player=new Audio(url);player.dataset.trackId=id;player.loop=true;player.volume=.55;
    audio=player;audioUrl=url;await player.play();if(b.isConnected){b.textContent="■";b.disabled=false;}
   }catch(e){stopAudio();actions.error("Не вдалося програти: "+e.message);if(b.isConnected){b.disabled=false;b.textContent="▶";}}
  });
 }
 function open(tab){state.tab=tab;state.category="all";state.limit=96;state.search="";search.value="";stopAudio();
  node.setAttribute("data-active-category",tab);
  const guide=node.querySelector(".asset-lib-guide");
  if(guide)guide.textContent=guides[tab]||"ОБИРАЙ ТА ДОДАВАЙ";
  node.querySelectorAll("[data-library-tab]").forEach(b=>{const active=b.dataset.libraryTab===tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
  redraw();
 }
 node.querySelectorAll("[data-library-tab]").forEach(b=>b.onclick=()=>open(b.dataset.libraryTab));
 search.addEventListener("input",()=>{state.search=search.value;state.limit=96;redraw();});
 redraw();
 return {show:open,stopPreview:stopAudio};
}
tools.makePanel=makePanel;
tools.stopPreview=function(){stopAudio();};
tools.MOTION_PRESETS=motions;
})(window);
