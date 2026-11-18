// free-zik : suggestions YouTube + titres musicaux Apple, avec limite de durée.
const cache=new Map();
function clean(value){return String(value||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,150);}
async function fetchJson(url){
  const response=await fetch(url,{signal:AbortSignal.timeout(3200),headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('upstream');
  return response.json();
}
module.exports=async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Accept, Content-Type');
  if(req.method==='OPTIONS'){res.status(204).end();return;}
  if(req.method!=='GET'){res.status(405).json({items:[]});return;}
  const q=clean(Array.isArray(req.query?.q)?req.query.q[0]:req.query?.q);
  if(!q||q.length>90){res.status(400).json({items:[]});return;}
  res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=360');
  const key=q.toLocaleLowerCase('fr');
  const hit=cache.get(key);
  if(hit&&Date.now()-hit.at<120000){res.status(200).json({items:hit.items});return;}
  const youtube=new URL('https://suggestqueries.google.com/complete/search');
  for(const [k,v] of Object.entries({client:'firefox',ds:'yt',hl:'fr',gl:'FR',q}))youtube.searchParams.set(k,v);
  const apple=new URL('https://itunes.apple.com/search');
  for(const [k,v] of Object.entries({term:q,media:'music',entity:'song',country:'FR',limit:'10'}))apple.searchParams.set(k,v);
  const [yt,it]=await Promise.allSettled([fetchJson(youtube),fetchJson(apple)]);
  const songs=[],suggestions=[];
  if(yt.status==='fulfilled'&&Array.isArray(yt.value)&&Array.isArray(yt.value[1])){
    for(const str of yt.value[1].slice(0,10))if(typeof str==='string')suggestions.push({label:str,source:'Suggestion YouTube'});
  }
  if(it.status==='fulfilled'&&Array.isArray(it.value?.results)){
    for(const entry of it.value.results){
      if(!entry.artistName||!entry.trackName)continue;
      const label=clean(entry.artistName)+' — '+clean(entry.trackName);
      if([entry.artistName,entry.trackName,label].some(v=>String(v).toLocaleLowerCase('fr').includes(key))){
        songs.push({label,source:'Titre musical'});
      }
    }
  }
  const seen=new Set(),items=[];
  for(const candidate of [...suggestions.slice(0,5),...songs.slice(0,4),...suggestions.slice(5),...songs.slice(4)]){
    const label=clean(candidate.label),id=label.toLocaleLowerCase('fr');
    if(!label||seen.has(id))continue;
    seen.add(id);items.push({label,source:candidate.source});
    if(items.length>=12)break;
  }
  cache.set(key,{at:Date.now(),items});
  if(cache.size>150)cache.delete(cache.keys().next().value);
  res.status(200).json({items});
};
