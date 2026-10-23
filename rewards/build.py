"""medal/v2/page.html + medal.js -> rewards/widget.html for an imweb code widget.
Assets load from jsDelivr at a fixed commit. Usage: python3 build.py <commitSHA>"""
import re, sys
SHA=sys.argv[1]
VAR=sys.argv[2] if len(sys.argv)>2 else 'main'
V='/home/claude/2026yhitf/medal/v2/'
CDN=f'https://cdn.jsdelivr.net/gh/hwoeikim/2026yhitf@{SHA}/medal/v2/'
s=open(V+'page.html').read()
s=re.sub(r'<title>.*?</title>\n','',s)
# scope page-level rules to the wrapper
s=s.replace(':root{--bg:#0b0b0c;--fg:#ffffff;--mint:#A9CDB7;color-scheme:dark}','#yh-rewards{--bg:#0b0b0c;--fg:#ffffff;--mint:#A9CDB7;color-scheme:dark;background:var(--bg);color:var(--fg);font-family:"Pretendard","Noto Sans KR",system-ui,sans-serif;letter-spacing:-.02em;word-break:keep-all}')
s=re.sub(r'\nhtml,body\{[^}]*\}','\n#yh-rewards *,#yh-rewards *::before,#yh-rewards *::after{box-sizing:border-box}',s)
s=s.replace('::view-transition-group(*)','::view-transition-group(*)')
# header offset for sticky stages
s=s.replace('#yh-rw .stage{position:sticky;top:0;height:100vh;','#yh-rw .stage{position:sticky;top:var(--hd,0px);height:calc(100vh - var(--hd,0px));')
s=s.replace('#yh-model .pin{position:sticky;top:0;height:100vh;','#yh-model .pin{position:sticky;top:var(--hd,0px);height:calc(100vh - var(--hd,0px));')
# assets -> CDN
s=re.sub(r'(src|srcset|href)="((?:[a-z_0-9]+)\.(?:webp|jpg|png|svg))"',lambda m:f'{m.group(1)}="{CDN}{m.group(2)}"',s)
s=re.sub(r'url\(([a-z_0-9]+\.svg)\)',lambda m:f'url({CDN}{m.group(1)})',s)
s=s.replace("i.setAttribute('href','rib_'+k","i.setAttribute('href','"+CDN+"rib_'+k").replace("i.src='strip_'+k","i.src='"+CDN+"strip_'+k")
# module: no importmap, direct import
s=s.replace('<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>\n','')
# start the heavy downloads at once (3D engine, medal shape, first lanyard art)
PRE=('<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js">'
     f'<link rel="modulepreload" href="{CDN}medal.js">'
     f'<link rel="preload" as="fetch" crossorigin="anonymous" href="{CDN}shape.json">'
     f'<link rel="preload" as="image" crossorigin="anonymous" href="{CDN}rib_28k_out.jpg">'
     f'<link rel="preload" as="image" crossorigin="anonymous" href="{CDN}rib_28k_in.jpg">\n')
s=PRE+s
s=s.replace('<script type="module" src="medal.js"></script>',f'<script>window.YH_ASSET_BASE="{CDN}";</script>\n<script type="module" src="{CDN}medal.js"></script>')
hd='''<script>
(function(){var root=document.getElementById('yh-rewards'),last=-1;
function hd(){var m=0,hs=document.querySelectorAll('#doz_header_wrap,#doz_header,header,#doz_header_wrap .inline-section-wrap,#doz_header_wrap .section_wrap,.inline-section-wrap.fixed_transf');
  for(var i=0;i<hs.length;i++){var e=hs[i];if(root.contains(e))continue;var r=e.getBoundingClientRect();
    if(r.height>0&&r.height<innerHeight*.35&&r.top<innerHeight*.2&&r.bottom>0){var fx=false;for(var q=e;q&&q!==document.body;q=q.parentElement){if(/(fixed|sticky)/.test(getComputedStyle(q).position)){fx=true;break}}if(fx)m=Math.max(m,r.bottom)}}
  m=Math.round(Math.min(m,innerHeight*.3));if(m!==last){last=m;root.style.setProperty('--hd',m+'px')}}
addEventListener('scroll',hd,{passive:true});addEventListener('resize',hd);hd();setTimeout(hd,800);})();
</script>'''
css,prize,strip=open('/home/claude/2026yhitf/rewards/prize_src.txt').read().split('\n=====\n')
s=s.replace('</style>',css+'</style>',1)
add=strip if VAR=='main' else prize
k=s.index('<script>window.YH_ASSET_BASE')
s=s[:k]+add+'\n'+s[k:]
out=f'<div id="yh-rewards">\n{s}\n{hd}\n</div>'
open(f'/home/claude/2026yhitf/rewards/widget_{VAR}.html','w').write(out); print(len(out))
