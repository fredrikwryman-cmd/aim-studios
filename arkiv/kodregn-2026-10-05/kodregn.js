/* Ur scripts.js (commit 3e682b3), ordagrant. Stod mellan pipeline-modulen och
   startsidans sticky case-uppslag. */

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
