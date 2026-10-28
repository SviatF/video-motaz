// Browser regression test for editor panels / timeline intersections.
// Runs only in GitHub Actions. No production dependency.
const {chromium} = require('playwright');
const {createServer} = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../dist');
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css'};
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
          header:box('.topbar'),track:box('.timeline-grid'),
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
      if(m.track.height<110) issues.push('timeline content clipped '+m.track.height);
      if(pageErrors.length) issues.push('page errors: '+pageErrors.join(' | '));
      // The core user flow should remain functional after styling changes.
      await page.click('#add-title');
      const title=await page.locator('#text-track .clip').count();
      if(title===0) issues.push('adding text layer failed');
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
