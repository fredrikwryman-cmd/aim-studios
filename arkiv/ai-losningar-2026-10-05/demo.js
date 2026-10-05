/* Arkiverat ur scripts.js 2026-10-05: kopplingen av det simulerade demot pa /ai-losningar/
   (#demoBody, #demoChips, #demoInput, #demoSend) till den delade svarsmotorn.
   botReply(), chatEngine() och wireChatInput() ligger kvar i scripts.js - de
   anvands av den flytande chatten (#fabPanel) pa ovriga sidor.
   Ordagrant fran commit fedb500. */

const _demoBody=document.getElementById('demoBody'), _demoChips=document.getElementById('demoChips');
const demoAsk=(_demoBody&&_demoChips)?chatEngine(_demoBody,_demoChips):null;

wireChatInput('demoInput','demoSend',demoAsk);
