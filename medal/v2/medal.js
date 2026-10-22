import * as THREE from 'three';

const ROOT = document.getElementById('yh-rw');
const ASSET = (window.YH_ASSET_BASE || './');
const Q = new URLSearchParams(location.search);
const FIX_P = Q.has('p') ? +Q.get('p') : null, FIX_A = Q.has('a') ? +Q.get('a') : null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const fg = ROOT.querySelector('canvas.fg');
const R = new THREE.WebGLRenderer({ canvas: fg, antialias: true, alpha: true });
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
R.shadowMap.enabled = false;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(22, 1, 1, 3000);
const pmrem = new THREE.PMREMGenerator(R);

/* ---------- studio environment: black room, a few very bright soft boxes (HDR) ----------
   the brand blue / orange live only in two thin edge strips, which show up as coloured
   glints along the bevels; on scroll they turn mint (KEEN) and the room dims. */
const envScene = new THREE.Scene();
const domeMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { dim: { value: 1 } },
  vertexShader: 'varying vec3 d;void main(){d=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `varying vec3 d;uniform float dim;
  float box(float az,float el,float caz,float cel,float w,float h,float s){float dx=abs(az-caz),dy=abs(el-cel);return (1.-smoothstep(w-s,w+s,dx))*(1.-smoothstep(h-s,h+s,dy));}
  void main(){
    float az=atan(d.x,d.z), el=asin(clamp(d.y,-1.,1.));
    float v=.05+.08*smoothstep(-.4,.9,d.y);
    v+=2.2*box(az,el,-1.10,.30,.30,.55,.10);   // big softbox left
    v+=1.8*box(az,el, 1.00,.12,.28,.62,.12);   // big softbox right
    v+=4.0*box(az,el,-.25,.72,.40,.10,.05);    // hard overhead strip
    v+=1.1*box(az,el, .34,-.02,.16,.50,.10);   // tall card front-right
    v+=1.05*box(az,el,-.14,.20,.24,.28,.20);    // soft front card (keeps the face from going black)
    v+=.6*box(az,el,.55,.55,.25,.18,.15);       // upper right fill
    v+=.5*box(az,el,-.55,-.48,.35,.14,.14);    // low bounce
    v+=1.2*box(az,el,3.0,.2,.5,.6,.2)+1.2*box(az,el,-3.0,.2,.5,.6,.2);
    gl_FragColor=vec4(vec3(v*dim),1.);}` });
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(90, 64, 32), domeMat));
const boxes = [];
function box(w, h, pos, color, int, tint) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(int), side: THREE.DoubleSide });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(...pos); p.lookAt(0, 0, 0);
  envScene.add(p); boxes.push({ m, base: new THREE.Color(color), int, tint }); return p;
}
box(7, 80, [-62, 4, 28], 0x2f5bff, 6, true);    // brand blue glint strip (left)
box(7, 80, [60, 0, 22], 0xff7a1a, 5.5, true);   // brand orange glint strip (right)
let envRT = null, envKey = -1;
function updateEnv(p) {
  const k = Math.round(p * 24); if (k === envKey) return; envKey = k;
  const m = THREE.MathUtils.smoothstep(p, .30, .70), dim = 1 - THREE.MathUtils.smoothstep(p, .70, .98) * .45;
  const mint = new THREE.Color(0xA9CDB7);
  domeMat.uniforms.dim.value = dim;
  boxes.forEach(B => { const c = B.base.clone(); if (B.tint) c.lerp(mint, m); B.m.color.copy(c.multiplyScalar(B.int)) });
  if (envRT) envRT.dispose(); envRT = pmrem.fromScene(envScene, 0.01); scene.environment = envRT.texture;
}

/* ---------- materials ---------- */
const silver = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, metalness: 1, roughness: .13, envMapIntensity: 1.15 });
const rose = new THREE.MeshPhysicalMaterial({ color: 0xf7a27f, metalness: 1, roughness: .15, envMapIntensity: 1.1 });
const recess = new THREE.MeshPhysicalMaterial({ color: 0x5b5754, metalness: 1, roughness: .52 });   // antique, sand-blasted floor
const edge = new THREE.MeshPhysicalMaterial({ color: 0xe9eaec, metalness: 1, roughness: .2 });

const medal = new THREE.Group(); scene.add(medal);
const BASE = 1.25;   // half thickness of the base plate (mm)
const RAISE = 0.42;  // relief height
let S = null, ribbon = null;

function shapesFrom(list, mm, N) {
  const pt = ([x, y]) => new THREE.Vector2((x - N / 2) * mm, -(y - N / 2) * mm);
  return list.map(o => { const sh = new THREE.Shape(o.outer.map(pt)); o.holes.forEach(h => sh.holes.push(new THREE.Path(h.map(pt)))); return sh });
}
function relief(list, mat, mm, N) {
  const g = new THREE.ExtrudeGeometry(shapesFrom(list, mm, N), { depth: RAISE - .14, bevelEnabled: true, bevelThickness: .14, bevelSize: .14, bevelOffset: -.14, bevelSegments: 3, curveSegments: 1 });
  return new THREE.Mesh(g, mat);
}

fetch(ASSET + 'shape.json').then(r => r.json()).then(json => {
  S = json; const mm = S.mm_per_px, N = S.N;
  // base plate with rounded edge
  const base = new THREE.ExtrudeGeometry(shapesFrom(S.front, mm, N), { depth: BASE * 2 - .9, bevelEnabled: true, bevelThickness: .45, bevelSize: .4, bevelOffset: -.05, bevelSegments: 5, curveSegments: 1 });
  base.translate(0, 0, -(BASE - .45));
  base.addGroup && 0;
  medal.add(new THREE.Mesh(base, [recess, edge]));
  // front relief
  const f = new THREE.Group();
  if (!Q.has('lite')) f.add(relief(S.front_silver, silver, mm, N), relief(S.front_copper, rose, mm, N));
  f.position.z = BASE - .02; medal.add(f);
  // back relief (built in back-view coordinates, turned around)
  const b = new THREE.Group();
  if (!Q.has('lite')) b.add(relief(S.back_silver, silver, mm, N), relief(S.back_copper, rose, mm, N));
  b.rotation.y = Math.PI; b.position.z = -(BASE - .02); medal.add(b);
  buildRibbon(); setCourse('28k');
});

/* ---------- ribbon: two satin straps rising in a V through a silver slide ---------- */
const RW = 35, slotY = 39.2;
function weaveNormal() {          // grosgrain: fine ribs across the width + yarn noise
  const W = 64, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const img = x.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const rib = Math.sin(j / H * Math.PI * 2 * 64) ;           // 64 ribs per tile
    const n = (Math.random() - .5) * .35;
    const dy = rib * .55 + n, dx = (Math.random() - .5) * .25;
    const k = (j * W + i) * 4; img.data[k] = 128 + dx * 127; img.data[k + 1] = 128 + dy * 127; img.data[k + 2] = 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const weave = weaveNormal();
function strapGeom(sign, len) {
  // centre line: from the slot, leaning out to the side and slightly back, with a gentle twist
  const segs = 90, pos = [], uv = [], idx = [];
  const P = s => { const t = s / len; return new THREE.Vector3(sign * 52 * Math.pow(t, 1.25), slotY - 3 + s * Math.cos(sign * 0) , -6 * t * t + (sign < 0 ? 1.9 : -1.9) * (1 - t)) };
  for (let i = 0; i <= segs; i++) {
    const s = len * i / segs, c = P(s), c2 = P(Math.min(len, s + .5)), c1 = P(Math.max(0, s - .5));
    const T = c2.clone().sub(c1).normalize();
    let Wd = new THREE.Vector3(1, 0, 0); Wd.sub(T.clone().multiplyScalar(Wd.dot(T))).normalize();
    const twist = sign * .45 * Math.pow(s / len, 1.4) + Math.sin(s / len * Math.PI) * .08 * sign;
    Wd.applyAxisAngle(T, twist);
    const sag = Math.sin(s / len * Math.PI * 2.2) * .5;      // soft cross-curl of the fabric
    for (let k = 0; k <= 6; k++) {
      const u = k / 6, off = (u - .5) * RW;
      const Nn = new THREE.Vector3().crossVectors(Wd, T).normalize();
      const p = c.clone().add(Wd.clone().multiplyScalar(off)).add(Nn.multiplyScalar(sag * (1 - Math.pow(2 * u - 1, 2))));
      pos.push(p.x, p.y, p.z); uv.push(u, s);
    }
  }
  for (let i = 0; i < segs; i++) for (let k = 0; k < 6; k++) { const a = i * 7 + k, b = a + 7; idx.push(a, a + 1, b, a + 1, b + 1, b) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function fabric(side) {
  return new THREE.MeshPhysicalMaterial({ roughness: .58, metalness: 0, sheen: 1, sheenRoughness: .38, sheenColor: new THREE.Color(0xffffff),
    normalMap: weave, normalScale: new THREE.Vector2(.35, .35), side, envMapIntensity: .9 });
}
function buildRibbon() {
  const len = 240;
  ribbon = { straps: [] };
  [[-1, 'out'], [1, 'in']].forEach(([sign, face]) => {
    const g = strapGeom(sign, len);
    const front = new THREE.Mesh(g, fabric(THREE.FrontSide));
    const gb = g.clone(); const uvb = gb.attributes.uv; for (let i = 0; i < uvb.count; i++) uvb.setX(i, 1 - uvb.getX(i));
    const back = new THREE.Mesh(gb, fabric(THREE.BackSide));
    medal.add(front, back);
    ribbon.straps.push({ sign, face, front, back, len });
  });
  // silver slide where the two straps meet
  const slide = new THREE.Mesh(roundedBox(41, 9, 5.2, 1.6), new THREE.MeshPhysicalMaterial({ color: 0xf0f1f3, metalness: 1, roughness: .12 }));
  slide.position.set(0, slotY + 10, -.1); medal.add(slide);
}
function roundedBox(w, h, d, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 1.2, bevelEnabled: true, bevelThickness: .6, bevelSize: .6, bevelSegments: 4 }); g.translate(0, 0, -(d - 1.2) / 2); return g;
}
const texCache = {};
const TL = new THREE.TextureLoader();
function ribTex(k, f, len) {
  const key = k + f; if (texCache[key]) return texCache[key];
  const t = TL.load(ASSET + `rib_${k}_${f}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const full = 2953 / 256 * RW;                 // printed length (mm) of the strip artwork
  t.repeat.set(1, 1 / full); t.offset.set(0, 0);
  return texCache[key] = t;
}
function setCourse(k) {
  if (!ribbon) return;
  ribbon.straps.forEach(st => {
    // uv.y is in mm along the strap; the texture repeat converts mm -> 0..1
    const tOut = ribTex(k, st.face, st.len), tIn = ribTex(k, st.face === 'out' ? 'in' : 'out', st.len);
    st.front.material.map = tOut; st.back.material.map = tIn;
    st.front.material.needsUpdate = st.back.material.needsUpdate = true;
  });
  ROOT.querySelectorAll('.chips button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
}
ROOT.querySelectorAll('.chips button').forEach(b => b.addEventListener('click', () => setCourse(b.dataset.k)));

/* ---------- interaction + scroll ---------- */
let rotY = FIX_A !== null ? FIX_A * Math.PI / 180 : -0.4, vel = 0, drag = false, lx = 0;
const autoSpin = !reduce && FIX_A === null;
fg.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; fg.setPointerCapture(e.pointerId) });
fg.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; rotY += dx * .008; vel = dx * .008 });
fg.addEventListener('pointerup', () => { drag = false });
function progress() { if (FIX_P !== null) return FIX_P; const r = ROOT.getBoundingClientRect(); const span = r.height - innerHeight; return Math.min(1, Math.max(0, -r.top / span)) }
function size() {
  const dpr = Math.min(devicePixelRatio || 1, 2); const w = ROOT.clientWidth, h = innerHeight;
  R.setPixelRatio(dpr); R.setSize(w, h, false); cam.aspect = w / h;
  const fit = w / h < 0.8 ? 1.7 : 1.0; cam.position.set(0, 30, 560 * fit); cam.lookAt(0, 30, 0); cam.updateProjectionMatrix();
}
addEventListener('resize', size); size();
const t0 = performance.now();
function frame(now) {
  const t = (now - t0) / 1000, p = progress();
  updateEnv(p);
  if (!drag) { if (autoSpin) rotY += 0.004 + vel; vel *= 0.94 }
  medal.rotation.y = rotY + p * Math.PI;
  medal.rotation.x = -0.05 + Math.sin(t * .6) * .012;
  medal.position.y = Math.sin(t * .8) * 1.0 + 4 - p * 10;
  R.render(scene, cam);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__ready = () => !!ribbon;
