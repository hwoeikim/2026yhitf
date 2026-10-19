"""THE INVITED prototype -> imweb code widget (scoped to #yh-inv, CDN images, auto KR/EN)."""
import re, sys, json
SHA = sys.argv[1]
APPLY = sys.argv[2] if len(sys.argv) > 2 else '#apply'
BASE = f'https://cdn.jsdelivr.net/gh/hwoeikim/2026yhitf@{SHA}/elite/proto/img/'
P = '/home/claude/2026yhitf/elite/proto/'
src = open(P + 'src.html').read()
maps = open('/tmp/claude-0/geo/maps3.json').read()

css = src[src.index('<style>') + 7: src.index('</style>')]
html = src[src.index('</style>') + 8: src.index('<script>')]
js = src[src.index('<script>') + 8: src.rindex('</script>')]
font = re.search(r'<link rel="stylesheet"[^>]+>', src).group(0)

# ---- CSS: drop prototype switch, rename keyframes, scope every selector
css = re.sub(r'/\* prototype-only language switch \*/\n(\.lang[^\n]*\n){3}', '', css)
KF = re.findall(r'@keyframes\s+([\w-]+)', css)
for k in KF:
    css = re.sub(r'(?<![\w-])' + re.escape(k) + r'(?![\w-])', 'yhi-' + k, css)

def scope_sel(s):
    s = s.strip()
    if not s or s.startswith('@') or re.match(r'^(from|to|\d+%)$', s): return s
    if s == ':root' or s == 'body': return '#yh-inv'
    if s == '*': return '#yh-inv,#yh-inv *'
    m = re.match(r'^\.(js|play)\b(.*)$', s)
    if m: return '#yh-inv.' + m.group(1) + m.group(2)
    return '#yh-inv ' + s

out, i, depth_kf = [], 0, 0
tokens = re.split(r'([{}])', css)
stack = []
buf = ''
res = []
for tok in tokens:
    if tok == '{':
        head = buf.strip()
        prefix_ws = buf[:len(buf) - len(buf.lstrip())]
        if head.startswith('@media') or head.startswith('@supports'):
            res.append(buf + '{'); stack.append('media')
        elif head.startswith('@keyframes'):
            res.append(buf + '{'); stack.append('kf')
        elif 'kf' in stack:
            res.append(buf + '{'); stack.append('rule')
        else:
            # strip leading comments from the selector text
            comments = ''.join(re.findall(r'/\*.*?\*/\s*', head, re.S))
            sel = re.sub(r'/\*.*?\*/', '', head, flags=re.S)
            res.append(prefix_ws + comments + ','.join(scope_sel(x) for x in sel.split(',')) + '{'); stack.append('rule')
        buf = ''
    elif tok == '}':
        res.append(buf + '}'); buf = ''
        if stack: stack.pop()
    else:
        buf += tok
res.append(buf)
css = ''.join(res)
css += """
/* imweb: keep sticky scenes below the site header, and give the page its own box */
#yh-inv{position:relative;overflow-x:clip}
#yh-inv .letter .stick{top:var(--hd,0px);height:calc(100vh - var(--hd,0px))}
#yh-inv .proc .head{top:calc(var(--hd,0px) + 48px)}
"""

# ---- HTML
html = re.sub(r'<div class="lang".*?</div>\n', '', html, flags=re.S)
html = html.replace('href="#apply"', 'href="' + APPLY + '"')

# ---- JS
js = js.replace("var root=document.documentElement;", "var root=document.getElementById('yh-inv');if(!root)return;")
js = re.sub(r"var lang='kr';try\{.*?\}catch\(e\)\{\}",
            "var lang=(/^en/i.test(document.documentElement.lang||'')||/^en\\.|yhitfeng/.test(location.hostname))?'en':'kr';", js)
js = js.replace("var cur=0,$=function(id){return document.getElementById(id)};",
                "var cur=0,$=function(id){return root.querySelector('#'+id)};")
js = re.sub(r"\n\s*\[\]\.forEach\.call\(document\.querySelectorAll\('\.lang button'\)[^\n]*", '', js)
js = js.replace("document.querySelector(", "root.querySelector(").replace("document.querySelectorAll(", "root.querySelectorAll(")
js = js.replace("__MAPS__", maps)
# header offset (fixed/sticky imweb header)
js = js.replace("function onScroll(){", """function hd(){var m=0,hs=document.querySelectorAll('#doz_header_wrap,#doz_header,header,#doz_header_wrap .inline-section-wrap,#doz_header_wrap .section_wrap');
  for(var i=0;i<hs.length;i++){var e=hs[i];if(root.contains(e))continue;var r=e.getBoundingClientRect();
    if(r.height>0&&r.height<innerHeight*.35&&r.top<=1&&r.bottom>0){var cs=getComputedStyle(e),fx=/(fixed|sticky)/.test(cs.position);
      for(var q=e.parentElement;!fx&&q&&q!==document.body;q=q.parentElement){if(/(fixed|sticky)/.test(getComputedStyle(q).position))fx=true}
      if(fx)m=Math.max(m,r.bottom)}}
  root.style.setProperty('--hd',Math.round(Math.min(m,innerHeight*.3))+'px')}
var hdN=0;
function onScroll(){if(hdN++%15===0)hd();""", 1)

roll = open('/home/claude/2026yhitf/main/logo_roll_widget.html').read()
keen = re.search(r'name:\'KEEN\',\s*src:"([^"]+)"', roll).group(1)
js = js.replace("src:'img/logos/keen.svg'", 'src:"' + keen + '"')
page = html + js
def cdn(s): return re.sub(r'(?<=["\'(])img/', BASE, s)
css, html, js = cdn(css), cdn(html), cdn(js)
assert 'img/' not in re.sub(re.escape(BASE), '', css + html + js)

out = f"""<!-- ===== YHITF · THE INVITED (엘리트 초청 페이지, 코드 위젯 1개) =====
     국문·영문 사이트 공용: 사이트 언어(html lang)를 보고 KR/EN 문구를 자동으로 고릅니다.
     이미지: GitHub(jsDelivr CDN) {SHA[:7]} 버전. 섹션 설정: 상하·좌우 여백 0, 기본 그리드 간격 끔, 가로 100% 확장. -->
{font}
<style>{css}</style>
<div id="yh-inv">{html}</div>
<script>{js}</script>
"""
open('/home/claude/2026yhitf/elite/imweb/invited_widget.html', 'w').write(out)
print(len(out), 'keyframes:', KF)
