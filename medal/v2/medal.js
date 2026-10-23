import * as THREE from 'three';

const ROOT = document.getElementById('yh-rw');
const ASSET = (window.YH_ASSET_BASE || './');
const Q = new URLSearchParams(location.search);
const FIX_P = Q.has('p') ? +Q.get('p') : null, FIX_A = Q.has('a') ? +Q.get('a') : null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const fg = ROOT.querySelector('canvas.fg');
const R = new THREE.WebGLRenderer({ canvas: fg, antialias: true, alpha: true });
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
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
    v+=1.0*box(az,el,-.62,.10,.18,.34,.16);     // left card fills the gap when the medal looks left
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
  const m = 0, dim = 1 - THREE.MathUtils.smoothstep(p, .70, .98) * .45;
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
  buildRibbon(); setCourse('28k'); shadowsOn();
});

/* ---------- ribbon: one continuous satin lanyard ----------
   it comes down in front of the tab, wraps under the bar through the slot and goes back up
   behind; a silver slide gathers both straps. The top of the lanyard stays put while the
   medal turns, so the fabric twists along its length like a real hanging medal. */
const RW = 35, slotTop = 40.5, R0 = 2.4, slideY = 49, L = 250;
const rig = new THREE.Group(); scene.add(rig);           // bobbing parent; medal + ribbon live here
scene.remove(medal); rig.add(medal);
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-70, 130, 150); key.target = rig;
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.bias = -.0004; key.shadow.normalBias = .03;
Object.assign(key.shadow.camera, { left: -80, right: 80, top: 130, bottom: -70, near: 40, far: 420 }); key.shadow.camera.updateProjectionMatrix();
scene.add(key, key.target);
const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.45, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c) })();
const pool = new THREE.Mesh(new THREE.PlaneGeometry(260, 160), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, opacity: .28 }));
pool.rotation.x = -Math.PI / 2; pool.position.set(0, -66, 0); scene.add(pool); window.YH_bare = () => { pool.visible = false };
function shadowsOn() { rig.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } }) }
function clothNormal() {          // low-frequency cloth unevenness + faint rib
  const W = 128, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const img = x.createImageData(W, H);
  const hgt = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) hgt[j * W + i] = Math.sin(j / H * Math.PI * 2 * 16) * .35 + Math.sin((i * .7 + j * 1.3) / W * Math.PI * 2 * 3 + Math.sin(j * .2)) * .2 + (Math.random() - .5) * .25;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const dx = hgt[j * W + (i + 1) % W] - hgt[j * W + (i - 1 + W) % W], dy = hgt[((j + 1) % H) * W + i] - hgt[((j - 1 + H) % H) * W + i];
    const k = (j * W + i) * 4; img.data[k] = 128 - dx * 90; img.data[k + 1] = 128 - dy * 90; img.data[k + 2] = 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1 / 16); return t;
}
const cloth = clothNormal();
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
// rest centre line + width direction for one half (side -1 = front strap, +1 = back strap)
function halfFrames(side) {
  const pts = [];
  const zs = side < 0 ? 1 : -1;                        // front strap at +z, back strap at -z
  // half of the U under the bar (from the bottom of the U up to the bar's lower edge)
  for (let i = 0; i <= 10; i++) {
    const ph = Math.PI / 2 * i / 10;                   // 0 = bottom of U
    pts.push({ p: new THREE.Vector3(0, slotTop - R0 * Math.cos(ph), zs * R0 * Math.sin(ph)), twist: 0, cup: 0, ao: .5 });
  }
  // straight run through the slide, then the strap leans out, back and twists
  const H = L - 14;
  for (let i = 1; i <= 120; i++) {
    const y = slotTop + (L) * Math.pow(i / 120, 1.15);
    const h = Math.max(0, y - (slideY + 5)), t = Math.min(1, h / H);
    const x = side * 54 * Math.pow(t, 1.3);
    const z = zs * R0 - 9 * t * t + zs * 1.6 * Math.sin(t * Math.PI) ;
    const near = Math.exp(-h / 9);
    pts.push({ p: new THREE.Vector3(x, y, z), twist: side * .42 * Math.pow(t, 1.3), cup: .9 * smooth(0, 14, h), wrinkle: (y > slideY + 4) ? near : 0,
               ao: y < slideY + 5 ? .55 : .62 + .38 * smooth(0, 10, h) });
  }
  return pts;
}
function frameAt(pts, i, side) {
  const a = pts[Math.max(0, i - 1)].p, b = pts[Math.min(pts.length - 1, i + 1)].p;
  const T = b.clone().sub(a).normalize();
  const W = new THREE.Vector3(1, 0, 0); W.sub(T.clone().multiplyScalar(W.dot(T))).normalize();
  W.applyAxisAngle(T, pts[i].twist);
  const N = side < 0 ? new THREE.Vector3().crossVectors(W, T).normalize() : new THREE.Vector3().crossVectors(T, W).normalize();   // outward face normal
  return { T, W, N };
}
const NU = 10;
function buildHalf(side) {
  const pts = halfFrames(side), rows = pts.length;
  const mk = () => ({ pos: new Float32Array(rows * (NU + 1) * 3), uv: new Float32Array(rows * (NU + 1) * 2), col: new Float32Array(rows * (NU + 1) * 3) });
  const outer = mk(), inner = mk(), edgeP = new Float32Array(rows * 4 * 3);
  const rest = { outer: new Float32Array(outer.pos.length), inner: new Float32Array(inner.pos.length), edge: new Float32Array(edgeP.length), y: [] };
  let arc = 0;
  for (let i = 0; i < rows; i++) {
    if (i > 0) arc += pts[i].p.distanceTo(pts[i - 1].p);
    const { W, N } = frameAt(pts, i, side), P = pts[i];
    rest.y.push(P.p.y);
    for (let k = 0; k <= NU; k++) {
      const u = k / NU, off = (u - .5) * RW, bow = 1 - Math.pow(2 * u - 1, 2);
      const wr = (P.wrinkle || 0) * .7 * Math.sin(u * Math.PI * 5 + side * 1.3);
      const c = P.p.clone().add(W.clone().multiplyScalar(off)).add(N.clone().multiplyScalar(P.cup * bow + wr));
      const o = c.clone().add(N.clone().multiplyScalar(.5)), n = c.clone().add(N.clone().multiplyScalar(-.5));
      const j = i * (NU + 1) + k;
      rest.outer.set([o.x, o.y, o.z], j * 3); rest.inner.set([n.x, n.y, n.z], j * 3);
      // printed faces: outer = 'out' artwork, inner = 'in' artwork; flip u where the face is seen from behind
      outer.uv.set([side < 0 ? u : 1 - u, arc], j * 2); inner.uv.set([side < 0 ? 1 - u : u, arc], j * 2);
      const sel = (u < .04 || u > .96) ? .8 : 1, ao = P.ao * sel * (.94 + .06 * bow);
      outer.col.set([ao, ao, ao], j * 3); inner.col.set([ao, ao, ao], j * 3);
      if (k === 0 || k === NU) { const e = (i * 4 + (k ? 2 : 0)) * 3; rest.edge.set([o.x, o.y, o.z, n.x, n.y, n.z], e) }
    }
  }
  const idxO = [], idxI = [], idxE = [];
  for (let i = 0; i < rows - 1; i++) {
    for (let k = 0; k < NU; k++) { const a = i * (NU + 1) + k, b = a + NU + 1; if (side < 0) { idxO.push(a, a + 1, b, a + 1, b + 1, b); idxI.push(a, b, a + 1, a + 1, b, b + 1) } else { idxO.push(a, b, a + 1, a + 1, b, b + 1); idxI.push(a, a + 1, b, a + 1, b + 1, b) } }
    for (const e of [0, 2]) { const a = i * 4 + e, b = a + 4; idxE.push(a, b, a + 1, a + 1, b, b + 1) }
  }
  const geo = (p, uv, col, idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx); return g };
  outer.pos.set(rest.outer); inner.pos.set(rest.inner); edgeP.set(rest.edge);
  const gO = geo(outer.pos, outer.uv, outer.col, idxO), gI = geo(inner.pos, inner.uv, inner.col, idxI), gE = geo(edgeP, null, null, idxE);
  return { side, gO, gI, gE, rest };
}
function fabric(dbl) {
  return new THREE.MeshPhysicalMaterial({ color: 0xe4e4e4, vertexColors: true, roughness: .66, metalness: 0, sheen: 1, sheenRoughness: .32, sheenColor: new THREE.Color(0xdfe6ff),
    normalMap: cloth, normalScale: new THREE.Vector2(.45, .45), side: dbl ? THREE.DoubleSide : THREE.FrontSide, envMapIntensity: .85 });
}
let slide = null;
function buildRibbon() {
  ribbon = { halves: [] };
  [-1, 1].forEach(side => {
    const h = buildHalf(side);
    h.mO = new THREE.Mesh(h.gO, fabric()); h.mI = new THREE.Mesh(h.gI, fabric());
    h.mE = new THREE.Mesh(h.gE, new THREE.MeshPhysicalMaterial({ color: 0x24357f, roughness: .8, sheen: .6, sheenColor: new THREE.Color(0x8899cc), normalMap: cloth, side: THREE.DoubleSide }));
    rig.add(h.mO, h.mI, h.mE); ribbon.halves.push(h);
  });
  slide = new THREE.Mesh(roundedBox(42, 9, 7.6, 1.8), new THREE.MeshPhysicalMaterial({ color: 0xf0f1f3, metalness: 1, roughness: .12 }));
  rig.add(slide);
}
// twist the lanyard: points near the medal turn fully with it, the top stays still
const tw = y => 1 - smooth(slideY + 6, slideY + 6 + L * .75, y);
function deformRibbon(theta) {
  if (!ribbon) return;
  for (const h of ribbon.halves) {
    const rows = h.rest.y.length;
    const apply = (src, dst, per) => { for (let i = 0; i < rows; i++) { const a = theta * tw(h.rest.y[i]), c = Math.cos(a), s = Math.sin(a);
      for (let k = 0; k < per; k++) { const j = (i * per + k) * 3, x = src[j], z = src[j + 2]; dst[j] = c * x + s * z; dst[j + 1] = src[j + 1]; dst[j + 2] = -s * x + c * z } } };
    apply(h.rest.outer, h.gO.attributes.position.array, NU + 1); apply(h.rest.inner, h.gI.attributes.position.array, NU + 1); apply(h.rest.edge, h.gE.attributes.position.array, 4);
    for (const g of [h.gO, h.gI, h.gE]) { g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere() }
  }
  slide.position.set(0, slideY, 0); slide.rotation.y = theta * tw(slideY);
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
  ribbon.halves.forEach(h => {
    h.mO.material.map = ribTex(k, 'out'); h.mI.material.map = ribTex(k, 'in');
    h.mO.material.needsUpdate = h.mI.material.needsUpdate = true;
  });
  ROOT.querySelectorAll('.chips button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
  document.dispatchEvent(new CustomEvent('yh-course', { detail: k }));
}
window.YH_setCourse = setCourse;
ROOT.querySelectorAll('.chips button').forEach(b => b.addEventListener('click', () => setCourse(b.dataset.k)));

/* ---------- interaction + scroll ----------
   the medal swings slowly from front to back and returns (a hanging medal can't spin forever);
   dragging turns it by hand and it eases back into the swing. */
let off = 0, vel = 0, drag = false, lx = 0;
const swing = !reduce && FIX_A === null;
fg.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; fg.setPointerCapture(e.pointerId) });
fg.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; off += dx * .008; vel = dx * .008 });
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
  if (!drag) { off += vel; vel *= .9; off *= .965 }
  // a calm look left and right (about ±22°), like someone turning their head, never spinning
  const base = FIX_A !== null ? FIX_A * Math.PI / 180 : (swing ? -.06 + .34 * Math.sin(t * .42) + .05 * Math.sin(t * 1.07 + 1) : -.2);
  const theta = base + off;
  medal.rotation.y = theta;
  deformRibbon(theta);
  rig.rotation.x = -0.04 + Math.sin(t * .6) * .01;
  rig.position.y = Math.sin(t * .8) * 1.0 + 4 - p * 10;
  R.render(scene, cam);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__ready = () => !!ribbon;
