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


/* ---------- Fokusfalla for dialoger ----------
   Gemensam fokusfalla. Anropas fran keydown pa behallaren: Tab och Shift+Tab
   cirkulerar inuti. Anvands av mobilmenyn. Paketmodalen pa /webbdesign/ var
   den andra anroparen och ligger i arkiv/webbdesign-2026-10-06/.
   Lag tidigare i chattblocket; chatten ar arkiverad i arkiv/chatt-2026-10-05/. */
const FOKUSERBARA='a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
function fokusfalla(behallare, e){
  if(e.key!=='Tab' || !behallare) return;
  const f=[...behallare.querySelectorAll(FOKUSERBARA)]
    .filter(x=>!x.disabled && x.offsetWidth>0 && x.offsetHeight>0);
  if(!f.length) return;
  const forsta=f[0], sista=f[f.length-1];
  if(e.shiftKey && document.activeElement===forsta){ e.preventDefault(); sista.focus(); }
  else if(!e.shiftKey && document.activeElement===sista){ e.preventDefault(); forsta.focus(); }
}

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

