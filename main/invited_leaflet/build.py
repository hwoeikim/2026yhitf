"""src.html -> invited_leaflet_widget.html (map data inlined, logos from jsDelivr at a fixed commit)."""
import json, sys
D='/home/claude/2026yhitf/main/invited_leaflet/'
SHA=sys.argv[1] if len(sys.argv)>1 else '69d756e8fe8fbb25119da0cb32a701f2bab9ce1c'
cdn='https://cdn.jsdelivr.net/gh/hwoeikim/2026yhitf@'+SHA+'/brand/'
s=open(D+'src.html').read()
s=s.replace('__MAPS__',json.dumps(json.load(open(D+'maps4.json')),separators=(',',':')))
s=s.replace('__PMAP__',json.dumps(json.load(open(D+'print_map.json')),separators=(',',':')))
s=s.replace('__LOGO_W__',cdn+'lockup_white.svg').replace('__LOGO_C__',cdn+'lockup_color.svg')
open(D+'widget.html','w').write(s); print(len(s))
