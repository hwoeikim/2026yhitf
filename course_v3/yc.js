/* YHITF 대회코스 컴포넌트 v3 (2026-10-31)
   사용: <div class="yc-root" data-lang="ko|en" data-mode="full|compact" data-gpx="URL" data-more="URL"></div>
   + <script src=".../course_v3/data.js"></script><script src=".../course_v3/yc.js"></script>
   지도: MapLibre GL + OpenFreeMap(positron) 색 재지정 / 고도: 회색 망점 + 오렌지 능선 */
(function () {
  var ML_JS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
  var ML_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
  var STYLE = 'https://tiles.openfreemap.org/styles/positron';
  var BLUE = '#002ACF', ORANGE = '#FF6D07', INK = '#141518';
  var PAL = { bg: '#F5F7F6', green: '#D9F0E1', wood: '#CDEAD7', water: '#CFE3F4', bld: '#E9ECEF', road: '#FFFFFF', cas: '#E2E5E9', label: '#7A808A', halo: '#FFFFFF' };
  var HT = { step: 3.2, depth: 70, R: 1.25, col: '#C9CED6', line: ORANGE, lw: 1.8 };

  var T = {
    ko: {
      title: '대회코스', dist: '거리', gain: '누적 상승', limit: '제한시간', cp: 'CP', course: '코스', road: '평지', roadU: '로드', ea: '개소',
      gpx: ' GPX 다운로드', more: '코스 자세히 보기', start: 'START', cutoff: '컷오프', peak: '최고점',
      C: {
        5: { n: '5KM RUNNING', s: '12.12 토 10:00 · 미사경정공원 조정호수 일대', lim: '제한 없음', tab: 'RUN' },
        10: { n: '10KM RUNNING', s: '12.12 토 · 12.13 일 10:00 · 미사경정공원 왕복', lim: '2:00', tab: 'RUN' },
        15: { n: '15KM TRAIL RUN', s: '12.12 토 10:00 · 검단산 일대', lim: '4:00', note: '중도 컷오프 없음', cpl: [['CP', 3.5]], tab: 'TRAIL' },
        28: { n: '28KM TRAIL RUN', s: '12.13 일 08:00 · 위례둘레길 · 남한산성 일대', lim: '7:30', note: 'CP2 컷오프 4:30', cut: 'CP2', cutT: '4:30', cpl: [['CP1', 4.8], ['CP2', 15], ['CP3', 24]], tab: 'TRAIL' }
      }
    },
    en: {
      title: 'Course', dist: 'Distance', gain: 'Elevation gain', limit: 'Time limit', cp: 'CP', course: 'Course', road: 'Flat', roadU: 'road', ea: '',
      gpx: ' GPX download', more: 'View course details', start: 'START', cutoff: 'cut-off', peak: 'Highest',
      C: {
        5: { n: '5KM RUNNING', s: 'DEC 12 SAT 10:00 · Misa Regatta Park', lim: 'No limit', tab: 'RUN' },
        10: { n: '10KM RUNNING', s: 'DEC 12 SAT · DEC 13 SUN 10:00 · Misa Regatta Park (out & back)', lim: '2:00', tab: 'RUN' },
        15: { n: '15KM TRAIL RUN', s: 'DEC 12 SAT 10:00 · Geomdansan', lim: '4:00', note: 'No mid-race cut-off', cpl: [['CP', 3.5]], tab: 'TRAIL' },
        28: { n: '28KM TRAIL RUN', s: 'DEC 13 SUN 08:00 · Wirye Trail · Namhansanseong', lim: '7:30', note: 'CP2 cut-off 4:30', cut: 'CP2', cutT: '4:30', cpl: [['CP1', 4.8], ['CP2', 15], ['CP3', 24]], tab: 'TRAIL' }
      }
    }
  };

  var CSS =
    '.yc-root{--blue:#002ACF;--orange:#FF6D07;--ink:#141518;font-family:Pretendard,"Pretendard Variable",sans-serif;color:var(--ink);letter-spacing:-.02em;-webkit-font-smoothing:antialiased;text-align:left}' +
    '.yc-root *{box-sizing:border-box}' +
    '.yc-root .yc-top{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}' +
    '.yc-root h2.yc-t{margin:0;font-size:56px;font-weight:900;color:var(--blue);letter-spacing:-.05em;line-height:1}' +
    '.yc-root .yc-tabs{display:flex;gap:6px;background:#f1f3f7;border-radius:999px;padding:5px;margin:0}' +
    '.yc-root .yc-tabs button{border:0;background:none;font:inherit;cursor:pointer;padding:12px 22px;border-radius:999px;font-size:17px;font-weight:800;color:#7b808a;white-space:nowrap;line-height:1.2;letter-spacing:-.02em}' +
    '.yc-root .yc-tabs button small{font-size:12px;font-weight:700;margin-left:6px;opacity:.75}' +
    '.yc-root .yc-tabs button.on{background:var(--blue);color:#fff}' +
    '.yc-root .yc-head{margin-top:44px;display:flex;align-items:baseline;gap:6px 18px;flex-wrap:wrap}' +
    '.yc-root .yc-head b{font-size:40px;font-weight:900;letter-spacing:-.045em;line-height:1.1}' +
    '.yc-root .yc-head span{font-size:18px;font-weight:700;color:#4a4f58}' +
    '.yc-root .yc-map{position:relative;margin-top:20px;height:540px;border-radius:20px;overflow:hidden;background:#f4f6f8;isolation:isolate}' +
    '.yc-root .yc-mapc{position:absolute;inset:0}' +
    '.yc-root .yc-gpx{position:absolute;right:18px;top:18px;z-index:5;background:#fff;color:var(--ink)!important;text-decoration:none!important;font-weight:800;font-size:14px;padding:11px 18px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.12);line-height:1.2}' +
    '.yc-root .yc-stats{display:grid;grid-template-columns:repeat(4,1fr);margin:28px 0 0;padding:0;border-top:2px solid var(--ink)}' +
    '.yc-root .yc-stats.run{grid-template-columns:repeat(3,1fr)}' +
    '.yc-root .yc-stats div{padding:18px 0 0}.yc-root .yc-stats div+div{padding-left:24px}' +
    '.yc-root .yc-stats dt{font-size:14px;font-weight:700;color:#4a4f58;margin:0}' +
    '.yc-root .yc-stats dd{margin:6px 0 0;font-size:34px;font-weight:900;letter-spacing:-.04em;line-height:1.1}' +
    '.yc-root .yc-stats dd small{font-size:16px;font-weight:800;margin-left:3px}' +
    '.yc-root .yc-stats dd em{display:block;font-style:normal;font-size:14px;font-weight:800;color:var(--orange);margin-top:6px;letter-spacing:-.02em}' +
    '.yc-root .yc-prof{position:relative;margin-top:44px;height:310px}' +
    '.yc-root .yc-prof svg{width:100%;height:100%;display:block;overflow:visible;touch-action:pan-y}' +
    '.yc-root .yc-tip{position:absolute;top:0;transform:translateX(-50%);background:var(--ink);color:#fff;font-size:12px;font-weight:800;padding:5px 9px;border-radius:999px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .12s}' +
    '.yc-root .yc-tip.on{opacity:1}' +
    '.yc-root .yc-more{display:inline-flex;align-items:center;gap:8px;margin-top:32px;padding:14px 26px;border-radius:999px;background:var(--blue);color:#fff!important;text-decoration:none!important;font-weight:800;font-size:16px}' +
    '.yc-root .yc-more b{color:var(--orange)}' +
    '.yc-cp{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#fff;border:2.5px solid #FF6D07;color:#FF6D07;font:800 11px Pretendard,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.18)}' +
    '.yc-sf{display:flex;align-items:center;gap:6px;white-space:nowrap;font:900 12px Pretendard,sans-serif;color:#fff;background:#002ACF;padding:6px 10px 6px 8px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.2)}' +
    '.yc-sf:before{content:"";width:8px;height:8px;border-radius:50%;background:#fff}' +
    '.yc-me{width:16px;height:16px;border-radius:50%;background:#002ACF;border:3px solid #fff;box-shadow:0 0 0 2px #002ACF;pointer-events:none}' +
    '.yc-root .maplibregl-ctrl-attrib{font-size:10px}' +
    '.yc-root.compact .yc-map{height:460px}' +
    '@media (max-width:767px){' +
    '.yc-root h2.yc-t{font-size:40px}' +
    '.yc-root .yc-tabs{width:100%;justify-content:space-between}' +
    '.yc-root .yc-tabs button{padding:11px 0;flex:1;font-size:15px}' +
    '.yc-root .yc-tabs button small{display:none}' +
    '.yc-root .yc-head{margin-top:28px}' +
    '.yc-root .yc-head b{font-size:28px}' +
    '.yc-root .yc-head span{font-size:14px}' +
    '.yc-root .yc-map,.yc-root.compact .yc-map{height:360px;border-radius:14px;margin-top:14px}' +
    '.yc-root .yc-gpx{top:auto;bottom:12px;right:auto;left:12px;padding:9px 14px;font-size:13px}' +
    '.yc-root .yc-stats,.yc-root .yc-stats.run{grid-template-columns:1fr 1fr;row-gap:18px}' +
    '.yc-root .yc-stats div:nth-child(odd){padding-left:0}.yc-root .yc-stats div:nth-child(even){padding-left:16px}' +
    '.yc-root .yc-stats dd{font-size:26px}' +
    '.yc-root .yc-prof{height:250px;margin-top:32px}' +
    '.yc-root .yc-more{margin-top:24px;width:100%;justify-content:center}' +
    '}';

  function css() {
    if (document.getElementById('yc-css')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ML_CSS; document.head.appendChild(l);
    var s = document.createElement('style'); s.id = 'yc-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  function loadML(cb) {
    if (window.maplibregl) return cb();
    var s = document.getElementById('yc-ml');
    if (!s) { s = document.createElement('script'); s.id = 'yc-ml'; s.src = ML_JS; document.head.appendChild(s); }
    s.addEventListener('load', cb);
  }
  var styleP = null;
  function getStyle() { if (!styleP) styleP = fetch(STYLE).then(function (r) { return r.json(); }); return styleP; }

  function classify(l) {
    var s = l['source-layer'] || '', id = l.id;
    if (l.type === 'background') return 'bg';
    if (s === 'water' || /water/.test(id)) return l.type === 'fill' ? 'water' : (l.type === 'line' ? 'waterline' : (l.type === 'symbol' ? 'label' : null));
    if (s === 'park' || /park/.test(id)) return l.type === 'fill' ? 'green' : (l.type === 'symbol' ? 'label' : null);
    if (s === 'landcover' && /wood|forest/.test(id)) return 'wood';
    if (s === 'landcover') return 'green';
    if (s === 'landuse') return 'landuse';
    if (s === 'building') return 'bld';
    if (s === 'transportation' && l.type === 'line') return /casing/.test(id) ? 'cas' : 'road';
    if (l.type === 'symbol') return 'label';
    return null;
  }
  function paint(st, lang) {
    st = JSON.parse(JSON.stringify(st));
    st.layers.forEach(function (l) {
      var c = classify(l), p = l.paint = l.paint || {};
      if (c === 'bg') p['background-color'] = PAL.bg;
      else if (c === 'water') p['fill-color'] = PAL.water;
      else if (c === 'waterline') p['line-color'] = PAL.water;
      else if (c === 'green' && l.type === 'fill') { p['fill-color'] = PAL.green; p['fill-opacity'] = 1; }
      else if (c === 'wood' && l.type === 'fill') { p['fill-color'] = PAL.wood; p['fill-opacity'] = 1; }
      else if (c === 'landuse' && l.type === 'fill') p['fill-color'] = PAL.bg;
      else if (c === 'bld' && l.type === 'fill') { p['fill-color'] = PAL.bld; p['fill-outline-color'] = PAL.cas; }
      else if (c === 'road') p['line-color'] = PAL.road;
      else if (c === 'cas') p['line-color'] = PAL.cas;
      if (l.type === 'symbol') {
        p['text-color'] = PAL.label; p['text-halo-color'] = PAL.halo;
        if (l.layout && l.layout['text-field'] && !/shield|ref|number/.test(l.id)) l.layout['text-field'] = ['coalesce', ['get', 'name:' + lang], ['get', 'name']];
      }
    });
    return st;
  }

  function smooth(e, k) { var n = e.length, o = []; for (var i = 0; i < n; i++) { var a = 0, c = 0; for (var j = Math.max(0, i - k); j <= Math.min(n - 1, i + k); j++) { a += e[j]; c++; } o.push(a / c); } return o; }
  function resample(a, m) { var o = []; for (var i = 0; i < m; i++) { var f = i / (m - 1) * (a.length - 1), j = Math.floor(f), t = f - j; o.push(j >= a.length - 1 ? a[a.length - 1] : a[j] * (1 - t) + a[j + 1] * t); } return o; }
  function cr(p) { var s = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1); for (var i = 0; i < p.length - 1; i++) { var p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)]; s += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1); } return s; }
  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstChild; }
  function at(d, km) { var i = 0; while (i < d.d.length - 1 && d.d[i] < km) i++; return i; }

  function mount(root) {
    if (root.__yc) return; root.__yc = 1;
    var lang = root.getAttribute('data-lang') === 'en' ? 'en' : 'ko', tt = T[lang];
    var compact = root.getAttribute('data-mode') === 'compact';
    var gpx = root.getAttribute('data-gpx') || '#', more = root.getAttribute('data-more') || '';
    var DATA = window.YC_DATA;
    root.classList.toggle('compact', compact);
    var tabs = [5, 10, 15, 28].map(function (k) { return '<button type="button" data-k="' + k + '">' + k + 'KM<small>' + tt.C[k].tab + '</small></button>'; }).join('');
    root.innerHTML =
      '<div class="yc-top"><h2 class="yc-t">' + tt.title + '</h2><div class="yc-tabs" role="tablist">' + tabs + '</div></div>' +
      '<div class="yc-head"><b></b><span></span></div>' +
      '<div class="yc-map"><div class="yc-mapc"></div><a class="yc-gpx" target="_blank" rel="noopener" href="' + gpx + '"></a></div>' +
      '<dl class="yc-stats"></dl>' +
      (compact ? '' : '<div class="yc-prof"><svg aria-hidden="true"></svg><div class="yc-tip"></div></div>') +
      (compact && more ? '<a class="yc-more" href="' + more + '">' + tt.more + ' <b>〉</b></a>' : '');
    var $ = function (s) { return root.querySelector(s); };
    var map = null, marks = [], meMk = null, cur = 28, ready = false;

    function stats(k) {
      var c = tt.C[k], d = DATA[k], km = (Math.round(d.km * 100) / 100).toString();
      var h = '<div><dt>' + tt.dist + '</dt><dd>' + km + '<small>km</small></dd></div>';
      if (k <= 10) {
        h += '<div><dt>' + tt.course + '</dt><dd>' + tt.road + '<small>' + tt.roadU + '</small></dd></div><div><dt>' + tt.limit + '</dt><dd>' + c.lim + '</dd></div>';
      } else {
        var up = k == 15 ? '829' : '1,208';
        h += '<div><dt>' + tt.gain + '</dt><dd>+' + up + '<small>m</small></dd></div>' +
          '<div><dt>' + tt.limit + '</dt><dd>' + c.lim + '<em>' + c.note + '</em></dd></div>' +
          '<div><dt>' + tt.cp + '</dt><dd>' + c.cpl.length + (tt.ea ? '<small>' + tt.ea + '</small>' : '') + '</dd></div>';
      }
      var dl = $('.yc-stats'); dl.className = 'yc-stats' + (k <= 10 ? ' run' : ''); dl.innerHTML = h;
    }

    function show(k) {
      cur = k; var c = tt.C[k], d = DATA[k];
      root.querySelectorAll('.yc-tabs button').forEach(function (b) { var on = +b.getAttribute('data-k') === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      $('.yc-head b').textContent = c.n; $('.yc-head span').textContent = c.s;
      $('.yc-gpx').textContent = k + 'KM' + tt.gpx;
      stats(k);
      var pr = $('.yc-prof'); if (pr) pr.style.display = k <= 10 ? 'none' : '';
      if (pr && k > 10) prof(k);
      if (!ready) return;
      marks.forEach(function (m) { m.remove(); }); marks = [];
      var co = d.p.map(function (p) { return [p[1], p[0]]; });
      map.getSource('yc-route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: co } });
      marks.push(new maplibregl.Marker({ element: el('<div class="yc-sf">START · FINISH</div>'), anchor: 'left', offset: [-8, 0] }).setLngLat(co[0]).addTo(map));
      (d.cp || []).forEach(function (q) {
        marks.push(new maplibregl.Marker({ element: el('<div class="yc-cp">' + (q[0] === 'CP' ? 'CP' : q[0].slice(2)) + '</div>') }).setLngLat([q[2][1], q[2][0]]).addTo(map));
      });
      var me = el('<div class="yc-me"></div>'); me.style.opacity = 0;
      meMk = new maplibregl.Marker({ element: me }).setLngLat(co[0]).addTo(map); marks.push(meMk);
      var b = co.reduce(function (b, x) { return b.extend(x); }, new maplibregl.LngLatBounds(co[0], co[0]));
      var mob = root.clientWidth < 600;
      map.fitBounds(b, { padding: mob ? { top: 64, bottom: 36, left: 28, right: 28 } : { top: 80, bottom: 50, left: 60, right: 60 }, duration: 0 });
    }

    function prof(k) {
      var d = DATA[k], c = tt.C[k], svg = $('.yc-prof svg'); if (!svg) return;
      var W0 = svg.clientWidth, H = svg.clientHeight; if (!W0) return;
      var mob = W0 < 600, L = mob ? 34 : 44, W = W0 - L, Tp = mob ? 62 : 74, B = 50, h = H - Tp - B, base = Tp + h;
      var sm0 = smooth(smooth(d.e, 2), 2), n = mob ? 70 : 110, sm = resample(sm0, n);
      var topv = Math.max.apply(0, sm), mx = Math.ceil(topv * 1.12 / 100) * 100;
      var X = function (i) { return L + i / (n - 1) * W; }, Y = function (m) { return base - m / mx * h; };
      var ln = cr(sm.map(function (m, i) { return [X(i), Y(m)]; })), area = ln + 'L' + (L + W) + ',' + base + 'L' + L + ',' + base + 'Z';
      var cid = 'ycc' + k + Math.random().toString(36).slice(2, 6), fs = mob ? 11 : 13;
      var g = '<defs><clipPath id="' + cid + '"><path d="' + area + '"/></clipPath></defs>', gi = '';
      var gstep = mx > 600 ? 200 : 100;
      for (var m = gstep; m <= mx; m += gstep) {
        var yy = Y(m).toFixed(1);
        g += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + yy + '" y2="' + yy + '" stroke="#E6E8EC" stroke-width="1"/><text x="' + (L - 8) + '" y="' + (+yy + 4) + '" text-anchor="end" font-size="' + (fs - 1) + '" font-weight="700" fill="#9aa0a8">' + m + '</text>';
        gi += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + yy + '" y2="' + yy + '" stroke="' + ORANGE + '" stroke-width="1" opacity=".55"/>';
      }
      g += '<text x="' + (L - 8) + '" y="' + (base + 4) + '" text-anchor="end" font-size="' + (fs - 1) + '" font-weight="700" fill="#9aa0a8">0</text>';
      g += '<path d="' + area + '" fill="' + ORANGE + '" fill-opacity=".07"/><g clip-path="url(#' + cid + ')">' + gi + '</g>';
      g += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + base + '" y2="' + base + '" stroke="' + INK + '" stroke-width="1.2"/>';
      g += '<path d="' + ln + '" fill="none" stroke="' + ORANGE + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>';
      var im = 0; for (var i = 1; i < n; i++) if (sm[i] > sm[im]) im = i;
      var px = X(im), py = Y(sm[im]), top = Math.round(Math.max.apply(0, d.e)), pk = (im / (n - 1) * d.km).toFixed(1);
      var big = mob ? 30 : 44;
      g += '<g class="pk"><line x1="' + px + '" x2="' + px + '" y1="' + (py - 8) + '" y2="' + (Tp - big - 14) + '" stroke="' + INK + '" stroke-width="1.2"/><circle cx="' + px + '" cy="' + py + '" r="4.5" fill="' + INK + '"/>' +
        '<text x="' + (px - 10) + '" y="' + (Tp - 28) + '" text-anchor="end" font-size="' + big + '" font-weight="900" fill="' + INK + '" letter-spacing="-1.5">' + top + '<tspan font-size="' + Math.round(big * .45) + '" dx="2">m</tspan></text>' +
        '<text x="' + (px - 10) + '" y="' + (Tp - 8) + '" text-anchor="end" font-size="' + fs + '" font-weight="700" fill="#8a8f99">' + tt.peak + ' · ' + pk + 'km</text></g>';
      var stp = mob ? 10 : 5;
      for (var q = stp; q < d.km - 1.5; q += stp) { var xq = L + q / d.km * W; g += '<line x1="' + xq + '" x2="' + xq + '" y1="' + base + '" y2="' + (base + 5) + '" stroke="' + INK + '"/><text x="' + xq + '" y="' + (base + 22) + '" text-anchor="middle" font-size="' + fs + '" font-weight="700" fill="#8a8f99">' + q + '</text>'; }
      g += '<text x="' + L + '" y="' + (base + 22) + '" font-size="' + fs + '" font-weight="800" fill="' + INK + '">' + tt.start + '</text><text x="' + (L + W) + '" y="' + (base + 22) + '" text-anchor="end" font-size="' + fs + '" font-weight="800" fill="' + INK + '">' + d.km.toFixed(1) + '<tspan font-size="' + (fs - 2) + '"> km</tspan></text>';
      (c.cpl || []).forEach(function (q) {
        var x = L + q[1] / d.km * W, i = Math.round(q[1] / d.km * (n - 1)), y = Y(sm[i]), cut = c.cut === q[0];
        g += '<line x1="' + x + '" x2="' + x + '" y1="' + y + '" y2="' + base + '" stroke="' + (cut ? ORANGE : INK) + '" stroke-width="1" stroke-dasharray="3 3" opacity="' + (cut ? .9 : .5) + '"/><circle cx="' + x + '" cy="' + y + '" r="5.5" fill="#fff" stroke="' + ORANGE + '" stroke-width="2.5"/>';
        if (cut) { var lab = q[0] + ' · ' + tt.cutoff + ' ' + c.cutT, w = lab.length * (mob ? 7.6 : 8.6) + 26; g += '<rect x="' + (x - w / 2) + '" y="' + (base + 8) + '" width="' + w + '" height="28" rx="14" fill="' + ORANGE + '"/><text x="' + x + '" y="' + (base + 27) + '" text-anchor="middle" font-size="' + fs + '" font-weight="800" fill="#fff">' + lab + '</text>'; }
        else { var w2 = q[0].length * 9 + 22; g += '<rect x="' + (x - w2 / 2) + '" y="' + (y - 46) + '" width="' + w2 + '" height="26" rx="13" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><text x="' + x + '" y="' + (y - 28.5) + '" text-anchor="middle" font-size="' + (fs - .5) + '" font-weight="800" fill="' + INK + '">' + q[0] + '</text>'; }
      });
      g += '<line class="hl" y1="' + Tp + '" y2="' + base + '" stroke="' + INK + '" stroke-width="1" opacity="0"/><circle class="hd" r="5" fill="' + ORANGE + '" stroke="#fff" stroke-width="2.5" opacity="0"/>';
      svg.innerHTML = g;
      function move(cx) {
        var r = svg.getBoundingClientRect(), x = Math.max(L, Math.min(L + W, cx - r.left)), km = (x - L) / W * d.km;
        var i = Math.round(km / d.km * (n - 1)), ie = Math.round(km / d.km * (d.e.length - 1)), hl = svg.querySelector('.hl'), hd = svg.querySelector('.hd');
        hl.setAttribute('x1', x); hl.setAttribute('x2', x); hl.setAttribute('opacity', .35);
        hd.setAttribute('cx', x); hd.setAttribute('cy', Y(sm[i])); hd.setAttribute('opacity', 1);
        svg.querySelector('.pk').style.opacity = 0;
        var tp = $('.yc-tip'); tp.textContent = km.toFixed(1) + ' km · ' + Math.round(d.e[ie]) + ' m';
        tp.style.left = Math.max(60, Math.min(W0 - 60, x)) + 'px'; tp.style.top = (Y(sm[i]) - 40) + 'px'; tp.classList.add('on');
        if (meMk) { var j = at(d, km); meMk.setLngLat([d.p[j][1], d.p[j][0]]); meMk.getElement().style.opacity = 1; }
      }
      function leave() {
        $('.yc-tip').classList.remove('on'); svg.querySelector('.hl').setAttribute('opacity', 0); svg.querySelector('.hd').setAttribute('opacity', 0);
        svg.querySelector('.pk').style.opacity = 1; if (meMk) meMk.getElement().style.opacity = 0;
      }
      svg.onmousemove = function (e) { move(e.clientX); };
      svg.onmouseleave = leave;
      svg.ontouchstart = svg.ontouchmove = function (e) { if (e.touches[0]) move(e.touches[0].clientX); };
      svg.ontouchend = leave;
    }

    root.querySelectorAll('.yc-tabs button').forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-k')); }; });
    show(28);

    loadML(function () {
      getStyle().then(function (st) {
        var touch = window.matchMedia && matchMedia('(pointer:coarse)').matches;
        map = new maplibregl.Map({
          container: $('.yc-mapc'), style: paint(st, lang), center: [127.2, 37.52], zoom: 11,
          attributionControl: { compact: true }, scrollZoom: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
          cooperativeGestures: touch
        });
        map.touchZoomRotate && map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
        map.on('load', function () {
          map.addSource('yc-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
          map.addLayer({ id: 'yc-halo', type: 'line', source: 'yc-route', paint: { 'line-color': '#fff', 'line-width': 9 }, layout: { 'line-join': 'round', 'line-cap': 'round' } });
          map.addLayer({ id: 'yc-line', type: 'line', source: 'yc-route', paint: { 'line-color': ORANGE, 'line-width': 4.5 }, layout: { 'line-join': 'round', 'line-cap': 'round' } });
          ready = true; show(cur);
        });
      });
    });
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (cur > 10) prof(cur); }, 150); });
  }

  function boot() { css(); document.querySelectorAll('.yc-root').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.YCMount = boot;
})();
