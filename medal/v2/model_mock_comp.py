import numpy as np, cv2
from PIL import Image
T='/home/claude/work/tee/'
photo=np.asarray(Image.open('model.jpg').convert('RGB')).astype(np.float32)
H,W,_=photo.shape
L=cv2.cvtColor(photo.astype(np.uint8),cv2.COLOR_RGB2GRAY).astype(np.float32)
Lb=cv2.GaussianBlur(L,(0,0),2.2)
Lbb=cv2.GaussianBlur(L,(0,0),7)
gx=cv2.Sobel(Lbb,cv2.CV_32F,1,0,ksize=5)/64; gy=cv2.Sobel(Lbb,cv2.CV_32F,0,1,ksize=5)/64
def place(art, quad):
    q=np.float32(quad); tw=int(np.linalg.norm(q[1]-q[0])); th=int(np.linalg.norm(q[3]-q[0]))
    im=Image.open(T+art).convert('RGBA'); im=im.resize((tw*2,th*2),Image.LANCZOS)
    a=np.asarray(im).astype(np.float32); h,w=a.shape[:2]
    M=cv2.getPerspectiveTransform(np.float32([[0,0],[w,0],[w,h],[0,h]]),np.float32(quad))
    return cv2.warpPerspective(a,M,(W,H),flags=cv2.INTER_LINEAR,borderValue=(0,0,0,0))
layer=np.zeros((H,W,4),np.float32)
def add(l):
    global layer
    al=l[...,3:]/255; layer[...,:3]=l[...,:3]*al+layer[...,:3]*(1-al); layer[...,3:]=np.maximum(layer[...,3:],l[...,3:])
def quad(cx,cy,w,h,rot=0,persp=0):
    # persp>0 shrinks the right edge
    pts=np.array([[-w/2,-h/2*(1+persp)],[w/2,-h/2*(1-persp)],[w/2,h/2*(1-persp)],[-w/2,h/2*(1+persp)]])
    r=np.deg2rad(rot); R=np.array([[np.cos(r),-np.sin(r)],[np.sin(r),np.cos(r)]])
    return (pts@R.T)+[cx,cy]
# --- placements (full image coords)
add(place('art_chest.png', quad(522,563,96,38,rot=-3,persp=.04)))
add(place('art_backlogo.png', quad(1158,532,168,124,rot=-1.5,persp=.03)))
add(place('art_backlow.png', quad(1184,925,120,109,rot=-1,persp=.03)))
add(place('art_sleeve.png', quad(270,772,68,69,rot=30)))
# displacement along fabric folds
k=1.8
mx,my=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
dxm=np.clip(gx*k,-2.5,2.5); dym=np.clip(gy*k,-2.5,2.5)
layer=cv2.remap(layer,mx+dxm,my+dym,cv2.INTER_LINEAR)
# shirt mask: dark fabric only (skin/wall excluded)
hsv=cv2.cvtColor(photo.astype(np.uint8),cv2.COLOR_RGB2HSV).astype(np.float32)
shirt=((L<125)&~((hsv[...,1]>70)&(L>70))).astype(np.float32)
shirt=cv2.GaussianBlur(cv2.morphologyEx(shirt,cv2.MORPH_OPEN,np.ones((3,3))),(0,0),1.2)
al=layer[...,3]/255*shirt*.96
# fabric light: lit areas brighter, folds darker
ref=np.percentile(L[(L<125)&(L>8)],60)
rel=np.clip((Lb-ref)/max(ref,1),-.75,2.0); shade=1.04+.3*rel
hp=(L-Lb)
ink=layer[...,:3]*shade[...,None] + hp[...,None]*1.1
# ink sits on black fabric: a touch of the fabric bleeds through
ink=ink*.97+photo*.03
ink=cv2.GaussianBlur(ink,(0,0),.55)
out=photo*(1-al[...,None])+ink*al[...,None]
out=np.clip(out,0,255).astype(np.uint8)
Image.fromarray(out).save('model_mock.jpg',quality=93)
for n,b in [('man',(380,480,680,860)),('woman',(980,380,1380,1060)),('sleeve',(180,680,380,880))]:
    Image.fromarray(out).crop(b).save(f'mk_{n}.png')
