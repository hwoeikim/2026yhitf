import asyncio, sys, math, os
from playwright.async_api import async_playwright

FPS = 30
DUR = 10.5
OUT = sys.argv[1] if len(sys.argv) > 1 else 'frames'
ONLY = [float(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
os.makedirs(OUT, exist_ok=True)

def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def eio(x): x = clamp(x); return 4*x*x*x if x < .5 else 1-((-2*x+2)**3)/2
def eo(x): x = clamp(x); return 1-(1-x)**4
def expo_o(x): x = clamp(x); return 1 if x >= 1 else 1-2**(-10*x)
def seg(t, a, b): return clamp((t-a)/(b-a))

# time -> scroll progress p (widget timeline), all segments eased (no linear motion)
KEYS = [  # (t0, t1, p0, p1, ease)  -- v3: faster cut
    (0.0, 0.35, 0.0, 0.0, eio),
    (0.35, 1.3, 0.0, 0.17, eio),    # world -> Korea
    (1.3, 1.36, 0.17, 0.24, eio),
    (1.36, 2.3, 0.24, 0.35, eio),   # Korea -> Hanam
    (2.3, 3.5, 0.35, 0.56, eio),    # pull back to the folded cover
    (3.5, 3.8, 0.56, 0.56, eio),
    (3.8, 5.3, 0.56, 0.86, eio),    # unfold on the hit
    (5.3, 10.5, 0.86, 0.86, eio),
]
def p_at(t):
    for t0, t1, p0, p1, e in KEYS:
        if t <= t1: return p0+(p1-p0)*e(seg(t, t0, t1))
    return KEYS[-1][3]

JS_STATE = """([t,p,cam,camx,camy,tx,ty,hudIn,hudP,endA,endKr,endUrl,fade,swap,creep])=>new Promise(res=>{
  const E=document.getElementById('end');E.querySelector('.bg').style.opacity=Math.max(0,Math.min(1,(fade-.85)/.15));const HL=E.querySelector('.hl');HL.style.opacity=swap;HL.style.transform='translate('+(camx+tx-270)+'px,'+(camy+ty-232)+'px) scale('+(cam/window.ZOOM*creep)+')';document.querySelectorAll('#yh-lf .txt h3').forEach(x=>x.style.opacity=swap>=1?0:1);
  document.querySelectorAll('#yh-lf .items,#yh-lf .lg,#yh-lf .mp,#yh-lf .shade').forEach(x=>x.style.opacity=1-fade);
  if(fade>0)document.querySelectorAll('#yh-lf .lf .face,#yh-lf .lf .sheet,#yh-lf .lf .txt').forEach(x=>{x.style.background='#fff';x.style.boxShadow='none'});
  const r=document.getElementById('yh-lf');
  window.scrollTo(0, r.offsetTop + p*(r.offsetHeight-innerHeight));
  window.dispatchEvent(new Event('scroll'));
  const s=r.querySelector('.stick');
  s.style.transformOrigin=camx+'px '+camy+'px';
  s.style.transform='translate('+tx+'px,'+ty+'px) scale('+cam+')';
  const h2=r.querySelector('.hud h2'), hp=r.querySelector('.hud p');
  h2.style.transform='translateY('+((1-hudIn)*-6)+'vh) scale('+(1+(1-hudIn)*.35)+')';
  h2.style.filter='blur('+((1-hudIn)*14)+'px)';
  h2.style.opacity=Math.min(1,hudIn*1.6);
  hp.style.opacity=hudP; hp.style.transform='translateY('+((1-hudP)*3)+'vh)';
  const e=document.getElementById('end');
  e.querySelector('.lk').style.opacity=endA; e.querySelector('.lk').style.transform='translateX(-50%) translateY('+((1-endA)*4)+'vh)';
  e.querySelector('.kr').style.opacity=endKr;e.querySelector('.kr').style.transform='translateY('+((1-endKr)*3)+'vh)';e.querySelector('.ev').style.opacity=endA; e.querySelector('.ev').style.transform='translateY('+((1-endA)*2)+'vh)';
  e.querySelector('.url').style.opacity=endUrl; e.querySelector('.url').style.transform='translateY('+((1-endUrl)*3)+'vh)';
  requestAnimationFrame(()=>requestAnimationFrame(()=>res(1)));
})"""

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={'width': 540, 'height': 960}, device_scale_factor=2)
        await pg.goto('file:///home/claude/reel_elite/h.html')
        await pg.wait_for_timeout(2000)
        # headline position when the sheet is open, for the closing camera move
        await pg.evaluate(JS_STATE, [0, .86, 1, 270, 480, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1])
        await pg.wait_for_timeout(300)
        hb = await pg.evaluate("""(()=>{const h=[...document.querySelectorAll('#yh-lf .txt h3')].filter(e=>e.getBoundingClientRect().width>0)[0];const rg=document.createRange();rg.selectNodeContents(h);const rs=[...rg.getClientRects()];const l=Math.min(...rs.map(r=>r.left)),r=Math.max(...rs.map(r=>r.right)),t=Math.min(...rs.map(r=>r.top)),b=Math.max(...rs.map(r=>r.bottom));return [l,t,r-l,b-t]})()""")
        hx, hy = hb[0]+hb[2]/2, hb[1]+hb[3]/2
        zoom_to = 470/hb[2]   # headline ends ~93% of the frame width
        print('headline', hb, 'zoom', zoom_to, flush=True)
        ov = await pg.evaluate("""([z,cx,cy,hw])=>{const h=[...document.querySelectorAll('#yh-lf .txt h3')].filter(e=>e.getBoundingClientRect().width>0)[0];const c=getComputedStyle(h);const o=document.querySelector('#end .hl');o.innerHTML=h.innerHTML;o.style.fontSize=(parseFloat(c.fontSize)*z)+'px';o.style.lineHeight=(parseFloat(c.lineHeight)*z)+'px';o.style.letterSpacing=c.letterSpacing==='normal'?'normal':(parseFloat(c.letterSpacing)*z)+'px';o.style.fontVariationSettings=c.fontVariationSettings;o.style.fontStretch=c.fontStretch;o.style.textAlign=c.textAlign;
          const rg=document.createRange();rg.selectNodeContents(o);const rs=[...rg.getClientRects()];const l=Math.min(...rs.map(r=>r.left)),r=Math.max(...rs.map(r=>r.right)),t=Math.min(...rs.map(r=>r.top)),b=Math.max(...rs.map(r=>r.bottom));
          const want=z*hw;const k=want/(r-l);o.style.fontSize=(parseFloat(o.style.fontSize)*k)+'px';o.style.lineHeight=(parseFloat(o.style.lineHeight)*k)+'px';if(o.style.letterSpacing!=='normal')o.style.letterSpacing=(parseFloat(o.style.letterSpacing)*k)+'px';
          {const rs2=[...(()=>{const g=document.createRange();g.selectNodeContents(o);return g.getClientRects()})()];const l2=Math.min(...rs2.map(r=>r.left)),r2=Math.max(...rs2.map(r=>r.right)),t2=Math.min(...rs2.map(r=>r.top)),b2=Math.max(...rs2.map(r=>r.bottom));
          const L=cx-(l2+r2)/2,T=cy-(t2+b2)/2;o.style.left=L+'px';o.style.top=T+'px';o.style.transformOrigin=(cx-L)+'px '+(cy-T)+'px';return [l2,t2,r2-l2,b2-t2]}}""", [zoom_to, 270, 232, hb[2]])
        print('overlay', ov, flush=True)
        await pg.evaluate(f'window.ZOOM={zoom_to}')
        n = int(DUR*FPS)
        times = ONLY if ONLY else [i/FPS for i in range(n)]
        for i, t in enumerate(times):
            p = p_at(t)
            # living camera on the open sheet, then push into the headline
            drift = 1+0.06*eio(seg(t, 5.0, 6.4))
            push = eio(seg(t, 6.3, 7.6))
            cam = drift+(zoom_to*1.0-drift)*push
            creep = 1+0.03*eio(seg(t, 7.6, 10.5))
            # move headline up toward the visual center (slightly above middle)
            camx, camy = hx, hy
            # Origin-based scaling keeps the headline fixed; add a translate by shifting origin over time
            hudIn = expo_o(seg(t, 0.0, 0.4)); hudP = eo(seg(t, 0.2, 0.6))
            endKr = eo(seg(t, 7.5, 7.95)); endA = eo(seg(t, 7.7, 8.15)); endUrl = eo(seg(t, 7.9, 8.4))
            await pg.evaluate(JS_STATE, [t, p, cam, camx, camy, (270-hx)*push, (232-hy)*push, hudIn, hudP, endA, endKr, endUrl, eio(seg(t, 6.2, 7.0)), eio(seg(t, 6.25, 6.45)), creep])
            name = f'{OUT}/f_{i:04d}.png' if not ONLY else f'{OUT}/t_{t:05.2f}.png'
            await pg.screenshot(path=name)
            if i % 30 == 0: print(i, flush=True)
        await b.close()

asyncio.run(main())
