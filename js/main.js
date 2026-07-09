/* === GÜVENLİK: HTML escape + allowlist ===
   Ban listesi bot log'undan gelir; oyuncu adları güvenilmez veri.
   İnnerHTML'e basmadan önce her user-supplied değer buradan geçer. */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const ALLOWED_BAN_TYPES  = new Set(['ban', 'unban', 'kick', 'mute', 'unmute', 'gag', 'ungag']);
const ALLOWED_SERVERS    = new Set(['awp', 'aim', 'redline']);
const ALLOWED_DUR_CLASS  = new Set(['perm', 'long', 'short', 'temp']);
const safeType   = t => ALLOWED_BAN_TYPES.has(t) ? t : 'ban';
const safeServer = s => ALLOWED_SERVERS.has(s)   ? s : '';
const safeDurCls = c => ALLOWED_DUR_CLASS.has(c) ? c : 'perm';

/* === LAVA PARTICLES === */
function initLavaParticles() {
  const bg = document.querySelector('.lava-bg');
  if (!bg) return;
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'lava-particle';
    const size = 200 + Math.random() * 300;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%; top:${Math.random()*100}%;
      --dur:${6 + Math.random()*8}s;
      --delay:${Math.random()*6}s;
      transform:translate(-50%,-50%);
    `;
    bg.appendChild(p);
  }
}

/* === NAVBAR BURGER === */
function initBurger() {
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');
  if (!burger || !links) return;
  burger.addEventListener('click', () => links.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !links.contains(e.target))
      links.classList.remove('open');
  });
}

/* === ACTIVE NAV LINK === */
function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

/* === COPY SERVER IP ===
   Hem kopyala butonu hem de IP kutusunun tamamı tıklanınca kopyalar.
   Metin ayrıca fareyle seçilebilir. */
function copyText(text, feedbackEl) {
  const done = () => {
    if (feedbackEl) {
      feedbackEl.classList.add('copied');
      const orig = feedbackEl.dataset.orig || feedbackEl.textContent;
      feedbackEl.dataset.orig = orig;
      setTimeout(() => feedbackEl.classList.remove('copied'), 1400);
    }
    if (window.showToast) window.showToast('Panoya kopyalandı', 'check');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  if (cb) cb();
}

function initCopyBtns() {
  // kopyalama butonları
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const ip = btn.dataset.ip;
      copyText(ip, btn);
      const orig = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = orig; }, 1400);
    });
  });

  // IP kutusunun tamamına tıklayınca da kopyalar
  document.querySelectorAll('.server-ip').forEach(box => {
    const textEl = box.querySelector('.server-ip-text');
    box.style.cursor = 'pointer';
    box.title = 'Kopyalamak için tıkla';
    box.addEventListener('click', e => {
      // metin seçiliyse kopyalama tetikleme, seçime izin ver
      if (window.getSelection && window.getSelection().toString().length > 0) return;
      if (e.target.closest('.copy-btn')) return;
      const ip = textEl ? textEl.textContent.trim() : '';
      if (!ip) return;
      copyText(ip, box);
      if (textEl) {
        const orig = textEl.textContent;
        textEl.textContent = 'Kopyalandı ✓';
        setTimeout(() => { textEl.textContent = orig; }, 1200);
      }
    });
  });
}

/* === CLICK-TO-CONNECT (steam://) ===
   Only the CONNECT button triggers connect.
   The IP box / copy button never connect. */
function initServerConnect() {
  document.querySelectorAll('[data-connect]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ip = btn.dataset.connect;
      if (!ip) return;
      window.location.href = 'steam://connect/' + ip;
    });
  });
}

/* === AUTHORITY PERIOD TOGGLE === */
function initPeriodToggle() {
  const btns   = document.querySelectorAll('.period-btn');
  const prices = document.querySelectorAll('.auth-price');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const period = btn.dataset.period;
      prices.forEach(p => {
        const amount = period === '30' ? p.dataset.price30 : p.dataset.price90;
        const per    = period === '30' ? '/ 30 gün' : '/ 90 gün';
        p.querySelector('.price-amount').textContent = amount + '₺';
        p.querySelector('.price-period').textContent = per;
      });
    });
  });
}

/* === BAN LIST (Discord log kanalından) === */
const BANS_PER_PAGE = 50;
let BAN_DATA = [];
let BAN_FILTER = { type: 'all', servers: new Set(['awp','aim','redline']), search: '' };
let BAN_PAGE = 1;

/* Karakursun tarzı: gag/mute ceza türlerinin "un" versiyonu artı işareti taşır */
const BAN_ICONS = {
  ban:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6"/><line x1="4.5" y1="4.5" x2="19.5" y2="19.5"/></svg>',
  unban:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6"/><line x1="16" y1="4" x2="22" y2="4"/><line x1="19" y1="1" x2="19" y2="7"/></svg>',
  kick:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5l7 7-7 7"/><path d="M3 12h18"/></svg>',
  mute:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="16" y1="12" x2="22" y2="12"/></svg>',
  unmute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="19" y1="9" x2="19" y2="15"/><line x1="16" y1="12" x2="22" y2="12"/></svg>',
  gag:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  ungag:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
};

const SRV_TAG = {
  awp:     { cls: 'srv-awp', label: 'AWP Lego' },
  aim:     { cls: 'srv-aim', label: 'AIM Pistol' },
  redline: { cls: 'srv-redline', label: 'AIM Redline' },
};

/* === YETKİLİ → YETKİ HARİTASI (sunucu bazlı) ===
   Bir yetkili birden çok sunucuda farklı yetkiye sahip olabilir.
   Yapı:
     'admin_adi': {
       all:     { ... }  // tüm sunucularda geçerli (kurucular vs.)
       awp:     { ... }  // sadece AWP'de bu yetki
       aim:     { ... }  // sadece AIM Pistol'da
       redline: { ... }  // sadece Redline'da
     }
   Bir sunucuda yetki tanımlı değilse "—" gösterilir. */
const ADMIN_ROLES = {
  // Kurucular — her sunucuda aynı
  'oflaz': { all: { cls: 'auth-boss', label: 'Boss of MAD?' } },
  'hoid':  { all: { cls: 'auth-boss', label: 'Boss of MAD?' } },

  // Sunucu Sorumluları — her sunucuda MAD? yetkisi
  'neyzenim':      { all: { cls: 'auth-mad', label: 'MAD?' } },
  'thomas':        { all: { cls: 'auth-mad', label: 'MAD?' } },
  'chrysanthemum': { all: { cls: 'auth-mad', label: 'MAD?' } },

  // Diğerleri (kurucudan tam liste geldiğinde eklenecek) — örnekler:
  // 'nick\'s pizza': { all: { cls: 'auth-mod', label: 'Moderatör' } },
  // 'erobaba': {
  //   awp: { cls: 'auth-awp-yet', label: 'AWP Yetkili' },
  //   aim: { cls: 'auth-pistol-yet', label: 'Pistol Yetkili' },
  // },
};

function guessAdminRole(name, server) {
  const n = (name || '').toLowerCase().trim();
  const rec = ADMIN_ROLES[n];
  if (!rec) return { cls: 'auth-yonetim', label: '—' };
  // Sunucuya özel varsa onu döndür, yoksa 'all' fallback, o da yoksa "—"
  return rec[server] || rec.all || { cls: 'auth-yonetim', label: '—' };
}

async function loadBans() {
  const tbody = document.getElementById('ban-tbody');
  if (!tbody) return;
  try {
    const res = await fetch('data/bans.json');
    if (!res.ok) throw new Error('bans.json okunamadı');
    const data = await res.json();
    BAN_DATA = data.events || [];
    updateBanStats(data);
    renderBans();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#f87171;">Yasaklama verisi yüklenemedi.</td></tr>';
    console.error(err);
  }
}

function updateBanStats(data) {
  const events = data.events || [];
  const cnt = { ban:0, kick:0, mute:0, awp:0, aim:0, redline:0 };
  const adminCnt = {};
  events.forEach(e => {
    if (e.type === 'ban') cnt.ban++;
    else if (e.type === 'kick') cnt.kick++;
    else if (e.type === 'mute' || e.type === 'gag') cnt.mute++;  // sesli+chat susturmaları
    if (cnt[e.server] !== undefined) cnt[e.server]++;
    if (e.type === 'ban' && e.admin && e.admin !== '—') {
      adminCnt[e.admin] = (adminCnt[e.admin] || 0) + 1;
    }
  });
  const fmt = n => n.toLocaleString('tr-TR');
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
  set('stat-total', events.length);
  set('stat-bans', cnt.ban);
  set('stat-kicks', cnt.kick);
  set('stat-mutes', cnt.mute);
  set('stat-srv-awp', cnt.awp);
  set('stat-srv-aim', cnt.aim);
  set('stat-srv-redline', cnt.redline);

  // Top 5 yetkili
  const adminEl = document.getElementById('admin-stats');
  if (adminEl) {
    const top = Object.entries(adminCnt).sort((a,b) => b[1] - a[1]).slice(0, 5);
    adminEl.innerHTML = top.map(([name, n]) => `
      <div class="admin-stat-item">
        <div class="admin-stat-name" title="${esc(name)}">${esc(name)}</div>
        <div class="admin-stat-count">${fmt(n)} ban</div>
      </div>
    `).join('') || '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);font-size:0.8rem;">Veri yok</div>';
  }
}

/* Ban tab filtresi: her tab, ait olduğu tür ailesini gösterir.
   Örn: "Susturmalar" tab'ı hem mute+gag hem de un-türevlerini kapsar. */
const TYPE_FAMILY = {
  ban:  new Set(['ban', 'unban']),
  kick: new Set(['kick']),
  mute: new Set(['mute', 'unmute', 'gag', 'ungag']),
};

function filteredBans() {
  const q = BAN_FILTER.search;
  return BAN_DATA.filter(e => {
    if (BAN_FILTER.type !== 'all') {
      const fam = TYPE_FAMILY[BAN_FILTER.type];
      if (!fam || !fam.has(e.type)) return false;
    }
    if (!BAN_FILTER.servers.has(e.server)) return false;
    if (q && !(e.player + ' ' + e.admin).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderBans() {
  const tbody = document.getElementById('ban-tbody');
  if (!tbody) return;
  const list = filteredBans();
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / BANS_PER_PAGE));
  if (BAN_PAGE > totalPages) BAN_PAGE = totalPages;
  const start = (BAN_PAGE - 1) * BANS_PER_PAGE;
  const page = list.slice(start, start + BANS_PER_PAGE);

  if (!page.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-muted);">Filtreye uygun kayıt yok.</td></tr>';
  } else {
    tbody.innerHTML = page.map(e => {
      // İkon tipini action alanından yakala (bot bazen type=mute, action=GAG gönderiyor)
      const rawAction = (e.action || '').toLowerCase().trim();
      const detected = ALLOWED_BAN_TYPES.has(rawAction) ? rawAction : safeType(e.type);
      const type = detected;
      const server = safeServer(e.server);
      const icon = BAN_ICONS[type] || BAN_ICONS.ban;
      const iconClass = type;  // CSS: .ban-type-icon.<type>, .action-badge.action-<type>
      const srv = SRV_TAG[server] || { cls: '', label: '' };
      const dt = e.ts ? new Date(e.ts).toLocaleDateString('tr-TR') : '';
      const actionText = e.action || type.toUpperCase();

      // Anlık aksiyonlar (kick, un-türevleri) süre taşımaz
      const INSTANT = new Set(['kick', 'unban', 'unmute', 'ungag']);
      let durCell = '<span style="color:var(--text-dim);">—</span>';
      if (!INSTANT.has(type)) {
        const durClass = safeDurCls(e.durationClass);
        durCell = `<span class="duration-badge ${durClass}">${esc(e.duration || 'Kalıcı')}</span>`;
      }

      return `<tr data-type="${type}" data-srv="${server}">
        <td><div class="ban-type-icon ${iconClass}">${icon}</div></td>
        <td><span class="ban-player-name" title="${esc(e.playerSteamId)}">${esc(e.player)}</span><br><span style="font-size:0.7rem;color:var(--text-dim)">${esc(dt)}</span></td>
        <td><span class="action-badge action-${type}">${esc(actionText)}</span></td>
        <td>${durCell}</td>
        <td style="color:var(--text);">${esc(e.admin)}</td>
        <td><span class="srv-tag ${srv.cls}">${esc(srv.label)}</span></td>
      </tr>`;
    }).join('');
  }

  // Pagination
  const pagEl = document.getElementById('ban-pagination');
  if (pagEl) {
    const pages = [];
    const win = 2;
    const push = p => pages.push(p);
    push(1);
    for (let p = Math.max(2, BAN_PAGE - win); p <= Math.min(totalPages - 1, BAN_PAGE + win); p++) push(p);
    if (totalPages > 1) push(totalPages);
    const uniqPages = [...new Set(pages)];
    let html = `<button class="pag-btn" data-p="${Math.max(1, BAN_PAGE - 1)}" ${BAN_PAGE === 1 ? 'disabled' : ''}>‹</button>`;
    let last = 0;
    uniqPages.forEach(p => {
      if (p - last > 1) html += '<span class="pag-dots">…</span>';
      html += `<button class="pag-btn ${p === BAN_PAGE ? 'active' : ''}" data-p="${p}">${p}</button>`;
      last = p;
    });
    html += `<button class="pag-btn" data-p="${Math.min(totalPages, BAN_PAGE + 1)}" ${BAN_PAGE === totalPages ? 'disabled' : ''}>›</button>`;
    pagEl.innerHTML = html;
    pagEl.querySelectorAll('.pag-btn').forEach(b => {
      b.addEventListener('click', () => {
        const p = parseInt(b.dataset.p, 10);
        if (isNaN(p) || p === BAN_PAGE) return;
        BAN_PAGE = p;
        renderBans();
        document.querySelector('.ban-table-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }
  const shownEl = document.getElementById('ban-shown-count');
  if (shownEl) shownEl.textContent = `${total.toLocaleString('tr-TR')} / ${BAN_DATA.length.toLocaleString('tr-TR')}`;
}

/* === BAN TABS === */
function initBanTabs() {
  const tabs = document.querySelectorAll('.ban-tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      BAN_FILTER.type = tab.dataset.type;
      BAN_PAGE = 1;
      if (BAN_DATA.length) renderBans();
    });
  });
}

/* === BAN SEARCH === */
function initBanSearch() {
  const input = document.getElementById('banSearchInput');
  if (!input) return;
  let deb;
  input.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(() => {
      BAN_FILTER.search = input.value.toLowerCase().trim();
      BAN_PAGE = 1;
      if (BAN_DATA.length) renderBans();
    }, 250);
  });
}

/* === SKIN FILTER === */
function initSkinFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      document.querySelectorAll('.skin-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
      });
    });
  });
}

/* === TOAST BİLDİRİM === */
window.showToast = function(msg, icon) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast';
  const iconSvg = icon === 'check'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  el.innerHTML = iconSvg + '<span>' + esc(msg) + '</span>';
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 2400);
};

/* === SERVER SELECT (ÇOKLU) — liderlik & yasaklama === */
function initServerSelect() {
  document.querySelectorAll('.srv-select').forEach(group => {
    const btns = group.querySelectorAll('.srv-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        // en az bir sunucu aktif kalsın
        const anyActive = [...btns].some(b => b.classList.contains('active'));
        if (!anyActive) btn.classList.add('active');
        applyServerFilter();
      });
    });
    // sayfa açılışında hepsi aktif
    btns.forEach(b => b.classList.add('active'));
    applyServerFilter();
  });
}

function applyServerFilter() {
  const activeSrvs = new Set(
    [...document.querySelectorAll('.srv-select .srv-btn.active')].map(b => b.dataset.srv)
  );
  BAN_FILTER.servers = activeSrvs;
  BAN_PAGE = 1;
  if (BAN_DATA && BAN_DATA.length) renderBans();
}

/* === DISCORD CANLI ÜYE SAYISI ===
   Not: Widget ancak Discord Sunucusu > Ayarlar > Widget > "Sunucu Widget'ını Etkinleştir"
   açık olduğunda çalışır. Kapalıysa fallback metin ("Discord'a katıl") kalır. */
function initDiscordWidget() {
  const el = document.getElementById('discord-count');
  if (!el) return;
  const GUILD_ID = '1441747151649505374';  // MAD Discord
  fetch(`https://discord.com/api/guilds/${GUILD_ID}/widget.json`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d || d.code) return;  // widget kapalıysa sessizce çık
      const online = d.presence_count || (d.members || []).length || 0;
      el.textContent = `${online.toLocaleString('tr-TR')} kişi çevrimiçi`;
    })
    .catch(() => {});
}

/* === SUNUCU CANLI DOLULUK ===
   Cloudflare Worker proxy'sinden GameTracker verisi. 60 sn cache. */
const STATUS_API = 'https://mad-status-alpha.vercel.app/api/status';
const IP_TO_KEY = {
  '185.193.165.2':   'awp',
  '185.193.165.102': 'aim',
  '185.193.165.48':  'redline',
};

async function initServerPopulate() {
  const cards = document.querySelectorAll('.server-card[data-ip]');
  if (!cards.length) return;

  let data = null;
  try {
    const res = await fetch(STATUS_API, { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch (e) { /* offline, sessizce geç */ }

  cards.forEach(card => {
    const ip = card.dataset.ip;
    const key = IP_TO_KEY[ip];
    const info = data && key ? data[key] : null;

    const popEl    = card.querySelector('[data-a2s="pop"]');
    const barEl    = card.querySelector('[data-a2s="popbar"]');
    const mapEl    = card.querySelector('[data-a2s="map"]');
    const statusEl = card.querySelector('[data-a2s="status"]');

    if (info && info.online !== null) {
      const online = info.online;
      const max = info.max || 20;
      const pct = Math.round((online / max) * 100);
      if (popEl) popEl.textContent = `${online} / ${max}`;
      if (barEl) barEl.style.setProperty('--pct', pct + '%');
      if (mapEl && info.map) mapEl.textContent = info.map;
      if (statusEl) { statusEl.textContent = 'Çevrimiçi'; statusEl.style.color = '#22c55e'; }
    } else {
      if (popEl) popEl.textContent = '— / —';
      if (statusEl) { statusEl.textContent = 'Çevrimdışı'; statusEl.style.color = '#f87171'; }
    }
  });
}

/* === RULES CATEGORY TABS === */
function initRuleCats() {
  const btns = document.querySelectorAll('.rules-cat-btn');
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.rules-category').forEach(cat => {
        cat.classList.toggle('active', cat.id === 'cat-' + btn.dataset.cat);
      });
    });
  });
}

/* === EASTER EGG (Konami Kodu) ===
   ↑ ↑ ↓ ↓ ← → ← → B A + Enter → sürpriz */
function initKonami() {
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a','Enter'];
  let pos = 0;
  document.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === SEQ[pos]) {
      pos++;
      if (pos === SEQ.length) {
        pos = 0;
        window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      }
    } else {
      pos = (key === SEQ[0]) ? 1 : 0;
    }
  });
}

/* === IMG FALLBACK (inline onerror yerine, CSP dostu) ===
   data-fallback="hide" -> hata olursa gizle
   data-fallback="URL"   -> hata olursa src'yi URL'e çevir */
function initImgFallbacks() {
  document.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', () => {
      const fb = img.dataset.fallback;
      if (!fb || fb === 'hide') { img.style.display = 'none'; return; }
      img.src = fb;
    }, { once: true });
  });
}

/* === YETKİLİ BAŞVURU FORMU ===
   Modal aç/kapa, client-side validation, Vercel serverless'e POST. */
const YETKILI_API = '/submit-yetkili.php';

function initYetkiliForm() {
  const modal = document.getElementById('yetkiliFormModal');
  const form  = document.getElementById('yetkiliForm');
  const openBtn = document.getElementById('openYetkiliForm');
  if (!modal || !form || !openBtn) return;

  const errBox = document.getElementById('yetkiliFormError');
  const submitBtn = document.getElementById('yetkiliFormSubmit');
  const submitText = submitBtn.querySelector('.form-submit-text');
  const submitLoading = submitBtn.querySelector('.form-submit-loading');

  const showError = msg => { errBox.textContent = msg; errBox.hidden = false; };
  const clearError = () => { errBox.textContent = ''; errBox.hidden = true; };

  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    clearError();
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', openModal);
  modal.querySelectorAll('[data-close-form]').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearError();

    const fd = new FormData(form);
    const payload = {};
    for (const [k, v] of fd.entries()) payload[k] = typeof v === 'string' ? v.trim() : v;
    payload.rulesRead = form.querySelector('[name="rulesRead"]').checked;

    // Client-side validation
    const age = parseInt(payload.age, 10);
    if (isNaN(age) || age < 16) return showError('Yaş en az 16 olmalı.');
    if (!payload.server) return showError('Bir sunucu seç.');
    if (!payload.rulesRead) return showError('Kuralları okuduğunu kabul etmen gerek.');
    const activeMin = parseInt(payload.activeMin, 10);
    const activeMax = parseInt(payload.activeMax, 10);
    if (activeMin > activeMax) return showError('En az saat, en çok saatten büyük olamaz.');
    if (!/^https?:\/\/steamcommunity\.com\//.test(payload.steamProfile)) {
      return showError('Geçerli bir Steam profil linki gir.');
    }

    // UI: loading
    submitBtn.disabled = true;
    submitText.hidden = true;
    submitLoading.hidden = false;

    try {
      const res = await fetch(YETKILI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Gönderim başarısız (' + res.status + ')');
      }
      // Success
      closeModal();
      form.reset();
      if (window.showToast) window.showToast('Başvurun gönderildi, ekip Discord\'dan görecek', 'check');
    } catch (err) {
      showError(err.message || 'Bir sorun oluştu. Biraz sonra tekrar dene.');
    } finally {
      submitBtn.disabled = false;
      submitText.hidden = false;
      submitLoading.hidden = true;
    }
  });
}

/* === BAN SEARCH TRIGGER (yasaklama sayfasında input eventi tetikleyici) === */
function initBanSearchTrigger() {
  const btn = document.getElementById('banSearchTrigger');
  const input = document.getElementById('banSearchInput');
  if (!btn || !input) return;
  btn.addEventListener('click', () => input.dispatchEvent(new Event('input')));
}

document.addEventListener('DOMContentLoaded', () => {
  initLavaParticles();
  initBurger();
  setActiveNav();
  initImgFallbacks();
  initCopyBtns();
  initServerConnect();
  if (typeof initServerSelect === 'function') initServerSelect();
  loadBans();
  initRuleCats();
  initPeriodToggle();
  initBanTabs();
  initBanSearch();
  initBanSearchTrigger();
  initSkinFilter();
  initKonami();
  initDiscordWidget();
  initServerPopulate();
  initYetkiliForm();
});
