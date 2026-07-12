<?php
/* MAD — Yetkili başvuru endpoint'i (VDS için PHP versiyonu)
 * POST JSON alır, doğrular, uygun sunucunun Discord webhook'una embed yollar.
 *
 * Webhook URL'leri /etc/mad/webhooks.php'den okunur (web root DIŞINDA, chmod 640).
 * Bu dosya web root'unda ama sadece nginx location bloğuyla çalışabilir. */

// ---- CORS + method (sadece kendi domain'imiz) ----
$ALLOWED_ORIGINS = ['https://madcs2.com', 'https://www.madcs2.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed', 'message' => 'Sadece POST kabul edilir']);
    exit;
}

// ---- Webhook config'i yükle ----
$config_path = '/etc/mad/webhooks.php';
if (!file_exists($config_path)) {
    error_log('Config not found: ' . $config_path);
    http_response_code(500);
    echo json_encode(['error' => 'server_misconfigured', 'message' => 'Sunucu yapılandırma hatası']);
    exit;
}
$WEBHOOKS = require $config_path;
if (!is_array($WEBHOOKS)) {
    http_response_code(500);
    echo json_encode(['error' => 'server_misconfigured', 'message' => 'Config formatı hatalı']);
    exit;
}

// ---- Rate limit (dosya bazlı, IP başına 3/dk) ----
$ip = $_SERVER['HTTP_CF_CONNECTING_IP']
   ?? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')[0]
   ?? $_SERVER['REMOTE_ADDR']
   ?? 'unknown';
$ip = trim($ip);

$rate_dir = '/tmp/mad-rate';
if (!is_dir($rate_dir)) @mkdir($rate_dir, 0755, true);
$rate_file = $rate_dir . '/' . preg_replace('/[^a-f0-9]/i', '_', hash('sha256', $ip));
$now = time();
$window = 60;
$max = 3;

$entries = [];
if (file_exists($rate_file)) {
    $raw = @file_get_contents($rate_file);
    if ($raw) {
        $entries = array_filter(explode("\n", trim($raw)), function($t) use ($now, $window) {
            return is_numeric($t) && ($now - (int)$t) < $window;
        });
    }
}
if (count($entries) >= $max) {
    http_response_code(429);
    echo json_encode(['error' => 'rate_limited', 'message' => 'Çok sık gönderim. 1 dakika bekle.']);
    exit;
}
$entries[] = $now;
@file_put_contents($rate_file, implode("\n", $entries));

// ---- Body parse ----
$raw = file_get_contents('php://input');
if (strlen($raw) > 100 * 1024) {  // 100 KB üst limit
    http_response_code(413);
    echo json_encode(['error' => 'body_too_large', 'message' => 'İstek çok büyük']);
    exit;
}
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'bad_json', 'message' => 'Geçersiz JSON']);
    exit;
}

// ---- Honeypot: bot dolduruyorsa sessiz OK ----
if (!empty($body['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Zorunlu alan doğrulama ----
$required = ['server', 'name', 'age', 'nickname', 'steamProfile', 'cs2Hours',
             'twKnow', 'prime', 'rank', 'activeMin', 'activeMax',
             'schedule', 'mic', 'commands', 'beenAdmin'];
foreach ($required as $f) {
    if (!isset($body[$f]) || trim((string)$body[$f]) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'missing_field', 'field' => $f, 'message' => "Eksik alan: $f"]);
        exit;
    }
}

// ---- Sunucu ----
$server = strtolower((string)$body['server']);
$SERVER_LABEL = [
    'awp'     => 'AWP Lego',
    'aim'     => 'AIM Pistol',
    'redline' => 'AIM Redline',
];
if (!isset($SERVER_LABEL[$server])) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_server', 'message' => 'Geçersiz sunucu']);
    exit;
}

// ---- Yaş ----
$age = (int)$body['age'];
if ($age < 16 || $age > 70) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_age', 'message' => 'Yaş 16-70 arasında olmalı']);
    exit;
}

// ---- Kural kabul ----
$rulesRead = $body['rulesRead'] ?? false;
if ($rulesRead !== true && $rulesRead !== 'true' && $rulesRead !== 'on' && $rulesRead !== 1) {
    http_response_code(400);
    echo json_encode(['error' => 'rules_not_accepted', 'message' => 'Kuralları kabul etmen gerek']);
    exit;
}

// ---- Steam profil URL ----
if (!preg_match('#^https?://steamcommunity\.com/#i', (string)$body['steamProfile'])) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_steam', 'message' => 'Geçerli bir Steam profil linki gir']);
    exit;
}

// ---- Webhook seç ----
$webhookUrl = $WEBHOOKS[$server] ?? null;
if (!$webhookUrl) {
    http_response_code(500);
    echo json_encode(['error' => 'webhook_not_set', 'message' => 'Webhook yapılandırılmamış']);
    exit;
}

// ---- Yardımcı: metin temizle ----
$esc = function($s, $max = 400) {
    if ($s === null) return '';
    $clean = mb_substr((string)$s, 0, $max);
    return str_replace('`', '´', $clean);  // Discord backtick kaçırma
};

// ---- Discord embed ----
$embed = [
    'title' => '🇹🇷 MAD? ' . $SERVER_LABEL[$server] . ' Yetkili Başvurusu',
    'color' => 0xff3b1a,
    'fields' => [
        ['name' => '👤 İsim / Yaş / Nickname', 'value' => $esc($body['name'], 60) . ' / ' . $age . ' / ' . $esc($body['nickname'], 40), 'inline' => false],
        ['name' => '🔗 Steam Profili',        'value' => $esc($body['steamProfile'], 200), 'inline' => false],
        ['name' => '⏱️ CS2 Süresi',           'value' => $esc($body['cs2Hours'], 10) . ' saat', 'inline' => true],
        ['name' => '🎯 Rank',                 'value' => $esc($body['rank'], 30), 'inline' => true],
        ['name' => '💎 Prime',                'value' => $esc($body['prime'], 20), 'inline' => true],
        ['name' => '🕵️ TeamViewer Bakma',     'value' => $esc($body['twKnow'], 10), 'inline' => true],
        ['name' => '🎙️ Mikrofon',             'value' => $esc($body['mic'], 10), 'inline' => true],
        ['name' => '📆 Günlük Aktif',         'value' => $esc($body['activeMin'], 5) . '–' . $esc($body['activeMax'], 5) . ' saat', 'inline' => true],
        ['name' => '🕰️ Okul/İş Programı',     'value' => $esc($body['schedule'], 500) ?: '—', 'inline' => false],
        ['name' => '⚙️ Yetkili Komutları',    'value' => $esc($body['commands'], 800) ?: '—', 'inline' => false],
        ['name' => '📋 Daha Önce Yetkili',    'value' => $esc($body['beenAdmin'], 10), 'inline' => true],
        ['name' => '📜 Kuralları Okudu',      'value' => '✅ Evet', 'inline' => true],
    ],
    'footer' => ['text' => date('d.m.Y H:i', $now) . ' • IP: ' . $esc($ip, 45)],
];

$payload = [
    'content' => '📝 **Yeni ' . $SERVER_LABEL[$server] . ' yetkili başvurusu** — **' . $esc($body['name'], 40) . '** (' . $age . ')',
    'embeds' => [$embed],
    'allowed_mentions' => ['parse' => []],  // @everyone/@here'a izin verme
];

// ---- Discord'a POST ----
$ch = curl_init($webhookUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_USERAGENT => 'MAD-Site/1.0',
]);
$response = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($http < 200 || $http >= 300) {
    error_log('Webhook failed: HTTP ' . $http . ' | ' . substr((string)$response, 0, 200) . ' | ' . $err);
    http_response_code(502);
    echo json_encode(['error' => 'webhook_failed', 'message' => 'Discord webhook hatası']);
    exit;
}

echo json_encode(['ok' => true]);
