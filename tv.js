(function(){
'use strict';
var $=function(s){return document.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
var state={view:'home',current:null,results:[],history:[],favorites:[],loop:false,playerHost:'nocookie',seq:0};
try{state.history=JSON.parse(localStorage.getItem('free-zik.tv.history')||'[]')||[];state.favorites=JSON.parse(localStorage.getItem('free-zik.tv.favorites')||'[]')||[];}catch(e){}
function save(){try{localStorage.setItem('free-zik.tv.history',JSON.stringify(state.history));localStorage.setItem('free-zik.tv.favorites',JSON.stringify(state.favorites));}catch(e){}}
function say(t){$('#player-status').textContent=t;}
function setResults(items,title){
 state.results=items;
 $('#list-title').textContent=title;
 $('#result-count').textContent=items.length?String(items.length)+' résultat(s)':'';
 var box=$('#cards');box.innerHTML='';
 if(!items.length){var none=document.createElement('div');none.className='empty';none.textContent='Aucun résultat disponible. Essaie une autre recherche ou colle un lien YouTube.';box.appendChild(none);return;}
 items.forEach(function(item){
  var btn=document.createElement('button');btn.type='button';btn.className='video-card';btn.setAttribute('aria-label','Lire '+item.title);
  var img=document.createElement('img');img.loading='lazy';img.alt='';img.referrerPolicy='no-referrer';
  img.src=item.thumb||('https://i.ytimg.com/vi/'+encodeURIComponent(item.id)+'/mqdefault.jpg');
  var ttl=document.createElement('span');ttl.className='title';ttl.textContent=item.title||'Vidéo musicale';
  var sub=document.createElement('span');sub.className='artist';sub.textContent=item.author||'Vidéo';
  btn.appendChild(img);btn.appendChild(ttl);btn.appendChild(sub);
  btn.addEventListener('click',function(){play(item);});box.appendChild(btn);
 });
}
function selectNav(section){$$('.navbtn').forEach(function(btn){btn.classList.toggle('active',btn.id===section);});}
function beginSearch(q){
 q=String(q||'').trim();if(!q)return;
 $('#query').value=q;$('#suggestions').hidden=true;
 var yt=parseYoutube(q);
 if(yt){if(yt.id)play({id:yt.id,list:yt.list,title:'Vidéo YouTube',author:'Lien partagé'});else resolvePlaylist(yt.list);return;}
 selectNav('home-btn');$('#list-title').textContent='Recherche : '+q;$('#result-count').textContent='';$('#cards').innerHTML='<div class="empty">Recherche de musiques en cours…</div>';
 var seq=++state.seq;
 fetch('./api/search?q='+encodeURIComponent(q),{headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw Error('recherche indisponible');return r.json();}).then(function(d){
  if(seq!==state.seq)return;setResults(d.items||[], 'Résultats pour « '+q+' »');
 }).catch(function(){
  if(seq!==state.seq)return;
  $('#list-title').textContent='Recherche indisponible';
  $('#cards').innerHTML='<div class="empty">La recherche publique de vidéos est momentanément indisponible. Tu peux toujours coller un lien YouTube direct.</div>';
 });
 $('#results-section').scrollIntoView({behavior:'smooth',block:'start'});
}
function parseYoutube(value){
 try {
  var url=new URL(String(value).trim());var host=url.hostname.toLowerCase();
  if(!(/^(www\.|m\.|music\.)?(youtube\.com|yout-ube\.com)$/.test(host)||host==='youtu.be'))return null;
  var p=url.pathname.split('/').filter(Boolean),id=url.searchParams.get('v')||'';
  if(host==='youtu.be')id=p[0]||'';
  if(p[0]==='shorts'||p[0]==='live'||p[0]==='embed')id=p[1]||'';
  var list=url.searchParams.get('list')||'';
  if(!/^[A-Za-z0-9_-]{11}$/.test(id))id='';
  if(!/^[A-Za-z0-9_-]{8,160}$/.test(list))list='';
  return id||list?{id:id,list:list}:null;
 }catch(e){return null;}
}
function resolvePlaylist(list){
 $('#results-section').scrollIntoView({behavior:'smooth',block:'start'});
 $('#list-title').textContent='Ouverture de la playlist';
 $('#cards').innerHTML='<div class="empty">Recherche de la première vidéo…</div>';
 fetch('./api/playlist-first?list='+encodeURIComponent(list)).then(function(r){if(!r.ok)throw Error('playlist inaccessible');return r.json();}).then(function(d){
  if(!/^[A-Za-z0-9_-]{11}$/.test(d.videoId||''))throw Error('vidéo introuvable');
  play({id:d.videoId,list:list,title:d.title||'Playlist YouTube',author:'Playlist'});
 }).catch(function(){$('#cards').innerHTML='<div class="empty">Impossible de lire cette playlist directement. Ouvre une vidéo de la playlist et colle son lien /watch?v=…</div>';});
}
function ytEmbed(item){
 var host=state.playerHost==='standard'?'www.youtube.com':'www.youtube-nocookie.com';
 var url='https://'+host+'/embed/'+encodeURIComponent(item.id);
 var p=['autoplay=1','controls=1','rel=0','playsinline=1'];
 if(item.list)p.push('list='+encodeURIComponent(item.list));
 if(state.loop){p.push('loop=1');if(!item.list)p.push('playlist='+encodeURIComponent(item.id));}
 return url+'?'+p.join('&');
}
function play(item){
 if(!item||!/^[A-Za-z0-9_-]{11}$/.test(item.id||''))return;
 state.current=item;
 state.history=[item].concat(state.history.filter(function(x){return x.id!==item.id;})).slice(0,35);save();
 $('#player-panel').hidden=false;
 $('#player-title').textContent=item.title||'Musique';
 $('#selected-title').textContent=item.title||'Vidéo';
 $('#selected-author').textContent=item.author||'';
 $('#favorite-video').textContent=state.favorites.some(function(x){return x.id===item.id;})?'★ Retirer des favoris':'☆ Ajouter aux favoris';
 $('#loop-video').textContent=state.loop?'↻ Boucle activée':'↻ Boucle désactivée';
 $('#switch-player').textContent=state.playerHost==='standard'?'↔ Essayer confidentialité renforcée':'↔ Essayer lecteur alternatif';
 $('#video-frame').src=ytEmbed(item);
 say('Lecture intégrée YouTube : si elle ne démarre pas automatiquement, sélectionne ▶ dans le cadre.');
 $('#player-panel').scrollIntoView({behavior:'smooth',block:'start'});
 $('#play-again').focus();
}
function closePlayer(){
 $('#video-frame').src='about:blank';$('#player-panel').hidden=true;$('#query').focus();
}
function favorites(){
 state.view='favorites';selectNav('favorites-btn');setResults(state.favorites,'Mes favoris');
 $('#results-section').scrollIntoView({behavior:'smooth',block:'start'});
}
function history(){
 state.view='history';selectNav('recent-btn');setResults(state.history,'Historique sur cette télévision');
 $('#results-section').scrollIntoView({behavior:'smooth',block:'start'});
}
function openTarget(url){window.open(url,'_blank','noopener,noreferrer');}
$('#search-form').addEventListener('submit',function(e){e.preventDefault();beginSearch($('#query').value);});
$$('[data-search]').forEach(function(b){b.addEventListener('click',function(){beginSearch(b.getAttribute('data-search'));});});
$('#home-btn').addEventListener('click',function(){selectNav('home-btn');$('#home-panel').scrollIntoView({behavior:'smooth'});$('#query').focus();});
function inspectTV(){
 var ua=navigator.userAgent||'',m=ua.match(/Tizen[\s\/;]*([0-9.]+)/i),model=ua.match(/(?:SMART-TV[^;)]*|SAMSUNG[^;)]*|TV Safari[^;)]*)/i);
 var video=document.createElement('video');
 var h264=video.canPlayType?video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'):'';
 var box=$('#compat-results');box.innerHTML='';
 [
  ['Appareil',/Tizen|SMART-TV|SmartTV/i.test(ua)?'Samsung TV / Tizen détecté':'Navigateur non identifié comme Samsung Tizen'],
  ['Version Tizen (déclarée)',m?m[1]:'Non précisée par le navigateur'],
  ['Navigateur',ua.slice(0,280)],
  ['Vidéo MP4 / H.264 + AAC',h264||'Support non annoncé'],
  ['Lecture YouTube intégrée','À tester : dépend de la TV, de la vidéo et des règles YouTube'],
  ['Connexion',navigator.onLine?'Navigateur en ligne':'Hors ligne / connexion à vérifier'],
  ['Moteur Web Samsung 2026','Chromium 130 attendu sur les modèles Tizen 10.0 (à confirmer avec le navigateur de la TV)']
 ].forEach(function(pair){var el=document.createElement('div');el.className='compat-line';var k=document.createElement('strong');k.textContent=pair[0];var v=document.createElement('span');v.textContent=pair[1];el.appendChild(k);el.appendChild(v);box.appendChild(el);});
 $('#compat-panel').hidden=false;
 $('#compat-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
$('#compat-btn').addEventListener('click',function(){inspectTV();selectNav('compat-btn');});
$('#close-compat').addEventListener('click',function(){$('#compat-panel').hidden=true;$('#home-btn').focus();});
$('#favorites-btn').addEventListener('click',favorites);$('#recent-btn').addEventListener('click',history);
$('#close-player').addEventListener('click',closePlayer);
$('#play-again').addEventListener('click',function(){if(state.current){$('#video-frame').src=ytEmbed(state.current);say('La lecture a été relancée.');}});
$('#switch-player').addEventListener('click',function(){
 if(!state.current)return;
 state.playerHost=state.playerHost==='nocookie'?'standard':'nocookie';
 $('#switch-player').textContent=state.playerHost==='standard'?'↔ Essayer confidentialité renforcée':'↔ Essayer lecteur alternatif';
 $('#video-frame').src=ytEmbed(state.current);
 say('Lecteur '+(state.playerHost==='standard'?'YouTube standard':'confidentialité renforcée')+' chargé. Si la vidéo reste bloquée, utilise le bouton « Ouvrir dans YouTube ».');
});
$('#favorite-video').addEventListener('click',function(){
 if(!state.current)return;
 var exists=state.favorites.some(function(x){return x.id===state.current.id;});
 state.favorites=exists?state.favorites.filter(function(x){return x.id!==state.current.id;}):[state.current].concat(state.favorites);save();
 $('#favorite-video').textContent=exists?'☆ Ajouter aux favoris':'★ Retirer des favoris';
});
$('#loop-video').addEventListener('click',function(){state.loop=!state.loop;$('#loop-video').textContent=state.loop?'↻ Boucle activée':'↻ Boucle désactivée';if(state.current)$('#video-frame').src=ytEmbed(state.current);});
$('#open-external').addEventListener('click',function(){if(state.current)openTarget('https://www.youtube.com/watch?v='+encodeURIComponent(state.current.id));});
$('#open-youtube-hyphen').addEventListener('click',function(){if(state.current)openTarget('https://www.yout-ube.com/watch?v='+encodeURIComponent(state.current.id));});
var suggestTimer=0,suggestN=0;
$('#query').addEventListener('input',function(){
 var q=$('#query').value.trim(),seq=++suggestN,box=$('#suggestions');
 clearTimeout(suggestTimer);box.innerHTML='';box.hidden=true;
 if(q.length<1||parseYoutube(q))return;
 suggestTimer=setTimeout(function(){
  fetch('./api/suggest?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
   if(seq!==suggestN)return;
   var items=(d.items||[]).slice(0,6);
   box.innerHTML='';items.forEach(function(item){
    if(!item||typeof item.label!=='string')return;
    var b=document.createElement('button');b.type='button';b.textContent='♫ '+item.label;
    b.addEventListener('click',function(){box.hidden=true;beginSearch(item.label);});
    box.appendChild(b);
   });
   box.hidden=!box.childElementCount;
  }).catch(function(){});
 },250);
});
document.addEventListener('keydown',function(e){
 var key=e.key||'',code=e.keyCode||0;
 var keyMap={Left:'ArrowLeft',Right:'ArrowRight',Up:'ArrowUp',Down:'ArrowDown'};
 if(keyMap[key])key=keyMap[key];
 if(!key||key==='Unidentified')key=({37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',10009:'Back'})[code]||key;
 if(key==='Escape'||key==='Back'||key==='BrowserBack'||(key==='Backspace'&&document.activeElement!==$('#query'))||code===10009){
  if(!$('#player-panel').hidden){e.preventDefault();closePlayer();return;}
  if(!$('#compat-panel').hidden){e.preventDefault();$('#compat-panel').hidden=true;$('#compat-btn').focus();return;}
  if(!$('#suggestions').hidden){$('#suggestions').hidden=true;e.preventDefault();return;}
  return;
 }
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(key)<0)return;
 var focus=document.activeElement;
 if(focus===$('#query')&&(key==='ArrowLeft'||key==='ArrowRight'))return;
 var dx=key==='ArrowRight'?1:key==='ArrowLeft'?-1:0,dy=key==='ArrowDown'?1:key==='ArrowUp'?-1:0;
 var nodes=$$('button:not([disabled]),a[href],input:not([disabled])').filter(function(x){
  var rect=x.getBoundingClientRect();return rect.width>0&&rect.height>0&&x.offsetParent!==null;
 });
 if(!nodes.length)return;
 if(!focus||nodes.indexOf(focus)<0){nodes[0].focus();e.preventDefault();return;}
 var a=focus.getBoundingClientRect(),cx=a.left+a.width/2,cy=a.top+a.height/2;
 var best=null,bestScore=Infinity;
 nodes.forEach(function(n){if(n===focus)return;var r=n.getBoundingClientRect(),px=r.left+r.width/2-cx,py=r.top+r.height/2-cy;
  var main=dx?dx*px:dy*py,off=dx?Math.abs(py):Math.abs(px);
  if(main<=4)return;
  var score=main+off*2.2+(off>120?40:0);
  if(score<bestScore){bestScore=score;best=n;}
 });
 if(best){best.focus();best.scrollIntoView({block:'nearest',inline:'nearest'});e.preventDefault();}
});
if(/Tizen|SMART-TV|SmartTV/i.test(navigator.userAgent||''))document.body.classList.add('tizen-browser');
// Do not open the Samsung on-screen keyboard on page load. Focus the remote-friendly home control.
$('#home-btn').focus();
})();