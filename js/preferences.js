/* === MAD — Kullanıcı Tercihleri (Tema + Arka Plan Efekti + Dil) ===
 * localStorage'a kaydedilir, sayfa yüklenirken uygulanır.
 * Nav sağ tarafına 3 küçük buton enjekte edilir (paint / sparkle / globe). */

/* -----------------------------------------------------------------
 * TEMALAR
 * ----------------------------------------------------------------- */
const THEMES = {
  red:    { label: { tr: 'Ateş', en: 'Fire',    ru: 'Огонь'    }, dot: '#ff3b1a' },
  blue:   { label: { tr: 'Buz',  en: 'Ice',     ru: 'Лёд'      }, dot: '#3b82f6' },
  purple: { label: { tr: 'Kozmik', en: 'Cosmic', ru: 'Космос'  }, dot: '#a855f7' },
};

/* -----------------------------------------------------------------
 * EFEKTLER — her tema kendi paketini taşır
 * key: bir slotu tanımlar (kapat/parcacik/yagmur/matrix/siber/ates_bocegi/patlama)
 * Kırmızı temada kar/yağmur olmaz → tematik uygun alternatifler. */
const EFFECT_PACKAGES = {
  red: [
    { id: 'off',          label: { tr: 'Kapat',           en: 'Off',           ru: 'Выкл.'      }, emoji: '🚫' },
    { id: 'ashes',        label: { tr: 'Kül',             en: 'Ashes',         ru: 'Пепел'      }, emoji: '🌋' },
    { id: 'firerain',     label: { tr: 'Ateş yağmuru',    en: 'Fire rain',     ru: 'Огненный дождь' }, emoji: '☄️' },
    { id: 'cyber-red',    label: { tr: 'Siber',           en: 'Cyber',         ru: 'Кибер'      }, emoji: '✨' },
    { id: 'matrix-red',   label: { tr: 'Matrix',          en: 'Matrix',        ru: 'Матрица'    }, emoji: '💻' },
    { id: 'sparks',       label: { tr: 'Kıvılcım',        en: 'Sparks',        ru: 'Искры'      }, emoji: '🔥' },
    { id: 'stars-red',    label: { tr: 'Yıldızlar',       en: 'Stars',         ru: 'Звёзды'     }, emoji: '⭐' },
  ],
  blue: [
    { id: 'off',          label: { tr: 'Kapat',           en: 'Off',           ru: 'Выкл.'      }, emoji: '🚫' },
    { id: 'snow',         label: { tr: 'Kar',             en: 'Snow',          ru: 'Снег'       }, emoji: '❄️' },
    { id: 'rain',         label: { tr: 'Yağmur',          en: 'Rain',          ru: 'Дождь'      }, emoji: '🌧️' },
    { id: 'cyber-blue',   label: { tr: 'Siber',           en: 'Cyber',         ru: 'Кибер'      }, emoji: '✨' },
    { id: 'matrix-blue',  label: { tr: 'Matrix',          en: 'Matrix',        ru: 'Матрица'    }, emoji: '💻' },
    { id: 'fireflies',    label: { tr: 'Ateş böceği',     en: 'Fireflies',     ru: 'Светлячки'  }, emoji: '🪲' },
    { id: 'stars-blue',   label: { tr: 'Yıldızlar',       en: 'Stars',         ru: 'Звёзды'     }, emoji: '⭐' },
  ],
  purple: [
    { id: 'off',          label: { tr: 'Kapat',           en: 'Off',           ru: 'Выкл.'      }, emoji: '🚫' },
    { id: 'dust',         label: { tr: 'Toz',             en: 'Dust',          ru: 'Пыль'       }, emoji: '💫' },
    { id: 'meteor',       label: { tr: 'Meteor yağmuru',  en: 'Meteor rain',   ru: 'Метеорный дождь' }, emoji: '☄️' },
    { id: 'cyber-purple', label: { tr: 'Siber',           en: 'Cyber',         ru: 'Кибер'      }, emoji: '✨' },
    { id: 'matrix-purple',label: { tr: 'Matrix',          en: 'Matrix',        ru: 'Матрица'    }, emoji: '💻' },
    { id: 'stardust',     label: { tr: 'Yıldız tozu',     en: 'Stardust',      ru: 'Звёздная пыль' }, emoji: '✨' },
    { id: 'supernova',    label: { tr: 'Süpernova',       en: 'Supernova',     ru: 'Сверхновая' }, emoji: '💥' },
  ],
};

/* -----------------------------------------------------------------
 * DİLLER
 * ----------------------------------------------------------------- */
const LANGS = {
  tr: { label: 'Türkçe',   flag: '🇹🇷' },
  en: { label: 'English',  flag: '🇬🇧' },
  ru: { label: 'Русский',  flag: '🇷🇺' },
};

/* Çeviriler — data-i18n="key" attribute'una göre uygulanır. */
const I18N = {
  // NAV
  'nav.home':       { tr: 'Ana Sayfa',         en: 'Home',              ru: 'Главная' },
  'nav.rules':      { tr: 'Kurallar',          en: 'Rules',             ru: 'Правила' },
  'nav.authority':  { tr: 'Yetki Listesi',     en: 'Authority',         ru: 'Права' },
  'nav.leaderboard':{ tr: 'Liderlik Tablosu',  en: 'Leaderboard',       ru: 'Лидерборд' },
  'nav.bans':       { tr: 'Yasaklama',         en: 'Bans',              ru: 'Баны' },
  'nav.skins':      { tr: 'Kaplamalar',        en: 'Skins',             ru: 'Скины' },
  'nav.admins':     { tr: 'Yöneticiler',       en: 'Admins',            ru: 'Админы' },

  // HERO (index)
  'hero.badge':     { tr: 'CS2 Topluluk Sunucuları', en: 'CS2 Community Servers', ru: 'Сообщество CS2' },
  'hero.greeting':  { tr: 'Hoş Geldin,',       en: 'Welcome,',          ru: 'Добро пожаловать,' },
  'hero.name':      { tr: 'MAD Topluluğu',     en: 'MAD Community',     ru: 'Сообщество MAD' },
  'hero.sub':       { tr: 'Kaliteli oyun deneyimi için seçtiğin sunucuya katıl. Rekabetçi, eğlenceli ve adil oyun ortamı.',
                      en: 'Join the server that fits you. Competitive, fun, fair.',
                      ru: 'Присоединяйся к серверу. Соревновательно, весело и честно.' },

  // Server card labels
  'srv.mode':       { tr: 'Mod',               en: 'Mode',              ru: 'Режим' },
  'srv.map':        { tr: 'Harita',            en: 'Map',               ru: 'Карта' },
  'srv.online':     { tr: 'Çevrimiçi',         en: 'Online',            ru: 'Онлайн' },
  'srv.offline':    { tr: 'Çevrimdışı',        en: 'Offline',           ru: 'Оффлайн' },
  'srv.connect':    { tr: 'Sunucuya Bağlan',   en: 'Connect',           ru: 'Подключиться' },
  'srv.copy_tip':   { tr: 'Kopyalamak için tıkla', en: 'Click to copy', ru: 'Нажмите чтобы скопировать' },

  // Ban page
  'ban.title':      { tr: 'Yasaklama Listesi', en: 'Ban List',          ru: 'Список банов' },
  'ban.subtitle':   { tr: 'Sunucularımızdaki aktif ve geçmiş cezalar', en: 'Active and past punishments on our servers', ru: 'Активные и прошедшие наказания на наших серверах' },
  'ban.search_ph':  { tr: 'Oyuncu ara...',     en: 'Search player...',  ru: 'Поиск игрока...' },
  'ban.stats':      { tr: 'Ceza İstatistikleri', en: 'Punishment Stats', ru: 'Статистика наказаний' },
  'ban.total':      { tr: 'Toplam Ceza',       en: 'Total',             ru: 'Всего' },
  'ban.bans':       { tr: 'Banlar',            en: 'Bans',              ru: 'Баны' },
  'ban.kicks':      { tr: 'Kicks',             en: 'Kicks',             ru: 'Кики' },
  'ban.mutes':      { tr: 'Susturmalar',       en: 'Mutes',             ru: 'Молчание' },
  'ban.admin_stats':{ tr: 'Yetkili Ban Sayıları', en: 'Admin Ban Counts', ru: 'Баны по админам' },
  'ban.server_lbl': { tr: 'Sunucu:',           en: 'Server:',           ru: 'Сервер:' },
  'ban.tab_all':    { tr: 'Tümü',              en: 'All',               ru: 'Все' },
  'ban.tab_ban':    { tr: 'Banlar',            en: 'Bans',              ru: 'Баны' },
  'ban.tab_kick':   { tr: 'Kicks',             en: 'Kicks',             ru: 'Кики' },
  'ban.tab_mute':   { tr: 'Susturmalar',       en: 'Mutes',             ru: 'Молчание' },
  'ban.h_type':     { tr: 'Tip',               en: 'Type',              ru: 'Тип' },
  'ban.h_player':   { tr: 'Oyuncu',            en: 'Player',            ru: 'Игрок' },
  'ban.h_action':   { tr: 'İşlem',             en: 'Action',            ru: 'Действие' },
  'ban.h_duration': { tr: 'Süre',              en: 'Duration',          ru: 'Срок' },
  'ban.h_admin':    { tr: 'Yetkili',           en: 'Admin',             ru: 'Админ' },
  'ban.h_server':   { tr: 'Sunucu',            en: 'Server',            ru: 'Сервер' },

  // Yetki başvuru
  'apply.title':    { tr: 'Yetkili Başvurusu', en: 'Apply for Admin',   ru: 'Заявка на админа' },
  'apply.sub':      { tr: 'MAD yetkili ekibine katılmak için başvuru formu doldur — Discord\'a düşer, ekip inceler',
                      en: 'Fill the form to join the MAD admin team — sent to Discord for review',
                      ru: 'Заполните форму, чтобы стать админом MAD — отправится в Discord' },
  'apply.btn':      { tr: 'Başvuru Formunu Aç', en: 'Open Application',  ru: 'Открыть форму' },

  // Prefs panel
  'pref.theme':     { tr: 'Tema',              en: 'Theme',             ru: 'Тема' },
  'pref.effect':    { tr: 'Arka plan',         en: 'Background',        ru: 'Фон' },
  'pref.lang':      { tr: 'Dil',               en: 'Language',          ru: 'Язык' },

  // Footer
  'footer.rights':  { tr: 'MAD © 2026',         en: 'MAD © 2026',        ru: 'MAD © 2026' },
};

const PREF_KEY = 'mad_prefs';
const DEFAULTS = { theme: 'red', effect: 'off', lang: 'tr' };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw);
    return {
      theme: THEMES[p.theme] ? p.theme : DEFAULTS.theme,
      effect: p.effect || DEFAULTS.effect,
      lang: LANGS[p.lang] ? p.lang : DEFAULTS.lang,
    };
  } catch { return { ...DEFAULTS }; }
}
function savePrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}

/* -----------------------------------------------------------------
 * TEMA UYGULAMA
 * ----------------------------------------------------------------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/* -----------------------------------------------------------------
 * EFEKT UYGULAMA
 * ----------------------------------------------------------------- */
function applyEffect(theme, effectId) {
  // Ana lava-bg elementini bul veya oluştur
  let bg = document.querySelector('.lava-bg');
  if (!bg) return;

  // Efekt katmanını yönet
  let fx = document.querySelector('.fx-layer');
  if (!fx) {
    fx = document.createElement('div');
    fx.className = 'fx-layer';
    document.body.insertBefore(fx, document.body.firstChild);
  }
  fx.innerHTML = '';
  fx.className = 'fx-layer fx-' + effectId;

  if (effectId === 'off' || !effectId) return;

  // Efekt tiplerine göre partikül üret
  const config = {
    // Kırmızı tema
    ashes:        { count: 40, cls: 'p-ash' },
    firerain:     { count: 25, cls: 'p-firedrop' },
    'cyber-red':  { count: 60, cls: 'p-cyber-r' },
    'matrix-red': { count: 15, cls: 'p-matrix-r', text: true },
    sparks:       { count: 35, cls: 'p-spark' },
    'stars-red':  { count: 50, cls: 'p-star-r' },
    // Mavi
    snow:         { count: 60, cls: 'p-snow' },
    rain:         { count: 40, cls: 'p-raindrop' },
    'cyber-blue': { count: 60, cls: 'p-cyber-b' },
    'matrix-blue':{ count: 15, cls: 'p-matrix-b', text: true },
    fireflies:    { count: 30, cls: 'p-firefly' },
    'stars-blue': { count: 50, cls: 'p-star-b' },
    // Mor
    dust:         { count: 50, cls: 'p-dust' },
    meteor:       { count: 12, cls: 'p-meteor' },
    'cyber-purple':{ count: 60, cls: 'p-cyber-p' },
    'matrix-purple':{ count: 15, cls: 'p-matrix-p', text: true },
    stardust:     { count: 55, cls: 'p-stardust' },
    supernova:    { count: 8,  cls: 'p-supernova' },
  }[effectId];

  if (!config) return;

  const glyphs = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%*';
  for (let i = 0; i < config.count; i++) {
    const p = document.createElement('div');
    p.className = 'fx-particle ' + config.cls;
    p.style.left = (Math.random() * 100) + '%';
    p.style.setProperty('--d', (Math.random() * 8 + 4) + 's');
    p.style.setProperty('--dl', (-Math.random() * 8) + 's');
    p.style.setProperty('--x', (Math.random() * 40 - 20) + 'vw');
    p.style.setProperty('--s', (Math.random() * 0.6 + 0.7));
    if (config.text) {
      const chars = 8 + Math.floor(Math.random() * 12);
      let txt = '';
      for (let j = 0; j < chars; j++) txt += glyphs[Math.floor(Math.random() * glyphs.length)] + '\n';
      p.textContent = txt.trim();
    }
    fx.appendChild(p);
  }
}

/* -----------------------------------------------------------------
 * DİL UYGULAMA
 * ----------------------------------------------------------------- */
function t(key, lang) {
  return I18N[key]?.[lang] ?? I18N[key]?.tr ?? key;
}
function setTextPreserve(el, newText) {
  const txt = [...el.childNodes].reverse().find(n => n.nodeType === 3 && n.nodeValue.trim());
  if (txt) txt.nodeValue = newText;
  else el.appendChild(document.createTextNode(newText));
}

/* === OTOMATİK ÇEVİRİ HARİTASI ===
 * Anahtar: sayfada gözüken Türkçe metin (tam eşleşme, tırnak/nokta dahil).
 * Değer: { en, ru } çevirileri. Kayıt yoksa metin TR olarak kalır. */
const TRANSLATIONS = {
  // Nav
  'Ana Sayfa':        { en: 'Home', ru: 'Главная' },
  'Kurallar':         { en: 'Rules', ru: 'Правила' },
  'Yetki Listesi':    { en: 'Authority', ru: 'Права' },
  'Liderlik Tablosu': { en: 'Leaderboard', ru: 'Лидерборд' },
  'Yasaklama':        { en: 'Bans', ru: 'Баны' },
  'Kaplamalar':       { en: 'Skins', ru: 'Скины' },
  'Yöneticiler':      { en: 'Admins', ru: 'Админы' },

  // Index — hero
  'CS2 Topluluk Sunucuları': { en: 'CS2 Community Servers', ru: 'Сообщество CS2' },
  'Hoş Geldin,':      { en: 'Welcome,', ru: 'Добро пожаловать,' },
  'MAD Topluluğu':    { en: 'MAD Community', ru: 'Сообщество MAD' },
  'Kaliteli oyun deneyimi için seçtiğin sunucuya katıl. Rekabetçi, eğlenceli ve adil oyun ortamı.':
    { en: 'Join the server that fits you — competitive, fun, and fair gameplay.',
      ru: 'Присоединяйся к серверу — соревновательно, весело и честно.' },
  "Discord'a katıl":  { en: 'Join Discord', ru: 'Discord' },

  // Sunucu kartları
  'AWP Lego':         { en: 'AWP Lego', ru: 'AWP Lego' },
  'AIM Pistol':       { en: 'AIM Pistol', ru: 'AIM Pistol' },
  'AIM Redline':      { en: 'AIM Redline', ru: 'AIM Redline' },
  'Mod':              { en: 'Mode', ru: 'Режим' },
  'Harita':           { en: 'Map', ru: 'Карта' },
  'AWP Only':         { en: 'AWP Only', ru: 'Только AWP' },
  'Pistol Only':      { en: 'Pistol Only', ru: 'Только пистолет' },
  'Headshot Only':    { en: 'Headshot Only', ru: 'Только хедшот' },
  'Çevrimiçi':        { en: 'Online', ru: 'Онлайн' },
  'Çevrimdışı':       { en: 'Offline', ru: 'Оффлайн' },
  'Sunucuya Bağlan':  { en: 'Connect', ru: 'Подключиться' },
  'Kopyalamak için tıkla': { en: 'Click to copy', ru: 'Нажмите чтобы скопировать' },
  'Kopyala':          { en: 'Copy', ru: 'Копировать' },
  'Kopyalandı ✓':     { en: 'Copied ✓', ru: 'Скопировано ✓' },
  'Panoya kopyalandı':{ en: 'Copied to clipboard', ru: 'Скопировано в буфер' },

  // Footer
  'MAD © 2026':       { en: 'MAD © 2026', ru: 'MAD © 2026' },
  "Discord'dan da yanındayız": { en: "We're on Discord too", ru: 'Мы также в Discord' },
  'MAD bağımsız bir topluluk / hayran projesidir. Counter-Strike 2, CS2 ve ilgili tüm ticari markalar © Valve Corporation\'a aittir. Bu site Valve ile resmi bir bağlantıya sahip değildir, ticari bir amaç gütmez ve yalnızca topluluğu tanıtma ile bilgilendirme amacı taşır. Kaplama görselleri açık kaynaklı ByMykel CS2 API üzerinden alınmıştır.':
    { en: 'MAD is an independent community / fan project. Counter-Strike 2, CS2 and all related trademarks © Valve Corporation. This site has no official affiliation with Valve, is non-commercial, and exists purely for community promotion and information. Skin images are sourced from the open-source ByMykel CS2 API.',
      ru: 'MAD — независимый общественный / фан-проект. Counter-Strike 2, CS2 и все связанные торговые марки © Valve Corporation. Сайт не имеет официальной связи с Valve, не является коммерческим и создан исключительно для продвижения и информирования сообщества. Изображения скинов взяты из открытого API ByMykel CS2.' },
  'MAD, Counter-Strike 2 topluluğuna ait bağımsız bir oyun sunucusu tanıtım ve bilgilendirme sitesidir. Valve Corporation ile resmî bir bağı yoktur. Counter-Strike, CS2 ve ilgili tüm ticari markalar Valve Corporation\'a aittir. Silah ve kaplama görselleri Steam / Valve\'a aittir ve yalnızca bilgilendirme amacıyla gösterilmektedir. Bu sitede satış yapılmamaktadır.':
    { en: 'MAD is an independent CS2 community game server promotion and info site. It has no official affiliation with Valve Corporation. Counter-Strike, CS2 and all related trademarks belong to Valve. Weapon and skin images belong to Steam / Valve and are shown only for informational purposes. Nothing is sold on this site.',
      ru: 'MAD — независимый сайт продвижения и информации о серверах сообщества CS2. Не имеет официальной связи с Valve Corporation. Counter-Strike, CS2 и все связанные торговые марки принадлежат Valve. Изображения оружия и скинов принадлежат Steam / Valve и показаны только в информационных целях. Продажи на сайте не ведутся.' },

  // Yasaklama sayfası
  'Yasaklama Listesi': { en: 'Ban List', ru: 'Список банов' },
  'Sunucularımızdaki aktif ve geçmiş cezalar': { en: 'Active and past punishments on our servers', ru: 'Активные и прошедшие наказания на наших серверах' },
  'Oyuncu ara...':    { en: 'Search player...', ru: 'Поиск игрока...' },
  'Ceza İstatistikleri': { en: 'Punishment Stats', ru: 'Статистика наказаний' },
  'Toplam Ceza':      { en: 'Total', ru: 'Всего' },
  'Banlar':           { en: 'Bans', ru: 'Баны' },
  'Kicks':            { en: 'Kicks', ru: 'Кики' },
  'Susturmalar':      { en: 'Mutes', ru: 'Молчание' },
  'Yetkili Ban Sayıları': { en: 'Admin Ban Counts', ru: 'Баны по админам' },
  'Yükleniyor…':      { en: 'Loading…', ru: 'Загрузка…' },
  'Sunucu:':          { en: 'Server:', ru: 'Сервер:' },
  'Tümü':             { en: 'All', ru: 'Все' },
  'Tip':              { en: 'Type', ru: 'Тип' },
  'Oyuncu':           { en: 'Player', ru: 'Игрок' },
  'İşlem':            { en: 'Action', ru: 'Действие' },
  'Süre':             { en: 'Duration', ru: 'Срок' },
  'Yetkili':          { en: 'Admin', ru: 'Админ' },
  'Sunucu':           { en: 'Server', ru: 'Сервер' },
  'Yasaklama kayıtları yükleniyor…': { en: 'Loading ban records…', ru: 'Загрузка записей...' },
  'Yasaklama verisi yüklenemedi.':   { en: 'Failed to load ban data.', ru: 'Не удалось загрузить данные.' },
  'Filtreye uygun kayıt yok.':       { en: 'No records match this filter.', ru: 'Нет записей по фильтру.' },
  'Kalıcı':           { en: 'Permanent', ru: 'Навсегда' },
  'Veri yok':         { en: 'No data', ru: 'Нет данных' },

  // Kurallar (header)
  '📜 Sunucu Kuralları': { en: '📜 Server Rules', ru: '📜 Правила сервера' },
  'MAD sunucularında adil ve keyifli bir oyun için lütfen aşağıdaki kurallara uy':
    { en: 'Please follow these rules for fair and enjoyable gameplay on MAD servers',
      ru: 'Пожалуйста, соблюдайте эти правила для справедливой и приятной игры на серверах MAD' },
  'Genel Kurallar':   { en: 'General Rules', ru: 'Общие правила' },
  'Sohbet Kuralları': { en: 'Chat Rules', ru: 'Правила чата' },
  'AWP Kuralları':    { en: 'AWP Rules', ru: 'Правила AWP' },
  'AIM Kuralları':    { en: 'AIM Rules', ru: 'Правила AIM' },
  'Yetkili Kuralları':{ en: 'Admin Rules', ru: 'Правила админов' },

  // Yetki sayfası
  '👑 Yetki Listesi': { en: '👑 Authority List', ru: '👑 Список прав' },
  'Tüm sunucularda geçerli yetkiler ve ayrıcalıklar': { en: 'Authorities and perks valid on all servers', ru: 'Права и привилегии на всех серверах' },
  '30 Günlük':        { en: '30 Days', ru: '30 дней' },
  '90 Günlük':        { en: '90 Days', ru: '90 дней' },
  '/ 30 gün':         { en: '/ 30 days', ru: '/ 30 дн.' },
  '/ 90 gün':         { en: '/ 90 days', ru: '/ 90 дн.' },
  'En Üst Yetki':     { en: 'Top Authority', ru: 'Высшие права' },
  'Boss of MAD':      { en: 'Boss of MAD', ru: 'Boss of MAD' },
  'Tam Yetki':        { en: 'Full Authority', ru: 'Полные права' },
  'MAD?':             { en: 'MAD?', ru: 'MAD?' },
  'Yönetim':          { en: 'Management', ru: 'Менеджмент' },
  'Yönetim Ekibi':    { en: 'Management Team', ru: 'Команда менеджеров' },
  'Admin':            { en: 'Admin', ru: 'Админ' },
  'Yardımcı':         { en: 'Helper', ru: 'Помощник' },
  'Premium':          { en: 'Premium', ru: 'Premium' },
  "Discord'dan İletişime Geç": { en: 'Contact on Discord', ru: 'Связаться в Discord' },

  // Yönetici sayfası
  'MAD sunucu yönetim ekibi': { en: 'MAD server management team', ru: 'Команда управления MAD' },
  '💻 Geliştirici':   { en: '💻 Developer', ru: '💻 Разработчик' },
  '👑 Kurucu':        { en: '👑 Founder', ru: '👑 Основатель' },
  '🛡️ Sunucu Sorumluları': { en: '🛡️ Server Managers', ru: '🛡️ Менеджеры серверов' },
  'Kurucu':           { en: 'Founder', ru: 'Основатель' },
  'Sunucu Sorumlusu': { en: 'Server Manager', ru: 'Менеджер сервера' },
  'Geliştirici':      { en: 'Developer', ru: 'Разработчик' },

  // Yetkili başvuru
  'Yetkili Başvurusu': { en: 'Admin Application', ru: 'Заявка на админа' },
  "MAD yetkili ekibine katılmak için başvuru formu doldur — Discord'a düşer, ekip inceler":
    { en: "Fill the form to join MAD's admin team — it goes to Discord for review",
      ru: 'Заполните форму, чтобы стать админом MAD — отправится в Discord' },
  'Başvuru Formunu Aç': { en: 'Open Application Form', ru: 'Открыть форму' },
  '+16 yaş':          { en: '+16 age', ru: 'от 16 лет' },
  'zorunlu':          { en: 'required', ru: 'обязательно' },
  'Mikrofon':         { en: 'Microphone', ru: 'Микрофон' },
  'Kuralları okumuş': { en: 'Rules read', ru: 'Правила прочитаны' },
  'olmak':            { en: '', ru: '' },
  'Sunucuda en az':   { en: 'Server rank at least', ru: 'Ранг на сервере минимум' },
  'rankı':            { en: '', ru: '' },
  '🇹🇷 MAD? Yetkili Başvuru Formu': { en: '🇹🇷 MAD? Admin Application Form', ru: '🇹🇷 MAD? Заявка на админа' },
  "Tüm alanlar zorunludur. Gönderim sonrası Discord'daki başvuru kanalına düşer.":
    { en: "All fields required. Sends to the admin application channel on Discord after submit.",
      ru: 'Все поля обязательны. Отправляется в канал заявок Discord.' },
  'Hangi sunucu için başvuruyorsun?': { en: 'Which server are you applying for?', ru: 'На какой сервер подаёшь заявку?' },
  'İsim':             { en: 'Name', ru: 'Имя' },
  'Yaş':              { en: 'Age', ru: 'Возраст' },
  '16+':              { en: '16+', ru: '16+' },
  'Nickname':         { en: 'Nickname', ru: 'Никнейм' },
  'Steam profil linki': { en: 'Steam profile link', ru: 'Ссылка Steam' },
  'Hesabında kaç saat CS2 var?': { en: 'How many CS2 hours?', ru: 'Часов в CS2?' },
  'Saat cinsinden':   { en: 'In hours', ru: 'В часах' },
  'Sunucudaki rankın': { en: 'Your rank on server', ru: 'Твой ранг' },
  'Seç…':             { en: 'Select…', ru: 'Выбрать…' },
  'Silver':           { en: 'Silver', ru: 'Silver' },
  'Nova':             { en: 'Nova', ru: 'Nova' },
  'MG':               { en: 'MG', ru: 'MG' },
  'DMG':              { en: 'DMG', ru: 'DMG' },
  'LE / LEM':         { en: 'LE / LEM', ru: 'LE / LEM' },
  'SMFC':             { en: 'SMFC', ru: 'SMFC' },
  'Global Elite':     { en: 'Global Elite', ru: 'Global Elite' },
  'TW (True Wallhack) bakmayı biliyor musun?': { en: 'Can you use TW (True Wallhack)?', ru: 'Умеешь пользоваться TW (True Wallhack)?' },
  'Evet':             { en: 'Yes', ru: 'Да' },
  'Hayır':            { en: 'No', ru: 'Нет' },
  'Hesabın Prime (seçkin) mi?': { en: 'Is your account Prime?', ru: 'У тебя Prime?' },
  'Seçkin':           { en: 'Prime', ru: 'Prime' },
  'Seçkin değil':     { en: 'Non-Prime', ru: 'Не Prime' },
  'Günlük kaç saat sunucuda aktif olabilirsin?': { en: 'How many hours per day can you be active?', ru: 'Сколько часов в день можешь быть активным?' },
  'En az':            { en: 'Min', ru: 'Мин.' },
  'En çok':           { en: 'Max', ru: 'Макс.' },
  'saat / gün':       { en: 'hours / day', ru: 'ч / день' },
  'Okul/iş zamanında sunucuya giriş sağlayabilir misin?': { en: 'Can you log in during school/work hours?', ru: 'Заходишь ли ты во время учёбы/работы?' },
  'Örn: okuldan sonra 4-8 arası, hafta sonu tam gün': { en: 'e.g. after school 4-8pm, all day on weekends', ru: 'Напр.: после школы 16-20, в выходные весь день' },
  'Mikrofonun var mı?': { en: 'Do you have a mic?', ru: 'Есть ли микрофон?' },
  'Daha önce bir sunucuda yetkili oldun mu?': { en: 'Have you been an admin before?', ru: 'Был ли ты админом раньше?' },
  'Yetkili komutlarına hakim misin? Kısaca anlat:': { en: 'Do you know admin commands? Explain briefly:', ru: 'Знаешь команды админа? Кратко:' },
  'Örn: sm_ban, sm_kick, sm_gag, sm_mute kullanabilirim...': { en: 'e.g. I can use sm_ban, sm_kick, sm_gag, sm_mute...', ru: 'Напр.: могу использовать sm_ban, sm_kick, sm_gag, sm_mute...' },
  'Kuralları':        { en: 'the Rules', ru: 'Правила' },
  'okudum ve kabul ediyorum': { en: "I have read and accept", ru: 'я прочитал и принимаю' },
  'Vazgeç':           { en: 'Cancel', ru: 'Отмена' },
  'Başvuruyu Gönder': { en: 'Submit Application', ru: 'Отправить заявку' },
  'Gönderiliyor…':    { en: 'Sending…', ru: 'Отправка…' },
  "Başvurun gönderildi, ekip Discord'dan görecek": { en: 'Application sent — team will see it on Discord', ru: 'Заявка отправлена — команда увидит в Discord' },

  // Toast / hata mesajları
  'Bir sorun oluştu. Biraz sonra tekrar dene.': { en: 'Something went wrong. Please try again.', ru: 'Что-то пошло не так. Попробуйте позже.' },
  'Yaş en az 16 olmalı.': { en: 'Age must be at least 16.', ru: 'Возраст должен быть не менее 16.' },
  'Bir sunucu seç.':  { en: 'Select a server.', ru: 'Выбери сервер.' },
  'Kuralları okuduğunu kabul etmen gerek.': { en: 'You must accept the rules.', ru: 'Нужно принять правила.' },
  'En az saat, en çok saatten büyük olamaz.': { en: 'Min hours cannot exceed max hours.', ru: 'Мин. часы не могут быть больше макс.' },
  'Geçerli bir Steam profil linki gir.': { en: 'Enter a valid Steam profile URL.', ru: 'Введите корректную ссылку Steam.' },
  'Çok sık gönderim. 1 dakika bekle.': { en: 'Too many submissions. Wait 1 minute.', ru: 'Слишком часто. Подождите минуту.' },

  // Prefs
  'Tema':             { en: 'Theme', ru: 'Тема' },
  'Arka plan':        { en: 'Background', ru: 'Фон' },
  'Dil':              { en: 'Language', ru: 'Язык' },

  // Yasaklama — footer notu
  'ceza kaydı gösteriliyor. Veri kaynağı: Discord log kanallarından otomatik toplanır.':
    { en: 'punishment records shown. Data source: collected automatically from Discord log channels.',
      ru: 'записей показано. Источник: автоматически собирается из каналов логов Discord.' },

  // === KURALLAR SAYFASI ===
  'Sunucu Kuralları': { en: 'Server Rules', ru: 'Правила сервера' },
  'MAD Oyuncu Topluluğu — Discord ve oyun içi kurallar': { en: 'MAD Player Community — Discord & in-game rules', ru: 'Сообщество MAD — правила Discord и игры' },
  'Genel Davranış':   { en: 'General Conduct', ru: 'Поведение' },
  'İçerik ve Paylaşım': { en: 'Content & Sharing', ru: 'Контент' },
  'Kimlik ve Hesap':  { en: 'Identity & Account', ru: 'Аккаунт' },
  'Discord':          { en: 'Discord', ru: 'Discord' },
  'Oyun İçi':         { en: 'In-Game', ru: 'В игре' },
  'Yetkili ve Panel': { en: 'Admin & Panel', ru: 'Админ и панель' },
  'Genel Davranış Kuralları': { en: 'General Conduct Rules', ru: 'Правила поведения' },
  'Sunucuda saygısızlık yapmak yasaktır.': { en: 'Disrespect on the server is forbidden.', ru: 'Неуважение на сервере запрещено.' },
  'Spam ve flood atarak mesaj yazmak yasaktır.': { en: 'Spamming and flooding messages is forbidden.', ru: 'Спам и флуд запрещены.' },
  'Siyaset, din, dil, ırk vb. konuları açıp konuşmak yasaktır.': { en: 'Discussing politics, religion, language, race etc. is forbidden.', ru: 'Обсуждение политики, религии, языка, расы и т.п. запрещено.' },
  'Küfür, argo ve ağır hakaret söylemleri yasaktır.': { en: 'Swearing, slang and heavy insults are forbidden.', ru: 'Мат, сленг и тяжёлые оскорбления запрещены.' },
  'Yaş veya cinsiyet ile dalga geçmek yasaktır.': { en: 'Mocking age or gender is forbidden.', ru: 'Насмешки над возрастом или полом запрещены.' },
  'Rahatsızlık vermek ve zorbalamak yasaktır.': { en: 'Harassment and bullying are forbidden.', ru: 'Домогательства и буллинг запрещены.' },
  'İnsanların değer saydığı değerlere saygısızlık göstermek yasaktır.': { en: 'Disrespecting values people hold dear is forbidden.', ru: 'Неуважение к ценностям людей запрещено.' },
  'Tüm sohbet kanallarında Caps Lock açık yazmak yasaktır.': { en: 'Writing in Caps Lock in all chat channels is forbidden.', ru: 'Писать капсом во всех чатах запрещено.' },
  'Belirli bir kişinin şahsına karşı istemediği davranışlarda bulunmak yasaktır.': { en: 'Unwanted behavior targeting a specific person is forbidden.', ru: 'Нежелательные действия против конкретного человека запрещены.' },
  'Sunucu içerisinde sesli veya yazılı şekilde tartışmak ve kavga etmek yasaktır.': { en: 'Arguing or fighting via voice or text on the server is forbidden.', ru: 'Ссоры и конфликты в голосе или чате запрещены.' },
  'Rol almak için ısrar etmek veya yalvarmak yasaktır.': { en: 'Insisting or begging for roles is forbidden.', ru: 'Выпрашивать роли запрещено.' },
  'İçerik ve Paylaşım Kuralları': { en: 'Content & Sharing Rules', ru: 'Правила контента' },
  'Özelden, sunucudan, isimden veya başka yollardan reklam yapmak yasaktır.': { en: 'Advertising via DM, server, nickname or any other way is forbidden.', ru: 'Реклама в ЛС, на сервере, в нике и любым способом запрещена.' },
  'Discord linki, satış linki, çekiliş linki vb. linkler paylaşmak yasaktır.': { en: 'Sharing Discord links, sale links, giveaway links etc. is forbidden.', ru: 'Публикация ссылок Discord, продаж, розыгрышей и т.п. запрещена.' },
  'Pornografik, cinsel içerikli veya +18 içerikler paylaşmak yasaktır.': { en: 'Sharing pornographic, sexual or +18 content is forbidden.', ru: 'Публикация порнографии и контента 18+ запрещена.' },
  'Kan, vahşet vb. içerikli fotoğraf, video veya metin paylaşmak yasaktır.': { en: 'Sharing gore or violent photos, videos or text is forbidden.', ru: 'Публикация жестокого контента запрещена.' },
  'Kimlik ve Hesap Kuralları': { en: 'Identity & Account Rules', ru: 'Правила аккаунта' },
  'Sahte nick, isim veya yaş yazdırmak yasaktır.': { en: 'Fake nicknames, names or ages are forbidden.', ru: 'Фальшивые ники, имена и возраст запрещены.' },
  'Etiketlenemeyen ve boş nicklerin kullanımı yasaktır.': { en: 'Untaggable or empty nicknames are forbidden.', ru: 'Пустые или нетегируемые ники запрещены.' },
  'Dolandırıcılık yapmak yasaktır.': { en: 'Scamming is forbidden.', ru: 'Мошенничество запрещено.' },
  'Hesap alımı-satımının her türlü kategorisi yasaktır.': { en: 'Buying/selling accounts in any form is forbidden.', ru: 'Покупка/продажа аккаунтов запрещена.' },
  'Discord Sunucusu Kuralları': { en: 'Discord Server Rules', ru: 'Правила Discord' },
  'Kanalları amacı dışında kullanmak, sunucuyu herhangi bir açıdan trollemek yasaktır.': { en: 'Misusing channels or trolling the server in any way is forbidden.', ru: 'Использование каналов не по назначению и троллинг запрещены.' },
  'Etiket yoluyla kullanıcıları veya yetkilileri rahatsız etmek yasaktır.': { en: 'Disturbing users or staff via mentions is forbidden.', ru: 'Беспокоить пользователей и админов упоминаниями запрещено.' },
  'Sesli kanallarda bağırmak, mikrofonla gürültü çıkarmak yasaktır.': { en: 'Screaming or making noise with the mic in voice channels is forbidden.', ru: 'Кричать и шуметь в голосовых каналах запрещено.' },
  'Mesajlara anlamsız, alaycı veya boş tepki (emoji reaction) eklemek yasaktır.': { en: 'Adding meaningless, mocking or empty emoji reactions is forbidden.', ru: 'Бессмысленные и насмешливые реакции запрещены.' },
  'Kurucuları ve yönetim ekibini gereksiz yere etiketlemek veya rahatsız etmek yasaktır.': { en: 'Unnecessarily mentioning or disturbing founders and management is forbidden.', ru: 'Беспокоить основателей и менеджмент без причины запрещено.' },
  'Sesli kanallarda ses değiştirici (soundboard) ile spam yapmak yasaktır.': { en: 'Spamming with soundboards in voice channels is forbidden.', ru: 'Спам саундбордом в голосовых каналах запрещён.' },
  'Onaysız/yetkisiz bot çağırmak veya bot üzerinden spam yapmak yasaktır.': { en: 'Inviting unauthorized bots or spamming via bots is forbidden.', ru: 'Неавторизованные боты и спам через ботов запрещены.' },
  'Sesli kanallarda müzik açıp diğer üyeleri rahatsız etmek yasaktır.': { en: 'Playing music in voice channels and disturbing members is forbidden.', ru: 'Включать музыку в голосовых каналах запрещено.' },
  'Oyun İçi Kuralları': { en: 'In-Game Rules', ru: 'Игровые правила' },
  'Her türlü hile (aimbot, wallhack, trigger, script vb.) kullanmak kalıcı ban sebebidir.': { en: 'Any cheat (aimbot, wallhack, trigger, script etc.) results in a permanent ban.', ru: 'Любые читы (aimbot, wallhack, trigger, script) — перманентный бан.' },
  'Takım arkadaşına bilerek zarar vermek (team damage, team kill, team flash) yasaktır.': { en: 'Intentionally harming teammates (team damage, team kill, team flash) is forbidden.', ru: 'Намеренный вред тиммейтам (урон, килл, флеш) запрещён.' },
  'Sunucu modu dışında silah kullanmak (ör. AWP sunucusunda başka silah) yasaktır.': { en: 'Using weapons outside the server mode (e.g. non-AWP guns on AWP server) is forbidden.', ru: 'Оружие вне режима сервера (напр. не-AWP на AWP) запрещено.' },
  'Sesli sohbette müzik açmak, ses efekti (soundboard) çalmak yasaktır.': { en: 'Playing music or soundboard effects in voice chat is forbidden.', ru: 'Музыка и саундборд в голосовом чате запрещены.' },
  'Rakip takımın veya kendi takımının pozisyonunu düşman tarafa bildirmek (spy) yasaktır.': { en: 'Revealing team positions to the enemy (spying) is forbidden.', ru: 'Сообщать позиции команды врагу (spy) запрещено.' },
  'Sunucudaki yetkilileri şikayet için Discord kullanılmalı, oyun içi sohbet değil.': { en: 'Use Discord to report admins, not in-game chat.', ru: 'Жалобы на админов — через Discord, не в игровом чате.' },
  'Kontrol talebini reddetmek, kontrolden kaçmak veya çıkış yapmak yasaktır.': { en: 'Refusing, avoiding or leaving during a check is forbidden.', ru: 'Отказ от проверки или выход во время неё запрещены.' },
  'Kasıtlı olarak yüksek pingle veya lag ile oynayarak sunucuyu bozmak yasaktır.': { en: 'Intentionally playing with high ping or lag to disrupt the server is forbidden.', ru: 'Намеренная игра с высоким пингом/лагами запрещена.' },
  'Sunucuda geçerli olan mod / harita dışına çıkmaya çalışmak (bug abuse) yasaktır.': { en: 'Trying to escape the mode/map boundaries (bug abuse) is forbidden.', ru: 'Выход за пределы режима/карты (bug abuse) запрещён.' },
  'Oyunda ırkçı, ayrımcı, cinsiyetçi ve nefret söylemi içeren ifadeler kalıcı ban sebebidir.': { en: 'Racist, discriminatory, sexist or hateful expressions result in a permanent ban.', ru: 'Расизм, дискриминация, сексизм и язык вражды — перманентный бан.' },
  'Hile programı çalıştıran arkadaş / stream izlemek de dahil olmak üzere hileye ortam sağlamak yasaktır.': { en: 'Enabling cheating in any way, including watching a cheating friend/stream, is forbidden.', ru: 'Содействие читерству, включая просмотр читерского стрима, запрещено.' },
  'Yetkili ve Panel Kuralları': { en: 'Admin & Panel Rules', ru: 'Правила админов' },
  'Yetkililere tanınan panel erişiminin amacı dışında veya kötüye kullanılması yasaktır.': { en: 'Misusing admin panel access is forbidden.', ru: 'Злоупотребление доступом к панели запрещено.' },
  'Oyunculara haksız yere ceza vermek, panel yetkisini şahsi husumet için kullanmak yasaktır.': { en: 'Punishing players unfairly or using panel powers for personal grudges is forbidden.', ru: 'Несправедливые наказания и личная месть через панель запрещены.' },
  'Yetkili, verdiği her cezanın gerekçesini kısaltmadan ve oyuncunun anlayabileceği şekilde belirtmekle yükümlüdür.': { en: 'Admins must state the full reason for every punishment in a way the player understands.', ru: 'Админ обязан полностью объяснять причину каждого наказания.' },
  'Yetkili, verdiği cezalara dair 3 gün içinde delil sunmakla yükümlüdür.': { en: 'Admins must provide evidence for punishments within 3 days.', ru: 'Админ обязан предоставить доказательства в течение 3 дней.' },
  'Sebepsiz yere oyuncu banlamak veya susturmak yasaktır.': { en: 'Banning or muting players without reason is forbidden.', ru: 'Бан или мут без причины запрещены.' },
  'Kendisi veya arkadaşları için oyun içi ceza/kilitleri kaldırmak yasaktır.': { en: 'Removing punishments/locks for yourself or friends is forbidden.', ru: 'Снимать наказания себе или друзьям запрещено.' },
  'Ceza itirazlarında oyuncular Discord üzerinden ticket açarak başvurmalıdır.': { en: 'Players must appeal punishments via Discord tickets.', ru: 'Апелляции — через тикеты в Discord.' },
  'Yetkililerin diğer yetkilileri gereksiz yere şikayet etmesi veya çekişmeye girmesi yasaktır.': { en: 'Admins unnecessarily reporting or feuding with other admins is forbidden.', ru: 'Конфликты и необоснованные жалобы между админами запрещены.' },
  "Yetkililer arasındaki sorunlar Discord'daki özel yetkili kanalında ele alınmalı, oyuncuların önünde tartışılmamalıdır.": { en: 'Admin disputes must be handled in the private admin channel on Discord, not in front of players.', ru: 'Споры админов — в приватном канале Discord, не при игроках.' },

  // === YETKİ SAYFASI — kart özellikleri ===
  'Tüm sunucularda': { en: 'On all servers', ru: 'На всех серверах' },
  'yetkisi':          { en: 'authority', ru: 'права' },
  'Tüm sunucuların panellerine sınırlı erişim': { en: 'Limited panel access on all servers', ru: 'Ограниченный доступ к панелям всех серверов' },
  'Mevcut tüm yetkilerin eksiksiz tamamı': { en: 'Every existing authority, complete', ru: 'Все существующие права полностью' },
  'Yeni gelecek tüm özellik ve pluginlere öncelikli erişim': { en: 'Priority access to all upcoming features and plugins', ru: 'Приоритетный доступ к новым функциям и плагинам' },
  'Ayrıcalıklı destek erişimi': { en: 'Privileged support access', ru: 'Привилегированная поддержка' },
  'Marketteki tüm Custom modellere sınırsız erişim': { en: 'Unlimited access to all Custom models in the market', ru: 'Безлимитный доступ ко всем Custom моделям' },
  'Tüm yetkiler — aklınıza gelebilecek her şey': { en: 'All authorities — everything you can imagine', ru: 'Все права — всё, что можно представить' },
  'Yeni gelecek pluginlere erken erişim': { en: 'Early access to upcoming plugins', ru: 'Ранний доступ к новым плагинам' },
  'Dokunulmazlık 100': { en: 'Immunity 100', ru: 'Иммунитет 100' },
  'Panele kısmi erişim': { en: 'Partial panel access', ru: 'Частичный доступ к панели' },
  'Bonus: 100 Kredi': { en: 'Bonus: 100 Credits', ru: 'Бонус: 100 кредитов' },
  'RCON hariç neredeyse tüm yetkiler': { en: 'Almost all authorities except RCON', ru: 'Почти все права, кроме RCON' },
  'Discord içi özel yetkiler (sustur, sağırlaştır, odalara atma/çekme)': { en: 'Special Discord powers (mute, deafen, move between rooms)', ru: 'Особые права Discord (мут, заглушение, перемещение)' },
  'Üst yönetim ekibinde her türlü organizasyona dahil olma': { en: 'Inclusion in all top-management organizations', ru: 'Участие во всех организациях топ-менеджмента' },
  'Dokunulmazlık 50': { en: 'Immunity 50', ru: 'Иммунитет 50' },
  'Bonus: 75 Kredi':  { en: 'Bonus: 75 Credits', ru: 'Бонус: 75 кредитов' },
  'Discord ve oyun içinde özel tag/rol': { en: 'Special tag/role on Discord and in-game', ru: 'Особый тег/роль в Discord и игре' },
  'Discord içi yönetim kadrosuna dahil olma': { en: 'Inclusion in Discord management staff', ru: 'Включение в штат менеджмента Discord' },
  'Premium yetkileri + ban, mute, unmute, gag': { en: 'Premium powers + ban, mute, unmute, gag', ru: 'Права Premium + ban, mute, unmute, gag' },
  'Dokunulmazlık 40': { en: 'Immunity 40', ru: 'Иммунитет 40' },
  'Bonus: 50 Kredi':  { en: 'Bonus: 50 Credits', ru: 'Бонус: 50 кредитов' },
  'Özel Tag':         { en: 'Special Tag', ru: 'Особый тег' },
  'kick, taser yetkileri': { en: 'kick, taser powers', ru: 'права kick, taser' },
  'Dokunulmazlık 35': { en: 'Immunity 35', ru: 'Иммунитет 35' },
  'Dokunulmazlık 30': { en: 'Immunity 30', ru: 'Иммунитет 30' },
  'Bonus: 25 Kredi':  { en: 'Bonus: 25 Credits', ru: 'Бонус: 25 кредитов' },

  // === LİDERBOARD ===
  'En iyi oyuncular — canlı sıralama (sunucu entegrasyonu bekleniyor)': { en: 'Top players — live ranking (server integration pending)', ru: 'Лучшие игроки — живой рейтинг (ожидается интеграция)' },
  'Sunucu Entegrasyonu Gerekli': { en: 'Server Integration Required', ru: 'Требуется интеграция сервера' },
  'Canlı sıralamanın çalışabilmesi için prooyun panel API bilgilerinin eklenmesi gerekiyor. API erişim bilgilerini bana ilettiğinde bu sayfa otomatik güncellenecek şekilde bağlantıyı kurabilirim. Şu anlık örnek veri gösteriliyor.':
    { en: 'Live ranking requires the prooyun panel API credentials. Once provided, this page will update automatically. Sample data is currently shown.',
      ru: 'Для живого рейтинга нужны данные API панели prooyun. После подключения страница будет обновляться автоматически. Сейчас показаны примерные данные.' },
  'Sıra':             { en: 'Rank', ru: 'Место' },
  'Puan':             { en: 'Points', ru: 'Очки' },
  'Öldürme':          { en: 'Kills', ru: 'Убийства' },
  'Kafa Oranı':       { en: 'HS Rate', ru: 'HS %' },
  'Ölüm':             { en: 'Deaths', ru: 'Смерти' },
  'K/D':              { en: 'K/D', ru: 'K/D' },
  'İsabet %':         { en: 'Accuracy %', ru: 'Точность %' },
  '📌 Sıralamanın nasıl çalıştığı: Sunucu her oyun sonunda oyuncu istatistiklerini veritabanına kaydeder. Siteye bağlantı kurulduğunda bu veri her birkaç dakikada bir bu sayfayı otomatik olarak günceller. Prooyun panelinden':
    { en: '📌 How ranking works: the server saves player stats to the database after every match. Once connected, this page auto-updates every few minutes. From the prooyun panel share the',
      ru: '📌 Как работает рейтинг: сервер сохраняет статистику после каждого матча. После подключения страница будет обновляться каждые несколько минут. Из панели prooyun передайте' },
  'API anahtarı':     { en: 'API key', ru: 'API-ключ' },
  've':               { en: 'and', ru: 'и' },
  'sunucu ID':        { en: 'server ID', ru: 'ID сервера' },
  "'sini paylaş, entegrasyonu hazırlayayım.": { en: "and I'll set up the integration.", ru: '— и я настрою интеграцию.' },

  // === KAPLAMALAR ===
  'Sunucularımızda kullanılabilen tüm CS2 kaplama koleksiyonu': { en: 'The complete CS2 skin collection available on our servers', ru: 'Полная коллекция скинов CS2 на наших серверах' },
  'Skinler':          { en: 'Skins', ru: 'Скины' },
  'Silah kaplamaları':{ en: 'Weapon skins', ru: 'Скины оружия' },
  'Ajanlar':          { en: 'Agents', ru: 'Агенты' },
  'Yakında':          { en: 'Coming soon', ru: 'Скоро' },
  'Müzik Setleri':    { en: 'Music Kits', ru: 'Музыка' },
  'Madalyonlar':      { en: 'Medals', ru: 'Медали' },
  'Koleksiyonlar':    { en: 'Collections', ru: 'Коллекции' },
  'Tabanca':          { en: 'Pistol', ru: 'Пистолет' },
  'Tüfek':            { en: 'Rifle', ru: 'Винтовка' },
  'Keskin N.':        { en: 'Sniper', ru: 'Снайперка' },
  'Ağır':             { en: 'Heavy', ru: 'Тяжёлое' },
  'Bıçak':            { en: 'Knife', ru: 'Нож' },
  'Eldiven':          { en: 'Gloves', ru: 'Перчатки' },
  'Kaplama verileri yüklenemedi. Sayfayı yenile.': { en: 'Failed to load skin data. Refresh the page.', ru: 'Не удалось загрузить скины. Обновите страницу.' },
  'Bu filtreye uygun silah bulunamadı.': { en: 'No weapons match this filter.', ru: 'Нет оружия по фильтру.' },
};

/* Kalıp bazlı dinamik çeviriler — sayı içeren metinler */
const PATTERN_RULES = [
  { re: /^(\d[\d.,]*)\s*dakika$/i, en: '$1 minutes', ru: '$1 мин.' },
  { re: /^(\d[\d.,]*)\s*saat$/i,   en: '$1 hours',   ru: '$1 ч.' },
  { re: /^(\d[\d.,]*)\s*gün$/i,    en: '$1 days',    ru: '$1 дн.' },
  { re: /^(\d[\d.,]*)\s*hafta$/i,  en: '$1 weeks',   ru: '$1 нед.' },
  { re: /^(\d[\d.,]*)\s*ban$/i,    en: '$1 bans',    ru: '$1 банов' },
  { re: /^(\d[\d.,]*)\s*kişi çevrimiçi$/i, en: '$1 online', ru: '$1 онлайн' },
  { re: /^(\d[\d.,]*)\s*skins$/i,  en: '$1 skins',   ru: '$1 скинов' },
];

function translatePattern(text, lang) {
  for (const rule of PATTERN_RULES) {
    const m = text.match(rule.re);
    if (m) return text.replace(rule.re, rule[lang]);
  }
  return null;
}

/* Auto-translate: DOM'daki text node'ları tarayarak TR metni EN/RU'ya çevirir.
 * Orijinal TR metin WeakMap'te saklanır, dil değişiminde geri döner. */
const _origText = new WeakMap();
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);

function walkAndTranslate(root, lang) {
  const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: n => {
      const p = n.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      // Skip nodes in pref-controls (has its own translation logic)
      if (p.closest && p.closest('.pref-controls')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while ((n = walker.nextNode())) {
    const raw = _origText.get(n) ?? (_origText.set(n, n.nodeValue), n.nodeValue);
    // Çok satırlı HTML metinleri (footer vb.) tek boşluğa normalize et ki sözlük anahtarıyla eşleşsin
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    if (!trimmed) continue;

    if (lang === 'tr') {
      n.nodeValue = raw;
      continue;
    }
    const entry = TRANSLATIONS[trimmed];
    const lead  = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    if (entry && entry[lang]) {
      n.nodeValue = lead + entry[lang] + trail;
      continue;
    }
    // Sözlükte yoksa kalıp dene ("300 dakika" → "300 minutes")
    const pat = translatePattern(trimmed, lang);
    if (pat) n.nodeValue = lead + pat + trail;
  }
}

// Attribute'lar için ayrıca tarama (placeholder, title, alt)
function translateAttrs(lang) {
  const attrs = ['placeholder', 'title', 'aria-label'];
  attrs.forEach(attr => {
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      if (el.closest('.pref-controls')) return;
      const key = `__orig_${attr}`;
      const raw = el[key] ?? (el[key] = el.getAttribute(attr));
      const trimmed = (raw || '').trim().replace(/\s+/g, ' ');
      if (!trimmed) return;
      if (lang === 'tr') { el.setAttribute(attr, raw); return; }
      const entry = TRANSLATIONS[trimmed];
      if (entry && entry[lang]) el.setAttribute(attr, entry[lang]);
    });
  });
}

// Nav link href → key map (fallback, walker zaten çeviriyor ama emin olalım)
const NAV_LINK_MAP = {
  'index.html':     'nav.home',
  'kurallar.html':  'nav.rules',
  'yetki.html':     'nav.authority',
  'liderboard.html':'nav.leaderboard',
  'yasaklama.html': 'nav.bans',
  'kaplamalar.html':'nav.skins',
  'yoneticiler.html':'nav.admins',
};

let CURRENT_LANG = 'tr';

function applyLang(lang) {
  CURRENT_LANG = lang;
  document.documentElement.setAttribute('lang', lang);
  walkAndTranslate(document.body, lang);
  translateAttrs(lang);
}

/* Dinamik içerik (ban tablosu, skin listesi, toast) render edildiğinde
 * aktif dil TR değilse yeni node'ları da çevir. childList dinlenir;
 * nodeValue set'leri characterData ürettiği için döngü oluşmaz. */
function initDynamicTranslation() {
  const obs = new MutationObserver(muts => {
    if (CURRENT_LANG === 'tr') return;
    for (const m of muts) {
      for (const node of m.addedNodes) {
        const el = node.nodeType === 1 ? node : node.parentElement;
        if (!el || (el.closest && el.closest('.pref-controls'))) continue;
        walkAndTranslate(el, CURRENT_LANG);
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

/* -----------------------------------------------------------------
 * UI: Nav'a butonları ve dropdown'ları enjekte et
 * ----------------------------------------------------------------- */
function injectPrefsUI(state) {
  const nav = document.querySelector('.nav-inner');
  if (!nav) return;

  const wrap = document.createElement('div');
  wrap.className = 'pref-controls';
  wrap.innerHTML = `
    <div class="pref-btn-group">
      <button class="pref-btn" data-pref="theme" title="${t('pref.theme', state.lang)}" aria-label="Theme">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.6 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.6-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5-4.5-9-10-9z"/></svg>
      </button>
      <div class="pref-drop" data-drop="theme">
        <div class="pref-drop-title">${t('pref.theme', state.lang)}</div>
        ${Object.entries(THEMES).map(([k,v]) => `
          <button class="pref-item pref-theme-item" data-value="${k}">
            <span class="pref-swatch" style="background:${v.dot}"></span>
            <span>${v.label[state.lang] || v.label.tr}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="pref-btn-group">
      <button class="pref-btn" data-pref="effect" title="${t('pref.effect', state.lang)}" aria-label="Effect">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L19 9l-4 3.3L16.2 18 12 15l-4.2 3L9 12.3 5 9l5.1-1.4z"/></svg>
      </button>
      <div class="pref-drop" data-drop="effect">
        <div class="pref-drop-title">${t('pref.effect', state.lang)}</div>
        <div class="pref-effect-list"></div>
      </div>
    </div>

    <div class="pref-btn-group">
      <button class="pref-btn" data-pref="lang" title="${t('pref.lang', state.lang)}" aria-label="Language">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/></svg>
      </button>
      <div class="pref-drop" data-drop="lang">
        <div class="pref-drop-title">${t('pref.lang', state.lang)}</div>
        ${Object.entries(LANGS).map(([k,v]) => `
          <button class="pref-item pref-lang-item" data-value="${k}">
            <span class="pref-flag">${v.flag}</span>
            <span>${v.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  const burger = nav.querySelector('.nav-burger');
  if (burger) nav.insertBefore(wrap, burger);
  else nav.appendChild(wrap);

  refreshEffectList(state);
  bindPrefsUI(state);
  markActiveInDropdowns(state);
}

function refreshEffectList(state) {
  const list = document.querySelector('.pref-effect-list');
  if (!list) return;
  const pkg = EFFECT_PACKAGES[state.theme] || EFFECT_PACKAGES.red;
  list.innerHTML = pkg.map(fx => `
    <button class="pref-item pref-effect-item" data-value="${fx.id}">
      <span class="pref-emoji">${fx.emoji}</span>
      <span>${fx.label[state.lang] || fx.label.tr}</span>
    </button>
  `).join('');
}

function markActiveInDropdowns(state) {
  document.querySelectorAll('.pref-theme-item').forEach(b => b.classList.toggle('active', b.dataset.value === state.theme));
  document.querySelectorAll('.pref-effect-item').forEach(b => b.classList.toggle('active', b.dataset.value === state.effect));
  document.querySelectorAll('.pref-lang-item').forEach(b => b.classList.toggle('active', b.dataset.value === state.lang));
}

function bindPrefsUI(state) {
  const closeAll = () => document.querySelectorAll('.pref-drop.open').forEach(d => d.classList.remove('open'));

  document.querySelectorAll('.pref-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const which = btn.dataset.pref;
      const drop = document.querySelector(`.pref-drop[data-drop="${which}"]`);
      const wasOpen = drop.classList.contains('open');
      closeAll();
      if (!wasOpen) drop.classList.add('open');
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.pref-controls')) closeAll();
  });

  // Tema seçim
  document.addEventListener('click', e => {
    const item = e.target.closest('.pref-theme-item');
    if (!item) return;
    const newTheme = item.dataset.value;
    if (newTheme === state.theme) return closeAll();
    state.theme = newTheme;
    // Efekti reset et — yeni tema paketinde farklı slot'lar olabilir
    state.effect = 'off';
    savePrefs(state);
    applyTheme(state.theme);
    refreshEffectList(state);
    applyEffect(state.theme, state.effect);
    markActiveInDropdowns(state);
    closeAll();
  });

  // Efekt seçim
  document.addEventListener('click', e => {
    const item = e.target.closest('.pref-effect-item');
    if (!item) return;
    state.effect = item.dataset.value;
    savePrefs(state);
    applyEffect(state.theme, state.effect);
    markActiveInDropdowns(state);
    closeAll();
  });

  // Dil seçim
  document.addEventListener('click', e => {
    const item = e.target.closest('.pref-lang-item');
    if (!item) return;
    state.lang = item.dataset.value;
    savePrefs(state);
    applyLang(state.lang);
    // Panel içeriği de dile göre değişsin
    refreshPanelText(state);
    refreshEffectList(state);
    markActiveInDropdowns(state);
    closeAll();
  });
}

function refreshPanelText(state) {
  const map = {
    theme: 'pref.theme',
    effect: 'pref.effect',
    lang: 'pref.lang',
  };
  document.querySelectorAll('.pref-btn').forEach(b => {
    const w = b.dataset.pref;
    if (map[w]) b.title = t(map[w], state.lang);
  });
  document.querySelectorAll('.pref-drop').forEach(d => {
    const w = d.dataset.drop;
    const titleEl = d.querySelector('.pref-drop-title');
    if (titleEl && map[w]) titleEl.textContent = t(map[w], state.lang);
  });
  // Tema label'ları
  const themeBtns = document.querySelectorAll('.pref-theme-item');
  Object.entries(THEMES).forEach(([k, v], i) => {
    if (themeBtns[i]) themeBtns[i].lastElementChild.textContent = v.label[state.lang] || v.label.tr;
  });
}

/* -----------------------------------------------------------------
 * INIT
 * ----------------------------------------------------------------- */
(function initEarly() {
  // Sayfa yüklenmeden önce tema uygula (FOUC engelle)
  const p = loadPrefs();
  applyTheme(p.theme);
  document.documentElement.setAttribute('lang', p.lang);
})();

document.addEventListener('DOMContentLoaded', () => {
  const state = loadPrefs();
  applyTheme(state.theme);
  applyLang(state.lang);
  applyEffect(state.theme, state.effect);
  injectPrefsUI(state);
  initDynamicTranslation();
});
