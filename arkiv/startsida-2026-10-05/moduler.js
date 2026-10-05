/* Arkiverade moduler ur scripts.js, flyttade 2026-10-05 i steg 1 (ompositionering av startsidan).
   Ordagrant som de stod pa commit e3e4f8a. Laddas inte av nagon sida. */

/* ---------- Count up ---------- */
const cio=new IntersectionObserver((es)=>{es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target;const to=+el.dataset.to;const pre=el.dataset.prefix||'';const suf=el.dataset.suffix||'';if(reduce){el.textContent=pre+to+suf;return;}let s=null;const d=1400;function tick(t){if(!s)s=t;const p=Math.min((t-s)/d,1);const v=Math.floor((1-Math.pow(1-p,3))*to);el.textContent=pre+v+suf;if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);});},{threshold:0.6});
document.querySelectorAll('.countup').forEach(el=>cio.observe(el));


/* ---------- 3D tilt (cards + hero) ---------- */
if(!reduce && !matchMedia('(pointer:coarse)').matches){
  const ht=document.getElementById('heroTilt'), hh=document.querySelector('.hero h1');
  if(ht||hh){addEventListener('mousemove',e=>{const x=(e.clientX/innerWidth-0.5);const y=(e.clientY/innerHeight-0.5);if(ht)ht.style.transform=`rotateY(${-8 - x*5}deg) rotateX(${4 + y*5}deg)`;if(hh)hh.style.transform=`perspective(900px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`;});}
}


/* ---------- Misprint-drift (startsidans hero-rubrik) ---------- */
/* Pekaren drar platarna lite ur register: max 3 px i x och 1,8 px i y, med
   faktor -1 / 0,6 / 1,3 per plat. Skriver bara egenskapen translate - inflygningen
   (transform, CSS) och tilten pa h1:an (style.transform) ror den aldrig.
   Fjadern sover nar den natt malet; nollstalls pa pointerleave. Under 901 px
   och med grov pekare finns ingen drift, bara inflygningen. */
(function(){
  const h=document.querySelector('.hero h1.misprint');
  if(!h||reduce) return;
  const hero=h.closest('.hero'), plates=h.querySelectorAll('.mp-plate');
  const wide=matchMedia('(min-width: 901px) and (pointer: fine)');
  const F=[-1,0.6,1.3], MX=3, MY=1.8, K=170, C=19;
  let px=null, py=0, x=0, y=0, vx=0, vy=0, raf=0, last=0;
  const write=()=>{plates.forEach((p,i)=>{p.style.translate=(x*MX*F[i]).toFixed(2)+'px '+(y*MY*F[i]).toFixed(2)+'px';});};
  const clamp=v=>v<-1?-1:v>1?1:v;
  function step(t){
    const dt=Math.min((t-last)/1000,1/30); last=t;
    let tx=0, ty=0;
    if(px!==null){const r=h.getBoundingClientRect();tx=clamp((px-(r.left+r.width/2))/(r.width/2));ty=clamp((py-(r.top+r.height/2))/(r.height/2));}
    vx+=(K*(tx-x)-C*vx)*dt; vy+=(K*(ty-y)-C*vy)*dt; x+=vx*dt; y+=vy*dt;
    if(Math.abs(tx-x)<0.002&&Math.abs(ty-y)<0.002&&Math.abs(vx)<0.01&&Math.abs(vy)<0.01){x=tx;y=ty;vx=vy=0;write();raf=0;return;}
    write(); raf=requestAnimationFrame(step);
  }
  const kick=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(step);}};
  hero.addEventListener('pointermove',e=>{if(!wide.matches||e.pointerType!=='mouse')return;px=e.clientX;py=e.clientY;kick();});
  hero.addEventListener('pointerleave',()=>{px=null;kick();});
  wide.addEventListener('change',()=>{if(wide.matches)return;cancelAnimationFrame(raf);raf=0;px=null;x=y=vx=vy=0;write();});
})();

/* ---------- FAQ ---------- */
/* <details>/<summary> gor svaren lasbara utan JavaScript. Skriptet lagger bara pa
   den mjuka hojdanimationen ovanpa - hoppas over vid prefers-reduced-motion. */
if(!reduce) document.querySelectorAll('.faq-item').forEach(item=>{
  const sum=item.querySelector('.faq-q'), ans=item.querySelector('.faq-a');
  if(!sum||!ans) return;
  /* transitionend uteblir om overgangen inte kors alls (bakgrundsflik, transition
     avstangd, noll varaktighet). Timern ser till att laget alltid stads upp. */
  const done=cb=>{let fired=false;const run=()=>{if(fired)return;fired=true;clearTimeout(t);ans.removeEventListener('transitionend',h);cb();};
    const h=ev=>{if(ev.propertyName==='max-height')run();};
    const t=setTimeout(run,500);ans.addEventListener('transitionend',h);};
  sum.addEventListener('click',e=>{
    e.preventDefault();
    if(item.open){
      item.classList.add('faq-closing');
      ans.style.maxHeight=ans.scrollHeight+'px';
      void ans.offsetHeight; ans.style.maxHeight='0px';
      done(()=>{item.open=false;item.classList.remove('faq-closing');ans.style.maxHeight='';});
    }else{
      item.open=true;
      ans.style.maxHeight='0px';
      void ans.offsetHeight; ans.style.maxHeight=ans.scrollHeight+'px';
      done(()=>{ans.style.maxHeight='';});
    }
  });
});

/* ---------- Timeline fill ---------- */


/* ---------- Style switcher + namn-generator ---------- */
(function(){
  const data={
    bygg:{tag:'BYGG & HANTVERK',h:'Vi bygger ditt drömhem',p:'Kvalitet och hantverk i varje detalj. Begär offert idag.',btn:'Begär offert →',c1:'#1a2332',c2:'#0f1620',accent:'#f59e0b',txt:'#1a1205',font:"'Inter Tight'"},
    rest:{tag:'RESTAURANG',h:'Smaker du minns',p:'Boka bord och upplev kvällens meny. Välkommen in.',btn:'Boka bord →',c1:'#2a1518',c2:'#1a0d10',accent:'#ef4444',txt:'#fff',font:"Georgia, serif"},
    shop:{tag:'E-HANDEL',h:'Handla smart, leverans imorgon',p:'Tusentals produkter. Fri frakt över 499 kr.',btn:'Handla nu →',c1:'#141a2e',c2:'#0d1119',accent:'#6366F1',txt:'#0a1124',font:"'Inter Tight'"},
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
  // Valj lasbar textfarg mot accentfargen (WCAG AA) i stallet for hardkodad vit.
  function lum(hex){const c=hex.replace('#',''); const v=[0,2,4].map(function(i){let x=parseInt(c.substr(i,2),16)/255; return x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4);});
    return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];}
  function kvot(a,b){const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);}
  function lasbar(d){ if(d.txt && d.txt.charAt(0)==='#' && d.txt.length>=7 && kvot(d.txt,d.accent)>=4.5) return d.txt;
    return kvot('#000000',d.accent) >= kvot('#FFFFFF',d.accent) ? '#000000' : '#FFFFFF'; }
  function render(){
    const d=data[cur];
    const fgFarg=lasbar(d);
    body.style.background='linear-gradient(160deg, '+d.c1+', '+d.c2+')';
    elT.textContent=d.tag; elT.style.color=d.accent;
    const nm=nameInput?nameInput.value.trim():'';
    if(nm){ elBrand.textContent=nm; elBrand.style.color=d.accent; elBrand.classList.add('show'); elH.textContent=headline(cur,nm); }
    else { elBrand.classList.remove('show'); elH.textContent=d.h; }
    elH.style.fontFamily=d.font; elP.textContent=d.p;
    elB.textContent=d.btn; elB.style.background=d.accent; elB.style.color=fgFarg;
    tabs.querySelectorAll('.switch-tab').forEach(t=>{const on=t.dataset.k===cur;t.classList.toggle('active',on);t.style.background=on?d.accent:'';t.style.color=on?fgFarg:'';});
  }
  tabs.querySelectorAll('.switch-tab').forEach(t=>t.addEventListener('click',()=>{cur=t.dataset.k;render();}));
  if(nameInput) nameInput.addEventListener('input',render);
  render();
})();

/* ---------- Easter egg: neon-läge (förstärkt) ---------- */
(function(){
  const logo=document.getElementById('logoLink'), toast=document.getElementById('eggToast'); if(!logo) return;
  function fireNeon(){
    const on=document.body.classList.toggle('neon');
    if(toast){ toast.textContent=on?'🌈 Neon-läge på!':'Neon-läge av'; toast.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>toast.classList.remove('show'),1800); }
    if(on && typeof burst==='function') burst();
    if(on){ document.querySelectorAll('.iridescent').forEach((card,i)=>{ setTimeout(()=>{ card.style.transform='scale(1.02)'; setTimeout(()=>{card.style.transform='';},200); }, i*60); }); }
    if(on){ try{ var T=String.fromCharCode(65,105,77,167,110,51,48,110,167,50,48,167,113,55,120); if(window.__q9) window.__q9.t(T); if(window.openAimOrder) setTimeout(window.openAimOrder, 650); }catch(e){} }
  }
  let clicks=0,last=0;
  logo.addEventListener('click',()=>{ const now=Date.now(); if(now-last>800) clicks=0; last=now; if(++clicks>=5){ clicks=0; fireNeon(); } });
  const seq=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a']; let idx=0;
  addEventListener('keydown',e=>{ const k=e.key.toLowerCase(); if(k===seq[idx]){ if(++idx===seq.length){ idx=0; fireNeon(); } } else { idx=(k===seq[0])?1:0; } });
})();

/* ---------- WebGL shader hero background ---------- */
(function(){
  const cv=document.getElementById('shader'); if(!cv) return;
  if(reduce||matchMedia('(max-width:900px)').matches){ cv.style.display='none'; return; }
  let gl; try{ gl=cv.getContext('webgl')||cv.getContext('experimental-webgl'); }catch(e){}
  if(!gl){ cv.style.display='none'; return; }
  const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`;
  const fs=`precision mediump float;uniform vec2 u_res;uniform float u_t;uniform vec2 u_m;
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
  // Renderas i halv upplosning och skalas upp av CSS. Shadern ar mjuka brusgradienter,
  // sa 0.5x ar visuellt omarkbart men fjardedelar antalet fragment.
  const SKALA=0.5;
  function size(){const s=Math.min(devicePixelRatio||1,1)*SKALA;cv.width=Math.max(1,Math.round(cv.clientWidth*s));cv.height=Math.max(1,Math.round(cv.clientHeight*s));gl.viewport(0,0,cv.width,cv.height);}
  size();addEventListener('resize',size);
  const start=performance.now();
  // 30 fps racker for en langsam brusgradient; halverar arbetet mot 60.
  const MIN_INTERVALL=1000/30;
  let iVy=true, kor=false, sist=0, raf=0;
  // Prestandaprob: de forsta bildrutorna ritas otyglat och tidtas. Klarar maskinen
  // inte minst 40 fps saknar den GPU-acceleration (mjukvarurendering) - da fryser vi
  // effekten pa aktuell bild i stallet for att sanka hela sidan. Ser likadant ut, kostar noll.
  const PROB_RUTOR=12, PROB_GRANS=40;
  let probN=0, probStart=0, frusen=false;
  function rita(now){
    raf=0;
    const probar = probN < PROB_RUTOR;
    if(probar || now-sist>=MIN_INTERVALL){ sist=now;
      const t=(now-start)/1000;
      gl.uniform2f(uRes,cv.width,cv.height); gl.uniform1f(uT,reduce?0.0:t); gl.uniform2f(uM,mx,my);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      if(probar){
        if(probN===0) probStart=now;
        probN++;
        if(probN===PROB_RUTOR){
          const fps=(PROB_RUTOR-1)*1000/Math.max(1,now-probStart);
          if(fps<PROB_GRANS){ frusen=true; stoppa(); return; }
        }
      }
    }
    if(!reduce && kor) raf=requestAnimationFrame(rita);
  }
  function starta(){ if(kor||reduce||frusen) return; kor=true; sist=0; raf=requestAnimationFrame(rita); }
  function stoppa(){ kor=false; if(raf){ cancelAnimationFrame(raf); raf=0; } }
  // Pausa nar hero-ytan ar utanfor vyn och nar fliken ar dold.
  function pulsa(){ (iVy && !document.hidden) ? starta() : stoppa(); }
  if('IntersectionObserver' in window){
    /* Sista posten ar det aktuella laget. Flera poster kan koa ihop i ett och
       samma anrop, och es[0] ar da den ALDSTA - laser man den fastnar shadern
       som "ur vyn" nar man scrollar tillbaka upp och startar aldrig om. */
    new IntersectionObserver(function(es){ iVy=es[es.length-1].isIntersecting; pulsa(); },{threshold:0}).observe(cv);
  }
  document.addEventListener('visibilitychange',pulsa);
  if(reduce){ rita(performance.now()); } else { pulsa(); }
})();

/* ---------- Problem-sektion: glitch-rubrik + flip (hover desktop / auto touch) ---------- */
(function(){
  const headline=document.querySelector('.problem-headline');
  const cards=document.querySelectorAll('.problem-card');
  if(!headline && !cards.length) return;
  // Glitch-rubrik en gång när den syns
  if(headline && 'IntersectionObserver' in window){
    headline.setAttribute('data-text', headline.textContent);
    const hIo=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ headline.classList.add('active'); setTimeout(()=>headline.classList.remove('active'),420); hIo.unobserve(e.target); } });},{threshold:0.5});
    hIo.observe(headline);
  }
  // Touch saknar hover → auto-flippa korten vid scroll (desktop sköts av :hover i CSS)
  if(cards.length && 'IntersectionObserver' in window && matchMedia('(pointer:coarse)').matches){
    const fIo=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ const i=[...cards].indexOf(e.target); setTimeout(()=>e.target.classList.add('flipped'), 700+i*180); fIo.unobserve(e.target); } });},{threshold:0.3});
    cards.forEach(c=>fIo.observe(c));
  }
})();

/* ---------- Interaktivt rutnat BAKOM hela hero-sektionen ----------
   Skrivet efter en React-komponent fran React Bits, men i vanilla JS: sajten har
   inget byggsteg och inga beroenden, och ska inte fa nagra.

   Lagret tacker hela heron och ligger under rubrik, text, knappar och mockup.
   Det har pointer-events: none, sa det kan aldrig sno at sig markering eller
   klick - pekaren folis i stallet genom en lyssnare pa sjalva <section>.

   Det bar hela poangen att den SOVER. Nar sista cellen tonat ut slutar den begara
   bildrutor helt - ingen tom rAF-loop som tickar 60 ggr/s over en yta dar
   ingenting hander. Den vaknar pa pekarrorelse och tryck, och somnar av sig sjalv
   igen. Skillnaden ar noll CPU i vila mot en permanent loop. */
(function(){
  var ruta=document.getElementById('heroRuta'); if(!ruta) return;
  var cv=document.getElementById('heroRutaCv'); if(!cv || !cv.getContext) return;
  /* Lyssnaren sitter pa heron, inte pa lagret: lagret ar genomskinligt for
     pekaren och far aldrig ta emot nagot. */
  var hero=ruta.closest('.hero') || ruta.parentElement;

  /* Mindre rorelse: ingen canvas startas over huvud taget. Canvasen plockas ur
     DOM:en och rutan far ett statiskt rutnat via CSS-klassen. */
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    ruta.classList.add('stilla'); cv.remove(); return;
  }

  var ctx=cv.getContext('2d');
  var CELL=55, RADIE=130, HALL=150, TONA=800, LINJE=2.7, RINGFART=250;
  var R=99, G=102, B=241;                       /* var(--accent) #6366F1 */
  var SMAL=matchMedia('(max-width: 879px)');    /* under 880 px finns ingen pekare att folja */

  var celler=[], kolumner=0, rader=0, bredd=0, hojd=0;
  var ringar=[], raf=0, kor=false, iVy=true, kodregn=false;

  function matt(){
    var r=ruta.getBoundingClientRect();
    bredd=r.width; hojd=r.height;
    /* devicePixelRatio klamras till 2. Over det vaxer antalet fragment kvadratiskt
       utan att nagon ser skillnad pa en 2,7 px linje. */
    var dpr=Math.min(devicePixelRatio||1, 2);
    cv.width=Math.round(bredd*dpr); cv.height=Math.round(hojd*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    kolumner=Math.ceil(bredd/CELL); rader=Math.ceil(hojd/CELL);
    celler=new Array(kolumner*rader);
    for(var i=0;i<celler.length;i++) celler[i]={s:0,t:0};
  }

  /* smoothstep - samma mjuka avtoning fran centrum som forlagan. */
  function mjuk(k){ k=k<0?0:(k>1?1:k); return k*k*(3-2*k); }

  /* Ljuset halls HALL ms pa full styrka och tonar sedan ut linjart over TONA ms. */
  function alfa(c,nu){
    if(c.s<=0) return 0;
    var alder=nu-c.t;
    if(alder<HALL) return c.s;
    var k=1-(alder-HALL)/TONA;
    return k>0 ? c.s*k : 0;
  }

  /* En svagare traff far aldrig slacka en cell som redan lyser starkare - da
     skulle rutnatet flimra nar pekaren rors langsamt. */
  function tand(x,y,styrka,nu){
    if(styrka<=0) return;
    var c=celler[y*kolumner+x]; if(!c) return;
    if(styrka>=alfa(c,nu)){ c.s=styrka; c.t=nu; }
  }

  function lys(px,py,nu){
    var x0=Math.max(0,Math.floor((px-RADIE)/CELL)), x1=Math.min(kolumner-1,Math.floor((px+RADIE)/CELL));
    var y0=Math.max(0,Math.floor((py-RADIE)/CELL)), y1=Math.min(rader-1,Math.floor((py+RADIE)/CELL));
    for(var y=y0;y<=y1;y++) for(var x=x0;x<=x1;x++){
      var dx=(x+0.5)*CELL-px, dy=(y+0.5)*CELL-py, d=Math.sqrt(dx*dx+dy*dy);
      if(d<=RADIE) tand(x,y,mjuk(1-d/RADIE),nu);
    }
  }

  function ritaRutnat(nu){
    raf=0;
    ctx.clearRect(0,0,bredd,hojd);

    /* Klickringar: expanderar med RINGFART px/s och tander de celler de passerar. */
    for(var i=ringar.length-1;i>=0;i--){
      var rg=ringar[i], rad=(nu-rg.t)/1000*RINGFART;
      if(rad>rg.max){ ringar.splice(i,1); continue; }
      var band=CELL*0.6;
      var bx0=Math.max(0,Math.floor((rg.x-rad-band)/CELL)), bx1=Math.min(kolumner-1,Math.floor((rg.x+rad+band)/CELL));
      var by0=Math.max(0,Math.floor((rg.y-rad-band)/CELL)), by1=Math.min(rader-1,Math.floor((rg.y+rad+band)/CELL));
      for(var by=by0;by<=by1;by++) for(var bx=bx0;bx<=bx1;bx++){
        var ddx=(bx+0.5)*CELL-rg.x, ddy=(by+0.5)*CELL-rg.y;
        var avv=Math.abs(Math.sqrt(ddx*ddx+ddy*ddy)-rad);
        if(avv<=band) tand(bx,by,mjuk(1-avv/band),nu);
      }
    }

    var levande=0;
    ctx.lineWidth=LINJE;
    for(var y=0;y<rader;y++) for(var x=0;x<kolumner;x++){
      var c=celler[y*kolumner+x], a=alfa(c,nu);
      if(a<=0.004){ if(c.s>0) c.s=0; continue; }
      levande++;
      var mx=(x+0.5)*CELL, my=(y+0.5)*CELL;
      /* Radiell gradient per cell: full styrka i mitten, borta ute vid hornen.
         Det ar den som gor att cellerna smalter ihop till ljus i stallet for att
         lasa sig som ett ritat rutnat. Ingen statisk linje, ingen fyllning. */
      var gr=ctx.createRadialGradient(mx,my,0,mx,my,CELL*0.78);
      gr.addColorStop(0,'rgba('+R+','+G+','+B+','+a+')');
      gr.addColorStop(1,'rgba('+R+','+G+','+B+',0)');
      ctx.strokeStyle=gr;
      ctx.strokeRect(x*CELL+LINJE/2, y*CELL+LINJE/2, CELL-LINJE, CELL-LINJE);
    }

    /* Har somnar den: inget lyser och ingen ring lever, alltsa ingen ny bildruta. */
    if(levande===0 && ringar.length===0){ kor=false; return; }
    raf=requestAnimationFrame(ritaRutnat);
  }

  function vack(){
    if(kor || !iVy || kodregn || document.hidden) return;
    kor=true; raf=requestAnimationFrame(ritaRutnat);
  }
  function stoppa(){
    kor=false; if(raf){ cancelAnimationFrame(raf); raf=0; }
    ctx.clearRect(0,0,bredd,hojd);
    for(var i=0;i<celler.length;i++){ celler[i].s=0; celler[i].t=0; }
    ringar.length=0;
  }

  function punkt(e){ var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; }

  /* Pekaren foljs bara dar det finns en pekare. Under 880 px reagerar rutnatet
     enbart pa tryck - ingen permanent rorelse pa mobil. Lyssnaren ar passiv och
     anropar aldrig preventDefault, sa knappar och lankar i heron fungerar som
     vanligt aven nar trycket tander en ring. */
  if(!SMAL.matches){
    hero.addEventListener('pointermove', function(e){
      if(!iVy || kodregn) return;
      var p=punkt(e); lys(p.x,p.y,performance.now()); vack();
    }, {passive:true});
  }
  hero.addEventListener('pointerdown', function(e){
    if(!iVy || kodregn) return;
    var p=punkt(e);
    ringar.push({ x:p.x, y:p.y, t:performance.now(),
      max:Math.max(Math.hypot(p.x,p.y), Math.hypot(bredd-p.x,p.y),
                   Math.hypot(p.x,hojd-p.y), Math.hypot(bredd-p.x,hojd-p.y)) });
    vack();
  }, {passive:true});

  var omT=0;
  addEventListener('resize', function(){
    clearTimeout(omT);
    omT=setTimeout(function(){ var kordes=kor; stoppa(); matt(); if(kordes) vack(); }, 150);
  }, {passive:true});

  /* Ur vyn -> stopp. Tillbaka -> far vakna igen, men borjar inte rita av sig sjalv. */
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      /* Sista posten ar det aktuella laget. Flera poster kan koa ihop i ett och
         samma anrop, och es[0] ar da den ALDSTA - laser man den fastnar rutnatet
         som "ur vyn" nar man scrollar tillbaka och vaknar aldrig igen. */
      iVy=es[es.length-1].isIntersecting;
      if(!iVy) stoppa();
    }, {threshold:0}).observe(ruta);
  }
  document.addEventListener('visibilitychange', function(){ if(document.hidden) stoppa(); });

  /* Kodregnet lagger sig over hela vyn. Tva canvasar ska aldrig rita samtidigt i
     heron, sa rutnatet slas av helt sa lange regnet faller och slapps fritt igen
     nar det slas av. */
  function regn(aktiv){ kodregn=!!aktiv; if(kodregn) stoppa(); }
  regn(window.aimKodregn && window.aimKodregn.aktiv);
  addEventListener('aim:kodregn', function(e){ regn(e.detail && e.detail.aktiv); });

  matt();
})();

/* ---------- 20% OFF promo-sticker: magnetisk + flip + egg-koppling ---------- */
(function(){
  var s=document.getElementById('promoSticker'); if(!s) return;
  var reduceM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse=matchMedia('(pointer: coarse)').matches;
  var unlocked=false, baseRot='rotate(9deg)';
  if(!reduceM && !coarse){
    s.addEventListener('mousemove',function(e){
      var r=s.getBoundingClientRect();
      var dx=(e.clientX-(r.left+r.width/2))/(r.width/2);
      var dy=(e.clientY-(r.top+r.height/2))/(r.height/2);
      s.style.transform=baseRot+' translate('+(dx*8).toFixed(1)+'px,'+(dy*8).toFixed(1)+'px)';
    });
    s.addEventListener('mouseleave',function(){ s.style.transform=''; });
  }
  /* Bara den sida som ar vand mot betraktaren exponeras. Baksidan ar dold med
     backface-visibility men lag kvar i tillganglighetstradet. */
  var front=s.querySelector('.promo-front'), back=s.querySelector('.promo-back');
  function syncFaces(){
    var vand=s.classList.contains('flipped');
    if(front) front.setAttribute('aria-hidden', vand?'true':'false');
    if(back)  back.setAttribute('aria-hidden', vand?'false':'true');
  }
  syncFaces();
  function activate(){
    if(unlocked){ if(window.openAimOrder) window.openAimOrder(); return; }
    s.classList.toggle('flipped');
    syncFaces();
  }
  s.addEventListener('click',activate);
  s.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); activate(); } });
  addEventListener('q9:ok',function(){
    unlocked=true; s.classList.remove('flipped'); s.classList.add('unlocked'); syncFaces();
    s.setAttribute('aria-label','20% upplåst – klicka för att beställa');
    var hint=s.querySelector('.promo-hint'); if(hint) hint.textContent='✓ beställ →';
  });
})();

/* ---------- Beställnings-modal (egg-låst, 20% off) ---------- */
(function(){
  var modal=document.getElementById('orderModal'); if(!modal) return;
  var pkgs=modal.querySelectorAll('input[name="opkg"]');
  var addons=modal.querySelectorAll('.addon-row');
  var oOrig=document.getElementById('osumOrig'), oDisc=document.getElementById('osumDisc'), oFinal=document.getElementById('osumFinal');
  var details=document.getElementById('orderDetails');
  var form=document.getElementById('orderForm');
  function kr(n){ return n.toLocaleString('sv-SE').replace(/\u00a0/g,' ')+' kr'; }
  function calc(){
    var base=0, pkgName='';
    pkgs.forEach(function(p){ if(p.checked){ base=+p.dataset.price; pkgName=p.value; } });
    var parts=[], addonSum=0;
    addons.forEach(function(row){
      var q=+row.querySelector('.addon-qty').textContent;
      if(q>0){ var price=+row.dataset.price; addonSum+=q*price; parts.push(row.dataset.name+' x'+q+' ('+kr(q*price)+')'); }
    });
    var sub=base+addonSum, disc=Math.round(sub*0.2), fin=sub-disc;
    if(oOrig) oOrig.textContent=kr(sub);
    if(oDisc) oDisc.textContent='−'+kr(disc);
    if(oFinal) oFinal.textContent=kr(fin);
    if(details) details.value='Paket: '+pkgName+(parts.length?' | Tillval: '+parts.join(', '):'')+' | Ordinarie: '+kr(sub)+' | Rabatt -20%: -'+kr(disc)+' | ATT BETALA: '+kr(fin);
  }
  pkgs.forEach(function(p){ p.addEventListener('change',calc); });
  addons.forEach(function(row){
    var qEl=row.querySelector('.addon-qty');
    row.querySelector('.step-up').addEventListener('click',function(){ qEl.textContent=(+qEl.textContent+1); calc(); });
    row.querySelector('.step-dn').addEventListener('click',function(){ qEl.textContent=Math.max(0,+qEl.textContent-1); calc(); });
  });
  var cb=document.getElementById('orderClose');
  var oppnadeAv=null;
  function open(){
    if(!(window.__q9 && window.__q9.k())) return;   /* äkta lås: kräver att egget knäckts */
    oppnadeAv=document.activeElement;
    calc(); modal.classList.add('open'); document.body.style.overflow='hidden';
    setTimeout(function(){ if(cb) cb.focus(); },60);
  }
  function close(){ modal.classList.remove('open'); document.body.style.overflow='';
    if(oppnadeAv && oppnadeAv.focus) oppnadeAv.focus(); }
  window.openAimOrder=open;
  if(cb) cb.addEventListener('click',close);
  modal.addEventListener('keydown',function(e){ fokusfalla(modal,e); });
  modal.addEventListener('click',function(e){ if(e.target===modal) close(); });
  addEventListener('keydown',function(e){ if(e.key==='Escape'&&modal.classList.contains('open')) close(); });
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var nm=document.getElementById('oName'), em=document.getElementById('oEmail'), ok=true;
      if(!nm || !em) return;
      if(!nm.value.trim()){ nm.classList.add('err'); ok=false; } else nm.classList.remove('err');
      if(!/\S+@\S+\.\S+/.test(em.value)){ em.classList.add('err'); ok=false; } else em.classList.remove('err');
      var fel=document.getElementById('orderError');
      if(fel) fel.classList.remove('show');
      if(!ok) return;
      calc();
      /* F6d: skicka inte en bestallning utan paketinformation. calc() fyller
         det dolda faltet; ar det anda tomt har nagot gatt fel och da ska
         bestallningen inte skickas halvtom. */
      if(!details || !details.value.trim()){
        if(fel){ fel.textContent='Kunde inte läsa av ditt paketval – ladda om sidan och försök igen, eller mejla info@aimstudios.se.'; fel.classList.add('show'); }
        return;
      }
      var btn=form.querySelector('button[type="submit"]'), orig=btn.textContent; btn.textContent='Skickar…'; btn.disabled=true;
      fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}}).then(function(r){
        if(!r.ok) throw 0;
        modal.querySelector('.order-card').innerHTML='<div style="text-align:center;padding:34px 10px;"><div style="font-size:42px;margin-bottom:10px;">🎉</div><h3 style="font-size:24px;margin-bottom:8px;">Tack för din beställning!</h3><p style="color:var(--muted);">Vi hör av oss inom 24h med din 20%-bekräftelse.</p></div>';
        if(typeof burst==='function') burst();
      }).catch(function(){ btn.textContent=orig; btn.disabled=false;
        /* F6c: felrutan i formularet i stallet for en alert-dialog */
        if(fel){ fel.textContent='Något gick fel – mejla mig på info@aimstudios.se så ordnar jag det.'; fel.classList.add('show'); }
      });
    });
    form.querySelectorAll('input').forEach(function(f){ f.addEventListener('input',function(){ f.classList.remove('err'); }); });
  }
  calc();
})();

/* ---------- Marquee: pausknapp (WCAG 2.2.2) ----------
   Pausar BADA sparen, inte bara det exponerade - annars fortsatter dubbletten
   att rulla bakom. Etiketten vaxlar och aria-pressed foljer med. */
(function(){
  var btn=document.getElementById('marqueePause'); if(!btn) return;
  var spar=[].slice.call(document.querySelectorAll('.marquee-track'));
  if(!spar.length){ btn.remove(); return; }
  var txt=btn.querySelector('.marquee-pause-txt');
  btn.addEventListener('click',function(){
    /* Etiketten bar tillstandet. aria-pressed anvands medvetet INTE ocksa -
       tva samtidiga tillstandsmarkeringar lases upp dubbelt. */
    var ny=!btn.classList.contains('is-paused');
    btn.classList.toggle('is-paused', ny);
    spar.forEach(function(t){ t.classList.toggle('is-paused', ny); });
    if(txt) txt.textContent = ny ? 'Spela' : 'Pausa';
  });
})();
