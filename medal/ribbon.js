const fs=require('fs'), opentype=require('opentype.js');
const EB=opentype.loadSync('node_modules/pretendard/dist/public/static/Pretendard-ExtraBold.otf');
const parse=f=>{const s=fs.readFileSync('logo/'+f,'utf8');const vb=s.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  return {vb, defs:s.match(/<defs>([\s\S]*?)<\/defs>/)[1], body:s.slice(s.indexOf('</defs>')+7, s.lastIndexOf('</svg>'))};};
const SYM=parse('symbol_white.svg'), WM=parse('wordmark_white.svg');
const defsMap=new Map(); for(const d of [SYM.defs,WM.defs]) for(const m of d.matchAll(/<(linearGradient|radialGradient)[\s\S]*?<\/\1>/g)){const id=m[0].match(/id="([^"]+)"/)[1]; defsMap.set(id,m[0]);}
const ORANGE='#FF6D07', BLUE='#002ACF';
const H=300, B=150, W=1800;                       // ribbon width 30mm = 300 units, one repeat = 1800
function text(str,size,ls){ // returns {d,width,asc} for baseline at 0, x at 0
  let x=0, d=''; const g=EB.stringToGlyphs(str);
  g.forEach((gl,i)=>{ const p=gl.getPath(x,0,size); d+=p.toPathData(2); x+=gl.advanceWidth*size/EB.unitsPerEm + (i<g.length-1?ls:0);
    if(i<g.length-1){ x+=EB.getKerningValue(gl,g[i+1])*size/EB.unitsPerEm; } });
  const bb=new opentype.Path(); return {d,width:x};
}
function bbox(d){ const p=new opentype.Path(); return null; }
function useSym(cx,cy,h){ const [x,y,w,hh]=SYM.vb, s=h/hh; return `<use href="#sym" x="${(cx-w*s/2).toFixed(1)}" y="${(cy-h/2).toFixed(1)}" width="${(w*s).toFixed(1)}" height="${h}"/>`; }
function useWm(x0,cy,h){ const [x,y,w,hh]=WM.vb, s=h/hh; return {svg:`<use href="#wm" x="${x0.toFixed(1)}" y="${(cy-h/2).toFixed(1)}" width="${(w*s).toFixed(1)}" height="${h}"/>`, w:w*s}; }
function build(km){
  let out=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${[...defsMap.values()].join('\n')}
<symbol id="sym" viewBox="${SYM.vb.join(' ')}">${SYM.body}</symbol>
<symbol id="wm" viewBox="${WM.vb.join(' ')}">${WM.body}</symbol></defs>
<rect width="${W}" height="${B}" fill="${ORANGE}"/><rect y="${B}" width="${W}" height="${B}" fill="${BLUE}"/>\n`;
  const symH=B*0.62;
  // top band: symbol | Korean title, symbol repeats at the seam (x=0 and x=W)
  const kr=text('2026 연합뉴스 하남 국제 트레일런 페스티벌',82,-1.5);
  const capKR=82*0.72;                                    // visual height of hangul in Pretendard ≈ .72em
  const yTop=B/2+capKR/2;
  out+=useSym(0,B/2,symH)+useSym(W,B/2,symH)+"\n";
  const krX=(W-kr.width)/2;
  out+=`<path fill="#fff" transform="translate(${krX.toFixed(1)} ${yTop.toFixed(1)})" d="${kr.d}"/>\n`;
  // bottom band: wordmark | symbol | 5KM FINISHER | symbol
  const fin=text(`${km}KM FINISHER`,88,1.2), capEN=88*0.73;
  const wm=useWm(0,0,B*0.48);
  const gap=(W - wm.w - fin.width - 2*symH*0.9)/4;
  let x=gap/2;
  const w1=useWm(x,B+B/2,B*0.48); out+=w1.svg; x+=w1.w+gap;
  out+=useSym(x+symH*0.45,B+B/2,symH*0.9); x+=symH*0.9+gap;
  out+=`<path fill="#fff" transform="translate(${x.toFixed(1)} ${(B+B/2+capEN/2).toFixed(1)})" d="${fin.d}"/>`; x+=fin.width+gap;
  out+=useSym(x+symH*0.45,B+B/2,symH*0.9);
  out+='\n</svg>';
  fs.writeFileSync(`ribbon_${km}k.svg`,out); return out.length;
}
for(const k of [5,10,15,28]) console.log(k,build(k));
