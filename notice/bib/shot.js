const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();for(const [n,w] of [['pc',900],['m',375]]){const p=await b.newPage({viewport:{width:w,height:800}});await p.goto('file://'+__dirname+'/preview.html');await p.screenshot({path:'bib_'+n+'.png',fullPage:true});}await b.close();})();
