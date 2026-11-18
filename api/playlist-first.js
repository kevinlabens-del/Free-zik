// Resolve a video ID from a public YouTube playlist. This returns metadata only, never media streams.
const VALID_LIST=/^[A-Za-z0-9_-]{8,160}$/;
const VALID_VIDEO=/^[A-Za-z0-9_-]{11}$/;
const SOURCES=[
 ['invidious','https://inv.nadeko.net'],
 ['invidious','https://invidious.nerdvpn.de'],
 ['invidious','https://yt.chocolatemoo53.com'],
 ['piped','https://pipedapi.kavin.rocks']
];
const memo=new Map();
function identify(item){
 const id=item?.videoId || (typeof item?.url==='string'?new URL(item.url,'https://www.youtube.com').searchParams.get('v'):null);
 return VALID_VIDEO.test(id||'') ? {videoId:id,title:String(item?.title||'').slice(0,160)} : null;
}
async function loadPlaylist(type,host,list){
 const endpoint=type==='invidious'
    ?host+'/api/v1/playlists/'+encodeURIComponent(list)
    :host+'/playlists/'+encodeURIComponent(list);
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),4700);
 try{
   const response=await fetch(endpoint,{signal:ctrl.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('unavailable');
   const data=await response.json();
   const entries=type==='invidious'?data?.videos:data?.relatedStreams;
   if(!Array.isArray(entries))throw Error('bad payload');
   for(const entry of entries){const video=identify(entry);if(video)return video;}
   throw Error('empty playlist');
 } finally {clearTimeout(timer);}
}
module.exports=async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
 if(req.method==='OPTIONS'){res.status(204).end();return;}
 if(req.method!=='GET'){res.status(405).json({error:'Method not allowed'});return;}
 const list=Array.isArray(req.query?.list)?req.query.list[0]:req.query?.list;
 if(typeof list!=='string'||!VALID_LIST.test(list)){res.status(400).json({error:'Invalid playlist'});return;}
 res.setHeader('Cache-Control','public, s-maxage=90, stale-while-revalidate=600');
 const existing=memo.get(list);
 if(existing&&Date.now()-existing.at<180000){res.status(200).json(existing.value);return;}
 try{
  const data=await Promise.any(SOURCES.map(([type,host])=>loadPlaylist(type,host,list)));
  memo.set(list,{value:data,at:Date.now()});
  if(memo.size>80)memo.delete(memo.keys().next().value);
  res.status(200).json(data);
 }catch{res.status(502).json({error:'Unable to resolve a public video from this playlist'});}
};
