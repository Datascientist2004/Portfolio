/* =========================================================
   HONEY CHAUHAN — PORTFOLIO v2 — Shared Script
   ========================================================= */

/* ---------- CONFIG ---------- */
const SUPABASE_URL='https://ikacxluybtrxpbdccrbj.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYWN4bHV5YnRyeHBiZGNjcmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODY3MjgsImV4cCI6MjEwMjU2MjcyOH0.iJddmf7KgadQPXoKilprSgG339j30FC7roO-8B5jPME';
const dbClient=(SUPABASE_URL.startsWith('YOUR_')||typeof supabase==='undefined')?null:supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const UPI_VPA='honeychauhan357@okicici';
const UPI_PAYEE='Honey Chauhan';
const DISCOUNT_CODE='INDEPENDENCE20';
const DISCOUNT_PCT=0.20;

/* ---------- NAV: mobile toggle + active link ---------- */
(function(){
  const btn=document.getElementById('navToggle'),links=document.getElementById('navLinks'),scrim=document.getElementById('mnavScrim');
  if(btn&&links){
    function close(){btn.classList.remove('open');links.classList.remove('open');if(scrim)scrim.classList.remove('open');document.body.style.overflow=''}
    function toggle(){
      const open=!links.classList.contains('open');
      btn.classList.toggle('open',open);links.classList.toggle('open',open);if(scrim)scrim.classList.toggle('open',open);
      document.body.style.overflow=open?'hidden':'';
    }
    btn.addEventListener('click',toggle);
    if(scrim)scrim.addEventListener('click',close);
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }
  const path=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.navlinks a[data-page]').forEach(a=>{
    if(a.getAttribute('href').split('#')[0]===path)a.classList.add('active');
  });
})();

/* ---------- SCROLL REVEAL ---------- */
(function(){
  const els=document.querySelectorAll('.rv');
  if(!els.length)return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}});
  },{threshold:.1});
  els.forEach(el=>io.observe(el));
})();

/* ---------- MARQUEE: duplicate track content for seamless loop ---------- */
(function(){
  document.querySelectorAll('.marquee-track').forEach(track=>{
    const original=track.innerHTML;
    track.innerHTML=original+original;
  });
})();

/* ---------- PAYMENT WIDGETS (supports multiple instances per page) ---------- */
(function(){
  function inr(n){return '₹'+Number(Math.round(n)).toLocaleString('en-IN')}

  document.querySelectorAll('.pay-widget').forEach(widget=>{
    const amtEl=widget.querySelector('.pw-amt'),codeEl=widget.querySelector('.pw-code'),noteEl=widget.querySelector('.pw-note');
    const qrEl=widget.querySelector('.pw-qr'),btnEl=widget.querySelector('.pw-btn'),msgEl=widget.querySelector('.pw-msg');
    const sumBox=widget.querySelector('.pw-summary'),sumReg=widget.querySelector('.pw-sum-reg'),sumDiscRow=widget.querySelector('.pw-sum-disc-row'),sumDisc=widget.querySelector('.pw-sum-disc'),sumTotal=widget.querySelector('.pw-sum-total');
    if(!amtEl||!qrEl||!btnEl)return;

    function codeState(){
      const raw=(codeEl?codeEl.value:'').trim();
      if(!raw)return 'empty';
      return raw.toUpperCase()===DISCOUNT_CODE ? 'valid':'invalid';
    }
    function finalAmount(reg){return codeState()==='valid'?Math.round(reg*(1-DISCOUNT_PCT)):reg}
    function buildUpi(amount){
      let p='pa='+encodeURIComponent(UPI_VPA)+'&pn='+encodeURIComponent(UPI_PAYEE)+'&cu=INR';
      if(amount>0)p+='&am='+encodeURIComponent(amount);
      const note=(noteEl?noteEl.value.trim():'')||widget.dataset.serviceName||'Project payment';
      p+='&tn='+encodeURIComponent(note);
      return 'upi://pay?'+p;
    }
    function update(){
      const regular=parseFloat(amtEl.value)||0;
      const state=codeState();
      if(msgEl){
        if(state==='empty'){msgEl.textContent=regular>0?'💡 Have a code? Unlock 20% off above.':'';msgEl.className='pw-msg hint'}
        else if(state==='valid'){msgEl.textContent='✅ '+DISCOUNT_CODE+' applied — 20% off!';msgEl.className='pw-msg valid'}
        else{msgEl.textContent='❌ Invalid code — full price applies.';msgEl.className='pw-msg invalid'}
      }
      const amount=finalAmount(regular);
      if(sumBox&&regular>0){
        sumBox.classList.add('show');
        if(sumReg)sumReg.textContent=inr(regular);
        if(state==='valid'){if(sumDiscRow)sumDiscRow.classList.add('show');if(sumDisc)sumDisc.textContent='−'+inr(regular-amount)}
        else{if(sumDiscRow)sumDiscRow.classList.remove('show')}
        if(sumTotal)sumTotal.textContent=inr(amount);
      }else if(sumBox){sumBox.classList.remove('show')}
      const upi=buildUpi(amount);
      qrEl.src='https://api.qrserver.com/v1/create-qr-code/?size=170x170&data='+encodeURIComponent(upi);
      btnEl.href=upi;
      btnEl.textContent=amount>0?('📱 Pay '+inr(amount)+' via UPI'):'📱 Pay via UPI App';
    }
    amtEl.addEventListener('input',update);
    if(codeEl)codeEl.addEventListener('input',update);
    if(noteEl)noteEl.addEventListener('input',update);
    update();
  });

  document.querySelectorAll('.pw-copy-vpa').forEach(btn=>{
    btn.addEventListener('click',()=>{
      navigator.clipboard.writeText(UPI_VPA).then(()=>{
        const orig=btn.textContent;btn.textContent='Copied!';setTimeout(()=>btn.textContent=orig,1500);
      });
    });
  });
})();

/* ---------- CONTACT FORM ---------- */
(function(){
  const form=document.getElementById('contactForm');
  if(!form)return;
  const fn=document.getElementById('cfName'),fe=document.getElementById('cfEmail'),fs=document.getElementById('cfService'),fm=document.getElementById('cfMessage');
  const status=document.getElementById('cfStatus'),hp=document.getElementById('cfWebsite'),btn=document.getElementById('cfSubmit');
  const fmCount=document.getElementById('cfCount');
  if(fm&&fmCount)fm.addEventListener('input',()=>{fmCount.textContent=fm.value.length+'/500'});

  function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    if(hp&&hp.value.trim())return;
    const n=fn.value.trim(),em=fe.value.trim(),s=fs?fs.value:'',m=fm.value.trim();
    let ok=true;
    if(!n){fn.style.borderColor='var(--c3)';ok=false} else fn.style.borderColor='';
    if(!validEmail(em)){fe.style.borderColor='var(--c3)';ok=false} else fe.style.borderColor='';
    if(!ok){status.textContent='Please fill in your name and a valid email.';status.style.color='var(--c3)';return}

    btn.disabled=true;btn.textContent='Sending...';
    if(dbClient){
      try{
        const{error}=await dbClient.from('contacts').insert([{name:n,email:em,service:s,message:m}]);
        if(error)throw error;
        status.style.color='var(--c5)';status.textContent="Message received! I'll reply within 24 hours. ✅";
        form.reset();if(fmCount)fmCount.textContent='0/500';
      }catch(err){
        status.style.color='var(--c3)';status.textContent='Something went wrong — please try WhatsApp or email instead.';
        console.error(err);
      }
    }else{
      status.style.color='var(--c5)';status.textContent='Opening your email app... ✅';
      window.location.href='mailto:honeychauhan357@gmail.com?subject=Project Inquiry from '+encodeURIComponent(n)+'&body=Name: '+encodeURIComponent(n)+'%0AEmail: '+encodeURIComponent(em)+'%0AService: '+encodeURIComponent(s)+'%0A%0A'+encodeURIComponent(m);
    }
    btn.disabled=false;btn.textContent='Send Message ✉️';
    setTimeout(()=>{status.textContent=''},6000);
  });
})();

/* ---------- FEEDBACK FORM ---------- */
(function(){
  const form=document.getElementById('feedbackForm');
  if(!form)return;
  const fn=document.getElementById('fbName'),fr=document.getElementById('fbRole'),fm=document.getElementById('fbMsg');
  const status=document.getElementById('fbStatus'),hp=document.getElementById('fbWebsite'),btn=document.getElementById('fbSubmit');
  let rating=0;
  const stars=document.querySelectorAll('.fb-star');
  stars.forEach(s=>s.addEventListener('click',()=>{
    rating=parseInt(s.dataset.v);
    stars.forEach(x=>x.classList.toggle('on',parseInt(x.dataset.v)<=rating));
  }));

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    if(hp&&hp.value.trim())return;
    const n=fn.value.trim(),r=fr.value.trim(),m=fm.value.trim();
    if(!n||!rating||!m){status.style.color='var(--c3)';status.textContent='Please add your name, a rating, and a quick note.';return}
    btn.disabled=true;btn.textContent='Sending...';
    if(dbClient){
      try{
        const{error}=await dbClient.from('feedback').insert([{name:n,role:r,rating,message:m}]);
        if(error)throw error;
        status.style.color='var(--c5)';status.textContent='Thank you! Your feedback means a lot. ✅';
        form.reset();rating=0;stars.forEach(x=>x.classList.remove('on'));
      }catch(err){status.style.color='var(--c3)';status.textContent='Something went wrong — please try again.';console.error(err)}
    }else{
      status.style.color='var(--c5)';status.textContent='Thank you! Opening your email app... ✅';
      const starsTxt='★'.repeat(rating)+'☆'.repeat(5-rating);
      window.location.href='mailto:honeychauhan357@gmail.com?subject=Client Feedback ('+rating+'/5)&body=Name: '+encodeURIComponent(n)+'%0ARole: '+encodeURIComponent(r)+'%0ARating: '+encodeURIComponent(starsTxt)+'%0A%0A'+encodeURIComponent(m);
    }
    btn.disabled=false;btn.textContent='Send Feedback ⭐';
    setTimeout(()=>{status.textContent=''},6000);
  });
})();

/* ---------- FAQ ACCORDION ---------- */
(function(){
  document.querySelectorAll('.faq-q').forEach(q=>{
    q.addEventListener('click',()=>{
      const item=q.closest('.faq-item');
      const wasOpen=item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('open'));
      if(!wasOpen)item.classList.add('open');
    });
  });
})();
