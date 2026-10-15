/* 자주묻는질문 v2 빌더: 기존 코드(window.__faq)에서 스타일과 답변을 가져와 카테고리 탭 구조로 재조립 */
(function(){
const src=window.__faq.replace(/\r\n/g,'\n');
const style=src.slice(src.indexOf('<style>')+7,src.indexOf('</style>'));
const d=new DOMParser().parseFromString(src,'text/html');
const O=[...d.querySelectorAll('.faq-item')].map(it=>it.querySelector('.faq-answer-content').innerHTML.replace(/<span class="answer-mark"[^>]*>A\.<\/span>/,'').trim());
const o=n=>O[n-1];
const CATS=[['pay','참가신청·결제'],['info','정보 확인·변경'],['group','개인·단체'],['cancel','취소·환불'],['race','대회 운영']];
const F=[
['pay','참가신청서만 작성하면 접수가 완료되나요?','<p>아니요. <strong>참가비 결제까지 완료해야 최종 접수</strong>됩니다.</p><p>결제 후 <strong>주문 완료 화면(주문번호 표시)까지 꼭 확인</strong>해 주세요. 주문번호 없이 참가신청서를 작성한 것만으로는 신청 접수로 인정되지 않습니다.</p><p>결제 후 참가정보 확인에 반영되기까지 최대 5~10분이 걸릴 수 있습니다.</p>'],
['pay','참가신청서를 작성했는데 결제 화면으로 넘어가지 않아요.',o(15)],
['pay','무통장입금은 어디로 하면 되나요?','<p><strong>주문 완료 화면에 표시된 계좌</strong>로 입금해 주세요. 주문의 결제 정보에 표시된 금액을 확인한 후 입금해 주세요.</p><p>입금 계좌는 <strong>마이페이지 → 신청내역조회 → 해당 신청 건 → 하단 ‘결제 정보’</strong>에서도 확인하실 수 있습니다.</p><p>※ 입금자명이 주문 시 입력한 입금자명과 다르면 입금이 조회되지 않을 수 있습니다.</p><p>※ 단체신청의 경우 <strong>입금자명을 신청서에 입력한 단체명과 동일하게</strong> 입력해 주세요.</p>'],
['pay','무통장입금했는데 결제대기로 표시됩니다.',o(14)],
['pay','현금영수증은 어떻게 신청하나요?',o(11)],
['pay','카드 결제 영수증은 어디서 확인하나요?',o(12)],
['info','참가정보 확인은 어떻게 하나요?','<p>홈페이지 <strong>안내·문의 → 참가정보 확인</strong>에서 신청번호 또는 주문번호와 성함으로 조회할 수 있습니다.</p><p>신청 종목, 참가자 정보, 결제 상태를 반드시 확인해 주세요. 잘못 입력한 정보로 인해 발생하는 문제의 책임은 신청자 본인에게 있습니다.</p><p>결제했는데 조회되지 않는다면 <strong>추가로 결제하지 마시고</strong> 신청번호·주문번호(확인 가능한 경우)와 결제 시각을 적어 1:1 문의를 남겨 주세요.</p>'],
['info','참가정보를 수정할 수 있나요?',o(6)],
['info','참가 종목이나 날짜를 변경하려면 어떻게 하나요?',o(5)],
['group','단체 신청과 개인 신청은 무엇이 다른가요?',o(3)],
['group','기존 단체에 참가자를 추가하려면 어떻게 하나요?',o(1)],
['group','개인으로 신청했는데 단체로 변경할 수 있나요?',o(2)],
['group','단체 부스가 있나요?',o(17)],
['cancel','취소 신청은 어떻게 하나요?','<p><strong>마이페이지 → 신청내역조회 → 해당 신청 건 → 취소 신청</strong>을 눌러 주세요.</p><ul><li><strong>카드 결제:</strong> 취소 신청 시 자동으로 취소됩니다.</li><li><strong>그 외 결제수단:</strong> 취소 신청 후 1:1 문의에 <strong>신청번호·주문번호·참가자명·환불받을 계좌(은행·계좌번호·예금주)</strong>를 남겨 주시면 순차적으로 처리해 드립니다.</li></ul><p>※ 단체 신청 중 일부 인원만 취소하는 경우 전체 주문을 취소하지 마시고 1:1 문의를 먼저 남겨 주세요.</p><p>※ 실제 환불 반영까지는 결제수단 및 카드사 정책, 영업일 등에 따라 일정 기간이 소요될 수 있습니다.</p>'],
['cancel','취소·환불 마감은 언제이며, 이후에는 왜 변경할 수 없나요?',o(7)],
['cancel','단체신청에서 일부 인원만 취소하려면 어떻게 하나요?',o(4)],
['cancel','주문 취소 후 환불은 언제 처리되나요?','<p><strong>카드 결제</strong>는 취소 신청 시 자동으로 취소되며, <strong>그 외 결제수단</strong>은 1:1 문의 확인 후 순차적으로 환불해 드립니다.</p><p>취소 접수와 실제 환불 완료 시점은 다를 수 있으며, 결제수단 및 카드사 정책, 영업일 등에 따라 반영까지 일정 기간이 소요될 수 있습니다.</p>'],
['cancel','환불 내역은 어디서 확인하나요?',o(9)],
['race','배번과 사전 기념품은 어떻게 받나요?',o(16)],
['race','코스별 제한시간(Cut-off)은 어떻게 되나요?','<ul><li><strong>15KM TRAIL RUN:</strong> 제한시간 4시간 | 중도 컷오프 타임 없음</li><li><strong>28KM TRAIL RUN:</strong> 제한시간 7시간 30분 | CP2에서 4시간 30분 (제한시간) 적용</li></ul><p>제한시간 또는 컷오프 타임을 초과하면 운영요원의 경기 중단 안내에 따라야 하며, 기록은 인정되지 않습니다.</p><p>※ 5KM · 10KM RUNNING의 제한시간은 공식 홈페이지를 통해 안내합니다.</p>'],
['race','입상 순위는 어떤 기록을 기준으로 결정되나요?',o(18)],
['race','완주기록증은 어떻게 받을 수 있나요?',o(20)]
];
const css=`
#yhitf-faq .faq-cats{width:min(1280px,calc(100% - 80px));margin:0 auto 28px;display:flex;flex-wrap:wrap;gap:8px}
#yhitf-faq .faq-cat{height:46px;padding:0 20px;border:1.5px solid var(--line);border-radius:999px;background:#fff;color:#555;font-family:inherit;font-size:16px;font-weight:700;letter-spacing:-.02em;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
#yhitf-faq .faq-cat[aria-selected="true"]{background:var(--blue);border-color:var(--blue);color:#fff}
#yhitf-faq .faq-item[hidden]{display:none}
@media(hover:hover){#yhitf-faq .faq-cat:hover{border-color:var(--blue);color:var(--blue)}#yhitf-faq .faq-cat[aria-selected="true"]:hover{color:#fff}}
@media(max-width:768px){#yhitf-faq .faq-cats{width:calc(100% - 32px);margin-bottom:20px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}#yhitf-faq .faq-cats::-webkit-scrollbar{display:none}#yhitf-faq .faq-cat{flex:none;height:42px;padding:0 16px;font-size:15px}}
`;
const items=F.map((f,i)=>{const n=i+1;return `<div class="faq-item" data-cat="${f[0]}"><button type="button" class="faq-question" aria-expanded="false" aria-controls="faq-answer-${n}" id="faq-question-${n}"><span class="faq-q" aria-hidden="true">Q.</span><span class="faq-question-text">${f[1]}</span><span class="faq-icon" aria-hidden="true"></span></button><div class="faq-answer" id="faq-answer-${n}" role="region" aria-labelledby="faq-question-${n}"><div class="faq-answer-inner"><div class="faq-answer-content"><span class="answer-mark" aria-hidden="true">A.</span>${f[2]}</div></div></div></div>`;}).join('\n');
const tabs=CATS.map((c,i)=>`<button type="button" class="faq-cat" role="tab" data-cat="${c[0]}" aria-selected="${i?'false':'true'}">${c[1]}</button>`).join('');
const js=`<script>
(function(){
  var root=document.getElementById('yhitf-faq'); if(!root) return;
  var items=root.querySelectorAll('.faq-item'), cats=root.querySelectorAll('.faq-cat');
  function closeAll(){ [].forEach.call(items,function(it){ it.classList.remove('open'); it.querySelector('.faq-question').setAttribute('aria-expanded','false'); }); }
  function show(c){
    closeAll();
    [].forEach.call(cats,function(b){ b.setAttribute('aria-selected', b.getAttribute('data-cat')===c?'true':'false'); });
    [].forEach.call(items,function(it){ it.hidden = it.getAttribute('data-cat')!==c; });
  }
  [].forEach.call(cats,function(b){ b.addEventListener('click',function(){ show(b.getAttribute('data-cat')); }); });
  [].forEach.call(items,function(item){
    var button=item.querySelector('.faq-question');
    button.addEventListener('click',function(){
      var isOpen=item.classList.contains('open'); closeAll();
      if(!isOpen){ item.classList.add('open'); button.setAttribute('aria-expanded','true'); }
    });
  });
  show('${CATS[0][0]}');
})();
<\/script>`;
window.__faqNew=`<!-- 2026 YHITF 자주묻는질문 v2 (카테고리 탭) -->\n<style>${style}${css}</style>\n<section id="yhitf-faq"><div class="faq-cats" role="tablist">${tabs}</div><div class="faq-wrap">\n${items}\n</div></section>\n${js}\n`;
})();
