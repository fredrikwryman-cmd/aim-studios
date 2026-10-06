/* Arkiverat 2026-10-06, fas 5 pass 2. Laddas inte av nagon sida. */

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

