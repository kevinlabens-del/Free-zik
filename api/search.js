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
  const items=await Promise.any(targets.map(([kind,host])=>attempt(kind,host,q)));
  cache.set(key,{at:Date.now(),items});if(cache.size>60)cache.delete(cache.keys().next().value);
  res.status(200).json({items});
 }catch{res.status(503).json({items:[],message:'Le service public de recherche est temporairement indisponible.'});}
};