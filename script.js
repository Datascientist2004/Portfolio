/* =============================================================
   Honey Chauhan — portfolio v3
   EVERYTHING YOU MAY WANT TO CHANGE IS IN THIS CONFIG BLOCK.
   ============================================================= */
const CONFIG = {
  // Supabase → Settings → API Keys. Paste the URL and the PUBLISHABLE key
  // (starts with sb_publishable_) or the legacy "anon" key (starts with eyJ).
  // Never paste the secret key here.
  supabaseUrl: 'https://ikacxluybtrxpbdccrbj.supabase.co',
  supabaseKey: 'sb_publishable_YtUFao94h85Pw-I8Q3uTkQ_oK_8IR4M',

  upiId: 'honeychauhan357@okicici',
  upiName: 'Honey Chauhan',
  whatsapp: '918595857226',

  // Discount shown on the site and applied ONLY when the client types the code.
  // To end the offer automatically, set endsOn to a date like '2026-10-31'.
  // To switch it off right now, set enabled to false.
  offer: {
    enabled: true,
    name: 'Independence Day offer',
    code: 'INDEPENDENCE20',
    percent: 20,
    endsOn: ''
  }
};

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const waLink = text => 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);

function offerActive() {
  const o = CONFIG.offer;
  if (!o || !o.enabled || !o.code) return false;
  if (o.endsOn) {
    const end = new Date(o.endsOn + 'T23:59:59');
    if (!isNaN(end) && Date.now() > end.getTime()) return false;
  }
  return true;
}

/* Supabase REST without the supabase-js library.
   Cleans the URL so a pasted '/rest/v1' or trailing slash can't break requests. */
const DB = (() => {
  const raw = (CONFIG.supabaseUrl || '').trim();
  const key = (CONFIG.supabaseKey || '').trim();
  const base = raw.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '').replace(/\/+$/, '');
  const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) && key.length > 20 && !key.startsWith('sb_secret');
  function headers(extra) {
    const h = { apikey: key, 'Content-Type': 'application/json' };
    if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key; // legacy JWT anon key
    return Object.assign(h, extra || {});
  }
  async function insert(table, row) {
    if (!ready) throw new Error('Database is not configured in script.js');
    const res = await fetch(base + '/rest/v1/' + table, {
      method: 'POST', headers: headers({ Prefer: 'return=minimal' }), body: JSON.stringify(row)
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (e) {}
      if (res.status === 401) detail = 'Invalid API key — check supabaseKey in script.js. ' + detail;
      if (res.status === 404) detail = 'Table "' + table + '" not found — run the SQL setup. ' + detail;
      throw new Error('Supabase ' + res.status + ': ' + detail);
    }
  }
  async function select(path) {
    if (!ready) return [];
    const res = await fetch(base + '/rest/v1/' + path, { headers: headers() });
    if (!res.ok) return [];
    return res.json();
  }
  return { ready, insert, select };
})();

/* ---------- navigation ---------- */
(function () {
  const btn = $('#navToggle'), menu = $('#navLinks'), scrim = $('#navScrim');
  if (!btn || !menu) return;
  const set = open => {
    btn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    if (scrim) scrim.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  if (scrim) scrim.addEventListener('click', () => set(false));
  $$('a', menu).forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  window.addEventListener('resize', () => { if (innerWidth > 900) set(false); });
})();

/* ---------- offer text everywhere ---------- */
(function () {
  const active = offerActive(), o = CONFIG.offer;
  $$('[data-offer]').forEach(el => { el.hidden = !active; });
  $$('[data-offer-name]').forEach(el => { el.textContent = o.name; });
  $$('[data-offer-code]').forEach(el => { el.textContent = o.code; });
  $$('[data-offer-percent]').forEach(el => { el.textContent = o.percent + '%'; });

  // service prices: regular price always shown, discounted price only while the offer runs
  $$('[data-price-from]').forEach(el => {
    const from = +el.dataset.priceFrom, to = +el.dataset.priceTo || 0, unit = el.dataset.unit || '';
    const fmt = (a, b) => (b ? inr(a) + ' – ' + inr(b) : 'From ' + inr(a)) + unit;
    const priceEl = $('.price', el), codeEl = $('.with-code', el);
    if (priceEl) priceEl.textContent = fmt(from, to);
    if (codeEl) {
      if (active) {
        const f = 1 - o.percent / 100;
        codeEl.innerHTML = '';
        codeEl.append(fmt(from * f, to * f) + ' with code ');
        const c = document.createElement('span'); c.className = 'code'; c.textContent = o.code;
        codeEl.append(c);
        codeEl.hidden = false;
      } else codeEl.hidden = true;
    }
  });
})();

/* ---------- marquees (right to left) ---------- */
function startMarquee(el) {
  const track = $('.marquee-track', el);
  if (!track || !track.children.length) return;
  if (!track.dataset.cloned) {
    [...track.children].forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; $$('a', c).forEach(a => a.tabIndex = -1); track.appendChild(c); });
    track.dataset.cloned = '1';
  }
  el.classList.add('is-running');
}
$$('.marquee[data-auto]').forEach(startMarquee);

/* ---------- testimonials: only approved, real feedback from the database ---------- */
(function () {
  const holder = $('#testimonials');
  if (!holder) return;
  DB.select('feedback?select=name,role,rating,message&approved=is.true&order=created_at.desc&limit=12')
    .then(rows => {
      if (!Array.isArray(rows) || !rows.length) return; // keep the honest empty state
      const wrap = document.createElement('div'); wrap.className = 'marquee'; wrap.style.setProperty('--speed', Math.max(30, rows.length * 12) + 's');
      const track = document.createElement('div'); track.className = 'marquee-track';
      rows.forEach(r => {
        const fig = document.createElement('figure'); fig.className = 'quote';
        const stars = document.createElement('div'); stars.className = 'stars';
        const n = Math.max(1, Math.min(5, +r.rating || 5));
        stars.textContent = '★'.repeat(n) + '☆'.repeat(5 - n); stars.setAttribute('aria-label', n + ' out of 5');
        const q = document.createElement('blockquote'); q.textContent = r.message || '';
        const cap = document.createElement('figcaption');
        const b = document.createElement('b'); b.textContent = r.name || 'Client';
        cap.append(b); if (r.role) cap.append(r.role);
        fig.append(stars, q, cap); track.append(fig);
      });
      wrap.append(track); holder.replaceChildren(wrap); startMarquee(wrap);
    }).catch(() => {});
})();

/* ---------- payment widgets (one per service) ---------- */
(function () {
  $$('.pay').forEach(box => {
    const amt = $('.pay-amt', box), code = $('.pay-code', box), hint = $('.pay-hint', box);
    const sReg = $('.sum-reg', box), sDisc = $('.sum-disc', box), sDiscRow = $('.disc', box), sTot = $('.sum-total', box);
    const qr = $('.pay-qr img', box), btn = $('.pay-go', box), service = box.dataset.service || 'Project advance';
    if (!amt || !btn) return;
    let qrTimer;
    function update() {
      const regular = Math.max(0, Math.min(10000000, parseFloat(amt.value) || 0));
      const typed = (code.value || '').trim();
      const valid = offerActive() && typed && typed.toUpperCase() === CONFIG.offer.code.toUpperCase();
      if (!typed) { hint.textContent = offerActive() ? 'Have a code? Enter it to get ' + CONFIG.offer.percent + '% off.' : 'Leave blank if you don\u2019t have a code.'; hint.className = 'hint pay-hint'; }
      else if (valid) { hint.textContent = CONFIG.offer.code + ' applied — ' + CONFIG.offer.percent + '% off.'; hint.className = 'hint pay-hint ok'; }
      else { hint.textContent = 'This code isn\u2019t valid. The regular price applies.'; hint.className = 'hint pay-hint err'; }
      const total = valid ? Math.round(regular * (1 - CONFIG.offer.percent / 100)) : Math.round(regular);
      sReg.textContent = inr(regular);
      sDiscRow.hidden = !valid;
      sDisc.textContent = '−' + inr(regular - total);
      sTot.textContent = inr(total);
      let upi = 'upi://pay?pa=' + encodeURIComponent(CONFIG.upiId) + '&pn=' + encodeURIComponent(CONFIG.upiName) + '&cu=INR&tn=' + encodeURIComponent(service + (valid ? ' (' + CONFIG.offer.code + ')' : ''));
      if (total > 0) upi += '&am=' + total;
      btn.href = upi;
      btn.textContent = total > 0 ? 'Pay ' + inr(total) + ' with UPI' : 'Pay with UPI';
      clearTimeout(qrTimer);
      qrTimer = setTimeout(() => { qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=' + encodeURIComponent(upi); }, 250);
    }
    amt.addEventListener('input', update); code.addEventListener('input', update);
    box.addEventListener('toggle', () => { if (box.open) update(); });
    update();
  });
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const txt = b.dataset.copy === 'upi' ? CONFIG.upiId : b.dataset.copy;
    navigator.clipboard.writeText(txt).then(() => { const o = b.textContent; b.textContent = 'Copied'; setTimeout(() => b.textContent = o, 1400); });
  }));
  $$('[data-upi-id]').forEach(el => el.textContent = CONFIG.upiId);
})();

/* ---------- forms ---------- */
function fallbackToWhatsApp(statusEl, text, reason) {
  statusEl.className = 'form-status err';
  statusEl.textContent = reason + ' ';
  const a = document.createElement('a'); a.href = waLink(text); a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.textContent = 'Send it on WhatsApp instead';
  statusEl.append(a);
}
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
function mark(el, bad) { el.closest('.field').classList.toggle('invalid', bad); }

(function () {
  const form = $('#contactForm'); if (!form) return;
  const f = { name: $('#cName'), email: $('#cEmail'), service: $('#cService'), message: $('#cMessage') };
  const status = $('#cStatus'), btn = $('#cSubmit'), count = $('#cCount');
  f.message.addEventListener('input', () => count.textContent = f.message.value.length + '/1000');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if ($('#cWebsite').value) return; // bot
    const row = { name: f.name.value.trim(), email: f.email.value.trim(), service: f.service.value.trim(), message: f.message.value.trim() };
    mark(f.name, !row.name); mark(f.email, !validEmail(row.email)); mark(f.message, !row.message);
    if (!row.name || !validEmail(row.email) || !row.message) { status.className = 'form-status err'; status.textContent = 'Add your name, a valid email and a short message.'; return; }
    const text = 'Hi Honey, I\u2019m ' + row.name + ' (' + row.email + ').\nNeed: ' + (row.service || '-') + '\n' + row.message;
    btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = '';
    try {
      await DB.insert('contacts', row);
      form.reset(); count.textContent = '0/1000';
      status.className = 'form-status ok'; status.textContent = 'Message sent. I reply within 24 hours.';
    } catch (err) {
      console.error(err);
      fallbackToWhatsApp(status, text, 'Your message couldn\u2019t be saved.');
    }
    btn.disabled = false; btn.textContent = 'Send message';
  });
})();

(function () {
  const form = $('#feedbackForm'); if (!form) return;
  const name = $('#fName'), role = $('#fRole'), msg = $('#fMessage'), status = $('#fStatus'), btn = $('#fSubmit');
  let rating = 0;
  const stars = $$('.stars-input button', form);
  const paint = n => stars.forEach(s => { const on = +s.dataset.v <= n; s.classList.toggle('on', on); s.setAttribute('aria-pressed', String(+s.dataset.v === n)); });
  stars.forEach(s => s.addEventListener('click', () => { rating = +s.dataset.v; paint(rating); }));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if ($('#fWebsite').value) return;
    const row = { name: name.value.trim(), role: role.value.trim(), rating, message: msg.value.trim() };
    mark(name, !row.name); mark(msg, !row.message);
    if (!row.name || !row.message || !rating) { status.className = 'form-status err'; status.textContent = 'Add your name, a star rating and a few words.'; return; }
    btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = '';
    try {
      await DB.insert('feedback', row);
      form.reset(); rating = 0; paint(0);
      status.className = 'form-status ok'; status.textContent = 'Thank you — your feedback was received.';
    } catch (err) {
      console.error(err);
      fallbackToWhatsApp(status, 'Feedback from ' + row.name + ' (' + rating + '/5): ' + row.message, 'Your feedback couldn\u2019t be saved.');
    }
    btn.disabled = false; btn.textContent = 'Send feedback';
  });
})();

/* current year in footer */
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
