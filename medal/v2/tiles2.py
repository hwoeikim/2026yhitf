import numpy as np
from PIL import Image, ImageFilter
W,H=1800,1100
PAL={
 'white':dict(light=(252,251,249),dark=(228,225,220),shadow=(168,160,150)),
 'orange':dict(light=(255,138,46),dark=(236,92,0),shadow=(150,44,0)),
 'blue':dict(light=(22,70,238),dark=(0,34,178),shadow=(0,10,60)),
}
def bg(p):
    y,x=np.mgrid[0:H,0:W]; x=x/W; y=y/H
    t=np.clip(np.hypot((x-.5)*1.4,(y-.36)*1.1)*1.25,0,1)**1.5
    c=np.array(p['light'])*(1-t[...,None])+np.array(p['dark'])*t[...,None]
    c+=np.random.default_rng(1).normal(0,2.0,(H,W,1))
    return np.clip(c,0,255)
def make(obj,out,pal,h=None,w=None,rot=0,cx=900,bottom=930,sh=(60,80,34,.8),contact=(12,16,8,.55)):
    p=PAL[pal]; B=bg(p)
    o=Image.open(obj).convert('RGBA')
    if h: o=o.resize((int(o.width*h/o.height),h),Image.LANCZOS)
    else: o=o.resize((w,int(o.height*w/o.width)),Image.LANCZOS)
    if rot: o=o.rotate(rot,expand=True,resample=Image.BICUBIC)
    x=cx-o.width//2; y=bottom-o.height; a=o.split()[3]
    base=(np.array(p['light'])+np.array(p['dark']))/2; ratio=np.clip(np.array(p['shadow'])/base,0,1)
    for dx,dy,bl,op in (sh,contact):
        m=Image.new('L',(W,H),0); m.paste(a,(x+dx,y+dy)); m=np.asarray(m.filter(ImageFilter.GaussianBlur(bl)))/255*op
        B=B*(1-m[...,None])+B*ratio*m[...,None]
    I=Image.fromarray(B.astype(np.uint8)).convert('RGBA'); I.alpha_composite(o,(x,y))
    I.convert('RGB').save(out,quality=90); print(out)
D='/home/claude/work/medalweb/'
make('/home/claude/work/tee/tee_front.png',D+'t_tee.jpg','white',h=900,rot=-6,bottom=1010)
make('bar2.png',D+'t_bar_oats.jpg','orange',w=860,rot=-38,bottom=960,sh=(50,70,26,.85))
make('medal3d_hi.png',D+'t_medal.jpg','blue',h=1240,rot=-10,bottom=1000)
make('bar1.png',D+'t_bar_choc.jpg','white',w=860,rot=34,bottom=960,sh=(50,70,26,.7))
make('/home/claude/work/hat/hat_three.png',D+'t_hat.jpg','orange',h=560,rot=-4,bottom=840)
# coming soon: blank bg
Image.fromarray(bg(PAL['blue']).astype(np.uint8)).save(D+'t_soon.jpg',quality=88)
# 2026-10-23 added goods (sources in /home/claude/work/jk)
# make('bag_front.png',D+'t_bag.jpg','blue',h=880,rot=-5,bottom=1000)
# make('gaiter3.png',D+'t_gaiter.jpg','white',w=1300,rot=0,bottom=930,sh=(40,60,28,.6))
# make('jk_men.png',D+'t_jacket.jpg','orange',h=880,rot=-4,bottom=1010)
# 2026-10-23 rhythm pass (alternating tilt), run from /home/claude/work/goods:
# tee(hi_front from tee2.ai) white h930 rot4 b1030 | bar2 orange w900 rot20 b900 | medal3d_hi blue h1180 rot3 b1040
# bar1 white w760 rot-24 b800 (centred) | hat_three orange h600 rot6 b860 | bag_front blue h840 rot-3 b990
# gaiter3 white w1200 rot0 b900 | jk_men orange h900 rot5 b1020 | hat_signpair(h4 side+back) orange w1420 rot0 b880 -> t_hat_sign.jpg
