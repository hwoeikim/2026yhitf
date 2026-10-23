import numpy as np, cv2, json
from scipy import ndimage as ndi
from PIL import Image
info=json.load(open('crop.json'))
N=2048
S=info[0]['S']; ppm800=800/25.4
mm_per_px=(S/ppm800)/N
print('tex mm/px',mm_per_px,'size mm',S/ppm800)
def build(tag):
    c=np.load(tag+'_cls.npy')
    sil=c>0
    metal=(c==1)|(c==2)
    d=ndi.distance_transform_edt(metal)*mm_per_px      # mm to nearest non-metal
    w=0.9
    t=np.clip(d/w,0,1); dome=1-(1-t)**2.2               # rounded shoulders
    h=np.where(metal,0.35*dome,0.0)
    dark=c==3
    dd=ndi.distance_transform_edt(dark)*mm_per_px
    h=np.where(dark,-0.10*np.clip(dd/0.12,0,1),h)
    h=cv2.GaussianBlur(h.astype(np.float32),(0,0),1.2)
    np.save(tag+'_h.npy',h)
    # normal (tangent space, +y up in image => flip y)
    gx=cv2.Sobel(h,cv2.CV_32F,1,0,ksize=3)/(8*mm_per_px)
    gy=cv2.Sobel(h,cv2.CV_32F,0,1,ksize=3)/(8*mm_per_px)
    nx=-gx; ny=gy; nz=np.ones_like(h)
    l=np.sqrt(nx*nx+ny*ny+nz*nz); n=np.stack([nx/l,ny/l,nz/l],-1)
    nrm=((n*0.5+0.5)*255).astype(np.uint8)
    # AO / cavity
    blur=cv2.GaussianBlur(h,(0,0),6)
    cav=np.clip(1-(blur-h)*6,0.55,1.0)
    # color (sRGB)
    col=np.zeros((N,N,3),np.float32)
    col[c==1]=[0.86,0.865,0.88]     # silver (bright, slightly cool)
    col[c==2]=[0.93,0.62,0.50]      # rose gold / copper
    col[dark]=[0.30,0.27,0.25]      # antique recess
    # dark recess picks up tint of neighbour metal a bit
    rough=np.full((N,N),0.2,np.float32); rough[c==2]=0.24; rough[dark]=0.62
    rough=rough+ (1-dome)*0.08*metal
    metal_m=np.where(dark,0.55,1.0)
    a=(sil*255).astype(np.uint8)
    Image.fromarray(np.dstack([(np.clip(col,0,1)*255).astype(np.uint8),a])).save(f'tex_{tag}_col.png')
    Image.fromarray(nrm).save(f'tex_{tag}_nrm.png')
    orm=np.dstack([cav*255,np.clip(rough,0,1)*255,metal_m*255]).astype(np.uint8)
    Image.fromarray(orm).save(f'tex_{tag}_orm.png')
    return sil
sf=build('front'); sb=build('back')
# silhouette contour from front (union with mirrored back for safety)
sil=(sf|np.fliplr(sb)).astype(np.uint8)*255
sil=cv2.morphologyEx(sil,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
cnts,hier=cv2.findContours(sil,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
hier=hier[0]
shapes=[]
for i,cn in enumerate(cnts):
    if hier[i][3]!=-1: continue
    if cv2.contourArea(cn)<200: continue
    outer=cv2.approxPolyDP(cn,0.6,True)[:,0,:]
    holes=[]
    j=hier[i][2]
    while j!=-1:
        if cv2.contourArea(cnts[j])>150:
            holes.append(cv2.approxPolyDP(cnts[j],0.6,True)[:,0,:].tolist())
        j=hier[j][0]
    shapes.append({'outer':outer.tolist(),'holes':holes})
print('shapes',len(shapes),[ (len(s['outer']),len(s['holes'])) for s in shapes])
json.dump({'N':N,'mm_per_px':mm_per_px,'shapes':shapes},open('shape.json','w'))
