const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Scroll progress + header ---------- */
const header = document.getElementById('header'), progress = document.getElementById('progress');
function onScroll(){
  const h = document.documentElement;
  const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
  if (progress) progress.style.width = (p*100)+'%';
  /* menyn blir ogenomskinlig sa fort sidan lamnat toppen */
  if (header) header.classList.toggle('is-solid', h.scrollTop > 8);
}
if (header || progress) { window.addEventListener('scroll', onScroll, {passive:true}); onScroll(); }

/* ---------- Magnet ---------- */
/* Knappar med .magnetic dras mot pekaren och fjadrar tillbaka vid slapp.
   Loopen gar bara medan en knapp ar aktiv och sover nar den stannat. */
(function(){
  if (reduce || matchMedia('(max-width:900px)').matches || matchMedia('(pointer:coarse)').matches) return;
  const mags=document.querySelectorAll('.magnetic');
  if(!mags.length) return;
  document.body.classList.add('has-magnet');
  let mx=0, my=0, magEl=null, releasing=false, cx=0, cy=0, tx=0, ty=0, raf=0;
  const kick=()=>{if(!raf) raf=requestAnimationFrame(frame);};
  addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;if(magEl)kick();},{passive:true});
  mags.forEach(el=>{
    el.addEventListener('pointerenter',()=>{ if(magEl&&magEl!==el) magEl.style.transform=''; magEl=el; releasing=false; kick(); });
    el.addEventListener('pointerleave',()=>{ if(magEl===el){ releasing=true; tx=0; ty=0; kick(); } });
  });
  function frame(){
    raf=0;
    if(!magEl) return;
    if(!releasing){
      const r=magEl.getBoundingClientRect();
      tx=(mx-r.left-r.width/2)*0.32; ty=(my-r.top-r.height/2)*0.42;
    }
    cx+=(tx-cx)*0.22; cy+=(ty-cy)*0.22;
    magEl.style.transform='translate3d('+cx.toFixed(2)+'px,'+cy.toFixed(2)+'px,0)';
    if(releasing && Math.hypot(cx,cy)<0.4){ magEl.style.transform=''; magEl=null; releasing=false; cx=cy=0; return; }
    if(!releasing && Math.abs(tx-cx)<0.05 && Math.abs(ty-cy)<0.05) return;
    raf=requestAnimationFrame(frame);
  }
})();

/* ---------- Reveal ---------- */
const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------- Before/After ---------- */
(function(){const ba=document.getElementById('ba'),before=document.getElementById('baBefore'),handle=document.getElementById('baHandle');if(!ba)return;let drag=false;function set(x){const r=ba.getBoundingClientRect();let p=((x-r.left)/r.width)*100;p=Math.max(2,Math.min(98,p));before.style.clipPath=`inset(0 ${100-p}% 0 0)`;handle.style.left=p+'%';}ba.addEventListener('mousedown',e=>{drag=true;set(e.clientX);});addEventListener('mousemove',e=>drag&&set(e.clientX));addEventListener('mouseup',()=>drag=false);ba.addEventListener('touchstart',e=>{drag=true;set(e.touches[0].clientX);},{passive:true});addEventListener('touchmove',e=>{if(drag)set(e.touches[0].clientX);},{passive:true});addEventListener('touchend',()=>drag=false);})();

/* ---------- Navbar v2 (scroll-spy + tema + mobil-overlay; ingen dock/krympning) ---------- */
(function(){
  // Aktiv-sektion-indikator som glider under länkarna (transform inom containern)
  const center=document.getElementById('navCenter'), ind=document.getElementById('navInd');
  if(center && ind){
    const links=[...center.querySelectorAll('.navlink')];
    const map={}; links.forEach(l=>{ const href=l.getAttribute('href')||''; const id=href.includes('#')?href.split('#').pop():''; if(id) map[id]=l; });
    let active=null, hovering=false;
    function place(el){ if(!el||!el.offsetWidth){ ind.style.opacity='0'; return; } ind.style.opacity='1'; ind.style.width=el.offsetWidth+'px'; ind.style.transform='translateX('+(el.offsetLeft-4)+'px)'; }
    function setActive(el){ active=el; links.forEach(l=>l.classList.toggle('active',l===el)); if(!hovering) place(el); }
    links.forEach(l=>l.addEventListener('mouseenter',()=>{ hovering=true; place(l); }));
    center.addEventListener('mouseleave',()=>{ hovering=false; place(active); });
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ const l=map[e.target.id]; if(l) setActive(l); } }); },{rootMargin:'-45% 0px -50% 0px',threshold:0});
      Object.keys(map).forEach(id=>{ const s=document.getElementById(id); if(s) io.observe(s); });
    }
    addEventListener('resize',()=>{ if(!hovering) place(active); });
  }

  // Tema-toggle (med minne, funkar i baren + i mobilmenyn)
  const rootEl=document.documentElement;
  const moon='<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>';
  const sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  function applyTheme(t){
    rootEl.setAttribute('data-theme',t);
    const icon=document.getElementById('themeIcon'); if(icon) icon.innerHTML = t==='light'?sun:moon;
    document.querySelectorAll('#themeBtn,#themeBtnM').forEach(b=>b.classList.toggle('rotated', t==='light'));
  }
  let theme='dark'; try{ theme=localStorage.getItem('aim-theme')||'dark'; }catch(e){}
  applyTheme(theme);
  function toggleTheme(){ theme=theme==='light'?'dark':'light'; applyTheme(theme); try{ localStorage.setItem('aim-theme',theme); }catch(e){} }
  document.querySelectorAll('#themeBtn,#themeBtnM').forEach(b=>b.addEventListener('click',toggleTheme));

  // Mobil: fullskärms-overlay (fade)
  const menuBtn=document.getElementById('menuBtn'), overlay=document.getElementById('mobileMenu'), closeBtn=document.getElementById('menuClose');
  if(overlay){
    /* visibility: hidden i CSS tar bort menyn ur bade tabbordning och
       tillganglighetstrad, sa aria-hidden behovs inte utover det. */
    const open=()=>{ overlay.classList.add('open'); menuBtn&&menuBtn.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden';
      setTimeout(()=>{ if(closeBtn) closeBtn.focus(); },60); };
    const close=()=>{ overlay.classList.remove('open'); menuBtn&&menuBtn.setAttribute('aria-expanded','false'); document.body.style.overflow='';
      if(menuBtn) menuBtn.focus(); };
    menuBtn&&menuBtn.addEventListener('click',open);
    closeBtn&&closeBtn.addEventListener('click',close);
    overlay.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    overlay.addEventListener('keydown',e=>fokusfalla(overlay,e));
    addEventListener('keydown',e=>{ if(e.key==='Escape' && overlay.classList.contains('open')) close(); });
  }
})();


/* ---------- Pricing calculator (speglar paketnivåerna) ---------- */
(function(){
  const PRICE={starter:9995,business:17995,premium:29995};
  const INCL ={starter:5,    business:10,   premium:15};
  const NAME ={starter:'Starter',business:'Business',premium:'Premium'};
  const pages=document.getElementById('pages'), pagesLbl=document.getElementById('pagesLbl'),
        amt=document.getElementById('calcAmt'), pkgLbl=document.getElementById('calcPkg');
  const seoT=document.getElementById('seoT'), aiT=document.getElementById('aiT'), brandT=document.getElementById('brandT');
  if(!pages) return;
  function fmt(n){return n.toLocaleString('sv-SE').replace(/\u00a0/g,' ');}
  const on=el=>el&&el.classList.contains('on');
  function calc(){
    let tier='starter';
    if(on(seoT)) tier='business';
    if(on(aiT)||on(brandT)) tier='premium';
    const p=+pages.value, incl=INCL[tier], extra=Math.max(0,p-incl);
    const total=PRICE[tier]+extra*900;
    pagesLbl.textContent=p+(p==1?' sida':' sidor');
    amt.textContent=fmt(total);
    if(pkgLbl){
      let t='Motsvarar '+NAME[tier]+'-paketet';
      if(extra>0) t+=' + '+extra+(extra==1?' extra sida':' extra sidor');
      pkgLbl.textContent=t;
    }
  }
  pages.addEventListener('input',calc);
  document.querySelectorAll('.toggle').forEach(tg=>{
    function flip(){ const on=tg.classList.toggle('on'); tg.setAttribute('aria-checked', String(on)); calc(); }
    tg.addEventListener('click', flip);
    tg.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); flip(); } });
  });
  calc();
})();

/* ---------- Chatbot (simulated) ---------- */
function botReply(q){
  q=q.toLowerCase();
  if(/pris|kosta|kostar|betala/.test(q)) return 'Mina paket börjar på 9 995 kr (Starter), 17 995 kr (Business) och 29 995 kr (Premium). Du betalar en gång – ingen bindningstid. Vill du att jag bokar ett gratis möte så räknar vi på just ditt projekt? 🙂';
  if(/snabb|tid|leverera|leverans|dagar|klar/.test(q)) return 'De flesta sidor är live på 10 dagar från vårt första samtal. Har du en deadline? Berätta gärna så ser vi vad som är möjligt!';
  if(/seo|google|synlig|sökmotor/.test(q)) return 'Ja! Alla sidor byggs SEO-vänligt från grunden, och Business- och Premium-paketen inkluderar aktivt SEO-arbete för att synas högre på Google.';
  if(/ai|chatbot|automation|bot/.test(q)) return 'Precis som den här chatten! Jag bygger in AI-assistenter som svarar kunder, fångar leads och bokar möten dygnet runt. Det ingår i Premium-paketet.';
  if(/boka|möte|kontakt|prata|ring/.test(q)) return 'Toppen! Scrolla ner till bokningsformuläret så hör jag av mig inom 24 timmar – helt kostnadsfritt och utan förpliktelser. 🚀';
  if(/hej|tja|hallå|hello|hi/.test(q)) return 'Hej! Vad roligt att du hör av dig. Vill du veta mer om priser, leveranstid eller hur jag jobbar?';
  return 'Bra fråga! Det enklaste är att boka ett gratis strategi-möte så går vi igenom just din situation. Scrolla ner till formuläret, så hör jag av mig inom 24 timmar. Vill du veta något om priser eller leveranstid under tiden?';
}
function chatEngine(bodyEl,chipsEl){
  function add(text,who){const m=document.createElement('div');m.className='msg '+who;m.textContent=text;bodyEl.appendChild(m);bodyEl.scrollTop=bodyEl.scrollHeight;return m;}
  function ask(q){add(q,'user');const t=document.createElement('div');t.className='msg bot typing';t.innerHTML='<span></span><span></span><span></span>';bodyEl.appendChild(t);bodyEl.scrollTop=bodyEl.scrollHeight;setTimeout(()=>{t.remove();add(botReply(q),'bot');},900+Math.random()*600);}
  chipsEl.querySelectorAll('.chat-chip').forEach(c=>c.addEventListener('click',()=>ask(c.dataset.q)));
  return ask;
}
const _demoBody=document.getElementById('demoBody'), _demoChips=document.getElementById('demoChips');
const demoAsk=(_demoBody&&_demoChips)?chatEngine(_demoBody,_demoChips):null;
const _fabBody=document.getElementById('fabBody'), _fabChips=document.getElementById('fabChips');
const fabAsk=(_fabBody&&_fabChips)?chatEngine(_fabBody,_fabChips):null;
// Skrivfält → motor (Enter eller skicka-knapp)
function wireChatInput(inputId, sendId, ask){
  const inp=document.getElementById(inputId), snd=document.getElementById(sendId);
  if(inp){ inp.addEventListener('keydown',e=>{ if(e.key==='Enter'&&inp.value.trim()){ ask(inp.value.trim()); inp.value=''; } }); }
  if(snd){ snd.addEventListener('click',()=>{ if(inp&&inp.value.trim()){ ask(inp.value.trim()); inp.value=''; inp.focus(); } }); }
}
wireChatInput('demoInput','demoSend',demoAsk);
wireChatInput('fabInput','fabSend',fabAsk);
// Orb-launcher → chat-panel (klick + tangentbord)
const aiOrb=document.getElementById('aiOrbContainer'), fabPanel=document.getElementById('fabPanel'), fabClose=document.getElementById('fabClose');
/* Chattpanelen ar en dialog: fokus flyttas in vid oppning, cirkulerar inuti,
   och lamnas tillbaka till orben vid stangning. Escape stanger alltid. */
const FOKUSERBARA='a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
/* Gemensam fokusfalla for dialoger. Anropas fran keydown pa behallaren.
   Monstret finns pa ETT stalle - chattpanelen och paketmodalen delar det. */
function fokusfalla(behallare, e){
  if(e.key!=='Tab' || !behallare) return;
  const f=[...behallare.querySelectorAll(FOKUSERBARA)]
    .filter(x=>!x.disabled && x.offsetWidth>0 && x.offsetHeight>0);
  if(!f.length) return;
  const forsta=f[0], sista=f[f.length-1];
  if(e.shiftKey && document.activeElement===forsta){ e.preventDefault(); sista.focus(); }
  else if(!e.shiftKey && document.activeElement===sista){ e.preventDefault(); forsta.focus(); }
}
function openChat(){
  if(!fabPanel) return;
  fabPanel.classList.add('open');
  if(aiOrb) aiOrb.setAttribute('aria-expanded','true');
  /* Textfaltet, inte stangknappen: panelens syfte ar att skriva i den. */
  const fi=document.getElementById('fabInput'); if(fi) setTimeout(()=>fi.focus(),80);
}
function closeChat(){
  if(!fabPanel) return;
  fabPanel.classList.remove('open');
  if(aiOrb){ aiOrb.setAttribute('aria-expanded','false'); aiOrb.focus(); }
}
function toggleChat(){ if(!fabPanel) return; fabPanel.classList.contains('open')?closeChat():openChat(); }
if(fabPanel){
  /* Tab cirkulerar inuti panelen. Escape och stangknappen ar alltid vagen ut. */
  fabPanel.addEventListener('keydown',e=>fokusfalla(fabPanel,e));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && fabPanel.classList.contains('open')){ e.preventDefault(); closeChat(); }
  });
}
if(aiOrb&&fabPanel){
  aiOrb.addEventListener('click',toggleChat);
  aiOrb.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleChat(); } });
}
if(fabClose){ fabClose.addEventListener('click',e=>{ e.stopPropagation(); closeChat(); }); }

/* ---------- Navbar-indikator (scroll-spy + hover) ---------- */

/* (scroll-spy, tema & mobilmeny hanteras nu i Navbar v2-IIFE högre upp) */



/* ---------- Form (Formspree AJAX) + confetti ---------- */
const form=document.getElementById('bookForm');
if(form){
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    let ok=true;
    [['namn',v=>v.trim()],['epost',v=>/\S+@\S+\.\S+/.test(v)]].forEach(([id,test])=>{const f=document.getElementById(id);if(!f)return;const valid=test(f.value);f.classList.toggle('err',!valid);if(!valid)ok=false;});
    if(!ok)return;
    const err=document.getElementById('formError'); if(err)err.classList.remove('show');
    const btn=form.querySelector('button[type="submit"]'); const orig=btn.textContent; btn.textContent='Skickar…'; btn.style.opacity='.7'; btn.disabled=true;
    try{
      const res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}});
      if(!res.ok) throw new Error('submit failed');
      /* height animeras medvetet: kortet kollapsar ~260 px och en teleport har ar varre
         an en layout-animation som kors en gang per besok i basta fall. */
      const kort=form.closest('.form-card');
      const h0=kort?kort.getBoundingClientRect().height:0;
      form.style.display='none';
      const klar=document.getElementById('formSuccess'); if(klar) klar.classList.add('show');
      const h1=kort?kort.getBoundingClientRect().height:0;
      if(!reduce && Math.abs(h1-h0)>8){
        kort.style.overflow='hidden';
        kort.style.height=h0+'px';
        void kort.offsetHeight;
        kort.style.transition='height .42s var(--ease)';
        kort.style.height=h1+'px';
        setTimeout(function(){ kort.style.height=''; kort.style.transition=''; kort.style.overflow=''; }, 480);
      }
      burst();
      /* kollen gors NAR hojden lagt sig, annars mats den gamla hojden */
      setTimeout(function(){
        var r=kort.getBoundingClientRect();
        if(r.top<0 || r.bottom>innerHeight) kort.scrollIntoView({block:'center', behavior: reduce ? 'auto' : 'smooth'});
      }, reduce ? 0 : 500);
    }catch(_){
      btn.textContent=orig; btn.style.opacity=''; btn.disabled=false; if(err)err.classList.add('show');
    }
  });
  form.querySelectorAll('input').forEach(f=>f.addEventListener('input',()=>f.classList.remove('err')));
}
function burst(){
  if(reduce) return;
  const cv=document.getElementById('confetti'),ctx=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;
  const cols=['#4F46E5','#6366F1','#818cf8','#ffffff'];const ps=[];
  for(let i=0;i<140;i++)ps.push({x:innerWidth/2,y:innerHeight*0.4,vx:(Math.random()-0.5)*14,vy:Math.random()*-15-4,r:Math.random()*6+3,c:cols[i%4],a:1,rot:Math.random()*6});
  let t=0;(function f(){ctx.clearRect(0,0,cv.width,cv.height);t++;ps.forEach(p=>{p.vy+=0.4;p.x+=p.vx;p.y+=p.vy;p.a-=0.012;p.rot+=0.2;ctx.globalAlpha=Math.max(0,p.a);ctx.fillStyle=p.c;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6);ctx.restore();});if(t<160)requestAnimationFrame(f);else ctx.clearRect(0,0,cv.width,cv.height);})();
}

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

/* ---------- Paket-modal (3D-flip reveal) ---------- */
(function(){
  const modal=document.getElementById('pkgModal'); if(!modal) return;
  const flip=document.getElementById('pkgFlip'), body=document.getElementById('pkgBody');
  const CHK='<span class="check"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>';
  const PKG={
    starter:{name:'Starter',price:'9 995',tag:'',desc:'En enkel, professionell hemsida som syns och övertygar.',
      feats:['Upp till 5 sidor','Mobilanpassad, modern design','Kontaktformulär','Grundläggande SEO (titlar, fart, Google-index)','1 revideringsrunda','Leverans 10 dagar']},
    business:{name:'Business',price:'17 995',tag:'Mest populär',desc:'Säljoptimerad hemsida byggd för att dra in fler kunder.',
      feats:['Allt i Starter','Upp till 10 sidor','Konverteringsoptimerad struktur (CTA:er, lead-formulär)','SEO-grundpaket (sökordsanalys + on-page)','Analys &amp; uppföljning (Analytics + Search Console)','2 revideringsrundor','Leverans 10–14 dagar']},
    premium:{name:'Premium',price:'29 995',tag:'',desc:'Komplett digital närvaro med branding och AI.',
      feats:['Allt i Business','Upp till 15 sidor','Komplett branding (logotyp + visuell identitet)','AI-chatbot &amp; automation','Prioriterad support','3 revideringsrundor','Leverans 14–21 dagar']}
  };
  const ADDONS=[
    ['Extra sida (utöver paketets antal)','från 900 kr/sida'],
    ['Bildframtagning (AI-genererad/redigerad)','från 500 kr/bild'],
    ['Extra revideringsrunda','från 1 500 kr'],
    ['Nya funktioner efter leverans','850 kr/tim'],
    ['Löpande ändringar &amp; underhåll','850 kr/tim']
  ];
  let lastFocus=null, current=null;

  function render(key){
    const p=PKG[key]; if(!p) return; current=key;
    const feats=p.feats.map(f=>`<li>${CHK} <span>${f}</span></li>`).join('');
    const addons=ADDONS.map(a=>`<div class="pm-arow"><span>${a[0]}</span><span class="ap">${a[1]}</span></div>`).join('');
    body.innerHTML=
      (p.tag?`<span class="pm-badge">${p.tag}</span>`:'')+
      `<div class="pm-name">${p.name}</div>`+
      `<div class="pm-price">${p.price} kr <span>· engång</span></div>`+
      `<p class="pm-desc">${p.desc}</p>`+
      `<ul class="pm-feats">${feats}</ul>`+
      `<div class="pm-addons"><div class="pm-addons-h">Utöver paketet — löpande räkning</div>${addons}`+
      `<p class="pm-fine">Allt utöver paketet sker mot löpande räkning eller fast offert – du godkänner alltid priset först. Domän &amp; hosting tillkommer och ägs av dig.</p></div>`+
      `<button type="button" class="btn btn-primary pm-book" data-book>Boka det här paketet →</button>`;
  }
  function openModal(key,card,trigger){
    /* Fokus ska tillbaka till det som oppnade modalen. Tidigare sattes lastFocus
       till kortet, som varken har tabindex eller roll - card.focus() gjorde da
       ingenting och fokus blev kvar i den stangda modalen. */
    lastFocus=(trigger&&trigger.focus)?trigger:(card||document.activeElement); render(key);
    document.querySelectorAll('.price-card.selected').forEach(c=>c.classList.remove('selected'));
    if(card) card.classList.add('selected');
    modal.classList.add('open');
    document.body.style.overflow='hidden'; flip.scrollTop=0;
    /* Kortet vrids in fran rotateY(-90deg). Ett element som star pa kant har ingen
       renderad bredd och kan inte ta emot fokus - focus() blir en tyst no-op utan
       att kasta nagot. Uppmatt: anropet misslyckades vid 80 och 150 ms och lyckades
       forst fran 250 ms. Vi vantar darfor pa att vridningen ar klar, med en
       tidsgrans som skydd om transitionend uteblir (t.ex. reduced motion). */
    /* Kortet vrids in fran rotateY(-90deg). Ett element som star pa kant har ingen
       renderad bredd och kan inte ta emot fokus - focus() blir en tyst no-op utan
       att kasta nagot. Uppmatt: anropet misslyckades vid 80 och 150 ms och lyckades
       forst fran 250 ms. Vi forsoker darfor per bildruta tills fokus sitter, med en
       tidsgrans. transitionend duger inte: under reduced motion uteblir den. */
    const deadline=Date.now()+800;
    const fokusera=()=>{
      if(!modal.classList.contains('open')) return;
      const c=flip.querySelector('.pkg-close'); if(!c) return;
      c.focus();
      if(document.activeElement!==c && Date.now()<deadline) requestAnimationFrame(fokusera);
    };
    requestAnimationFrame(fokusera);
  }
  function closeModal(){
    modal.classList.remove('open');
    document.body.style.overflow='';
    document.querySelectorAll('.price-card.selected').forEach(c=>c.classList.remove('selected'));
    if(lastFocus&&lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('.price-card[data-pkg]').forEach(card=>{
    const btn=card.querySelector('.pkg-open');
    const open=()=>openModal(card.dataset.pkg,card,btn);
    /* Knappen ar den enda vagen in. Kortet hade tidigare en egen click-lyssnare,
       vilket gjorde <div>-en till ett klickmal utan roll, namn eller tangentbordsvag.
       stopPropagation behovs inte langre: ingen forfader lyssnar pa click. */
    if(btn) btn.addEventListener('click',open);
  });
  /* Samma falla som chattpanelen, samma hjalpfunktion. visibility: hidden i CSS
     skoter bade tabbordning och tillganglighetstrad, sa aria-hidden behovs inte. */
  modal.addEventListener('keydown',e=>fokusfalla(modal,e));
  modal.addEventListener('click',e=>{
    if(e.target.closest('[data-close]')){ closeModal(); return; }
    if(e.target.closest('[data-book]')){
      const key=current; closeModal();
      const msg=document.getElementById('meddelande');
      if(msg&&key&&!msg.value.trim()) msg.value=`Hej! Jag är intresserad av ${PKG[key].name}-paketet.`;
      const boka=document.querySelector('#boka');
      /* Paketen ligger pa /webbdesign/, formularet pa startsidan. Finns det
         inget formular pa sidan gar knappen till startsidans kontaktdel. */
      if(!boka){ location.href='/#kontakt'; return; }
      setTimeout(()=>{ boka.scrollIntoView({behavior:'smooth',block:'start'}); },90);
    }
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&modal.classList.contains('open')) closeModal(); });
})();

/* ---------- Process pipeline (scroll-fyllning, rAF-throttlad) ---------- */
(function(){
  const pipeline=document.getElementById('pipeline'), fill=document.getElementById('pipelineFill');
  const stations=document.querySelectorAll('.station'), particles=document.getElementById('processParticles');
  if(!pipeline||!fill) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(particles && !reduce){
    for(let i=0;i<16;i++){ const p=document.createElement('div'); p.className='particle';
      p.style.left=(Math.random()*100)+'%'; p.style.top=(Math.random()*100)+'%';
      p.style.animationDelay=(Math.random()*4)+'s'; p.style.animationDuration=(3+Math.random()*3)+'s';
      particles.appendChild(p); }
  }
  let ticking=false;
  function update(){
    const rect=pipeline.getBoundingClientRect(), vh=innerHeight;
    const start=vh*0.8, end=vh*0.2;
    let progress=(start-rect.top)/(rect.height-(end-start));
    progress=Math.max(0,Math.min(1,progress));
    fill.style.height=(progress*100)+'%';
    stations.forEach(s=>{ const r=s.getBoundingClientRect(); if((vh*0.6 - r.top)/(r.height+100) > 0){ s.classList.add('active'); s.classList.add('in'); } });
    ticking=false;
  }
  function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});
  update();
  stations.forEach(s=>{ const orb=s.querySelector('.station-orb'); if(!orb) return;
    orb.addEventListener('mouseenter',()=>{ const liquid=orb.querySelector('.orb-liquid'); if(liquid){ liquid.style.transform='scale(1.18)'; setTimeout(()=>liquid.style.transform='',300); } }); });
})();

/* ---------- Kodregn: knapp i headern, val sparat i localStorage ----------
   Terminal-boot-skrivmaskinen som lag i samma IIFE ar borttagen ihop med sin
   markup och CSS. Kvar ar bara regnet.

   Effekten ar INTE standard och far inte bli det: en kontinuerlig
   helskarmsanimation kostar TBT vid sidladdning, och den kostnaden tas innan
   besokaren hinner stanga av den. Den startar darfor bara pa klick, och
   autostartar bara for den som redan klickat i gang den en gang.

   prefers-reduced-motion vinner alltid: ett sparat "on" arvs aldrig over till
   den som bett om mindre rorelse. Klickar de aktivt far de kora den anda -
   beslutet ska vara deras, inte arvt fran ett tidigare besok. */
(function(){
  var canvas=document.getElementById('matrixRain'), btn=document.getElementById('matrixBtn');
  if(!canvas || !btn) return;
  var ctx=canvas.getContext('2d');
  var chars='AiMSTUDIOS0123456789<>/=+-*', fontSize=14;
  var active=false, anim=null, drops=[];
  var NYCKEL='aim-matrix';   // samma stil som aim-theme

  function size(){ canvas.width=innerWidth; canvas.height=innerHeight; drops=Array(Math.max(1,Math.floor(canvas.width/fontSize))).fill(1); }
  function draw(){
    ctx.fillStyle='rgba(11,11,15,0.06)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#818cf8'; ctx.font=fontSize+'px JetBrains Mono';
    for(var i=0;i<drops.length;i++){
      ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*fontSize, drops[i]*fontSize);
      if(drops[i]*fontSize>canvas.height && Math.random()>0.975) drops[i]=0;
      drops[i]++;
    }
    anim=requestAnimationFrame(draw);
  }
  function start(){
    if(active) return; active=true;
    size(); canvas.classList.add('active'); draw();
    btn.setAttribute('aria-pressed','true');
  }
  function stop(){
    if(!active) return; active=false;
    canvas.classList.remove('active');
    if(anim) cancelAnimationFrame(anim); anim=null;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    btn.setAttribute('aria-pressed','false');
  }
  btn.addEventListener('click', function(){
    if(active) stop(); else start();
    try { localStorage.setItem(NYCKEL, active ? 'on' : 'off'); } catch(e){}
  });
  addEventListener('resize', function(){ if(active) size(); }, {passive:true});

  var mindreRorelse = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sparat = null; try { sparat = localStorage.getItem(NYCKEL); } catch(e){}
  if(sparat === 'on' && !mindreRorelse) start();
})();

/* ---------- Startsidans sticky case-uppslag ----------
   Hoger panel star still genom hela sektionen (position: sticky i CSS) och
   bilderna i den tonar over en i taget. Det har skriptet gor bara en sak:
   halla reda pa VILKET case som passerar, och satta klasser darefter.

   Forlagan (Aceternity UI) vaxlar med motion/react. Har ar det
   IntersectionObserver och en klass - inget bibliotek, inget byggsteg,
   ingen rAF-loop.

   rootMargin krymper vyn till en i praktiken tunn linje mitt pa skarmen.
   Pa desktop ligger casen kant i kant, sa exakt ETT case innehaller den
   linjen at gangen - och bytet sker nar casets mitt passerar mitten av vyn,
   inte redan nar dess overkant glider in. Ett bredare band lat nasta case ta
   over medan det forra fortfarande fyllde skarmen.

   Bara intradet reagerar vi pa: det case som senast passerade forblir aktivt
   tills nasta tar over, sa panelen aldrig star tom vid sektionens borjan
   eller slut.

   Utan skript satts .sc-pa aldrig. Da star alla skarmar pa opacity 1 och
   z-index lagger den forsta overst - ett case syns i stallet for tre, men
   all text, alla matvarden och alla lankar finns kvar for samtliga. */
(function(){
  var rot=document.getElementById('stickyCase'); if(!rot) return;
  var casen=rot.querySelectorAll('.sc-case');
  var skarmar=rot.querySelectorAll('.sc-skarm');
  if(!casen.length || casen.length!==skarmar.length) return;

  /* Mindre rorelse: ingen overtoning alls. Da lamnas laget som utan skript -
     forsta skarmen syns, texten ar orord. */
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(!('IntersectionObserver' in window)) return;

  rot.classList.add('sc-pa');

  function visa(n){
    for(var j=0;j<casen.length;j++){
      casen[j].classList.toggle('ar-aktiv', j===n);
      skarmar[j].classList.toggle('ar-visas', j===n);
    }
  }
  visa(0);   /* utgangslage tills forsta caset natt bandet */

  var io=new IntersectionObserver(function(poster){
    for(var i=0;i<poster.length;i++){
      if(!poster[i].isIntersecting) continue;
      var n=+poster[i].target.getAttribute('data-sc');
      if(n>=0 && n<casen.length) visa(n);
    }
  },{ rootMargin:'-50% 0px -49.9% 0px', threshold:0 });
  for(var k=0;k<casen.length;k++) io.observe(casen[k]);
})();

/* ---------- Presentationsvideor i case-korten pa /case/ ----------
   Alla fem case har en video: en langsam skrollning genom kundens sajt.
   Stillbilden ligger kvar under varje video och ar det som syns i
   utgangslaget. Videorna ar muted, loopar, har playsinline och
   preload="none" - ingenting hamtas forran en video faktiskt ska spela.

   Desktop (en pekare som kan hovra): spelar pa pointerenter, pausar pa
   pointerleave.
   Pekskarm (ingen hover): ingenting hamtas eller spelar forran man trycker.
   Forsta trycket pa bildbandet startar videon i stallet for att oppna
   lanken; nasta tryck medan den spelar oppnar kundens sajt som vanligt.
   "Besok projektet"-lanken under bandet oppnar alltid direkt. Videon
   pausas nar bandet lamnar vyn. Tidigare startade videon av sig sjalv i
   vyn och drog upp till ~2 MB pa en skrollning genom sidan.
   Tangentbord (Enter, detail 0) och mus navigerar alltid direkt.

   Bara EN video spelar at gangen. Fem samtidiga avkodningar kostar for mycket
   pa en svag telefon, och det ar bara en man tittar pa.

   Utan skript, och vid prefers-reduced-motion, hander ingenting alls:
   .spelar satts aldrig, videorna ar osynliga i CSS och stillbilderna syns. */
(function(){
  var vids=document.querySelectorAll('.case-video'); if(!vids.length) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var aktiv=null;

  function pausa(vid){
    vid.classList.remove('spelar'); vid.pause();
    if(aktiv===vid) aktiv=null;
  }
  function spela(vid){
    if(aktiv && aktiv!==vid) pausa(aktiv);
    aktiv=vid;
    var p=vid.play();
    /* play() avvisas av webblasaren i lagen vi inte styr over (stromsparlage,
       autoplay-policy). Da ska stillbilden bara ligga kvar, inte ett fel. */
    if(p && p.catch) p.catch(function(){});
  }

  /* (hover: hover) fragar om pekaren KAN hovra, vilket ar det som skiljer
     lagena at - inte skarmbredden. En liten laptop ska ha hover, en stor
     surfplatta ska inte. */
  var hover=matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* Pa pekskarm startar observern aldrig nagot - den pausar bara en video
     vars band lamnat vyn. */
  var io=(!hover && 'IntersectionObserver' in window) ? new IntersectionObserver(function(es){
    /* Har ar det flera band, sa varje post galler sitt eget mal. Inom ett och
       samma mal ar sista posten det aktuella laget, aldrig den forsta. */
    var sist=new Map();
    for(var i=0;i<es.length;i++) sist.set(es[i].target, es[i]);
    sist.forEach(function(e, band){
      var vid=band.querySelector('.case-video');
      if(!e.isIntersecting && aktiv===vid) pausa(vid);
    });
  },{ threshold:0 }) : null;

  for(var i=0;i<vids.length;i++){
    (function(vid){
      var band=vid.closest('.case-shot'); if(!band) return;
      /* Klassen satts pa 'playing', inte direkt vid play(). Med preload="none"
         finns ingen avkodad bildruta forran filen borjat komma, och utan den
         fordrojningen skulle man se en tom ruta over stillbilden. Spelar en
         annan video redan nar den har kommer igang, ska den inte visas. */
      vid.addEventListener('playing', function(){
        if(aktiv===vid) vid.classList.add('spelar'); else vid.pause();
      });
      if(hover){
        band.addEventListener('pointerenter', function(){ spela(vid); });
        band.addEventListener('pointerleave', function(){ pausa(vid); });
        band.addEventListener('focusin', function(){ spela(vid); });
        band.addEventListener('focusout', function(){ pausa(vid); });
      } else {
        /* pointerType fran pointerdown skiljer tryck fran mus och penna pa en
           hybridenhet. Bara ett tryck pa en video som inte redan spelar fangas. */
        var tryck=false;
        band.addEventListener('pointerdown', function(e){ tryck=(e.pointerType==='touch'); });
        band.addEventListener('click', function(e){
          if(!tryck || e.detail===0) return;
          tryck=false;
          if(aktiv===vid && !vid.paused) return;   /* spelar redan: lanken oppnas */
          e.preventDefault();
          spela(vid);
        });
        if(io) io.observe(band);
      }
    })(vids[i]);
  }

  /* Dold flik ska inte spela video. */
  document.addEventListener('visibilitychange', function(){ if(document.hidden && aktiv) pausa(aktiv); });
})();

/* ---------- Neuralt header-lager: nätverk + spotlight (vanilla, namespaced) ---------- */
(function(){
  var header=document.getElementById('header'), bar=document.getElementById('navBar');
  if(!header||!bar) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(matchMedia('(pointer: coarse)').matches) return;
  if(innerWidth<768) return;
  var canvas=bar.querySelector('.neural-canvas'); if(!canvas) return;
  var ctx=canvas.getContext('2d');
  var nodes=[], pulses=[], raf=null, running=false, inside=false, mx=0, my=0, lastW=0, lastH=0;
  var C={r:99,g:102,b:241}, G={r:168,g:85,b:247};
  function size(){ var r=bar.getBoundingClientRect(), dpr=devicePixelRatio||1; lastW=r.width; lastH=r.height; canvas.width=r.width*dpr; canvas.height=r.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); canvas.style.width=r.width+'px'; canvas.style.height=r.height+'px'; }
  function init(){ size(); var r=bar.getBoundingClientRect(); var n=Math.min(Math.floor(r.width*r.height/6000),22); nodes=Array.from({length:n},function(){return {x:Math.random()*r.width,y:Math.random()*r.height,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,base:1+Math.random()*1.4,a:.15+Math.random()*.2,pa:0,pr:0};}); }
  function ensureSize(){ var r=bar.getBoundingClientRect(); if(Math.abs(r.width-lastW)>1||Math.abs(r.height-lastH)>1) size(); }
  function pulse(){ var r=bar.getBoundingClientRect(), x=mx-r.left, y=my-r.top, near=null, md=80; nodes.forEach(function(nd){ var d=Math.hypot(nd.x-x,nd.y-y); if(d<md){md=d;near=nd;} }); if(near) pulses.push({wave:[{node:near,intensity:1}],seen:new Set(),age:0}); }
  function draw(){
    ensureSize();
    var r=bar.getBoundingClientRect(); ctx.clearRect(0,0,r.width,r.height);
    nodes.forEach(function(nd){ nd.x+=nd.vx; nd.y+=nd.vy; if(nd.x<0||nd.x>r.width)nd.vx*=-1; if(nd.y<0||nd.y>r.height)nd.vy*=-1; nd.pa*=.92; nd.pr*=.9; });
    pulses=pulses.filter(function(p){ p.age++; var nw=[]; p.wave.forEach(function(w){ var node=w.node; if(p.seen.has(node))return; p.seen.add(node); node.pa=Math.max(node.pa,w.intensity); node.pr=Math.max(node.pr,w.intensity*6); nodes.forEach(function(nb){ if(p.seen.has(nb))return; if(Math.hypot(node.x-nb.x,node.y-nb.y)<90) nw.push({node:nb,intensity:w.intensity*.65}); }); }); p.wave=nw; return nw.length>0&&p.age<60; });
    ctx.lineWidth=.8;
    for(var i=0;i<nodes.length;i++)for(var j=i+1;j<nodes.length;j++){ var a=nodes[i],b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y); if(d<100){ var al=Math.min((1-d/100)*.08+Math.max(a.pa,b.pa)*.4,.6); var g=ctx.createLinearGradient(a.x,a.y,b.x,b.y); g.addColorStop(0,'rgba('+C.r+','+C.g+','+C.b+','+al+')'); g.addColorStop(1,'rgba('+G.r+','+G.g+','+G.b+','+al+')'); ctx.strokeStyle=g; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } }
    nodes.forEach(function(nd){ var ta=Math.min(nd.a+nd.pa,1), tr=nd.base+nd.pr; if(nd.pa>.05){ ctx.beginPath(); ctx.arc(nd.x,nd.y,tr*3,0,6.283); ctx.fillStyle='rgba('+G.r+','+G.g+','+G.b+','+(nd.pa*.15)+')'; ctx.fill(); } ctx.beginPath(); ctx.arc(nd.x,nd.y,tr,0,6.283); ctx.fillStyle='rgba('+C.r+','+C.g+','+C.b+','+ta+')'; ctx.fill(); });
    if(inside&&Math.random()<0.012) pulse();
    raf=requestAnimationFrame(draw);
  }
  function start(){ if(!running){ running=true; draw(); } }
  function stop(){ running=false; if(raf) cancelAnimationFrame(raf); }
  header.addEventListener('mousemove',function(e){ mx=e.clientX; my=e.clientY; var r=bar.getBoundingClientRect(); bar.style.setProperty('--nx',(e.clientX-r.left)+'px'); bar.style.setProperty('--ny',(e.clientY-r.top)+'px'); });
  header.addEventListener('mouseenter',function(){ inside=true; header.classList.add('spotlight-on'); start(); });
  header.addEventListener('mouseleave',function(){ inside=false; header.classList.remove('spotlight-on'); stop(); });
  addEventListener('resize',function(){ init(); });
  init(); draw(); stop();
})();

/* ---------- Navbar = raka <a>-länkar, ingen dropdown-JS (medvetet borttagen) ---------- */

/* ---------- Löpande skötsel: prisväljare (Månadsvis / Kvartal / År) ---------- */
(function(){
  var sw=document.querySelector('.care-switch'); if(!sw) return;
  var opts=[].slice.call(sw.querySelectorAll('.care-opt'));
  var amts=[].slice.call(document.querySelectorAll('.care-amt'));
  var saves=[].slice.call(document.querySelectorAll('.care-save'));
  function set(term, direkt){
    opts.forEach(function(b){
      var on = b.getAttribute('data-term')===term;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    amts.forEach(function(el){
      var v=el.getAttribute('data-'+term); if(v) bytSiffra(el, v, direkt);
    });
    saves.forEach(function(el){ bytSpar(el, el.getAttribute('data-'+term), direkt); });
  }
  /* Siffran tonas ut, byts, tonas in. Avbrytbar: en ny klickning nollstaller
     timern sa vardet aldrig hinner skrivas av ett gammalt anrop. */
  function bytSiffra(el, v, direkt){
    if(direkt || reduce){ clearTimeout(el._t); el.classList.remove('is-out'); el.textContent=v; return; }
    if(el.textContent===v) return;
    clearTimeout(el._t);
    el.classList.add('is-out');
    el._t=setTimeout(function(){ el.textContent=v; el.classList.remove('is-out'); }, 120);
  }
  function bytSpar(el, t, direkt){
    clearTimeout(el._t);
    if(t){
      el.textContent=t; el.hidden=false;
      if(direkt || reduce){ el.classList.remove('is-collapsed'); return; }
      el.classList.add('is-collapsed'); void el.offsetHeight;
      el.classList.remove('is-collapsed');
    } else {
      if(direkt || reduce){ el.classList.add('is-collapsed'); el.hidden=true; el.textContent=''; return; }
      el.classList.add('is-collapsed');
      el._t=setTimeout(function(){ el.hidden=true; el.textContent=''; }, 220);
    }
  }
  sw.addEventListener('click', function(e){
    var b=e.target.closest('.care-opt'); if(b) set(b.getAttribute('data-term'));
  });
  set('m', true);   /* utgangslaget ritas utan animation */
})();

