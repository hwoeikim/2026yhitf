import numpy as np, cv2
from PIL import Image
src=np.array(Image.open('/root/.claude/uploads/f980fe7e-d75b-520a-886b-808df6efc7e2/5fcf65b4-image.png').convert('RGB')).astype(np.float32)
S=4; N=1024
def medal(cx,name):
    cy=336
    x0,x1,y0,y1=cx-112,cx+112,205,448
    c=src[y0:y1,x0:x1].copy()
    t=c[:30]; r,g,b=t[...,0],t[...,1],t[...,2]
    rib=(b>r+25)|((r>200)&(g<150)&(b<90))
    rib=cv2.dilate(rib.astype(np.uint8),np.ones((3,3)))>0
    t[rib]=255
    c=cv2.resize(c,None,fx=S,fy=S,interpolation=cv2.INTER_CUBIC)
    w=c.min(2)
    a=np.clip((246-w)/36,0,1)
    a=cv2.GaussianBlur(a,(0,0),1.2)
    a=np.clip((a-0.5)*3+0.5,0,1)  # crisp edges after upscale
    a[27:49,262:632]=1; c[27:49,262:632]=(188,188,188)
    # bleed colours outward under transparent pixels
    solid=(a>0.95).astype(np.uint8)
    col=c.copy()
    m=solid.copy()
    for _ in range(12):
        dil=cv2.dilate(col*m[...,None],np.ones((3,3)),iterations=1)
        cnt=cv2.dilate(m.astype(np.float32),np.ones((3,3)),iterations=1)
        k=(m==0)&(cnt>0)
        # average via blur instead
        b=cv2.blur(col*m[...,None],(3,3)); bm=cv2.blur(m.astype(np.float32),(3,3))
        col[k]=(b[k]/np.maximum(bm[k][:,None],1e-3)); m=m|k.astype(np.uint8)
    # tone: copper richer, silver brighter
    hsv=cv2.cvtColor(np.clip(col,0,255).astype(np.uint8),cv2.COLOR_RGB2HSV).astype(np.float32)
    cop=(hsv[...,1]>60)&(hsv[...,2]>120)
    hsv[...,1][cop]=np.minimum(hsv[...,1][cop]*1.15,255)
    sil=(hsv[...,1]<40)&(hsv[...,2]>140)
    hsv[...,2][sil]=np.minimum(hsv[...,2][sil]*1.2,255)
    col=cv2.cvtColor(hsv.astype(np.uint8),cv2.COLOR_HSV2RGB).astype(np.float32)
    lum=col.mean(2)
    # height: bevel from alpha edge, raised copper bands, engraved dark text
    inside=(a>0.5).astype(np.uint8)
    d=cv2.distanceTransform(inside,cv2.DIST_L2,5)
    h=np.clip(d/10,0,1)**0.6
    h+=0.35*cop.astype(np.float32)
    dark=(lum<110)&(a>0.5)
    h-=0.45*cv2.GaussianBlur(dark.astype(np.float32),(0,0),1.0)
    h=cv2.GaussianBlur(h.astype(np.float32),(0,0),1.6)
    gx=cv2.Sobel(h,cv2.CV_32F,1,0,ksize=3); gy=cv2.Sobel(h,cv2.CV_32F,0,1,ksize=3)
    st=3.2
    nx=-gx*st; ny=gy*st; nz=np.ones_like(nx)
    l=np.sqrt(nx*nx+ny*ny+nz*nz); nrm=np.stack([nx/l,ny/l,nz/l],2)*0.5+0.5
    rough=np.where(cop,0.4,0.34); rough=np.where(dark,0.7,rough)
    def place(img,ch):
        out=np.zeros((N,N,ch),np.float32); hh,ww=img.shape[:2]
        oy=(N-hh)//2; ox=(N-ww)//2; out[oy:oy+hh,ox:ox+ww]=img.reshape(hh,ww,ch); return out,ox,oy
    rgba=np.dstack([col,a*255])
    o,ox,oy=place(rgba,4); Image.fromarray(np.clip(o,0,255).astype(np.uint8),'RGBA').save(f'{name}_col.png')
    o,_,_=place(nrm*255,3); Image.fromarray(o.astype(np.uint8)).save(f'{name}_nrm.png')
    r=np.dstack([np.zeros_like(rough),rough,np.ones_like(rough)])*255  # G=rough,B=metal
    o,_,_=place(r,3); Image.fromarray(o.astype(np.uint8)).save(f'{name}_rm.png')
    # disc centre/radius in texture uv
    ccx=(cx-x0)*S+ox; ccy=(cy-y0)*S+oy
    print(name,'centre',ccx/N,ccy/N,'radius',104*S/N)
medal(249,'front'); medal(483,'back')
rows=[540,631,723,812]
for i,r in enumerate(rows):
    s=Image.open('/root/.claude/uploads/f980fe7e-d75b-520a-886b-808df6efc7e2/5fcf65b4-image.png').convert('RGB').crop((14,r+1,1048,r+78))
    s=s.resize((s.width*2,s.height*2),Image.LANCZOS).rotate(90,expand=True)
    s.save(f'rib{i}.jpg',quality=90)
print(Image.open('rib0.jpg').size)
