/* =========================================================
   2026 YHITF · 참가정보 확인 API (별도 Apps Script 프로젝트용) v9
   ---------------------------------------------------------
   ※ 기존 신청 프로젝트(doPost·결제 동기화)에 넣지 마세요. 따로 만든 프로젝트에만 둡니다.
   ※ 시트는 "읽기"만 합니다. KOREA DB 구조를 바꾸지 않습니다.

   - v9: 단체 대표자 확인 수정. 10/8부터 대표자명이 '단체명 / 대표자'로 저장돼 대표자 성함만 넣으면 단체로 인식되지 않던 문제.
         이제 '/' 뒤 이름만 넣어도 대표자로 인정합니다. (바뀐 곳: matchRows_의 isRep 한 줄 + repHit_ 함수)
   - v8: 영문 확인 페이지(Check My Entry) 지원
         lang:'en' → 주문번호 조회·전체 정보 보기·입력값 확인도 GLOBAL DB에서 찾고, 모든 안내를 영어로 돌려줍니다.
         해외 번호(+82…, +1…)는 + 를 살려서 보여줍니다. 국문 조회 결과는 v7과 같습니다(입력값 확인 응답에 field 항목만 추가).

   조회: 신청번호(YHITF-P-000123 / YHITF-G-000045) 또는 아임웹 주문번호 + 성함
   - v7: 영문 신청번호(YHITF-EP-… / YHITF-EG-…)는 GLOBAL DB에서 찾습니다. (영문 결제 게이트용)
         lang:'en'으로 부르면 안내 문구를 영어로 돌려줍니다. 국문 조회는 v6와 동일합니다.
   - v6: 같은 입력칸에 주문번호(숫자)를 넣으면 주문번호로 찾습니다.
     주문번호는 본인 계정에서만 보이는 번호라, 주문번호 + 성함이 맞으면 바로 전체 정보를 보여줍니다.
     단체 참가자는 본인 성함 + 주문번호 → 본인 정보만 / 대표자 성함 + 주문번호 → 그 주문의 참가자 전체.
   - 신청번호는 순서대로 매겨져 남이 추측할 수 있으므로 성함을 함께 확인합니다.
   - 결제 전 신청도 "결제 전"으로 보여줍니다.
   - 참가자 성함 → 본인 정보만 / 단체 대표자 성함 → 같은 신청의 참가자 전체.
   - 처음엔 휴대폰·비상연락처·생년월일·주소를 가려서 보여주고,
     아임웹 주문번호까지 맞으면(본인 확인) 가림 없이 전체를 보여줍니다.
   - 같은 신청번호로 5번 연속 틀리면 10분간 조회를 막습니다.
========================================================= */

const CHECK_CFG = {
  SHEET_ID: '1udFXMvkd9iicP-gJyFLBn8RmHwWi4tDZsYu2xJAjvE8',
  SHEET_NAME: 'KOREA DB',
  GLOBAL_SHEET_NAME: 'GLOBAL DB',
  PAID: '결제완료',
  MAX_FAIL: 5,
  MAX_VERIFY: 15,
  LOCK_SEC: 600
};

// KOREA DB 열 위치 (A=0)
const COL = {
  appliedAt: 0, appNo: 1, type: 2, repName: 3, repPhone: 4,
  name: 6, birth: 9, gender: 10, phone: 12, shirt: 13,
  emgName: 14, emgPhone: 15, course: 16, date: 17,
  pay: 20, orderNo: 21, group: 22, address: 25
};


function doPost(e) {
  let b = {};
  try { b = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  const en = b.lang === 'en';
  LANG_EN = en;
  let res;
  if (b.action === 'unlock') res = unlock_(b.appNo, b.name, b.orderNo);
  else if (b.action === 'verify') res = verify_(b.appNo, b.name, b.idx, b.field, b.value);
  else if (b.action === 'verifyPhone') res = verify_(b.appNo, b.name, b.idx, 'phone', b.phone);
  else res = lookup_(b.appNo, b.name);
  return json_(en ? enMsg_(res) : res);
}

function doGet() {
  return json_({ ok: true, service: 'YHITF participant check v8' });
}


/* ---------- 조회 ---------- */
function lookup_(appNoRaw, nameRaw) {
  const ord = orderInput_(appNoRaw);
  if (ord) return lookupByOrder_(ord, nameRaw);
  const appNo = normAppNo_(appNoRaw);
  const name = normName_(nameRaw);
  if (!/^YHITF-E?[PG]-\d{6}$/.test(appNo) || !name) {
    return { ok: false, code: 'INPUT', message: '신청번호(예: YHITF-P-000123) 또는 주문번호와 성함을 정확히 입력해 주세요.' };
  }
  const gate = gate_('fail_' + appNo, CHECK_CFG.MAX_FAIL);
  if (gate) return gate;

  const res = matchRows_(readRows_(/^YHITF-E/.test(appNo) ? CHECK_CFG.GLOBAL_SHEET_NAME : CHECK_CFG.SHEET_NAME), appNo, name);
  if (!res.ok) failed_('fail_' + appNo);
  else CacheService.getScriptCache().remove('fail_' + appNo);
  return res;
}

/* ---------- 주문번호 + 성함으로 조회 (v6) ----------
   - 그 주문번호로 결제된 행만 대상으로 합니다. (같은 신청번호의 다른 주문 행은 보이지 않음)
   - 성함이 맞으면 가린 정보 + 전체 정보(unlocked)를 함께 돌려줍니다.
   - 같은 주문번호로 5번, 같은 성함으로 5번 틀리면 10분간 막습니다. */
function lookupByOrder_(ord, nameRaw) {
  const name = normName_(nameRaw);
  if (!name) return { ok: false, code: 'INPUT', message: '성함을 입력해 주세요.' };
  const kOrd = 'fail_o_' + ord.slice(0, 15), kName = 'fail_on_' + name;
  const gate = gate_(kOrd, CHECK_CFG.MAX_FAIL) || gate_(kName, CHECK_CFG.MAX_FAIL);
  if (gate) return gate;

  const NF = { ok: false, code: 'NOT_FOUND', message: '입력하신 주문번호와 성함이 일치하는 신청 내역이 없습니다. 마이페이지 > 주문내역의 주문번호를 다시 확인해 주세요. (결제 후 반영까지 최대 5~10분이 걸릴 수 있습니다)' };
  const rows = readRows_(LANG_EN ? CHECK_CFG.GLOBAL_SHEET_NAME : CHECK_CFG.SHEET_NAME);
  const hit = {}, apps = [];
  rows.forEach(function(r, i) {
    if (!sameOrder_(ord, digits_(r[COL.orderNo]))) return;
    hit[i] = 1;
    const no = normAppNo_(r[COL.appNo]);
    if (no && apps.indexOf(no) < 0) apps.push(no);
  });

  for (let k = 0; k < apps.length; k++) {
    const m = matchRows_(rows, apps[k], name);
    if (!m.ok) continue;
    m.people = m.people.filter(function(p) { return hit[p.idx]; });
    if (!m.people.length) continue;
    m.app.count = m.people.length;
    m.app.paid = m.people.every(function(p) { return p.paid; });
    if (m.people.length < 2) m.scope = 'self';
    m.via = 'order';
    const open = m.people.filter(function(p) { return p.canUnlock; });
    if (open.length) m.unlocked = { ok: true, orderNo: digits_(rows[open[0].idx][COL.orderNo]), people: fullPeople_(rows, open) };
    CacheService.getScriptCache().remove(kOrd);
    CacheService.getScriptCache().remove(kName);
    return m;
  }
  failed_(kOrd); failed_(kName);
  return NF;
}

/* 입력값이 주문번호(영문 없이 숫자 10자리 이상)면 숫자만 돌려줌 */
function orderInput_(v) {
  const s = String(v == null ? '' : v).trim();
  if (/[A-Za-z]/.test(s)) return '';
  const d = digits_(s);
  return d.length >= 10 ? d : '';
}
/* 주문번호 비교: 같거나, 품목주문번호(뒤에 몇 자리 더 붙은 번호)도 인정 */
function sameOrder_(entered, own) {
  return !!own && (entered === own || (entered.indexOf(own) === 0 && entered.length <= own.length + 4));
}

/* 같은 신청번호의 행 중, 성함이 맞는 대상만 골라 가린 정보로 돌려줌 */
function matchRows_(rows, appNo, name) {
  const app = [];
  rows.forEach(function(r, i) { if (normAppNo_(r[COL.appNo]) === appNo) app.push({ r: r, idx: i }); });
  const NOT_FOUND = { ok: false, code: 'NOT_FOUND', message: '입력하신 신청번호와 성함이 일치하는 신청 내역이 없습니다. 다시 확인해 주세요.' };
  if (!app.length) return NOT_FOUND;

  const isRep = app.some(function(x) { return repHit_(x.r[COL.repName], name); });
  const self = app.filter(function(x) { return nameHit_(x.r, name); });
  if (!isRep && !self.length) return NOT_FOUND;

  const target = isRep ? app : self;
  const first = target[0].r;
  const paidCount = target.filter(function(x) { return isPaid_(x.r); }).length;

  return {
    ok: true,
    scope: (isRep && app.length > 1) ? 'group' : 'self',
    app: {
      appNo: appNo,
      type: String(first[COL.type] || ''),
      group: /^(해당없음|-)?$/.test(String(first[COL.group] || '').trim()) ? '' : String(first[COL.group]).trim(),
      count: target.length,
      paid: paidCount === target.length
    },
    people: target.map(function(x) {
      const r = x.r, st = state_(r);
      return {
        idx: x.idx,
        paidElsewhere: st.key === 'paid' ? [] : paidElsewhere_(rows, r, appNo),
        canUnlock: st.key !== 'cancel' && !!digits_(r[COL.orderNo]),
        paid: st.key === 'paid',
        state: st.key,
        status: st.label,
        appliedAt: fmtDate_(r[COL.appliedAt], true),
        name: String(r[COL.name] || ''),
        course: String(r[COL.course] || ''),
        date: fmtDate_(r[COL.date], false) || String(r[COL.date] || ''),
        gender: String(r[COL.gender] || ''),
        birth: maskBirth_(r[COL.birth]),
        phone: LANG_EN ? maskIntl_(r[COL.phone] || r[COL.repPhone]) : maskPhone_(phoneOf_(r)),
        shirt: String(r[COL.shirt] || ''),
        emergency: (r[COL.emgName] || r[COL.emgPhone]) ? (maskName_(r[COL.emgName]) + ' ' + (LANG_EN ? maskIntl_(r[COL.emgPhone]) : maskPhone_(digits_(r[COL.emgPhone])))).trim() : '',
        address: maskAddress_(r[COL.address])
      };
    })
  };
}


/* 결제 안 된 신청인데, 같은 사람(성함 + 휴대폰 또는 생년월일 일치)이 다른 신청번호로 결제를 끝낸 경우
   → 그 신청번호를 알려줘서 "어느 게 진짜인지" 헷갈리지 않게 함 (주문 직전에 나갔다가 다시 신청한 경우) */
function paidElsewhere_(rows, r, appNo) {
  const nm = normName_(r[COL.name]), ph = normPhone_(phoneOf_(r)), bd = birth8_(r[COL.birth]);
  if (!nm) return [];
  const out = [];
  rows.forEach(function(o) {
    const no = normAppNo_(o[COL.appNo]);
    if (no === appNo || !isPaid_(o) || normName_(o[COL.name]) !== nm) return;
    const samePh = ph && normPhone_(phoneOf_(o)) === ph;
    const sameBd = bd && birth8_(o[COL.birth]) === bd;
    if ((samePh || sameBd) && out.indexOf(no) < 0) out.push(no);
  });
  return out;
}


/* ---------- 주문번호로 본인 확인 → 가림 없이 전체 정보 ----------
   - 아임웹 주문번호는 본인 계정(마이페이지)에서만 보이는 번호라 본인 확인 수단으로 씁니다.
   - 행마다 주문번호(V열)를 비교하므로, 같은 신청번호 안에 주문이 여러 개여도 그 주문의 행만 열립니다.
   - "수기-202610..." 처럼 수기 처리한 행도 숫자만 비교해 그대로 동작합니다.
   - 품목주문번호(주문번호 뒤에 몇 자리가 더 붙은 번호)를 넣어도 인정합니다.
   - 취소된 행, 주문번호가 없는 행(주문 완료 전)은 열리지 않습니다.
   - 같은 신청번호로 5번 틀리면 10분간 막습니다. */
function unlock_(appNoRaw, nameRaw, orderNoRaw) {
  const appNo = normAppNo_(appNoRaw), name = normName_(nameRaw);
  const entered = digits_(orderNoRaw);
  if (entered.length < 10) return { ok: false, code: 'INPUT', message: '주문번호를 숫자로 정확히 입력해 주세요. (예: 202610081234567)' };

  const key = 'unlock_' + appNo;
  const gate = gate_(key, CHECK_CFG.MAX_FAIL);
  if (gate) return gate;

  const rows = readRows_(sheetOf_(appNo));
  const m = matchRows_(rows, appNo, name);
  if (!m.ok) { failed_('fail_' + appNo); return m; }

  const opened = m.people.filter(function(p) {
    const r = rows[p.idx];
    if (!p.canUnlock) return false;
    return sameOrder_(entered, digits_(r[COL.orderNo]));
  });

  if (!opened.length) {
    failed_(key);
    const left = Math.max(0, CHECK_CFG.MAX_FAIL - Number(CacheService.getScriptCache().get(key) || 0));
    return { ok: false, code: 'ORDER_MISMATCH', left: left,
      message: '주문번호가 일치하지 않습니다. 마이페이지 > 주문내역의 주문번호를 다시 확인해 주세요.' + (left ? ' (남은 시도 ' + left + '회)' : ' 10분 후 다시 시도해 주세요.') };
  }
  CacheService.getScriptCache().remove(key);

  return {
    ok: true,
    orderNo: digits_(rows[opened[0].idx][COL.orderNo]),
    people: fullPeople_(rows, opened)
  };
}

function fullPeople_(rows, list) {
  return list.map(function(p) {
    const r = rows[p.idx];
    return {
      idx: p.idx,
      birth: fullBirth_(r[COL.birth]),
      phone: LANG_EN ? rawPhone_(r[COL.phone] || r[COL.repPhone]) : fmtPhone_(phoneOf_(r)),
      emergency: [String(r[COL.emgName] || '').trim(), LANG_EN ? rawPhone_(r[COL.emgPhone]) : fmtPhone_(digits_(r[COL.emgPhone]))].filter(String).join(' '),
      emgName: String(r[COL.emgName] || '').trim(),
      emgPhone: LANG_EN ? rawPhone_(r[COL.emgPhone]) : fmtPhone_(digits_(r[COL.emgPhone])),
      address: String(r[COL.address] || '').trim()
    };
  });
}
function fmtPhone_(d) {
  d = normPhone_(d || '');
  if (!d) return '';
  if (/^01\d{9}$/.test(d)) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  if (/^01\d{8}$/.test(d)) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
  if (/^02\d{7,8}$/.test(d)) return d.slice(0, 2) + '-' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
  if (/^0\d{9,10}$/.test(d)) return d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  return d;   // 형식이 이상한 번호도 있는 그대로 보여줘야 오타를 알아볼 수 있음
}
function fullBirth_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy. MM. dd');
  const d = digits_(v);
  if (d.length === 8) return d.slice(0, 4) + '. ' + d.slice(4, 6) + '. ' + d.slice(6);
  return String(v == null ? '' : v).trim();
}


/* ---------- 내가 입력한 정보가 맞는지 확인 (일치 여부만 응답, 실제 값은 보여주지 않음) ----------
   field: phone(본인 휴대폰) / emgPhone(비상연락처 번호) / birth(생년월일) */
const VERIFY_FIELDS = {
  phone:    { label: '휴대폰 번호',       get: function(r) { return normPhone_(phoneOf_(r)); }, norm: function(v) { return normPhone_(digits_(v)); }, min: 10 },
  emgPhone: { label: '비상연락처 번호',   get: function(r) { return normPhone_(digits_(r[COL.emgPhone])); }, norm: function(v) { return normPhone_(digits_(v)); }, min: 9 },
  birth:    { label: '생년월일',          get: function(r) { return birth8_(r[COL.birth]); }, norm: function(v) { return digits_(v); }, min: 8 }
};

function verify_(appNoRaw, nameRaw, idx, field, valueRaw) {
  const appNo = normAppNo_(appNoRaw), name = normName_(nameRaw);
  const f = VERIFY_FIELDS[field];
  if (!f) return { ok: false, code: 'INPUT', message: '확인할 항목을 선택해 주세요.' };
  const value = f.norm(valueRaw);
  if (value.length < f.min) return { ok: false, code: 'INPUT', message: f.label + '을(를) 숫자로 정확히 입력해 주세요.' };

  const gate = gate_('verify_' + appNo, CHECK_CFG.MAX_VERIFY);
  if (gate) return gate;

  const rows = readRows_(sheetOf_(appNo));
  const m = matchRows_(rows, appNo, name);
  if (!m.ok) { failed_('fail_' + appNo); return m; }
  const allowed = m.people.some(function(p) { return p.idx === Number(idx); });
  if (!allowed) return { ok: false, code: 'NOT_FOUND', message: '확인할 수 없는 참가자입니다.' };

  failed_('verify_' + appNo);   // 확인 횟수 제한(일치·불일치 모두 카운트)
  const saved = f.get(rows[Number(idx)]);
  const match = !!saved && (saved === value || (field !== 'birth' && intlSame_(saved, value)));
  return {
    ok: true,
    match: match,
    field: field,
    message: match
      ? '등록된 ' + f.label + '과(와) 일치합니다.'
      : '등록된 ' + f.label + '과(와) 다릅니다. 마이페이지 > 1:1 문의로 수정을 요청해 주세요. (2026년 11월 27일(금) 18:00까지)'
  };
}
function normPhone_(d) { return (d.length === 10 && d.indexOf('10') === 0) ? '0' + d : d; }
function birth8_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyyMMdd');
  const d = digits_(v);
  return d.length === 8 ? d : '';
}


/* ---------- helpers ---------- */
function readRows_(sheetName) {
  return SpreadsheetApp.openById(CHECK_CFG.SHEET_ID).getSheetByName(sheetName || CHECK_CFG.SHEET_NAME)
    .getDataRange().getValues().slice(1);
}
function gate_(key, max) {
  const n = Number(CacheService.getScriptCache().get(key) || 0);
  return n >= max ? { ok: false, code: 'LOCKED', message: '조회 시도가 많아 잠시 제한되었습니다. 10분 후 다시 시도해 주세요.' } : null;
}
function failed_(key) {
  const c = CacheService.getScriptCache();
  c.put(key, String(Number(c.get(key) || 0) + 1), CHECK_CFG.LOCK_SEC);
  Utilities.sleep(400);
}
/* 결제상태(U) + 주문번호(V)로 화면 표시 상태 결정 */
function state_(r) {
  const s = String(r[COL.pay] || '').replace(/\s/g, '');
  const hasOrder = !!String(r[COL.orderNo] || '').trim();
  if (s === CHECK_CFG.PAID) return { key: 'paid', label: '결제완료' };
  if (s === '취소') return { key: 'cancel', label: '취소' };
  if (s === '부분취소확인' || s === '결제확인필요') return { key: 'check', label: '확인 중' };
  if (hasOrder) return { key: 'deposit', label: '입금 확인 전' };
  return { key: 'none', label: '결제 전' };
}
function isPaid_(r) { return String(r[COL.pay] || '').replace(/\s/g, '') === CHECK_CFG.PAID; }
function phoneOf_(r) { return digits_(r[COL.phone]) || digits_(r[COL.repPhone]); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function digits_(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
/* 대표자명은 10/8부터 '단체명 / 대표자' 형태로 저장됨 → 전체 또는 '/' 뒤 이름 둘 다 인정 */
function repHit_(rep, name) {
  if (!name) return false;
  const s = String(rep == null ? '' : rep);
  if (normName_(s) === name) return true;
  const parts = s.split('/');
  return parts.length > 1 && normName_(parts[parts.length - 1]) === name;
}
function normName_(v) { return String(v == null ? '' : v).replace(/\s/g, '').toLowerCase(); }
function normAppNo_(v) {
  const s = String(v == null ? '' : v).toUpperCase().replace(/\s/g, '');
  const m = s.match(/^(?:YHITF-?)?(E?[PG])-?(\d{1,6})$/);
  return m ? 'YHITF-' + m[1] + '-' + ('000000' + m[2]).slice(-6) : s;
}
function maskName_(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (s.length <= 2) return s[0] + '*';
  return s[0] + '*'.repeat(s.length - 2) + s[s.length - 1];
}
function maskPhone_(d) {
  if (!d) return '';
  if (d.length === 10 && d.indexOf('10') === 0) d = '0' + d;
  if (d.length < 8) return '*'.repeat(d.length);
  return d.slice(0, 3) + '-****-' + d.slice(-4);
}
function maskBirth_(v) {
  if (v instanceof Date) return v.getFullYear() + '. **. **';
  const m = String(v || '').match(/(19|20)\d{2}/);
  return m ? m[0] + '. **. **' : '';
}
function maskAddress_(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const parts = s.split(/\s+/);
  return parts.slice(0, Math.min(2, parts.length)).join(' ') + ' ***';
}
function fmtDate_(v, withTime) {
  if (!(v instanceof Date)) return '';
  return Utilities.formatDate(v, 'Asia/Seoul', withTime ? 'yyyy. MM. dd HH:mm' : 'yyyy. MM. dd');
}

/* 편집기 테스트: 실제 신청번호·성함 넣고 실행 → 로그 확인 */
function testCheck() {
  Logger.log(JSON.stringify(lookup_('YHITF-P-000001', '여기에성함'), null, 2));
}


/* ---------- v7: 영문(GLOBAL DB) 지원 ---------- */
/* 참가자명 열 외에 First/Last Name 조합도 인정 (영문 이름 순서 차이 대비) */
function nameHit_(r, name) {
  if (normName_(r[COL.name]) === name) return true;
  const fn = normName_(r[7]), ln = normName_(r[8]);
  return !!(fn || ln) && (fn + ln === name || ln + fn === name);
}
/* 영문 안내 문구 (v8: 모든 응답 코드) */
var LANG_EN = false;
function sheetOf_(appNo) { return /^YHITF-E/.test(appNo) ? CHECK_CFG.GLOBAL_SHEET_NAME : CHECK_CFG.SHEET_NAME; }
/* 해외 번호는 + 를 살려서 그대로 보여줌 (시트가 숫자로 바꿔 + 가 빠진 경우 국가번호로 시작하면 + 를 붙임) */
function maskIntl_(v) {
  const s = rawPhone_(v);
  if (!/^\+/.test(s)) return maskPhone_(digits_(s));
  const d = digits_(s);
  return d.length < 8 ? '+' + '*'.repeat(d.length) : '+' + d.slice(0, 2) + ' ****' + d.slice(-4);
}
function rawPhone_(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (/^\+/.test(s)) return s;
  const d = digits_(s);
  if (/^0/.test(d)) return s;            // 국내 형식(010…)은 입력값 그대로
  if (d.length >= 11) return '+' + d;    // 821012345678 → +821012345678
  return s;
}
/* 국가번호 유무만 다른 같은 번호 인정: +82 10-1234-5678 = 010-1234-5678 */
function intlSame_(a, b) {
  const n = function(x) { x = String(x || '').replace(/^00/, ''); if (/^82/.test(x)) x = '0' + x.slice(2); return x; };
  if (n(a) === n(b)) return true;
  return a.length >= 9 && b.length >= 9 && a.slice(-9) === b.slice(-9) && Math.abs(a.length - b.length) <= 3;
}
function enMsg_(res) {
  if (!res) return res;
  if (res.ok) {
    if (res.match !== undefined) {
      const L = { phone: 'mobile number', emgPhone: 'emergency contact number', birth: 'date of birth' }[res.field] || 'information';
      res.message = res.match
        ? 'This matches the ' + L + ' on your registration.'
        : 'This does not match the ' + L + ' on your registration. Please request a correction via MYPAGE > Support (by 18:00 KST, Fri, Nov 27, 2026).';
    }
    return res;
  }
  const M = {
    INPUT: 'Please enter your registration number (e.g. YHITF-EP-000123) or order number, and your name exactly as registered.',
    NOT_FOUND: 'No registration matches the information you entered. Please check your registration number (or order number in MYPAGE > Order History) and name. New payments may take 5–10 minutes to appear.',
    LOCKED: 'Too many attempts. Please try again in 10 minutes.',
    ORDER_MISMATCH: 'The order number does not match. Please check the order number in MYPAGE > Order History.' + (res.left ? ' (' + res.left + ' attempt' + (res.left > 1 ? 's' : '') + ' left)' : ' Please try again in 10 minutes.')
  };
  if (res.code === 'INPUT' && /주문번호/.test(res.message || '') && !/신청번호/.test(res.message || '')) M.INPUT = 'Please enter the order number in digits (e.g. 202610081234567).';
  if (res.code === 'INPUT' && /성함/.test(res.message || '') && !/신청번호|주문번호/.test(res.message || '')) M.INPUT = 'Please enter your name.';
  if (res.code === 'INPUT' && /확인할 항목|숫자로/.test(res.message || '') && !/주문번호|신청번호/.test(res.message || '')) M.INPUT = 'Please enter the value in digits exactly as registered.';
  res.message = M[res.code] || 'We could not verify your registration. Please try again later.';
  return res;
}
