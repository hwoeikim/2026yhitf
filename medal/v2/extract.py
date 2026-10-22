from PIL import Image
import numpy as np, cv2, json
from scipy import ndimage as ndi
N=2048
def proc(fn, tag):
    a=np.asarray(Image.open(fn).convert('RGB')).astype(int).copy()
    r,g,b=a[...,0],a[...,1],a[...,2]
    org=(r>200)&(g<150)&(b<90)
    yy=np.arange(a.shape[0])[:,None]
    a[org&(yy<390)]=255
    a[org&(yy>=390)]=[188,188,188]
    sx0,sx1=(850,2063) if tag=='front' else (846,2059)
    a[478:557,sx0:sx1]=255
    a=a[370:]
    r,g,b=a[...,0],a[...,1],a[...,2]
    white=(r>232)&(g>232)&(b>232)
    dark=(r<120)&(g<120)&(b<120)
    copper=(r-b>60)&(g>100)&(r>170)&~((r>200)&(g<150)&(b<90))
    orange=(r>200)&(g<150)&(b<90)
    solid=~white
    lab,n=ndi.label(solid); sizes=ndi.sum(solid,lab,range(1,n+1)); k=np.argmax(sizes)+1
    sil=lab==k
    ys,xs=np.nonzero(sil); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
    print(tag,'bbox',x0,y0,x1,y1)
    cls=np.zeros(white.shape,np.uint8)  # 0 empty 1 silver 2 copper 3 dark
    cls[sil]=1; cls[sil&copper]=2; cls[sil&dark]=3; cls[sil&orange]=1
    # dark pixels near outside/holes -> nearest metal (outline stroke at silhouette edge)
    dist_out=ndi.distance_transform_edt(sil)
    metal=(cls==1)|(cls==2)
    _,(iy,ix)=ndi.distance_transform_edt(~metal,return_indices=True)
    edge=(cls==3)&(dist_out<=16)
    cls[edge]=cls[iy[edge],ix[edge]]
    # square crop
    cx=(x0+x1)/2; cy=(y0+y1)/2; S=int(max(x1-x0,y1-y0)*1.02)
    X0=int(cx-S/2); Y0=int(cy-S/2)
    pad=np.zeros((S,S),np.uint8)
    sy0=max(Y0,0); sx0=max(X0,0); sy1=min(Y0+S,cls.shape[0]); sx1=min(X0+S,cls.shape[1])
    pad[sy0-Y0:sy1-Y0, sx0-X0:sx1-X0]=cls[sy0:sy1,sx0:sx1]
    big=pad
    small=cv2.resize(big,(N,N),interpolation=cv2.INTER_NEAREST)
    np.save(tag+'_cls.npy',small)
    info=dict(S=S,X0=X0,Y0=Y0,px_per_mm=None)
    return small,info
f,fi=proc('front-1.png','front'); b,bi=proc('back-1.png','back')
sf=f>0; sb=np.fliplr(b>0)
print('IoU mirror', (sf&sb).sum()/(sf|sb).sum(), 'IoU same', (sf&(b>0)).sum()/(sf|(b>0)).sum())
pal=np.array([[20,20,20],[190,190,190],[225,145,105],[40,30,20]],np.uint8)
Image.fromarray(np.concatenate([pal[f],pal[b]],1)).resize((1024,512)).save('cls_preview.png')
json.dump([fi,bi],open('crop.json','w'))
