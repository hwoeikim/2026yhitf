import numpy as np, cv2, sys
from PIL import Image
from scipy import ndimage as ndi
def lineart(src, out, H=900, lo=30, hi=90, minlen=60, blur=1.6, stroke=2.2, inner=True, alpha_thr=40, dark_fill=False, seal=False):
    im=Image.open(src).convert('RGBA'); s=H/im.height; im=im.resize((int(im.width*s),H),Image.LANCZOS)
    a=np.asarray(im).astype(np.float32); al=a[...,3]>alpha_thr
    al=ndi.binary_opening(ndi.binary_fill_holes(al),iterations=2)
    pad=20; al=np.pad(al,pad); rgb=np.pad(a[...,:3],((pad,pad),(pad,pad),(0,0)),constant_values=255)
    edges=np.zeros(al.shape,bool)
    # outline
    er=ndi.binary_erosion(al,iterations=1); edges|=al&~er
    if inner:
        g=cv2.cvtColor(rgb.astype(np.uint8),cv2.COLOR_RGB2GRAY)
        g=cv2.bilateralFilter(g,9,40,6); g=cv2.GaussianBlur(g,(0,0),blur)
        c=cv2.Canny(g,lo,hi)>0
        c&=ndi.binary_erosion(al,iterations=6)
        lab,n=ndi.label(ndi.binary_dilation(c,iterations=1)); 
        if n:
            sz=ndi.sum(c,lab,range(1,n+1)); keep=np.isin(lab,np.nonzero(sz>=minlen)[0]+1); c&=keep
        edges|=c
    if seal:
        ys,xs=np.nonzero(al); x0,x1=xs.min(),xs.max(); w=x1-x0
        for f in (.075,.925):
            x=int(x0+w*f); col=np.nonzero(al[:,x])[0]; edges[col.min()+6:col.max()-6,x]=True
        for f in (.035,.965):
            x=int(x0+w*f); col=np.nonzero(al[:,x])[0]
            for y in range(col.min()+14,col.max()-10,14): edges[y,x-8:x+8]=True
    m=ndi.binary_dilation(edges,iterations=int(round(stroke)))
    if dark_fill:
        g2=cv2.cvtColor(rgb.astype(np.uint8),cv2.COLOR_RGB2GRAY)
        dk=(g2<110)&ndi.binary_erosion(al,iterations=4); dk=ndi.binary_opening(dk,iterations=1)
        lab,n=ndi.label(dk)
        if n: sz=ndi.sum(dk,lab,range(1,n+1)); dk=np.isin(lab,np.nonzero((sz>=25)&(sz<2500))[0]+1)
        # drop the traced double-lines inside/around dark marks, then fill them solid
        near=ndi.binary_dilation(dk,iterations=5); m=(m&~(near&~ndi.binary_dilation(edges&~near,iterations=0)))|dk
        m=(m&~near)|dk|(ndi.binary_dilation(al&~ndi.binary_erosion(al,iterations=1),iterations=int(round(stroke)))&near)
    m=cv2.GaussianBlur(m.astype(np.float32),(0,0),1.0)>.45
    cnts,hier=cv2.findContours(m.astype(np.uint8),cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
    d=[]
    for cn in cnts:
        cn=cv2.approxPolyDP(cn,0.8,True)[:,0,:]
        if len(cn)<3: continue
        d.append('M'+' L'.join(f'{x},{y}' for x,y in cn)+'Z')
    h,w=m.shape
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><path fill="currentColor" fill-rule="evenodd" d="{" ".join(d)}"/></svg>'
    open(out,'w').write(svg); Image.fromarray((~m*255).astype(np.uint8)).save(out.replace('.svg','.png')); print(out,len(svg)//1024,'KB')
if __name__=='__main__':
    H='/home/claude/work/hat/'
    for n in ['front','side','back']: lineart(H+f'hat_{n}.png',f'l_hat_{n}.svg',H=700,lo=25,hi=70,minlen=40,dark_fill=True)
    T='/home/claude/work/tee/'
    lineart(T+'tee_front.png','l_tee_front.svg',H=900,lo=5,hi=16,minlen=70,alpha_thr=100,blur=2.2)
    lineart(T+'tee_back.png','l_tee_back.svg',H=900,lo=5,hi=16,minlen=70,alpha_thr=100,blur=2.2)
    G='/home/claude/work/goods/'
    lineart(G+'bar2.png','l_bar.svg',H=420,inner=False,seal=True)
    lineart('/home/claude/work/medal3/shaded_front.png','l_medal.svg',H=900,lo=30,hi=80,minlen=40)
