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


Dis "ok 7A" pour la suite.
Codex 16:53 ↑3↓2kR166.3kW3.9k0% ctxclaude-opus-4.6

ok 7A
openclaw-control-ui 16:54
📄 public/app.js — Partie B (colle après A)

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
  if(t.type==='train')return'https://www.sncf-connect.com/app/home/search?departure='+encodeURIComponent(SO)+'&arrival='+encodeURIComponent(SD)+'&outwardDate='+dt+'T'+hm(t.depISO)+':00&passengers=1';
  if(t.type==='avion')return'https://www.skyscanner.fr/transport/vols/'+encodeURIComponent(SO)+'/'+encodeURIComponent(SD)+'/'+dt.replace(/-/g,'')+'/?adults=1';
  if(t.type==='bus')return'https://www.flixbus.fr/recherche?departureCity='+encodeURIComponent(SO)+'&arrivalCity='+encodeURIComponent(SD)+'&rideDate='+dt.replace(/-/g,'/')+'&adult=1';
  if(t.type==='voiture')return'https://www.blablacar.fr/search?fn='+encodeURIComponent(SO)+'&tn='+encodeURIComponent(SD)+'&db='+dt+'&seats=1';
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
    +icons.join(' ')+estTag+'</div>'
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


function trainEstimates(origin,dest,date,depTime){
  var dist=haversine(origin,dest);
  var roadDist=dist*1.3;
  var speed=roadDist>300?280:roadDist>150?180:120;
  var trainDurMin=Math.round((roadDist/speed)*60)+15;
  var co2=Math.round(roadDist*0.006*10)/10;
  var basePrice=roadDist>300?Math.round(roadDist*0.13)
    :roadDist>150?Math.round(roadDist*0.11)
    :Math.round(roadDist*0.08);
  var trainType=roadDist>300?'TGV INOUI'
    :roadDist>150?'Intercités':'TER';
  var results=[];
  var slots=['06:30','08:00','10:00','12:30',
    '14:00','16:30','18:00','20:00'];
  var depH=parseInt(depTime.split(':')[0])||6;
  for(var i=0;i<slots.length;i++){
    var sh=parseInt(slots[i].split(':')[0]);
    if(sh<depH)continue;
    var depISO=date+'T'+slots[i]+':00';
    var depDate=new Date(depISO);
    var arrDate=new Date(depDate.getTime()+trainDurMin*60000);
    var price=basePrice+Math.round(
      (Math.random()-0.5)*basePrice*0.25);
    results.push({
      type:'train',dep:depISO,
      arr:arrDate.toISOString(),
      dur:trainDurMin*60,
      legs:[{mode:'train',label:trainType,
        from:origin.name,to:dest.name,
        dep:depISO,arr:arrDate.toISOString(),
        dur:trainDurMin*60}],
      co2:co2,price:price,
      bookUrl:'https://www.sncf-connect.com/app/home/search?departure='
        +encodeURIComponent(origin.name)
        +'&arrival='+encodeURIComponent(dest.name)
        +'&outwardDate='+date+'T'+slots[i]
        +':00&passengers=1',
      source:'estimate',estimated:true
    });
  }
  return results;
}

function carEstimate(origin,dest,datetime){
  var dist=haversine(origin,dest)*1.3;
  var durH=dist/110;
  var price=Math.round((dist*0.09+dist*0.07)*100)/100;
  var co2=Math.round(dist*0.12*10)/10;
  var depDate=new Date(datetime);
  var arrDate=new Date(depDate.getTime()+durH*3600000);
  return{
    type:'voiture',
    dep:depDate.toISOString(),arr:arrDate.toISOString(),
    dur:Math.round(durH*3600),
    legs:[{mode:'voiture',label:'Voiture',
      from:origin.name,to:dest.name,
      dep:depDate.toISOString(),arr:arrDate.toISOString(),
      dur:Math.round(durH*3600)}],
    co2:co2,price:price,dist:Math.round(dist),
    bookUrl:'https://www.blablacar.fr/search?fn='
      +encodeURIComponent(origin.name)
      +'&tn='+encodeURIComponent(dest.name)
      +'&db='+datetime.slice(0,10),
    source:'calc'
  };
}

module.exports=async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  var q=req.query;
  var origin=q.origin,destination=q.destination,date=q.date;
  var time=q.time,modes=q.modes;
  if(!origin||!destination||!date)
    return res.status(400).json({error:'Paramètres manquants'});
  var o=CITIES[origin],d=CITIES[destination];
  if(!o||!d)return res.status(400).json({
    error:'Ville inconnue',
    available:Object.keys(CITIES)});
  o.name=origin;d.name=destination;
  var depTime=time?(time.slice(0,2)+':'+time.slice(2,4)):'06:00';
  var datetime=date+'T'+depTime+':00';
  var sncfDt=date.replace(/-/g,'')+'T'+depTime.replace(':','')+'00';
  var modeList=(modes||'train,avion,bus,voiture').split(',');
  var SNCF_KEY=process.env.SNCF_API_KEY||'';
  var trips=[];
  if(modeList.indexOf('train')!==-1||modeList.indexOf('bus')!==-1){
    var sncfTrips=await fetchSNCF(o,d,sncfDt,SNCF_KEY);
    for(var i=0;i<sncfTrips.length;i++){
      if(modeList.indexOf(sncfTrips[i].type)!==-1)
        trips.push(sncfTrips[i]);
    }
  }
  if(modeList.indexOf('train')!==-1){
    var hasSNCFTrain=false;
    for(var k=0;k<trips.length;k++){
      if(trips[k].type==='train'&&trips[k].source==='sncf')
        {hasSNCFTrain=true;break}
    }
    if(!hasSNCFTrain){
      var te=trainEstimates(o,d,date,depTime);
      for(var l2=0;l2<te.length;l2++)trips.push(te[l2]);
    }
  }
  if(modeList.indexOf('avion')!==-1){
    var fl=flightEstimates(o,d,date,depTime);
    for(var j=0;j<fl.length;j++)trips.push(fl[j]);
  }
  if(modeList.indexOf('bus')!==-1){
    var hasSNCFBus=false;
    for(var k2=0;k2<trips.length;k2++){
      if(trips[k2].type==='bus'&&trips[k2].source==='sncf')
        {hasSNCFBus=true;break}
    }
    if(!hasSNCFBus){
      var bu=busEstimates(o,d,date,depTime);
      for(var l=0;l<bu.length;l++)trips.push(bu[l]);
    }
  }
  if(modeList.indexOf('voiture')!==-1){
    trips.push(carEstimate(o,d,datetime));
  }
  var dist=haversine(o,d)*1.3;
  for(var m=0;m<trips.length;m++){
    var t=trips[m];
    if(t.co2===null||t.co2===undefined){
      if(t.type==='train')t.co2=Math.round(dist*0.006*10)/10;
      else if(t.type==='avion')t.co2=Math.round(dist*0.230*10)/10;
      else if(t.type==='bus')t.co2=Math.round(dist*0.030*10)/10;
    }
  }
  trips.sort(function(a,b){
    return new Date(a.dep)-new Date(b.dep)});
  return res.status(200).json({
    origin:origin,destination:destination,date:date,
    distance:Math.round(dist),
    count:trips.length,trips:trips
  });
};
