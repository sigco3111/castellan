/* ══════════════ 21 · the welcome ══════════════ */
const NAMES=['아침언덕','개울마루','돌담골','매부리','안개들','솔바람','잿빛마루',
             '물결막','떡갈골','홍매지','늪지대','까치봉','들창성','버들가','모래톱',
             '잔돌마을','샘터골','바람재'];
const gate=$('gate'), nameIn=$('name');
nameIn.value=pick(NAMES);
$('roll').addEventListener('click',()=>{
  let n=pick(NAMES); if(n===nameIn.value) n=pick(NAMES);
  nameIn.value=n; nameIn.focus();
});
function begin(withPlan){
  setName(nameIn.value);
  const on=$('wantmusic').getAttribute('aria-pressed')==='true';
  if(on) Music.start(0.55);
  [...$('music').children].forEach(x=>
    x.setAttribute('aria-pressed',String(on?x.dataset.v==='0.55':x.dataset.v==='0')));
  if(withPlan){
    preset();
    placed.forEach(r=>{ FIRST[r.key]=true; });
    chron('영지는 마지막 성주가 남겨 둔 그대로 서 있습니다: 성벽과 주성, 그리고 '+
          '남이 대신 값을 치른 방앗간.',true);
  } else { clearBuild(); indexBuild(); }
  $('hud').hidden=false;
  requestAnimationFrame(()=>Panels.init());
  updateMarkers();
  refreshCensus();
  setTab(withPlan?'build':'terrain');
  say(withPlan?'기본 설계가 이미 서 있습니다. 바꾸거나, 지우거나, 그대로 하루를 돌려 보세요.'
              :'텅 빈 계곡입니다. 지형 탭에서 땅을 다듬은 뒤 건설 탭으로 옮기세요.');
  gate.classList.add('gone');
  setTimeout(()=>gate.remove(),700);
}
$('wantmusic').addEventListener('click',e=>{
  const on=e.currentTarget.getAttribute('aria-pressed')!=='true';
  e.currentTarget.setAttribute('aria-pressed',String(on));
  e.currentTarget.textContent=on?'음악 켬':'음악 끔';
});
$('startPlan').addEventListener('click',()=>begin(true));
$('startEmpty').addEventListener('click',()=>begin(false));
nameIn.addEventListener('keydown',e=>{ if(e.key==='Enter') begin(true); });
