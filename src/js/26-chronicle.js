/* ══════════════ 20 · the chronicle ══════════════
   Every holding gets a past. It is derived from its name, so the same name
   always yields the same founder, the same river and the same superstition —
   and then the chronicle keeps writing itself as you build and as days pass. */
function nameSeed(s){
  let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  return h>>>0;
}
const LORE={};
/* Korean particles: pick the allomorph by whether the last syllable has a final consonant */
function josa(s,on,off){ const c=s.charCodeAt(s.length-1);
  return (c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28!==0)?on:off; }
function makeLore(name){
  const r=mulberry32(nameSeed(name.toLowerCase()));
  const p=a=>a[Math.floor(r()*a.length)];
  const given=['알드릭','케올린','로헤이스','아이보','베르트랑','모드','시게어','오도','알리스',
               '레이날드','고디스','와린','에멜린','서스턴','이졸데','풀크'];
  const epithet=['갈대','돌발','느긋한','붉은손','과묵한','아홉손가락',
                 '수달','잿빛','연장자','서리손','굴뚝새','무쇠눈썹'];
  const river=['오브','벨','매로','썰','세지','로치','웬','콜드','브랙'];
  const saint=['케네스','오빈','메로','할가르','이베타','바돌프','윌노스'];
  const why=[
    '매년 봄마다 올라오는 자들로부터 나루를 지키기 위해',
    '소금길이 늪을 돌아나가는 곳을 살피기 위해',
    '이제는 아무도 이름을 기억하지 못하는 전투에서 입은 상처의 보상으로',
    '오래된 홀이 불타고 우물만이 지킬 가치가 남은 유일한 것이었기에',
    '거의 모든 것을 틀리게 본 측량사의 말 한마디에',
    '저쪽 강변에 먼저, 그리고 더 형편없이 지은 사촌을 곯려주려고'
  ];
  const relic=[
    '납 함에 든 성인의 손가락뼈',
    '무슨 짐승이 그려졌는지 아무도 동의하지 못하는 바랜 깃발',
    '매서운 겨울을 앞두고 물을 흘린다는 돌',
    '울리기에는 너무 금이 갔고 녹이기에는 너무 신성한 종',
    '이제는 존재하지 않는 문의 열쇠'
  ];
  const omen=[
    '우물은 결코 얼지 않는다고들 합니다. 기록상 최악의 겨울에도 얼지 않았습니다.',
    '저녁 닫음 기도 후에는 어떤 개도 둑길을 건너지 않습니다. 개들에게는 그럴 이유가 있습니다.',
    '석공들은 하늘의 노여움을 사지 않으려고 돌 하나를 일부러 비뚤게 쌓았습니다.',
    '제비가 성문 아치에 둥지를 틉니다. 쫓아내는 것은 큰 불운으로 여겨집니다.',
    '저녁 종은 두 번 울립니다. 한 번은 산 자를 위해, 한 번은 첫 성벽을 쌓은 이를 위해.',
    '주성 계단에서 불빛이 보인다는 말이 있습니다. 파수꾼은 이제 보고하지 않습니다.'
  ];
  const year=1290+Math.floor(r()*30);
  LORE.name=name;
  LORE.founder=p(given)+' '+p(epithet);
  LORE.river=p(river);
  LORE.saint='성 '+p(saint);
  LORE.year=year;
  LORE.text=
    '<p><b>'+name+'</b>'+josa(name,'은','는')+' '+year+'년에 '+LORE.founder+josa(LORE.founder,'이','가')+' '+p(why)+
    ' 세웠습니다. '+LORE.river+' 강 위에 서 있는데, 이 강은 8월이면 걸어서 건널 만큼 얕아지고 '+
    '3월이면 도무지 건널 수 없게 됩니다.</p>'+
    '<p>예배당이 들어서면 '+LORE.saint+josa(LORE.saint,'을','를')+' 모시는 것으로 되어 있으며, '+
    '실망할 처지에 있는 사람이 자세히 살펴본 적 없는 '+p(relic)+josa(p(relic),'을','를')+' 간직하고 있습니다.</p>'+
    '<p><i>'+p(omen)+'</i></p>';
  LORE.day=1;
  chronicle.length=0;
  chron('첫 돌이 놓였습니다.');
}
const chronicle=[];
const MONTH=['봄','여름','수확철','겨울'];
function stamp(){
  return MONTH[season]+' '+LORE.day+'일차, '+officeFor(hour)[1];
}
function chron(text,quiet){
  if(chronicle.length&&chronicle[0].text===text) return;
  chronicle.unshift({when:stamp(),text:text});
  if(chronicle.length>80) chronicle.pop();
  if(tab==='chronicle') drawChronicle();
  if(!quiet) markChron();
}
let chronUnread=0;
function markChron(){
  if(tab==='chronicle'){ chronUnread=0; return; }
  chronUnread++;
  const b=document.querySelector('#tabs button[data-t="chronicle"]');
  if(b) b.textContent='연대기 ('+chronUnread+')';
}
function drawChronicle(){
  chronUnread=0;
  const b=document.querySelector('#tabs button[data-t="chronicle"]');
  if(b) b.textContent='연대기';
  const el=$('chronicle');
  if(!el) return;
  el.innerHTML='<div id="lore">'+(LORE.text||'')+'</div>'+
    chronicle.map(e=>'<div class="crow"><span class="cwhen">'+e.when+'</span>'+
                      '<span class="ctxt">'+e.text+'</span></div>').join('');
}

/* what is worth writing down */
const FIRST={};
const NOTE={
  keep:'주성이 섰습니다. 물 건너편에서도 보입니다.',
  gate:'성문이 생겼습니다. 오늘부터 모두가 하나의 길로 드나듭니다.',
  tower:'첫 탑이 완성되었고, 벌써 누군가 그 위에 서 있습니다.',
  wall:'성벽의 첫 단이 놓였습니다.',
  chapel:'예배당, SAINT을(를) 모십니다. 석공들은 맥주로 품삯을 받고 공정하다 여겼습니다.',
  cottage:'첫 오두막에 지붕이 얹혔습니다. 초가가 가라앉기도 전에 두 사람이 들어앉았습니다.',
  mill:'방앗간이 돌기 시작했습니다. 방앗간 주인은 정직하다는 소문인데, 이는 드문 일입니다.',
  smithy:'대장간입니다. 망치 소리가 예상보다 멀리 퍼집니다.',
  bakehouse:'빵굽는 집입니다. 오전이면 영지에 빵 냄새가 돕니다.',
  tavern:'주막이 문을 열었습니다. 저녁기도 참석률이 눈에 띄게 좋아졌습니다.',
  granary:'곡물창고입니다. 쥐가 꾀를 부려야 하도록 받침돌 위에 지었습니다.',
  well:'우물을 팠습니다. 약속한 적 없는데 물맛이 답니다.',
  pen:'울타리를 쳤습니다. 가축 떼가 몰려 들어가며 크게 항의합니다.',
  field:'성벽 동쪽에 첫 이랑이 갈렸습니다.',
  orchard:'과수원을 심었습니다. 살아 있는 사람 중 그 절정을 볼 이는 없습니다.',
  dovecote:'비둘기집입니다. 비둘기들이 부름도 없이 하루 만에 와서는 영원히 눌러앉았습니다.',
  jetty:'부교가 물 위로 뻗었습니다. 어부 하나가 끝자락을 제 자리로 주장합니다.',
  beacon:'봉화대가 세워졌습니다. 매일 밤 켜질 것이고, 한 번은 진짜로 켜질 것입니다.',
  bridge:'물에 다리가 놓였습니다.',
  butts:'활터에 과녁이 세워졌습니다. 경비는 서툴게 쏘다가 늘어갑니다.',
  garden:'염소를 막으려고 약초밭에 담을 둘렀습니다.',
  hall:'대저택과 마구간. 저녁 무렵 마당에 말이 섭니다.',
  beehive:'벌통이 벤치에 놓였습니다. 벌들이 마치 당연하다는 듯 자리 잡았습니다.',
  stall:'영지에 노점이 섰습니다. 장사라면 장사입니다.'
};
function notePlaced(key){
  if(FIRST[key]) return;
  FIRST[key]=true;
  const t=NOTE[key];
  if(t) chron(t.replace('SAINT',LORE.saint||'the saint'));
}
function noteDay(){
  LORE.day++;
  const souls=world.count(C.HUMAN), beasts=world.count(C.BEAST);
  if(souls) chron(LORE.day+'일차가 밝았습니다. 주민 '+souls+'명, 가축 '+beasts+
                  '마리, 성문은 제시간에 열렸습니다.');
  else chron(LORE.day+'일차가 빈 땅 위에 밝았습니다.');
}
function noteSeason(){
  const s=SN();
  chron(s.name+josa(s.name,'이','가')+' 찾아왔습니다. '+s.note);
}
