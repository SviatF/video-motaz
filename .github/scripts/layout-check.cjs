// Browser regression test for editor panels / timeline intersections.
// Runs only in GitHub Actions. No production dependency.
const {chromium} = require('playwright');
const {createServer} = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../dist');
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/creative-tools.js':'creative-tools.js','/emoji-catalog.js':'emoji-catalog.js','/creative-library-v2.js':'creative-library-v2.js','/styles.css':'styles.css'};
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
      // Check the newly added creative controls on the wide desktop.
      if(size.name==='desktop-reference'){
        await page.locator('[data-workspace="creative"]').click();
        if(!(await page.locator('#creative-view').isVisible()))issues.push('creative workspace not displayed');
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
        await page.locator('[data-library-tab="music"]').click();
        await page.locator('[data-music="pulse"]').click();
        try{await page.waitForFunction(()=>document.querySelectorAll('#audio-track .clip').length>0,{timeout:15000});}
        catch(e){issues.push('music was not imported to audio track: '+e.message);}
        const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('pts-creative-project-v1')||'{}'));
        if(stored.stickers?.length!==3||!stored.effects?.length||!stored.audios?.length)issues.push('new layers not persisted');
        await page.reload({waitUntil:'load'});
        await page.waitForTimeout(250);
        if(await page.locator('#fx-track .clip.sticker').count()!==3)issues.push('sticker lost after reload');
        if(await page.locator('#fx-track .clip.effect').count()!==1)issues.push('FX lost after reload');
        if(await page.locator('#audio-track .clip').count()!==1)issues.push('music lost after reload');
      }
      await page.screenshot({path:path.resolve(__dirname,'../../layout-'+size.name+'.png')});
      console.log(size.name,JSON.stringify({stage:m.stage,transport:m.transport,timeline:m.timeline,overflowX:m.overflowX,errors:issues}));
      results.push({size:size.name,issues});
      await page.close();
    }
  }finally{await browser.close();server.close();}
  const failures=results.filter(r=>r.issues.length);
  if(failures.length) throw Error('Layout regressions: '+JSON.stringify(failures));
  console.log('PASS: all viewport layouts have non-overlapping panels, and adding text works.');
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
