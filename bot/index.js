// MAD Ban Bridge — Discord webhook log kanallarını dinler, madcs2.com /update_bans.php'e POST atar.
import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

const {
  DISCORD_TOKEN,
  SITE_ENDPOINT,
  BOT_API_TOKEN,
  CHAN_AWP_BAN, CHAN_AWP_GAG,
  CHAN_AIM_BAN, CHAN_AIM_GAG,
  CHAN_RED_BAN, CHAN_RED_GAG,
  LOG_LEVEL = 'info',
} = process.env;

if (!DISCORD_TOKEN || !SITE_ENDPOINT || !BOT_API_TOKEN) {
  console.error('[FATAL] .env eksik: DISCORD_TOKEN, SITE_ENDPOINT, BOT_API_TOKEN zorunlu');
  process.exit(1);
}

const CHANNELS = new Map([
  [CHAN_AWP_BAN, { server: 'awp',     serverName: 'AWP LEGO' }],
  [CHAN_AWP_GAG, { server: 'awp',     serverName: 'AWP LEGO' }],
  [CHAN_AIM_BAN, { server: 'aim',     serverName: 'AIM PISTOL' }],
  [CHAN_AIM_GAG, { server: 'aim',     serverName: 'AIM PISTOL' }],
  [CHAN_RED_BAN, { server: 'redline', serverName: 'AIM REDLINE' }],
  [CHAN_RED_GAG, { server: 'redline', serverName: 'AIM REDLINE' }],
].filter(([id]) => id));

const log = {
  info:  (...a) => console.log(new Date().toISOString(), '[INFO]', ...a),
  warn:  (...a) => console.warn(new Date().toISOString(), '[WARN]', ...a),
  error: (...a) => console.error(new Date().toISOString(), '[ERR]', ...a),
  debug: (...a) => LOG_LEVEL === 'debug' && console.log(new Date().toISOString(), '[DBG]', ...a),
};

// ---- Aksiyon eşleme ----
// Bot'un attığı embed'lerdeki ilk kelime/başlık → frontend tipi
const ACTION_MAP = {
  'LASTBAN':   ['ban'],
  'BAN':       ['ban'],
  'BAN IP':    ['ban'],
  'BANIP':     ['ban'],
  'UNBAN':     ['unban'],
  'KICK':      ['kick'],
  'MUTE':      ['mute'],
  'UNMUTE':    ['unmute'],
  'GAG':       ['gag'],
  'UNGAG':     ['ungag'],
  'SILENCE':   ['mute', 'gag'],   // SILENCE = hem mute hem gag
  'UNSILENCE': ['unmute', 'ungag'],
};

// ---- Süre metnini durationClass'a çevir ----
function classifyDuration(txt) {
  if (!txt) return { duration: '—', durationClass: '' };
  const t = String(txt).toLowerCase().trim();
  if (!t || t === '—') return { duration: '—', durationClass: 'instant' };
  if (/(sınırsız|sinirsiz|süresiz|suresiz|kalıcı|kalici|perm|permanent)/i.test(t)) {
    return { duration: 'Kalıcı', durationClass: 'perm' };
  }
  // "N dakika" / "N saat" / "N gün" → toplam dakika hesabı
  let minutes = null;
  const mMin = t.match(/(\d+)\s*(dk|dakika|min)/);
  const mHr  = t.match(/(\d+)\s*(saat|hr|hour)/);
  const mDay = t.match(/(\d+)\s*(gün|gun|day)/);
  if (mMin) minutes = parseInt(mMin[1], 10);
  else if (mHr)  minutes = parseInt(mHr[1], 10) * 60;
  else if (mDay) minutes = parseInt(mDay[1], 10) * 60 * 24;

  if (minutes == null) return { duration: String(txt).slice(0, 40), durationClass: '' };
  if (minutes >= 60 * 24 * 7)  return { duration: String(txt).slice(0, 40), durationClass: 'long' };
  if (minutes >= 60 * 6)       return { duration: String(txt).slice(0, 40), durationClass: 'medium' };
  return { duration: String(txt).slice(0, 40), durationClass: 'short' };
}

// ---- Embed metni topla (title + desc + fields) ----
function embedText(e) {
  const parts = [];
  if (e.title) parts.push(e.title);
  if (e.description) parts.push(e.description);
  for (const f of (e.fields || [])) {
    if (f?.name) parts.push(f.name);
    if (f?.value) parts.push(f.value);
  }
  return parts.join('\n');
}

// ---- Regex'ler ----
const RE_STEAM_TAG    = /\[U:1:(\d+)\]/;
const RE_STEAM_URL    = /steamcommunity\.com\/profiles\/(\d{17})/i;
const RE_STEAM_ID64   = /\b(7656119\d{10})\b/;
const RE_SLOT_NAME    = /\(#(\d+)\)\s*([^\n\[|]+?)(?=\s*(?:\[U:1:|$|\n|—|:|\|))/;
const RE_ACTION_HEAD  = /^\s*([A-ZÇĞİÖŞÜ ]+?)\s*(?:—|:|→|\(#|\||$)/;
const RE_DURATION     = /(sınırsız|sinirsiz|süresiz|suresiz|kalıcı|kalici|perm|permanent|\d+\s*(?:dk|dakika|min|saat|hr|hour|gün|gun|day))/i;
const RE_MAP          = /^([a-z0-9_]+)$/i;

// ---- Ana parser ----
// Discord mesajından (multi-embed) event(ler) üret
function parseMessage(message, channelInfo) {
  const embeds = message.embeds || [];
  if (embeds.length === 0) return [];

  // Embed'ler tipik olarak: [0]=meta, [1]=player, [2]=admin
  // Ama sıralama değişebilir — her embed'in text'ini alıp keyword tarayacağız.
  const allText = embeds.map(embedText).join('\n---\n');
  log.debug('embed text:', allText.slice(0, 600));

  // 1) Aksiyon tipi
  let actionKey = null;
  for (const key of Object.keys(ACTION_MAP)) {
    // Kelime sınırıyla ara, "UNBAN" içinde "BAN" false pozitif olmasın
    const re = new RegExp(`\\b${key.replace(' ', '\\s+')}\\b`, 'i');
    if (re.test(allText)) { actionKey = key; break; }
  }
  if (!actionKey) {
    log.warn('Bilinmeyen aksiyon:', allText.slice(0, 200));
    return [];
  }
  const types = ACTION_MAP[actionKey];

  // 2) Player bilgisi (ilk [U:1:xxx] ve slot+name)
  let playerSteamTag = null, playerSteamId64 = null, playerSlot = null, playerName = null;
  for (const e of embeds) {
    const t = embedText(e);
    if (!playerSteamTag) {
      const m = t.match(RE_STEAM_TAG);
      if (m) playerSteamTag = `[U:1:${m[1]}]`;
    }
    if (!playerSteamId64) {
      const m = t.match(RE_STEAM_URL) || t.match(RE_STEAM_ID64);
      if (m) playerSteamId64 = m[1];
    }
    if (!playerSlot) {
      const m = t.match(RE_SLOT_NAME);
      if (m) { playerSlot = m[1]; playerName = m[2].trim(); }
    }
    if (playerSteamTag && playerSlot) break;
  }

  // 3) Admin bilgisi — genelde son embed'de "Admin" kelimesi geçer
  let admin = { name: '', steamTag: '', steamId64: '', cmd: '' };
  for (const e of embeds) {
    const t = embedText(e);
    if (/admin/i.test(t)) {
      const slotName = t.match(RE_SLOT_NAME);
      const tag = t.match(RE_STEAM_TAG);
      const url = t.match(RE_STEAM_URL) || t.match(RE_STEAM_ID64);
      const cmdMatch = t.match(/css_[a-z_]+(?:\s+[^\n]+)?/i);
      if (slotName) admin.name = slotName[2].trim();
      if (tag) admin.steamTag = `[U:1:${tag[1]}]`;
      if (url) admin.steamId64 = url[1];
      if (cmdMatch) admin.cmd = cmdMatch[0].trim();
      break;
    }
  }

  // 4) Süre — player embed'inin sonundaki metin genelde "Sınırsız" veya "N dakika"
  let durationText = '';
  for (const e of embeds) {
    const t = embedText(e);
    if (playerSteamTag && t.includes(playerSteamTag)) {
      const m = t.match(RE_DURATION);
      if (m) { durationText = m[1]; break; }
    }
  }
  const { duration, durationClass } = classifyDuration(durationText);

  // 5) Harita
  let mapName = '';
  for (const e of embeds) {
    for (const f of (e.fields || [])) {
      const n = (f.name || '').toLowerCase();
      if (n.includes('harita') || n.includes('map')) {
        const v = (f.value || '').trim();
        if (RE_MAP.test(v)) mapName = v;
        break;
      }
    }
    if (mapName) break;
  }

  // 6) Timestamp
  const ts = message.createdAt ? message.createdAt.toISOString() : new Date().toISOString();

  // 7) Event(ler) oluştur (SILENCE gibi çoklu tipler için)
  const base = {
    ts,
    server: channelInfo.server,
    serverName: channelInfo.serverName,
    player: playerName || '?',
    playerSteamId: playerSteamTag || '',
    playerSteamUrl: playerSteamId64 ? `https://steamcommunity.com/profiles/${playerSteamId64}` : '',
    admin: admin.name || '—',
    adminSteamId: admin.steamTag || '',
    reason: admin.cmd || '—',
    duration,
    durationClass,
  };

  return types.map(type => ({
    ...base,
    type,
    action: actionKey,
  }));
}

// ---- POST to site ----
async function sendEvents(events) {
  if (!events.length) return;
  const body = JSON.stringify({ events });
  try {
    const res = await fetch(SITE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Token': BOT_API_TOKEN,
      },
      body,
    });
    const txt = await res.text();
    if (!res.ok) {
      log.error('POST başarısız:', res.status, txt.slice(0, 300));
      return;
    }
    log.info(`POST OK: ${events.length} event → ${txt.slice(0, 200)}`);
  } catch (err) {
    log.error('fetch hatası:', err.message);
  }
}

// ---- Discord client ----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once('ready', () => {
  log.info(`Bağlandı: ${client.user.tag}`);
  log.info(`İzlenen kanallar: ${CHANNELS.size}`);
  for (const [id, info] of CHANNELS) {
    log.info(`  ${id} → ${info.server} (${info.serverName})`);
  }
});

client.on('messageCreate', async (message) => {
  const chInfo = CHANNELS.get(message.channelId);
  if (!chInfo) return;

  try {
    const events = parseMessage(message, chInfo);
    if (events.length === 0) {
      log.debug('parse edilemedi:', message.id);
      return;
    }
    log.info(`[${chInfo.server}] ${events[0].action} → ${events[0].player} (${events.length} event)`);
    await sendEvents(events);
  } catch (err) {
    log.error('mesaj işleme hatası:', err.stack || err.message);
  }
});

client.on('error', (err) => log.error('discord client err:', err.message));
process.on('unhandledRejection', (r) => log.error('unhandled:', r));

client.login(DISCORD_TOKEN).catch(err => {
  log.error('LOGIN FAIL:', err.message);
  process.exit(1);
});
