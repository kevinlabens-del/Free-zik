/* Online provider diagnostics: run on GitHub runner with live network. */
const providers=[
 ["inv.nadeko.net","https://inv.nadeko.net/api/v1/search?q=stromae&type=video"],
 ["invidious.nerdvpn.de","https://invidious.nerdvpn.de/api/v1/search?q=stromae&type=video"],
 ["yt.chocolatemoo53.com","https://yt.chocolatemoo53.com/api/v1/search?q=stromae&type=video"],
 ["yewtu.be","https://yewtu.be/api/v1/search?q=stromae&type=video"],
 ["iv.highda.space","https://iv.highda.space/api/v1/search?q=stromae&type=video"],
 ["invidious.tiekoetter.com","https://invidious.tiekoetter.com/api/v1/search?q=stromae&type=video"],
 ["pipedapi.kavin.rocks","https://pipedapi.kavin.rocks/search?q=stromae&filter=videos"],
 ["pipedapi.adminforge.de","https://pipedapi.adminforge.de/search?q=stromae&filter=videos"],
 ["pipedapi.r4fo.com","https://pipedapi.r4fo.com/search?q=stromae&filter=videos"],
 ["youtube.com html","https://www.youtube.com/results?search_query=stromae"],
 ["music.youtube.com html","https://music.youtube.com/search?q=stromae"],
 ["bing RSS","https://www.bing.com/search?format=rss&q=site%3Ayoutube.com%2Fwatch%20stromae"],
 ["Google suggestion","https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=stromae"],
 ["Apple iTunes music","https://itunes.apple.com/search?term=stromae&entity=song&country=FR&limit=10"]
];
const results=await Promise.all(providers.map(async([name,url])=>{
 try {
  const r=await fetch(url,{signal:AbortSignal.timeout(9000),headers:{"user-agent":"Mozilla/5.0 (compatible; free-zik-availability-check/1.0)","accept":"application/json,text/html,application/rss+xml"}});
  const body=await r.text();
  let count=0,hasVideoID=false;
  try { const j=JSON.parse(body);const list=Array.isArray(j)?j:Array.isArray(j.items)?j.items:Array.isArray(j.results)?j.results:null;count=list?.length||0;hasVideoID=JSON.stringify(j).includes('"videoId"')||JSON.stringify(j).includes('"url":"/watch');}
  catch {hasVideoID=/videoRenderer|watch\?v=|\/watch\//.test(body);count=(body.match(/videoRenderer/g)||[]).length;}
  return {name,status:r.status,bytes:body.length,count,hasVideoID,sample:body.slice(0,65).replace(/\s+/g," ")};
 }catch(e){return {name,error:String(e).slice(0,110)};}
}));
for(const r of results)console.log("PROVIDER "+JSON.stringify(r));
console.log("HEALTHY "+JSON.stringify(results.filter(x=>x.status===200&&x.hasVideoID).map(x=>x.name)));
