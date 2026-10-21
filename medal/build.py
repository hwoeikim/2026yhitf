import base64,json
t={}
for n in ['front_col','front_nrm','front_rm','back_col','back_nrm','back_rm']:
    t[n]='data:image/webp;base64,'+base64.b64encode(open(n+'.webp','rb').read()).decode()
for i,k in enumerate([5,10,15,28]):
    t['rib%d'%i]='data:image/svg+xml;base64,'+base64.b64encode(open('ribbon_%dk.svg'%k,'rb').read()).decode()
s=open('src.html').read().replace('__TEX__',json.dumps(t))
open('medal.html','w').write(s); print(len(s))
