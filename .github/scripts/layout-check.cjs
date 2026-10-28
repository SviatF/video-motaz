// Browser regression test for editor panels / timeline intersections.
// Runs only in GitHub Actions. No production dependency.
const {chromium} = require('playwright');
const {createServer} = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../dist');
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/creative-tools.js':'creative-tools.js','/emoji-catalog.js':'emoji-catalog.js','/creative-library-v2.js':'creative-library-v2.js','/fullscreen-overlays.js':'fullscreen-overlays.js','/styles.css':'styles.css'};
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server = createServer((request,response)=>{
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const file = files[pathname];
  if (!file) {response.writeHead(404);response.end();return;}
  const full = path.join(root,file);
  response.setHeader('Content-Type',types[path.extname(file)]);
  fs.createReadStream(full).pipe(response);
});
const cases=[
  {name:'desktop-reference',width:1728,height:896},
  {name:'small-desktop',width:1366,height:768},
  {name:'compact',width:1100,height:720},
  {name:'tablet',width:820,height:1000},
  {name:'phone',width:390,height:844},
  {name:'small-phone',width:320,height:680}
];
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const results=[];
  try{
    for(const size of cases){
      const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
      const pageErrors=[];
      page.on('pageerror',error=>pageErrors.push(error.message));
      await page.goto(address,{waitUntil:'load'});
      await page.waitForSelector('#screen');
      await page.waitForTimeout(150);
      const m=await page.evaluate(()=>{
        const box=id=>{const r=document.querySelector(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
        return {timeline:box('.timeline'),stage:box('.stage'),transport:box('.transport'),
          body:box('.stage-body'),frame:box('.canvas-frame'),
          library:box('.library'),inspector:box('.properties'),
          header:box('.topbar'),track:box('.timeline-grid'),lastTrack:box('.track-labels>div:last-child'),
          overflowX:document.documentElement.scrollWidth-innerWidth,
          viewportHeight:innerHeight,docHeight:document.documentElement.scrollHeight};
      });
      const issues=[];
      if(m.stage.bottom>m.timeline.top+2) issues.push('stage overlaps timeline');
      if(m.transport.bottom>m.timeline.top+2) issues.push('transport overlaps timeline');
      if(m.frame.top<m.body.top-2||m.frame.bottom>m.body.bottom+2) issues.push('preview frame outside stage');
      if(m.library.bottom>m.timeline.top+2) issues.push('library overlaps timeline');
      if(m.inspector.bottom>m.timeline.top+2) issues.push('inspector overlaps timeline');
      if(m.overflowX>3) issues.push('horizontal page overflow '+m.overflowX);
      if(m.track.height<174) issues.push('timeline content clipped '+m.track.height);
      if(m.lastTrack.bottom>m.track.bottom+2) issues.push('last track overlaps timeline footer');
      if(pageErrors.length) issues.push('page errors: '+pageErrors.join(' | '));
      // The core user flow should remain functional after styling changes.
      if(!await page.evaluate(()=>!!window.PTSCreative)) issues.push('creative engine not loaded');
      await page.click('#add-title');
      const title=await page.locator('#text-track .clip').count();
      if(title===0) issues.push('adding text layer failed');
      // Time-editing regression: drag the title along its track, then resize its right edge.
      if(size.name==='desktop-reference'){
        const titleClip=page.locator('#text-track .clip.title').first();
        const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).titles[0]);
        const titleBox=await titleClip.boundingBox();
        const fromX=titleBox.x+titleBox.width*.45,fromY=titleBox.y+titleBox.height/2;
        await page.mouse.move(fromX,fromY);await page.mouse.down();
        await page.mouse.move(fromX+95,fromY,{steps:7});await page.mouse.up();
        const moved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).titles[0]);
        if(!(moved.start>initial.start+.5)) issues.push('timeline drag did not move title: '+JSON.stringify({initial,moved}));
        const right=page.locator('#text-track .clip.title .clip-handle-right');
        const rb=await right.boundingBox(),rx=rb.x+rb.width/2,ry=rb.y+rb.height/2;
        await page.mouse.move(rx,ry);await page.mouse.down();
        await page.mouse.move(rx+90,ry,{steps:6});await page.mouse.up();
        const resized=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).titles[0]);
        if(!(resized.duration>moved.duration+.5))issues.push('timeline right trim failed: '+JSON.stringify({moved,resized}));
        if(!await page.locator('#selection-box').isVisible())issues.push('selected title lacks on-canvas overlay');
        // Verify Photoshop-style move and corner scale using real pointer gestures.
        const overlayBox=page.locator('#selection-box'),sel=await overlayBox.boundingBox();
        const sx=sel.x+sel.width*.5,sy=sel.y+sel.height*.5;
        await page.mouse.move(sx,sy);await page.mouse.down();
        await page.mouse.move(sx+40,sy+12,{steps:6});await page.mouse.up();
        const placed=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).titles[0]);
        if(!(placed.x>50))issues.push('canvas drag failed to move title: '+placed.x);
        const knob=page.locator('.resize-knob'),kb=await knob.boundingBox();
        await page.mouse.move(kb.x+kb.width/2,kb.y+kb.height/2);await page.mouse.down();
        await page.mouse.move(kb.x+kb.width/2+26,kb.y+kb.height/2+17,{steps:5});await page.mouse.up();
        const sized=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).titles[0]);
        if(!(sized.size>placed.size))issues.push('canvas resize failed to scale title: '+JSON.stringify({placed,sized}));
      }
      if(size.name==='desktop-reference'){
        const previewResolution=await page.$eval('#screen',cv=>[cv.width,cv.height]);
        if(previewResolution[0]!==1080||previewResolution[1]!==1920)issues.push('preview quality must default to 1080x1920: '+previewResolution);
        await page.locator('#export-btn').click();
        if(await page.locator('#export-quality').inputValue()!=='1080')issues.push('Full HD quality not selected by default');
        if(await page.locator('#export-resolution').textContent()!=='1080 × 1920')issues.push('Full HD output dimension not shown');
        if(!(await page.locator('#export-bitrate').textContent()).includes('16 Мбіт/с'))issues.push('Full HD bitrate not upgraded');
        await page.locator('#export-quality').selectOption('720');
        if(await page.locator('#export-resolution').textContent()!=='720 × 1280')issues.push('HD preset dimensions wrong');
        await page.locator('#export-quality').selectOption('1440');
        if(await page.locator('#export-resolution').textContent()!=='1440 × 2560')issues.push('2K dimensions wrong');
        await page.locator('#export-quality').selectOption('2160');
        if(await page.locator('#export-resolution').textContent()!=='2160 × 3840')issues.push('4K dimensions wrong');
        await page.locator('#cancel-export').click();
      }
      // Check the newly added creative controls on the wide desktop.
      if(size.name==='desktop-reference'){
        await page.locator('[data-workspace="creative"]').click();
        if(!(await page.locator('#creative-view').isVisible()))issues.push('creative workspace not displayed');
        await page.locator('#library-expand').click();
        const wide=await page.evaluate(()=>({
          width:document.querySelector('.library').getBoundingClientRect().width,
          bottom:document.querySelector('.library').getBoundingClientRect().bottom,
          timelineTop:document.querySelector('.timeline').getBoundingClientRect().top,
          pageOverflow:document.documentElement.scrollWidth-innerWidth
        }));
        if(wide.width<500)issues.push('expanded creative library too narrow');
        if(wide.bottom>wide.timelineTop+2)issues.push('expanded library overlaps timeline');
        if(wide.pageOverflow>3)issues.push('expanded creative library has horizontal overflow');
        await page.locator('#library-expand').click();
        await page.locator('[data-emoji-category="Smileys & Emotion"]').click();
        if(await page.locator('.emoji-item').count()<40)issues.push('emoji category filter failed');
        await page.locator('[data-emoji-category="all"]').click();
        const packs=await page.evaluate(()=>({music:window.PTSCreative?.MUSIC?.length,sfx:window.PTSCreative?.SFX?.length,motions:window.PTSCreative?.MOTION_PRESETS?.length}));
        if(packs.music!==36||packs.sfx!==12||packs.motions!==28)issues.push('creative catalog counts incorrect: '+JSON.stringify(packs));
        const count=await page.evaluate(()=>window.PTSEmojis?.count);
        if(count!==3963)issues.push('emoji catalog count incorrect: '+count);
        if(await page.locator('.emoji-item').count()<60)issues.push('emoji grid did not render initial page');
        await page.locator('#asset-search').fill('heart');
        if(await page.locator('.emoji-item').count()<5)issues.push('search for hearts returned too few results');
        await page.locator('.emoji-item').first().click();
        if(await page.locator('#fx-track .clip.sticker').count()!==1)issues.push('emoji sticker not added to FX track');
        if(await page.locator('#prop-emoji').count()!==1)issues.push('emoji inspector missing');
        await page.locator('#prop-animation').selectOption('heartbeat');
        await page.locator('#prop-speed').fill('1.75');
        await page.locator('#prop-speed').dispatchEvent('change');
        const afterMotion=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')||'{}').stickers||[]);
        if(afterMotion[0]?.animation!=='heartbeat'||afterMotion[0]?.speed!==1.75)issues.push('emoji animation settings not persisted');
        if(!await page.locator('#selection-box').isVisible())issues.push('emoji lacks on-canvas control');
        // One-click extend to the full composition.
        await page.locator('#fill-timeline').click();
        const emojiFull=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).stickers[0]);
        if(emojiFull.duration<7.9||emojiFull.start!==0)issues.push('emoji full timeline stretch failed');
        await page.locator('#asset-search').fill('');
        await page.locator('[data-library-tab="stickers"]').click();
        await page.locator('[data-sticker="sale"]').click();
        if(await page.locator('#fx-track .clip.sticker').count()!==2)issues.push('sticker not added to FX track');
        if(await page.locator('#prop-scale').count()!==1)issues.push('sticker inspector controls missing');
        await page.locator('[data-library-tab="motions"]').click();
        await page.locator('[data-motion="bounce"]').click();
        if(await page.locator('#fx-track .clip.sticker').count()!==3)issues.push('motion preset did not add a sticker');
        await page.locator('[data-library-tab="effects"]').click();
        await page.locator('[data-effect="flash"]').click();
        if(await page.locator('#fx-track .clip.effect').count()!==1)issues.push('FX not added to timeline');
        if(await page.locator('#prop-intensity').count()!==1)issues.push('FX intensity controls missing');
        // Full-screen overlays: separate lane, live canvas pixel changes, timing, persistence.
        await page.locator('[data-library-tab="overlays"]').click();
        if(await page.locator('[data-overlay]').count()!==16)issues.push('full frame overlay catalog must have 16 presets');
        await page.locator('[data-overlay="snow"]').click();
        if(await page.locator('#overlay-track .clip.overlay').count()!==1)issues.push('snow overlay missing from dedicated track');
        if(await page.locator('#prop-density').count()!==1)issues.push('overlay inspector missing intensity');
        await page.locator('#prop-density').fill('110');
        await page.locator('#prop-density').dispatchEvent('change');
        await page.locator('#prop-overlay-speed').fill('2');
        await page.locator('#prop-overlay-speed').dispatchEvent('change');
        const snowState=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).overlays?.[0]);
        if(snowState?.intensity!==110||snowState?.speed!==2)issues.push('overlay controls not persisted');
        const overlayPixels=await page.evaluate(()=>{
          const cv=document.querySelector('#screen');
          const sample=()=>Array.from(cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data).reduce((sum,n,i)=>sum+(i%4===3?0:n),0);
          const first=sample(),w=cv.width,h=cv.height;
          // Do not modify project: draw an overlay directly at two times on a temporary test canvas.
          const t=document.createElement('canvas');t.width=w;t.height=h;
          const c=t.getContext('2d');
          c.fillStyle='#090a0d';c.fillRect(0,0,w,h);
          const a=Array.from(c.getImageData(0,0,w,h).data).reduce((n,x,i)=>n+(i%4===3?0:x),0);
          window.PTSOverlays.draw(c,w,h,{overlay:'snow',start:0,duration:8,intensity:100,opacity:90,size:100,speed:1,seed:17},2);
          const b=Array.from(c.getImageData(0,0,w,h).data).reduce((n,x,i)=>n+(i%4===3?0:x),0);
          return {a,b,first};
        });
        if(!(overlayPixels.b>overlayPixels.a))issues.push('snow overlay did not draw visible pixels: '+JSON.stringify(overlayPixels));
        const coverage=await page.evaluate(()=>{
          const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;
          const ctx=canvas.getContext('2d',{willReadFrequently:true});
          const kinds=['snow','snowstorm','fire','embers','rain','fog','lightleak','sparkles','confetti','hearts'];
          return kinds.map(kind=>{
            ctx.fillStyle='#090a0d';ctx.fillRect(0,0,720,1280);
            window.PTSOverlays.draw(ctx,720,1280,{overlay:kind,start:0,duration:8,intensity:110,opacity:100,size:130,speed:1,seed:37},2.35);
            function signal(y){
              const image=ctx.getImageData(0,y,720,Math.floor(1280*.2)).data;let total=0;
              for(let i=0;i<image.length;i+=16){total+=image[i]+image[i+1]+image[i+2]-32;}
              return Math.round(total);
            }
            return {kind,top:signal(0),bottom:signal(1024)};
          });
        });
        for(const x of coverage)if(x.top<100||x.bottom<100)issues.push('incomplete VFX frame coverage: '+JSON.stringify(x));

        await page.locator('#fill-timeline').click();
        const fullSnow=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')).overlays[0]);
        if(fullSnow.start!==0||fullSnow.duration<7.9)issues.push('snow overlay cannot fill composition');
        await page.locator('#asset-search').fill('fire');
        if(await page.locator('[data-overlay]').count()<2)issues.push('fire overlay search failed');
        await page.locator('[data-overlay="fire"]').click();
        if(await page.locator('#overlay-track .clip.overlay').count()!==2)issues.push('fire overlay missing from track');
        if(await page.locator('[data-select-overlay]').count()!==2)issues.push('overlay stack does not expose overlapping layers');
        await page.locator('[data-select-overlay]').first().click();
        if(await page.locator('#prop-overlay-speed').inputValue()!=='2')issues.push('cannot select snow under fire in inspector');

        // Music must be accessible even when the previous category was filtered.
        await page.locator('#asset-search').fill('fire');
        await page.locator('[data-library-tab="music"]').click();
        if(await page.locator('#asset-search').inputValue()!=='')issues.push('music inherited old VFX search filter');
        if(!await page.locator('[data-library-tab="music"]').isVisible())issues.push('music tab hidden');
        if(!await page.locator('[data-library-tab="sfx"]').isVisible())issues.push('sound effects tab hidden');
        if(await page.locator('[data-music]').count()!==36)issues.push('36 music tracks are not visible');
        if(await page.locator('[data-sfx]').count()!==0)issues.push('sound effects still mixed into music');
        await page.locator('[data-music="pulse"]').click();
        try{await page.waitForFunction(()=>document.querySelectorAll('#audio-track .clip').length>0,{timeout:15000});}
        catch(e){issues.push('music was not imported to audio track: '+e.message);}
        await page.locator('[data-library-tab="sfx"]').click();
        if(await page.locator('[data-sfx]').count()!==12)issues.push('sound effects category should have 12 entries');
        if(await page.locator('[data-music]').count()!==0)issues.push('music mixed into sound effects');
        await page.locator('[data-sfx="impact"]').click();
        try{await page.waitForFunction(()=>document.querySelectorAll('#audio-track .clip').length>=2,{timeout:15000});}
        catch(e){issues.push('SFX not added to audio track: '+e.message);}
        const validWave=await page.evaluate(async()=>{
          const f=await window.PTSCreative.musicFile('phonk'),b=new Uint8Array(await f.arrayBuffer());
          const fx=await window.PTSCreative.sfxFile('impact'),c=new Uint8Array(await fx.arrayBuffer());
          return String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...c.slice(0,4))==='RIFF'&&b.length>60000&&c.length>1000;
        });
        if(!validWave)issues.push('music or SFX WAV generator invalid');
        const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')||'{}'));
        if(stored.stickers?.length!==3||!stored.effects?.length||!stored.audios?.length)issues.push('new layers not persisted');
        await page.reload({waitUntil:'load'});
        await page.waitForTimeout(250);
        if(await page.locator('#fx-track .clip.sticker').count()!==3)issues.push('sticker lost after reload');
        if(await page.locator('#fx-track .clip.effect').count()!==1)issues.push('FX lost after reload');
        if(await page.locator('#audio-track .clip').count()!==2)issues.push('music or SFX lost after reload');
      }
      await page.screenshot({path:path.resolve(__dirname,'../../layout-'+size.name+'.png')});
      console.log(size.name,JSON.stringify({stage:m.stage,transport:m.transport,timeline:m.timeline,overflowX:m.overflowX,errors:issues}));
      results.push({size:size.name,issues});
      await page.close();
    }

    // End-to-end recording smoke test using an original synthetic 1.3s title.
    // Confirms that high-quality export generates a playable file without
    // uploading media or relying on paid transcoding services.
    const qualityPage=await browser.newPage({viewport:{width:1280,height:800},acceptDownloads:true});
    await qualityPage.goto(address);
    await qualityPage.evaluate(()=>{
      const project={
        version:1,name:'Quality-QA',ratio:'9:16',media:[],clips:[],
        titles:[{id:'test-title',text:'PTS EXPORT QUALITY',start:0,duration:1.3,animation:'none',size:6,x:50,y:45,rotation:0}],
        captions:[],audios:[],stickers:[],effects:[],overlays:[],exportQuality:'1080'
      };
      localStorage.setItem('pts-creative-project-v1',JSON.stringify(project));
    });
    await qualityPage.reload({waitUntil:'load'});
    await qualityPage.locator('#export-btn').click();
    await qualityPage.locator('#export-quality').selectOption('1080');
    const outputPromise=qualityPage.waitForEvent('download',{timeout:25000});
    await qualityPage.locator('#start-export').click();
    const output=await outputPromise;
    const savedPath=await output.path();
    const fileBytes=fs.statSync(savedPath).size;
    if(fileBytes<3000) throw Error('Full HD video export too small: '+fileBytes);
    // Optional ffprobe verification when hosted runner has FFmpeg installed.
    const {spawnSync}=require('node:child_process');
    const probe=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',savedPath],{encoding:'utf8'});
    if(probe.status===0){
      const dim=probe.stdout.trim();
      if(dim!=='1080,1920')throw Error('Full HD recorded dimensions unexpected: '+dim);
      console.log('Full HD output dimensions verified:',dim);
    }else console.log('ffprobe unavailable; checked successful download size and export settings.');
    const reset=await qualityPage.$eval('#screen',c=>[c.width,c.height]);
    if(reset[0]!==1080||reset[1]!==1920)throw Error('Preview dimensions not restored after export: '+reset);
    console.log('Full HD export smoke PASS: '+fileBytes+' bytes, '+output.suggestedFilename());
    await qualityPage.close();
  }finally{await browser.close();server.close();}
  const failures=results.filter(r=>r.issues.length);
  if(failures.length) throw Error('Layout regressions: '+JSON.stringify(failures));
  console.log('PASS: all viewport layouts have non-overlapping panels, and adding text works.');
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
