// Music-video discovery via public Invidious / Piped instances; metadata only.
const targets=[
 ['inv','https://inv.nadeko.net'],
 ['inv','https://invidious.nerdvpn.de'],
 ['inv','https://yt.chocolatemoo53.com'],
 ['inv','https://yewtu.be'],
 ['pipe','https://pipedapi.kavin.rocks']
];
const VID=/^[A-Za-z0-9_-]{11}$/;
const cache=new Map();
// Keyless public-video search from YouTube's own rendered search HTML.
// This is unofficial and may stop working if YouTube changes or blocks the page.
function youtubeText(data){
 if(!data)return '';
 if(typeof data.simpleText==='string')return data.simpleText;
 return Array.isArray(data.runs)?data.runs.map(x=>x.text||'').join(''):'';
}
function initialData(html){
 const patterns=[/var\s+ytInitialData\s*=\s*/g,/window\[\s*["']ytInitialData["']\s*\]\s*=\s*/g,/ytInitialData\s*=\s*/g];
 for(const re of patterns){
  re.lastIndex=0;const matched=re.exec(html);if(!matched)continue;
  const start=html.indexOf('{',matched.index+matched[0].length);
  if(start<0||start-matched.index>100)continue;
  let depth=0,inside=false,escape=false;
  for(let i=start;i<html.length&&i<start+3500000;i++){
   const ch=html[i];
   if(inside){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')inside=false;}
   else if(ch==='"')inside=true;
   else if(ch==='{')depth++;
   else if(ch==='}' && --depth===0){try{return JSON.parse(html.slice(start,i+1));}catch{break;}}
  }
 }
 throw Error('Could not parse YouTube results');
}
function videoItems(data){
 const out=[],seen=new Set(),stack=[data];
 let scans=0;
 while(stack.length&&out.length<24&&scans++<150000){
  const value=stack.pop();
  if(!value||typeof value!=='object')continue;
  const r=value.videoRenderer||null;
  if(r&&VID.test(r.videoId||'')&&!seen.has(r.videoId)){
   seen.add(r.videoId);
   const title=youtubeText(r.title).slice(0,170)||'Vidéo YouTube';
   const author=youtubeText(r.ownerText||r.longBylineText||r.shortBylineText).slice(0,100);
   const thumbs=r.thumbnail?.thumbnails||[];
   const preferred=thumbs[thumbs.length-1]?.url||'';
   const thumb=/^https:\/\/(?:i\.ytimg\.com|img\.youtube\.com)\//i.test(preferred)?preferred:'https://i.ytimg.com/vi/'+r.videoId+'/mqdefault.jpg';
   out.push({id:r.videoId,title,author,thumb});
  }
  if(Array.isArray(value)){for(let i=value.length-1;i>=0;i--)stack.push(value[i]);}
  else for(const k of Object.keys(value)){const v=value[k];if(v&&typeof v==='object')stack.push(v);}
 }
 if(!out.length)throw Error('No videoRenderer entries found');
 return out;
}
async function youtubeSearch(q){
 const url=new URL('https://www.youtube.com/results');
 url.searchParams.set('search_query',q);url.searchParams.set('hl','fr');url.searchParams.set('gl','FR');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9500);
 try{
  const r=await fetch(url.toString(),{signal:controller.signal,headers:{
   Accept:'text/html,application/xhtml+xml',
   'Accept-Language':'fr-FR,fr;q=0.9',
   'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  }});
  if(!r.ok)throw Error('YouTube HTTP '+r.status);
  const body=await r.text();
  if(body.length>4500000)throw Error('Excessive page size');
  return videoItems(initialData(body));
 }finally{clearTimeout(timer);}
}

async function attempt(kind,base,q){
 const u=new URL(kind==='inv'?'/api/v1/search':'/search',base);
 u.searchParams.set('q',q);
 if(kind==='inv'){u.searchParams.set('type','video');u.searchParams.set('page','1');u.searchParams.set('region','FR');}
 else u.searchParams.set('filter','videos');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5500);
 try{
  const r=await fetch(u.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('remote '+r.status);
  const data=await r.json(),rows=kind==='inv'?data:data?.items;
  if(!Array.isArray(rows))throw Error('invalid source');
  const items=rows.map(x=>{
   let id=x.videoId||'';
   if(!id&&x.url){const m=String(x.url).match(/(?:[?&]v=|\/watch\/)([A-Za-z0-9_-]{11})/);if(m)id=m[1];}
   if(!VID.test(id))return null;
   let thumb=kind==='inv'?(x.videoThumbnails||[]).find(t=>t.quality==='medium')?.url||'':x.thumbnail||'';
   if(!/^https:\/\//.test(thumb))thumb='https://i.ytimg.com/vi/'+id+'/mqdefault.jpg';
   return {id,title:String(x.title||'Vidéo').slice(0,170),author:String(x.author||x.uploaderName||'').slice(0,100),thumb};
  }).filter(Boolean).slice(0,20);
  if(!items.length)throw Error('empty results');
  return items;
 }finally{clearTimeout(timer);}
}
module.exports=async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Cache-Control','public, s-maxage=90, stale-while-revalidate=300');
 if(req.method!=='GET'){res.status(405).json({items:[]});return;}
 let q=Array.isArray(req.query?.q)?req.query.q[0]:req.query?.q;
 if(typeof q!=='string'||q.trim().length<1||q.length>95){res.status(400).json({items:[]});return;}
 q=q.trim();const key=q.toLowerCase();
 if(cache.has(key)&&Date.now()-cache.get(key).at<120000){res.status(200).json({items:cache.get(key).items});return;}
 try{
  const items=await Promise.any([youtubeSearch(q),...targets.map(([kind,host])=>attempt(kind,host,q))]);
  cache.set(key,{at:Date.now(),items});if(cache.size>60)cache.delete(cache.keys().next().value);
  res.status(200).json({items});
 }catch{res.status(503).json({items:[],message:'Le service public de recherche est temporairement indisponible.'});}
};
module.exports.parseYoutubeResults=function(html){return videoItems(initialData(html));};
