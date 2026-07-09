/* MAD — Yetkili başvuru formu backend
 * Body JSON alır, doğrular, uygun sunucunun Discord webhook'una embed olarak gönderir.
 * Webhook URL'leri ENV variable'da (WEBHOOK_AWP_YETKILI, WEBHOOK_AIM_YETKILI, WEBHOOK_REDLINE_YETKILI). */

const SERVER_LABEL = {
  awp:     'AWP Lego',
  aim:     'AIM Pistol',
  redline: 'AIM Redline',
};

// Basit in-memory rate limit — cold start'ta sıfırlanır ama spam'i frenler
const RATE = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;

function rateLimit(ip) {
  const now = Date.now();
  const arr = (RATE.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  arr.push(now);
  RATE.set(ip, arr);
  return arr.length > RATE_MAX;
}

function esc(s, max = 400) {
  if (s === null || s === undefined) return '';
  const clean = String(s).slice(0, max).replace(/[`]/g, '´');
  return clean;
}

function requireField(body, field, res) {
  if (!body[field] || String(body[field]).trim() === '') {
    res.status(400).json({ error: 'missing_field', field, message: `Eksik alan: ${field}` });
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  // CORS (yalnızca site domain'i — güvenlik için)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed', message: 'Sadece POST kabul edilir' });
  }

  // Rate limit (Cloudflare arkasında CF-Connecting-IP kullan)
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (rateLimit(ip)) {
    return res.status(429).json({ error: 'rate_limited', message: 'Çok sık gönderim. 1 dakika bekle.' });
  }

  // Body parse — Vercel Node runtime bunu otomatik yapar ama güvenlik için manuel de deniyoruz
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      return res.status(400).json({ error: 'bad_json', message: 'Geçersiz JSON' });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'no_body', message: 'Boş istek' });
  }

  // Honeypot — bot ise sessiz OK dön
  if (body.website && String(body.website).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  // Zorunlu alanlar
  const required = ['server', 'name', 'age', 'nickname', 'steamProfile', 'cs2Hours',
                    'twKnow', 'prime', 'rank', 'activeMin', 'activeMax',
                    'schedule', 'mic', 'commands', 'beenAdmin'];
  for (const f of required) {
    if (!requireField(body, f, res)) return;
  }

  // Sunucu doğrula
  const server = String(body.server).toLowerCase();
  if (!SERVER_LABEL[server]) {
    return res.status(400).json({ error: 'invalid_server', message: 'Geçersiz sunucu' });
  }

  // Yaş
  const age = parseInt(body.age, 10);
  if (isNaN(age) || age < 16 || age > 80) {
    return res.status(400).json({ error: 'invalid_age', message: 'Yaş 16-80 arasında olmalı' });
  }

  // Kurallar kabul edildi mi?
  if (body.rulesRead !== true && body.rulesRead !== 'true' && body.rulesRead !== 'on') {
    return res.status(400).json({ error: 'rules_not_accepted', message: 'Kuralları kabul etmen gerek' });
  }

  // Steam profil URL basit doğrulama
  if (!/^https?:\/\/steamcommunity\.com\//i.test(String(body.steamProfile))) {
    return res.status(400).json({ error: 'invalid_steam', message: 'Geçerli bir Steam profil linki gir' });
  }

  // Webhook URL
  const ENV_KEY = {
    awp:     'WEBHOOK_AWP_YETKILI',
    aim:     'WEBHOOK_AIM_YETKILI',
    redline: 'WEBHOOK_REDLINE_YETKILI',
  }[server];
  const webhookUrl = process.env[ENV_KEY];
  if (!webhookUrl) {
    console.error('Missing env:', ENV_KEY);
    return res.status(500).json({ error: 'server_misconfigured', message: 'Sunucu yapılandırma hatası' });
  }

  // Discord embed
  const embed = {
    title: `🇹🇷 MAD? ${SERVER_LABEL[server]} Yetkili Başvurusu`,
    color: 0xff3b1a,
    fields: [
      { name: '👤 İsim / Yaş / Nickname', value: `${esc(body.name, 60)} / ${age} / ${esc(body.nickname, 40)}`, inline: false },
      { name: '🔗 Steam Profili',        value: esc(body.steamProfile, 200), inline: false },
      { name: '⏱️ CS2 Süresi',           value: `${esc(body.cs2Hours, 10)} saat`, inline: true },
      { name: '🎯 Rank',                  value: esc(body.rank, 30), inline: true },
      { name: '💎 Prime',                 value: esc(body.prime, 20), inline: true },
      { name: '🕵️ TW Bakma',              value: esc(body.twKnow, 10), inline: true },
      { name: '🎙️ Mikrofon',              value: esc(body.mic, 10), inline: true },
      { name: '📆 Günlük Aktif',          value: `${esc(body.activeMin, 5)}–${esc(body.activeMax, 5)} saat`, inline: true },
      { name: '🕰️ Okul/İş Programı',      value: esc(body.schedule, 500) || '—', inline: false },
      { name: '⚙️ Yetkili Komutları',     value: esc(body.commands, 800) || '—', inline: false },
      { name: '📋 Daha Önce Yetkili',    value: esc(body.beenAdmin, 10), inline: true },
      { name: '📜 Kuralları Okudu',      value: '✅ Evet', inline: true },
    ],
    footer: { text: `${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} • IP: ${esc(ip, 45)}` },
  };

  const payload = {
    content: `📝 **Yeni ${SERVER_LABEL[server]} yetkili başvurusu** — **${esc(body.name, 40)}** (${age})`,
    embeds: [embed],
    // Webhook mesajında @everyone/@here'e izin verme
    allowed_mentions: { parse: [] },
  };

  try {
    const r = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.error('Webhook failed:', r.status, t.slice(0, 300));
      return res.status(502).json({ error: 'webhook_failed', message: 'Discord webhook hatası' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'network_error', message: 'Ağ hatası' });
  }
};
