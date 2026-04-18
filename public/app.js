var Q=function(s){return document.querySelector(s)};
var QA=function(s){return Array.from(document.querySelectorAll(s))};
function hm(d){
  if(typeof d==='string'&&d.indexOf('T')!==-1){
    var p=new Date(d);
    var h=p.getHours(),m=p.getMinutes();
    return(h<10?'0':'')+h+':'+(m<10?'0':'')+m;
  }
  var h2=Math.floor(d/60)%24,m2=Math.round(d%60);
  return(h2<10?'0':'')+h2+':'+(m2<10?'0':'')+m2;
}
function cl(v,a,b){return Math.max(a,Math.min(b,v))}
function durMin(sec){return Math.round(sec/60)}

var CNAMES=["Paris","Lyon","Marseille","Toulouse",
  "Bordeaux","Lille","Nice","Nantes","Strasbourg",
  "Montpellier","Rennes","Grenoble",
  "Clermont-Ferrand","Tours","Dijon"];

try{
  var now=new Date();
  var ds=now.getFullYear()+'-'
    +(now.getMonth()<9?'0':'')+(now.getMonth()+1)+'-'
    +(now.getDate()<10?'0':'')+now.getDate();
  document.getElementById('ddate').value=ds;
}catch(e){}

function getDate(){
  return Q('#ddate').value
    ||new Date().toISOString().slice(0,10);
}

function setupAC(inputId,listId){
  var inp=document.getElementById(inputId);
  var lst=document.getElementById(listId);
  if(!inp||!lst)return;
  inp.addEventListener('input',function(){
    var v=inp.value.toLowerCase();lst.innerHTML='';
    if(v.length<1){lst.classList.add('hidden');return}
    var matches=[];
    for(var i=0;i<CNAMES.length;i++){
      if(CNAMES[i].toLowerCase().indexOf(v)!==-1)
        matches.push(CNAMES[i])}
    if(!matches.length){lst.classList.add('hidden');return}
    for(var j=0;j<Math.min(matches.length,8);j++){
      var li=document.createElement('li');
      li.textContent=matches[j];
      li.setAttribute('data-v',matches[j]);
      lst.appendChild(li)}
    lst.classList.remove('hidden');
  });
  lst.addEventListener('mousedown',function(e){
    var t=e.target;if(t.tagName==='LI'){
      e.preventDefault();
      inp.value=t.getAttribute('data-v');
      lst.classList.add('hidden')}});
  inp.addEventListener('blur',function(){
    setTimeout(function(){lst.classList.add('hidden')},200)});
  inp.addEventListener('focus',function(){
    if(inp.value.length>=1)
      inp.dispatchEvent(new Event('input'))});
}

var MI={train:'🚆',avion:'✈️',bus:'🚌',voiture:'🚗'};
var AT=[],SO='',SD='';

function normalize(t){
  var depD=new Date(t.dep),arrD=new Date(t.arr);
  var depMin=depD.getHours()*60+depD.getMinutes();
  var arrMin=arrD.getHours()*60+arrD.getMinutes();
  if(arrD.getDate()!==depD.getDate())arrMin+=24*60;
  var legs=[];
  for(var i=0;i<t.legs.length;i++){
    var lg=t.legs[i];
    legs.push({
      mode:lg.mode||t.type,
      i:MI[lg.mode||t.type]||'🚀',
      l:lg.label||t.type,
      from:lg.from||'',to:lg.to||'',
      dep:lg.dep,arr:lg.arr,
      dur:lg.dur||0
    });
  }
  return{
    id:0,type:t.type,
    dep:depMin,arr:arrMin,
    depISO:t.dep,arrISO:t.arr,
    dur:t.dur/60,
    price:t.price||0,
    co2:t.co2||0,
    legs:legs,
    bookUrl:t.bookUrl||null,
    estimated:t.estimated||false,
    source:t.source,
    _visible:true,_tag:null
  };
}

function pareto(tr){
  return tr.filter(function(t){
    for(var i=0;i<tr.length;i++){
      var o=tr[i];
      if(o!==t&&o.dur<=t.dur&&o.price<=t.price
        &&o.co2<=t.co2&&(o.dur<t.dur
        ||o.price<t.price||o.co2<t.co2))
        return false}
    return true});
}

function tagTrips(tr){
  if(!tr.length)return null;
  var f=tr[0],g=tr[0],c=tr[0];
  for(var i=1;i<tr.length;i++){
    if(tr[i].dur<f.dur)f=tr[i];
    if(tr[i].co2<g.co2)g=tr[i];
    if(tr[i].price>0
      &&(c.price===0||tr[i].price<c.price))c=tr[i]}
  f._tag='f';
  if(g!==f)g._tag='g';
  if(c!==f&&c!==g)c._tag='c';
  var pf=pareto(tr);
  for(var j=0;j<pf.length;j++){
    if(!pf[j]._tag)pf[j]._tag='p'}
  return{f:f,g:g,c:c};
}

function drawHist(cid,vals,maxV,cut,col){
  var cv=document.getElementById(cid);
  if(!cv)return;
  var wr=cv.parentElement;
  var w=wr.clientWidth,h=wr.clientHeight;
  if(!w||!h)return;
  var dp=window.devicePixelRatio||1;
  cv.width=w*dp;cv.height=h*dp;
  var cx=cv.getContext('2d');
  cx.scale(dp,dp);cx.clearRect(0,0,w,h);
  if(!vals.length||!maxV)return;
  var B=14,bn=[];
  for(var i=0;i<B;i++)bn.push(0);
  for(var j=0;j<vals.length;j++){
    bn[cl(Math.floor((vals[j]/maxV)*B),0,B-1)]++}
  var mb=1;
  for(var k=0;k<B;k++){if(bn[k]>mb)mb=bn[k]}
  var bw=w/B;
  for(var n=0;n<B;n++){
    var x=n*bw+1,bh=(bn[n]/mb)*(h-3);
    var bv=(n+.5)/B*maxV;
    cx.fillStyle=bv<=cut?col:'#e2e8f0';
    cx.fillRect(x,h-bh,bw-2,bh)}
}

function showBadges(b){
  if(!b){Q('#badges').classList.add('hidden');return}
  Q('#badges').classList.remove('hidden');
  var ic=function(t){var r=[];
    for(var i=0;i<t.legs.length;i++)r.push(t.legs[i].i);
    return r.join('')};
  Q('#b-t').innerHTML='⚡ <strong>Plus rapide</strong> '
    +ic(b.f)+' '+hm(b.f.depISO)+'→'+hm(b.f.arrISO)
    +' — '+Math.round(b.f.dur)+' min';
  Q('#b-g').innerHTML='🌿 <strong>Moins CO₂</strong> '
    +ic(b.g)+' '+hm(b.g.depISO)+'→'+hm(b.g.arrISO)
    +' — '+b.g.co2+' kg';
  var ps=b.c.price>0?b.c.price+' €':'—';
  Q('#b-p').innerHTML='💰 <strong>Moins cher</strong> '
    +ic(b.c)+' '+hm(b.c.depISO)+'→'+hm(b.c.arrISO)
    +' — '+ps;
}

var BKLBL={
  train:{l:'Réserver (SNCF)',c:'bl1'},
  avion:{l:'Réserver (vol)',c:'bl2'},
  bus:{l:'Réserver (bus)',c:'bl3'},
  voiture:{l:'BlaBlaCar',c:'bl4'}
};

function defaultBookUrl(t){
  if(t.bookUrl)return t.bookUrl;
  var dt=getDate();
  if(t.type==='train')return'https://www.sncf-connect.com/app/home/search?departure='
    +encodeURIComponent(SO)+'&arrival='+encodeURIComponent(SD)
    +'&outwardDate='+dt+'T'+hm(t.depISO)+':00&passengers=1';
  if(t.type==='avion')return'https://www.skyscanner.fr/transport/vols/'
    +encodeURIComponent(SO)+'/'+encodeURIComponent(SD)+'/'
    +dt.replace(/-/g,'')+'/?adults=1';
  if(t.type==='bus')return'https://www.flixbus.fr/recherche?departureCity='
    +encodeURIComponent(SO)+'&arrivalCity='+encodeURIComponent(SD)
    +'&rideDate='+dt.replace(/-/g,'/')+'&adult=1';
  if(t.type==='voiture')return'https://www.blablacar.fr/search?fn='
    +encodeURIComponent(SO)+'&tn='+encodeURIComponent(SD)
    +'&db='+dt+'&seats=1';
  return'#';
}

function renderCard(t){
  var tl={f:'⚡ Plus rapide',g:'🌿 Moins CO₂',
    c:'💰 Moins cher',p:'⭐ Optimal'};
  var tc={f:'tf',g:'tg',c:'tc_',p:'tp'};
  var tg=t._tag?'<span class="tt '
    +tc[t._tag]+'">'+tl[t._tag]+'</span>':'';
  var pv=[];
  for(var i=0;i<t.legs.length;i++){
    var lg=t.legs[i];
    pv.push(lg.i+' '+lg.l+' '
      +hm(lg.dep)+'→'+hm(lg.arr))}
  var dl=[];
  for(var j=0;j<t.legs.length;j++){
    var l=t.legs[j];
    dl.push('<div class="dl">'
      +'<div class="li">'+l.i+'</div>'
      +'<div class="lf"><strong>'+l.l+'</strong>'
      +(l.from?' — '+l.from+' → '+l.to:'')
      +'<br>Départ '+hm(l.dep)
      +' → Arrivée '+hm(l.arr)
      +'<br><span class="lm">'
      +'Durée '+durMin(l.dur)+' min'
      +(t.co2?' · CO₂ '+t.co2+' kg':'')
      +(t.price?' · Prix '+t.price+' €':'')
      +'</span></div></div>')}
  var icons=[];
  for(var k=0;k<t.legs.length;k++)
    icons.push(t.legs[k].i);
  var priceDisp=t.price>0?t.price+' €':'—';
  var estTag=t.estimated
    ?'<span class="est">(estimé)</span>':'';
  var bk=defaultBookUrl(t);
  var bl2=BKLBL[t.type];
  var bookHtml='<div class="bl">'
    +'<a class="bb '+(bl2?bl2.c:'bl5')
    +'" href="'+bk+'" target="_blank">'
    +(bl2?bl2.l:'Réserver')+'</a></div>';
  return'<div class="tc'
    +(t._visible===false?' dim':'')
    +(t._tag?' hl':'')+'">'
    +tg
    +'<div class="ts" onclick="window.tgl(this)">'
    +'<div><div class="tm">'
    +icons.join(' ')+' '+estTag+'</div>'
    +'<div class="tl">'+pv.join(' · ')+'</div>'
    +'<div class="eh">▶ Détail & réservation</div>'
    +'</div><div class="tst">'
    +'<span class="du">⏱ '
    +Math.round(t.dur)+' min</span>'
    +'<span class="co">🌿 '+t.co2+' kg</span>'
    +'<span class="pr">'+priceDisp+'</span>'
    +'</div></div>'
    +'<div class="td"><h4>Détail du trajet</h4>'
    +dl.join('')+bookHtml+'</div></div>';
}

window.tgl=function(el){
  var c=el.closest('.tc');
  c.classList.toggle('open');
  var h=c.querySelector('.eh');
  h.textContent=c.classList.contains('open')
    ?'▼ Masquer':'▶ Détail & réservation';
};

function mxf(f){
  if(!AT.length)return 1;
  var m=AT[0][f];
  for(var i=1;i<AT.length;i++){
    if(AT[i][f]>m)m=AT[i][f]}
  return m||1;
}

function applyF(){
  var md=(parseInt(Q('#sd').value)/100)*mxf('dep');
  var ma=(parseInt(Q('#sa').value)/100)*mxf('arr');
  var mc=(parseInt(Q('#sc').value)/100)*mxf('co2');
  var mp=(parseInt(Q('#spr').value)/100)*mxf('price');
  Q('#vd').textContent='≤ '+hm(md);
  Q('#va').textContent='≤ '+hm(ma);
  Q('#vc').textContent='≤ '+mc.toFixed(1)+' kg';
  Q('#vp').textContent='≤ '+mp.toFixed(0)+' €';
  var dV=[],aV=[],cV=[],pV=[];
  for(var i=0;i<AT.length;i++){
    AT[i]._visible=AT[i].dep<=md&&AT[i].arr<=ma
      &&AT[i].co2<=mc
      &&(AT[i].price<=mp||AT[i].price===0);
    dV.push(AT[i].dep);aV.push(AT[i].arr);
    cV.push(AT[i].co2);pV.push(AT[i].price)}
  drawHist('hd',dV,mxf('dep'),md,'#7c3aed');
  drawHist('ha',aV,mxf('arr'),ma,'#0284c7');
  drawHist('hc2',cV,mxf('co2'),mc,'#059669');
  drawHist('hp',pV,mxf('price'),mp,'#ea580c');
  var vi=0;
  for(var j=0;j<AT.length;j++){
    if(AT[j]._visible)vi++}
  Q('#rc').textContent='('+vi+'/'+AT.length+')';
  var so=AT.slice().sort(function(a,b){
    if(a._visible&&!b._visible)return-1;
    if(!a._visible&&b._visible)return 1;
    if(a._tag&&!b._tag)return-1;
    if(!a._tag&&b._tag)return 1;
    return a.dep-b.dep});
  var html=[];
  for(var k=0;k<so.length;k++)
    html.push(renderCard(so[k]));
  Q('#rl').innerHTML=html.join('');
}

function doSearch(){
  var on=Q('#ori').value.trim();
  var dn=Q('#dst').value.trim();
  if(!on||!dn){
    alert('Entrez une ville de départ et d\'arrivée.');
    return}
  SO=on;SD=dn;
  var dt=getDate();
  var tm=(Q('#dtim').value||'06:00')
    .replace(':','')+'00';
  var modes=[];var cbs=QA('.mc');
  for(var i=0;i<cbs.length;i++){
    if(cbs[i].checked)modes.push(cbs[i].value)}
  if(!modes.length){
    alert('Sélectionnez au moins un mode.');return}
  Q('#ri').textContent='⏳ Recherche en cours…';
  Q('#ri').classList.remove('hidden');
  Q('#sb').disabled=true;
  Q('#sb').textContent='⏳ Recherche…';
  var url='/api/search?origin='
    +encodeURIComponent(on)
    +'&destination='+encodeURIComponent(dn)
    +'&date='+dt+'&time='+tm
    +'&modes='+modes.join(',');
  fetch(url).then(function(r){
    return r.json()
  }).then(function(data){
    Q('#sb').disabled=false;
    Q('#sb').textContent='🔍 Rechercher';
    if(data.error){
      alert(data.error
        +(data.available
          ?'\nVilles: '+data.available.join(', ')
          :''));
      Q('#ri').classList.add('hidden');return}
    Q('#ri').textContent=on+' → '+dn
      +' · '+dt+' · ~'+data.distance+' km · '
      +data.count+' résultats';
    AT=[];
    for(var i=0;i<data.trips.length;i++){
      var nt=normalize(data.trips[i]);
      nt.id=i;AT.push(nt)}
    var at=Q('#atim').value;
    if(at){
      var ap=at.split(':');
      var ax=parseInt(ap[0])*60+parseInt(ap[1]);
      var f=[];
      for(var j=0;j<AT.length;j++){
        if(AT[j].arr<=ax)f.push(AT[j])}
      AT=f}
    for(var k=0;k<AT.length;k++)delete AT[k]._tag;
    var b=tagTrips(AT);
    if(!AT.length){
      Q('#badges').classList.add('hidden');
      Q('#hg').classList.add('hidden');
      Q('#results').classList.remove('hidden');
      Q('#rc').textContent='(0)';
      Q('#rl').innerHTML=
        '<p style="text-align:center;color:#94a3b8'
        +';padding:2rem">'
        +'Aucun trajet trouvé.</p>';
      return}
    Q('#hg').classList.remove('hidden');
    Q('#results').classList.remove('hidden');
    showBadges(b);
    Q('#sd').value=100;Q('#sa').value=100;
    Q('#sc').value=100;Q('#spr').value=100;
    applyF();
  }).catch(function(err){
    Q('#sb').disabled=false;
    Q('#sb').textContent='🔍 Rechercher';
    Q('#ri').textContent=
      'Erreur de connexion. Vérifiez votre réseau.';
    console.error(err);
  });
}

Q('#sb').addEventListener('click',doSearch);
Q('#swb').addEventListener('click',function(){
  var o=Q('#ori').value;
  Q('#ori').value=Q('#dst').value;
  Q('#dst').value=o});
Q('#sd').addEventListener('input',applyF);
Q('#sa').addEventListener('input',applyF);
Q('#sc').addEventListener('input',applyF);
Q('#spr').addEventListener('input',applyF);
setupAC('ori','ori-l');
setupAC('dst','dst-l');
Q('#ori').addEventListener('keydown',function(e){
  if(e.key==='Enter')doSearch()});
Q('#dst').addEventListener('keydown',function(e){
  if(e.key==='Enter')doSearch()});
