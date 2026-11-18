/**
 * 2026 YHITF 단체 명단 (읽기 전용) — 별도 파일·별도 프로젝트
 * - 참가신청 DB는 읽기만 한다 (getValues 1회). DB에 쓰지 않고, DB의 잠금(LockService)도 쓰지 않는다.
 * - 갱신: 매일 05시 1회 + 명단 파일의 '지금 새로고침' 체크박스
 * - 기준: KOREA DB 결제상태 '결제완료' + W열 단체명(빈칸·'해당없음' 제외), 부스 = 결제완료 20명 이상
 */
const DB_ID = '1udFXMvkd9iicP-gJyFLBn8RmHwWi4tDZsYu2xJAjvE8';
const OUT_ID = '1a-x8ItmWZhsg1OM3jrIsC6ZYQe4FpokQ6HSF1QIpevo';
const BOOTH_MIN = 20;
const COLS = ['단체명','신청번호','참가자명','참가종목','날짜','성별','티셔츠사이즈','참가자연락처','신청유형','대표자명','신청일시'];

function refreshGroups() {
  const t0 = Date.now();
  const db = SpreadsheetApp.openById(DB_ID).getSheetByName('KOREA DB');
  const last = db.getLastRow();
  const v = db.getRange(1, 1, last, 23).getValues();   // A:W, 한 번만 읽기
  const readMs = Date.now() - t0;
  const h = v[0], ix = n => h.indexOf(n);
  const iStat = ix('결제상태'), iGrp = ix('단체명');
  const rows = [];
  for (let r = 1; r < v.length; r++) {
    const g = String(v[r][iGrp] || '').trim();
    if (v[r][iStat] !== '결제완료' || !g || g === '해당없음') continue;
    rows.push(COLS.map(c => c === '단체명' ? g : v[r][ix(c)]));
  }
  // 단체별 집계
  const map = {}, events = {};
  rows.forEach(x => { const g = x[0], e = String(x[3]); map[g] = map[g] || {n: 0, e: {}}; map[g].n++; map[g].e[e] = (map[g].e[e] || 0) + 1; events[e] = 1; });
  const ev = Object.keys(events).sort();
  const groups = Object.keys(map).sort((a, b) => map[b].n - map[a].n || a.localeCompare(b, 'ko'));
  const nameN = {}; groups.forEach(g => nameN[g] = map[g].n);
  rows.sort((a, b) => nameN[b[0]] - nameN[a[0]] || String(a[0]).localeCompare(String(b[0]), 'ko') || String(a[3]).localeCompare(String(b[3])) || String(a[2]).localeCompare(String(b[2]), 'ko'));

  const out = SpreadsheetApp.openById(OUT_ID);
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
  const booth = groups.filter(g => map[g].n >= BOOTH_MIN).length;
  const head = `${groups.length}팀 · ${rows.length}명 · 부스 대상 ${booth}팀 (결제완료 ${BOOTH_MIN}명 이상)`;

  // 요약 탭
  const s = sheet_(out, '단체 요약');
  s.getRange(5, 1, Math.max(s.getMaxRows() - 4, 1), Math.max(s.getMaxColumns(), 1)).clearContent().clearFormat();
  const sh = [['단체명', '결제완료 인원', '부스'].concat(ev)];
  groups.forEach(g => sh.push([g, map[g].n, map[g].n >= BOOTH_MIN ? '부스 대상' : ''].concat(ev.map(e => map[g].e[e] || ''))));
  s.getRange(5, 1, sh.length, sh[0].length).setValues(sh);
  s.getRange(5, 1, 1, sh[0].length).setFontWeight('bold').setBackground('#1E45C8').setFontColor('#ffffff');
  if (groups.length) s.getRange(6, 1, groups.length, sh[0].length).setBackgrounds(groups.map(g => sh[0].map(() => map[g].n >= BOOTH_MIN ? '#DFF3E4' : null)));
  header_(s, head, now);

  // 명단 탭
  const m = sheet_(out, '명단');
  if (m.getFilter()) m.getFilter().remove();
  m.getRange(5, 1, Math.max(m.getMaxRows() - 4, 1), Math.max(m.getMaxColumns(), 1)).clearContent().clearFormat();
  const mh = [['단체명', '부스', '단체 인원'].concat(COLS.slice(1))];
  rows.forEach(x => mh.push([x[0], nameN[x[0]] >= BOOTH_MIN ? '부스 대상' : '', nameN[x[0]]].concat(x.slice(1))));
  if (m.getMaxRows() < mh.length + 5) m.insertRowsAfter(m.getMaxRows(), mh.length + 5 - m.getMaxRows());
  m.getRange(5, 1, mh.length, mh[0].length).setValues(mh);
  m.getRange(5, 1, 1, mh[0].length).setFontWeight('bold').setBackground('#1E45C8').setFontColor('#ffffff');
  m.getRange(5, 1, mh.length, mh[0].length).createFilter();
  m.setFrozenRows(5);
  header_(m, head, now);

  console.log(`읽기 ${readMs}ms · 전체 ${Date.now() - t0}ms · ${groups.length}팀 ${rows.length}명`);
}

function sheet_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }
function header_(sh, head, now) {
  sh.getRange('A1').setValue('2026 YHITF 단체 명단 (결제완료 기준 · 읽기 전용)').setFontSize(14).setFontWeight('bold');
  const cb = sh.getRange('A2'); cb.insertCheckboxes(); cb.setValue(false);
  sh.getRange('B2').setValue('← 체크하면 지금 현황으로 새로고침 (10초쯤 걸려요)').setFontColor('#666666');
  sh.getRange('A3').setValue(head).setFontWeight('bold');
  sh.getRange('D2').setValue('마지막 갱신: ' + now).setFontColor('#666666');
}

/** 체크박스 클릭 → 새로고침 (이 명단 파일에만 걸리는 트리거) */
function onCheckRefresh(e) {
  if (!e || !e.range || e.range.getA1Notation() !== 'A2' || e.value !== 'TRUE') return;
  const lock = LockService.getScriptLock();          // 이 프로젝트 전용 잠금 (DB와 무관)
  if (!lock.tryLock(1000)) return;
  try { e.range.getSheet().getRange('B2').setValue('새로고침 중…'); SpreadsheetApp.flush(); refreshGroups(); }
  finally { lock.releaseLock(); }
}

/** 처음 한 번만 실행: 트리거 설치 */
function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('refreshGroups').timeBased().atHour(5).everyDays(1).inTimezone('Asia/Seoul').create();
  ScriptApp.newTrigger('onCheckRefresh').forSpreadsheet(OUT_ID).onEdit().create();
  const out = SpreadsheetApp.openById(OUT_ID);
  const s1 = out.getSheets()[0]; if (s1.getName() !== '단체 요약' && !out.getSheetByName('단체 요약')) s1.setName('단체 요약');
}
