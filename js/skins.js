/* === MAD — Kaplamalar (CS2 Skin Browser) ===
   Veri kaynağı: ByMykel CS2 API (github.com/ByMykel/CSGO-API) */

const BASE_API  = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/base_weapons.json';
const SKINS_API = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';

/* GÜVENLİK: Bymykel API üçüncü parti; XSS'e karşı escape.
   Skin görsel URL'leri de HTTPS/whitelisted host'lardan gelmelidir. */
const _ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
const escS = v => v == null ? '' : String(v).replace(/[&<>"'`]/g, c => _ESC[c]);
const ALLOWED_IMG_HOSTS = new Set([
  'community.akamai.steamstatic.com',
  'community.cloudflare.steamstatic.com',
  'community.steamstatic.com',
  'raw.githubusercontent.com',
  'steamcommunity-a.akamaihd.net',
]);
function safeImg(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return '';
    if (!ALLOWED_IMG_HOSTS.has(u.hostname)) return '';
    return u.href;
  } catch (e) { return ''; }
}

/* Silah -> kategori + takım */
const GUN_META = {
  'Glock-18': { cat: 'pistol', team: 'T' },
  'USP-S': { cat: 'pistol', team: 'CT' },
  'P2000': { cat: 'pistol', team: 'CT' },
  'Dual Berettas': { cat: 'pistol', team: 'both' },
  'P250': { cat: 'pistol', team: 'both' },
  'Five-SeveN': { cat: 'pistol', team: 'CT' },
  'Tec-9': { cat: 'pistol', team: 'T' },
  'CZ75-Auto': { cat: 'pistol', team: 'both' },
  'Desert Eagle': { cat: 'pistol', team: 'both' },
  'R8 Revolver': { cat: 'pistol', team: 'both' },
  'MAC-10': { cat: 'smg', team: 'T' },
  'MP9': { cat: 'smg', team: 'CT' },
  'MP7': { cat: 'smg', team: 'both' },
  'MP5-SD': { cat: 'smg', team: 'both' },
  'UMP-45': { cat: 'smg', team: 'both' },
  'P90': { cat: 'smg', team: 'both' },
  'PP-Bizon': { cat: 'smg', team: 'both' },
  'Galil AR': { cat: 'rifle', team: 'T' },
  'FAMAS': { cat: 'rifle', team: 'CT' },
  'AK-47': { cat: 'rifle', team: 'T' },
  'M4A4': { cat: 'rifle', team: 'CT' },
  'M4A1-S': { cat: 'rifle', team: 'CT' },
  'SG 553': { cat: 'rifle', team: 'T' },
  'AUG': { cat: 'rifle', team: 'CT' },
  'SSG 08': { cat: 'sniper', team: 'both' },
  'AWP': { cat: 'sniper', team: 'both' },
  'G3SG1': { cat: 'sniper', team: 'T' },
  'SCAR-20': { cat: 'sniper', team: 'CT' },
  'Nova': { cat: 'heavy', team: 'both' },
  'XM1014': { cat: 'heavy', team: 'both' },
  'Sawed-Off': { cat: 'heavy', team: 'T' },
  'MAG-7': { cat: 'heavy', team: 'CT' },
  'M249': { cat: 'heavy', team: 'both' },
  'Negev': { cat: 'heavy', team: 'both' },
  'Zeus x27': { cat: 'heavy', team: 'both' },
};

/* CS2 buy-menu sıralaması */
const WEAPON_ORDER = {
  'Glock-18': 1, 'P2000': 2, 'USP-S': 3, 'Dual Berettas': 4, 'CZ75-Auto': 5,
  'P250': 6, 'Tec-9': 7, 'Five-SeveN': 8, 'Desert Eagle': 9, 'R8 Revolver': 10,
  'MP9': 1, 'MP5-SD': 2, 'MP7': 3, 'UMP-45': 4, 'MAC-10': 5, 'PP-Bizon': 6, 'P90': 7,
  'Galil AR': 1, 'FAMAS': 2, 'AK-47': 3, 'M4A4': 4, 'M4A1-S': 5, 'SG 553': 6, 'AUG': 7,
  'SSG 08': 1, 'AWP': 2, 'G3SG1': 3, 'SCAR-20': 4,
  'Nova': 1, 'XM1014': 2, 'MAG-7': 3, 'Sawed-Off': 4, 'M249': 5, 'Negev': 6, 'Zeus x27': 7,
};

/* Rarity sıralama: nadirden yaygına (yüksek nadirlik önce) */
const RARITY_ORDER = {
  'Contraband': 8, 'Extraordinary': 7, 'Covert': 6, 'Classified': 5,
  'Restricted': 4, 'Mil-Spec Grade': 3, 'Industrial Grade': 2,
  'Consumer Grade': 1, 'Default': 0,
};

const CAT_ORDER = ['pistol', 'smg', 'rifle', 'sniper', 'heavy', 'knife', 'glove'];
const CAT_LABELS = {
  pistol: 'Pistols', smg: 'SMGs', rifle: 'Rifles',
  sniper: 'Sniper Rifles', heavy: 'Heavy', knife: 'Knives', glove: 'Gloves',
};

let WEAPONS = {};
let VANILLA = {};
let SELECTED = {};  // silah -> {img, name, rarity} (o silah için seçili skin)
let activeTeam = 'all';

function orderIndex(name) {
  return WEAPON_ORDER[name] != null ? WEAPON_ORDER[name] : 999;
}

/* localStorage'dan seçimleri yükle */
function loadSelections() {
  try {
    const raw = localStorage.getItem('mad_skin_selections');
    if (raw) SELECTED = JSON.parse(raw);
  } catch (e) { SELECTED = {}; }
}
function saveSelections() {
  try { localStorage.setItem('mad_skin_selections', JSON.stringify(SELECTED)); }
  catch (e) {}
}

async function loadSkins() {
  const root = document.getElementById('skins-root');
  if (!root) return;
  loadSelections();

  try {
    const [baseRes, skinRes] = await Promise.all([fetch(BASE_API), fetch(SKINS_API)]);
    const baseData = await baseRes.json();
    const skinData = await skinRes.json();

    baseData.forEach(w => {
      if (w.name && w.image && !VANILLA[w.name]) VANILLA[w.name] = w.image;
    });

    skinData.forEach(s => {
      if (!s.weapon || !s.weapon.name) return;
      const wname = s.weapon.name;
      const catName = s.category && s.category.name;
      let cat, team;
      if (catName === 'Knives') { cat = 'knife'; team = 'both'; }
      else if (catName === 'Gloves') { cat = 'glove'; team = 'both'; }
      else if (GUN_META[wname]) { cat = GUN_META[wname].cat; team = GUN_META[wname].team; }
      else return;
      if (!WEAPONS[wname]) WEAPONS[wname] = { name: wname, cat, team, skins: [] };
      WEAPONS[wname].skins.push(s);
    });

    /* Her silah için kaplamaları sırala: önce rarity (düşük->yüksek), sonra alfabetik */
    Object.values(WEAPONS).forEach(w => {
      w.skins.sort((a, b) => {
        const ra = RARITY_ORDER[a.rarity && a.rarity.name] ?? 0;
        const rb = RARITY_ORDER[b.rarity && b.rarity.name] ?? 0;
        if (ra !== rb) return ra - rb;  // düşük nadirlik önce (kötüden iyiye)
        return (a.name || '').localeCompare(b.name || '');
      });
      w.vanilla = VANILLA[w.name] || (w.skins[0] || {}).image;
    });

    renderWeapons();
    initSkinControls();
  } catch (err) {
    root.innerHTML = '<div class="skins-error">Kaplama verileri yüklenemedi. Sayfayı yenile.</div>';
    console.error(err);
  }
}

function teamMatch(w) {
  if (activeTeam === 'all') return true;
  return w.team === activeTeam || w.team === 'both';
}

function currentImage(w) {
  const sel = SELECTED[w.name];
  return sel ? sel.img : w.vanilla;
}
function currentLabel(w) {
  const sel = SELECTED[w.name];
  return sel ? sel.name : w.name;
}
function currentSublabel(w) {
  const sel = SELECTED[w.name];
  return sel ? sel.name.replace(w.name, '').replace(/^\s*\|\s*/, '') : `${w.skins.length} skins`;
}

function renderWeapons() {
  const root = document.getElementById('skins-root');
  const list = Object.values(WEAPONS).filter(teamMatch);

  const byCat = {};
  list.forEach(w => { (byCat[w.cat] = byCat[w.cat] || []).push(w); });

  let html = '';
  CAT_ORDER.forEach(cat => {
    if (!byCat[cat] || !byCat[cat].length) return;
    const weapons = byCat[cat].sort((a, b) => {
      const d = orderIndex(a.name) - orderIndex(b.name);
      return d !== 0 ? d : a.name.localeCompare(b.name);
    });
    html += `<div class="weapon-cat-group" id="cat-group-${cat}">
      <div class="weapon-cat-title">${CAT_LABELS[cat]}</div>
      <div class="weapon-grid">`;
    weapons.forEach(w => {
      const hasSel = !!SELECTED[w.name];
      html += `<div class="weapon-card ${hasSel ? 'has-selection' : ''}" data-weapon="${encodeURIComponent(w.name)}">
        <div class="weapon-thumb"><img loading="lazy" src="${escS(safeImg(currentImage(w)))}" alt="${escS(w.name)}"></div>
        <div class="weapon-name">${escS(w.name)}</div>
        <div class="weapon-count">${escS(currentSublabel(w))}</div>
      </div>`;
    });
    html += `</div></div>`;
  });

  root.innerHTML = html || '<div class="skins-empty">Bu filtreye uygun silah bulunamadı.</div>';

  root.querySelectorAll('.weapon-card').forEach(card => {
    card.addEventListener('click', () => openWeaponModal(decodeURIComponent(card.dataset.weapon)));
  });
}

/* Bir silah kartının görselini/etiketini yeniden çiz (modal içinde seçim yaptığımızda) */
function refreshWeaponCard(wname) {
  const w = WEAPONS[wname];
  if (!w) return;
  const card = document.querySelector(`.weapon-card[data-weapon="${encodeURIComponent(wname)}"]`);
  if (!card) return;
  card.classList.toggle('has-selection', !!SELECTED[wname]);
  const img = card.querySelector('.weapon-thumb img');
  if (img) img.src = currentImage(w);
  const sub = card.querySelector('.weapon-count');
  if (sub) sub.textContent = currentSublabel(w);
}

function openWeaponModal(wname) {
  const w = WEAPONS[wname];
  if (!w) return;
  const modal = document.getElementById('skin-modal');
  const body = document.getElementById('skin-modal-body');
  document.getElementById('skin-modal-title').textContent = w.name;
  document.getElementById('skin-modal-sub').textContent = `${w.skins.length} skins`;

  const selKey = SELECTED[w.name] ? SELECTED[w.name].key : null;
  let html = '<div class="skin-grid">';

  const vanillaActive = !selKey;
  html += `<div class="skin-item ${vanillaActive ? 'active' : ''}" data-key="__vanilla" style="--rc:#9aa0a6">
    <div class="skin-item-img"><img loading="lazy" src="${escS(safeImg(VANILLA[w.name] || w.vanilla))}" alt="Default"></div>
    <div class="skin-item-name">Default (Vanilla)</div>
    <div class="skin-item-rarity"><span class="rarity-dot"></span>Default</div>
  </div>`;

  w.skins.forEach((s, idx) => {
    const key = `skin-${idx}`;
    // GÜVENLİK: rarity.color CSS custom property'sine gidiyor — sadece #RGB / #RRGGBB kabul et.
    const rawColor = (s.rarity && s.rarity.color) || '';
    const color = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#888';
    const rarityName = (s.rarity && s.rarity.name) || 'Common';
    const isActive = selKey === key;
    const safeSrc = escS(safeImg(s.image));
    // paint_index sadece sayı olmalı (css_ws komutu için)
    const paintIdx = /^\d+$/.test(String(s.paint_index || '')) ? s.paint_index : '';
    // Silah slug: "weapon_ak47" -> "ak47" (CSSharp css_ws komutu formatı)
    const wRaw = (s.weapon && s.weapon.id) ? String(s.weapon.id) : '';
    const wSlug = wRaw.replace(/^weapon_/, '').toLowerCase();
    const validSlug = /^[a-z0-9_]+$/.test(wSlug) ? wSlug : '';
    const cmd = (validSlug && paintIdx) ? `css_ws ${validSlug} ${paintIdx}` : '';
    const wsBtn = cmd
      ? `<button type="button" class="skin-item-ws" data-cmd="${escS(cmd)}" title="${escS(cmd)} kodunu kopyala">📋 ${escS(cmd)}</button>`
      : '';
    html += `<div class="skin-item ${isActive ? 'active' : ''}" data-key="${escS(key)}" data-img="${safeSrc}" data-name="${escS(s.name)}" data-rarity="${escS(rarityName)}" data-paint="${paintIdx}" data-cmd="${escS(cmd)}" style="--rc:${color}">
      <div class="skin-item-img"><img loading="lazy" src="${safeSrc}" alt="${escS(s.name)}"></div>
      <div class="skin-item-name">${escS(s.name)}</div>
      <div class="skin-item-rarity"><span class="rarity-dot"></span>${escS(rarityName)}</div>
      ${wsBtn}
    </div>`;
  });
  html += '</div>';
  body.innerHTML = html;
  body.scrollTop = 0;

  /* css_ws kod kopyala butonu — skin seçim tıklamasını bloklar */
  body.querySelectorAll('.skin-item-ws').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const cmd = btn.dataset.cmd;
      if (!cmd) return;
      try {
        await navigator.clipboard.writeText(cmd);
        if (window.showToast) window.showToast('Kopyalandı: ' + cmd, 'check');
      } catch (err) {
        // Fallback: eski tarayıcılar için
        const ta = document.createElement('textarea');
        ta.value = cmd;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); if (window.showToast) window.showToast('Kopyalandı: ' + cmd, 'check'); }
        catch (e2) { if (window.showToast) window.showToast('Kopyalama başarısız', 'error'); }
        document.body.removeChild(ta);
      }
    });
  });

  /* Skin tıklama: seç + css_ws komutunu doğrudan panoya kopyala */
  const copyCmd = async (cmd) => {
    if (!cmd) return false;
    try { await navigator.clipboard.writeText(cmd); return true; }
    catch {
      const ta = document.createElement('textarea');
      ta.value = cmd; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      return ok;
    }
  };

  body.querySelectorAll('.skin-item').forEach(item => {
    item.addEventListener('click', async () => {
      const key = item.dataset.key;
      const wasActive = item.classList.contains('active');

      if (key === '__vanilla') {
        delete SELECTED[w.name];
      } else if (wasActive) {
        delete SELECTED[w.name];
      } else {
        SELECTED[w.name] = {
          key,
          img: item.dataset.img,
          name: item.dataset.name,
          rarity: item.dataset.rarity,
        };
      }
      saveSelections();

      body.querySelectorAll('.skin-item').forEach(el => el.classList.remove('active'));
      const cmd = item.dataset.cmd || '';
      if (SELECTED[w.name]) {
        item.classList.add('active');
        if (cmd) {
          const ok = await copyCmd(cmd);
          if (window.showToast) window.showToast(ok ? `Kopyalandı: ${cmd} — CS2 konsoluna yapıştır` : 'Kopyalama başarısız', ok ? 'check' : 'error');
        } else if (window.showToast) {
          window.showToast(`${w.name} → ${item.dataset.name}`, 'check');
        }
      } else {
        const v = body.querySelector('.skin-item[data-key="__vanilla"]');
        if (v) v.classList.add('active');
        if (window.showToast) window.showToast(`${w.name} → Default`, 'check');
      }

      refreshWeaponCard(w.name);
    });
  });

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSkinModal() {
  document.getElementById('skin-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function initSkinControls() {
  document.querySelectorAll('.skin-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.skin-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      if (cat === 'all') {
        document.getElementById('skins-root').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const el = document.getElementById('cat-group-' + cat);
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });

  document.querySelectorAll('.team-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.team-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTeam = btn.dataset.team;
      renderWeapons();
    });
  });

  const modal = document.getElementById('skin-modal');
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) closeSkinModal(); });
    document.getElementById('skin-modal-close').addEventListener('click', closeSkinModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSkinModal(); });
  }
}

document.addEventListener('DOMContentLoaded', loadSkins);
