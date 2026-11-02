/* PTS Blur Effects — Canvas 2D localized and full-frame post-processing.
 * Blur affects video/background and ambient FX, but never edit handles,
 * captions or CTA overlays rendered later. Output is baked into export.
 */
(function(global){"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const scratch=document.createElement("canvas");
const scratchCtx=scratch.getContext("2d",{alpha:false});
function geometry(layer,w,h){
 const ww=clamp(layer.width??34,6,100)/100*w,hh=clamp(layer.height??26,6,100)/100*h;
 const x=clamp(layer.x??50,0,100)/100*w,y=clamp(layer.y??50,0,100)/100*h;
 return {x:x-ww/2,y:y-hh/2,width:ww,height:hh,cx:x,cy:y};
}
function apply(ctx,w,h,layers,t){
 if(!ctx||!layers?.length)return;
 for(const layer of layers){
  if(!["blur","blur-region"].includes(layer.effect))continue;
  if(t<layer.start||t>=layer.start+layer.duration)continue;
  const strength=clamp(layer.strength??layer.intensity??55,0,100);
  if(!strength)continue;
  // Downscale source: efficiently smooth large 1080p/4K frames in-browser.
  const scale=.5,sw=Math.max(2,Math.round(w*scale)),sh=Math.max(2,Math.round(h*scale));
  if(scratch.width!==sw)scratch.width=sw;
  if(scratch.height!==sh)scratch.height=sh;
  scratchCtx.imageSmoothingEnabled=true;
  scratchCtx.imageSmoothingQuality="high";
  scratchCtx.drawImage(ctx.canvas,0,0,w,h,0,0,sw,sh);
  const radius=Math.max(1,Math.round(Math.min(w,h)*(.002+strength*.00058)));
  const pad=Math.min(radius*1.3,Math.min(w,h)*.09);
  ctx.save();
  if(layer.effect==="blur-region"){
   const g=geometry(layer,w,h),shape=layer.shape||"rect";
   ctx.beginPath();
   if(shape==="ellipse")ctx.ellipse(g.cx,g.cy,g.width/2,g.height/2,0,0,Math.PI*2);
   else if(shape==="round"&&ctx.roundRect)ctx.roundRect(g.x,g.y,g.width,g.height,Math.min(g.width,g.height)*.13);
   else ctx.rect(g.x,g.y,g.width,g.height);
   ctx.clip();
  }
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.filter="blur("+radius+"px)";
  // Overscan to prevent blurred transparent borders on the video edges.
  ctx.drawImage(scratch,-pad,-pad,w+pad*2,h+pad*2);
  ctx.restore();
 }
}
global.PTSBlur={apply,geometry};
})(window);
