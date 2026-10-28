/* PTS Local Transcription — optional Whisper tiny multilingual.
 * Loads free model weights on demand from Hugging Face; inference only in browser.
 * No audio upload, no paid services. Requires internet on first model download.
 */
(function(global){
"use strict";
let cachedPipeline=null,loading=null;
const MODEL="onnx-community/whisper-tiny";
async function load(progress){
 if(cachedPipeline)return cachedPipeline;
 if(loading)return loading;
 loading=(async()=>{
  progress?.("Завантаження модуля розпізнавання…");
  const module=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm");
  progress?.("Підготовка локальної моделі Whisper…");
  const recognizer=await module.pipeline("automatic-speech-recognition",MODEL,{
   device:"wasm",
   dtype:"q8",
   progress_callback:evt=>{
    if(evt.status==="progress"&&Number.isFinite(evt.progress))progress?.("Завантаження моделі: "+Math.round(evt.progress)+"%");
   }
  });
  cachedPipeline=recognizer;return recognizer;
 })();
 try{return await loading;}finally{loading=null;}
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
async function transcribe(file,progress,{language="ukrainian"}={}){
 const audio=await decodeAudio(file,progress);
 const engine=await load(progress);
 progress?.("Розпізнавання слів і точних часових позначок на твоєму пристрої…");
 let result;
 try{
  result=await engine(audio.samples,{
   language,task:"transcribe",return_timestamps:"word",
   chunk_length_s:30,stride_length_s:5
  });
 }catch(e){
  progress?.("Точні позначки слів недоступні. Пробуємо фразові таймкоди…");
  result=await engine(audio.samples,{
   language,task:"transcribe",return_timestamps:true,
   chunk_length_s:30,stride_length_s:5
  });
 }
 return chunkCaptions(result,audio.duration);
}
global.PTSLocalSpeech={MODEL,load,transcribe,decodeAudio,chunkCaptions};
})(window);
