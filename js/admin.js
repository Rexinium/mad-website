/* MAD Admin paneli — harici script (katı CSP uyumlu, inline yok).
   Sunucu bazlı yetki başvuru toggle + kapalı mesaj yönetimi. */
(function () {
  let pwd = '';
  const $ = id => document.getElementById(id);
  const showMsg = (el, txt, kind = 'ok') => {
    el.className = 'msg ' + kind;
    el.textContent = txt;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4500);
  };

  async function loadConfig() {
    try {
      const r = await fetch('/data/site_config.json?_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('config fetch ' + r.status);
      return await r.json();
    } catch (e) {
      return { yetkiliAwp: true, yetkiliAim: true, yetkiliRedline: true, closedTitle: '', closedMessage: '' };
    }
  }

  const SERVERS = [
    { key: 'yetkiliAwp',     row: 'row-awp' },
    { key: 'yetkiliAim',     row: 'row-aim' },
    { key: 'yetkiliRedline', row: 'row-redline' },
  ];

  function renderStatus(cfg) {
    SERVERS.forEach(s => {
      const on = cfg[s.key] !== false;  // varsayılan açık
      const row = $(s.row);
      row.classList.toggle('on', on);
      row.classList.toggle('off', !on);
      row.querySelector('.server-state').textContent = on ? 'AÇIK' : 'KAPALI';
      row.querySelector('.toggle-switch').classList.toggle('on', on);
    });
    $('cTitle').value = cfg.closedTitle || '';
    $('cMsg').value   = cfg.closedMessage || '';
  }

  async function apiToggle(key, value) {
    const r = await fetch('/admin-toggle.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd, key, value }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'HTTP ' + r.status);
    return data;
  }

  $('loginBtn').addEventListener('click', async () => {
    pwd = $('pwd').value;
    if (!pwd) return;
    $('loginBtn').disabled = true;
    try {
      // Login için idempotent probe — AWP durumunu yeniden yaz, sadece auth doğrula
      const cfg = await loadConfig();
      const probeVal = cfg.yetkiliAwp !== false;
      await apiToggle('yetkiliAwp', probeVal);
      $('loginView').hidden = true;
      $('panelView').hidden = false;
      renderStatus(cfg);
    } catch (e) {
      showMsg($('loginErr'), e.message || 'giriş başarısız', 'err');
    } finally {
      $('loginBtn').disabled = false;
    }
  });

  $('pwd').addEventListener('keydown', e => { if (e.key === 'Enter') $('loginBtn').click(); });

  document.querySelectorAll('.toggle-switch').forEach(sw => {
    sw.addEventListener('click', async () => {
      const key = sw.dataset.key;
      const newVal = !sw.classList.contains('on');
      try {
        const d = await apiToggle(key, newVal);
        renderStatus(d.config);
        const label = sw.closest('.server-row').querySelector('.server-name').textContent;
        showMsg($('panelMsg'), (newVal ? '🟢 ' : '🔴 ') + label + ' → ' + (newVal ? 'AÇILDI' : 'KAPATILDI'), 'ok');
      } catch (e) { showMsg($('panelMsg'), e.message, 'err'); }
    });
  });

  $('saveTextBtn').addEventListener('click', async () => {
    try {
      await apiToggle('closedTitle', $('cTitle').value);
      const d = await apiToggle('closedMessage', $('cMsg').value);
      renderStatus(d.config);
      showMsg($('panelMsg'), '💾 Mesaj kaydedildi', 'ok');
    } catch (e) { showMsg($('panelMsg'), e.message, 'err'); }
  });
})();
