/* Real-browser smoke tests for free-zik public production.
   Tests deliberately fail if music search silently breaks. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const BASE=(process.env.BASE_URL||'https://free-zik-creatix5.vercel.app').replace(/\/+$/,'');
const out=path.join(__dirname,'screenshots');
fs.mkdirSync(out,{recursive:true});
const checks=[];
function log(name,ok,detail){const x={name,ok,detail:String(detail||'')};checks.push(x);console.log((ok?'PASS':'FAIL')+' '+name+(x.detail?' — '+x.detail:''));}
async function run(name,fn){try{await fn();log(name,true);}catch(e){log(name,false,e.message);}}
async function apiTest(name,pathname,validate){
 await run(name,async()=>{
  const r=await fetch(BASE+pathname,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  const body=await r.text();
  if(!r.ok)throw Error('HTTP '+r.status+' '+body.slice(0,350));
  let j;try{j=JSON.parse(body);}catch(e){throw Error('Not JSON: '+body.slice(0,170));}
  validate(j);
 });
}
async function navigate(page,target){
 const res=await page.goto(BASE+target,{waitUntil:'domcontentloaded',timeout:25000});
 if(!res || !res.ok()) throw Error('HTTP '+(res?.status()||'none')+' for '+target);
}
(async()=>{
 await apiTest('Recherche API retourne des vidéos (/api/search?q=stromae)','/api/search?q=stromae',j=>assert.ok(Array.isArray(j.items)&&j.items.some(x=>x.id&&x.title),'No usable YouTube video results'));
 await apiTest('Suggestions API (/api/suggest?q=str)','/api/suggest?q=str',j=>assert.ok(Array.isArray(j.items)&&j.items.length,'No autocomplete suggestions'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  await run('Version mobile ouvre son interface',async()=>{
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1,hasTouch:true});
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await navigate(page,'/');
    await page.locator('#search-input').waitFor({state:'visible',timeout:12000});
    assert.match(await page.title(),/free-zik/i);
    await page.screenshot({path:path.join(out,'mobile-home.png'),fullPage:true});
    if(errors.length)throw Error('Page errors '+errors.join('; '));
   }finally{await ctx.close();}
  });
  await run('Version mobile lit URL individuelle dans le lecteur',async()=>{
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await navigate(page,'/');
    await page.locator('#search-input').fill('https://www.youtube.com/watch?v=M7lc1UVf-VE');
    await page.locator('#search-form button[type=submit]').click();
    await page.locator('#lecteur').waitFor({state:'visible',timeout:12000});
    const src=await page.locator('#video-frame').getAttribute('src');
    assert.ok(src&&src.includes('yout-ube.com/watch?v=M7lc1UVf-VE'),'Unexpected primary iframe: '+src);
    await page.screenshot({path:path.join(out,'mobile-player.png'),fullPage:true});
    if(errors.length)throw Error('Page errors '+errors.join('; '));
   }finally{await ctx.close();}
  });
  await run('Interface Samsung Tizen : télécommande et lecteur',async()=>{
   const ctx=await browser.newContext({viewport:{width:1920,height:1080},userAgent:'Mozilla/5.0 (SMART-TV; LINUX; Tizen 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'});
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await navigate(page,'/tv.html');
    await page.locator('#home-btn').waitFor({state:'visible',timeout:12000});
    await page.locator('#compat-btn').click();
    await page.locator('#compat-panel').waitFor({state:'visible',timeout:6000});
    await page.locator('#close-compat').click();
    await page.locator('#query').fill('https://www.youtube.com/watch?v=M7lc1UVf-VE');
    await page.locator('#search-form button[type=submit]').click();
    await page.locator('#player-panel').waitFor({state:'visible',timeout:10000});
    const src=await page.locator('#video-frame').getAttribute('src');
    assert.ok(src&&/youtube-nocookie\.com\/embed\/M7lc1UVf-VE/.test(src),'Wrong TV iframe: '+src);
    await page.screenshot({path:path.join(out,'tizen-player.png'),fullPage:true});
    if(errors.length)throw Error('JS page errors: '+errors.join('; '));
   }finally{await ctx.close();}
  });
  await run('Recherche TV fournit des cartes musicales',async()=>{
   const ctx=await browser.newContext({viewport:{width:1920,height:1080},userAgent:'Mozilla/5.0 (SMART-TV; LINUX; Tizen 10.0) AppleWebKit/537.36 Chrome/130 Safari/537.36'});
   const page=await ctx.newPage();
   try{
    await navigate(page,'/tv.html');
    await page.locator('#query').fill('stromae');
    await page.locator('#search-form button[type=submit]').click();
    try{await page.locator('.video-card').first().waitFor({state:'visible',timeout:22000});}
    finally{await page.screenshot({path:path.join(out,'tizen-search.png'),fullPage:true});}
    assert.ok(await page.locator('.video-card').count()>0,'No cards displayed after search');
   }finally{await ctx.close();}
  });
 } finally {await browser.close();}
 const failed=checks.filter(c=>!c.ok);
 console.log('=== RESULTS '+(checks.length-failed.length)+'/'+checks.length+' succeeded ===');
 if(failed.length)process.exitCode=1;
})().catch(e=>{console.error('SMOKE TEST INFRA FAILURE',e);process.exitCode=1;});
