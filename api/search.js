const fetch = require('node-fetch');

const CITIES = {
  "Paris":{sncf:"stop_area:SNCF:87686006",lat:48.856,lon:2.352,iata:"PAR",airport:"CDG/ORY"},
  "Lyon":{sncf:"stop_area:SNCF:87722025",lat:45.764,lon:4.835,iata:"LYS",airport:"Saint-Exupéry"},
  "Marseille":{sncf:"stop_area:SNCF:87751008",lat:43.296,lon:5.370,iata:"MRS",airport:"Provence"},
  "Toulouse":{sncf:"stop_area:SNCF:87611004",lat:43.605,lon:1.444,iata:"TLS",airport:"Blagnac"},
  "Bordeaux":{sncf:"stop_area:SNCF:87581009",lat:44.837,lon:-0.576,iata:"BOD",airport:"Mérignac"},
  "Lille":{sncf:"stop_area:SNCF:87286005",lat:50.633,lon:3.066,iata:"LIL",airport:"Lesquin"},
  "Nice":{sncf:"stop_area:SNCF:87756056",lat:43.710,lon:7.262,iata:"NCE",airport:"Côte d'Azur"},
  "Nantes":{sncf:"stop_area:SNCF:87481002",lat:47.218,lon:-1.554,iata:"NTE",airport:"Atlantique"},
  "Strasbourg":{sncf:"stop_area:SNCF:87212027",lat:48.573,lon:7.752,iata:"SXB",airport:"Entzheim"},
  "Montpellier":{sncf:"stop_area:SNCF:87773002",lat:43.611,lon:3.877,iata:"MPL",airport:"Méditerranée"},
  "Rennes":{sncf:"stop_area:SNCF:87471003",lat:48.117,lon:-1.678,iata:"RNS",airport:"Saint-Jacques"},
  "Grenoble":{sncf:"stop_area:SNCF:87747006",lat:45.188,lon:5.724,iata:null,airport:null},
  "Clermont-Ferrand":{sncf:"stop_area:SNCF:87734004",lat:45.783,lon:3.082,iata:"CFE",airport:"Aulnat"},
  "Tours":{sncf:"stop_area:SNCF:87571000",lat:47.394,lon:0.685,iata:null,airport:null},
  "Dijon":{sncf:"stop_area:SNCF:87713040",lat:47.322,lon:5.041,iata:null,airport:null}
};

function haversine(a,b){
  var R=6371,toRad=function(d){return d*Math.PI/180};
  var dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon);
  var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function parseSNCFDate(s){
  return s.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,'$1-$2-$3T$4:$5:$6');
}

async function fetchSNCF(origin,dest,datetime,apiKey){
  var url='https://api.sncf.com/v1/coverage/sncf/journeys?from='+origin.sncf+'&to='+dest.sncf+'&datetime='+datetime+'&count=15&min_nb_journeys=8&';
  try{
    var res=await fetch(url,{headers:{Authorization:apiKey},timeout:10000});
    if(!res.ok)return[];
    var data=await res.json();
    if(!data.journeys)return[];
    return data.journeys.map(function(j){
      var legs=j.sections.filter(function(s){return s.type==='public_transport'}).map(function(s){
        var mode=s.display_informations?
          (s.display_informations.commercial_mode||'').toLowerCase().indexOf('bus')!==-1?'bus':'train'
          :'transfer';
        return{
          mode:mode,
          label:s.display_informations?(s.display_informations.commercial_mode||'')+(s.display_informations.headsign?' '+s.display_informations.headsign:''):'Correspondance',
          from:s.from?s.from.name:'',
          to:s.to?s.to.name:'',
          dep:parseSNCFDate(s.departure_date_time),
          arr:parseSNCFDate(s.arrival_date_time),
          dur:s.duration||0
        };
      });
      var hasBus=legs.some(function(l){return l.mode==='bus'});
      return{
        type:hasBus?'bus':'train',
        dep:parseSNCFDate(j.departure_date_time),
        arr:parseSNCFDate(j.arrival_date_time),
        dur:j.duration,legs:legs,
        co2:j.co2_emission?Math.round(j.co2_emission.value/1000*10)/10:null,
        price:null,
        bookUrl:'https://www.sncf-connect.com/',
        source:'sncf'
      };
    });
  }catch(e){return[];}
}

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

function flightEstimates(origin,dest,date,depTime){
  if(!origin.iata||!dest.iata)return[];
  var dist=haversine(origin,dest);
  if(dist<250)return[];
  var flightDurMin=Math.round((dist/750)*60)+30;
  var co2=Math.round(dist*1.3*0.230*10)/10;
  var basePrice=dist<500?50:dist<800?70:90;
  var variation=Math.round(basePrice*0.3);
  var results=[];
  var slots=['07:00','09:30','13:00','18:30'];
  var depH=parseInt(depTime.split(':')[0])||6;
  for(var i=0;i<slots.length;i++){
    var sh=parseInt(slots[i].split(':')[0]);
    if(sh<depH)continue;
    var depISO=date+'T'+slots[i]+':00';
    var depDate=new Date(depISO);
    var arrDate=new Date(depDate.getTime()+flightDurMin*60000);
    var price=basePrice+Math.round((Math.random()-0.5)*variation);
    results.push({
      type:'avion',dep:depISO,arr:arrDate.toISOString(),
      dur:flightDurMin*60,
      legs:[{mode:'avion',
        label:'Vol '+origin.iata+'→'+dest.iata,
        from:origin.name+' ('+origin.airport+')',
        to:dest.name+' ('+dest.airport+')',
        dep:depISO,arr:arrDate.toISOString(),
        dur:flightDurMin*60}],
      co2:co2,price:price,
      bookUrl:'https://www.skyscanner.fr/transport/vols/'
        +origin.iata+'/'+dest.iata+'/'
        +date.replace(/-/g,'')+'/?adults=1',
      source:'estimate',estimated:true
    });
  }
  return results;
}

function busEstimates(origin,dest,date,depTime){
  var dist=haversine(origin,dest);
  if(dist<50)return[];
  var busDurMin=Math.round((dist*1.3/85)*60)+15;
  var co2=Math.round(dist*1.3*0.030*10)/10;
  var basePrice=Math.max(5,Math.round(dist*0.04));
  var results=[];
  var slots=['06:30','10:00','14:00','17:30'];
  var depH=parseInt(depTime.split(':')[0])||6;
  for(var i=0;i<slots.length;i++){
    var sh=parseInt(slots[i].split(':')[0]);
    if(sh<depH)continue;
    var depISO=date+'T'+slots[i]+':00';
    var depDate=new Date(depISO);
    var arrDate=new Date(depDate.getTime()+busDurMin*60000);
    var price=basePrice+Math.round((Math.random()-0.5)*basePrice*0.3);
    results.push({
      type:'bus',dep:depISO,arr:arrDate.toISOString(),
      dur:busDurMin*60,
      legs:[{mode:'bus',label:'FlixBus / BlaBlaBus',
        from:origin.name,to:dest.name,
        dep:depISO,arr:arrDate.toISOString(),
        dur:busDurMin*60}],
      co2:co2,price:price,
      bookUrl:'https://www.flixbus.fr/recherche?departureCity='
        +encodeURIComponent(origin.name)
        +'&arrivalCity='+encodeURIComponent(dest.name)
        +'&rideDate='+date.replace(/-/g,'/')+'&adult=1',
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
