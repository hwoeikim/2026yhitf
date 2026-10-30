/* YHITF google.maps → Leaflet shim (2026-10-30)
   Google Maps API를 끈 뒤, 기존 위젯 코드를 그대로 두고 지도만 자체 지도(Leaflet + OSM)로 그린다.
   사용: <script src=".../gmshim.js?cb=콜백함수이름"> — 로드 후 window[cb]() 호출 */
(function () {
  var me = document.currentScript;
  var cb = '';
  try { cb = new URL(me.src).searchParams.get('cb') || ''; } catch (e) {}

  function ready(fn) {
    if (window.L && window.L.map) return fn();
    if (!document.getElementById('yhLeafCss')) {
      var c = document.createElement('link');
      c.id = 'yhLeafCss'; c.rel = 'stylesheet';
      c.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(c);
    }
    var s = document.getElementById('yhLeafJs');
    if (!s) {
      s = document.createElement('script');
      s.id = 'yhLeafJs';
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      document.head.appendChild(s);
    }
    s.addEventListener('load', fn);
  }

  function css() {
    if (document.getElementById('yhGmShimCss')) return;
    var st = document.createElement('style');
    st.id = 'yhGmShimCss';
    st.textContent =
      '.yh-lf{isolation:isolate;z-index:0}' +
      '.yh-lf .leaflet-tile-pane{filter:saturate(.55) contrast(.96) brightness(1.03)}' +
      '.yh-lf img.leaflet-tile{max-width:none!important;max-height:none!important;transition:none!important}' +
      '.yh-lf svg{max-width:none}' +
      '.yh-lf .leaflet-control-attribution{font-size:10px}' +
      '.yh-gm-pin{position:relative}' +
      '.yh-gm-pin i{position:absolute;left:0;top:0;border-radius:50%;box-sizing:border-box}' +
      '.yh-gm-pin b{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:Pretendard,sans-serif;line-height:1;white-space:nowrap}';
    document.head.appendChild(st);
  }

  function ll(p) {
    if (!p) return null;
    if (Array.isArray(p)) return [p[0], p[1]];
    if (typeof p.lat === 'function') return [p.lat(), p.lng()];
    return [p.lat, p.lng];
  }

  function build() {
    css();
    var L = window.L;
    var g = window.google = window.google || {};
    if (g.maps && g.maps.__yhShim) return;

    function LatLng(a, b) { this._a = a; this._b = b; }
    LatLng.prototype.lat = function () { return this._a; };
    LatLng.prototype.lng = function () { return this._b; };

    function Listener() {}
    Listener.prototype.remove = function () {};

    function on(target, ev, fn) {
      var l = target && target._l;
      if (l && l.on) {
        var map = { click: 'click', idle: 'moveend', zoom_changed: 'zoomend', bounds_changed: 'moveend', dragend: 'dragend' };
        if (map[ev]) l.on(map[ev], function () { fn.apply(target, arguments); });
      }
      return new Listener();
    }

    function Map(el, o) {
      o = o || {};
      if (el.classList) el.classList.add('yh-lf');
      var touch = 'ontouchstart' in window;
      var wheel = o.gestureHandling === 'greedy' || o.scrollwheel === true;
      this._l = L.map(el, {
        zoomControl: o.zoomControl !== false,
        scrollWheelZoom: wheel,
        dragging: o.gestureHandling === 'none' ? false : (o.draggable !== false && (!touch || o.gestureHandling === 'greedy')),
        tap: false,
        minZoom: o.minZoom || 3,
        maxZoom: o.maxZoom || 18
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap'
      }).addTo(this._l);
      var c = ll(o.center) || [37.553, 127.214];
      this._l.setView(c, o.zoom || 13);
      var self = this;
      setTimeout(function () { self._l.invalidateSize(); }, 200);
      window.addEventListener('resize', function () { self._l.invalidateSize(); });
    }
    Map.prototype.fitBounds = function (b, pad) {
      if (!b || !b._pts.length) return;
      var p = typeof pad === 'number' ? [pad, pad] : [40, 40];
      var opt = { animate: false };
      if (pad && typeof pad === 'object') {
        opt.paddingTopLeft = [pad.left || 0, pad.top || 0];
        opt.paddingBottomRight = [pad.right || 0, pad.bottom || 0];
      } else opt.padding = p;
      this._l.invalidateSize(false);
      this._l.fitBounds(b._pts, opt);
    };
    Map.prototype.setCenter = function (c) { this._l.setView(ll(c), this._l.getZoom(), { animate: false }); };
    Map.prototype.panTo = function (c) { this._l.panTo(ll(c)); };
    Map.prototype.setZoom = function (z) { this._l.setZoom(z); };
    Map.prototype.getZoom = function () { return this._l.getZoom(); };
    Map.prototype.getCenter = function () { var c = this._l.getCenter(); return new LatLng(c.lat, c.lng); };
    Map.prototype.setOptions = function () {};
    Map.prototype.setMapTypeId = function () {};
    Map.prototype.addListener = function (ev, fn) { return on(this, ev, fn); };

    function Polyline(o) { this._o = {}; this._l = null; this._map = null; this.setOptions(o || {}); }
    Polyline.prototype._style = function () {
      var o = this._o;
      return { color: o.strokeColor || '#002ACF', opacity: o.strokeOpacity == null ? 1 : o.strokeOpacity, weight: o.strokeWeight || 3, lineCap: 'round', lineJoin: 'round', interactive: !!o.clickable };
    };
    Polyline.prototype.setOptions = function (o) {
      for (var k in o) this._o[k] = o[k];
      var pts = (this._o.path || []).map(ll);
      if (this._l) { this._l.setLatLngs(pts); this._l.setStyle(this._style()); }
      else this._l = L.polyline(pts, this._style());
      if ('map' in o) this.setMap(o.map);
    };
    Polyline.prototype.setPath = function (p) { this.setOptions({ path: p }); };
    Polyline.prototype.getPath = function () { return this._o.path || []; };
    Polyline.prototype.setMap = function (m) {
      if (this._map) this._map._l.removeLayer(this._l);
      this._map = m || null;
      if (m) this._l.addTo(m._l);
    };
    Polyline.prototype.getMap = function () { return this._map; };
    Polyline.prototype.addListener = function (ev, fn) { return on(this, ev, fn); };

    function icon(o) {
      var ic = o.icon || {}, lb = o.label;
      var s = ic.scale || 8, sw = ic.strokeWeight == null ? 2 : ic.strokeWeight;
      var d = Math.round(s * 2 + sw);
      var txt = '', st = '';
      if (lb) {
        if (typeof lb === 'string') txt = lb;
        else {
          txt = lb.text || '';
          st = 'color:' + (lb.color || '#fff') + ';font-size:' + (lb.fontSize || '11px') + ';font-weight:' + (lb.fontWeight || '700');
        }
      }
      var html = '<i style="width:' + d + 'px;height:' + d + 'px;background:' + (ic.fillColor || '#002ACF') +
        ';opacity:' + (ic.fillOpacity == null ? 1 : ic.fillOpacity) + ';border:' + sw + 'px solid ' + (ic.strokeColor || '#fff') +
        '"></i>' + (txt ? '<b style="' + (st || 'color:#fff;font-size:11px;font-weight:700') + '">' + String(txt).replace(/</g, '&lt;') + '</b>' : '');
      return L.divIcon({ className: 'yh-gm-pin', html: html, iconSize: [d, d], iconAnchor: [d / 2, d / 2] });
    }
    function Marker(o) {
      o = o || {};
      this._o = o; this._map = null;
      this._l = L.marker(ll(o.position) || [0, 0], { icon: icon(o), title: o.title || '', zIndexOffset: (o.zIndex || 0) * 10, keyboard: false });
      if (o.map) this.setMap(o.map);
    }
    Marker.prototype.setMap = function (m) {
      if (this._map) this._map._l.removeLayer(this._l);
      this._map = m || null;
      if (m) this._l.addTo(m._l);
    };
    Marker.prototype.getMap = function () { return this._map; };
    Marker.prototype.setPosition = function (p) { this._l.setLatLng(ll(p)); };
    Marker.prototype.getPosition = function () { var c = this._l.getLatLng(); return new LatLng(c.lat, c.lng); };
    Marker.prototype.setIcon = function (ic) { this._o.icon = ic; this._l.setIcon(icon(this._o)); };
    Marker.prototype.setLabel = function (lb) { this._o.label = lb; this._l.setIcon(icon(this._o)); };
    Marker.prototype.setZIndex = function (z) { this._l.setZIndexOffset((z || 0) * 10); };
    Marker.prototype.setVisible = function (v) { this._l.setOpacity(v ? 1 : 0); };
    Marker.prototype.setOptions = function (o) { for (var k in o) this._o[k] = o[k]; this._l.setIcon(icon(this._o)); if (o.position) this.setPosition(o.position); if ('map' in o) this.setMap(o.map); };
    Marker.prototype.addListener = function (ev, fn) { return on(this, ev, fn); };

    function LatLngBounds() { this._pts = []; }
    LatLngBounds.prototype.extend = function (p) { this._pts.push(ll(p)); return this; };
    LatLngBounds.prototype.isEmpty = function () { return !this._pts.length; };
    LatLngBounds.prototype.getCenter = function () {
      var b = L.latLngBounds(this._pts).getCenter(); return new LatLng(b.lat, b.lng);
    };

    g.maps = {
      __yhShim: true,
      Map: Map, Polyline: Polyline, Marker: Marker, LatLng: LatLng, LatLngBounds: LatLngBounds,
      Point: function (x, y) { this.x = x; this.y = y; },
      Size: function (w, h) { this.width = w; this.height = h; },
      MapTypeId: { ROADMAP: 'roadmap', TERRAIN: 'terrain', SATELLITE: 'satellite', HYBRID: 'hybrid' },
      SymbolPath: { CIRCLE: 0, FORWARD_CLOSED_ARROW: 1, FORWARD_OPEN_ARROW: 2, BACKWARD_CLOSED_ARROW: 3, BACKWARD_OPEN_ARROW: 4 },
      ControlPosition: {},
      event: {
        addListener: on,
        addListenerOnce: on,
        removeListener: function () {},
        trigger: function () {},
        clearInstanceListeners: function () {}
      }
    };
  }

  ready(function () {
    build();
    if (cb && typeof window[cb] === 'function') window[cb]();
  });
})();
