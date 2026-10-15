/* PCO Print Packet - main code. Loaded by the small "Print Packet" bookmark (see packet/index.html).
   Builds all 11 Bentonville production reports for a plan into one document, 2 pages per report
   (front = plan, back = teams or stage plot), each plan page auto-fitted to exactly one page. */
(async()=>{
const ST=1014028,B=location.origin;
const PW=758,PH=990;
const FIT=972;
const GROUPS=[
['Bentonville AM - Audio',155688],['Bentonville AM - GFX',155689],['Bentonville AM - Lighting',155690],
['Bentonville AM - Ushers',155691],['Bentonville AM - Livestream',155692],['Bentonville AM - Production Coord',155693],
['Bentonville PM - Audio',155694],['Bentonville PM - GFX',155695],['Bentonville PM - Lighting',155696],
['Bentonville PM - Ushers',155697],['Bentonville PM - Production Coord',155698]];
const w=window.__pktWin||window.open('','_blank');
window.__pktWin=null;
if(!w){alert('Your browser blocked the pop-up. Allow pop-ups for Planning Center (icon at the right end of the address bar), then click the bookmark again.');return;}
const d=w.document;
d.title='Building packet...';
d.body.innerHTML='<p id="msg" style="font:18px Helvetica,Arial,sans-serif;padding:30px">Starting...</p>';
const say=t=>{const m=d.getElementById('msg');if(m)m.textContent=t;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const j=async p=>{const r=await fetch(B+'/~api/services/v2/'+p,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('Planning Center answered '+r.status+' for '+p);return r.json();};
const waitFor=async(fn,ms)=>{const t=Date.now();while(Date.now()-t<(ms||60000)){try{const v=fn();if(v)return v;}catch(e){}await sleep(250);}throw new Error('Timed out waiting for Planning Center to respond');};
const loadFrame=(doc,src,hidden)=>new Promise(res=>{const f=doc.createElement('iframe');f.style.cssText='border:0;width:'+PW+'px;height:'+PH+'px;'+(hidden?'position:fixed;left:-9999px;top:0;':'');f.onload=()=>res(f);f.src=src;doc.body.appendChild(f);});
try{
let pid,label,iso;
const m=location.pathname.match(/\/plans\/(\d+)/);
if(m){pid=m[1];const a=(await j('service_types/'+ST+'/plans/'+pid+'?fields[Plan]=dates,sort_date')).data.attributes;label=a.dates;iso=a.sort_date.slice(0,10);}
else{const p=(await j('service_types/'+ST+'/plans?filter=future&per_page=1&fields[Plan]=dates,sort_date')).data[0];pid=p.id;label=p.attributes.dates;iso=p.attributes.sort_date.slice(0,10);}
let done=0;
say('Plan: '+label+' - loading reports (0 of '+GROUPS.length+')...');
const getReport=async(id)=>{
const f=await loadFrame(document,B+'/report_templates/'+id+'/report.html?plan_id='+pid,true);
const x=await waitFor(()=>{const i=f.contentDocument.getElementById('report-iframe');const dd=i&&i.contentDocument;return dd&&dd.readyState==='complete'&&dd.querySelector('.pg1 table.plan')&&dd.querySelector('.pg2')?dd:null;});
const out={html:x.body.innerHTML,css:[...x.querySelectorAll('style')].map(s=>s.textContent).join('\n')};
f.remove();done++;say('Plan: '+label+' - loading reports ('+done+' of '+GROUPS.length+')...');return out;};
const results=[];
for(let i=0;i<GROUPS.length;i+=4){const chunk=await Promise.all(GROUPS.slice(i,i+4).map(r=>getReport(r[1])));chunk.forEach(c=>results.push(c));}
const stages={};
(await j('service_types/'+ST+'/plans/'+pid+'/stages?fields[Stage]=name&per_page=100')).data.forEach(s=>{stages[s.attributes.name]=s.id;});
say('Fitting pages...');
const name='Bentonville Production Packet - '+iso;
const css=results[0].css+'\nsection.rep{width:'+PW+'px;margin:0 auto}.pg2{page-break-after:always;break-after:page}.noprint{font:14px Helvetica,Arial,sans-serif;background:#ffffcc;border-bottom:1px solid #cc9;padding:10px 14px}.noprint button{font-size:15px;padding:6px 14px;margin-right:12px}.noprint .warn{color:#a00;margin-top:6px}@media print{.noprint{display:none!important}}@media screen{body{background:#999}section.rep{background:#fff;margin:14px auto;box-shadow:0 0 6px #0006}}';
d.head.innerHTML='<meta charset="utf-8"><title>'+name+'</title><style>'+css+'</style>';
d.body.innerHTML='';
const bar=d.createElement('div');bar.className='noprint';
bar.innerHTML='<button id="pb">Print / Save as PDF</button><b>'+name+'</b> &nbsp; In the print dialog choose <b>Save as PDF</b>, Paper <b>Letter</b>, Margins <b>Default</b>, and uncheck <b>Headers and footers</b>.<div class="warn" id="warns"></div>';
d.body.appendChild(bar);
d.getElementById('pb').addEventListener('click',()=>w.print());
const secs=[];
results.forEach((res,k)=>{const s=d.createElement('section');s.className='rep';s.dataset.name=GROUPS[k][0];s.innerHTML=res.html;d.body.appendChild(s);secs.push(s);});
await Promise.all([...d.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r;})));
await sleep(300);
const warns=[];
/* make the name tags on a stage plot bigger and nudge overlapping tags apart */
const spread=(fd,K)=>{const GAP=3;const els=[...fd.querySelectorAll('.stage-member-container')];
const it=els.map(e=>({e,w:e.offsetWidth*K,h:e.offsetHeight*K,cx:parseFloat(e.style.left)+e.offsetWidth/2,cy:parseFloat(e.style.top)+e.offsetHeight/2}));
const st=fd.querySelector('.stage');const SW=st.offsetWidth,SH=st.offsetHeight;
for(let p=0;p<80;p++){let moved=false;
for(let a=0;a<it.length;a++)for(let b=a+1;b<it.length;b++){const A=it[a],B=it[b];
const ox=(A.w+B.w)/2+GAP-Math.abs(A.cx-B.cx),oy=(A.h+B.h)/2+GAP-Math.abs(A.cy-B.cy);
if(ox>0&&oy>0){moved=true;if(ox<oy){const s=(A.cx<=B.cx?-1:1)*ox/2;A.cx+=s;B.cx-=s;}else{const s=(A.cy<=B.cy?-1:1)*oy/2;A.cy+=s;B.cy-=s;}}}
it.forEach(i=>{i.cx=Math.min(SW-i.w/2,Math.max(i.w/2,i.cx));i.cy=Math.min(SH-i.h/2,Math.max(i.h/2,i.cy));});
if(!moved)break;}
it.forEach(i=>{const e=i.e;e.style.transformOrigin='center center';e.style.transform='scale('+K+')';e.style.left=(i.cx-e.offsetWidth/2)+'px';e.style.top=(i.cy-e.offsetHeight/2)+'px';});
};
const fit=(sec,idx)=>{
const inner=sec.querySelector('.pg1 .inner');if(!inner)return;
const tbl=inner.querySelector('table.plan');
let lv=14;
for(;lv>=0;lv--){inner.className='inner d'+lv;if(inner.offsetHeight<=FIT&&tbl.scrollWidth<=inner.clientWidth+1)break;}
if(lv<0){inner.className='inner d0';warns.push(sec.dataset.name+': content is too long for one page even at the smallest size - the bottom is cut off.');return;}
if(lv<=1)warns.push(sec.dataset.name+': fits, but at a very small size.');
sec.dataset.lvl=lv;
if(lv<14){
const cls='fx'+idx;inner.classList.add(cls);
const st=d.createElement('style');d.head.appendChild(st);
const td=tbl.querySelector('tbody tr.row td');
const base=td?parseFloat(w.getComputedStyle(td).paddingTop):2;
let lo=base,hi=base+16;
const rule=p=>'.'+cls+' table.plan td{padding-top:'+p+'px!important;padding-bottom:'+p+'px!important}.'+cls+' tr.header td{padding-top:'+(p+2)+'px!important;padding-bottom:'+(p+2)+'px!important}';
for(let i=0;i<12;i++){const mid=(lo+hi)/2;st.textContent=rule(mid);if(inner.offsetHeight<=FIT&&tbl.scrollWidth<=inner.clientWidth+1)lo=mid;else hi=mid;}
st.textContent=rule(lo);
}
};
secs.forEach(fit);
say('Adding stage plots...');
const jobs=[];
secs.forEach((sec)=>{
const pg2=sec.querySelector('.pg2');const sn=pg2&&pg2.dataset.stage;
if(!sn)return;
const sid=stages[sn];
if(!sid){warns.push(sec.dataset.name+': no "'+sn+'" on this plan, so the team list is printed on the back instead.');return;}
jobs.push((async()=>{
const hdrEnd=pg2.querySelector('.pg2body');
const avail=pg2.getBoundingClientRect().bottom-hdrEnd.getBoundingClientRect().top-6;
const f=d.createElement('iframe');
f.style.cssText='display:block;border:0;width:'+PW+'px;height:'+avail+'px;background:#fff';
f.src=B+'/service_types/'+ST+'/plans/'+pid+'/standard_report.html?stage_ids%5B%5D='+sid+'&font_size=9pt&logo=false&in_color=true';
hdrEnd.innerHTML='';hdrEnd.appendChild(f);
const rk=pg2.querySelector('.rk');if(rk)rk.textContent='Stage Plot';
await new Promise(res=>{f.onload=res;});
const fd=f.contentDocument;
await waitFor(()=>fd.querySelector('.stage-container'));
let top=fd.querySelector('.stage-container');while(top.parentElement!==fd.body)top=top.parentElement;
[...fd.body.children].forEach(c=>{if(c!==top)c.remove();});
const st=fd.createElement('style');
st.textContent='*{-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;overflow:hidden;background:#fff}';
fd.head.appendChild(st);
await sleep(500);
spread(fd,1.3);
const r=top.getBoundingClientRect();
const bw=Math.max(top.scrollWidth,r.width,1),bh=Math.max(top.scrollHeight,r.height,1);
const z=Math.min(PW/bw,avail/bh);
top.style.width=bw+'px';top.style.transformOrigin='0 0';top.style.transform='scale('+z+')';
})());
});
await Promise.all(jobs);
const last=d.body.lastElementChild;
const lp=last.querySelector('.pg2');if(lp){lp.style.pageBreakAfter='auto';lp.style.breakAfter='auto';}
d.getElementById('warns').innerHTML=warns.map(x=>'&#9888; '+x).join('<br>');
d.title=name;
w.focus();
if(!warns.length)setTimeout(()=>w.print(),800);
}catch(e){say('Something went wrong: '+e.message);}
})();
