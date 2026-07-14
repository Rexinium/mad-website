<?php
declare(strict_types=1);

// MAD — Admin toggle endpoint
// POST { password, key, value } → data/site_config.json güncellenir
// Şifre /etc/mad/admin_password.php'de: define('ADMIN_PASSWORD_HASH', password_hash(...))

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function bail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    bail(405, 'method not allowed');
}

// ---- Auth config yükle ----
$pwdFile = '/etc/mad/admin_password.php';
if (!is_readable($pwdFile)) {
    error_log('admin-toggle: password file missing');
    bail(500, 'server misconfigured');
}
require $pwdFile;
if (!defined('ADMIN_PASSWORD_HASH') || ADMIN_PASSWORD_HASH === '') {
    bail(500, 'server misconfigured');
}

// ---- Rate limit (IP başına 5 deneme / 5 dk) ----
$ip = $_SERVER['HTTP_CF_CONNECTING_IP']
   ?? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')[0]
   ?? $_SERVER['REMOTE_ADDR']
   ?? 'unknown';
$ip = trim((string)$ip);

$rateDir = '/tmp/mad-admin-rate';
if (!is_dir($rateDir)) @mkdir($rateDir, 0755, true);
$rateFile = $rateDir . '/' . hash('sha256', $ip);
$now = time();
$window = 300;
$max = 5;

$entries = [];
if (is_file($rateFile)) {
    $raw = @file_get_contents($rateFile);
    if ($raw) {
        $entries = array_filter(explode("\n", trim($raw)), fn($t) => is_numeric($t) && ($now - (int)$t) < $window);
    }
}
if (count($entries) >= $max) {
    bail(429, 'çok fazla deneme, 5 dk bekle');
}

// ---- Body parse ----
$raw = file_get_contents('php://input', false, null, 0, 4096);
if ($raw === false || strlen($raw) === 0) bail(400, 'no body');
$body = json_decode($raw, true);
if (!is_array($body)) bail(400, 'invalid json');

$password = (string)($body['password'] ?? '');
if ($password === '') bail(400, 'password required');

// ---- Şifre kontrolü (failed denemeyi rate limit'e yaz) ----
if (!password_verify($password, ADMIN_PASSWORD_HASH)) {
    $entries[] = $now;
    @file_put_contents($rateFile, implode("\n", $entries));
    // 1sn bekle, timing attack yavaşlat
    usleep(500000);
    bail(401, 'yanlış şifre');
}

// ---- Config güncelle ----
$dataDir = __DIR__ . '/data';
$file = $dataDir . '/site_config.json';
$lockFile = $dataDir . '/site_config.lock';
if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);

$lock = fopen($lockFile, 'c');
if (!$lock || !flock($lock, LOCK_EX)) bail(500, 'lock failed');

try {
    $current = [];
    if (is_file($file)) {
        $c = json_decode((string)file_get_contents($file), true);
        if (is_array($c)) $current = $c;
    }

    // Whitelist edilen anahtarlar
    $BOOL_KEYS = ['yetkiliAwp', 'yetkiliAim', 'yetkiliRedline'];
    $STR_KEYS  = ['closedTitle', 'closedMessage'];
    $key = (string)($body['key'] ?? '');
    if (!in_array($key, $BOOL_KEYS, true) && !in_array($key, $STR_KEYS, true)) {
        bail(400, 'invalid key');
    }

    $value = $body['value'] ?? null;
    if (in_array($key, $BOOL_KEYS, true)) {
        $current[$key] = (bool)$value;
    } else {
        if (!is_string($value)) bail(400, 'value must be string');
        $current[$key] = mb_substr($value, 0, 500);
    }

    $json = json_encode($current, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false) bail(500, 'write failed');
    if (!rename($tmp, $file)) { @unlink($tmp); bail(500, 'rename failed'); }
    @chmod($file, 0644);

    echo json_encode(['ok' => true, 'config' => $current]);
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
