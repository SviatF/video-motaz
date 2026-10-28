/* PTS Beat Sync: on-device onset analysis of decoded WebAudio PCM.
   Markers are editing aids only; no audio is sent to an external service. */
(function(global){
"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function detect(audioBuffer,{maxBeats=500}={}){
 if(!audioBuffer||!audioBuffer.length||!audioBuffer.sampleRate)return [];
 const sr=audioBuffer.sampleRate,channels=Math.min(audioBuffer.numberOfChannels,2);
 const hop=512,frame=1024;
 const pcm=Array.from({length:channels},(_,i)=>audioBuffer.getChannelData(i));
 const values=[];
 for(let k=0;k+frame<audioBuffer.length;k+=hop){
  let total=0;
  for(let j=0;j<frame;j+=4){
   let sum=0;for(let ch=0;ch<channels;ch++)sum+=pcm[ch][k+j];
   const v=sum/channels;total+=v*v;
  }
  values.push(Math.sqrt(total/(frame/4)));
 }
 const onset=values.map((v,i)=>Math.max(0,v-(values[i-2]||0)));
 const list=[],minGap=.18,half=Math.round(sr/hop*.23);
 for(let i=half;i<onset.length-half;i++){
  let avg=0,count=0;
  for(let j=Math.max(0,i-half);j<=Math.min(onset.length-1,i+half);j++){avg+=onset[j];count++;}
  avg/=Math.max(1,count);
  const peak=onset[i];
  if(peak<Math.max(.005,avg*1.8))continue;
  if(peak<(onset[i-1]||0)||peak<=(onset[i+1]||0))continue;
  const t=i*hop/sr;
  if(list.length&&t-list[list.length-1].t<minGap){
   if(peak>list[list.length-1].strength)list[list.length-1]={t,strength:peak};
  }else list.push({t,strength:peak});
  if(list.length>maxBeats)break;
 }
 return list.map(x=>+x.t.toFixed(3)).filter(t=>t>0);
}
function splitAtBeats(clips,beats,{maxCuts=100,minDuration=.28}={}){
 const times=Array.from(new Set((beats||[]).filter(Number.isFinite).map(x=>+x.toFixed(3)))).sort((a,b)=>a-b);
 let cuts=0;
 const out=[];
 for(const clip of clips){
  const inner=times.filter(t=>t>clip.start+minDuration&&t<clip.start+clip.duration-minDuration);
  const limited=inner.slice(0,Math.max(0,maxCuts-cuts));
  const boundaries=[clip.start,...limited,clip.start+clip.duration];
  cuts+=limited.length;
  for(let i=0;i<boundaries.length-1;i++){
   const start=boundaries[i],d=boundaries[i+1]-start;
   if(d<.08)continue;
   out.push({...clip,id:i===0?clip.id:(global.crypto?.randomUUID?.()||"beat-"+Math.random()),
    start:+start.toFixed(3),duration:+d.toFixed(3),trim:+((clip.trim||0)+(start-clip.start)).toFixed(3)});
  }
 }
 return {clips:out,cuts};
}
global.PTSBeatSync={detect,splitAtBeats};
})(window);
