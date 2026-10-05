/* Ur scripts.js (commit bc11238), ordagrant, i den ordning de stod.
   Alla fyra hade bara element pa den gamla /webbdesign/. */

/* ---------- Before/After ---------- */
(function(){const ba=document.getElementById('ba'),before=document.getElementById('baBefore'),handle=document.getElementById('baHandle');if(!ba)return;let drag=false;function set(x){const r=ba.getBoundingClientRect();let p=((x-r.left)/r.width)*100;p=Math.max(2,Math.min(98,p));before.style.clipPath=`inset(0 ${100-p}% 0 0)`;handle.style.left=p+'%';}ba.addEventListener('mousedown',e=>{drag=true;set(e.clientX);});addEventListener('mousemove',e=>drag&&set(e.clientX));addEventListener('mouseup',()=>drag=false);ba.addEventListener('touchstart',e=>{drag=true;set(e.touches[0].clientX);},{passive:true});addEventListener('touchmove',e=>{if(drag)set(e.touches[0].clientX);},{passive:true});addEventListener('touchend',()=>drag=false);})();

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
  /* Samma falla som mobilmenyn, samma hjalpfunktion. visibility: hidden i CSS
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
