<?php
declare(strict_types=1);

// MAD CS2 — Ban güncelleme endpoint'i
// Hoid'in botu POST atar, X-Bot-Token header ile auth olur.
// Token /etc/mad/bot_token.php dosyasında BOT_TOKEN sabitinde tutulur (VDS-only).

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

$tokenFile = '/etc/mad/bot_token.php';
if (!is_readable($tokenFile)) {
    error_log('update_bans: token file missing');
    bail(500, 'server misconfigured');
}
require $tokenFile;
if (!defined('BOT_TOKEN') || BOT_TOKEN === '') {
    error_log('update_bans: BOT_TOKEN not defined');
    bail(500, 'server misconfigured');
}

$provided = $_SERVER['HTTP_X_BOT_TOKEN'] ?? '';
if (!is_string($provided) || !hash_equals(BOT_TOKEN, $provided)) {
    bail(401, 'unauthorized');
}

$MAX_BYTES = 10 * 1024 * 1024;
$raw = file_get_contents('php://input', false, null, 0, $MAX_BYTES + 1);
if ($raw === false) bail(400, 'no body');
if (strlen($raw) > $MAX_BYTES) bail(413, 'payload too large');

$data = json_decode($raw, true);
if (!is_array($data) || !isset($data['events']) || !is_array($data['events'])) {
    bail(400, 'invalid json: expected { events: [...] }');
}

$ALLOWED_TYPES = ['ban', 'unban', 'kick', 'mute', 'unmute', 'gag', 'ungag'];
$ALLOWED_DURATION_CLASSES = ['perm', 'long', 'medium', 'short', 'instant'];

function s(mixed $v, int $max = 200): string {
    if (!is_string($v)) return '';
    $v = trim($v);
    if (strlen($v) > $max) $v = substr($v, 0, $max);
    return $v;
}

$cleanEvents = [];
foreach ($data['events'] as $e) {
    if (!is_array($e)) continue;
    $type = s($e['type'] ?? '', 20);
    if (!in_array($type, $ALLOWED_TYPES, true)) continue;

    $ts = s($e['ts'] ?? '', 40);
    if ($ts === '') $ts = gmdate('Y-m-d\TH:i:s\Z');

    $durationClass = s($e['durationClass'] ?? '', 20);
    if ($durationClass !== '' && !in_array($durationClass, $ALLOWED_DURATION_CLASSES, true)) {
        $durationClass = '';
    }

    $cleanEvents[] = [
        'ts'              => $ts,
        'type'            => $type,
        'action'          => s($e['action'] ?? strtoupper($type), 30),
        'server'          => s($e['server'] ?? '', 30),
        'serverName'      => s($e['serverName'] ?? '', 60),
        'player'          => s($e['player'] ?? '', 100),
        'playerSteamId'   => s($e['playerSteamId'] ?? '', 40),
        'playerSteamUrl'  => s($e['playerSteamUrl'] ?? '', 200),
        'admin'           => s($e['admin'] ?? '', 100),
        'adminSteamId'    => s($e['adminSteamId'] ?? '', 40),
        'reason'          => s($e['reason'] ?? '—', 300),
        'duration'        => s($e['duration'] ?? '', 40),
        'durationClass'   => $durationClass,
    ];
}

$dataDir = __DIR__ . '/data';
$file    = $dataDir . '/bans.json';
if (!is_dir($dataDir)) {
    if (!@mkdir($dataDir, 0755, true) && !is_dir($dataDir)) {
        bail(500, 'cannot create data dir');
    }
}

$lockFile = $dataDir . '/bans.lock';
$lock = fopen($lockFile, 'c');
if (!$lock || !flock($lock, LOCK_EX)) {
    bail(500, 'cannot acquire lock');
}

try {
    $isSnapshot = isset($data['generated']) || isset($data['totalEvents']);

    if ($isSnapshot) {
        $events = $cleanEvents;
    } else {
        $existing = [];
        if (is_file($file)) {
            $prev = json_decode((string)file_get_contents($file), true);
            if (is_array($prev) && isset($prev['events']) && is_array($prev['events'])) {
                $existing = $prev['events'];
            }
        }
        // Yeniler üstte, sonra eskiler; toplamı 20000 ile sınırla
        $events = array_merge($cleanEvents, $existing);
        if (count($events) > 20000) $events = array_slice($events, 0, 20000);
    }

    $out = [
        'generated'   => gmdate('Y-m-d\TH:i:s\Z'),
        'totalEvents' => count($events),
        'events'      => $events,
    ];

    $json = json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) bail(500, 'encode failed');

    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false) bail(500, 'write failed');
    if (!rename($tmp, $file)) {
        @unlink($tmp);
        bail(500, 'rename failed');
    }
    @chmod($file, 0644);

    echo json_encode([
        'ok'           => true,
        'mode'         => $isSnapshot ? 'snapshot' : 'append',
        'received'     => count($cleanEvents),
        'totalEvents'  => count($events),
    ]);
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
