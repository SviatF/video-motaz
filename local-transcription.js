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
function chunkCaptions(data,duration){
 if(Array.isArray(data.chunks)&&data.chunks.length){
  return data.chunks.map(c=>{
   const t=c.timestamp||[0,0],start=Number(t[0]),end=Number(t[1]);
   if(!Number.isFinite(start))return null;
   return {start:Math.max(0,start),duration:Math.max(.2,Math.min(10,(Number.isFinite(end)?end:start+3)-start)),text:String(c.text||"").trim()};
  }).filter(x=>x&&x.text);
 }
 const words=String(data.text||"").trim().split(/\s+/).filter(Boolean);
 const result=[];let part=[],at=0;
 for(const word of words){
  part.push(word);
  if(part.length>=6||/[.!?]$/.test(word)){
   const n=Math.min(duration,Math.max(1.1,part.length*.48));
   result.push({start:at,duration:Math.min(n,Math.max(.3,duration-at)),text:part.join(" ")});
   at+=n;part=[];
  }
 }
 if(part.length)result.push({start:at,duration:Math.max(.3,Math.min(3,duration-at)),text:part.join(" ")});
 return result.filter(x=>x.start<duration&&x.duration>0);
}
async function transcribe(file,progress){
 const audio=await decodeAudio(file,progress);
 const engine=await load(progress);
 progress?.("Розпізнавання мовлення на цьому пристрої…");
 const result=await engine(audio.samples,{
  language:"ukrainian",task:"transcribe",return_timestamps:true,
  chunk_length_s:30,stride_length_s:5
 });
 return chunkCaptions(result,audio.duration);
}
global.PTSLocalSpeech={MODEL,load,transcribe,decodeAudio,chunkCaptions};
})(window);
