/* PTS Creative Studio - fullscreen procedural motion overlays.
   Original deterministic effects: no external video, image assets or shaders.
   frame(t) is reproducible across scrubbing, playback and browser recording.
*/
(function(global){
"use strict";
const PRESETS=[
 {id:"snow",name:"Cinematic Snowfall",desc:"Білий сніг із глибиною",icon:"❄",tag:"WINTER",tint:"#f3f8ff"},
 {id:"snowstorm",name:"Snowstorm",desc:"Густий сніг і вітер",icon:"🌨",tag:"WINTER",tint:"#dceeff"},
 {id:"embers",name:"Fire Embers",desc:"Жаринки, що піднімаються",icon:"🔥",tag:"FIRE",tint:"#ff9347"},
 {id:"fire",name:"Flame Rise",desc:"Палаючий нижній край",icon:"♨",tag:"FIRE",tint:"#ff5c20"},
 {id:"rain",name:"Night Rain",desc:"Кінематографічні краплі",icon:"☂",tag:"WEATHER",tint:"#bcdafa"},
 {id:"fog",name:"Cinematic Fog",desc:"М'який рухомий туман",icon:"☁",tag:"ATMOSPHERE",tint:"#c2c4d2"},
 {id:"dust",name:"Golden Dust",desc:"Теплі світлові порошинки",icon:"✧",tag:"ATMOSPHERE",tint:"#f4c183"},
 {id:"bokeh",name:"Dreamy Bokeh",desc:"Розмиті світлові кола",icon:"◌",tag:"LIGHT",tint:"#fbf5ec"},
 {id:"lightleak",name:"Light Leaks",desc:"Лінзові кольорові відблиски",icon:"☀",tag:"LIGHT",tint:"#ffb477"},
 {id:"sparkles",name:"Magic Sparkles",desc:"Мерехтіння на весь кадр",icon:"✦",tag:"LIGHT",tint:"#fff9e6"},
 {id:"confetti",name:"Celebration Confetti",desc:"Святкові частинки",icon:"🎊",tag:"PARTICLES",tint:"#ffffff"},
 {id:"petals",name:"Falling Petals",desc:"Пелюстки, що падають",icon:"❀",tag:"PARTICLES",tint:"#ffafc5"},
 {id:"hearts",name:"Floating Hearts",desc:"Сердечка знизу вгору",icon:"♥",tag:"PARTICLES",tint:"#ff7c9c"},
 {id:"bubbles",name:"Soft Bubbles",desc:"Прозорі бульбашки",icon:"◯",tag:"PARTICLES",tint:"#c3eaff"},
 {id:"ash",name:"Floating Ash",desc:"Димний попіл у повітрі",icon:"▪",tag:"ATMOSPHERE",tint:"#b8b5ad"},
 {id:"stars",name:"Starfield",desc:"Живе нічне зоряне сяйво",icon:"✧",tag:"SPACE",tint:"#d8e6ff"}
];
const getPreset=id=>PRESETS.find(p=>p.id===id);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function hash(x){const n=Math.sin(x*127.1+78.233)*43758.5453;return n-Math.floor(n);}
function rand(i,k,seed){return hash(i*17.31+k*43.89+seed*7.67);}
function rgba(hex,a){
 const m=/^#?([a-f0-9]{6})$/i.exec(hex||"");if(!m)return "rgba(255,255,255,"+a+")";
 const n=parseInt(m[1],16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";
}
function dot(ctx,x,y,r,color,a,blur){
 if(a<.015||r<.2)return;
 ctx.globalAlpha=1;
 if(blur&&r>1.8){
  const grad=ctx.createRadialGradient(x,y,0,x,y,r*2.2);
  grad.addColorStop(0,rgba(color,a));grad.addColorStop(.35,rgba(color,a*.6));grad.addColorStop(1,rgba(color,0));
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r*2.2,0,Math.PI*2);ctx.fill();
 }else{ctx.fillStyle=rgba(color,a);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
}
function star(ctx,x,y,r,color,a){
 ctx.strokeStyle=rgba(color,a);ctx.lineWidth=Math.max(.8,r*.16);ctx.beginPath();
 ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();
 dot(ctx,x,y,r*.2,color,a,false);
}
function heart(ctx,x,y,r,color,a){
 ctx.save();ctx.translate(x,y);ctx.scale(r/15,r/15);ctx.fillStyle=rgba(color,a);ctx.beginPath();
 ctx.moveTo(0,12);ctx.bezierCurveTo(-24,-2,-11,-16,0,-7);ctx.bezierCurveTo(11,-16,24,-2,0,12);ctx.fill();ctx.restore();
}
function particle(ctx,w,h,layer,t){
 const preset=getPreset(layer.overlay);if(!preset)return;
 const id=preset.id,amount=clamp((layer.intensity??65)/100,.05,1.5);
 const opacity=clamp((layer.opacity??75)/100,0,1),speed=clamp(layer.speed??1,.05,5);
 const sz=clamp((layer.size??100)/100,.2,3),c=layer.tint||preset.tint;
 const seed=Number.isFinite(+layer.seed)?+layer.seed:5.75;
 const local=Math.max(0,t-layer.start)*speed;
 // Stable particles are drawn from time and an index, not previous frames.
 const mult=(id==="rain"||id==="snowstorm")?180:(id==="fog"?24:(id==="lightleak"?8:115));
 const count=Math.min(360,Math.max(2,Math.round(mult*amount)));
 const basis=Math.min(w,h),rate=local;
 ctx.save();
 if(id==="fog"){
  for(let i=0;i<count;i++){
   const depth=rand(i,5,seed),x=((rand(i,1,seed)+(rate*(.006+.007*depth)))%1.55-.25)*w;
   const y=(rand(i,2,seed)*1.4-.2)*h,rx=basis*(.23+rand(i,3,seed)*.5)*sz;
   const g=ctx.createRadialGradient(x,y,0,x,y,rx);
   g.addColorStop(0,rgba(c,opacity*(.022+.026*depth)));
   g.addColorStop(.6,rgba(c,opacity*.015));g.addColorStop(1,rgba(c,0));
   ctx.save();ctx.translate(x,y);ctx.scale(1,0.33+rand(i,4,seed)*.2);ctx.translate(-x,-y);
   ctx.fillStyle=g;ctx.fillRect(x-rx,y-rx,rx*2,rx*2);ctx.restore();
  }
  ctx.restore();return;
 }
 if(id==="lightleak"){
  for(let i=0;i<count;i++){
   const x=(.15+.7*rand(i,1,seed)+Math.sin(rate*.21+i)*.18)*w;
   const y=(-.2+.55*rand(i,2,seed))*h;
   const r=basis*(.3+.33*rand(i,3,seed))*sz;
   const g=ctx.createRadialGradient(x,y,0,x,y,r);
   g.addColorStop(0,rgba(c,opacity*.14));g.addColorStop(.52,rgba(c,opacity*.035));g.addColorStop(1,rgba(c,0));
   ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  ctx.restore();return;
 }
 if(id==="fire"){
  const heat=ctx.createLinearGradient(0,h,0,h*.4);
  heat.addColorStop(0,rgba(c,opacity*.34*amount));heat.addColorStop(.4,rgba(c,opacity*.08));heat.addColorStop(1,rgba(c,0));
  ctx.fillStyle=heat;ctx.fillRect(0,h*.35,w,h*.65);
 }
 for(let i=0;i<count;i++){
  const a=rand(i,1,seed),b=rand(i,2,seed),d=rand(i,3,seed),e=rand(i,4,seed);
  const alpha=opacity*(.32+.67*e),depth=.4+.6*d;
  let x,y,r,phase,falling,rv;
  if(["snow","snowstorm","rain","confetti","petals","ash"].includes(id)){
   rv=id==="rain"?1.55:(id==="snowstorm"?.5:(id==="confetti"?.3:.12));
   falling=(rate*rv*(.4+depth)+b)%1.45;
   x=((a+rate*(id==="snowstorm"?.19:id==="rain"?.08:.012)*(1+depth)+Math.sin(rate*.6+i)*.017)%1.55-.2)*w;
   y=(falling-.2)*h;
  }else{
   x=(a+Math.sin(rate*.6+i*3)*.023)*w;
   y=((b-rate*(id==="embers"||id==="fire"?.16:.07)*(depth*.9+.3))%1.3+1.3)%1.3*h;
   if(y>h*1.12)y-=h*1.3;
  }
  if(id==="snow"||id==="snowstorm"){
   r=(1+3*d)*sz*depth*(basis/720);x+=Math.sin(rate*.9+i)*w*.012*depth;
   dot(ctx,x,y,r,c,alpha*(id==="snowstorm"?.9:1),d>.8);
  }else if(id==="rain"){
   ctx.strokeStyle=rgba(c,alpha*.5);ctx.lineWidth=Math.max(.65,1.3*depth*basis/900);
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-w*.006*(.5+depth),y+h*(.022+.026*depth)*sz);ctx.stroke();
  }else if(id==="embers"||id==="fire"){
   if(id==="fire"&&y<h*.15)continue;
   r=(1+3.3*d)*sz*(basis/720);dot(ctx,x,y,r,c,alpha*(id==="fire"?.9:.8),true);
   if(id==="fire"&&i%5===0){
    ctx.strokeStyle=rgba(c,alpha*.3);ctx.lineWidth=r*.45;
    ctx.beginPath();ctx.moveTo(x,y+r*4);ctx.quadraticCurveTo(x+Math.sin(rate*3+i)*7,y+r,x+2*Math.sin(rate+i),y-r*5);ctx.stroke();
   }
  }else if(id==="dust"||id==="bokeh"){
   r=(id==="bokeh"?7+21*d:1+2.5*d)*sz*basis/720;
   dot(ctx,x,y,r,c,alpha*(id==="bokeh"?.3:.65),true);
  }else if(id==="sparkles"||id==="stars"){
   const twinkle=.24+.76*Math.abs(Math.sin(rate*(.7+2*d)+i*9));
   r=(1.5+4*d)*sz*basis/720;
   if(i%6===0)star(ctx,x,y,r*2,c,alpha*twinkle);else dot(ctx,x,y,r*.4,c,alpha*twinkle,true);
  }else if(id==="confetti"){
   ctx.save();ctx.translate(x,y);ctx.rotate(rate*(1+d)*3+i);
   ctx.fillStyle=rgba(i%3===0?"#f4c75c":(i%3===1?"#f8a8af":c),alpha*.88);
   ctx.fillRect(-3*sz,-2*sz,7*sz,4*sz);ctx.restore();
  }else if(id==="petals"){
   ctx.save();ctx.translate(x,y);ctx.rotate(rate*1.1+i);
   ctx.fillStyle=rgba(c,alpha*.68);ctx.beginPath();ctx.ellipse(0,0,3.4*sz*basis/720,7*sz*basis/720,.25,0,Math.PI*2);ctx.fill();ctx.restore();
  }else if(id==="hearts"){
   heart(ctx,x,y,(5+13*d)*sz*basis/720,c,alpha*.7);
  }else if(id==="bubbles"){
   r=(3+19*d)*sz*basis/720;
   ctx.strokeStyle=rgba(c,alpha*.6);ctx.lineWidth=Math.max(.8,r*.09);
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
   dot(ctx,x-r*.33,y-r*.33,r*.13,"#ffffff",alpha*.65,false);
  }else if(id==="ash"){
   r=(.5+3*d)*sz*basis/720;
   dot(ctx,x,y,r,c,alpha*.45,false);
  }
 }
 ctx.restore();
}
global.PTSOverlays={PRESETS,getPreset,draw:particle};
})(window);
