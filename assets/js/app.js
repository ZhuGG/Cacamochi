(()=> {
  'use strict';
  var orientationMq=(typeof window!=='undefined' && window.matchMedia)?window.matchMedia('(orientation: portrait)'):null;
  function updateOrientationMode(){
    if(!document || !document.documentElement) return;
    var root=document.documentElement;
    var isPortrait=false;
    if(orientationMq){ isPortrait=orientationMq.matches; }
    else if(typeof window!=='undefined'){ isPortrait=window.innerHeight>window.innerWidth; }
    var isMobile=typeof window!=='undefined'?window.innerWidth<=900:false;
    root.classList.toggle('is-portrait', Boolean(isMobile && isPortrait));
    setViewportUnit();
  }
  function setViewportUnit(){
    if(typeof window==='undefined' || !document || !document.documentElement) return;
    var vh=window.innerHeight*0.01;
    document.documentElement.style.setProperty('--vh', vh+'px');
  }
  updateOrientationMode();
  if(typeof window!=='undefined'){
    window.addEventListener('resize', updateOrientationMode);
    window.addEventListener('orientationchange', updateOrientationMode);
  }
  if(orientationMq){
    if(typeof orientationMq.addEventListener==='function'){ orientationMq.addEventListener('change', updateOrientationMode); }
    else if(typeof orientationMq.addListener==='function'){ orientationMq.addListener(updateOrientationMode); }
  }
  /* ---------- Base & état ---------- */
  const CONFIG = {
    background: "img_background.jpg",
    sprites: {
      bouseau:   { src: "img_bouseau.png",   x:0,y:0,w:200,h:200 },
      cacabra:   { src: "img_cacabra.png",   x:0,y:0,w:200,h:200 },
      seigneur:  { src: "img_seigneur.png",  x:0,y:0,w:200,h:200 },
      skatour:   { src: "img_skatour.png",   x:0,y:0,w:200,h:200 },
      skalibur:  { src: "img_skalibur.png",  x:0,y:0,w:200,h:200 },
      crottombe: { src: "img_crottombe.png", x:0,y:0,w:200,h:200 },
      thanabouse:{ src: "img_thanabouse.png",x:0,y:0,w:200,h:200 }
    }
  };

  function $(s,r){ return (r||document).querySelector(s); }
  const app={hunger:70,fun:70,hyg:70,energy:70,day:1,alive:true,asleep:false,
             evo:"bouseau",affection:0,discipline:0,odor:0};

  const bar={ hunger:$("#bHunger .meter i"), fun:$("#bFun .meter i"), hyg:$("#bHyg .meter i"), energy:$("#bEnergy .meter i") };
  const bars={ hunger:$("#bHunger"), fun:$("#bFun"), hyg:$("#bHyg"), energy:$("#bEnergy") };
  const age=$("#age"), speech=$("#speech"), speechText=$("#speechText");
  const bg=$("#bg"), evoImg=$("#evo-img"), sprite=$("#sprite");
  const traitsEls={aff:$("#tAff"), dis:$("#tDis"), odo:$("#tOdo")};
  const traitMap={ affection:traitsEls.aff, discipline:traitsEls.dis, odor:traitsEls.odo };
  const stars=$("#stars"), gameover=$("#gameover"), sunOverlay=$("#sunBoost");
  const plantEl=$("#plant");
  const plantSvg=$("#plantSvg"), plantAura=$("#plantAura");
  const plantLevelTitle=$("#plantLevelTitle"), plantLevelSubtitle=$("#plantLevelSubtitle");
  const plantMeters={ hydration:$("#plantHydration"), sunlight:$("#plantSunlight"), mood:$("#plantMood") };
  const plantToggle=$("#plantToggle");

  var plantHudCollapsed=false, plantHudUserOverride=false, plantHudMq=null, plantHudToggleInit=false;

  const evoName=function(id){ var m={bouseau:"Bouseau",cacabra:"Cacabra",seigneur:"Seignœur",skatour:"Skatour",skalibur:"Skalibur",crottombe:"Crottombe",thanabouse:"Thanabouse"}; return m[id]||"???"; };
  const say=function(txt){
    speechText.textContent=txt;
    speech.style.display='block';
    animateOnce(speech,'pop',380);
    clearTimeout(say.t);
    say.t=setTimeout(function(){ speech.style.display='none'; speech.classList.remove('pop'); },1400);
  };
  const applyBackground=function(){ bg.src=CONFIG.background; };
  function applySprite(){ var s=CONFIG.sprites[app.evo]; if(!s) return;
    evoImg.setAttribute('href',s.src); evoImg.setAttribute('x',s.x||0); evoImg.setAttribute('y',s.y||0);
    evoImg.setAttribute('width',s.w||200); evoImg.setAttribute('height',s.h||200);
  }
  function setMeter(name,val){
    var prev=typeof app[name]==='number'?app[name]:undefined;
    val=Math.max(0,Math.min(100,val));
    var fill=bar[name], track=bars[name];
    if(fill){
      fill.style.width=val+"%";
      if(prev!==undefined){
        if(val>prev+0.1){ animateOnce(fill,'gain',650); }
        else if(val<prev-0.1){ animateOnce(fill,'loss',650); }
      }
    }
    if(track){
      track.classList.toggle('bad',val<35); track.classList.toggle('mid',val>=35&&val<65); track.classList.toggle('good',val>=65);
      if(prev!==undefined && Math.abs(val-prev)>=18){ animateOnce(track,'flash',620); }
    }
    app[name]=val;
  }
  const TRAIT_LIMITS={ affection:{min:0,max:30}, discipline:{min:0,max:30}, odor:{min:0,max:20} };
  function setTrait(name,delta,min,max){
    var prev=typeof app[name]==='number'?app[name]:0;
    var limits=TRAIT_LIMITS[name]||{};
    var minVal=(typeof min==='number')?min:(typeof limits.min==='number'?limits.min:-999);
    var maxVal=(typeof max==='number')?max:(typeof limits.max==='number'?limits.max:999);
    app[name]=Math.max(minVal,Math.min(maxVal,app[name]+delta));
    var diff=app[name]-prev;
    if(diff!==0) animateTraitChange(name,diff);
  }
  function animateTraitChange(name,delta){
    var el=traitMap[name];
    if(!el) return;
    animateOnce(el, delta>0?'up':'down', 620);
  }
  function avg(){ var s=0; for(var i=0;i<arguments.length;i++) s+=arguments[i]; return s/arguments.length; }
  function updateAll(){
    setMeter('hunger',app.hunger); setMeter('fun',app.fun); setMeter('hyg',app.hyg); setMeter('energy',app.energy);
    traitsEls.aff.textContent="Affection: "+app.affection; traitsEls.dis.textContent="Discipline: "+app.discipline; traitsEls.odo.textContent="Odeur: "+app.odor;
    age.textContent="Jour "+app.day+" — "+evoName(app.evo); applySprite();
    document.body.classList.toggle('sleeping', app.asleep);
  }
  const load=function(){ try{var s=JSON.parse(localStorage.getItem("cacamochi-deluxe+")); if(s) for(var k in s) app[k]=s[k];}catch(e){} };
  const save=function(){ localStorage.setItem("cacamochi-deluxe+", JSON.stringify(app)); };

  /* Night stars */
  for(var i=0;i<36;i++){ var st=document.createElement('div'); st.className='star';
    st.style.left=(Math.random()*100)+'%'; st.style.top=(Math.random()*100)+'%'; st.style.animationDelay=(Math.random()*2)+'s'; stars.appendChild(st); }

  /* ---------- Plante évolutive + anim ---------- */
  const PLANT_STAGES=[
    { minXp:0,  title:"Graine curieuse",     tagline:"Réveille-la avec un peu d'eau.", emoji:"🌱" },
    { minXp:12, title:"Pousse mélodieuse",   tagline:"Elle se balance au rythme de la pièce.", emoji:"🌿" },
    { minXp:28, title:"Buisson rayonnant",   tagline:"Ses feuilles vibrent quand Cacamochi est heureux.", emoji:"🍃" },
    { minXp:52, title:"Fleur astrale",       tagline:"Un parfum sucré envahit la pièce.", emoji:"🌸" },
    { minXp:85, title:"Arbre lunaire",       tagline:"Elle diffuse une énergie protectrice.", emoji:"🌟" }
  ];
  var plantState = { xp:0, stage:0, boost:false, boostEnd:0, waterCd:0, hydration:78, sunlight:68, mood:72, thrive:0, alerts:{}, saveTimer:0 };
  var PLANT_KEY="cacamochi-plant";
  function clampPercent(v){ return Math.max(0, Math.min(100, v)); }
  function plantLoad(){
    try{
      var s=JSON.parse(localStorage.getItem(PLANT_KEY));
      if(s){
        if(typeof s.xp==='number') plantState.xp=s.xp;
        if(typeof s.hydration==='number') plantState.hydration=clampPercent(s.hydration);
        if(typeof s.sunlight==='number') plantState.sunlight=clampPercent(s.sunlight);
        if(typeof s.mood==='number') plantState.mood=clampPercent(s.mood);
      }
    }catch(_){ }
    plantState.stage = plantStageFromXp(plantState.xp);
    plantState.thrive=0;
    plantState.alerts=plantState.alerts||{};
  }
  function plantSave(){
    localStorage.setItem(PLANT_KEY, JSON.stringify({
      xp:plantState.xp,
      hydration:plantState.hydration,
      sunlight:plantState.sunlight,
      mood:plantState.mood
    }));
  }
  function queuePlantSave(){
    if(plantState.saveTimer) return;
    plantState.saveTimer=setTimeout(function(){ plantState.saveTimer=0; plantSave(); },700);
  }
  function plantStageFromXp(xp){
    var stage=0;
    for(var i=0;i<PLANT_STAGES.length;i++){ if(xp>=PLANT_STAGES[i].minXp) stage=i; }
    return stage;
  }
  function runPlantAnimation(frames, options, fallbackClass){
    if(!plantEl) return;
    var opts=options?Object.assign({}, options):{};
    if(typeof opts.duration!=='number') opts.duration=600;
    if(!opts.easing) opts.easing='ease-out';
    if(typeof opts.composite==='undefined') opts.composite='add';
    if(plantEl.animate){
      try{ plantEl.animate(frames, opts); }
      catch(_){ var backup=Object.assign({}, opts); delete backup.composite; plantEl.animate(frames, backup); }
    } else if(fallbackClass){
      animateOnce(plantEl, fallbackClass, opts.duration);
    }
  }
  function updatePlantHud(stage){
    var info=PLANT_STAGES[stage]||PLANT_STAGES[0];
    if(plantLevelTitle) plantLevelTitle.textContent="Niveau "+(stage+1)+" — "+info.title;
    if(plantLevelSubtitle) plantLevelSubtitle.textContent=info.tagline;
  }
  function updatePlantIdleMotion(){
    if(!plantSvg) return;
    var stage = typeof plantState.stage==='number' ? plantState.stage : 0;
    var bobStages=[4.6,5.4,6.3,7.2,8.1];
    var swayStages=[1.5,1.9,2.4,2.9,3.3];
    var cycleStages=[9.2,8.5,7.8,7.1,6.5];
    var driftStages=[0.0,0.35,0.6,0.85,1.1];
    var idx=Math.max(0, Math.min(stage, bobStages.length-1));
    var bob=bobStages[idx];
    var sway=swayStages[idx];
    var duration=cycleStages[idx];
    var driftBase=driftStages[Math.min(idx, driftStages.length-1)];
    var sign=Number(plantSvg.dataset.idleSign);
    if(!sign || !isFinite(sign)){
      sign=(Math.random()>0.5?1:-1);
      plantSvg.dataset.idleSign=String(sign);
    }
    var thriving = plantEl && plantEl.getAttribute('data-thriving')==='true';
    if(thriving){
      bob+=0.7;
      sway+=0.35;
      duration=Math.max(5.6, duration-1.1);
      driftBase+=0.25;
      plantSvg.classList.add('thriving');
    } else {
      plantSvg.classList.remove('thriving');
    }
    plantSvg.style.setProperty('--plant-bob', bob.toFixed(2)+'px');
    plantSvg.style.setProperty('--plant-sway', sway.toFixed(2)+'deg');
    plantSvg.style.setProperty('--plant-cycle', duration.toFixed(2)+'s');
    plantSvg.style.setProperty('--plant-drift', (driftBase*sign).toFixed(2)+'px');
  }
  function updatePlantClassFlags(){
    if(!plantEl) return;
    plantEl.classList.toggle('is-thirsty', plantState.hydration<35);
    plantEl.classList.toggle('needs-light', plantState.sunlight<35);
    plantEl.classList.toggle('is-sad', plantState.mood<35);
    var thriving = plantState.hydration>70 && plantState.sunlight>68 && plantState.mood>68;
    plantEl.setAttribute('data-thriving', thriving?'true':'false');
    updatePlantIdleMotion();
  }
  function updatePlantMeter(name, prev, val, options){
    var el=plantMeters[name]; if(!el) return;
    var diff=val - (typeof prev==='number'?prev:val);
    el.style.width=val+'%';
    el.style.setProperty('--value', val+'%');
    el.dataset.value=val;
    if(!(options&&options.silent) && Math.abs(diff)>=5){ animateOnce(el, diff>0?'gain':'loss', 650); }
    var wrap = el.parentElement ? el.parentElement.parentElement : null;
    if(wrap){
      wrap.classList.toggle('bad', val<35);
      wrap.classList.toggle('mid', val>=35 && val<70);
      wrap.classList.toggle('good', val>=70);
    }
  }
  function renderPlantVitals(options){
    ['hydration','sunlight','mood'].forEach(function(name){
      var el=plantMeters[name];
      if(!el) return;
      var prev=parseFloat(el.dataset.value);
      if(isNaN(prev)) prev=plantState[name];
      updatePlantMeter(name, prev, plantState[name], options);
    });
    updatePlantClassFlags();
  }
  function setPlantVital(name, value, options){
    if(typeof plantState[name]!=='number') plantState[name]=0;
    var prev=plantState[name];
    var val=clampPercent(value);
    plantState[name]=val;
    if(!(options&&options.deferRender)){
      updatePlantMeter(name, prev, val, options);
      updatePlantClassFlags();
    }
    queuePlantSave();
    return val-prev;
  }
  function adjustPlantVital(name, delta, options){
    return setPlantVital(name, plantState[name]+delta, options);
  }
  function plantRender(prevStage){
    var stage=plantStageFromXp(plantState.xp);
    var changed = typeof prevStage==='number' ? stage!==prevStage : stage!==plantState.stage;
    plantState.stage=stage;
    if(plantEl) plantEl.setAttribute('data-stage', stage);
    if(plantSvg){
      var groups=plantSvg.querySelectorAll('.plantStage');
      for(var i=0;i<groups.length;i++){
        var node=groups[i];
        var visible=node.getAttribute('data-stage')===String(stage);
        node.style.opacity=visible?'1':'0';
        node.style.pointerEvents=visible?'auto':'none';
      }
    }
    updatePlantHud(stage);
    updatePlantIdleMotion();
    if(changed){ plantStageCelebrate(stage); }
  }
  function plantStageCelebrate(stage){
    if(!plantEl) return;
    animateOnce(plantEl,'stageBloom',900);
    runPlantAnimation([
      { transform:'translateY(0) scale(1)' },
      { transform:'translateY(-6px) scale(1.05)', offset:0.5 },
      { transform:'translateY(0) scale(1)' }
    ], { duration:760, easing:'ease-out' }, 'grow');
    spawnPlantSparkles(8);
    var info=PLANT_STAGES[stage]||{};
    say((info.emoji||'🌿')+' La plante évolue : '+(info.title||'Nouvelle forme')+' !');
  }
  function applyPlantHudCollapsed(){
    if(!plantEl) return;
    plantEl.classList.toggle('is-compact', !!plantHudCollapsed);
    if(plantToggle){
      plantToggle.setAttribute('aria-expanded', plantHudCollapsed?'false':'true');
    }
  }
  function setupPlantHudToggle(){
    if(plantHudToggleInit) return;
    if(!plantEl || !plantToggle) return;
    plantHudToggleInit=true;
    plantToggle.addEventListener('click', function(){
      plantHudCollapsed=!plantHudCollapsed;
      plantHudUserOverride=true;
      applyPlantHudCollapsed();
    });
    if(window.matchMedia){
      try{
        plantHudMq=window.matchMedia('(max-width: 720px)');
        plantHudCollapsed=plantHudMq.matches;
        plantHudUserOverride=false;
        applyPlantHudCollapsed();
        var mqHandler=function(ev){
          if(ev.matches){
            if(!plantHudUserOverride){
              plantHudCollapsed=true;
              applyPlantHudCollapsed();
            }
          } else {
            plantHudCollapsed=false;
            plantHudUserOverride=false;
            applyPlantHudCollapsed();
          }
        };
        if(typeof plantHudMq.addEventListener==='function'){ plantHudMq.addEventListener('change', mqHandler); }
        else if(typeof plantHudMq.addListener==='function'){ plantHudMq.addListener(mqHandler); }
      }catch(_){
        plantHudCollapsed=false;
        applyPlantHudCollapsed();
      }
    } else {
      plantHudCollapsed=false;
      applyPlantHudCollapsed();
    }
  }
  function addBurstAround(el, color){
    if(!el || !el.getBoundingClientRect) return;
    var rect=el.getBoundingClientRect(), cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    for(var i=0;i<6;i++){ var a=Math.random()*Math.PI*2, d=20+Math.random()*26; var dx=Math.cos(a)*d, dy=Math.sin(a)*d;
      var p=document.createElement('div'); p.className='p'; p.style.background=color||'#ffd6a3';
      p.style.left=(cx-5)+'px'; p.style.top=(cy-5)+'px'; p.style.setProperty('--tr',"translate("+dx+"px,"+dy+"px)");
      document.body.appendChild(p); setTimeout((function(el){return function(){el.remove();};})(p),800);
    }
  }
  function animateOnce(el, cls, duration){
    if(!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    var key='__anim_'+cls;
    if(el[key]) clearTimeout(el[key]);
    el[key]=setTimeout(function(){ el.classList.remove(cls); el[key]=0; }, duration||600);
  }
  function emitEmojiBurst(target, icons){
    if(!target) return;
    var rect=target.getBoundingClientRect();
    if(!Array.isArray(icons)) icons=[icons];
    for(var i=0;i<icons.length;i++){
      var node=document.createElement('span');
      node.className='emojiBurst';
      node.textContent=icons[i];
      var spread = icons.length>1 ? (i/(icons.length-1))-0.5 : 0;
      var offsetX = spread*36 + (Math.random()*12-6);
      var offsetY = (Math.random()*12-6);
      node.style.left=(rect.left + rect.width/2 + offsetX)+'px';
      node.style.top=(rect.top + rect.height*0.35 + offsetY)+'px';
      document.body.appendChild(node);
      setTimeout((function(el){return function(){el.remove();};})(node),1200);
    }
  }
  function createRipple(target){
    if(!target) return;
    var rect=target.getBoundingClientRect();
    var ripple=document.createElement('span');
    ripple.className='waterRipple';
    ripple.style.left=(rect.left + rect.width/2)+'px';
    ripple.style.top=(rect.bottom - 6)+'px';
    document.body.appendChild(ripple);
    setTimeout(function(){ ripple.remove(); }, 900);
  }
  function createSunBurst(target){
    if(!target) return;
    var rect=target.getBoundingClientRect();
    var burst=document.createElement('span');
    burst.className='sunBurst';
    burst.style.left=(rect.left + rect.width/2)+'px';
    burst.style.top=(rect.top + rect.height*0.25)+'px';
    document.body.appendChild(burst);
    setTimeout(function(){ burst.remove(); }, 1400);
  }
  function spawnPlantSparkles(count){
    if(!plantEl || !plantEl.getBoundingClientRect) return;
    var rect=plantEl.getBoundingClientRect();
    var total = count || 5;
    for(var i=0;i<total;i++){
      var spark=document.createElement('span');
      spark.className='plantSpark';
      var angle=Math.random()*Math.PI*2;
      var dist=30+Math.random()*40;
      spark.style.left=(rect.left + rect.width/2 + Math.cos(angle)*dist)+'px';
      spark.style.top=(rect.top + rect.height*0.3 + Math.sin(angle)*dist)+'px';
      document.body.appendChild(spark);
      setTimeout((function(el){return function(){ el.remove(); };})(spark),1200);
    }
  }
  function spawnPlantDrops(){
    if(!plantEl || !plantEl.getBoundingClientRect) return;
    var rect=plantEl.getBoundingClientRect();
    for(var i=0;i<4;i++){
      var drop=document.createElement('span');
      drop.className='plantDrop';
      var angle=Math.random()*Math.PI*2;
      var dist=24+Math.random()*26;
      drop.style.left=(rect.left + rect.width/2 + Math.cos(angle)*dist)+'px';
      drop.style.top=(rect.top + rect.height*0.35 + Math.sin(angle)*dist)+'px';
      document.body.appendChild(drop);
      setTimeout((function(el){return function(){ el.remove(); };})(drop),1000);
    }
  }
  function spawnPlantRays(){
    if(!plantEl || !plantEl.getBoundingClientRect) return;
    var rect=plantEl.getBoundingClientRect();
    var ray=document.createElement('span');
    ray.className='plantRay';
    ray.style.left=(rect.left + rect.width/2)+'px';
    ray.style.top=(rect.top + rect.height*0.1)+'px';
    document.body.appendChild(ray);
    setTimeout(function(){ ray.remove(); },1400);
  }
  function plantGain(n, options){
    if(typeof n!=='number' || !isFinite(n) || n===0){ plantRender(); return; }
    var prevXp=plantState.xp;
    var gain = plantState.boost ? Math.ceil(n*1.6) : n;
    plantState.xp=Math.max(0, Math.min(999, prevXp + gain));
    var prevStage=plantStageFromXp(prevXp);
    plantRender(prevStage);
    if(gain>0 && !(options && options.silent)){
      runPlantAnimation([
        { transform:'translateY(0) scale(1)' },
        { transform:'translateY(-3px) scale(1.04)', offset:0.45 },
        { transform:'translateY(0) scale(1)' }
      ], { duration:620, easing:'ease-out' }, 'grow');
      addBurstAround(plantEl, plantState.boost ? '#ffe8b3' : '#c9f3d0');
      spawnPlantSparkles(4);
    }
    queuePlantSave();
  }
  function plantInit(){
    plantLoad();
    plantState.hydration=clampPercent(plantState.hydration);
    plantState.sunlight=clampPercent(plantState.sunlight);
    plantState.mood=clampPercent(plantState.mood);
    if(plantAura) plantAura.style.animationDelay=(Math.random()*3).toFixed(2)+'s';
    if(plantSvg){
      if(!plantSvg.dataset.idleSign){ plantSvg.dataset.idleSign=(Math.random()>0.5?1:-1); }
      plantSvg.style.animationDelay=(-Math.random()*4).toFixed(2)+'s';
    }
    renderPlantVitals({silent:true});
    plantRender();
    setupPlantHudToggle();
    queuePlantSave();
    if(plantState.tickInterval) clearInterval(plantState.tickInterval);
    plantState.tickInterval=setInterval(plantTick, 6500);
  }
  function plantTick(){
    if(!plantEl) return;
    adjustPlantVital('hydration', plantState.boost ? -0.5 : -0.8, {deferRender:true});
    adjustPlantVital('sunlight', app.asleep ? -0.3 : -0.6, {deferRender:true});
    var care=avg(app.hunger, app.fun, app.hyg, app.energy);
    if(care>75){ adjustPlantVital('mood', +0.8, {deferRender:true}); }
    else if(care<40){ adjustPlantVital('mood', -1.1, {deferRender:true}); }
    else { adjustPlantVital('mood', -0.5, {deferRender:true}); }
    renderPlantVitals({silent:true});
    if(plantState.boost && Date.now()>plantState.boostEnd){ sunOff(); }
    var thriving = plantState.hydration>70 && plantState.sunlight>68 && plantState.mood>68;
    if(thriving){
      plantState.thrive=(plantState.thrive||0)+1;
      if(plantState.thrive>=3){ plantGain(1,{silent:true}); spawnPlantSparkles(3); plantState.thrive=0; }
    } else {
      plantState.thrive=0;
    }
    queuePlantSave();
    handlePlantWarnings();
  }
  function plantWarn(kind,message){
    if(!plantState.alerts) plantState.alerts={};
    var now=Date.now();
    var last=plantState.alerts[kind]||0;
    if(now-last>90000){
      plantState.alerts[kind]=now;
      say(message);
    }
  }
  function handlePlantWarnings(){
    if(!app.alive) return;
    if(plantState.hydration<26) plantWarn('hydration','💧 Ta plante a très soif !');
    if(plantState.sunlight<26) plantWarn('sunlight','☀️ Un petit bain de soleil lui ferait du bien.');
    if(plantState.mood<24) plantWarn('mood','🎶 Parle-lui, elle se sent seule…');
  }
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden){ renderPlantVitals({silent:true}); }
  });

  function clearSunBoostVisuals(){
    sunOverlay.classList.remove('on');
    if(plantEl){ plantEl.classList.remove('boost'); plantEl.classList.remove('sun-bathing'); }
  }

  /* Boost soleil — TOGGLE + durée courte (8s) */
  function sunOn(){
    if(plantState.boost){ sunOff(); return; } // toggle off si déjà actif
    if(app.energy<40 || app.hyg<40){ say("Pas assez en forme pour bronzer !"); return; }
    plantState.boost=true; plantState.boostEnd=Date.now()+8000; // 8s
    sunOverlay.classList.add('on'); if(plantEl){ plantEl.classList.add('boost'); plantEl.classList.add('sun-bathing'); }
    adjustPlantVital('sunlight', +28);
    adjustPlantVital('mood', +2);
    createSunBurst(sprite);
    spawnPlantRays();
    emitEmojiBurst(plantEl||sprite, ['☀️','✨']);
    runPlantAnimation([
      { transform:'scale(1)' },
      { transform:'scale(1.08)', offset:0.5 },
      { transform:'scale(1)' }
    ], { duration:1200, easing:'ease-in-out' }, 'grow');
    if(sprite && sprite.animate){ sprite.animate([{ transform:'scale(1)' },{ transform:'scale(1.05)', offset:0.4 },{ transform:'scale(1)' }], { duration:900, easing:'ease-out' }); }
    setTimeout(function(){ if(plantEl) plantEl.classList.remove('sun-bathing'); }, 1400);
    say("☀️ Bain de soleil ! Boost 8s");
    setTimeout(function(){ if(plantState.boost) sunOff(); }, 8200);
  }
  function sunOff(){
    plantState.boost=false; plantState.boostEnd=0; clearSunBoostVisuals();
    renderPlantVitals({silent:true});
    queuePlantSave();
    say("🌤 Fin du boost");
  }

  /* Arroser : +XP, coût énergie, cooldown 10s */
  function canWater(){ return Date.now() > plantState.waterCd; }
  function waterOnce(){
    if(!canWater()){ say("Patiente un peu… 💧"); return; }
    if(app.energy<8){ say("Trop fatigué pour arroser."); return; }
    setMeter('energy', app.energy-8);
    adjustPlantVital('hydration', +26);
    adjustPlantVital('mood', +2);
    plantGain(2);
    createRipple(plantEl||sprite);
    spawnPlantDrops();
    emitEmojiBurst(plantEl||sprite, ['💧','🌿']);
    runPlantAnimation([
      { transform:'rotate(0deg)' },
      { transform:'rotate(-3deg)', offset:0.4 },
      { transform:'rotate(2.2deg)', offset:0.75 },
      { transform:'rotate(0deg)' }
    ], { duration:720, easing:'ease-out' }, 'grow');
    plantState.waterCd = Date.now()+10000;
    say("💧 Glou glou !");
    updateAll(); save();
  }

  /* ---------- Actions dock ---------- */
  $("#feed").onclick = function(){ if(!app.alive) return; setMeter('hunger',app.hunger+22); setMeter('hyg',app.hyg-6); setMeter('energy',app.energy+6); setTrait('affection',+1); setTrait('odor',+1); plantGain(1); emitEmojiBurst(sprite,['🍽️']); say("Miam !"); updateAll(); save(); };
  $("#wash").onclick = function(){ if(!app.alive) return; setMeter('hyg',app.hyg+30); setTrait('odor',-3); sprite.classList.add('wash'); setTimeout(function(){sprite.classList.remove('wash');},2100); plantGain(1); say("Tout propre !"); updateAll(); save(); };
  $("#toilet").onclick= function(){ if(!app.alive) return; setMeter('hyg',app.hyg+40); setTrait('odor',-6); plantGain(1); say("🧻 Fiuuut !"); updateAll(); save(); };
  $("#sleep").onclick = function(){ if(!app.alive) return; app.asleep=!app.asleep; say(app.asleep?"Bonne nuit...":"Réveil !"); updateAll(); save(); };
  $("#play").onclick  = function(){ if(!app.alive) return;
    // Animation de jeu + confettis
    sprite.classList.add('playshake'); setTimeout(function(){ sprite.classList.remove('playshake'); }, 820);
    addBurstAround(sprite, '#ffb5cf'); addBurstAround(sprite, '#ffd285'); emitEmojiBurst(sprite,['🎉','😄']);
    setMeter('fun',app.fun+18); setMeter('energy',app.energy-9); setTrait('discipline',+1); setTrait('odor',+1);
    say("On joue !"); updateAll(); save();
  };
  $("#heal").onclick  = function(){ if(!app.alive) return; var low=['hunger','fun','hyg','energy'].some(function(k){ return app[k]<35; }); if(low){['hunger','fun','hyg','energy'].forEach(function(k){ setMeter(k,app[k]+8); }); say("💊 Ça va mieux.");} else say("Pas besoin."); updateAll(); save(); };
  $("#snack").onclick = function(){ if(!app.alive) return; var r=Math.random(); if(r<.33){ setMeter('hunger',app.hunger+16); plantGain(1); say("Snack salé 😋"); } else if(r<.66){ setMeter('fun',app.fun+14); say("Snack sucré 🤤"); } else { setMeter('hunger',app.hunger+8); setTrait('odor',+2); say("Snack douteux 😬"); } updateAll(); save(); };
  $("#spray").onclick = function(){ if(!app.alive) return; setTrait('odor',-6); setMeter('hyg',app.hyg+6); setMeter('energy',app.energy-4); plantGain(1); emitEmojiBurst(sprite,['✨']); say("Pschiiit ! Ça sent bon ✨"); updateAll(); save(); };
  $("#kiss").onclick  = function(){ if(!app.alive) return; setTrait('affection',+3); setMeter('fun',app.fun+6); emitEmojiBurst(sprite,['💗','💞']); say("Bisou 💕"); updateAll(); save(); };
  $("#nap").onclick   = function(){ if(!app.alive) return; setMeter('energy',app.energy+14); setMeter('fun',app.fun-4); app.asleep=false; say("Petite sieste 😴"); updateAll(); save(); };
  $("#water").onclick = function(){ if(!app.alive) return; waterOnce(); };
  $("#sun").onclick   = function(){ if(!app.alive) return; sunOn(); };

  /* Dock centering UX */
  var wrap = document.querySelector('.dockWrap');
  document.getElementById('dock').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    var target = b.offsetLeft - (wrap.clientWidth - b.clientWidth)/2;
    wrap.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    setTimeout(function(){ b.blur(); }, 120);
  });

  /* Double‑tap dance */
  (function(){ var last=0;
    sprite.addEventListener('touchend',function(){var now=Date.now(); if(now-last<300){dance();} last=now;},{passive:true});
    sprite.addEventListener('click',function(){var now=Date.now(); if(now-last<300){dance();} last=now;});
    function dance(){ if(!app.alive) return; document.body.classList.add('disco-on'); sprite.classList.add('dance'); setTimeout(function(){ sprite.classList.remove('dance'); document.body.classList.remove('disco-on'); }, 2800); setMeter('fun',app.fun+10); setMeter('energy',app.energy-6); say("Disco !"); updateAll(); save(); }
  })();

  /* Plant nod on good actions */
  function plantNod(){
    runPlantAnimation([
      { transform:'translateY(0)' },
      { transform:'translateY(-3px)', offset:0.45 },
      { transform:'translateY(0)' }
    ], { duration:520, easing:'ease-out' }, 'grow');
    adjustPlantVital('mood', +0.4, {deferRender:true});
    renderPlantVitals({silent:true});
  }
  ["feed","wash","toilet","snack","spray","water"].forEach(function(id){ $("#"+id).addEventListener('click',plantNod); });

  /* ---------- Ambient: mouche qui traverse ---------- */
  (function(){
    var room = $("#room");
    function spawnStray(){
      if(Math.random()<0.5) return; // pas à chaque tick
      var img=document.createElement('img');
      img.src="img/flies/fly_small.png"; img.className="stray"; img.style.pointerEvents='none'; room.appendChild(img);
      // point de départ aléatoire (gauche->droite ou l’inverse)
      var h=room.clientHeight||window.innerHeight;
      var y = (h*0.25) + Math.random()*(h*0.4);
      var leftToRight = Math.random()>0.5;
      var startX = leftToRight ? -40 : (room.clientWidth+40);
      var endX   = leftToRight ? (room.clientWidth+60) : -60;
      var start = performance.now(); var dur = 4500 + Math.random()*2500;
      function step(t){
        var p=(t-start)/dur; if(p>=1){ img.remove(); return; }
        var x = startX + (endX-startX)*p;
        // petite sinusoïde pour le vol
        var yy = y + Math.sin(p*Math.PI*4)*12;
        var tilt = Math.sin(p*Math.PI*3)*8;
        img.style.transform="translate("+x+"px,"+yy+"px) scale(0.9) rotate("+tilt+"deg)";
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      // retire au cas où
      setTimeout(function(){ img.remove(); }, dur+200);
    }
    // cadence aléatoire : toutes 10–20 s
    setInterval(function(){ spawnStray(); }, 10000);
  })();

  /* ---------- Jeu MOUCHES v3.2 ---------- */
  (function(){
    var modal   = $("#modalFlies");
    var arena   = $("#arenaFlies");
    var scoreEl = $("#scoreFlies");
    var timeEl  = $("#timeFlies");
    var btnOpen = $("#btnFlies");
    var btnClose= $("#closeFlies");

    var A = {
      small:"img/flies/fly_small.png",
      big  :"img/flies/fly_big.png",
      gold :"img/flies/fly_gold.png",
      splat:"img/flies/splat.png",
      spark:"img/flies/spark.png"
    };

    var difficulty = [
      { time:0,  speed:1,    cap:10, cadence:[600,800], weights:{ small:0.88, big:0.10, gold:0.02 } },
      { time:5,  speed:1.2,  cap:12, cadence:[520,720], weights:{ small:0.82, big:0.14, gold:0.04 } },
      { time:10, speed:1.35, cap:14, cadence:[440,640], weights:{ small:0.76, big:0.17, gold:0.07 } },
      { time:15, speed:1.55, cap:16, cadence:[360,520], weights:{ small:0.70, big:0.20, gold:0.10 } }
    ];
    var defaultWeights = { small:0.7, big:0.2, gold:0.1 };
    var flyStats = {
      small:{ speed:55, hp:1, pts:1, src:A.small },
      big  :{ speed:42, hp:2, pts:2, src:A.big },
      gold :{ speed:75, hp:1, pts:5, src:A.gold }
    };
    var currentDifficulty = difficulty[0];

    var medalKey = "cacamochi:fliesMedal";
    var medalOrder = { none:0, bronze:1, argent:2, or:3, platine:4 };
    var bestMedalStored = "none";
    try { bestMedalStored = localStorage.getItem(medalKey) || "none"; }
    catch(_){ bestMedalStored = "none"; }

    var RAF=0, running=false, startTs=0, score=0, spawnTimer=0, timeLeft=20;
    var flies=[];
    var streak=0, bestMultiplier=1, lastKillTs=0;

    function updateScoreDisplay(){
      var mult=Math.max(1,streak);
      scoreEl.textContent = score + " ×" + mult;
    }

    function resetStreak(){
      if(streak>0){
        streak=0;
        updateScoreDisplay();
      }
      lastKillTs=0;
    }

    function registerKill(){
      var now = performance.now();
      if(!lastKillTs || (now-lastKillTs)>800){ streak=1; }
      else { streak++; }
      lastKillTs=now;
      if(streak>bestMultiplier) bestMultiplier=streak;
      updateScoreDisplay();
    }

    function registerMiss(){
      if(!running) return;
      resetStreak();
    }

    function handleMiss(ev){
      if(ev.target && ev.target.classList && ev.target.classList.contains('fly')) return;
      registerMiss();
    }

    function spawnOne(){
      var arenaW=arena.clientWidth, arenaH=arena.clientHeight;
      var img=document.createElement('img');
      var types=['small','big','gold'];
      var weights=currentDifficulty.weights||defaultWeights;
      var total=0;
      var dist=[];
      for(var i=0;i<types.length;i++){
        var t=types[i];
        var weight=Number(weights[t]);
        if(!weight||weight<=0) continue;
        total+=weight;
        dist.push({ type:t, cumulative:total });
      }
      if(total<=0){
        weights=defaultWeights;
        total=0; dist=[];
        for(var j=0;j<types.length;j++){
          var tt=types[j];
          var ww=Number(weights[tt]);
          if(!ww||ww<=0) continue;
          total+=ww;
          dist.push({ type:tt, cumulative:total });
        }
      }
      var draw=Math.random()*total;
      var type=(dist.length?dist[dist.length-1].type:'small');
      for(var k=0;k<dist.length;k++){
        if(draw<dist[k].cumulative){ type=dist[k].type; break; }
      }
      var stats=flyStats[type]||flyStats.small;
      var speed=stats.speed, hp=stats.hp, pts=stats.pts, src=stats.src;
      img.src=src; img.className='fly '+type; img.draggable=false; arena.appendChild(img);
      var mult=currentDifficulty.speed;
      speed*=mult;
      var f={ el:img, x:Math.random()*arenaW, y:Math.random()*arenaH, vx:(Math.random()*2-1)*speed, vy:(Math.random()*2-1)*speed, t:0, hp:hp, pts:pts, dead:false, type:type };
      var hit=function(ev){
        ev.stopPropagation();
        f.hp--;
        var dead=f.hp<=0;
        pop(f.x,f.y,dead,type==='gold');
        if(dead){
          f.dead=true;
          score+=f.pts;
          registerKill();
          img.remove();
        }
      };
      img.addEventListener('mousedown',hit); img.addEventListener('touchstart',hit,{passive:true});
      flies.push(f);
    }
    function pop(x,y,dead,gold){
      var fx=document.createElement('img'); fx.src=dead?A.splat:(A.spark||A.splat); fx.className=dead?'sfx splat':'sfx spark';
      fx.style.left=x+'px'; fx.style.top=y+'px'; arena.appendChild(fx); setTimeout(function(){fx.remove();}, dead?380:600);
      if(gold && A.spark){ var fx2=document.createElement('img'); fx2.src=A.spark; fx2.className='sfx spark'; fx2.style.left=(x+10)+'px'; fx2.style.top=(y-10)+'px'; arena.appendChild(fx2); setTimeout(function(){fx2.remove();},600); }
    }
    function updateDifficulty(elapsed){
      var next=currentDifficulty;
      for(var i=0;i<difficulty.length;i++){
        if(elapsed>=difficulty[i].time) next=difficulty[i];
      }
      if(next!==currentDifficulty){
        currentDifficulty=next;
        scheduleNextSpawn(true);
      }
    }
    function scheduleNextSpawn(force){
      clearTimeout(spawnTimer);
      if(!running) return;
      if(force){ cadence(); return; }
      var range=currentDifficulty.cadence;
      var delay=range[0]+Math.random()*(range[1]-range[0]);
      spawnTimer=setTimeout(cadence, delay);
    }
    function loop(t){
      if(!running) return;
      if(!startTs) startTs=t;
      var dt=Math.min(32, t-(loop.prev||t)); loop.prev=t;
      var w=arena.clientWidth, h=arena.clientHeight;
      for(var i=0;i<flies.length;i++){
        var f=flies[i]; if(f.dead) continue; f.t+=dt;
        if(f.t>400){ f.vx += (Math.random()*2-1)*22; f.vy += (Math.random()*2-1)*22; f.t=0; }
        f.x += f.vx*dt/1000; f.y += f.vy*dt/1000;
        if(f.x<12||f.x>w-12) f.vx*=-1; if(f.y<12||f.y>h-12) f.vy*=-1;
        f.el.style.transform="translate("+f.x+"px,"+f.y+"px)";
      }
      var elapsed=(t-startTs)/1000;
      updateDifficulty(elapsed);
      if(streak>0 && lastKillTs && (t-lastKillTs)>800){ resetStreak(); }
      var remain=Math.max(0, 20 - Math.floor(elapsed));
      if(remain!==timeLeft){ timeLeft=remain; timeEl.textContent=timeLeft; }
      if(elapsed>=20){ stop(true); return; }
      RAF=requestAnimationFrame(loop);
    }
    function cadence(){
      if(!running) return;
      var alive=0; for(var i=0;i<flies.length;i++) if(!flies[i].dead) alive++;
      if(alive<currentDifficulty.cap) spawnOne();
      scheduleNextSpawn(false);
    }
    arena.addEventListener('mousedown',handleMiss);
    arena.addEventListener('touchstart',handleMiss,{passive:true});
    function start(){
      score=0; streak=0; bestMultiplier=1; lastKillTs=0; updateScoreDisplay();
      timeLeft=20; timeEl.textContent='20';
      flies.length=0; loop.prev=0; startTs=0; currentDifficulty=difficulty[0];
      modal.classList.add('on'); running=true;
      requestAnimationFrame(function(){ for(var i=0;i<6;i++) spawnOne(); cadence(); RAF=requestAnimationFrame(loop); });
    }
    function stop(reward){
      running=false; cancelAnimationFrame(RAF); clearTimeout(spawnTimer);
      for(var i=0;i<flies.length;i++){ if(flies[i].el) flies[i].el.remove(); }
      flies.length=0;
      setTimeout(function(){ modal.classList.remove('on'); },150);
      if(reward){
        var combo=Math.max(1,bestMultiplier);
        var effectiveScore=Math.round(score*(1+Math.max(0,combo-1)*0.25));
        var funGain=8, disGain=1, odorGain=-1, plant=1, message="Pas mal.";
        if(effectiveScore>=24){ funGain=24; disGain=4; odorGain=-3; plant=3; message="Maître moucheur !"; }
        else if(effectiveScore>=16){ funGain=18; disGain=3; odorGain=-2; plant=2; message="Chasseur agile !"; }
        else if(effectiveScore>=12){ funGain=16; disGain=2; odorGain=-2; plant=2; message="Bonne chasse !"; }
        var medal='none';
        if(combo>=9) medal='platine';
        else if(combo>=7) medal='or';
        else if(combo>=5) medal='argent';
        else if(combo>=3) medal='bronze';
        var medalBonus={
          bronze:{fun:4, dis:1, odor:0, title:"🥉 Médaille de bronze", label:"🥉 Bronze"},
          argent:{fun:7, dis:2, odor:-1, title:"🥈 Médaille d'argent", label:"🥈 Argent"},
          or:{fun:10, dis:3, odor:-1, title:"🏅 Médaille d'or", label:"🏅 Or"},
          platine:{fun:14, dis:4, odor:-2, title:"🏆 Médaille de platine", label:"🏆 Platine"}
        };
        var prevBest=bestMedalStored;
        if(medal!=='none'){
          var bonus=medalBonus[medal];
          funGain+=bonus.fun; disGain+=bonus.dis; odorGain+=bonus.odor;
          message=bonus.title+" !";
        }
        var recordBeat=false;
        if(medal!=='none' && medalOrder[medal]>medalOrder[prevBest]){
          try{ localStorage.setItem(medalKey, medal); }catch(_){ }
          bestMedalStored=medal; recordBeat=true;
        }
        var comboText="Combo ×"+combo;
        if(!recordBeat && prevBest!=='none'){
          var recordLabel=medalBonus[prevBest]?medalBonus[prevBest].label:prevBest;
          if(medal==='none' || medalOrder[prevBest]>medalOrder[medal]){
            message+=" (Record: "+recordLabel+")";
          } else if(medal===prevBest){
            message+=" (Record égalé)";
          }
        }
        if(recordBeat){ message+=" — Nouveau record !"; }
        message+=" · "+comboText;
        setMeter('fun', app.fun+funGain);
        setTrait('discipline', +disGain);
        setTrait('odor', odorGain);
        plantGain(plant);
        say(message);
        updateAll(); save();
      }
    }
    $("#btnFlies").addEventListener('click', function(){ if(app.alive) start(); });
    $("#closeFlies").addEventListener('click', function(){ stop(false); });
    modal.addEventListener('click', function(e){ if(e.target===modal) stop(false); });
  })();

  /* ---------- Jeu BAIN (Savon Party) ---------- */
  (function(){
    var modal=$("#modalBath"), arena=$("#arenaBath"), scoreEl=$("#scoreBath"), timeEl=$("#timeBath");
    var timer=null, left=20, score=0, alive=false;
    var stains=[], scrubbing=false, lastFoam=0;

    function clearArena(){ arena.innerHTML=''; stains.length=0; }

    function spawnStain(){
      if(!alive) return;
      var w=arena.clientWidth||arena.offsetWidth||0;
      var h=arena.clientHeight||arena.offsetHeight||0;
      if(w<120 || h<120) return;
      var margin=60;
      var x=margin + Math.random()*Math.max(40, w - margin*2);
      var y=margin + Math.random()*Math.max(40, h - margin*2);
      x=Math.max(margin, Math.min(w-margin, x));
      y=Math.max(margin, Math.min(h-margin, y));
      var size=70+Math.random()*36;
      var baseScale=0.8+Math.random()*0.5;
      var angle=Math.random()*50-25;
      var el=document.createElement('div');
      el.className='stain';
      el.style.width=size+'px';
      el.style.height=size+'px';
      el.style.left=x+'px';
      el.style.top=y+'px';
      el.style.transform='translate(-50%,-50%) rotate('+angle+'deg) scale('+baseScale+')';
      var r1=45+Math.random()*25, r2=45+Math.random()*25, r3=45+Math.random()*25, r4=45+Math.random()*25;
      el.style.borderRadius=r1+'% '+r2+'% '+r3+'% '+r4+'%';
      arena.appendChild(el);
      var stain={el:el,x:x,y:y,radius:size*0.55,dirt:100,baseScale:baseScale,angle:angle,lastClean:0};
      stains.push(stain);
      updateStain(stain);
    }

    function updateStain(stain){
      var ratio=Math.max(0, stain.dirt)/100;
      var scale=stain.baseScale*(0.6+0.4*ratio);
      stain.el.style.transform='translate(-50%,-50%) rotate('+stain.angle+'deg) scale('+scale+')';
      stain.el.style.opacity=(0.35+0.6*ratio).toFixed(3);
    }

    function burstFoam(x,y){
      for(var i=0;i<6;i++){
        var f=document.createElement('span');
        f.className='foam burst';
        var ang=Math.random()*Math.PI*2;
        var dist=18+Math.random()*34;
        f.style.left=(x + Math.cos(ang)*6 - 10)+'px';
        f.style.top=(y + Math.sin(ang)*6 - 10)+'px';
        f.style.setProperty('--dx', (Math.cos(ang)*dist)+'px');
        f.style.setProperty('--dy', (Math.sin(ang)*dist)+'px');
        arena.appendChild(f);
        (function(el){ setTimeout(function(){ el.remove(); },700); })(f);
      }
    }

    function spawnTrail(x,y){
      var now=performance.now();
      if(now-lastFoam<40) return;
      lastFoam=now;
      var f=document.createElement('span');
      f.className='foam trail';
      f.style.left=(x-9)+'px';
      f.style.top=(y-9)+'px';
      var driftX=(Math.random()*12-6);
      var driftY=-10-Math.random()*14;
      f.style.setProperty('--dx', driftX+'px');
      f.style.setProperty('--dy', driftY+'px');
      arena.appendChild(f);
      setTimeout(function(){ f.remove(); },450);
    }

    function cleanAt(x,y){
      var now=performance.now();
      for(var i=stains.length-1;i>=0;i--){
        var s=stains[i];
        var dx=x-s.x, dy=y-s.y;
        var radius=s.radius*(0.45+0.55*(s.dirt/100));
        if(dx*dx+dy*dy<=radius*radius){
          if(now - s.lastClean < 45) continue;
          s.lastClean=now;
          s.dirt-=18+Math.random()*12;
          s.el.classList.add('cleaning');
          setTimeout((function(el){ return function(){ el.classList.remove('cleaning'); }; })(s.el),140);
          if(s.dirt<=0){
            burstFoam(s.x,s.y);
            arena.removeChild(s.el);
            stains.splice(i,1);
            score++; scoreEl.textContent=score;
            if(alive){ setTimeout(function(){ if(alive) spawnStain(); },220); }
          } else {
            updateStain(s);
          }
        }
      }
    }

    function maintainStains(){
      var target=4;
      while(alive && stains.length<target){ spawnStain(); }
    }

    function pointerCoords(ev){
      var rect=arena.getBoundingClientRect();
      return {x:ev.clientX-rect.left, y:ev.clientY-rect.top};
    }

    function handleScrub(ev){
      if(!alive) return;
      ev.preventDefault();
      var pos=pointerCoords(ev);
      spawnTrail(pos.x,pos.y);
      cleanAt(pos.x,pos.y);
    }

    function pointerDown(ev){
      if(!alive) return;
      scrubbing=true;
      try{ arena.setPointerCapture(ev.pointerId); }catch(_){ }
      handleScrub(ev);
    }
    function pointerMove(ev){ if(scrubbing) handleScrub(ev); }
    function pointerEnd(ev){
      if(scrubbing){
        try{ arena.releasePointerCapture(ev.pointerId); }catch(_){ }
      }
      scrubbing=false;
    }

    arena.addEventListener('pointerdown', pointerDown);
    arena.addEventListener('pointermove', pointerMove);
    arena.addEventListener('pointerup', pointerEnd);
    arena.addEventListener('pointercancel', pointerEnd);
    arena.addEventListener('pointerleave', pointerEnd);

    function tick(){
      if(!alive) return;
      left--; timeEl.textContent=left;
      if(left<=0){ end(true); return; }
      maintainStains();
      timer=setTimeout(tick,1000);
    }

    function start(){
      modal.classList.add('on');
      score=0; scoreEl.textContent='0';
      left=20; timeEl.textContent='20';
      alive=true; scrubbing=false; lastFoam=0;
      clearTimeout(timer); timer=null;
      clearArena();
      requestAnimationFrame(function(){ if(!alive) return; maintainStains(); timer=setTimeout(tick,1000); });
    }

    function end(reward){
      alive=false; scrubbing=false;
      clearTimeout(timer); timer=null;
      setTimeout(function(){
        modal.classList.remove('on');
        clearArena();
        if(reward){
          var s=score;
          if(s>=14){ setMeter('hyg',app.hyg+32); setMeter('fun',app.fun+18); setTrait('odor',-4); plantGain(2); say("🧼 Champion du spa !"); }
          else if(s>=9){ setMeter('hyg',app.hyg+24); setMeter('fun',app.fun+12); setTrait('odor',-3); plantGain(2); say("🧼 Bain impeccable !"); }
          else { setMeter('hyg',app.hyg+14); setMeter('fun',app.fun+7); setTrait('odor',-2); plantGain(1); say("🧼 Ça mousse bien."); }
          updateAll(); save();
        }
      },200);
    }

    $("#btnBath").addEventListener('click', function(){ if(app.alive) start(); });
    $("#closeBath").addEventListener('click', function(){ end(false); });
    $("#modalBath").addEventListener('click', function(e){ if(e.target===modal) end(false); });
  })();

  /* ---------- Événements aléatoires + temps ---------- */
  setInterval(function(){ if(!app.alive) return; var r=Math.random();
    if(r<.18){ say("Une mouche s’est posée..."); setMeter('hyg',app.hyg-4); setTrait('odor',+1); updateAll(); }
    else if(r<.28){ say("Petit rot discret."); setMeter('hunger',app.hunger+3); setTrait('odor',+1); updateAll(); }
  }, 30000);

  function tick(){ if(!app.alive) return;
    var k=app.asleep?0.45:1;
    setMeter('hunger',app.hunger-0.6*k); setMeter('fun',app.fun-0.45*k); setMeter('hyg',app.hyg-0.35*k);
    setMeter('energy', app.energy-(app.asleep?-0.9:0.7));
    if(['hunger','fun','hyg','energy'].filter(function(x){return app[x]<=0;}).length>=2){ app.alive=false; gameover.classList.add('on'); say("💀 RIP Cacamochi..."); }
    // Fin de boost soleil si temps écoulé
    if(plantState.boost && Date.now()>plantState.boostEnd){ sunOff(); }
    updateAll();
  }
  function newDay(){ if(!app.alive) return; app.day++; say("☀️ Jour "+app.day); setMeter('hyg',app.hyg-5); setMeter('hunger',app.hunger-6); evolveCheck(); save(); updateAll(); }
  setInterval(tick,1200); setInterval(newDay, 1.2*60*1000);

  /* ---------- Évolutions ---------- */
  function evolveCheck(){
    var mood=avg(app.hunger,app.fun,app.hyg,app.energy);
    var clean=app.hyg - app.odor*1.5, playful=app.fun + app.affection, stoic=app.energy - app.discipline*0.5;
    if(app.day>=2 && app.evo==="bouseau"){
      if(clean>=60 && playful>=60) evolveTo("cacabra");
      else if(playful>=65 && clean<60) evolveTo("skatour");
      else if(stoic<45) evolveTo("crottombe");
    }
    if(app.day>=4){
      if(app.evo==="cacabra"   && mood>78 && app.discipline>=4) evolveTo("seigneur");
      if(app.evo==="skatour"   && playful>80)                  evolveTo("skalibur");
      if(app.evo==="crottombe" && (clean<45 || app.energy<40)) evolveTo("thanabouse");
    }
  }
  function evolveTo(next){
    if(app.evo===next) return; app.evo=next;
    var sEl=$("#sprite"); sEl.style.transition="transform .35s ease, filter .35s ease";
    sEl.style.transform="scale(1.1)"; sEl.style.filter="drop-shadow(0 28px 24px var(--shadow)) saturate(1.2)";
    setTimeout(function(){ applySprite(); },120);
    var fx=$("#evolveFX"), rect=sEl.getBoundingClientRect();
    var cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    for(var i=0;i<32;i++){ var a=Math.random()*Math.PI*2, d=60+Math.random()*120; var dx=Math.cos(a)*d, dy=Math.sin(a)*d; var p=document.createElement('div'); p.className='p'; p.style.background='#ffd7e6'; p.style.left=(cx-5)+"px"; p.style.top=(cy-5)+"px"; p.style.setProperty('--tr',"translate("+dx+"px,"+dy+"px)"); document.body.appendChild(p); setTimeout((function(el){return function(){el.remove();};})(p),800); }
    setTimeout(function(){ sEl.style.transform=""; sEl.style.filter=""; },400);
    say("✨ Évolution : "+evoName(next)+" !");
  }

  /* ---------- Restart ---------- */
  $("#restart").onclick = function(){
    var fresh={hunger:70,fun:70,hyg:70,energy:70,day:1,alive:true,asleep:false,evo:"bouseau",affection:0,discipline:0,odor:0};
    for(var k in fresh) app[k]=fresh[k];
    plantState.xp=0; plantState.stage=0; plantState.boost=false; plantState.boostEnd=0; plantState.waterCd=0;
    clearSunBoostVisuals();
    plantRender(); plantSave();
    gameover.classList.remove('on'); applySprite(); updateAll(); save();
  };

  /* ---------- Init ---------- */
  applyBackground(); load(); updateAll(); plantInit();
})();
