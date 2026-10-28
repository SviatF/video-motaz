/* PTS Motion Keyframes v1. Deterministic, Canvas/export-safe 2D transforms. */
(function(global){
"use strict";
const FIELDS=["x","y","scale","rotation","opacity"];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const n=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
function values(item,kind){
 return {x:n(item.x,50),y:n(item.y,kind==="title"?45:40),
  scale:kind==="title"?n(item.size,8):n(item.scale,20),rotation:n(item.rotation,0),
  opacity:n(item.opacity,100)};
}
function frame(item,kind,offset){
 return {t:+Math.max(0,offset).toFixed(3),...values(item,kind)};
}
function sample(item,kind,time){
 const base=values(item,kind),keys=(item.keyframes||[]).slice().sort((a,b)=>a.t-b.t);
 if(!keys.length)return base;
 const offset=Math.max(0,time-item.start);
 if(offset<=keys[0].t)return {...base,...keys[0]};
 if(offset>=keys[keys.length-1].t)return {...base,...keys[keys.length-1]};
 let i=0;while(i<keys.length-1&&keys[i+1].t<offset)i++;
 const a=keys[i],b=keys[i+1],u=clamp((offset-a.t)/(b.t-a.t||1),0,1);
 const curve=item.keyframeEase||"smooth";
 const k=curve==="linear"?u:curve==="ease-in"?u*u*u:curve==="ease-out"?1-(1-u)**3:u*u*(3-2*u);
 const result={};
 for(const key of FIELDS)result[key]=n(a[key],base[key])+(n(b[key],base[key])-n(a[key],base[key]))*k;
 return result;
}
function position(item,kind,time){
 const v=sample(item,kind,time);
 return {...item,x:v.x,y:v.y,rotation:v.rotation,opacity:v.opacity,
  ...(kind==="title"?{size:v.scale}:{scale:v.scale})};
}
function put(item,kind,time,updated){
 const offset=+clamp(time-item.start,0,item.duration).toFixed(3);
 if(!Array.isArray(item.keyframes))item.keyframes=[];
 if(item.keyframes.length===0 && offset>.005)item.keyframes.push(frame(item,kind,0));
 const source={...sample(item,kind,time),...(updated||{})};
 const key={t:offset,...Object.fromEntries(FIELDS.map(k=>[k,source[k]]))};
 const index=item.keyframes.findIndex(k=>Math.abs(k.t-offset)<.03);
 if(index>=0)item.keyframes[index]=key;else item.keyframes.push(key);
 item.keyframes.sort((a,b)=>a.t-b.t);
 return key;
}
function remove(item,time){
 if(!item.keyframes?.length)return false;
 const offset=time-item.start;
 const index=item.keyframes.findIndex(k=>Math.abs(k.t-offset)<.06);
 if(index<0)return false;
 item.keyframes.splice(index,1);return true;
}
global.PTSMotion={FIELDS,values,sample,position,put,remove};
})(window);
