document.documentElement.classList.add("js");
/* theme toggle, saved */
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

/* simulation: real users drift 50 -> 900 -> 50 */
(function(){
  const T=1000, R=document.getElementById("real"), D=document.getElementById("decoy"), B=document.getElementById("realBar");
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t=0;
  function step(){
    const real=Math.round(50 + 850*(0.5-0.5*Math.cos(t)));
    R.textContent=real.toLocaleString("en-US"); D.textContent=(T-real).toLocaleString("en-US");
    B.style.width=(real/T*100)+"%"; t+=0.18;
  }
  if(!reduce) setInterval(step,900);
})();

/* WebGL noise + ordered dither, palette only */
(function(){
  const c=document.getElementById("noise"), gl=c.getContext("webgl",{antialias:false,preserveDrawingBuffer:true});
  if(!gl){ c.remove(); return; }
  document.getElementById("fallback").style.display="none";
  const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs=`precision mediump float;
  uniform vec2 r;uniform float t;uniform float dark;
  uniform vec3 cBase,cOlive,cLime,cOrange;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int k=0;k<5;k++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
  float bayer(vec2 p){ vec2 q=mod(floor(p),4.);
    int i=int(q.x)+int(q.y)*4; float m=0.;
    if(i==0)m=0.;else if(i==1)m=8.;else if(i==2)m=2.;else if(i==3)m=10.;
    else if(i==4)m=12.;else if(i==5)m=4.;else if(i==6)m=14.;else if(i==7)m=6.;
    else if(i==8)m=3.;else if(i==9)m=11.;else if(i==10)m=1.;else if(i==11)m=9.;
    else if(i==12)m=15.;else if(i==13)m=7.;else if(i==14)m=13.;else m=5.;
    return m/16.;}
  void main(){
    vec2 px=floor(gl_FragCoord.xy/2.);
    vec2 uv=gl_FragCoord.xy/r; uv.x*=r.x/r.y;
    float a=fbm(uv*1.6+vec2(t*.03,-t*.02));
    float b=fbm(uv*2.4+vec2(-t*.025,t*.035)+a*1.8);
    float g=fbm(uv*3.5+b*2.2+vec2(t*.01));
    float th=bayer(px)-.5;
    float grain=(h(px+fract(t))-.5)*.18;
    vec3 col=cBase;
    float o=smoothstep(.45,.75,b+th*.22+grain);
    col=mix(col,cOlive,smoothstep(.35,.6,a+th*.2)*.55);
    col=mix(col,cOrange,o);
    float l=smoothstep(.62,.82,g+th*.25+grain);
    col=mix(col,cLime,l*(1.-o*.6));
    float speck=step(.985,h(px*1.7+floor(t*8.)));
    col=mix(col,dark>.5?vec3(.96):cBase,speck*.35);
    if(dark>.5) col=mix(cBase,col,.78);
    gl_FragColor=vec4(col,1.);
  }`;
  function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ c.remove(); document.getElementById("fallback").style.display=""; return; }
  gl.useProgram(pr);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U=k=>gl.getUniformLocation(pr,k);
  const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
  function colors(){
    const dark=getComputedStyle(document.body).backgroundColor==="rgb(33, 33, 33)";
    gl.uniform1f(U("dark"),dark?1:0);
    gl.uniform3fv(U("cBase"),hex(dark?"#212121":"#F5F4F0"));
    gl.uniform3fv(U("cOlive"),hex("#C7C7A3"));
    gl.uniform3fv(U("cLime"),hex("#EBFF79"));
    gl.uniform3fv(U("cOrange"),hex("#E45E3F"));
  }
  function size(){const d=Math.min(devicePixelRatio||1,2);c.width=c.clientWidth*d;c.height=c.clientHeight*d;gl.viewport(0,0,c.width,c.height);gl.uniform2f(U("r"),c.width,c.height);}
  size(); colors(); addEventListener("resize",size);
  new MutationObserver(colors).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0=performance.now();
  let heroVis=true; new IntersectionObserver(es=>{heroVis=es[0].isIntersecting;}).observe(c);
  function frame(now){ if(!reduce) requestAnimationFrame(frame); if(!heroVis&&!reduce) return; gl.uniform1f(U("t"),reduce?4.:(now-t0)/1000+4.); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); }
  requestAnimationFrame(frame);
})();

/* mix: ring of text + 1,000-dot swarm, driven by scroll */
(function(){
  const sec=document.querySelector(".mix"), ring=document.getElementById("ring"), cv=document.getElementById("swarm"), ctx=cv.getContext("2d");
  const TEXT="your request travels with a thousand others · only you know which one is yours · ";
  const NUMS=Array.from({length:13},(_,i)=>"- "+String(i).padStart(2,"0")+" ").join("");
  const outer=[...NUMS.repeat(2)].map(ch=>{const s=document.createElement("span");s.className="num";s.textContent=ch;ring.appendChild(s);return s;});
  const inner=[...TEXT].map(ch=>{const s=document.createElement("span");s.textContent=ch;ring.appendChild(s);return s;});
  const d=[0,1,2].map(i=>document.getElementById("d"+i)), st=document.getElementById("mixState"), cnt=document.getElementById("mixCount");
  const N=1000;
  let seed=7; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const pts=Array.from({length:N},(_,i)=>({a:rnd()*Math.PI*2,r:Math.sqrt(rnd()),w:.6+rnd()*.8,ph:rnd()*6.28}));
  pts[0].r=0.42; pts[0].a=2.5;
  let W=0,H=0,dpr=1,P=0,fg="#fff",orange="#E45E3F";
  function size(){dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function colors(){const cs=getComputedStyle(document.documentElement);fg=cs.getPropertyValue("--fg").trim()||"#fff";
    if(fg.startsWith("var"))fg=getComputedStyle(document.body).color;}
  function geom(){const m=W<640;return {m,cx:W/2,cy:H/2+(m?40:0),rx:Math.min(W*(m?.36:.34),540),ry:Math.min(H*(m?.27:.34),320)};}
  function place(list,cx,cy,rx,ry,off,fade){
    const n=list.length;
    list.forEach((s,i)=>{const a=off+i/n*Math.PI*2, x=Math.cos(a)*rx, y=Math.sin(a)*ry;
      const depth=(Math.sin(a)+1)/2; s.style.opacity=fade?(.25+.75*depth).toFixed(2):(.35+.65*depth).toFixed(2);
      s.style.transform=`translate(${(cx+x).toFixed(1)}px,${(cy+y).toFixed(1)}px) rotate(${(a+Math.PI/2).toFixed(3)}rad)`;});
  }
  function draw(t){
    const g=geom(); ctx.clearRect(0,0,W,H);
    const mixK=Math.min(1,P*1.25);              /* how mixed */
    const shown=Math.round(1+999*Math.min(1,P*1.6)); /* how many decoys visible */
    const swirl=P*4.2;
    ctx.fillStyle=fg;
    for(let i=1;i<shown;i++){const p=pts[i];
      const a=p.a+swirl*p.w*(1-p.r*.5)+Math.sin(t*.0006+p.ph)*.04;
      const x=g.cx+Math.cos(a)*p.r*g.rx*.86, y=g.cy+Math.sin(a)*p.r*g.ry*.86;
      ctx.globalAlpha=.55; ctx.fillRect(x-1,y-1,2,2);}
    /* the real one */
    const p=pts[0], a=p.a+swirl*.9, rr=p.r+mixK*.25;
    const x=g.cx+Math.cos(a)*rr*g.rx*.86, y=g.cy+Math.sin(a)*rr*g.ry*.86;
    const sz=(g.m?7:9)-(g.m?5:7)*mixK; ctx.globalAlpha=1;
    ctx.fillStyle=mixK>.98?fg:orange; if(mixK>.98) ctx.globalAlpha=.55;
    ctx.fillRect(x-sz/2,y-sz/2,sz,sz);
    if(mixK<.98){ctx.globalAlpha=1-mixK;ctx.strokeStyle=orange;ctx.lineWidth=1;ctx.lineWidth=1.5;ctx.strokeRect(x-13,y-13,26,26);}
    ctx.globalAlpha=1;
    const pc=Math.round(mixK*100), s=String(pc).padStart(3,"0");
    d.forEach((el,i)=>el.textContent=s[i]);
    st.textContent=pc<100?"[ this one is yours ]":"[ which one is yours? ]";
    cnt.textContent=`1 real · ${(shown-1).toLocaleString("en-US")} decoy`;
    const o1=g.m?30:52,o2=g.m?10:18;
    place(outer,g.cx,g.cy,g.rx+o1,g.ry+o1,-P*1.4,true);
    place(inner,g.cx,g.cy,g.rx+o2,g.ry+o2,P*2.2,false);
  }
  function prog(){const r=sec.getBoundingClientRect(), span=sec.offsetHeight-innerHeight; P=Math.max(0,Math.min(1,-r.top/span));}
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function loop(t){prog();const r=sec.getBoundingClientRect();if(r.bottom>2&&r.top<innerHeight-2)draw(reduce?0:t);requestAnimationFrame(loop);}
  size();colors();addEventListener("resize",size);
  new MutationObserver(colors).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  requestAnimationFrame(loop);
})();

/* ---------- helpers ---------- */
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function onView(el,fn,once=true,margin="0px 0px -15% 0px"){
  const io=new IntersectionObserver(es=>es.forEach(e=>{fn(e.isIntersecting,e);if(e.isIntersecting&&once)io.disconnect();}),{rootMargin:margin});
  io.observe(el);
}
function fgOf(el){return getComputedStyle(el).color;}
function fit(cv){const d=Math.min(devicePixelRatio||1,2),w=cv.clientWidth,h=cv.clientHeight;cv.width=w*d;cv.height=h*d;const c=cv.getContext("2d");c.setTransform(d,0,0,d,0,0);return {c,w,h};}

/* header + reveal + rail */
(function(){
  const top=$(".top"); const f=()=>top.classList.toggle("solid",scrollY>40); f(); addEventListener("scroll",f,{passive:true});
  $$(".reveal").forEach(el=>onView(el,v=>{if(v)el.classList.add("in");}));
  const rail=$("#rail"), secs=$$("[data-code]");
  secs.forEach(s=>{ if(!s.id) s.id="s"+s.dataset.code;
    const a=document.createElement("a"); a.href="#"+s.id; a.textContent="["+s.dataset.code+"]"; a.setAttribute("aria-label","Section "+s.dataset.code); rail.appendChild(a);
    onView(s,v=>{ if(v){ rail.querySelectorAll("a").forEach(x=>x.classList.toggle("on",x.getAttribute("href")==="#"+s.id)); } },false,"-45% 0px -45% 0px");
  });
  /* keep the rail off the footer: hide it while the footer is on screen or the window is too short */
  const foot=$(".foot"); let footOn=false;
  const fit=()=>{ const short=innerHeight<rail.scrollHeight+140; rail.classList.toggle("off",footOn||short); };
  if(foot) new IntersectionObserver(es=>{ footOn=es[0].isIntersecting; fit(); },{rootMargin:"0px 0px 60px 0px"}).observe(foot);
  addEventListener("resize",fit); fit();
})();

/* 03 terminal */
(function(){
  const steps=[
    ["> request received","receiving"],
    ["> paying with a zk usage credit","payment"],
    ["> padding to a fixed size class","size"],
    ["> entering mixnet with network decoys","route"],
    ["> gateway reached, decoy prompts reach the model too","endpoint"],
    ["> observer view: ~1,000 req/min, flat","complete"]];
  const typed=$("#typed"), bar=$("#tbar"), st=$("#tstate"), pc=$("#tpct"), rows=$$(".ttable tr");
  function show(i){ bar.style.width=((i+1)/steps.length*100)+"%"; pc.textContent=String(Math.round((i+1)/steps.length*100)).padStart(3,"0")+"%"; st.textContent=steps[i][1]; rows.forEach((r,k)=>{if(k<=i)r.classList.add("in");}); }
  if(RM){ typed.textContent=steps.map(s=>s[0]).join("\n"); show(steps.length-1); typed.style.whiteSpace="pre-line"; return; }
  onView($("#term"),v=>{ if(!v) return; let i=0;
    (function next(){ if(i>=steps.length){ st.textContent="transmission complete"; return; }
      const txt=steps[i][0]; let k=0; typed.textContent="";
      const iv=setInterval(()=>{ typed.textContent=txt.slice(0,++k); if(k>=txt.length){ clearInterval(iv); show(i); i++; setTimeout(next,650); } },26);
    })();
  });
})();

/* 04 packet lanes */
(function(){
  function lane(id,dropAt){
    const cv=$("#"+id); let g=fit(cv), pk=[], t0=0, vis=false;
    addEventListener("resize",()=>g=fit(cv));
    onView(cv,v=>vis=v,false,"0px");
    function spawn(real){ pk.push({x:-4,y:8+Math.random()*(g.h-16),v:.9+Math.random()*.7,real}); }
    let n=0;
    function frame(t){ requestAnimationFrame(frame); if(!vis) return;
      if(t-t0>110){ t0=t; spawn(++n%24===0); }
      const {c,w,h}=g, fg=fgOf(cv); c.clearRect(0,0,w,h);
      c.font='10px "IBM Plex Mono", monospace'; c.fillStyle=fg; c.globalAlpha=.6;
      if(dropAt){ const X=w*dropAt; c.fillRect(X,0,1,h); c.fillText("last hop",X+6,12); }
      else { c.fillRect(w-2,0,2,h); c.fillText("model",w-44,12); }
      pk=pk.filter(p=>{ p.x+=p.v*(w/700)*2.2;
        const end=dropAt&&!p.real? w*dropAt : w;
        if(p.x>=end){ if(dropAt&&!p.real){ c.globalAlpha=.8; c.fillStyle=fg; c.fillText("×",end-3,p.y+4);} return false; }
        c.globalAlpha=p.real?1:.55; c.fillStyle=p.real?"#E45E3F":fg; const s=p.real?6:3; c.fillRect(p.x,p.y-s/2,s,s); return true; });
      c.globalAlpha=1;
    }
    if(RM){ vis=true; for(let i=0;i<30;i++){spawn(i===12);pk[i].x=Math.random()*g.w*(dropAt||1);} }
    requestAnimationFrame(frame);
  }
  lane("pktNet",.82); lane("pktEnd",0);
})();

/* 05 epoch timeline */
(function(){
  const fig=$("#epoch"), narrow=fig.clientWidth<600, VW=narrow?400:1000, N=narrow?50:100, X0=narrow?10:30, X1=VW-(narrow?10:30), step=(X1-X0)/(N-1), pick=narrow?31:63;
  let s=`<svg viewBox="0 0 ${VW} ${narrow?190:170}" aria-hidden="true" style="color:var(--fg);font-family:'IBM Plex Mono',monospace;font-size:12px">`;
  s+=`<line x1="${X0}" y1="118" x2="${X1}" y2="118" stroke="currentColor" stroke-width="1"/>`;
  for(let i=0;i<N;i++){const x=(X0+i*step).toFixed(1); s+=`<rect class="tk" data-i="${i}" x="${x-1.5}" y="72" width="3" height="40" fill="currentColor" opacity="0"/>`;}
  if(narrow){
    s+=`<text x="${X0}" y="142" fill="currentColor">00:00 commit</text><text x="${X1}" y="142" fill="currentColor" text-anchor="end">60:00 audit</text>`;
    s+=`<text x="${X0}" y="164" fill="currentColor" opacity=".6">hash(batch)</text><text x="${X1}" y="164" fill="currentColor" opacity=".6" text-anchor="end">block hash picks ~1%</text>`;
    s+=`<text x="${X0}" y="20" fill="currentColor" opacity=".6">decoy batch · ${N} shown</text>`;
  } else {
    s+=`<text x="${X0}" y="146" fill="currentColor">00:00 commit hash(batch)</text>`;
    s+=`<text x="${X1}" y="146" fill="currentColor" text-anchor="end">60:00 future block hash picks ~1%</text>`;
    s+=`<text x="${X0}" y="40" fill="currentColor" opacity=".6">decoy batch · ${N} shown</text>`;
  }
  const px=X0+pick*step;
  s+=`<g id="pickG" opacity="0"><rect x="${px-3}" y="48" width="6" height="64" style="fill:var(--orange)"/><text x="${px}" y="${narrow?42:38}" text-anchor="middle" style="fill:var(--orange)">sampled · opened</text></g>`;
  s+=`</svg>`; fig.innerHTML=s;
  const tks=[...fig.querySelectorAll(".tk")], pg=fig.querySelector("#pickG");
  function done(){ tks.forEach(t=>t.setAttribute("opacity",".55")); tks[pick].setAttribute("opacity","0"); pg.setAttribute("opacity","1"); }
  if(RM){ done(); return; }
  onView(fig,v=>{ if(!v) return; tks.forEach((t,i)=>setTimeout(()=>t.setAttribute("opacity",".55"),i*(1800/N))); setTimeout(()=>{ tks[pick].setAttribute("opacity","0"); pg.setAttribute("opacity","1"); },2300); });
})();

/* 06 map */
(function(){
  const svg=$("#mapSvg");
  const C=[[70,110],[70,190],[70,270],[70,350]], M=[[70,450],[70,510]];
  const L1=[[320,140],[320,280],[320,420]], L2=[[470,140],[470,280],[470,420]], L3=[[620,140],[620,280],[620,420]];
  const G=[[790,170],[790,300],[790,430]], MD=[[935,200],[935,380]];
  const P=a=>"M"+a.map(p=>p.join(" ")).join(" L");
  const real=[C[1],L1[0],L2[1],L3[2],G[1],MD[0]];
  const net=[[C[0],L1[1],L2[0],L3[1]],[C[2],L1[2],L2[2],L3[0]],[C[3],L1[0],L2[2],L3[2]],[C[1],L1[2],L2[1],L3[0]]];
  const end=[[M[0],L1[2],L2[1],L3[0],G[0],MD[0]],[M[1],L1[1],L2[2],L3[1],G[2],MD[1]],[M[0],L1[0],L2[0],L3[2],G[1],MD[1]]];
  let s=`<g style="color:var(--fg);font-family:'IBM Plex Mono',monospace;font-size:12px" fill="none" stroke="currentColor">`;
  s+=`<g class="lay" data-lay="net">`+net.map(a=>`<path class="flow" d="${P(a)}" stroke-width="1.2" opacity=".7"/>`).join("")+
     net.map(a=>{const e=a[a.length-1];return `<text x="${e[0]+16}" y="${e[1]+4}" fill="currentColor" stroke="none">×</text>`}).join("")+`</g>`;
  s+=`<g class="lay" data-lay="end">`+end.map(a=>`<path class="flow" d="${P(a)}" stroke-width="2" stroke-dasharray="7 5" opacity=".8"/>`).join("")+`</g>`;
  s+=`<g class="lay" data-lay="real"><path id="realPath" d="${P(real)}" stroke-width="2.4" style="stroke:var(--orange)"/><rect id="realPk" width="10" height="10" x="-20" y="-20" style="fill:var(--orange)" stroke="none"/></g>`;
  const circ=(p,r,f)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" ${f?'fill="currentColor"':'style="fill:var(--bg)"'} stroke-width="1.4"/>`;
  s+=`<g class="lay" data-lay="nodes">`;
  s+=C.map(p=>circ(p,7,true)).join("");
  s+=M.map(p=>`<rect x="${p[0]-8}" y="${p[1]-8}" width="16" height="16" transform="rotate(45 ${p[0]} ${p[1]})" style="fill:var(--olive)" stroke-width="1.4"/>`).join("");
  s+=[...L1,...L2,...L3].map(p=>circ(p,10,false)).join("");
  s+=G.map(p=>`<rect x="${p[0]-11}" y="${p[1]-11}" width="22" height="22" style="fill:var(--bg)" stroke-width="1.4"/>`).join("");
  s+=MD.map(p=>`<rect x="${p[0]-14}" y="${p[1]-14}" width="28" height="28" style="fill:var(--bg)" stroke-width="1.4"/><rect x="${p[0]-7}" y="${p[1]-7}" width="14" height="14" fill="currentColor" stroke="none"/>`).join("");
  const T=(x,y,t,a="middle")=>`<text x="${x}" y="${y}" text-anchor="${a}" fill="currentColor" stroke="none">${t}</text>`;
  s+=T(40,70,"clients","start")+T(40,555,"miners","start")+T(470,90,"mixnet · several hops")+T(790,120,"gateways · staked")+T(990,150,"models","end")+T(990,166,"open-source","end");
  s+=`</g></g>`;
  svg.innerHTML=s;
  const btns=$$(".legend button");
  btns.forEach(b=>b.addEventListener("click",()=>{
    const k=b.dataset.lay;
    if(k==="all"){ btns.forEach(x=>{ if(x.dataset.lay!=="all") x.setAttribute("aria-pressed","true"); }); svg.querySelectorAll(".lay").forEach(g=>g.classList.remove("off")); return; }
    const on=b.getAttribute("aria-pressed")!=="true"; b.setAttribute("aria-pressed",String(on));
    svg.querySelector(`.lay[data-lay="${k}"]`).classList.toggle("off",!on);
  }));
  const path=svg.querySelector("#realPath"), pk=svg.querySelector("#realPk"), len=path.getTotalLength();
  let vis=false; onView(svg,v=>vis=v,false,"0px");
  function frame(t){ requestAnimationFrame(frame); if(!vis) return; const p=path.getPointAtLength((t/5000%1)*len); pk.setAttribute("x",p.x-5); pk.setAttribute("y",p.y-5); }
  if(RM){ const p=path.getPointAtLength(len*.55); pk.setAttribute("x",p.x-5); pk.setAttribute("y",p.y-5); } else requestAnimationFrame(frame);
})();

/* transition bands: dither from the section above into the section below, drawn on canvas so it always fills the full width */
(function(){
  const B=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  $$(".ascii").forEach(el=>{
    const cv=document.createElement("canvas"); el.appendChild(cv);
    let g=null, vis=false, seed=1;
    const bgOf=n=>{ while(n){ const c=getComputedStyle(n).backgroundColor; if(c&&c!=="rgba(0, 0, 0, 0)"&&c!=="transparent") return c; n=n.parentElement; } return getComputedStyle(document.body).backgroundColor; };
    const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    function size(){ g=fit(cv); draw(); }
    function draw(){
      if(!g) return;
      const {c,w,h}=g, top=bgOf(el.previousElementSibling), bot=bgOf(el.nextElementSibling);
      c.fillStyle=bot; c.fillRect(0,0,w,h);
      c.fillStyle=top;
      const cw=8, ch=12, px=2, py=3, cols=Math.ceil(w/cw), rows=Math.ceil(h/ch);
      for(let r=0;r<rows;r++){
        const base=1-r/(rows-1);
        for(let k=0;k<cols;k++){
          const v=Math.max(0,Math.min(1,base+(rnd()-.5)*.6));
          if(v<=0.02) continue;
          if(v>=0.98){ c.fillRect(k*cw,r*ch,cw,ch); continue; }
          for(let y=0;y<4;y++) for(let x=0;x<4;x++){
            if(B[y*4+x]/16<v) c.fillRect(k*cw+x*px,r*ch+y*py,px,py);
          }
        }
      }
    }
    onView(el,v=>vis=v,false,"0px");
    addEventListener("resize",size);
    new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
    size();
    if(!RM) setInterval(()=>{ if(vis) draw(); },160);
  });
})();

/* 07 hud */
(function(){
  const cv=$("#field"); let g=fit(cv), vis=false; addEventListener("resize",()=>g=fit(cv));
  onView(cv,v=>vis=v,false,"0px");
  const CH=" .:-=+*#";
  function draw(t){
    const {c,w,h}=g, s=16; c.clearRect(0,0,w,h); c.font='12px "JetBrains Mono", monospace'; c.fillStyle=fgOf(cv);
    for(let y=0;y<h;y+=s) for(let x=0;x<w;x+=s*.62){
      const v=(Math.sin(x*.012+t*.0004)+Math.sin(y*.017-t*.0003)+Math.sin((x+y)*.006+t*.0002))/3;
      const k=Math.floor((v*.5+.5)*CH.length); if(k<=2) continue;
      c.globalAlpha=.08+k*.035; c.fillText(CH[Math.min(CH.length-1,k)],x,y+12);
    }
    c.globalAlpha=1;
  }
  let last=0; function frame(t){ requestAnimationFrame(frame); if(!vis||t-last<120) return; last=t; draw(t); }
  if(RM) draw(0); else requestAnimationFrame(frame);
  const ck=$("#clock"), dt=$("#date"), ep=$("#epochLeft"), p2=n=>String(n).padStart(2,"0");
  function tick(){ const d=new Date(); ck.textContent=`${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
    dt.textContent=`${d.getFullYear()}.${p2(d.getMonth()+1)}.${p2(d.getDate())}`;
    const left=3600-(d.getMinutes()*60+d.getSeconds()); ep.textContent=`${p2(Math.floor(left/60)%60)}:${p2(left%60)}`; }
  tick(); setInterval(tick,1000);
})();

/* 08 calculator */
(function(){
  const T=1000, inp=$("#realIn"), tierB=$$(".seg button"); let tier=1;
  const money=v=>v>=100?"$"+Math.round(v).toLocaleString("en-US"):"$"+v.toFixed(v<10?2:0);
  function upd(){
    const real=+inp.value, dec=T-real;
    $("#realOut").textContent=real.toLocaleString("en-US");
    $("#cR").style.width=(real/T*100)+"%"; $("#cRl").textContent=real.toLocaleString("en-US"); $("#cDl").textContent=dec.toLocaleString("en-US");
    $("#oD").textContent=dec.toLocaleString("en-US");
    $("#oH").textContent=dec===0?"$0":`${money(dec*60*.001*tier)} - ${money(dec*60*.005*tier)}`;
    $("#oX").textContent=(T/real).toFixed(1)+"x";
    $("#oM").textContent=Math.round(dec/T*100)+"%";
  }
  inp.addEventListener("input",upd);
  tierB.forEach(b=>b.addEventListener("click",()=>{ tier=+b.dataset.tier; tierB.forEach(x=>x.setAttribute("aria-pressed",String(x===b))); upd(); }));
  upd();
})();

/* 09 risk glyphs (generated ascii) */
(function(){
  const CH=[" ","░","▒","▓","█"];
  const F=[
    (x,y)=>{const a=Math.hypot(x-.38,y-.5),b=Math.hypot(x-.62,y-.5);return (Math.abs(a-.26)<.06||Math.abs(b-.26)<.06)?1:0;},
    (x,y)=>{const e=((x-.5)/.42)**2+((y-.5)/.3)**2;const p=Math.hypot(x-.5,y-.5);return p<.1?1:(Math.abs(e-1)<.18?.8:(e<1?.25:0));},
    (x,y)=>{const inDoc=x>.25&&x<.75&&y>.05&&y<.95;const line=Math.floor(y*10)%2===0&&x>.32&&x<.68;return inDoc?(line?.9:.3):0;},
    (x,y)=>{const col=Math.floor(x*6);const h=1-col/6;return (1-y)<h*.95?.4+.6*(1-col/6):0;}];
  $$(".glyph").forEach(el=>{ const f=F[+el.dataset.glyph], cols=30, rows=11; let out="";
    for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ const v=f(c/(cols-1),r/(rows-1)); const j=(Math.sin(c*12.9+r*78.2)*43758.5)%1; const k=Math.max(0,Math.min(4,Math.round(v*4+(j-.5)*.8))); out+=CH[v>0?Math.max(1,k):0]; } out+="\n"; }
    el.textContent=out; });
})();
