/**
 * site.js — shared behaviour for both portfolio versions (index.html and economics/index.html).
 * Handles routing, the "on this page" panel, filters, EN/FR switch, carousels, statistics,
 * the anonymous feedback form and the hero network animation. No dependencies.
 */
(function(){
  // ---- accounts: fill these in after creating the two free accounts (see DEPLOY.md) ----
  var SETTINGS = {
    goatcounter: 'amisamyra',  // dashboard: https://amisamyra.goatcounter.com
    formspree: 'mwloqebr'      // form: https://formspree.io/forms/mwloqebr
  };

  // visit statistics (GoatCounter: no cookies, no personal data)
  var queue=[];
  function track(o){ if(!SETTINGS.goatcounter) return; if(window.goatcounter && window.goatcounter.count) window.goatcounter.count(o); else queue.push(o); }
  function trackEvent(name){ track({path:name, title:name, event:true}); }
  if(SETTINGS.goatcounter){
    var gc=document.createElement('script'); gc.async=true; gc.src='https://gc.zgo.at/count.v4.js';
    // pinned version + integrity hash: the browser refuses the script if the CDN copy is ever altered
    gc.integrity='sha384-nRw6qfbWyJha9LhsOtSb2YJDyZdKvvCFh0fJYlkquSFjUxp9FVNugbfy8q1jdxI+'; gc.crossOrigin='anonymous';
    gc.setAttribute('data-goatcounter','https://'+SETTINGS.goatcounter+'.goatcounter.com/count');
    gc.setAttribute('data-goatcounter-settings','{"no_onload": true}');
    gc.onload=function(){ var q=queue; queue=[]; q.forEach(track); };
    document.head.appendChild(gc);
  }
  var version=location.pathname.indexOf('/economics')>=0 ? 'economics' : 'engineering';

  var pages=[].map.call(document.querySelectorAll('.page'),function(p){return p.id.slice(2)});
  var pills=document.querySelectorAll('.pills a');
  var nav=document.getElementById('pills'), menu=document.getElementById('menu');
  var smooth=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current=null;

  function show(name, anchor){
    if(pages.indexOf(name)<0) name=pages[0];
    if(name!==current){
      document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('on',p.id==='p-'+name)});
      pills.forEach(function(a){a.classList.toggle('on',a.dataset.p===name)});
      current=name;
      // each page counts as its own page view, e.g. "/economics/#projects"
      track({path:location.pathname+'#'+name, title:name+' ('+version+')'});
      if(!anchor) window.scrollTo(0,0);
      spy();
    }
    if(anchor){var el=document.getElementById(anchor); if(el) el.scrollIntoView({behavior:smooth?'smooth':'auto'});}
    nav.classList.remove('open'); menu.setAttribute('aria-expanded','false');
  }
  function route(){
    var h=location.hash.slice(1);
    if(pages.indexOf(h)>=0) return show(h);
    var el=h && document.getElementById(h);
    if(el){var pg=el.closest('.page'); if(pg) return show(pg.id.slice(2), h);}
    show(pages[0]);
  }
  window.addEventListener('hashchange',route);
  window.addEventListener('popstate',route);

  // page links switch directly, then update the hash for bookmarking
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    var name=a.getAttribute('href').slice(1);
    if(a.closest('.toc')){
      a.addEventListener('click',function(e){e.preventDefault();var el=document.getElementById(name); if(el) el.scrollIntoView({behavior:smooth?'smooth':'auto'});});
      return;
    }
    if(pages.indexOf(name)<0) return;
    a.addEventListener('click',function(e){
      e.preventDefault(); show(name);
      try{history.pushState(null,'','#'+name)}catch(err){}
    });
  });
  menu.addEventListener('click',function(){var o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o?'true':'false')});

  // highlight the current section in the floating panel
  function spy(){
    var toc=document.querySelector('.toc[data-for="'+current+'"]'); if(!toc) return;
    var links=[].slice.call(toc.querySelectorAll('a')), best=links[0], y=window.innerHeight*0.35;
    links.forEach(function(a){var el=document.getElementById(a.getAttribute('href').slice(1)); if(el && !el.hidden && el.getBoundingClientRect().top<y) best=a;});
    links.forEach(function(a){a.classList.toggle('on',a===best)});
  }
  window.addEventListener('scroll',spy,{passive:true});

  // project filters
  document.querySelectorAll('.filters button').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.filters button').forEach(function(x){x.classList.toggle('on',x===b)});
      var f=b.dataset.f;
      document.querySelectorAll('.pcard').forEach(function(c){c.hidden=!(f==='all'||(' '+c.dataset.k+' ').indexOf(' '+f+' ')>=0)});
      spy();
    });
  });

  // EN/FR switch: any element with data-fr swaps its content
  var tr=[].slice.call(document.querySelectorAll('[data-fr]'));
  tr.forEach(function(e){e._en=e.innerHTML});
  var desc=document.querySelector('meta[name="description"]');
  var meta={en:{t:document.title,d:desc.content},fr:{t:document.body.dataset.titleFr||document.title,d:document.body.dataset.descFr||desc.content}};
  var btn=document.getElementById('lang');
  function setLang(lang){
    tr.forEach(function(e){e.innerHTML = lang==='fr' ? e.dataset.fr : e._en});
    document.querySelectorAll('[data-ph-fr]').forEach(function(e){e.placeholder = lang==='fr' ? e.dataset.phFr : e.dataset.phEn});
    document.documentElement.lang=lang;
    document.title=meta[lang].t; desc.content=meta[lang].d;
    btn.querySelectorAll('span').forEach(function(s){s.classList.toggle('on', s.dataset.l===lang)});
    try{localStorage.setItem('lang',lang)}catch(e){}
  }
  var saved=null; try{saved=localStorage.getItem('lang')}catch(e){}
  if(saved!=='fr' && saved!=='en') saved=null;
  var lang=saved || ((navigator.language||'').toLowerCase().indexOf('fr')===0 ? 'fr' : 'en');
  btn.addEventListener('click',function(){lang = lang==='fr' ? 'en' : 'fr'; setLang(lang); trackEvent('language-'+lang);});
  setLang(lang);

  // clicks worth knowing about: email, LinkedIn, GitHub code, certificate checks, feedback link
  document.addEventListener('click',function(e){
    var a=e.target.closest('a'); if(!a) return;
    var h=a.getAttribute('href')||'';
    if(h.indexOf('mailto:')===0) trackEvent('click-email');
    else if(h.indexOf('linkedin.com')>=0) trackEvent('click-linkedin');
    else if(h.indexOf('github.com')>=0) trackEvent('click-github'+(a.closest('.pcard')?'-'+a.closest('.pcard').id.replace('pr-',''):''));
    else if(a.classList.contains('verify')) trackEvent('verify-'+a.closest('.ccard').id.replace('c-',''));
    else if(h.indexOf('medium.com')>=0) trackEvent('click-medium');
    else if(h==='#feedback') trackEvent('open-feedback');
  });

  // time spent: counts only while the tab is visible
  var seen=0, marks={30:'time-30s',120:'time-2min',300:'time-5min'};
  setInterval(function(){ if(document.visibilityState!=='visible') return; seen++; if(marks[seen]) trackEvent(marks[seen]); },1000);

  // copy the email address
  var cp=document.getElementById('copy-mail');
  if(cp) cp.addEventListener('click',function(){
    var done=function(){ var t=cp.innerHTML; cp.textContent = lang==='fr' ? 'Copié' : 'Copied'; setTimeout(function(){cp.innerHTML=t},1600); trackEvent('copy-email'); };
    var fallback=function(){ var r=document.createRange(); r.selectNodeContents(cp.previousElementSibling); var s=getSelection(); s.removeAllRanges(); s.addRange(r); };
    try{ navigator.clipboard.writeText(cp.dataset.copy).then(done,fallback); }catch(err){ fallback(); }
  });

  // anonymous feedback, sent through Formspree (no name or email collected)
  var form=document.getElementById('fb-form');
  if(form){
    var msg=document.getElementById('fb-msg'), status=document.getElementById('fb-status'), send=document.getElementById('fb-send'), len=document.getElementById('fb-len');
    var say=function(en,fr,cls){ status.textContent = lang==='fr' ? fr : en; status.className='fb-status '+(cls||''); };
    msg.addEventListener('input',function(){ len.textContent=msg.value.length; });
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(document.getElementById('fb-hp').value) return;
      var text=msg.value.trim();
      if(text.length<5){ say('Please write a few words first.','Écrivez quelques mots d\'abord.','err'); msg.focus(); return; }
      if(!SETTINGS.formspree){ say('Feedback is not connected yet. Please use email or LinkedIn for now.','Les avis ne sont pas encore connectés. Utilisez l\'email ou LinkedIn pour le moment.','err'); return; }
      var role=(form.querySelector('input[name="role"]:checked')||{}).value||'not given';
      send.disabled=true; say('Sending…','Envoi…');
      fetch('https://formspree.io/f/'+SETTINGS.formspree,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({message:text, role:role, version:version, language:lang, _subject:'Anonymous portfolio feedback'})})
        .then(function(r){ if(!r.ok) throw new Error(r.status); form.reset(); len.textContent='0'; say('Thank you! Your feedback was sent anonymously.','Merci ! Votre avis a été envoyé anonymement.','ok'); trackEvent('feedback-sent'); })
        .catch(function(){ say('Sending failed. Please try again later, or write to me by email.','L\'envoi a échoué. Réessayez plus tard ou écrivez-moi par email.','err'); })
        .then(function(){ send.disabled=false; });
    });
  }

  // event carousels: arrows, dots, auto-advance; a video slide plays muted and advances when it ends
  document.querySelectorAll('.carousel').forEach(function(c){
    var slides=[].slice.call(c.querySelectorAll('.slide')), i=0, timer=null, hover=false;
    if(slides.length<2){ if(slides[0]) slides[0].classList.add('on'); c.querySelectorAll('.cbtn,.dots').forEach(function(e){e.hidden=true}); return; }
    var dots=c.querySelector('.dots');
    slides.forEach(function(_,k){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Slide '+(k+1));b.addEventListener('click',function(){go(k,true)});dots.appendChild(b);});
    function visible(){var r=c.getBoundingClientRect();return c.offsetParent!==null && r.bottom>0 && r.top<innerHeight;}
    function schedule(){
      clearTimeout(timer); if(!smooth) return;
      var v=slides[i].querySelector('video');
      if(v){ if(visible()&&!hover){v.currentTime=0; v.play().catch(function(){}); } return; }
      timer=setTimeout(function(){ if(!hover && visible()) go(i+1); else schedule(); },4500);
    }
    function go(k,user){
      slides[i].classList.remove('on'); var old=slides[i].querySelector('video'); if(old) old.pause();
      i=(k+slides.length)%slides.length; slides[i].classList.add('on');
      [].forEach.call(dots.children,function(d,n){d.classList.toggle('on',n===i)});
      schedule();
    }
    c.querySelector('.prev').addEventListener('click',function(){go(i-1,true)});
    c.querySelector('.next').addEventListener('click',function(){go(i+1,true)});
    c.addEventListener('mouseenter',function(){hover=true});
    c.addEventListener('mouseleave',function(){hover=false; schedule();});
    slides.forEach(function(s){var v=s.querySelector('video'); if(v) v.addEventListener('ended',function(){go(i+1)});});
    // keep a video slide in step with what the visitor can see
    if(smooth) setInterval(function(){
      var v=slides[i].querySelector('video'); if(!v) return;
      if(visible() && !hover){ if(v.paused && !v.ended) v.play().catch(function(){}); } else if(!v.paused && !hover) v.pause();
    },1500);
    go(0);
  });

  route();

  // hero: animated neural network
  var cv=document.getElementById('net'); if(!cv) return;
  var ctx=cv.getContext('2d'), reduce=!smooth;
  var layers=[4,6,6,3], nodes=[], edges=[], pulses=[], W=0, H=0;
  function build(){
    var r=cv.getBoundingClientRect(), d=window.devicePixelRatio||1;
    W=r.width; H=r.height; if(!W||!H) return;
    cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
    nodes=[]; edges=[];
    layers.forEach(function(n,li){
      var x=W*(0.14+0.72*li/(layers.length-1));
      for(var k=0;k<n;k++){nodes.push({x:x,y:H*(0.5+(k-(n-1)/2)*(0.7/Math.max(n,4))),l:li,ph:Math.random()*6.28});}
    });
    nodes.forEach(function(a,i){nodes.forEach(function(b,j){if(b.l===a.l+1) edges.push([i,j]);});});
  }
  var cols=['#2dd4bf','#fbbf24','#38bdf8','#a78bfa'];
  function frame(t){
    if(!W) build();
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='rgba(45,212,191,0.08)'; ctx.lineWidth=1;
    [0.46,0.36].forEach(function(s){ctx.beginPath();ctx.arc(W/2,H/2,W*s,0,6.283);ctx.stroke();});
    edges.forEach(function(e){var a=nodes[e[0]],b=nodes[e[1]];ctx.strokeStyle='rgba(147,161,173,0.13)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});
    if(!reduce && edges.length && Math.random()<0.18 && pulses.length<40){
      var cand=edges.filter(function(e){return nodes[e[0]].l===0});
      pulses.push({e:cand[Math.floor(Math.random()*cand.length)],p:0,c:cols[Math.floor(Math.random()*cols.length)]});
    }
    pulses=pulses.filter(function(p){
      p.p+=0.018; var a=nodes[p.e[0]],b=nodes[p.e[1]];
      if(p.p>=1){
        var nx=edges.filter(function(e){return e[0]===p.e[1]});
        if(!nx.length) return false;
        p.e=nx[Math.floor(Math.random()*nx.length)]; p.p=0; a=nodes[p.e[0]]; b=nodes[p.e[1]];
      }
      var x=a.x+(b.x-a.x)*p.p, y=a.y+(b.y-a.y)*p.p, q=Math.max(0,p.p-0.12);
      ctx.strokeStyle=p.c; ctx.globalAlpha=0.55; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(a.x+(b.x-a.x)*q, a.y+(b.y-a.y)*q); ctx.lineTo(x,y); ctx.stroke();
      ctx.globalAlpha=1; ctx.fillStyle=p.c; ctx.shadowColor=p.c; ctx.shadowBlur=12;
      ctx.beginPath(); ctx.arc(x,y,2.6,0,6.283); ctx.fill(); ctx.shadowBlur=0; ctx.lineWidth=1;
      return true;
    });
    nodes.forEach(function(n){
      var g=reduce?0.5:0.5+0.5*Math.sin(t/700+n.ph), r=n.l===layers.length-1?8:6;
      var c=n.l===layers.length-1?'#fbbf24':'#2dd4bf';
      ctx.fillStyle='#0c1015'; ctx.strokeStyle=c; ctx.lineWidth=1.6; ctx.shadowColor=c; ctx.shadowBlur=8+10*g;
      ctx.beginPath(); ctx.arc(n.x,n.y,r,0,6.283); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
      ctx.fillStyle=c; ctx.globalAlpha=0.35+0.5*g; ctx.beginPath(); ctx.arc(n.x,n.y,r*0.45,0,6.283); ctx.fill(); ctx.globalAlpha=1;
    });
    if(!reduce) requestAnimationFrame(frame);
  }
  build(); window.addEventListener('resize',function(){build(); if(reduce) frame(0);});
  requestAnimationFrame(frame);
})();
