/* ══════════════ 14 · interface ══════════════ */
const $=id=>document.getElementById(id);
const elRun=$('run'),elClock=$('clock'),elOffice=$('office'),elDoing=$('doing'),
      elSun=$('sun'),elLit=$('lit'),elDial=$('dial'),
      elN=[$('n1'),$('n2'),$('n3')],elK=[$('k1'),$('k2'),$('k3')],
      elWork=$('workbench'),elTools=$('tools'),elGroundTools=$('groundtools'),
      elSite=$('sitename'),elHint=$('hint'),elTitle=$('title'),elPerf=$('perf');
let sayHold=0, shownOffice=null, bare=false;
function setBare(v){
  bare=v;
  $('hud').classList.toggle('bare',v);
  const btn=$('bare');
  btn.textContent=v?'보이기':'숨기기';
  btn.title=v?'패널 다시 보이기 (H)':'패널 숨기기 (H)';
  btn.setAttribute('aria-pressed',String(v));
  updateMarkers();
  if(v){
    if(ghost) ghost.visible=false;
    lineGhost.visible=false; ghostArrow.visible=false; brushRing.visible=false;
  }
}
function say(t){ if(t){ elDoing.textContent=t; sayHold=6; } }
function setName(n){
  const first=!LORE.name;
  holdName=(n||'').trim()||holdName;
  if(first||LORE.name!==holdName){ makeLore(holdName); if(tab==='chronicle') drawChronicle(); }
  elTitle.firstChild.nodeValue=holdName;
  document.title='CASTELLAN — '+holdName;
}

(function marks(){
  [[2,'깊은 밤'],[5,'새벽'],[6,'아침'],[9,'오전'],[12,'정오'],[15,'오후'],[18,'저녁'],[21,'저녁 닫음']]
  .forEach(m=>{
    const d=document.createElement('div'); d.className='mark';
    d.style.left=(m[0]/24*100)+'%'; d.innerHTML='<b>'+m[1]+'</b>';
    elDial.appendChild(d);
  });
})();
(function buildPalette(){
  const groups={};
  Object.keys(PIECES).forEach(k=>{(groups[PIECES[k].group]=groups[PIECES[k].group]||[]).push(k);});
  Object.keys(groups).forEach(gname=>{
    const toGround=(gname==='Ground');
    const row=document.createElement('div'); row.className='group';
    const lab=document.createElement('span'); lab.className='glab';
    lab.textContent=toGround?'지형 붓':({Defence:'방어',Dwelling:'주거',Work:'생산',Land:'조경'})[gname]||gname;
    row.appendChild(lab);
    groups[gname].forEach(k=>{
      const btn=document.createElement('button');
      btn.className='tool'+(PIECES[k].warn?' warn':'')+(PIECES[k].dig?' dig':'');
      btn.type='button'; btn.dataset.k=k; btn.textContent=PIECES[k].label;
      btn.setAttribute('aria-pressed',String(k===tool));
      row.appendChild(btn);
    });
    (toGround?elGroundTools:elTools).appendChild(row);
  });
  const allTools=()=>[...document.querySelectorAll('.tool')];
  function choose(k){
    tool=k; anchor=null; ghostRot=0; ghostFlip=false;
    allTools().forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.k===k)));
    brushRing.visible=false;
    makeGhost(); updateMarkers();
    say(PIECES[k].tip||('땅을 클릭해 배치하세요: '+PIECES[k].label));
  }
  const onClick=e=>{ const btn=e.target.closest('.tool'); if(btn) choose(btn.dataset.k); };
  elTools.addEventListener('click',onClick);
  elGroundTools.addEventListener('click',onClick);
  window.__choose=choose;
})();

/* ── the two tabs ── */
let tab='build', lastPiece='cottage';
/* the arrows are a placing aid, so they show only while a piece is in hand */
function updateMarkers(){
  markers.visible=(mode==='build'&&!bare&&tab==='build'&&!isSculpt()&&tool!=='remove');
}
function setTab(t){
  tab=t;
  $('tabTerrain').hidden=(t!=='terrain');
  $('tabBuild').hidden=(t!=='build');
  $('tabHolding').hidden=(t!=='holding');
  $('tabChronicle').hidden=(t!=='chronicle');
  [...$('tabs').children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.t===t)));
  if(t==='terrain'){
    if(!isSculpt()) lastPiece=tool;
    window.__choose(isSculpt()?tool:'raise');
  }else if(t==='build'){
    window.__choose(isSculpt()?lastPiece:tool);
  }else if(t==='holding'){
    drawReport();
    say('영지가 무엇을 갖췄고 무엇이 모자란지 보여줍니다. 지을 때마다 갱신됩니다.');
  }else{
    drawChronicle();
    say(holdName+'의 연대기입니다. 지을 때마다 스스로 써 내려갑니다.');
  }
  updateMarkers();
}
$('tabs').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(b) setTab(b.dataset.t);
});

/* is this door inside the walls? cast a ray out and count crossings */
function barriers(){
  const segs=idx.walls.map(r=>({a:r.meta.a,b:r.meta.b}));
  idx.gates.forEach(r=>{                       // a gatehouse closes the gap it sits in
    const m=r.meta.mid, f=r.meta.front;
    const dx=f.x-m.x, dz=f.z-m.z, L=Math.hypot(dx,dz)||1;
    const px=-dz/L*4.4, pz=dx/L*4.4;
    segs.push({a:{x:m.x+px,z:m.z+pz},b:{x:m.x-px,z:m.z-pz}});
  });
  return segs;
}
function enclosed(p,segs){
  segs=segs||barriers();
  if(!segs.length) return false;
  let inside=0;
  [[0.317,900],[900,0.211],[-0.443,-900]].forEach(d=>{   // three rays, majority wins
    let n=0;
    const far={x:p.x+d[0],z:p.z+d[1]};
    for(let i=0;i<segs.length;i++) if(segCross(p,far,segs[i].a,segs[i].b)) n++;
    if(n%2===1) inside++;
  });
  return inside>=2;
}
function report(){
  const rows=[];
  const dwell=idx.cottages.length+idx.halls.length+idx.taverns.length+idx.keeps.length;
  const souls=dwell*2;
  const plots=allPlots().length;
  const doors=[].concat(
    idx.cottages.map(r=>r.meta.door),idx.halls.map(r=>r.meta.door),
    idx.taverns.map(r=>r.meta.door),idx.keeps.map(r=>r.meta.door));
  const push=(lab,state,txt)=>rows.push({lab:lab,state:state,txt:txt});

  if(!dwell) push('지붕','bad','아직 사는 사람이 없습니다. <b>오두막 한 채에 두 명이 삽니다.</b>');
  else push('지붕',souls>=8?'ok':'thin',
    dwell+'채 지붕 아래 <b>'+souls+'</b>명이 살 수 있습니다.');

  if(!plots) push('식량','bad','곡식을 심은 땅이 없습니다. <b>밭 하나가 약 여섯 명을 먹입니다.</b>');
  else{
    const fed=Math.round(plots*1.6);
    push('식량',fed>=souls?'ok':'thin',
      '주민 '+souls+'명에 약 <b>'+fed+'</b>명분의 밭과 과수원.'+
      (fed<souls?' 밭 하나면 격차를 메울 수 있습니다.':''));
  }
  push('빵집',idx.bakehouses.length?'ok':'thin',
    idx.bakehouses.length?'빵굽는 집이 있어 정오에 집까지 가지 않고 먹습니다.'
      :'빵굽는 집이 없습니다. 우물가에서 쉴 뿐입니다.');
  push('저장',idx.granaries.length?'ok':(plots?'thin':'ok'),
    idx.granaries.length?'곡물창고가 수확을 거둬들입니다.'
      :(plots?'수확을 넣을 곳이 없습니다. <b>곡물창고는 기둥값을 합니다.</b>':'아직 저장할 것이 없습니다.'));

  if(!idx.wells.length) push('물','bad','우물이 없습니다. <b>정오가 되면 모든 일이 우물에서 멈춥니다.</b>');
  else{
    const near=doors.filter(d=>idx.wells.some(w=>Math.hypot(w.x-d.x,w.z-d.z)<34)).length;
    push('물',near===doors.length?'ok':'thin',
      near===doors.length?'모든 문이 우물에서 걸을 만한 거리에 있습니다.'
        :'전체 '+doors.length+'채 중 <b>'+(doors.length-near)+'</b>채가 우물에서 멉니다.');
  }
  const segs=barriers();
  const inside=doors.filter(d=>enclosed(d,segs)).length;
  push('성벽',!idx.walls.length?'bad':(inside>=Math.ceil(doors.length*0.6)?'ok':'thin'),
    !idx.walls.length?'탁 트인 땅. <b>둘러싸인 것이 없습니다.</b>'
      :(inside===doors.length?'모든 가옥이 성벽 안쪽에 있습니다.'
        :doors.length+'채 중 <b>'+inside+'</b>채가 성벽 안쪽, '+
          (doors.length-inside)+'채는 밖에 서 있습니다.'));
  push('파수',idx.towers.length?'ok':'thin',
    idx.towers.length?'탑 '+idx.towers.length+'개, 성벽 위 파수 '+idx.towers.length+'명.'
      :'탑이 없어 파수도 없습니다.');
  push('성문',!idx.walls.length?'ok':(idx.gates.length?'ok':'bad'),
    !idx.walls.length?'성벽이 없어 성문도 필요 없습니다.'
      :(idx.gates.length?'성문이 있어 모두가 그곳으로 다닙니다.'
        :'<b>성문 없는 성벽.</b> 사람들이 돌을 뚫고 지나다니게 됩니다.'));
  push('가축',idx.pens.length?'ok':'thin',
    idx.pens.length?'우리 '+idx.pens.length+'곳, 낮에는 공용목장으로 나갑니다.'
      :'우리가 없어 가축도 없습니다.');
  push('장사',idx.stalls.length?'ok':'thin',
    idx.stalls.length?'노점 '+idx.stalls.length+'곳이 하루 종일 서 있습니다.'
      :'영지에 노점이 없습니다.');
  push('신앙',idx.chapels.length||idx.taverns.length?'ok':'thin',
    (idx.chapels.length?'예배당과 시간을 지키는 수도사들. ':'예배당이 없습니다. ')+
    (idx.taverns.length?'저녁의 주막.':'저녁기도 후 갈 곳이 없습니다.'));

  const score=Math.round(100*rows.reduce((s,r)=>s+(r.state==='ok'?1:(r.state==='thin'?0.45:0)),0)/rows.length);
  return {rows:rows,score:score};
}
function drawReport(){
  const r=report();
  const el=$('report');
  el.innerHTML=r.rows.map(x=>
    '<div class="rrow '+x.state+'"><span class="dot"></span>'+
    '<span class="lab">'+x.lab+'</span><span class="txt">'+x.txt+'</span></div>').join('');
  $('standing').textContent=r.score+' / 100';
}
function refreshCensus(){
  if(mode==='build'){
    elK[0].textContent='가옥'; elK[1].textContent='생산'; elK[2].textContent='방어';
    elN[0].textContent=idx.cottages.length+idx.halls.length+idx.taverns.length+idx.keeps.length;
    elN[1].textContent=idx.fields.length+idx.orchards.length+idx.stalls.length+idx.wells.length+
                       idx.smithies.length+idx.mills.length+idx.chapels.length+idx.pens.length+
                       idx.granaries.length+idx.bakehouses.length+idx.gardens.length+
                       idx.beehives.length+idx.jetties.length+idx.dovecotes.length;
    elN[2].textContent=idx.walls.length+idx.towers.length+idx.gates.length+
                       idx.butts.length+idx.beacons.length;
  }else{
    elK[0].textContent='주민'; elK[1].textContent='가축'; elK[2].textContent='외출';
    let souls=0,abroad=0;
    world.query([C.HUMAN,C.RENDER,C.TRANSFORM]).forEach(e=>{
      if(!world.get(e,C.RENDER).visible) return;
      souls++;
      const tr=world.get(e,C.TRANSFORM);
      if(Math.hypot(tr.x-idx.centre.x,tr.z-idx.centre.z)>30) abroad++;
    });
    souls+=world.count(C.WATCH);
    elN[0].textContent=souls;
    elN[1].textContent=world.count(C.BEAST)+world.count(C.BIRD)+world.count(C.CART);
    elN[2].textContent=abroad;
  }
}
function setSeal(){
  if(mode==='build'){
    elRun.classList.remove('running');
    elRun.innerHTML='하루<br>시작<span class="sub">건설 중</span>';
    elRun.setAttribute('aria-pressed','false');
  }else{
    elRun.classList.toggle('running',running);
    elRun.innerHTML=(running?'하루<br>멈춤':'하루<br>시작')+
      '<span class="sub">'+(running?'진행 중':'멈춤')+'</span>';
    elRun.setAttribute('aria-pressed',String(running));
  }
}
function setMode(m){
  if(m===mode) return;
  mode=m; anchor=null; sculpting=null;
  const build=(m==='build');
  elWork.hidden=!build;
  updateMarkers();
  elSite.textContent=build?'건설 중':'하루 풍경';
  elHint.textContent=build?'땅 클릭 배치 · , . 회전/뒤집기 · Z 실행 취소'
                          :'드래그 회전 · 휠 확대 · 스페이스 멈춤';
  [...$('modes').children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===m)));
  if(build){
    clearPop(); running=false; makeGhost();
    say(tab==='terrain'?'붓으로 드래그해 땅을 깎습니다.'
                       :'팔레트에서 집을 고른 뒤 땅을 클릭해 배치하세요.');
  }else{
    if(ghost)ghost.visible=false;
    lineGhost.visible=false; ghostArrow.visible=false; brushRing.visible=false;
    indexBuild(); buildPop(); world.singletons.clock.bucket=-1; retask(); running=true;
    say(world.count(C.HUMAN)?officeFor(hour)[2]
      :'아직 돌릴 것이 없습니다. 돌아가서 오두막 한두 채를 지어 보세요.');
  }
  setSeal(); refreshCensus();
}
$('bare').addEventListener('click',()=>{
  if(Panels.dragged('bare')){ Panels.clearDrag('bare'); return; }
  setBare(!bare);
});
$('modes').addEventListener('click',e=>{const b=e.target.closest('button'); if(b) setMode(b.dataset.m);});
elRun.addEventListener('click',()=>{
  if(Panels.dragged()){ Panels.clearDrag(); return; }   // that was a move, not a press
  if(mode==='build') setMode('run'); else { running=!running; setSeal(); }
});
$('detail').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.q==='auto'){ QUALITY.auto=true; applyQuality(QUALITY.detected); }
  else { QUALITY.auto=false; applyQuality(b.dataset.q); }
  [...e.currentTarget.children].forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
});
$('music').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  const v=parseFloat(b.dataset.v);
  [...e.currentTarget.children].forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  if(v<=0){ Music.stop(); say('음악을 껐습니다.'); }
  else if(!Music.start(v)) say('이 브라우저에서는 소리를 낼 수 없습니다.');
  else say(v<0.5?'음악, 작게.':'음악이 켜졌습니다. 시각과 계절을 따라갑니다.');
});
$('season').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  season=parseInt(b.dataset.s,10);
  [...e.currentTarget.children].forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  applySeason(); Music.season(season); noteSeason();
  if(mode==='run') retask();
  say(SN().name+'. '+SN().note);
});
$('pace').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  pace=parseFloat(b.dataset.p);
  [...e.currentTarget.children].forEach(c=>c.setAttribute('aria-pressed',String(c===b)));
});
function regenerate(msg,keepEdits){
  if(!keepEdits) EDIT.fill(0);
  clearBuild(); shapeTerrain(); scatter(); indexBuild();
  if(mode==='run') setMode('build');
  say(msg);
}
$('newland').addEventListener('click',()=>{
  land.seed=Math.floor(Math.random()*1e9); seedNoise(land.seed);
  regenerate('새 땅입니다. 지었던 것은 모두 사라졌습니다.');
});
$('preset').addEventListener('click',()=>{
  if(mode==='run') setMode('build');
  preset(); say('기본 설계가 놓였습니다. 마음대로 바꾼 뒤 하루를 돌려 보세요.');
});
$('clear').addEventListener('click',()=>{
  clearBuild(); indexBuild();
  if(mode==='run') setMode('build');
  say('모두 지웠습니다. 계곡은 다시 당신의 것입니다.');
});
$('mount').addEventListener('click',e=>{
  land.mount=!land.mount;
  e.currentTarget.setAttribute('aria-pressed',String(land.mount));
  regenerate(land.mount?'언덕과 물 해자가 둘렸습니다. 다리를 놓아야 드나들 수 있습니다.'
                       :'평지에 해자 없음. 방어는 이제 직접 만드셔야 합니다.',true);
});
$('relief').addEventListener('input',e=>{
  land.relief=parseFloat(e.target.value);
  if(!placed.length){ shapeTerrain(); reseatScenery(); }
});
$('relief').addEventListener('change',()=>{
  const had=placed.length;
  regenerate(had?'땅을 다시 깎아, 그 위에 서 있던 것들이 무너졌습니다.':'땅을 다시 깎았습니다.',true);
});
$('brush').addEventListener('input',e=>{ brush=parseFloat(e.target.value); });
$('waterlvl').addEventListener('input',e=>{
  WATER=parseFloat(e.target.value); water.position.y=WATER; shapeTerrain();
});
$('waterlvl').addEventListener('change',()=>{
  rebuildAll(); reseatScenery(); indexBuild();
  say(WATER>-1.2?'물이 높습니다. 낮은 땅이 많이 잠겼습니다.'
                :'수위를 정했습니다. 그 아래는 물에 잠깁니다.');
});
$('resetcuts').addEventListener('click',()=>{
  EDIT.fill(0); shapeTerrain(); rebuildAll(); reseatScenery(); indexBuild();
  say('깎은 흔적이 되돌려졌습니다. 땅은 생성된 그대로입니다.');
});
$('rename').addEventListener('click',()=>{
  if(elTitle.querySelector('#retitle')) return;
  const inp=document.createElement('input');
  inp.id='retitle'; inp.value=holdName; inp.maxLength=26;
  elTitle.firstChild.nodeValue='';
  elTitle.insertBefore(inp,elTitle.firstChild);
  inp.focus(); inp.select();
  let closed=false;
  const done=commit=>{
    if(closed) return; closed=true;
    const v=inp.value; inp.remove();
    setName(commit?v:holdName);
  };
  inp.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Enter'){e.preventDefault(); done(true);}
    if(e.key==='Escape'){e.preventDefault(); done(false);}
  });
  inp.addEventListener('blur',()=>done(true));
});

(function dial(){
  let on=false;
  const set=e=>{
    const r=elDial.getBoundingClientRect();
    hour=clamp((e.clientX-r.left)/r.width,0,0.9999)*24;
    if(mode==='run') retask();
  };
  elDial.addEventListener('pointerdown',e=>{on=true; try{elDial.setPointerCapture(e.pointerId);}catch(x){} set(e);});
  elDial.addEventListener('pointermove',e=>{if(on)set(e);});
  elDial.addEventListener('pointerup',()=>on=false);
  elDial.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){hour=(hour+0.5)%24; if(mode==='run')retask(); e.preventDefault();}
    if(e.key==='ArrowLeft'){hour=(hour+23.5)%24; if(mode==='run')retask(); e.preventDefault();}
  });
})();

(function bind(){
  const el=renderer.domElement;
  let drag=null; const pts=new Map(); let pinch=0;
  el.addEventListener('pointerdown',e=>{
    try{el.setPointerCapture(e.pointerId);}catch(x){}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(mode==='build'&&!bare&&isSculpt()&&e.button===0&&!e.shiftKey&&pts.size===1){
      const hit=pickGround(e.clientX,e.clientY);
      if(hit){ sculpting={x:hit.x,z:hit.z,level:ground(hit.x,hit.z)}; drag=null; return; }
    }
    drag={x:e.clientX,y:e.clientY,pan:(e.button===1||e.button===2||e.shiftKey),moved:0,btn:e.button};
  });
  el.addEventListener('pointermove',e=>{
    if(sculpting){
      const hit=pickGround(e.clientX,e.clientY);
      if(hit){ sculpting.x=hit.x; sculpting.z=hit.z; }
      updateGhost(e.clientX,e.clientY);
      return;
    }
    if(!pts.has(e.pointerId)){ if(mode==='build') updateGhost(e.clientX,e.clientY); return; }
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2){
      const v=[...pts.values()],d=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);
      if(pinch) cam.dist*=pinch/d;
      pinch=d; applyCam(); return;
    }
    if(!drag) return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    drag.x=e.clientX; drag.y=e.clientY; drag.moved+=Math.abs(dx)+Math.abs(dy);
    if(drag.pan){
      const s=cam.dist*0.0016;
      cam.tx-=(Math.cos(cam.yaw)*dx-Math.sin(cam.yaw)*dy)*s;
      cam.tz+=(Math.sin(cam.yaw)*dx+Math.cos(cam.yaw)*dy)*s;
      cam.tx=clamp(cam.tx,-HALF,HALF); cam.tz=clamp(cam.tz,-HALF,HALF);
    }else{ cam.yaw-=dx*0.005; cam.pitch+=dy*0.004; }
    applyCam();
    if(mode==='build') updateGhost(e.clientX,e.clientY);
  });
  const up=e=>{
    if(sculpting){ sculpting=null; pts.delete(e.pointerId); afterSculpt(); return; }
    const wasDrag=drag;
    pts.delete(e.pointerId); if(pts.size<2)pinch=0; if(!pts.size)drag=null;
    if(wasDrag&&wasDrag.moved<6&&wasDrag.btn===0&&mode==='build'&&!bare&&pts.size===0){
      doPlace(e.clientX,e.clientY);
      updateGhost(e.clientX,e.clientY);
    }
  };
  el.addEventListener('pointerup',up);
  el.addEventListener('pointercancel',e=>{
    if(sculpting){sculpting=null; afterSculpt();}
    pts.delete(e.pointerId); if(!pts.size)drag=null;
  });
  el.addEventListener('contextmenu',e=>e.preventDefault());
  el.addEventListener('wheel',e=>{e.preventDefault(); cam.dist*=Math.exp(e.deltaY*0.0011); applyCam();},{passive:false});
})();

let keysOpen=false;
function toggleKeys(v){
  keysOpen=(v===undefined)?!keysOpen:v;
  document.getElementById('keys').hidden=!keysOpen;
}
document.getElementById('keysclose').addEventListener('click',()=>toggleKeys(false));
document.getElementById('keys').addEventListener('click',e=>{
  if(e.target.id==='keys') toggleKeys(false);
});
const keys=Object.create(null);
function toolAt(n){
  const box=document.getElementById(tab==='terrain'?'tabTerrain':'tabBuild');
  if(!box) return;
  const list=[...box.querySelectorAll('.tool')];
  if(list[n]) list[n].click();
}
function ringBell(){
  const nxt=OFFICES.find(o=>o[0]>hour+0.02);
  hour=nxt?nxt[0]:0.0;
  if(mode==='run') retask();
  say(officeFor(hour)[1]+'을(를) 알리는 종이 울립니다.');
}
function setPhoto(v){
  photo=v; setBare(v); if(!v) camAuto=0;
  say(v?'사진 모드 - 카메라가 떠다닙니다. P 또는 Esc로 돌아옵니다.':'다시 작업으로.');
}
addEventListener('keyup',e=>{ keys[e.code]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'){ if(e.key==='Escape') e.target.blur(); return; }
  keys[e.code]=true;
  const k=e.key;
  if(k==='?'){ toggleKeys(); e.preventDefault(); return; }
  if(k==='p'||k==='P'){ setPhoto(!photo); return; }
  if(k==='h'||k==='H'){ setBare(!bare); return; }
  if(k==='r'||k==='R'){ ringBell(); return; }
  if(k==='Escape'){
    if(keysOpen){ toggleKeys(false); return; }
    if(photo){ setPhoto(false); return; }
    if(anchor){ anchor=null; lineGhost.visible=false; ghostArrow.visible=false; say('취소했습니다.'); return; }
    if(mode==='run'){ running=!running; setSeal(); say(running?'진행 중.':'멈췄습니다.'); }
    return;
  }
  if(e.code==='Space'&&e.target.tagName!=='BUTTON'){
    e.preventDefault();
    if(mode==='build') setMode('run'); else { running=!running; setSeal(); }
    return;
  }
  if(k==='z'||k==='Z'){ undo(); return; }
  if(k>='0'&&k<='9'&&mode==='build'){ toolAt(k==='0'?9:(+k-1)); e.preventDefault(); return; }
  if(mode!=='build') return;
  const def=PIECES[tool];
  if(k==='['){ sizeBy(-1); return; }
  if(k===']'){ sizeBy(1); return; }
  if(k===','||k==='.'){
    if(def&&def.line){ ghostFlip=!ghostFlip; say('난간이 반대쪽으로 바뀌었습니다.'); }
    else { ghostRot+=(k===','?-1:1)*(e.shiftKey?PI/36:PI/12); makeGhost(); }
  }
});


let hudT=0;
function hud(dt){
  hudT-=dt; if(hudT>0) return; hudT=0.12;
  const hh=Math.floor(hour),mm=Math.floor((hour-hh)*60);
  elClock.textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  const o=officeFor(hour);
  sayHold-=0.12;
  elOffice.textContent=o[1];
  if(mode==='run'&&sayHold<=0&&shownOffice!==o[1]){ elDoing.textContent=o[2]; shownOffice=o[1]; }
  const p=hour/24*100;
  elSun.style.left=p+'%'; elLit.style.width=p+'%';
  elSun.classList.toggle('moon',nightF>0.55);
  elDial.setAttribute('aria-valuenow',hour.toFixed(1));
  elDial.setAttribute('aria-valuetext',elClock.textContent+', '+o[1].toLowerCase());
  refreshCensus();
  const info=renderer.info.render;
  elPerf.textContent=Math.round(fps)+' fps · '+info.calls+' calls · '+QUALITY.now.label.toLowerCase();
}


