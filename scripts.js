const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Preloader ---------- */
(function(){
  const pre=document.getElementById('preloader'); if(!pre) return;
  if(reduce){ pre.remove(); return; }
  document.documentElement.style.overflow='hidden';
  setTimeout(()=>{ pre.classList.add('done'); document.documentElement.style.overflow=''; setTimeout(()=>pre.remove(),800); }, 850);
})();

/* ---------- Scroll progress + header ---------- */
const header = document.getElementById('header'), progress = document.getElementById('progress');
function onScroll(){
  const h = document.documentElement;
  const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
  progress.style.width = (p*100)+'%';
  header.classList.toggle('scrolled', h.scrollTop > 8);
}
window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

/* ---------- Custom cursor + magnetic (en rAF-loop, snärtig) ---------- */
(function(){
  if (reduce || matchMedia('(max-width:900px)').matches || matchMedia('(pointer:coarse)').matches) return;
  document.body.classList.add('has-cursor');
  const dot=document.getElementById('cDot'), ring=document.getElementById('cRing');
  dot.style.display='none'; // riktiga muspekaren visas istället
  let mx=innerWidth/2, my=innerHeight/2, px=mx, py=my, rx=mx, ry=my;
  addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});

  // Magnet: ett aktivt element i taget, fjädrar mjukt tillbaka vid släpp
  let magEl=null, releasing=false, cx=0, cy=0, tx=0, ty=0;
  document.querySelectorAll('.magnetic').forEach(el=>{
    el.addEventListener('pointerenter',()=>{ if(magEl&&magEl!==el) magEl.style.transform=''; magEl=el; releasing=false; });
    el.addEventListener('pointerleave',()=>{ if(magEl===el){ releasing=true; tx=0; ty=0; } });
  });
  document.querySelectorAll('a,button,.tilt,.switch-tab,.chat-chip,.toggle').forEach(el=>{
    el.addEventListener('pointerenter',()=>ring.classList.add('hot'));
    el.addEventListener('pointerleave',()=>ring.classList.remove('hot'));
  });

  function frame(){
    const vx=mx-px, vy=my-py; px=mx; py=my;
    const speed=Math.min(Math.hypot(vx,vy),55);
    // Ringen följer den riktiga pekaren tätt + töjs i rörelseriktningen
    rx+=(mx-rx)*0.55; ry+=(my-ry)*0.55;
    const ang=Math.atan2(vy,vx)*180/Math.PI;
    const s=1+speed/110;
    ring.style.transform=`translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) rotate(${ang}deg) scale(${s.toFixed(3)}, ${(1/s).toFixed(3)})`;
    // Magnet
    if(magEl){
      if(!releasing){ const r=magEl.getBoundingClientRect(); tx=(mx-r.left-r.width/2)*0.32; ty=(my-r.top-r.height/2)*0.42; }
      cx+=(tx-cx)*0.22; cy+=(ty-cy)*0.22;
      magEl.style.transform=`translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
      if(releasing && Math.hypot(cx,cy)<0.4){ magEl.style.transform=''; magEl=null; releasing=false; cx=cy=0; }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- Magnetic är hopslaget med musloopen ovan ---------- */

/* ---------- Reveal ---------- */
const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------- Icon draw ---------- */
const dio=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('drawn');dio.unobserve(e.target);}});},{threshold:0.3});
document.querySelectorAll('.svc-card').forEach(el=>dio.observe(el));

/* ---------- Count up ---------- */
const cio=new IntersectionObserver((es)=>{es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target;const to=+el.dataset.to;const pre=el.dataset.prefix||'';const suf=el.dataset.suffix||'';if(reduce){el.textContent=pre+to+suf;return;}let s=null;const d=1400;function tick(t){if(!s)s=t;const p=Math.min((t-s)/d,1);const v=Math.floor((1-Math.pow(1-p,3))*to);el.textContent=pre+v+suf;if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);});},{threshold:0.6});
document.querySelectorAll('.countup').forEach(el=>cio.observe(el));

/* ---------- Hero-rubrik: skärpa-in (mobil + dator) ---------- */
(function(){
  const el=document.querySelector('.scramble'); if(!el) return;
  el.textContent=el.dataset.text;
  if(reduce) return;
  const h1=el.closest('h1'); if(h1) requestAnimationFrame(()=>h1.classList.add('blur-in'));
})();

/* ---------- 3D tilt (cards + hero) ---------- */
if(!reduce && !matchMedia('(pointer:coarse)').matches){
  document.querySelectorAll('.tilt').forEach(card=>{
    card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const px=(e.clientX-r.left)/r.width;const py=(e.clientY-r.top)/r.height;card.style.transform=`perspective(800px) rotateY(${(px-0.5)*8}deg) rotateX(${(0.5-py)*8}deg) translateY(-4px)`;card.style.setProperty('--mx',px*100+'%');card.style.setProperty('--my',py*100+'%');});
    card.addEventListener('mouseleave',()=>{card.style.transform='';});
  });
  const ht=document.getElementById('heroTilt'), hh=document.querySelector('.hero h1');
  if(ht||hh){addEventListener('mousemove',e=>{const x=(e.clientX/innerWidth-0.5);const y=(e.clientY/innerHeight-0.5);if(ht)ht.style.transform=`rotateY(${-8 - x*5}deg) rotateX(${4 + y*5}deg)`;if(hh)hh.style.transform=`perspective(900px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`;});}
}

/* ---------- Marquee dup ---------- */
const mq=document.getElementById('marquee'); if(mq) mq.innerHTML+=mq.innerHTML;

/* ---------- FAQ ---------- */
document.querySelectorAll('.faq-q').forEach(btn=>{btn.addEventListener('click',()=>{const item=btn.parentElement;const ans=item.querySelector('.faq-a');const open=item.classList.toggle('open');ans.style.maxHeight=open?ans.scrollHeight+'px':'0';});});

/* ---------- Before/After ---------- */
(function(){const ba=document.getElementById('ba'),before=document.getElementById('baBefore'),handle=document.getElementById('baHandle');if(!ba)return;let drag=false;function set(x){const r=ba.getBoundingClientRect();let p=((x-r.left)/r.width)*100;p=Math.max(2,Math.min(98,p));before.style.clipPath=`inset(0 ${100-p}% 0 0)`;handle.style.left=p+'%';}ba.addEventListener('mousedown',e=>{drag=true;set(e.clientX);});addEventListener('mousemove',e=>drag&&set(e.clientX));addEventListener('mouseup',()=>drag=false);ba.addEventListener('touchstart',e=>{drag=true;set(e.touches[0].clientX);},{passive:true});addEventListener('touchmove',e=>{if(drag)set(e.touches[0].clientX);},{passive:true});addEventListener('touchend',()=>drag=false);})();

/* ---------- Timeline fill ---------- */
(function(){const tl=document.getElementById('timeline'),fill=document.getElementById('tlFill');if(!tl)return;function upd(){const r=tl.getBoundingClientRect();const vh=innerHeight;const start=vh*0.8, end=vh*0.2;let p=(start-r.top)/(r.height-(end-start));p=Math.max(0,Math.min(1,p));fill.style.height=(p*100)+'%';}addEventListener('scroll',upd,{passive:true});upd();})();

/* ---------- Style switcher + namn-generator ---------- */
(function(){
  const data={
    bygg:{tag:'BYGG & HANTVERK',h:'Vi bygger ditt drömhem',p:'Kvalitet och hantverk i varje detalj. Begär offert idag.',btn:'Begär offert →',c1:'#1a2332',c2:'#0f1620',accent:'#f59e0b',txt:'#1a1205',font:"'Inter Tight'"},
    rest:{tag:'RESTAURANG',h:'Smaker du minns',p:'Boka bord och upplev kvällens meny. Välkommen in.',btn:'Boka bord →',c1:'#2a1518',c2:'#1a0d10',accent:'#ef4444',txt:'#fff',font:"Georgia, serif"},
    shop:{tag:'E-HANDEL',h:'Handla smart, leverans imorgon',p:'Tusentals produkter. Fri frakt över 499 kr.',btn:'Handla nu →',c1:'#0f1f1a',c2:'#0a1512',accent:'#22C55E',txt:'#06210f',font:"'Inter Tight'"},
    kons:{tag:'KONSULT',h:'Vi tar din affär vidare',p:'Strategisk rådgivning som ger mätbara resultat.',btn:'Boka möte →',c1:'#15161f',c2:'#0d0e15',accent:'#6366F1',txt:'#fff',font:"'Inter Tight'"},
    frisor:{tag:'FRISÖR & SKÖNHET',h:'Din bästa look väntar',p:'Boka tid online – välkommen in till oss.',btn:'Boka tid →',c1:'#2a1326',c2:'#1a0c18',accent:'#ec4899',txt:'#fff',font:"'Inter Tight'"},
    tand:{tag:'TANDVÅRD & KLINIK',h:'Ett friskare leende',p:'Trygg tandvård med kort väntetid. Boka idag.',btn:'Boka tid →',c1:'#0d2230',c2:'#0a1620',accent:'#06b6d4',txt:'#04212b',font:"'Inter Tight'"},
    gym:{tag:'GYM & TRÄNING',h:'Starkare varje dag',p:'Kom igång med träningen – första veckan gratis.',btn:'Kom igång →',c1:'#1e2410',c2:'#12160a',accent:'#84cc16',txt:'#16210a',font:"'Inter Tight'"},
    hant:{tag:'EL & VVS',h:'Vi fixar jobbet – snabbt',p:'Jour och fasta priser. Ring eller begär offert.',btn:'Begär offert →',c1:'#2a1a10',c2:'#1a1009',accent:'#f97316',txt:'#fff',font:"'Inter Tight'"}
  };
  const tabs=document.getElementById('switchTabs'),body=document.getElementById('spBody');
  const elBrand=document.getElementById('spBrand'),elT=document.getElementById('spTag'),elH=document.getElementById('spH'),elP=document.getElementById('spP'),elB=document.getElementById('spBtn');
  const nameInput=document.getElementById('bizName');
  if(!tabs)return;
  let cur='bygg';
  function headline(k,nm){ const m={bygg:nm+' bygger ditt drömhem',rest:'Välkommen till '+nm,shop:'Handla hos '+nm,kons:nm+' tar din affär vidare',frisor:'Välkommen till '+nm,tand:'Boka tid hos '+nm,gym:'Träna hos '+nm,hant:nm+' fixar jobbet'}; return m[k]||nm; }
  function render(){
    const d=data[cur];
    body.style.background='linear-gradient(160deg, '+d.c1+', '+d.c2+')';
    elT.textContent=d.tag; elT.style.color=d.accent;
    const nm=nameInput?nameInput.value.trim():'';
    if(nm){ elBrand.textContent=nm; elBrand.style.color=d.accent; elBrand.classList.add('show'); elH.textContent=headline(cur,nm); }
    else { elBrand.classList.remove('show'); elH.textContent=d.h; }
    elH.style.fontFamily=d.font; elP.textContent=d.p;
    elB.textContent=d.btn; elB.style.background=d.accent; elB.style.color=d.txt||'#fff';
    tabs.querySelectorAll('.switch-tab').forEach(t=>{const on=t.dataset.k===cur;t.classList.toggle('active',on);t.style.background=on?d.accent:'';});
  }
  tabs.querySelectorAll('.switch-tab').forEach(t=>t.addEventListener('click',()=>{cur=t.dataset.k;render();}));
  if(nameInput) nameInput.addEventListener('input',render);
  render();
})();

/* ---------- Cookiebanner (GDPR) ---------- */
(function(){
  let consent=null;
  try{ consent=localStorage.getItem('cookie-consent'); }catch(_){}
  if(consent) return;
  const b=document.createElement('div');
  b.id='cookie-banner';
  b.innerHTML='<p>Vi använder cookies för att förbättra din upplevelse. <a href="integritetspolicy.html">Läs mer</a></p><div class="cb-actions"><button class="btn btn-secondary" id="cbDecline">Endast nödvändiga</button><button class="btn btn-primary" id="cbAccept">Acceptera</button></div>';
  document.body.appendChild(b);
  requestAnimationFrame(()=>b.classList.add('show'));
  function close(v){ try{localStorage.setItem('cookie-consent',v);}catch(_){} b.classList.remove('show'); setTimeout(()=>b.remove(),500); }
  b.querySelector('#cbAccept').addEventListener('click',()=>close('all'));
  b.querySelector('#cbDecline').addEventListener('click',()=>close('necessary'));
})();
/* ---------- Navbar: spotlight följer musen ---------- */
(function(){
  const center=document.getElementById('navCenter'), spotlight=document.getElementById('navSpotlight');
  if(!center||!spotlight) return;
  center.addEventListener('mousemove',e=>{ const rect=center.getBoundingClientRect(); spotlight.style.transform='translateX('+(e.clientX-rect.left-40)+'px)'; });
  center.addEventListener('mouseenter',()=>spotlight.style.opacity='1');
  center.addEventListener('mouseleave',()=>spotlight.style.opacity='0');
})();

/* ---------- Theme-toggle rotation ---------- */
(function(){
  const btn=document.getElementById('themeBtn'); if(!btn) return;
  btn.addEventListener('click',()=>{ btn.classList.add('rotated'); setTimeout(()=>btn.classList.remove('rotated'),500); });
})();

/* ---------- Easter egg: neon-läge (förstärkt) ---------- */
(function(){
  const logo=document.getElementById('logoLink'), toast=document.getElementById('eggToast'); if(!logo) return;
  function fireNeon(){
    const on=document.body.classList.toggle('neon');
    if(toast){ toast.textContent=on?'🌈 Neon-läge på!':'Neon-läge av'; toast.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>toast.classList.remove('show'),1800); }
    if(on && typeof burst==='function') burst();
    const nav=document.getElementById('navBar'); if(nav){ nav.style.animation='neonPulse 0.6s ease'; setTimeout(()=>{nav.style.animation='';},600); }
    if(on){ document.querySelectorAll('.iridescent').forEach((card,i)=>{ setTimeout(()=>{ card.style.transform='scale(1.02)'; setTimeout(()=>{card.style.transform='';},200); }, i*60); }); }
  }
  let clicks=0,last=0;
  logo.addEventListener('click',()=>{ const now=Date.now(); if(now-last>800) clicks=0; last=now; if(++clicks>=5){ clicks=0; fireNeon(); } });
  const seq=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a']; let idx=0;
  addEventListener('keydown',e=>{ const k=e.key.toLowerCase(); if(k===seq[idx]){ if(++idx===seq.length){ idx=0; fireNeon(); } } else { idx=(k===seq[0])?1:0; } });
})();

/* ---------- Pricing calculator ---------- */
(function(){
  const base=9995,pages=document.getElementById('pages'),pagesLbl=document.getElementById('pagesLbl'),amt=document.getElementById('calcAmt');
  const toggles=[...document.querySelectorAll('.toggle')];
  function fmt(n){return n.toLocaleString('sv-SE').replace(/\u00a0/g,' ');}
  function calc(){let t=base+(+pages.value-5)*900;toggles.forEach(tg=>{if(tg.classList.contains('on'))t+=+tg.dataset.add;});pagesLbl.textContent=pages.value+(pages.value==1?' sida':' sidor');amt.textContent=fmt(Math.max(base,t));}
  pages.addEventListener('input',calc);
  toggles.forEach(tg=>tg.addEventListener('click',()=>{tg.classList.toggle('on');calc();}));
  calc();
})();

/* ---------- Chatbot (simulated) ---------- */
function botReply(q){
  q=q.toLowerCase();
  if(/pris|kosta|kostar|betala/.test(q)) return 'Våra paket börjar på 9 995 kr (Starter), 19 995 kr (Business) och 39 995 kr (Premium). Du betalar en gång – ingen bindningstid. Vill du att jag bokar ett gratis möte så räknar vi på just ditt projekt? 🙂';
  if(/snabb|tid|leverera|leverans|dagar|klar/.test(q)) return 'De flesta sidor är live på 7–10 dagar från vårt första samtal. Har du en deadline? Berätta gärna så ser vi vad som är möjligt!';
  if(/seo|google|synlig|sökmotor/.test(q)) return 'Ja! Alla sidor byggs SEO-vänligt från grunden, och Business- och Premium-paketen inkluderar aktivt SEO-arbete för att synas högre på Google.';
  if(/ai|chatbot|automation|bot/.test(q)) return 'Precis som den här chatten! Vi bygger in AI-assistenter som svarar kunder, fångar leads och bokar möten dygnet runt. Det ingår i Premium-paketet.';
  if(/boka|möte|kontakt|prata|ring/.test(q)) return 'Toppen! Scrolla ner till bokningsformuläret så hör vi av oss inom 24 timmar – helt kostnadsfritt och utan förpliktelser. 🚀';
  if(/hej|tja|hallå|hello|hi/.test(q)) return 'Hej! Vad roligt att du hör av dig. Vill du veta mer om priser, leveranstid eller hur vi jobbar?';
  return 'Bra fråga! Det enklaste är att boka ett gratis strategi-möte så går vi igenom just din situation. Scrolla ner till formuläret, så hör vi av oss inom 24 timmar. Vill du veta något om priser eller leveranstid under tiden?';
}
function chatEngine(bodyEl,chipsEl){
  function add(text,who){const m=document.createElement('div');m.className='msg '+who;m.textContent=text;bodyEl.appendChild(m);bodyEl.scrollTop=bodyEl.scrollHeight;return m;}
  function ask(q){add(q,'user');const t=document.createElement('div');t.className='msg bot typing';t.innerHTML='<span></span><span></span><span></span>';bodyEl.appendChild(t);bodyEl.scrollTop=bodyEl.scrollHeight;setTimeout(()=>{t.remove();add(botReply(q),'bot');},900+Math.random()*600);}
  chipsEl.querySelectorAll('.chat-chip').forEach(c=>c.addEventListener('click',()=>ask(c.dataset.q)));
  return ask;
}
chatEngine(document.getElementById('demoBody'),document.getElementById('demoChips'));
const fabAsk=chatEngine(document.getElementById('fabBody'),document.getElementById('fabChips'));
const fab=document.getElementById('fab'),fabPanel=document.getElementById('fabPanel');
fab.addEventListener('click',()=>fabPanel.classList.toggle('open'));

/* ---------- Mobilmeny ---------- */
const menuBtn=document.getElementById('menuBtn'), mobileMenu=document.getElementById('mobileMenu');
if(menuBtn){
  menuBtn.addEventListener('click',()=>mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mobileMenu.classList.remove('open')));
}

/* ---------- Navbar-indikator (scroll-spy + hover) ---------- */
(function(){
  const center=document.querySelector('.nav-center'); if(!center) return;
  const ind=document.getElementById('navInd');
  const links=[...center.querySelectorAll('a.link')];
  const map={}; links.forEach(l=>map[l.getAttribute('href').slice(1)]=l);
  let active=null, hovering=false;
  function place(el){ if(!el||!el.offsetWidth){ind.style.opacity='0';return;} ind.style.opacity='1'; ind.style.width=el.offsetWidth+'px'; ind.style.transform='translateX('+el.offsetLeft+'px)'; }
  function setActive(el){ active=el; links.forEach(l=>l.classList.toggle('active',l===el)); if(!hovering) place(el); }
  links.forEach(l=>l.addEventListener('mouseenter',()=>{hovering=true; place(l);}));
  center.addEventListener('mouseleave',()=>{hovering=false; place(active);});
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){const l=map[e.target.id]; if(l) setActive(l);}});},{rootMargin:'-45% 0px -50% 0px',threshold:0});
  Object.keys(map).forEach(id=>{const s=document.getElementById(id); if(s) io.observe(s);});
  addEventListener('resize',()=>{ if(!hovering) place(active); });
})();

/* ---------- Theme toggle ---------- */
(function(){
  const btn=document.getElementById('themeBtn'),icon=document.getElementById('themeIcon'),root=document.documentElement;
  const moon='<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>';
  const sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  btn.addEventListener('click',()=>{const light=root.getAttribute('data-theme')==='light';root.setAttribute('data-theme',light?'dark':'light');icon.innerHTML=light?sun:moon;});
})();

/* ---------- Pinned horizontal cases (längre + cover-flow) ---------- */
(function(){
  const pin=document.getElementById('casesPin'),track=document.getElementById('casesTrack');
  if(!pin||!track) return;
  if(matchMedia('(max-width:900px)').matches){return;} // mobil använder native scroll
  const FACTOR=1.8; // högre = längre/långsammare scroll
  const cards=[...track.querySelectorAll('.case-card')];
  function setH(){const dist=track.scrollWidth - innerWidth + 80;pin.style.height=(innerHeight + Math.max(0,dist)*FACTOR)+'px';}
  function move(){
    const r=pin.getBoundingClientRect();
    const dist=track.scrollWidth - innerWidth + 80;
    let p=(-r.top)/(pin.offsetHeight - innerHeight);p=Math.max(0,Math.min(1,p));
    track.style.transform=`translateX(${-(p*Math.max(0,dist))}px)`;
    const cx=innerWidth/2;
    cards.forEach(c=>{
      const b=c.getBoundingClientRect();const d=Math.min(1,Math.abs((b.left+b.width/2)-cx)/(innerWidth*0.55));
      c.style.transform=`scale(${1-0.09*d})`;
      c.style.opacity=`${1-0.5*d}`;
    });
  }
  setH();move();
  addEventListener('resize',()=>{setH();move();});
  addEventListener('scroll',move,{passive:true});
})();

/* ---------- Form (Formspree AJAX) + confetti ---------- */
const form=document.getElementById('bookForm');
if(form){
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    let ok=true;
    [['namn',v=>v.trim()],['epost',v=>/\S+@\S+\.\S+/.test(v)]].forEach(([id,test])=>{const f=document.getElementById(id);const valid=test(f.value);f.classList.toggle('err',!valid);if(!valid)ok=false;});
    if(!ok)return;
    const err=document.getElementById('formError'); if(err)err.classList.remove('show');
    const btn=form.querySelector('button[type="submit"]'); const orig=btn.textContent; btn.textContent='Skickar…'; btn.style.opacity='.7'; btn.disabled=true;
    try{
      const res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}});
      if(!res.ok) throw new Error('submit failed');
      form.style.display='none'; document.getElementById('formSuccess').classList.add('show'); burst();
    }catch(_){
      btn.textContent=orig; btn.style.opacity=''; btn.disabled=false; if(err)err.classList.add('show');
    }
  });
  form.querySelectorAll('input').forEach(f=>f.addEventListener('input',()=>f.classList.remove('err')));
}
function burst(){
  if(reduce) return;
  const cv=document.getElementById('confetti'),ctx=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;
  const cols=['#4F46E5','#6366F1','#22C55E','#ffffff'];const ps=[];
  for(let i=0;i<140;i++)ps.push({x:innerWidth/2,y:innerHeight*0.4,vx:(Math.random()-0.5)*14,vy:Math.random()*-15-4,r:Math.random()*6+3,c:cols[i%4],a:1,rot:Math.random()*6});
  let t=0;(function f(){ctx.clearRect(0,0,cv.width,cv.height);t++;ps.forEach(p=>{p.vy+=0.4;p.x+=p.vx;p.y+=p.vy;p.a-=0.012;p.rot+=0.2;ctx.globalAlpha=Math.max(0,p.a);ctx.fillStyle=p.c;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6);ctx.restore();});if(t<160)requestAnimationFrame(f);else ctx.clearRect(0,0,cv.width,cv.height);})();
}

/* ---------- WebGL shader hero background ---------- */
(function(){
  const cv=document.getElementById('shader'); if(!cv) return;
  if(reduce||matchMedia('(max-width:900px)').matches){ cv.style.display='none'; return; }
  let gl; try{ gl=cv.getContext('webgl')||cv.getContext('experimental-webgl'); }catch(e){}
  if(!gl){ cv.style.display='none'; return; }
  const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`;
  const fs=`precision highp float;uniform vec2 u_res;uniform float u_t;uniform vec2 u_m;
  vec3 perm(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
  float snoise(vec2 v){const vec4 C=vec4(0.211324865,0.366025403,-0.577350269,0.024390243);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
  vec3 pp=perm(perm(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;
  vec3 x=2.0*fract(pp*0.024390243)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
  m*=1.792843-0.853735*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);}
  void main(){vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 p=uv;p.x*=u_res.x/u_res.y;
  float t=u_t*0.05;
  float n=snoise(p*1.4+vec2(t,t*0.6));
  n+=0.5*snoise(p*2.8-vec2(t*0.8,t));
  n+=0.25*snoise(p*5.0+vec2(t*1.3,-t));
  float md=distance(uv,u_m);n+=0.25*smoothstep(0.6,0.0,md);
  vec3 bg=vec3(0.043,0.043,0.059);
  vec3 c1=vec3(0.310,0.275,0.898);
  vec3 c2=vec3(0.133,0.773,0.369);
  vec3 col=bg;
  col=mix(col,c1,smoothstep(0.1,0.9,n)*0.55);
  col=mix(col,c2,smoothstep(0.5,1.1,n)*0.22);
  float vig=smoothstep(1.2,0.2,length(uv-0.5));col*=0.6+0.4*vig;
  gl_FragColor=vec4(col,1.0);}`;
  function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
  const prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);gl.useProgram(prog);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uRes=gl.getUniformLocation(prog,'u_res'),uT=gl.getUniformLocation(prog,'u_t'),uM=gl.getUniformLocation(prog,'u_m');
  let mx=0.5,my=0.3;
  cv.parentElement.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;my=1-(e.clientY-r.top)/r.height;});
  function size(){const dpr=Math.min(devicePixelRatio||1,1.5);cv.width=cv.clientWidth*dpr;cv.height=cv.clientHeight*dpr;gl.viewport(0,0,cv.width,cv.height);}
  size();addEventListener('resize',size);
  const start=performance.now();
  function draw(now){const t=(now-start)/1000;gl.uniform2f(uRes,cv.width,cv.height);gl.uniform1f(uT,reduce?0.0:t);gl.uniform2f(uM,mx,my);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);if(!reduce)requestAnimationFrame(draw);}
  if(reduce){draw(start);} else {requestAnimationFrame(draw);}
})();

/* ---------- Iridescent hover på kort ---------- */
document.querySelectorAll('.iridescent').forEach(card=>{
  card.addEventListener('mousemove',e=>{ const r=card.getBoundingClientRect(); card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%'); card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%'); });
});

/* ---------- Ambient grid (mus-följande, lerp) ---------- */
(function(){
  const grid=document.getElementById('ambientGrid'); if(!grid) return;
  if(matchMedia('(pointer:coarse)').matches) return;
  let gx=50,gy=50,tx=50,ty=50;
  document.addEventListener('mousemove',e=>{ tx=(e.clientX/innerWidth)*100; ty=(e.clientY/innerHeight)*100; },{passive:true});
  (function update(){ gx+=(tx-gx)*0.05; gy+=(ty-gy)*0.05; grid.style.setProperty('--gx',gx+'%'); grid.style.setProperty('--gy',gy+'%'); requestAnimationFrame(update); })();
})();
