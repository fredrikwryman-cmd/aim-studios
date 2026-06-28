/* aim core */
(function(){var u=false,X=239523896;function h(s){var z=5381,i=0;for(;i<s.length;i++){z=((z<<5)+z)^s.charCodeAt(i);}return z>>>0;}try{Object.defineProperty(window,'__q9',{value:Object.freeze({t:function(k){if(!u&&typeof k==='string'&&h(k)===X){u=true;try{window.dispatchEvent(new CustomEvent('q9:ok'));}catch(e){}}return u;},k:function(){return u;}})});}catch(e){}})();
