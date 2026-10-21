document.documentElement.classList.add("js");

/* theme toggle, saved (same key as the landing page) */
(function(){
  const root=document.documentElement, key="zksi-theme";
  try{ const s=localStorage.getItem(key); if(s) root.dataset.theme=s; }catch(e){}
  const q=new URLSearchParams(location.search).get("theme"); if(q) root.dataset.theme=q;
  document.getElementById("theme").addEventListener("click",()=>{
    const cur=root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
    root.dataset.theme = cur==="dark"?"light":"dark";
    try{ localStorage.setItem(key,root.dataset.theme); }catch(e){}
  });
})();

/* ---------- helpers ---------- */
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const ORANGE="#E45E3F";
function onView(el,fn,once=true,margin="0px 0px -15% 0px"){
  const io=new IntersectionObserver(es=>es.forEach(e=>{fn(e.isIntersecting,e);if(e.isIntersecting&&once)io.disconnect();}),{rootMargin:margin});
  io.observe(el);
}
function fit(cv){const d=Math.min(devicePixelRatio||1,2),w=cv.clientWidth,h=cv.clientHeight;cv.width=Math.round(w*d);cv.height=Math.round(h*d);const c=cv.getContext("2d");c.setTransform(d,0,0,d,0,0);return {c,w,h};}
function bgOf(n){ while(n){ const c=getComputedStyle(n).backgroundColor; if(c&&c!=="rgba(0, 0, 0, 0)"&&c!=="transparent") return c; n=n.parentElement; } return getComputedStyle(document.body).backgroundColor; }
let themeVer=0; const themeCbs=[];
new MutationObserver(()=>{themeVer++; themeCbs.forEach(f=>f());}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
const palCache=new WeakMap();
function tok(el,name){const s=document.createElement("i");s.style.cssText=`display:none;color:var(${name})`;el.appendChild(s);const c=getComputedStyle(s).color;s.remove();return c;}
function pal(el){ let p=palCache.get(el); if(p&&p.v===themeVer) return p;
  const host=el.parentElement; p={v:themeVer,fg:getComputedStyle(el).color,bg:bgOf(el),mute:tok(host,"--fg-2")}; palCache.set(el,p); return p; }
function seeded(s){ return ()=>(s=(s*16807)%2147483647)/2147483647; }
const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const fmt=n=>n.toLocaleString("en-US");

/* header, progress, reveal, toc */
(function(){
  const top=$(".top"), prog=$("#prog");
  const f=()=>{ top.classList.toggle("solid",scrollY>40); const m=document.documentElement.scrollHeight-innerHeight; prog.style.width=(m>0?scrollY/m*100:0)+"%"; };
  f(); addEventListener("scroll",f,{passive:true}); addEventListener("resize",f);
  $$(".reveal").forEach(el=>onView(el,v=>{if(v)el.classList.add("in");}));
  const links=$$(".toc a");
  $$(".dsec").forEach(s=>onView(s,v=>{ if(v) links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+s.id)); },false,"-35% 0px -60% 0px"));
})();

/* hero: dithered noise field, palette only, fades into the page with the same dither */
(function(){
  const cv=$("#dfield"); if(!cv) return;
  const ctx=cv.getContext("2d"), off=document.createElement("canvas"), oc=off.getContext("2d");
  const S=4; let cols=0,rows=0,img=null,vis=true;
  const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const rgb=s=>s.match(/\d+/g).slice(0,3).map(Number);
  const mix=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
  function size(){ const d=Math.min(devicePixelRatio||1,2); cv.width=Math.round(cv.clientWidth*d); cv.height=Math.round(cv.clientHeight*d);
    cols=Math.max(1,Math.ceil(cv.clientWidth/S)); rows=Math.max(1,Math.ceil(cv.clientHeight/S)); off.width=cols; off.height=rows; img=oc.createImageData(cols,rows); }
  function draw(t){
    const base=rgb(bgOf(cv)), dark=base[0]<100;
    const cOr=dark?mix(base,hx("#E45E3F"),.8):hx("#E45E3F");
    const cOl=mix(base,hx("#C7C7A3"),dark?.42:.6);
    const cLi=dark?mix(base,hx("#EBFF79"),.85):hx("#EBFF79");
    const cSp=dark?[245,244,240]:[33,33,33];
    const d=img.data, fr=(t*8)|0;
    for(let y=0;y<rows;y++){
      const ny=y/rows, fade=(ny<.5?1:Math.max(0,1-(ny-.5)/.5))*Math.min(1,.35+ny/.16), Y=y*.045;
      for(let x=0;x<cols;x++){
        const X=x*.045;
        const a=Math.sin(X*.9+t*.35+Math.sin(Y*.7-t*.2)*1.6);
        const b=Math.sin(Y*1.1-t*.28+Math.sin(X*.6+t*.15)*1.9);
        const v=(.5+.25*a+.25*b)*fade;
        const th=B4[(y&3)*4+(x&3)]/16-.5;
        const q=v+th*.3;
        let c=base;
        if(q>.74) c=cOr; else if(q>.56) c=cOl;
        if(fade>.35){ const l=Math.sin(X*2.3+Y*1.9+t*.8+a*2.2); if(l+th*.35>.955&&q>.5) c=cLi; }
        if(((x*7919+y*104729+fr*31337)%1009)===0&&fade>.2) c=cSp;
        const i=(y*cols+x)*4; d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2]; d[i+3]=255;
      }
    }
    oc.putImageData(img,0,0); ctx.imageSmoothingEnabled=false; ctx.drawImage(off,0,0,cv.width,cv.height);
  }
  size(); new ResizeObserver(()=>{size();draw(4);}).observe(cv);
  onView(cv,v=>vis=v,false,"0px");
  themeCbs.push(()=>draw(RM?4:performance.now()/1000+4));
  if(RM){ draw(4); return; }
  let last=0; (function frame(now){ requestAnimationFrame(frame); if(!vis||now-last<40) return; last=now; draw(now/1000+4); })(0);
})();

/* 01 crowd: 50 people alone vs 50 inside 1,000 */
(function(){
  const cv=$("#crowd"); if(!cv) return;
  const say=$("#crowdSay"), btns=$$("[data-n]");
  let g=fit(cv), on=0, k=0, user=false, vis=false, since=0;
  addEventListener("resize",()=>g=fit(cv));
  const r=seeded(11), pts=Array.from({length:1000},()=>({x:r(),y:r(),ph:r()*6.28,s:r()}));
  function set(n){ on=n; btns.forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.n===n)));
    say.innerHTML=n?"<b>noise on</b> · 1,000 requests · 50 are people, 950 are decoys":"<b>noise off</b> · 50 requests · each one is a person"; }
  btns.forEach(b=>b.addEventListener("click",()=>{user=true;set(+b.dataset.n);}));
  function draw(t){
    const {c,w,h}=g, P=pal(cv); c.clearRect(0,0,w,h);
    k+=(on-k)*(RM?1:.07);
    const m=18, W=w-m*2, H=h-m*2;
    const pos=(p,i)=>[m+p.x*W+Math.sin(t*.0009+p.ph)*2.5, m+p.y*H+Math.cos(t*.0011+p.ph)*2.5];
    c.fillStyle=P.fg;
    for(let i=50;i<1000;i++){ const a=Math.max(0,Math.min(1,k*1.8-pts[i].s*.8)); if(a<=0) continue;
      const [x,y]=pos(pts[i]); c.globalAlpha=.5*a; c.fillRect(x-1.5,y-1.5,3,3); }
    for(let i=0;i<50;i++){ const [x,y]=pos(pts[i]), s=6-3*k;
      if(k>.02){ c.globalAlpha=.5*k; c.fillStyle=P.fg; c.fillRect(x-s/2,y-s/2,s,s); }
      c.globalAlpha=1-k; c.fillStyle=ORANGE; c.fillRect(x-s/2,y-s/2,s,s);
      c.globalAlpha=(1-k)*.55; c.strokeStyle=ORANGE; c.lineWidth=1; c.beginPath(); c.arc(x,y,9+Math.sin(t*.004+i)*1.5,0,6.283); c.stroke(); }
    c.globalAlpha=1;
  }
  set(0);
  onView(cv,v=>{vis=v; if(v) since=performance.now();},false,"0px");
  themeCbs.push(()=>draw(0));
  if(RM){ draw(0); btns.forEach(b=>b.addEventListener("click",()=>draw(0))); return; }
  (function frame(t){ requestAnimationFrame(frame); if(!vis) return;
    if(!user&&t-since>3400){ since=t; set(on?0:1); }
    draw(t); })(0);
})();

/* 02 grid: 1,000 slots, real vs decoys */
(function(){
  const cv=$("#grid"); if(!cv) return;
  const inp=$("#rIn"), pres=$$(".gctl [data-r]"), rowsT=$$("#gTable tbody tr"), obs=$("#obs");
  const N=1000, CO=40, RO=25, T=1000;
  let g=fit(cv), R=50, vis=false, observer=false;
  addEventListener("resize",()=>g=fit(cv));
  const r=seeded(5), perm=[...Array(N).keys()];
  for(let i=N-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [perm[i],perm[j]]=[perm[j],perm[i]]; }
  const rank=new Int16Array(N); perm.forEach((cell,i)=>rank[cell]=i);
  const st=new Float32Array(N); for(let i=0;i<N;i++) st[i]=rank[i]<R?1:0;
  const ph=Float32Array.from({length:N},()=>r()*6.28);
  function set(v){ R=Math.max(0,Math.min(T,v)); inp.value=R; const D=T-R;
    $("#gR").textContent=fmt(R); $("#gD").textContent=fmt(D); $("#gS").textContent=Math.round(D/T*100)+"%"; $("#gM").textContent=fmt(D);
    pres.forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.r===R)));
    rowsT.forEach(tr=>tr.classList.toggle("hl",+tr.dataset.r===R));
    if(RM) draw(0); }
  inp.addEventListener("input",()=>set(+inp.value));
  pres.forEach(b=>b.addEventListener("click",()=>set(+b.dataset.r)));
  rowsT.forEach(tr=>tr.addEventListener("click",()=>{ set(+tr.dataset.r); cv.scrollIntoView({block:"center",behavior:RM?"auto":"smooth"}); }));
  obs.addEventListener("click",()=>{ observer=!observer; obs.setAttribute("aria-pressed",String(observer)); if(RM) draw(0); });
  function draw(t){
    const {c,w,h}=g, P=pal(cv); c.clearRect(0,0,w,h);
    const cw=w/CO, ch=h/RO, gp=Math.max(1,cw*.16);
    for(let i=0;i<N;i++){
      const tgt=rank[i]<R?1:0; st[i]=RM?tgt:st[i]+(tgt-st[i])*.16;
      const x=(i%CO)*cw, y=((i/CO)|0)*ch, tw=.26+.1*Math.sin(t*.003+ph[i]);
      c.globalAlpha=tw; c.fillStyle=P.fg; c.fillRect(x+gp/2,y+gp/2,cw-gp,ch-gp);
      const v=observer?0:st[i];
      if(v>.01){ c.globalAlpha=v; c.fillStyle=ORANGE; c.fillRect(x+gp/2,y+gp/2,cw-gp,ch-gp); }
    }
    c.globalAlpha=1;
  }
  set(50);
  onView(cv,v=>vis=v,false,"0px");
  addEventListener("resize",()=>draw(0)); themeCbs.push(()=>draw(0));
  if(RM){ draw(0); return; }
  (function frame(t){ requestAnimationFrame(frame); if(vis) draw(t); })(0);
})();

/* 02 timeline: real grows, decoys shrink, total stays flat */
(function(){
  const svg=$("#tl"); if(!svg) return;
  const read=$("#tlRead");
  const X0=64,X1=780,Y0=34,Y1=250, yv=v=>Y1-v/1000*(Y1-Y0), xp=u=>X0+u*(X1-X0);
  const sg=u=>1/(1+Math.exp(-9*(u-.5))), s0=sg(0), s1=sg(1);
  const real=u=>50+850*(sg(u)-s0)/(s1-s0);
  const n=120, pts=[...Array(n+1)].map((_,i)=>[xp(i/n),yv(real(i/n))]);
  const curve=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
  const realA=`${curve} L${X1} ${Y1} L${X0} ${Y1} Z`;
  const noiseA=`${curve} L${X1} ${yv(1000)} L${X0} ${yv(1000)} Z`;
  const T=(x,y,t,a="start",st="fill:var(--fg-2)")=>`<text x="${x}" y="${y}" text-anchor="${a}" style="${st}">${t}</text>`;
  let s=`<g style="color:var(--fg);font-family:'JetBrains Mono',monospace;font-size:11px">`;
  s+=`<defs><pattern id="dz" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="1.6" height="1.6" fill="currentColor"/></pattern>`;
  s+=`<clipPath id="tlc"><rect id="tlcr" x="${X0}" y="0" width="0" height="300"/></clipPath></defs>`;
  [0,500,1000].forEach(v=>{ s+=`<line x1="${X0}" x2="${X1}" y1="${yv(v)}" y2="${yv(v)}" stroke="currentColor" opacity=".12"/>`+T(X0-10,yv(v)+4,fmt(v),"end"); });
  s+=`<g clip-path="url(#tlc)"><path d="${noiseA}" fill="url(#dz)" opacity=".6"/><path d="${realA}" style="fill:var(--orange)"/>`;
  s+=`<line x1="${X0}" x2="${X1}" y1="${yv(1000)}" y2="${yv(1000)}" stroke="currentColor" stroke-width="2.5"/></g>`;
  s+=T(X1,yv(1000)-10,"observer sees: 1,000 req/min, flat","end","fill:currentColor");
  s+=T(X0+14,yv(1000)+40,"decoys from miners","start","fill:currentColor;paint-order:stroke;stroke:var(--bg);stroke-width:5px");
  s+=T(X1-12,Y1-14,"real users","end","fill:var(--paper-2)");
  s+=T(X0,Y1+26,"launch")+T(X1,Y1+26,"network grows →","end");
  s+=`<g id="scan" opacity="0"><line id="scL" y1="${Y0-6}" y2="${Y1}" stroke="currentColor" stroke-dasharray="3 3"/><circle id="scC" r="5" style="fill:var(--orange)" stroke="currentColor" stroke-width="1.5"/></g>`;
  s+=`</g>`; svg.innerHTML=s;
  const cr=svg.querySelector("#tlcr"), sc=svg.querySelector("#scan"), L=svg.querySelector("#scL"), C=svg.querySelector("#scC");
  function scan(u){ const x=xp(u), v=Math.round(real(u)/10)*10; L.setAttribute("x1",x); L.setAttribute("x2",x); C.setAttribute("cx",x); C.setAttribute("cy",yv(real(u)));
    sc.setAttribute("opacity","1"); read.textContent=`real ${fmt(v)} · decoys ${fmt(1000-v)}`; }
  if(RM){ cr.setAttribute("width",X1-X0); scan(.3); return; }
  let vis=false, t0=null;
  onView(svg,v=>{ vis=v; if(v&&t0===null) t0=performance.now(); },false,"0px 0px -10% 0px");
  (function frame(t){ requestAnimationFrame(frame); if(!vis||t0===null) return;
    const e=(t-t0)/1000; cr.setAttribute("width",Math.min(1,e/1.6)*(X1-X0));
    if(e>1.6){ const p=((e-1.6)/7)%2, u=p<1?p:2-p; scan(.5-.5*Math.cos(u*Math.PI)); } })(0);
})();

/* 03 pipeline: network decoys stop at the last hop, endpoint decoys reach the model */
(function(){
  const cv=$("#pipe"); if(!cv) return;
  const btns=$$("[data-m]");
  let g=fit(cv), mode="all", vis=false, pk=[], fx=[], last={net:0,end:0,real:0}, flash=0;
  const cnt={drop:0,hit:0,real:0,lo:0,hi:0};
  addEventListener("resize",()=>g=fit(cv));
  /* horizontal on wide screens, vertical on phones */
  const LH={you:[.07,.34],mn:[.07,.74],h1:[.31,.52],h2:[.46,.52],h3:[.61,.52],gw:[.78,.52],md:[.93,.52]};
  const LV={you:[.3,.07],mn:[.7,.07],h1:[.5,.27],h2:[.5,.42],h3:[.5,.57],gw:[.5,.75],md:[.5,.91]};
  const route={real:["you","h1","h2","h3","gw","md"],net:["you","h1","h2","h3"],end:["mn","h1","h2","h3","gw","md"]};
  const every={net:130,end:320,real:1800};
  btns.forEach(b=>b.addEventListener("click",()=>{ mode=b.dataset.m; btns.forEach(x=>x.setAttribute("aria-pressed",String(x===b))); }));
  function spawn(type){ pk.push({type,keys:route[type],dy:(Math.random()-.5)*.16,d:0,v:.9+Math.random()*.25}); }
  const show=t=>mode==="all"||mode===t;
  function upd(){ $("#pDrop").textContent=fmt(cnt.drop); $("#pHit").textContent=fmt(cnt.hit); $("#pReal").textContent=fmt(cnt.real);
    $("#pCost").textContent=`$${cnt.lo.toFixed(2)} - $${cnt.hi.toFixed(2)}`; }
  function draw(t,dt){
    const {c,w,h}=g, P=pal(cv), vert=w<560, N=vert?LV:LH; c.clearRect(0,0,w,h);
    const px=p=>[p[0]*w,p[1]*h];
    const at=(p,k,i,n)=>{ const b=N[k], off=(i>0&&i<n-1)?(k==="gw"?p.dy*.4:p.dy):0; return vert?[(b[0]+off*.9)*w,b[1]*h]:[b[0]*w,(b[1]+off)*h]; };
    const F=`${vert?10:11}px "JetBrains Mono", monospace`;
    c.strokeStyle=P.fg; c.globalAlpha=.18; c.lineWidth=1;
    [["you","h1"],["mn","h1"],["h1","h2"],["h2","h3"],["h3","gw"],["gw","md"]].forEach(([a,b])=>{ const A=px(N[a]),Bp=px(N[b]); c.beginPath(); c.moveTo(A[0],A[1]); c.lineTo(Bp[0],Bp[1]); c.stroke(); });
    c.globalAlpha=1; c.strokeStyle=P.mute; c.font=F; c.fillStyle=P.mute;
    const H1=px(N.h1),H3=px(N.h3);
    if(vert){ const bx=H1[0]-w*.22; c.beginPath(); c.moveTo(bx+8,H1[1]-16); c.lineTo(bx,H1[1]-16); c.lineTo(bx,H3[1]+16); c.lineTo(bx+8,H3[1]+16); c.stroke();
      c.save(); c.translate(bx-8,(H1[1]+H3[1])/2); c.rotate(-Math.PI/2); c.textAlign="center"; c.fillText("mixnet",0,0); c.restore(); }
    else { const by=H1[1]-h*.2; c.beginPath(); c.moveTo(H1[0]-16,by+8); c.lineTo(H1[0]-16,by); c.lineTo(H3[0]+16,by); c.lineTo(H3[0]+16,by+8); c.stroke();
      c.textAlign="center"; c.fillText("mixnet",(H1[0]+H3[0])/2,by-8); }
    const speed=(vert?h:w)*.26;
    pk=pk.filter(p=>{
      if(dt) p.d+=speed*p.v*dt/1000;
      const n=p.keys.length; let rem=p.d, pos=null;
      for(let i=0;i<n-1;i++){ const A=at(p,p.keys[i],i,n), Bp=at(p,p.keys[i+1],i+1,n), L=Math.hypot(Bp[0]-A[0],Bp[1]-A[1]);
        if(rem<=L){ const k=rem/L; pos=[A[0]+(Bp[0]-A[0])*k,A[1]+(Bp[1]-A[1])*k]; break; } rem-=L; }
      if(!pos){ const e=at(p,p.keys[n-1],n-1,n);
        if(p.type==="net"){ cnt.drop++; fx.push(vert?{x:e[0]+(Math.random()-.5)*20,y:e[1]+20,life:1}:{x:e[0]+16,y:e[1]+(Math.random()-.5)*20,life:1}); }
        else { cnt.hit++; flash=1; if(p.type==="real") cnt.real++; else { cnt.lo+=.001; cnt.hi+=.005; } }
        return false; }
      if(p.type==="real"){ c.fillStyle=ORANGE; c.fillRect(pos[0]-4,pos[1]-4,8,8); }
      else if(p.type==="end"){ c.strokeStyle=P.fg; c.globalAlpha=.85; c.lineWidth=1.3; c.strokeRect(pos[0]-3,pos[1]-3,6,6); c.globalAlpha=1; }
      else { c.fillStyle=P.fg; c.globalAlpha=.55; c.fillRect(pos[0]-1.5,pos[1]-1.5,3,3); c.globalAlpha=1; }
      return true; });
    fx=fx.filter(f=>{ f.life-=dt?dt/450:0; if(f.life<=0) return false; c.globalAlpha=f.life; c.fillStyle=P.fg; c.font='12px "JetBrains Mono", monospace'; c.textAlign="center"; c.fillText("×",vert?f.x:f.x+(1-f.life)*8,vert?f.y+(1-f.life)*8:f.y); c.globalAlpha=1; return true; });
    const lab=(p,t,d)=>{ c.fillStyle=P.mute; c.font=F; if(vert){ c.textAlign="left"; c.fillText(t,p[0]+d,p[1]+4); } else { c.textAlign="center"; c.fillText(t,p[0],p[1]+d); } };
    let p=px(N.you); c.fillStyle=P.fg; c.beginPath(); c.arc(p[0],p[1],7,0,6.283); c.fill(); lab(p,"you",vert?14:24);
    p=px(N.mn); c.save(); c.translate(p[0],p[1]); c.rotate(Math.PI/4); c.fillStyle="#C7C7A3"; c.fillRect(-7,-7,14,14); c.strokeStyle=P.fg; c.lineWidth=1.2; c.strokeRect(-7,-7,14,14); c.restore(); lab(p,"miners",vert?16:26);
    [["h1","hop 1"],["h2","hop 2"],["h3","last hop"]].forEach(([k,t])=>{ const q=px(N[k]); c.fillStyle=P.bg; c.strokeStyle=P.fg; c.lineWidth=1.3; c.beginPath(); c.arc(q[0],q[1],vert?11:13,0,6.283); c.fill(); c.stroke(); lab(q,t,vert?22:32); });
    p=px(N.gw); const gs=vert?18:22; c.fillStyle=P.bg; c.fillRect(p[0]-gs/2,p[1]-gs/2,gs,gs); c.strokeRect(p[0]-gs/2,p[1]-gs/2,gs,gs); lab(p,"gateway",vert?22:32);
    p=px(N.md); const ms=vert?24:28;
    if(flash>0){ c.globalAlpha=flash*.35; c.fillStyle=ORANGE; c.fillRect(p[0]-ms/2-6,p[1]-ms/2-6,ms+12,ms+12); c.globalAlpha=1; flash=Math.max(0,flash-(dt||0)/300); }
    c.fillStyle=P.bg; c.fillRect(p[0]-ms/2,p[1]-ms/2,ms,ms); c.strokeRect(p[0]-ms/2,p[1]-ms/2,ms,ms); c.fillStyle=P.fg; c.fillRect(p[0]-ms/4,p[1]-ms/4,ms/2,ms/2); lab(p,"SI model",vert?24:36);
  }
  onView(cv,v=>vis=v,false,"0px");
  themeCbs.push(()=>draw(0,0)); addEventListener("resize",()=>{ if(RM) draw(0,0); });
  if(RM){ ["net","end","real"].forEach(tp=>{ for(let i=0;i<(tp==="net"?14:tp==="end"?6:1);i++){ spawn(tp); pk[pk.length-1].d=Math.random()*Math.max(g.w,g.h)*(tp==="net"?.45:.7); } }); draw(0,0); return; }
  let prev=0;
  (function frame(t){ requestAnimationFrame(frame); const dt=Math.min(50,t-prev); prev=t; if(!vis) return;
    ["net","end","real"].forEach(tp=>{ if(show(tp)&&t-last[tp]>every[tp]){ last[tp]=t; spawn(tp); } });
    draw(t,dt); upd(); })(0);
})();

/* 04 lens: the same traffic seen from each seat */
(function(){
  const feed=$("#feed"); if(!feed) return;
  const side=$("#lside"), path=$("#lpath"), btns=$$("[data-p]"), tr=$("#truth");
  const P={
    you:{n:"your client",sees:"Your real requests",not:"-",lab:"PLANNED"},
    n1:{n:"first mixnet node",sees:"Your IP, that you send traffic, when",not:"Content, which packets are real",lab:"PLANNED"},
    n3:{n:"last mixnet node",sees:"Traffic leaving the mixnet",not:"Your IP",lab:"PLANNED"},
    gw:{n:"gateway",sees:"Request content, audit nullifiers",not:"Your IP. Whether it can tell real from decoy:",v:true,lab:"PLANNED"},
    si:{n:"SI provider",sees:"Content of every request and response, real and decoy",not:"Your IP, which requests are real",lab:"PLANNED"},
    mn:{n:"miner",sees:"Only its own decoys",not:"Your requests",lab:"PLANNED"},
    ch:{n:"chain observer",sees:"Stakes, commits (hashes), audit results, payouts",not:"Any request content",lab:"PLANNED"}};
  const order=[["you","you"],["n1","first node"],["n3","last node"],["gw","gateway"],["si","SI provider"]];
  const PR=["rewrite this email so it sounds more formal","explain how a heat pump works, simply","translate this paragraph into German","5 dinner ideas with lentils and rice","what does the error ENOENT mean in node","summarize these meeting notes in 3 bullets","is it normal for a cat to sleep 16 hours","compare two mortgage offers, which is cheaper","fix the grammar in this cover letter","how long to boil an egg for a soft yolk","draft a polite reminder about an unpaid invoice","what is a nullifier in zero-knowledge proofs","plan a 3-day trip to Brasov on a budget","why does my sourdough not rise"];
  const r=Math.random, hx=n=>Array.from({length:n},()=>"0123456789abcdef"[(r()*16)|0]).join("");
  let cur="si", truth=false, vis=false, seq=1040, ep=412, batch=hx(6), chainI=0, sim=14*60+2;
  function clock(){ sim+=cur==="ch"?6+r()*20:.3+r()*1.4; const s=Math.floor(sim); return `[${String(Math.floor(s/60)%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}]`; }
  function ev(){ const x=r(), k=x<.4?"net":x<.85?"end":"real";
    return {k,id:++seq,sz:["S","M","L"][(r()*3)|0],pr:PR[(r()*PR.length)|0],ip:k==="end"?`198.51.100.${(r()*200|0)+10}`:"203.0.113.24",hex:hx(10),nul:hx(8),gw:1+(r()*3|0)}; }
  function chain(){ const L=[
    [`stake    0.1 ETH locked`,` · miner 0x${hx(4)}…`],
    [`commit   epoch ${ep}`,` · batch hash 0x${hx(8)}…`],
    [`sample   block 0x${hx(6)}… picks ~1%`,` · nobody knew it in advance`],
    [`audit    ${(r()*6|0)+7} decoys opened`,` · sent + credible · pass`],
    [`payout   miner 0x${hx(4)}…`,` · paid from the Noise Pool`]];
    const o=L[chainI%5]; if(chainI%5===4) ep++; chainI++; return {main:o[0],dim:o[1],real:false}; }
  function line(p,e){
    switch(p){
      case "you": if(e.k==="real") return {main:`sent "${e.pr}"`,dim:` · class ${e.sz}`}; if(e.k==="net") return {main:`network decoy`,dim:` · class ${e.sz} · dies at last hop`}; return null;
      case "n1": return {main:`${e.ip} → 0x${e.hex}…`,dim:` · class ${e.sz} · real? ?`};
      case "n3": if(e.k==="net") return {main:`0x${e.hex}… dropped`,dim:` · network decoy`}; return {main:`0x${e.hex}… → gateway ${e.gw}`,dim:` · sender unknown`};
      case "gw": if(e.k==="net") return null; return {main:`req ${e.id} "${e.pr.slice(0,24)}…"`,dim:` · nullifier 0x${e.nul}`};
      case "si": if(e.k==="net") return null; return {main:`"${e.pr}"`,dim:` · real? ?`};
      case "mn": if(e.k!=="end") return null; if(r()<.12){ batch=hx(6); return {main:`commit batch 0x${batch}…`,dim:` · epoch ${ep}`}; } return {main:`decoy ${e.id} sent`,dim:` · class ${e.sz} · batch 0x${batch}`};
    } return null; }
  function next(){ if(cur==="ch") return chain();
    for(let i=0;i<12;i++){ const e=ev(), l=line(cur,e); if(l){ l.real=e.k==="real"; return l; } } return null; }
  function push(anim){ const l=next(); if(!l) return;
    const li=document.createElement("li"); if(!anim) li.style.animation="none";
    if(truth&&l.real) li.className="truth";
    const t=document.createElement("span"); t.className="t"; t.textContent=clock();
    const q=document.createElement("span"); q.className="q"; q.textContent=l.dim;
    li.append(t,document.createTextNode(l.main),q); li.dataset.real=l.real?"1":"";
    feed.appendChild(li); while(feed.children.length>14) feed.firstChild.remove(); }
  function sideFill(){ const p=P[cur]; side.innerHTML="";
    const h=document.createElement("h4"); h.textContent=p.n;
    const mk=(k,txt,v)=>{ const s=document.createElement("span"); s.className="k"; s.textContent=k; const pp=document.createElement("p"); pp.textContent=txt;
      if(v){ const b=document.createElement("span"); b.className="lb v"; b.textContent="[VERIFY]"; pp.append(" ",b); } side.append(s,pp); };
    side.append(h); mk("sees",p.sees); mk("should not see (design goal)",p.not,p.v);
    const lb=document.createElement("span"); lb.className="lb"; lb.textContent=p.lab; side.append(lb);
    path.innerHTML=""; order.forEach(([k,t],i)=>{ if(i){ const a=document.createElement("em"); a.textContent="→"; path.append(a); }
      const s=document.createElement("span"); s.textContent=t; if(k===cur) s.className="on"; path.append(s); });
    const sep=document.createElement("em"); sep.textContent="  |  off-path:"; path.append(sep);
    [["mn","miner"],["ch","chain"]].forEach(([k,t])=>{ const s=document.createElement("span"); s.textContent=t; if(k===cur) s.className="on"; path.append(s); }); }
  function select(p){ cur=p; btns.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.p===p))); feed.innerHTML=""; for(let i=0;i<10;i++) push(false); sideFill(); }
  btns.forEach(b=>b.addEventListener("click",()=>select(b.dataset.p)));
  tr.addEventListener("click",()=>{ truth=!truth; tr.setAttribute("aria-pressed",String(truth)); [...feed.children].forEach(li=>li.classList.toggle("truth",truth&&li.dataset.real==="1")); });
  select("si");
  if(RM) return;
  onView(feed,v=>vis=v,false,"0px");
  setInterval(()=>{ if(vis) push(true); },cur==="ch"?1100:800);
})();

/* 04 leak: what the content itself gives away */
(function(){
  const box=$("#ptext"); if(!box) return;
  const ver=$("#verdict");
  const A=[["draft a reply to my landlord, ",0],["Mr. Ionescu",1],[", about the heating in ",0],["apt 4B, 12 Strada Florilor",1],[". sign it ",0],["Ana Pop",1],[".",0]];
  const Bp=[["draft a polite reply to a landlord about the heating not working.",0]];
  function verdict(bad){ ver.innerHTML=""; const a=document.createElement("span"), b=document.createElement("span");
    if(bad){ a.className="bad"; a.textContent="identifies you · noise can't hide this"; b.textContent="3 identifying details"; }
    else { a.textContent="generic · looks like any decoy"; b.textContent="0 identifying details"; }
    ver.append(a,b); }
  function render(parts,n){ box.innerHTML=""; let left=n;
    parts.forEach(([t,m])=>{ if(left<=0) return; const s=t.slice(0,left); left-=t.length; const el=document.createElement(m?"mark":"span"); el.textContent=s; box.appendChild(el); }); }
  const total=p=>p.reduce((a,[t])=>a+t.length,0);
  if(RM){ render(A,total(A)); box.querySelectorAll("mark").forEach(m=>m.classList.add("on")); verdict(true); ver.classList.add("in"); return; }
  let vis=false; onView(box,v=>vis=v,false,"0px");
  const wait=ms=>new Promise(res=>{ const go=()=>{ if(vis) setTimeout(res,ms); else setTimeout(go,300); }; go(); });
  async function type(parts){ const n=total(parts); box.classList.add("caret"); for(let i=1;i<=n;i++){ render(parts,i); await wait(i%3?18:30); } box.classList.remove("caret"); }
  (async function loop(){
    for(;;){
      ver.classList.remove("in"); await type(A); await wait(400);
      for(const m of box.querySelectorAll("mark")){ m.classList.add("on"); await wait(260); }
      verdict(true); ver.classList.add("in"); await wait(3200);
      ver.classList.remove("in"); await wait(300); await type(Bp); verdict(false); ver.classList.add("in"); await wait(3000);
    }
  })();
})();

/* ---------- v2: sections 05-14 ---------- */
function loopWhenVisible(el,fn,fps=30){ let vis=false,last=0; onView(el,v=>vis=v,false,"0px"); try{ fn(performance.now(),0); }catch(e){}
  (function f(t){ requestAnimationFrame(f); if(!vis||t-last<1000/fps) return; const dt=last?Math.min(80,t-last):16; last=t; fn(t,dt); })(0); }

/* 05 threat map: where each adversary sits, what is meant to stop it */
(function(){
  const cv=$("#amap"); if(!cv) return;
  const btns=$$("#advBtns [data-a]"), card=$("#advCard");
  let g=fit(cv), cur="net"; addEventListener("resize",()=>{g=fit(cv); if(RM) draw(0);});
  const LH={you:[.07,.3],mn:[.07,.7],h1:[.3,.45],h2:[.44,.45],h3:[.58,.45],gw:[.76,.45],md:[.92,.45],ch:[.44,.86]};
  const LV={you:[.28,.07],mn:[.72,.07],h1:[.5,.25],h2:[.5,.37],h3:[.5,.49],gw:[.5,.65],md:[.5,.8],ch:[.84,.92]};
  const A={
    net:{at:["you~h1","h3~gw"],def:["h1","h2","h3"],w:"Link your IP and timing to requests",d:"Mixnet plus network decoys, dropped at the last hop"},
    si:{at:["md"],def:["mn","md"],w:"Know which requests come from real people",d:"Endpoint decoys reach the model too; all requests use fixed size classes"},
    col:{at:["md","h1"],def:["you","h1"],w:"Match requests to people by timing",d:"Network decoys travel with you, so timing does not single you out"},
    det:{at:["md"],def:["mn"],w:"Train a model that spots decoys",d:"The generator copies real request patterns. This is an arms race, not a fix."},
    mn:{at:["mn"],def:["ch"],w:"Get paid without sending decoys",d:"Stake, commit before sending, random audit"},
    self:{at:["mn","gw"],def:["gw"],w:"Send decoys to its own gateway and get paid for nothing",d:"Decoys go to several staked gateways at random"}};
  function fillCard(){ const a=A[cur]; card.innerHTML="";
    [["wants",a.w],["zkSI does",a.d],["status",null]].forEach(([k,v])=>{ const d=document.createElement("div"), s=document.createElement("span"); s.className="k"; s.textContent=k; d.append(s);
      if(v) d.append(v); else { const l=document.createElement("span"); l.className="lb"; l.textContent="PLANNED"; d.append(l); } card.append(d); }); }
  btns.forEach(b=>b.addEventListener("click",()=>{ cur=b.dataset.a; btns.forEach(x=>x.setAttribute("aria-pressed",String(x===b))); fillCard(); if(RM) draw(0); }));
  const pk=[]; let lastSpawn=0;
  function draw(t,dt=16){
    const {c,w,h}=g, P=pal(cv), vert=w<560, N=vert?LV:LH, px=k=>[N[k][0]*w,N[k][1]*h], F=`${vert?10:11}px "JetBrains Mono", monospace`;
    c.clearRect(0,0,w,h);
    const links=[["you","h1"],["mn","h1"],["h1","h2"],["h2","h3"],["h3","gw"],["gw","md"]];
    c.strokeStyle=P.fg; c.globalAlpha=.18; links.forEach(([a,b])=>{ const A1=px(a),B1=px(b); c.beginPath(); c.moveTo(...A1); c.lineTo(...B1); c.stroke(); });
    c.setLineDash([2,4]); const C1=px("ch"); ["mn","gw"].forEach(k=>{ const K=px(k); c.beginPath(); c.moveTo(...K); c.lineTo(...C1); c.stroke(); }); c.setLineDash([]); c.globalAlpha=1;
    /* ambient packets */
    if(!RM&&t-lastSpawn>160){ lastSpawn=t; const r=Math.random(); pk.push({rt:r<.45?["you","h1","h2","h3"]:r<.85?["mn","h1","h2","h3","gw","md"]:["you","h1","h2","h3","gw","md"],d:0,real:r>=.85}); }
    for(let i=pk.length-1;i>=0;i--){ const p=pk[i]; p.d+=(vert?h:w)*.22*dt/1000; let rem=p.d,pos=null;
      for(let j=0;j<p.rt.length-1;j++){ const a=px(p.rt[j]),b=px(p.rt[j+1]),L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(rem<=L){pos=[a[0]+(b[0]-a[0])*rem/L,a[1]+(b[1]-a[1])*rem/L];break;} rem-=L; }
      if(!pos){ pk.splice(i,1); continue; }
      c.globalAlpha=p.real?1:.5; c.fillStyle=p.real?ORANGE:P.fg; const s=p.real?6:3; c.fillRect(pos[0]-s/2,pos[1]-s/2,s,s); }
    c.globalAlpha=1;
    /* nodes */
    const lab=(p,txt,d)=>{ c.fillStyle=P.mute; c.font=F; if(vert){c.textAlign="left"; c.fillText(txt,p[0]+d,p[1]+4);} else {c.textAlign="center"; c.fillText(txt,p[0],p[1]+d);} };
    let p=px("you"); c.fillStyle=P.fg; c.beginPath(); c.arc(p[0],p[1],7,0,6.283); c.fill(); if(vert){ c.fillStyle=P.mute; c.font=F; c.textAlign="right"; c.fillText("you",p[0]-14,p[1]+4); } else lab(p,"you",24);
    p=px("mn"); c.save(); c.translate(...p); c.rotate(Math.PI/4); c.fillStyle="#C7C7A3"; c.fillRect(-7,-7,14,14); c.strokeStyle=P.fg; c.strokeRect(-7,-7,14,14); c.restore(); lab(p,"miners",vert?16:26);
    [["h1","entry"],["h2","hop"],["h3","last hop"]].forEach(([k,txt])=>{ const q=px(k); c.fillStyle=P.bg; c.strokeStyle=P.fg; c.lineWidth=1.3; c.beginPath(); c.arc(q[0],q[1],vert?10:12,0,6.283); c.fill(); c.stroke(); lab(q,txt,vert?20:30); });
    p=px("gw"); [[-5,-5],[0,0],[5,5]].forEach(([dx,dy])=>{ c.fillStyle=P.bg; c.fillRect(p[0]-9+dx,p[1]-9+dy,18,18); c.strokeRect(p[0]-9+dx,p[1]-9+dy,18,18); }); lab(p,"gateways",vert?22:32);
    p=px("md"); c.fillStyle=P.bg; c.fillRect(p[0]-13,p[1]-13,26,26); c.strokeRect(p[0]-13,p[1]-13,26,26); c.fillStyle=P.fg; c.fillRect(p[0]-6,p[1]-6,12,12); lab(p,"SI model",vert?22:34);
    p=px("ch"); c.strokeStyle=P.fg; for(let i=0;i<3;i++){ c.strokeRect(p[0]-22+i*15,p[1]-6,12,12); } if(vert){ c.fillStyle=P.mute; c.font=F; c.textAlign="center"; c.fillText("chain",p[0],p[1]+22); } else lab(p,"chain",24);
    /* defense: dashed box around the nodes that are meant to stop it */
    const a=A[cur], pts=a.def.map(px); let x0=Math.min(...pts.map(q=>q[0]))-26,x1=Math.max(...pts.map(q=>q[0]))+26,y0=Math.min(...pts.map(q=>q[1]))-24,y1=Math.max(...pts.map(q=>q[1]))+(vert?24:42);
    c.strokeStyle=P.fg; c.lineWidth=1.2; c.setLineDash([6,5]); c.lineDashOffset=RM?0:-(t/40)%11; c.strokeRect(x0,y0,x1-x0,y1-y0); c.setLineDash([]);
    /* adversary: orange ring (pulsing) */
    a.at.forEach(k=>{ let q; if(k.includes("~")){ const [m,n]=k.split("~"), A1=px(m),B1=px(n); q=[(A1[0]+B1[0])/2,(A1[1]+B1[1])/2]; } else q=px(k);
      const r=18+(RM?0:Math.sin(t/260)*3); c.strokeStyle=ORANGE; c.lineWidth=2; c.beginPath(); c.arc(q[0],q[1],r,0,6.283); c.stroke();
      c.globalAlpha=.25; c.beginPath(); c.arc(q[0],q[1],r+6+(RM?0:(t/30)%14),0,6.283); c.stroke(); c.globalAlpha=1;
      c.fillStyle=ORANGE; c.beginPath(); c.ellipse(q[0],q[1]-r-9,7,4,0,0,6.283); c.fill(); c.fillStyle=P.bg; c.beginPath(); c.arc(q[0],q[1]-r-9,2,0,6.283); c.fill(); });
    c.lineWidth=1;
  }
  fillCard(); themeCbs.push(()=>draw(0));
  if(RM){ draw(0); return; }
  loopWhenVisible(cv,draw);
})();

/* 06 audit simulator: commit, send, open 1%, pay or slash */
(function(){
  const cv=$("#audit"); if(!cv) return;
  const btns=$$("[data-f]"), ph=$("#epPhase"), hs=$("#epHash"), res=$("#epRes");
  const N=1000, CO=40, RO=25, K=10;
  let g=fit(cv), f=.2, fake=new Uint8Array(N), samp=[], runs=0, caught=0, t0=null, vis=false, done=false, cHex="", bHex="";
  addEventListener("resize",()=>g=fit(cv));
  const hx=n=>Array.from({length:n},()=>"0123456789abcdef"[(Math.random()*16)|0]).join("");
  function theory(){ $("#aTheory").textContent=(f===0?"0":((1-Math.pow(1-f,K))*100).toFixed(1))+"%"; }
  function tally(){ $("#aRuns").textContent=runs; $("#aCaught").textContent=caught; $("#aRate").textContent=runs?Math.round(caught/runs*100)+"%":"-"; }
  function newEpoch(){ fake.fill(0); const nf=Math.round(f*N), idx=[...Array(N).keys()];
    for(let i=0;i<nf;i++){ const j=i+Math.floor(Math.random()*(N-i)); [idx[i],idx[j]]=[idx[j],idx[i]]; fake[idx[i]]=1; }
    const s=new Set(); while(s.size<K) s.add(Math.floor(Math.random()*N)); samp=[...s]; done=false; cHex=hx(16); bHex=hx(12); t0=performance.now(); res.innerHTML="&nbsp;"; }
  btns.forEach(b=>b.addEventListener("click",()=>{ f=+b.dataset.f; btns.forEach(x=>x.setAttribute("aria-pressed",String(x===b))); runs=0; caught=0; tally(); theory(); newEpoch(); if(RM) frame(1e9); }));
  function frame(now){
    const {c,w,h}=g, P=pal(cv), e=(now-t0)/1000; c.clearRect(0,0,w,h);
    const cw=w/CO, ch=h/RO, gp=Math.max(1.5,cw*.18), sent=Math.min(N,Math.max(0,Math.floor((e-.8)/2*N)));
    const nS=e<2.9?0:Math.min(K,Math.floor((e-2.9)/.12)+1), fin=e>4.3;
    if(e<.8){ ph.textContent="commit"; hs.textContent="hash(batch) = 0x"+cHex.slice(0,Math.min(16,Math.floor(e*24)))+"…"; }
    else if(e<2.9){ ph.textContent="send · "+fmt(sent)+" / 1,000"; }
    else if(!fin){ ph.textContent="sample · block hash picks 10"; hs.textContent="block 0x"+bHex+"…"; }
    for(let i=0;i<N;i++){ if(i>=sent) continue; const x=(i%CO)*cw+gp/2, y=((i/CO)|0)*ch+gp/2, s=cw-gp, sh=ch-gp;
      if(fake[i]){ c.strokeStyle=P.fg; c.globalAlpha=.55; c.lineWidth=1; c.strokeRect(x+.5,y+.5,s-1,sh-1); }
      else { c.fillStyle=P.fg; c.globalAlpha=.32; c.fillRect(x,y,s,sh); } }
    c.globalAlpha=1;
    const hit=samp.some(i=>fake[i]);
    samp.slice(0,nS).forEach(i=>{ const x=(i%CO)*cw, y=((i/CO)|0)*ch;
      if(fin&&fake[i]){ c.fillStyle=ORANGE; c.fillRect(x+gp/2,y+gp/2,cw-gp,ch-gp); }
      c.strokeStyle=ORANGE; c.lineWidth=2; c.strokeRect(x-1,y-1,cw+2,ch+2); });
    if(fin&&!done){ done=true; runs++; if(hit) caught++; tally();
      ph.textContent=hit?"slash":"pay"; const s=document.createElement("span");
      if(hit){ s.className="bad"; s.textContent="✕ a fake was opened · stake lost"; } else { s.textContent=f>0?"✓ all 10 opened decoys were real · paid for 1,000 (the fakes slipped through)":"✓ all 10 opened decoys were real · paid for 1,000"; }
      res.innerHTML=""; res.append(s); }
    if(!RM&&e>6.3) newEpoch();
  }
  onView(cv,v=>{vis=v; if(v&&t0===null) newEpoch();},false,"0px");
  theory(); tally(); themeCbs.push(()=>t0!==null&&frame(RM?1e9:performance.now()));
  if(RM){ newEpoch(); t0=-1e9; frame(0); btns.forEach(b=>b.addEventListener("click",()=>{t0=-1e9; frame(0);})); return; }
  (function loop(t){ requestAnimationFrame(loop); if(vis&&t0!==null) frame(t); })(0);
})();

/* 07 noise pool: fee + bootstrap in, decoy payouts out (not to scale) */
(function(){
  const cv=$("#pool"); if(!cv) return;
  const inp=$("#poolIn"); let g=fit(cv), R=50, parts=[], acc={fee:0,boot:0,pay:0};
  addEventListener("resize",()=>{g=fit(cv); if(RM) draw(0,0);});
  const FEE=.6; /* arbitrary, the real fee level vs prices is not decided */
  const rates=()=>{ const fee=FEE*R/1000, need=(1000-R)/1000; return {fee,need,boot:Math.max(0,need-fee)}; };
  function set(v){ R=+v; const r=rates();
    $("#plR").textContent=fmt(R); $("#plD").textContent=fmt(1000-R);
    $("#plF").textContent=R<200?"low":R<600?"growing":"high";
    $("#plB").textContent=r.boot>.02?"fills the gap":"not needed here"; if(RM) draw(0,0); }
  inp.addEventListener("input",()=>set(inp.value));
  function nodes(w,h,vert){ return vert?{fee:[.27,.1],boot:[.73,.1],pool:[.5,.5],mn:[.5,.9]}:{fee:[.12,.25],boot:[.12,.75],pool:[.5,.5],mn:[.88,.5]}; }
  function draw(t,dt){
    const {c,w,h}=g, P=pal(cv), vert=w<560, Np=nodes(w,h,vert), px=k=>[Np[k][0]*w,Np[k][1]*h], F=`${vert?10:11}px "JetBrains Mono", monospace`, r=rates();
    c.clearRect(0,0,w,h);
    const lanes=[["fee","pool",r.fee,ORANGE],["boot","pool",r.boot,"#C7C7A3"],["pool","mn",r.need,P.fg]];
    lanes.forEach(([a,b,rate,col])=>{ const A1=px(a),B1=px(b); c.strokeStyle=col; c.globalAlpha=.15+.5*Math.min(1,rate); c.lineWidth=1+rate*10; c.beginPath(); c.moveTo(...A1); c.lineTo(...B1); c.stroke(); });
    c.globalAlpha=1; c.lineWidth=1;
    if(dt){ lanes.forEach(([a,b,rate,col],i)=>{ const k=["fee","boot","pay"][i]; acc[k]+=rate*dt/40; while(acc[k]>=1){ acc[k]--; parts.push({a,b,col,u:0,j:(Math.random()-.5)*.6}); } }); }
    parts=parts.filter(p=>{ if(dt) p.u+=dt/1400; if(p.u>=1) return false; const A1=px(p.a),B1=px(p.b), nx=-(B1[1]-A1[1]), ny=B1[0]-A1[0], L=Math.hypot(nx,ny)||1;
      const off=p.j*14*Math.sin(p.u*Math.PI); const x=A1[0]+(B1[0]-A1[0])*p.u+nx/L*off, y=A1[1]+(B1[1]-A1[1])*p.u+ny/L*off;
      c.fillStyle=p.col; c.fillRect(x-2.5,y-2.5,5,5); return true; });
    const box=(k,txt,sub,big)=>{ const q=px(k), bw=big?(vert?124:150):(vert?132:140), bh=big?56:44; c.fillStyle=P.bg; c.strokeStyle=P.fg; c.lineWidth=1.3;
      c.fillRect(q[0]-bw/2,q[1]-bh/2,bw,bh); c.strokeRect(q[0]-bw/2,q[1]-bh/2,bw,bh);
      c.fillStyle=P.fg; c.font=`600 ${vert?13:14}px Inter, sans-serif`; c.textAlign="center"; c.fillText(txt,q[0],q[1]-(sub?2:-5));
      if(sub){ c.fillStyle=P.mute; c.font=F; c.fillText(sub,q[0],q[1]+14); } };
    box("fee","real requests","~20% fee"); box("boot","bootstrap fund","at the start"); box("pool","Noise Pool","ETH / USDC",true); box("mn","miners","per verified decoy");
  }
  set(50); themeCbs.push(()=>draw(0,0));
  if(RM){ draw(0,0); return; }
  loopWhenVisible(cv,draw);
})();

/* 08 cost: one real request plus its decoys */
(function(){
  const cv=$("#stack"); if(!cv) return;
  const inp=$("#ratioIn"), tb=$$("[data-t]"); let g=fit(cv), n=2, tier=1, shown=[];
  addEventListener("resize",()=>{g=fit(cv); if(RM) draw(0);});
  const money=v=>v<.01?"$"+v.toFixed(3):v<1?"$"+v.toFixed(2):v<100?"$"+v.toFixed(v<10?2:0):"$"+fmt(Math.round(v));
  function set(){ n=+inp.value; const lo=(1+n)*.001*tier, hi=(1+n)*.005*tier;
    $("#cN").textContent=n; $("#cX").textContent=(1+n)+"x"; $("#cU").textContent=`${money(lo)} - ${money(hi)}`; $("#cK").textContent=`${money(lo*1000)} - ${money(hi*1000)}`;
    tb.forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.t===tier))); if(RM) draw(0); }
  inp.addEventListener("input",set); tb.forEach(b=>b.addEventListener("click",()=>{tier=+b.dataset.t; set();}));
  function draw(t){
    const {c,w,h}=g, P=pal(cv); c.clearRect(0,0,w,h);
    const bw=w<560?26:38, gap=8, cols=Math.max(5,Math.floor((w-24)/(bw+gap)));
    while(shown.length<1+n) shown.push(RM?1:0); shown.length=1+n;
    for(let i=0;i<=n;i++){ shown[i]=RM?1:Math.min(1,shown[i]+.08); const col=i%cols, row=(i/cols)|0, k=shown[i], e=1-Math.pow(1-k,3);
      const x=12+col*(bw+gap), y=12+row*(bw+gap)-(1-e)*14; c.globalAlpha=e;
      if(i===0){ c.fillStyle=ORANGE; c.fillRect(x,y,bw,bw); }
      else { c.strokeStyle=P.fg; c.lineWidth=1.2; c.strokeRect(x+.5,y+.5,bw-1,bw-1); c.fillStyle=P.fg;
        for(let yy=0;yy<4;yy++) for(let xx=0;xx<4;xx++) if(B4[yy*4+xx]<6) c.fillRect(x+3+xx*(bw-6)/4,y+3+yy*(bw-6)/4,1.6,1.6); } }
    c.globalAlpha=1;
    const rowsUsed=Math.ceil((1+n)/cols), by=Math.min(h-30,12+rowsUsed*(bw+gap)+12), maxW=w-24, frac=(1+n)*tier/(21*10), bwid=Math.max(4,Math.sqrt(frac)*maxW);
    c.fillStyle=P.mute; c.font='11px "JetBrains Mono", monospace'; c.textAlign="left"; c.fillText("cost per real request",12,by);
    c.strokeStyle=P.fg; c.globalAlpha=.25; c.strokeRect(12,by+8,maxW,10); c.globalAlpha=1; c.fillStyle=ORANGE; c.fillRect(12,by+8,bwid,10);
  }
  set(); themeCbs.push(()=>draw(0));
  if(RM){ draw(0); return; }
  loopWhenVisible(cv,draw);
})();

/* 09 real SHA-256 commit / pick / open, computed in the browser */
(function(){
  const box=$("#crypt"); if(!box) return;
  const btns=$$("[data-s]"), tam=$("#tamper");
  const batch=["rewrite this email so it sounds more formal","5 dinner ideas with lentils and rice","what does the error ENOENT mean in node","translate this paragraph into German","plan a 3-day trip to Brasov on a budget","fix the grammar in this cover letter","explain how a heat pump works, simply","how long to boil an egg for a soft yolk"];
  if(!(window.crypto&&crypto.subtle)){ box.textContent="this browser does not expose Web Crypto here, so the live hashes can not run."; btns.forEach(b=>b.disabled=true); tam.disabled=true; return; }
  const enc=s=>new TextEncoder().encode(s), hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
  const sha=async s=>hex(await crypto.subtle.digest("SHA-256",enc(s)));
  let step=0, user=false, tampered=false, leaves=[], commit="", beacon="", pick=0, seq=0, vis=false;
  const short=h=>h.slice(0,16)+"…"+h.slice(-6);
  async function prep(){ leaves=await Promise.all(batch.map(sha)); commit=await sha(leaves.join("")); await newBeacon(); }
  async function newBeacon(){ beacon=hex(crypto.getRandomValues(new Uint8Array(32))); pick=parseInt((await sha(commit+beacon)).slice(0,8),16)%batch.length; }
  function el(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined) e.textContent=txt; return e; }
  async function render(){
    const my=++seq; box.innerHTML="";
    batch.forEach((d,i)=>{ const r=el("div","row"+(step>=2&&i===pick?" pick":"")); r.append(el("span","i",String(i).padStart(2,"0")),el("span","",step>=3&&i===pick&&tampered?d.replace("a","4"):d),el("span","h",step>=0?short(leaves[i]):"")); box.append(r);
      if(step===0&&!RM){ r.style.opacity=0; setTimeout(()=>{ if(my===seq) r.style.opacity=1; r.style.transition="opacity .3s"; },i*90); } });
    const out=el("div","out"); box.append(out);
    const kv=(k,v,cls)=>{ out.append(el("span","",k)); const c=el("code",cls||"",v); out.append(c); return c; };
    if(step===0) kv("leaf","sha256(decoy) for each row");
    if(step>=1) kv("commit","0x"+commit, step===1&&!RM?"typing":"");
    if(step>=2){ kv("beacon","0x"+short(beacon)+"  (simulated block hash)"); kv("pick","sha256(commit + beacon) mod 8 = "+pick); }
    if(step>=3){ const opened=tampered?batch[pick].replace("a","4"):batch[pick]; const lh=await sha(opened), ch=await sha(leaves.map((l,i)=>i===pick?lh:l).join(""));
      if(my!==seq) return;
      kv("re-hash",short(lh)); const okL=lh===leaves[pick], okC=ch===commit;
      kv("matches leaf",okL?"✓ yes":"✕ no", okL?"ok":"no"); kv("matches commit",okC?"✓ yes · paid":"✕ no · stake lost", okC?"ok":"no"); }
  }
  function go(s){ step=s; btns.forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.s===s))); render(); }
  btns.forEach(b=>b.addEventListener("click",async()=>{ user=true; if(+b.dataset.s===2) await newBeacon(); go(+b.dataset.s); }));
  tam.addEventListener("click",()=>{ user=true; tampered=!tampered; tam.setAttribute("aria-pressed",String(tampered)); go(3); });
  prep().then(()=>{ if(RM){ go(3); return; } go(0);
    onView(box,v=>vis=v,false,"0px");
    setInterval(async()=>{ if(user||!vis) return; let s=(step+1)%4; if(s===2) await newBeacon(); if(s===0){ tampered=!tampered; tam.setAttribute("aria-pressed",String(tampered)); } go(s); },3200); });
})();

/* 10 the requests this page made, read from the browser */
(function(){
  const box=$("#netlog"); if(!box||!window.performance||!performance.getEntriesByType) return;
  const list=document.createElement("div"), sum=document.createElement("div"); sum.className="sum"; box.append(list,sum);
  const seen=new Set(), hosts=new Set();
  function add(name,start,type){ if(seen.has(name)) return; seen.add(name); let u; try{u=new URL(name,location.href);}catch(e){return;} hosts.add(u.host);
    const ln=document.createElement("div"); ln.className="ln";
    const a=document.createElement("span"); a.textContent="+"+Math.round(start)+"ms";
    const b=document.createElement("span"); b.textContent=(u.host===location.host?"":u.host)+u.pathname;
    const c=document.createElement("span"); c.textContent=type; ln.append(a,b,c); list.append(ln);
    sum.innerHTML=""; const s1=document.createElement("span"); s1.innerHTML=""; s1.append(document.createTextNode(seen.size+" requests · hosts: ")); const hb=document.createElement("b"); hb.textContent=[...hosts].join(", "); s1.append(hb);
    const s2=document.createElement("span"); s2.textContent=hosts.size===1&&hosts.has(location.host)?"nothing from anywhere else":"see the hosts listed"; sum.append(s1,s2); }
  add(location.href,0,"page");
  performance.getEntriesByType("resource").forEach(e=>add(e.name,e.startTime,e.initiatorType));
  try{ new PerformanceObserver(l=>l.getEntries().forEach(e=>add(e.name,e.startTime,e.initiatorType))).observe({type:"resource",buffered:true}); }catch(e){}
})();

/* 11 risk cards: one small loop each */
(function(){
  $$(".rcv").forEach(cv=>{
    let g=fit(cv); addEventListener("resize",()=>g=fit(cv));
    const k=+cv.dataset.r;
    function draw(t){ const {c,w,h}=g, P=pal(cv); c.clearRect(0,0,w,h); c.font='10px "JetBrains Mono", monospace'; c.lineWidth=1.2;
      if(k===0){ const m=[w*.18,h*.5], gs=[[w*.75,h*.2],[w*.75,h*.5],[w*.75,h*.8]];
        gs.forEach((q,i)=>{ c.strokeStyle=P.fg; c.globalAlpha=i===1?1:.35; c.setLineDash(i===1?[]:[3,3]); c.strokeRect(q[0]-9,q[1]-9,18,18); c.setLineDash([]); });
        c.globalAlpha=1; c.save(); c.translate(...m); c.rotate(Math.PI/4); c.fillStyle="#C7C7A3"; c.fillRect(-7,-7,14,14); c.strokeStyle=P.fg; c.strokeRect(-7,-7,14,14); c.restore();
        c.strokeStyle=ORANGE; c.beginPath(); c.moveTo(m[0]+12,m[1]-4); c.quadraticCurveTo((m[0]+gs[1][0])/2,m[1]-34,gs[1][0]-12,gs[1][1]-4); c.moveTo(gs[1][0]-12,gs[1][1]+4); c.quadraticCurveTo((m[0]+gs[1][0])/2,m[1]+34,m[0]+12,m[1]+4); c.stroke();
        const u=(t/1600)%1, top=u<.5, v=top?u*2:(u-.5)*2, x=top?m[0]+12+(gs[1][0]-m[0]-24)*v:gs[1][0]-12-(gs[1][0]-m[0]-24)*v, y=m[1]+(top?-1:1)*Math.sin(v*Math.PI)*17;
        c.fillStyle=ORANGE; c.fillRect(x-3,y-3,6,6); c.fillStyle=P.mute; c.fillText("own gateway",gs[1][0]-30,h-2); }
      if(k===1){ const sx=w*.62; c.strokeStyle=ORANGE; c.beginPath(); c.moveTo(sx,4); c.lineTo(sx,h-4); c.stroke();
        for(let i=0;i<9;i++){ const x=((t/18+i*w/9)%(w+20))-10, y=14+((i*37)%(h-28)), flag=i%3===0;
          if(x>sx&&flag){ c.fillStyle=ORANGE; c.fillText("×",x-3,y+4); } else { c.strokeStyle=P.fg; c.globalAlpha=.7; c.strokeRect(x-3,y-3,6,6); c.globalAlpha=1; } }
        c.fillStyle=P.mute; c.fillText("detector",sx+6,12); }
      if(k===2){ const wx=w*.62; [["closed",h*.3,true],["open-source",h*.72,false]].forEach(([lb,y,bl])=>{
          c.strokeStyle=P.fg; c.globalAlpha=.25; c.beginPath(); c.moveTo(8,y); c.lineTo(w-8,y); c.stroke(); c.globalAlpha=1;
          for(let i=0;i<4;i++){ let x=((t/14+i*w/4)%(w))+4; if(bl&&x>wx-8) { x=wx-8; } c.fillStyle=P.fg; c.globalAlpha=bl&&x>=wx-8?.25:.75; c.fillRect(x-2.5,y-2.5,5,5); c.globalAlpha=1; }
          if(bl){ c.fillStyle=ORANGE; c.fillRect(wx,y-12,3,24); } c.fillStyle=P.mute; c.fillText(lb,10,y-8); }); }
      if(k===3){ const lvl=.575+.425*Math.cos(t/2200), bx=10, by=h-18, bwid=w-20;
        c.strokeStyle=P.fg; c.strokeRect(bx,by,bwid,10); c.fillStyle=ORANGE; c.fillRect(bx,by,bwid*lvl,10);
        c.fillStyle=P.fg; for(let i=0;i<60;i++){ const a=((i*97)%100)/100; if(a>lvl) continue; const x=12+((i*53)%Math.floor(w-24)), y=8+((i*29)%Math.floor(h-36)); c.globalAlpha=.55; c.fillRect(x,y,3,3); }
        c.globalAlpha=1; c.fillStyle=P.mute; c.fillText("pool "+Math.round(lvl*100)+"%",bx,by-6); }
    }
    themeCbs.push(()=>draw(4000));
    if(RM){ draw(4000); return; }
    loopWhenVisible(cv,draw,24);
  });
})();

/* 12 roadmap progress, 13 copy address */
(function(){
  const f=$("#tkFill"); if(f) onView(f,v=>{ if(v) f.style.width="12%"; });
  const b=$("#mailCopy"), a=$("#mailAddr");
  if(b&&a) b.addEventListener("click",()=>{ const done=()=>{ b.textContent="copied"; setTimeout(()=>b.textContent="copy",1600); };
    const sel=()=>{ const r=document.createRange(); r.selectNodeContents(a); const s=getSelection(); s.removeAllRanges(); s.addRange(r); };
    try{ navigator.clipboard.writeText(a.textContent).then(done,sel); }catch(e){ sel(); } });
})();
