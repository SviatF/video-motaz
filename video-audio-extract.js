/* PTS Video Voice Extractor: records only the audio of a local video.
 * No upload. The recording runs at real-time playback speed in the browser.
 * The source media element is routed only to MediaStreamDestination so the
 * transcription does not play aloud through the speakers.
 */
(function(global){"use strict";
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
async function audioFromVideo(url,{limit=600,onProgress}={}){
 if(!global.MediaRecorder)throw Error("Цей браузер не підтримує витягування звуку з відео.");
 const AudioContext=global.AudioContext||global.webkitAudioContext;
 if(!AudioContext)throw Error("Браузер не підтримує аудіообробку.");
 const video=document.createElement("video");
 video.preload="auto";video.playsInline=true;video.crossOrigin="anonymous";
 video.src=url;video.style.display="none";document.body.appendChild(video);
 let ctx=null,recorder=null,destination=null;let stopped=false,timeoutId=0;
 try{
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error("Не вдалося прочитати відеофайл.")),20000);
   const ready=()=>{clearTimeout(timer);resolve();};
   video.addEventListener("loadedmetadata",ready,{once:true});
   video.addEventListener("error",()=>{clearTimeout(timer);reject(Error("Непідтримуваний формат відео."));},{once:true});
   if(video.readyState>=1)ready();
  });
  const total=video.duration;
  if(!Number.isFinite(total)||total<=0)throw Error("Не вдається визначити тривалість відео.");
  if(total>limit)throw Error("Цей режим підтримує ролики до "+Math.round(limit/60)+" хвилин. Розділи довший запис.");
  const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime)throw Error("Браузер не підтримує запис аудіодоріжки (WebM/MP4). Спробуй Chrome або Edge.");
  ctx=new AudioContext();
  const source=ctx.createMediaElementSource(video);
  destination=ctx.createMediaStreamDestination();
  source.connect(destination); // never connect to speakers
  await ctx.resume();
  const data=[];
  recorder=new MediaRecorder(destination.stream,{mimeType:mime,audioBitsPerSecond:128000});
  const recorded=new Promise((resolve,reject)=>{
   recorder.ondataavailable=e=>{if(e.data?.size)data.push(e.data);};
   recorder.onerror=()=>reject(Error("Помилка захоплення звуку відео."));
   recorder.onstop=()=>{if(data.length)resolve(new Blob(data,{type:mime}));else reject(Error("Аудіодоріжка порожня. Перевір, чи є у відео звук."));};
  });
  recorder.start(500);
  const ended=new Promise((resolve,reject)=>{
   video.addEventListener("ended",resolve,{once:true});
   video.addEventListener("error",()=>reject(Error("Помилка відтворення відео.")),{once:true});
  });
  await video.play();
  onProgress?.("Витягування голосу з відео — 0%. Запис у реальному часі, без завантаження файлу на сервер.");
  const update=setInterval(()=>onProgress?.("Витягування голосу з відео — "+Math.min(99,Math.round(video.currentTime/total*100))+"% · звук не відтворюється через динаміки"),750);
  timeoutId=setTimeout(()=>{if(!video.ended){video.pause();if(recorder?.state==="recording")recorder.stop();}},Math.ceil((total+12)*1000));
  try{await ended;}finally{clearInterval(update);}
  video.pause();
  if(recorder.state!=="inactive")recorder.stop();
  const audio=await recorded;
  stopped=true;
  onProgress?.("Звук витягнуто · "+Math.round(total)+" с. Підготовка розпізнавання.");
  return audio;
 }finally{
  clearTimeout(timeoutId);
  video.pause();video.removeAttribute("src");video.load();video.remove();
  if(recorder?.state==="recording")try{recorder.stop();}catch(e){}
  if(destination)for(const t of destination.stream.getTracks())t.stop();
  if(ctx)await ctx.close().catch(()=>{});
 }
}
global.PTSVideoAudio={audioFromVideo};
})(window);
