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

const LANGUAGES={auto:null,uk:"ukrainian",pl:"polish",en:"english",de:"german",es:"spanish",fr:"french",it:"italian",pt:"portuguese",cs:"czech",sk:"slovak",ru:"russian",ro:"romanian",tr:"turkish",nl:"dutch",hu:"hungarian",ar:"arabic",hi:"hindi"};
function modelOptions(language,word=true){
 const opts={task:"transcribe",return_timestamps:word?"word":true};
 if(language&&LANGUAGES[language])opts.language=LANGUAGES[language];
 return opts;
}
async function transcribe(file,progress,{language="auto"}={}){
 const audio=await decodeAudio(file,progress);
 const engine=await load(progress);
 if(!(language in LANGUAGES))language="auto";
 // Short overlapping windows keep 20-60s social videos from silently losing
 // the latter half when a multilingual model returns an early stop token.
 const samples=audio.samples,rate=16000,step=14,windowSeconds=15;
 const count=Math.max(1,Math.ceil((audio.duration-1)/step));
 const results=[];
 for(let i=0;i<count;i++){
  const start=i*step;if(start>=audio.duration)break;
  const end=Math.min(audio.duration,start+windowSeconds);
  const part=samples.subarray(Math.round(start*rate),Math.min(samples.length,Math.round(end*rate)));
  if(!part.length)continue;
  progress?.("Розпізнавання мовлення "+(i+1)+"/"+count+" · "+Math.round(start)+"–"+Math.round(end)+" с · "+(language==="auto"?"визначення мови автоматично":LANGUAGES[language]));
  let result;
  try{result=await engine(part,modelOptions(language,true));}
  catch(e){
   progress?.("Уточнення часових позначок фраз ("+(i+1)+"/"+count+")…");
   result=await engine(part,modelOptions(language,false));
  }
  const phrases=chunkCaptions(result,end-start);
  const nextStart=(i+1)*step;
  // Keep the first half of the overlap from this chunk and the second
  // half from the next. No artificial captions are added in silent gaps.
  const keepUntil=nextStart>=audio.duration?audio.duration:nextStart+.5;
  for(const c of phrases){
   const absoluteStart=c.start+start,absoluteEnd=c.start+c.duration+start;
   if(absoluteEnd<=start || absoluteStart>=keepUntil)continue;
   const words=(c.words||[]).map(w=>({...w,start:+(w.start+start).toFixed(3),end:+(w.end+start).toFixed(3)}))
      .filter(w=>w.end>start && w.start<keepUntil);
   const normalizedStart=Math.max(start,absoluteStart),
         normalizedEnd=Math.min(keepUntil,absoluteEnd);
   if(normalizedEnd-normalizedStart<.07)continue;
   const text=words.length?words.map(w=>w.text).join(" "):c.text;
   results.push({start:+normalizedStart.toFixed(3),duration:+(normalizedEnd-normalizedStart).toFixed(3),text,words});
  }
 }
 results.sort((a,b)=>a.start-b.start);
 return results.filter(x=>x.text.trim());
}
global.PTSLocalSpeech={MODEL,LANGUAGES,load,transcribe,decodeAudio,chunkCaptions,modelOptions};
})(window);
