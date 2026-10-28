/* PTS Local Transcription — optional Whisper tiny multilingual.
 * Loads free model weights on demand from Hugging Face; inference only in browser.
 * No audio upload, no paid services. Requires internet on first model download.
 */
(function(global){
"use strict";
const MODELS={
 fast:{id:"onnx-community/whisper-tiny",label:"Швидка · Whisper Tiny"},
 balanced:{id:"onnx-community/whisper-base",label:"Покращена · Whisper Base"},
 accurate:{id:"onnx-community/whisper-small",label:"Максимальна · Whisper Small"}
};
const MODEL=MODELS.balanced.id;
const cache=new Map(), pending=new Map();
let transformersModule=null;
async function load(progress,{quality="balanced"}={}){
 const choice=MODELS[quality]||MODELS.balanced;
 if(cache.has(choice.id))return cache.get(choice.id);
 if(pending.has(choice.id))return pending.get(choice.id);
 const task=(async()=>{
  progress?.("Підготовка "+choice.label+"…");
  const mod=transformersModule||(transformersModule=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm"));
  // Whisper's audio encoder is unusually sensitive to quantization.
  // Use fp16 (GPU) / fp32 (CPU) for its encoder, q4/q8 for the decoder.
  let webgpu=!!global.navigator?.gpu;
  if(webgpu){try{webgpu=!!(await global.navigator.gpu.requestAdapter());}catch(_){webgpu=false;}}
  if(quality==="accurate"&&!webgpu){
   throw Error("Whisper Small потребує WebGPU для комфортної роботи. Обери «Покращена (Base)» або Chrome з WebGPU.");
  }
  const progress_callback=evt=>{
   if(evt.status==="progress"&&Number.isFinite(evt.progress)){
    progress?.("Завантаження "+choice.label+": "+Math.round(evt.progress)+"%");
   }
  };
  const gpuOptions={device:"webgpu",dtype:{encoder_model:"fp16",decoder_model_merged:"q4"},progress_callback};
  const cpuOptions={device:"wasm",dtype:{encoder_model:"fp32",decoder_model_merged:"q8"},progress_callback};
  let recognizer;
  if(webgpu){
   try{recognizer=await mod.pipeline("automatic-speech-recognition",choice.id,gpuOptions);}
   catch(err){
    if(quality==="accurate")throw Error("Не вдалося запустити Whisper Small на WebGPU: "+err.message);
    progress?.("Відеоприскорення недоступне. Запускаємо "+choice.label+" через процесор…");
   }
  }
  if(!recognizer)recognizer=await mod.pipeline("automatic-speech-recognition",choice.id,cpuOptions);
  // Avoid retaining hundreds of MB of old decoder/encoder tensors after
  // switching from Base to Small or vice versa in the same editor session.
  for(const [id,old] of cache){
   if(id!==choice.id){try{await old.dispose?.();}catch(_){}cache.delete(id);}
  }
  cache.set(choice.id,recognizer);
  return recognizer;
 })();
 pending.set(choice.id,task);
 try{return await task;}finally{pending.delete(choice.id);}
}
async function decodeAudio(file,progress){
 const bytes=await file.arrayBuffer();
 const Ctx=global.AudioContext||global.webkitAudioContext;
 if(!Ctx)throw Error("Браузер не підтримує декодування звуку.");
 const ctx=new Ctx();
 try{
  progress?.("Декодування звукової доріжки…");
  let buffer;
  try{buffer=await ctx.decodeAudioData(bytes.slice(0));}
  catch(e){throw Error("Не вдалося декодувати аудіодоріжку. Імпортуй окремий WAV, MP3 або M4A-файл.");}
  if(buffer.duration>600)throw Error("Обмеження цього локального режиму — 10 хвилин на запис.");
  const offline=new OfflineAudioContext(1,Math.ceil(buffer.duration*16000),16000);
  const source=offline.createBufferSource();
  source.buffer=buffer;source.connect(offline.destination);source.start();
  const resampled=await offline.startRendering();
  return {samples:resampled.getChannelData(0),duration:resampled.duration};
 }finally{await ctx.close();}
}
function chunkCaptions(data,duration,{maxWords=4,maxDuration=2.8}={}){
 const chunks=(data?.chunks||[]).map(c=>{
  const range=c.timestamp||[0,0],start=+range[0],end=+range[1];
  if(!Number.isFinite(start)||start<0)return null;
  const text=String(c.text||"").trim();
  if(!text)return null;
  return {start,duration:Math.max(.13,(Number.isFinite(end)?end:start+.5)-start),end:Number.isFinite(end)?end:start+.5,text};
 }).filter(Boolean);
 if(chunks.length){
  const looksLikeWords=chunks.filter(c=>c.text.split(/\s+/).length===1).length/chunks.length>.85;
  // Whisper word timestamps represent estimated actual word boundaries.
  if(looksLikeWords){
   const groups=[];let group=[];
   const flush=()=>{
    if(!group.length)return;
    const start=group[0].start,end=group[group.length-1].end;
    groups.push({start,duration:Math.max(.15,end-start),
      text:group.map(w=>w.text).join(" "),words:group.map(w=>({...w}))});
    group=[];
   };
   for(const word of chunks){
    if(group.length&&(group.length>=maxWords||word.end-group[0].start>maxDuration||word.start-group[group.length-1].end>.65))flush();
    group.push(word);
    if(/[.!?…]$/.test(word.text))flush();
   }
   flush();return groups;
  }
  // Fallback when word-level timestamps are not supported: honest segment times.
  return chunks.map(c=>({start:c.start,duration:c.duration,text:c.text,words:[]}));
 }
 // Models without timestamps: preserve phrases but do not invent precise words.
 const words=String(data?.text||"").trim().split(/\s+/).filter(Boolean);
 if(!words.length)return [];
 const count=Math.ceil(words.length/maxWords),partDuration=duration/count;
 return Array.from({length:count},(_,i)=>({
  start:+(i*partDuration).toFixed(3),duration:+Math.max(.2,partDuration).toFixed(3),
  text:words.slice(i*maxWords,(i+1)*maxWords).join(" "),words:[]
 }));
}

const LANGUAGES={auto:null,uk:"ukrainian",pl:"polish",en:"english",de:"german",es:"spanish",fr:"french",it:"italian",pt:"portuguese",cs:"czech",sk:"slovak",ru:"russian",ro:"romanian",tr:"turkish",nl:"dutch",hu:"hungarian",ar:"arabic",hi:"hindi"};
function modelOptions(language,word=true){
 const opts={task:"transcribe",return_timestamps:word?"word":true,
  do_sample:false,temperature:0};
 if(language&&LANGUAGES[language])opts.language=LANGUAGES[language];
 return opts;
}
const BOILERPLATE=[
 /thank\s+you\s+for\s+watching(?:\s+this)?\s+video/i,
 /thanks?\s+for\s+watching/i,
 /please\s+subscribe\s+to\s+(?:my|the)\s+channel/i,
 /subtitles?\s+(?:by|provided\s+by)\s+/i
];
const normalizeText=t=>String(t||"").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu," ").trim();
function gibberishReason(value){
 const text=String(value||"").trim(),words=text.match(/\p{L}+/gu)||[];
 if(!words.length)return "Текст не містить слів";
 // Very long pseudo-words such as "Wytokokokokokokoko..." indicate a
 // degenerate Whisper decoding loop, not an actual Polish sentence.
 for(const word of words){
  const w=word.normalize("NFKC").toLowerCase();
  if(w.length>45)return "Неприродно довге слово ("+w.length+" символів)";
  if(w.length>=18){
   for(let size=1;size<=5;size++){
    const counts=new Map();
    for(let i=0;i+size<=w.length;i++) {
     const part=w.slice(i,i+size);
     counts.set(part,(counts.get(part)||0)+1);
    }
    const max=Math.max(0,...counts.values());
    if((size===1&&max/w.length>.82)||
       (size>=2&&max>=6&&max*size/w.length>=.72))
      return "Повторення складів у слові";
   }
   // A repeated two-syllable motif is often displaced by one character:
   // detect "kokokokokoko" even if prefixed with Polish-looking letters.
   if(/(.{2,5})\1{4,}/u.test(w))return "Нескінченне повторення складів";
  }
 }
 if(words.length>=6){
  const counts=new Map();
  for(const word of words){const token=word.toLowerCase();counts.set(token,(counts.get(token)||0)+1);}
  const common=Math.max(...counts.values());
  if(common>=6&&common/words.length>.68)return "Надмірне повторення слова";
 }
 if(text.length>450)return "Неприродно довгий субтитр";
 return "";
}
function inspectTranscript(items){
 const clean=[],rejected=[],seen=new Map();
 for(const entry of items){
  const text=String(entry.text||"").trim(),canonical=normalizeText(text);
  if(!canonical)continue;
  const reason=BOILERPLATE.some(re=>re.test(text))?"Підозріла шаблонна фраза Whisper":gibberishReason(text);
  if(reason){rejected.push({text:text.slice(0,160),reason});continue;}
  if(canonical.split(" ").length>=4){
   const last=seen.get(canonical);
   if(last!==undefined&&entry.start-last>3){
    rejected.push({text:text.slice(0,160),reason:"Повтор тієї самої фрази"});continue;
   }
   seen.set(canonical,entry.start);
  }
  clean.push(entry);
 }
 return {captions:clean,warnings:rejected};
}
function audioDiagnostics(samples){
 let sum=0,peak=0,nonzero=0;
 for(let i=0;i<samples.length;i++){
  const x=samples[i];sum+=x*x;peak=Math.max(peak,Math.abs(x));if(Math.abs(x)>.001)nonzero++;
 }
 return {rms:Math.sqrt(sum/Math.max(1,samples.length)),peak,
  activeRatio:nonzero/Math.max(1,samples.length)};
}
async function transcribe(file,progress,{language="auto",quality="balanced"}={}){
 const audio=await decodeAudio(file,progress);
 const stats=audioDiagnostics(audio.samples);
 if(stats.rms<.0007||stats.activeRatio<.002)throw Error("Звукова доріжка майже беззвучна. Перевір оригінальний звук.");
 const engine=await load(progress,{quality});
 if(!(language in LANGUAGES))language="auto";
 const samples=audio.samples,rate=16000,step=28,windowSeconds=30;
 // A 20s advertising clip is recognized as a single contextual 20s window.
 // Only long videos are chunked, with a 2-second overlap.
 const count=Math.max(1,Math.ceil((audio.duration-2)/step));
 const output=[];
 for(let i=0;i<count;i++){
  const start=i*step;if(start>=audio.duration)break;
  const end=Math.min(audio.duration,start+windowSeconds);
  const part=samples.subarray(Math.round(start*rate),Math.min(samples.length,Math.round(end*rate)));
  if(!part.length)continue;
  progress?.("Розпізнавання "+MODELS[quality]?.label+" · "+(i+1)+"/"+count+" · "+Math.round(start)+"–"+Math.round(end)+" с");
  let result;
  try{result=await engine(part,modelOptions(language,true));}
  catch(e){
   progress?.("Уточнюємо часові позначки фраз ("+(i+1)+"/"+count+")…");
   result=await engine(part,modelOptions(language,false));
  }
  const phrases=chunkCaptions(result,end-start);
  const nextStart=(i+1)*step;
  const keepUntil=nextStart>=audio.duration?audio.duration:nextStart+1;
  for(const c of phrases){
   const absoluteStart=c.start+start,absoluteEnd=c.start+c.duration+start;
   if(absoluteEnd<=start||absoluteStart>=keepUntil)continue;
   const words=(c.words||[]).map(w=>({...w,
    start:+(w.start+start).toFixed(3),end:+(w.end+start).toFixed(3)}))
     .filter(w=>w.end>start&&w.start<keepUntil);
   const rangeStart=Math.max(start,absoluteStart),rangeEnd=Math.min(keepUntil,absoluteEnd);
   if(rangeEnd-rangeStart<.07)continue;
   output.push({start:+rangeStart.toFixed(3),duration:+(rangeEnd-rangeStart).toFixed(3),
    text:words.length?words.map(w=>w.text).join(" "):c.text,words});
  }
 }
 output.sort((a,b)=>a.start-b.start);
 const examined=inspectTranscript(output);
 const invalid=examined.warnings.length,total=invalid+examined.captions.length;
 // A few legitimate words surrounded by obvious hallucinations are NOT a
 // trustworthy transcript. Keep previously approved subtitles unchanged.
 const unreliable=invalid>0&&(examined.captions.length===0||invalid/total>=.4);
 if(unreliable){
  const reasons=[...new Set(examined.warnings.map(x=>x.reason))].join(", ");
  const err=new Error("Розпізнавання дало підозрілий текст ("+reasons+"). Старі субтитри збережені. Обери польську вручну, перевір голос і спробуй іншу модель.");
  err.code="WHISPER_HALLUCINATION";throw err;
 }
 if(!examined.captions.length)throw Error("Слів не розпізнано. Перевір звук, мову або обери якіснішу модель.");
 // Preserve existing consumer array format, attach non-enumerable diagnostics
 // (no unintended caption content added to project persistence).
 Object.defineProperty(examined.captions,"diagnostics",{value:{quality,language,audio:stats,warnings:examined.warnings}});
 if(examined.warnings.length)progress?.("Модель видала "+examined.warnings.length+" підозрілих фраз. Перевір результат перед публікацією.");
 return examined.captions;
}
global.PTSLocalSpeech={MODEL,MODELS,LANGUAGES,load,transcribe,decodeAudio,chunkCaptions,modelOptions,inspectTranscript,gibberishReason,audioDiagnostics};
})(window);
