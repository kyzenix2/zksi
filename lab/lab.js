/* zkSI noise lab, v0.1: local decoy generator + fixed size classes + commit/audit.
   Everything runs in this browser. Nothing is sent anywhere. */
"use strict";
document.documentElement.classList.add("js");

/* ---------- theme (same key as the landing page) ---------- */
(function(){
  const root=document.documentElement, key="zksi-theme";
  try{ const s=localStorage.getItem(key); if(s) root.dataset.theme=s; }catch(e){}
  const q=new URLSearchParams(location.search).get("theme"); if(q==="dark"||q==="light") root.dataset.theme=q;
  const b=document.getElementById("theme");
  if(b) b.addEventListener("click",()=>{
    root.dataset.theme = root.dataset.theme==="dark"?"light":"dark";
    try{ localStorage.setItem(key,root.dataset.theme); }catch(e){}
  });
  const top=document.querySelector(".top"); const f=()=>top&&top.classList.toggle("solid",scrollY>20); f(); addEventListener("scroll",f,{passive:true});
})();

/* ---------- randomness ---------- */
const R={
  u32(){ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]; },
  float(){ return R.u32()/4294967296; },
  int(n){ return Math.floor(R.float()*n); },
  pick(a){ return a[R.int(a.length)]; },
  shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=R.int(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; },
  b64url(nBytes){ const b=new Uint8Array(nBytes); crypto.getRandomValues(b); let s=""; for(const x of b) s+=String.fromCharCode(x); return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
};

/* ---------- size classes ---------- */
const CLASSES=[256,512,1024,2048,4096];
/* how often decoys pick each class; real prompts land wherever their length puts them */
const CLASS_WEIGHTS=[0.34,0.30,0.20,0.11,0.05];
const enc=new TextEncoder();
const bytes=s=>enc.encode(s).length;

function envelope(cls,prompt,pad){ return JSON.stringify({v:0,c:cls,p:prompt,z:pad}); }
function classFor(prompt){
  const base=bytes(envelope(4096,prompt,""));
  return CLASSES.find(c=>c>=base) || null;
}
/* pad the envelope to exactly cls bytes with random filler */
function pad(cls,prompt){
  const base=bytes(envelope(cls,prompt,""));
  let need=cls-base, z="";
  if(need<0) return null;
  z=R.b64url(Math.ceil(need*3/4)+3).slice(0,need);
  const out=envelope(cls,prompt,z);
  return bytes(out)===cls?out:null;
}
function weightedClass(minCls){
  const ok=CLASSES.map((c,i)=>c>=minCls?CLASS_WEIGHTS[i]:0), t=ok.reduce((a,b)=>a+b,0);
  let x=R.float()*t; for(let i=0;i<CLASSES.length;i++){ x-=ok[i]; if(x<=0&&ok[i]>0) return CLASSES[i]; }
  return CLASSES[CLASSES.length-1];
}

/* ---------- decoy generator: everyday requests from templates ---------- */
const S={
  lang:["Python","JavaScript","TypeScript","Go","Rust","SQL","Bash","Java","C#","Kotlin"],
  task:["parse a CSV file","retry a failed HTTP request","debounce a search box","read environment variables","paginate API results","validate an email field","merge two sorted lists","cache results for 10 minutes","resize images in a folder","log errors to a file"],
  err:["TypeError: cannot read properties of undefined","IndexError: list index out of range","connection refused on port 5432","CORS policy blocked the request","permission denied when writing the file","module not found after install","out of memory on a 2 GB file"],
  city:["Lisbon","Kyoto","Krakow","Valencia","Istanbul","Prague","Vienna","Porto","Seoul","Copenhagen","Budapest","Ljubljana"],
  days:["2 days","3 days","4 days","5 days","a long weekend","one week"],
  budget:["low","medium","flexible","under 500 EUR","under 1,000 EUR"],
  dish:["a vegetarian lasagna","chicken curry","a quick lentil soup","banana bread","shakshuka","a simple risotto","overnight oats","pad thai"],
  people:["2","4","6"],
  topic:["compound interest","how vaccines are tested","why the sky is blue","the difference between TCP and UDP","how a mortgage works","photosynthesis","inflation","the French Revolution","how GPS works","black holes"],
  level:["a 10 year old","a beginner","a high school student","someone in a hurry"],
  doc:["a cover letter for a junior designer role","a polite reminder about an unpaid invoice","a short bio for a conference talk","a thank you note to a colleague","a landlord email about a broken heater","a product description for a ceramic mug","a LinkedIn post about finishing a course"],
  tone:["friendly","formal","short and direct","warm"],
  math:["solve 3x + 7 = 22","what is 18% of 240","convert 72 F to Celsius","integrate x^2 from 0 to 3","the probability of two sixes in a row","simplify (a^2 - b^2)/(a - b)"],
  fit:["a 20 minute home workout","a beginner 5k plan","stretches for a stiff neck after desk work","a weekly gym split for 3 days"],
  book:["Dune","Pride and Prejudice","The Old Man and the Sea","1984","Sapiens","The Hobbit"],
  sheet:["sum a column only if another column says paid","find duplicates in column B","split full names into first and last name","count unique values in a range"],
  plant:["a monstera with yellow leaves","basil that keeps wilting","tomatoes on a balcony","a snake plant in low light"],
  gift:["a dad who likes fishing","a coworker leaving the team","a 7 year old who loves space","a friend who just moved"]
};
const T=[
  ()=>`Write a ${R.pick(S.lang)} function to ${R.pick(S.task)}. Keep it short and add comments.`,
  ()=>{ const e=R.pick([["TypeError: cannot read properties of undefined","JavaScript"],["IndexError: list index out of range","Python"],["KeyError: 'id'","Python"],["panic: runtime error: index out of range","Go"],["borrowed value does not live long enough","Rust"],["NullPointerException","Java"],["connection refused on port 5432","Node"],["CORS policy blocked the request","React"],["permission denied when writing the file","Bash"]]);
         return `I keep getting "${e[0]}" in my ${e[1]} project. What are the usual causes and how do I check each one?`; },
  ()=>`Plan ${R.pick(S.days)} in ${R.pick(S.city)} with a ${R.pick(S.budget)} budget. Mix food, walks and one museum.`,
  ()=>`Give me a recipe for ${R.pick(S.dish)} for ${R.pick(S.people)} people, with a shopping list.`,
  ()=>`Explain ${R.pick(S.topic)} to ${R.pick(S.level)}.`,
  ()=>`Draft ${R.pick(S.doc)}. Tone: ${R.pick(S.tone)}.`,
  ()=>{ const m=R.pick(S.math); return `${m[0].toUpperCase()}${m.slice(1)}? Show the steps.`; },
  ()=>`Make ${R.pick(S.fit)}. ${R.pick(["I have no equipment.","I can train 3 times a week.","I am getting back after a long break."])}`,
  ()=>`Summarize ${R.pick(S.book)} in five bullet points and name its main themes.`,
  ()=>`In a spreadsheet, how do I ${R.pick(S.sheet)}?`,
  ()=>`How do I take care of ${R.pick(S.plant)}?`,
  ()=>`Gift ideas for ${R.pick(S.gift)}, under 50 EUR.`,
  ()=>`Rewrite this to sound ${R.pick(S.tone)}: "Hi, just checking if you had time to look at the file I sent last week."`,
  ()=>`What are the pros and cons of ${R.pick(["renting vs buying","an electric car vs a hybrid","learning ${L} first","working from home","a standing desk"]).replace("${L}",R.pick(S.lang))}?`,
  ()=>`Translate to ${R.pick(["Spanish","German","French","Italian","Portuguese"])}: "${R.pick(["Where is the train station?","Can we move the meeting to Thursday?","Thank you for your help today.","Is breakfast included?"])}"`,
  ()=>`Review this Python snippet and suggest improvements:\nfor i in range(len(items)):\n    if items[i] != None:\n        result.append(items[i] * 2)`,
  ()=>`Write a short story opening about ${R.pick(["a lighthouse keeper","a lost umbrella","the last train of the night","a robot gardener","a city without maps"])}. Under 150 words.`,
  ()=>`Compare ${R.pick(["PostgreSQL and MySQL","React and Vue","SSD and HDD","Kindle and paper books","tea and coffee"])} in a small table.`,
  ()=>`My ${R.pick(["neighbor's dog barks all night","flatmate never does the dishes","neighbor parks in front of my garage","upstairs neighbor plays music at 2 am"])}. How do I bring it up without starting a fight?`,
  ()=>`My ${R.pick(["boss","manager","team lead"])} asked me to ${R.pick(["work this weekend again","take on a second project","cover for a colleague for a month"])}. How can I say no and stay on good terms?`,
  ()=>`I ${R.pick(["was charged twice for the same order","got a parking fine I think is wrong","was promised a refund three weeks ago and nothing came","bought a laptop that broke after 10 days"])}. What should I write to get this fixed?`,
  ()=>`Is it normal that ${R.pick(["my cat sleeps 16 hours a day","my sourdough starter smells like vinegar","my phone battery drains overnight","my car makes a squeak when I brake in the morning"])}?`,
  ()=>`What questions should I ask ${R.pick(["at a job interview for a support role","when viewing an apartment","before buying a used car","a contractor before renovating a bathroom"])}?`,
  ()=>`I have ${R.pick(["chicken, rice and spinach","eggs, potatoes and onions","pasta, tomatoes and tuna","tofu, broccoli and noodles"])} at home. What can I cook in 30 minutes?`,
  ()=>`Help me reply to a friend who ${R.pick(["forgot my birthday","cancelled plans for the third time","asked to borrow money again","invited me to a wedding I cannot attend"])}.`
];
function longer(p){ /* light, natural follow-ups so lengths spread out like real ones */
  const add=[" Please keep it short."," Explain it simply."," Use a numbered list."," Give two options and say which one you would pick."," Thanks!"," Be honest, not just nice."];
  const r=R.float();
  if(r<0.35) p+=R.pick(add);
  else if(r<0.45){ const x=R.pick(add); let y=R.pick(add); if(y===x) y=""; p+=x+y; }
  return p;
}
function decoyPrompt(){ return longer(R.pick(T)()); }

/* ---------- hashing ---------- */
async function sha256Hex(str){
  const d=await crypto.subtle.digest("SHA-256",enc.encode(str));
  return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

/* ---------- state ---------- */
const $=s=>document.querySelector(s);
const state={batch:null,guess:null,revealed:false,commit:null,decoyHashes:[]};

/* ---------- UI: compose ---------- */
const input=$("#prompt"), kIn=$("#k"), kOut=$("#kOut"), clsBox=$("#classes"), meta=$("#meta");
CLASSES.forEach(c=>{ const s=document.createElement("span"); s.className="cls"; s.dataset.c=c; s.textContent=c>=1024?(c/1024)+" KB":c+" B"; clsBox.appendChild(s); });
function refreshCompose(){
  const p=input.value.trim(), k=+kIn.value, cls=p?classFor(p):null;
  kOut.textContent=k;
  clsBox.querySelectorAll(".cls").forEach(s=>s.classList.toggle("on",cls!==null&&+s.dataset.c===cls));
  const b=bytes(p);
  const lo=(k*0.001).toFixed(3), hi=(k*0.005).toFixed(3);
  meta.innerHTML=
    `<span>${b.toLocaleString("en-US")} bytes of text</span>`+
    `<span>${cls?("padded to "+(cls>=1024?cls/1024+" KB":cls+" B")):(p?"too long for v0.1 (max ~4 KB)":"size class: -")}</span>`+
    `<span>${k+1} requests total, ${k+1}x traffic</span>`+
    `<span>decoy cost per real request: ~$${lo}-${hi} <em>ESTIMATE, cheap model</em></span>`;
  $("#go").disabled=!p||!cls;
}
input.addEventListener("input",refreshCompose); kIn.addEventListener("input",refreshCompose);
$("#example").addEventListener("click",()=>{ input.value=decoyPrompt(); refreshCompose(); input.focus(); });

/* ---------- build a batch ---------- */
async function build(){
  const p=input.value.trim(), k=+kIn.value, realCls=classFor(p);
  if(!p||!realCls) return;
  const items=[];
  items.push({real:true,prompt:p,cls:realCls,payload:pad(realCls,p)});
  let guard=0;
  while(items.length<k+1 && guard++<k*20){
    const d=decoyPrompt(), minC=classFor(d); if(!minC) continue;
    const c=weightedClass(minC), pl=pad(c,d); if(!pl) continue;
    items.push({real:false,prompt:d,cls:c,payload:pl});
  }
  R.shuffle(items);
  /* arrival times: exponential gaps, about one minute in total */
  const mean=60000/items.length; let t=0;
  for(const it of items){ t+=-Math.log(1-R.float())*mean; it.t=Math.round(t); }
  for(const it of items){ it.id=(await sha256Hex(it.payload)); }
  /* commit: hash over the sorted list of decoy payload hashes (what a miner would publish before sending) */
  const dh=items.filter(i=>!i.real).map(i=>i.id).sort();
  state.decoyHashes=dh;
  state.commit=await sha256Hex(dh.join("\n"));
  state.batch=items; state.guess=null; state.revealed=false;
  render();
  $("#out").hidden=false;
  $("#out").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
$("#go").addEventListener("click",build);

/* ---------- render ---------- */
const fmtT=ms=>{ const s=Math.floor(ms/1000), m=Math.floor(s/60); return `${String(m).padStart(2,"0")}:${String(s%60).padStart(2,"0")}.${String(ms%1000).padStart(3,"0")}`; };
const fmtC=c=>c>=1024?(c/1024)+" KB":c+" B";
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function render(){
  const b=state.batch, list=$("#list");
  list.innerHTML="";
  b.forEach((it,i)=>{
    const li=document.createElement("li");
    li.className="row"+(state.revealed&&it.real?" real":"")+(state.guess===i?" guessed":"");
    li.innerHTML=`<button type="button" class="pick" data-i="${i}" aria-label="Guess request ${i+1}">
      <span class="n">${String(i+1).padStart(2,"0")}</span>
      <span class="t">${fmtT(it.t)}</span>
      <span class="c">${fmtC(it.cls)}</span>
      <span class="p">${esc(it.prompt)}</span>
      <span class="h">${it.id.slice(0,10)}</span></button>`;
    list.appendChild(li);
  });
  list.querySelectorAll(".pick").forEach(btn=>btn.addEventListener("click",()=>{
    if(state.revealed) return;
    state.guess=+btn.dataset.i; state.revealed=true; render();
  }));
  const realI=b.findIndex(x=>x.real);
  const res=$("#result");
  if(state.revealed){
    const hit=state.guess===realI;
    res.innerHTML = state.guess===null
      ? `yours was <b>#${String(realI+1).padStart(2,"0")}</b>.`
      : (hit ? `you found it: <b>#${String(realI+1).padStart(2,"0")}</b>. you knew what you wrote; an observer does not. random guessing works 1 time in ${b.length}.`
             : `you picked #${String(state.guess+1).padStart(2,"0")}. yours was <b>#${String(realI+1).padStart(2,"0")}</b>. a random guess is right 1 time in ${b.length}.`);
  } else res.textContent=`pretend you are the provider: click the request you think is real, or reveal it.`;
  $("#reveal").disabled=state.revealed;
  drawWire();
  $("#commit").textContent=state.commit;
  $("#ndecoy").textContent=state.decoyHashes.length;
  $("#audit").innerHTML="";
  $("#sizes").textContent=`${b.length} requests · every payload is exactly its class size · ${new Set(b.map(x=>x.cls)).size} classes used`;
}
$("#reveal").addEventListener("click",()=>{ state.revealed=true; render(); });
$("#again").addEventListener("click",build);

/* network view: only time and size, no content */
function drawWire(){
  const svg=$("#wire"), b=state.batch, W=1000, H=120, maxT=Math.max(...b.map(x=>x.t))||1;
  let s=`<line x1="0" y1="${H-14}" x2="${W}" y2="${H-14}" stroke="currentColor" stroke-opacity=".3"/>`;
  b.forEach((it,i)=>{
    const x=8+(it.t/maxT)*(W-16), h=8+Math.log2(it.cls/256)*18;
    const real=state.revealed&&it.real;
    s+=`<rect x="${(x-3).toFixed(1)}" y="${(H-14-h).toFixed(1)}" width="6" height="${h.toFixed(1)}" ${real?'style="fill:var(--orange)"':'fill="currentColor" fill-opacity=".75"'}><title>${fmtT(it.t)} · ${fmtC(it.cls)}</title></rect>`;
  });
  s+=`<text x="0" y="${H-1}" fill="currentColor" fill-opacity=".6">00:00</text><text x="${W}" y="${H-1}" text-anchor="end" fill="currentColor" fill-opacity=".6">${fmtT(maxT)}</text>`;
  svg.innerHTML=s;
}

/* ---------- local audit: open ~1% of the committed decoys (at least one) ---------- */
$("#runAudit").addEventListener("click",async()=>{
  const b=state.batch; if(!b) return;
  const beacon=R.b64url(32);                       /* stands in for a future block hash */
  const seed=await sha256Hex(state.commit+beacon);
  const n=state.decoyHashes.length, k=Math.max(1,Math.ceil(n*0.01));
  const picks=new Set(); let j=0;
  while(picks.size<k){ picks.add(parseInt(seed.slice((j*8)%56,(j*8)%56+8),16)%n); j++; }
  const decoys=b.filter(x=>!x.real);
  let html=`<p>beacon (simulated block hash): <code>${(await sha256Hex(beacon)).slice(0,16)}…</code></p>`;
  let allOk=true;
  for(const idx of picks){
    const id=state.decoyHashes[idx], d=decoys.find(x=>x.id===id);
    const re=await sha256Hex(d.payload), ok=re===id && state.decoyHashes.includes(re);
    const recommit=await sha256Hex([...state.decoyHashes].sort().join("\n"));
    allOk = allOk && ok && recommit===state.commit;
    html+=`<p>opened decoy <code>${id.slice(0,10)}</code> · ${fmtC(d.cls)} · rehash ${ok?"matches":"does not match"} · commitment ${recommit===state.commit?"matches":"does not match"}</p>
           <pre>${esc(d.payload.slice(0,220))}${d.payload.length>220?"…":""}</pre>`;
  }
  html+=`<p class="verdict ${allOk?"ok":"bad"}">${allOk?"audit passed: the opened decoy was in the committed batch.":"audit failed."}</p>`;
  html+=`<p class="fine">in the planned network this check also confirms the decoy reached a gateway (nullifier) and looks credible; pass = paid for the batch, fail = stake lost. here it only checks the hash.</p>`;
  $("#audit").innerHTML=html;
});

/* ---------- export what the client would send (no marker for the real one) ---------- */
$("#dl").addEventListener("click",()=>{
  const b=state.batch; if(!b) return;
  const data={version:"0.1",generated:new Date().toISOString(),commit_decoys:state.commit,
    requests:[...b].sort((a,c)=>a.t-c.t).map(x=>({t_ms:x.t,size:x.cls,sha256:x.id,payload:x.payload}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const a=document.createElement("a"); a.href=url; a.download="zksi-noise-batch.json"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
});

refreshCompose();
