/* Arkiverat ur scripts.js 2026-10-05: den flytande AI-chatten - svarsmotor (botReply,
   chatEngine, wireChatInput) och orb/panel-logik. Ordagrant fran commit e152207.
   FOKUSERBARA och fokusfalla() stod mitt i blocket och ligger kvar i scripts.js -
   paketmodalen och mobilmenyn anvander dem. Kopiera tillbaka dem om chatten
   byggs om fran den har filen. */

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
const _fabBody=document.getElementById('fabBody'), _fabChips=document.getElementById('fabChips');
const fabAsk=(_fabBody&&_fabChips)?chatEngine(_fabBody,_fabChips):null;
// Skrivfält → motor (Enter eller skicka-knapp)
function wireChatInput(inputId, sendId, ask){
  const inp=document.getElementById(inputId), snd=document.getElementById(sendId);
  if(inp){ inp.addEventListener('keydown',e=>{ if(e.key==='Enter'&&inp.value.trim()){ ask(inp.value.trim()); inp.value=''; } }); }
  if(snd){ snd.addEventListener('click',()=>{ if(inp&&inp.value.trim()){ ask(inp.value.trim()); inp.value=''; inp.focus(); } }); }
}
wireChatInput('fabInput','fabSend',fabAsk);
// Orb-launcher → chat-panel (klick + tangentbord)
const aiOrb=document.getElementById('aiOrbContainer'), fabPanel=document.getElementById('fabPanel'), fabClose=document.getElementById('fabClose');
/* Chattpanelen ar en dialog: fokus flyttas in vid oppning, cirkulerar inuti,
   och lamnas tillbaka till orben vid stangning. Escape stanger alltid. */
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

