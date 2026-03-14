<?php

function get_easyslip_token() {
    $token = trim((string)(getenv('EASYSLIP_ACCESS_TOKEN') ?: ''));
    if ($token !== '') {
        return $token;
    }

    $localConfigPath = __DIR__ . '/../local-config.php';
    if (is_file($localConfigPath)) {
        $config = require $localConfigPath;
        if (is_array($config) && !empty($config['EASYSLIP_ACCESS_TOKEN'])) {
            return trim((string)$config['EASYSLIP_ACCESS_TOKEN']);
        }
    }

    return '';
}

function create_data_uri($base64, $mime = 'image/png') {
    return 'data:' . $mime . ';base64,' . $base64;
}

function easyslip_json_post($url, $payload) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 20,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body'      => $response,
        'json'      => $response ? json_decode($response, true) : null,
        'error'     => $error,
    ];
}

function easyslip_verify_image($filePath, $token, $checkDuplicate = true) {
    $postFields = [
        'file' => new CURLFile($filePath),
    ];

    if ($checkDuplicate) {
        $postFields['checkDuplicate'] = 'true';
    }

    $ch = curl_init('https://developer.easyslip.com/api/v1/verify');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_TIMEOUT    => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body'      => $response,
        'json'      => $response ? json_decode($response, true) : null,
        'error'     => $error,
    ];
}

function easyslip_verify_base64($imageBase64, $token, $checkDuplicate = true) {
    return easyslip_authorized_json_post(
        'https://developer.easyslip.com/api/v1/verify',
        [
            'image'           => $imageBase64,
            'checkDuplicate'  => (bool)$checkDuplicate,
        ],
        $token
    );
}

function easyslip_verify_truewallet_image($filePath, $token, $checkDuplicate = true) {
    $postFields = [
        'file' => new CURLFile($filePath),
    ];

    if ($checkDuplicate) {
        $postFields['checkDuplicate'] = 'true';
    }

    $ch = curl_init('https://developer.easyslip.com/api/v1/verify/truewallet');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_TIMEOUT    => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body'      => $response,
        'json'      => $response ? json_decode($response, true) : null,
        'error'     => $error,
    ];
}

function easyslip_authorized_json_post($url, $payload, $token) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT    => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body'      => $response,
        'json'      => $response ? json_decode($response, true) : null,
        'error'     => $error,
    ];
}

function thaipost_authenticate($apiKey) {
    $url = 'https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Token ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode(new stdClass()),
        CURLOPT_TIMEOUT    => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return [
            'status'    => false,
            'error'     => $error,
            'http_code' => $httpCode,
        ];
    }

    $decoded = $response !== '' ? json_decode($response, true) : null;

    if ($decoded === null || empty($decoded['token'])) {
        return [
            'status'    => false,
            'error'     => 'Invalid auth response from Thailand Post',
            'http_code' => $httpCode,
            'body'      => $response,
        ];
    }

    return [
        'status'       => true,
        'access_token' => $decoded['token'],
        'http_code'    => $httpCode,
    ];
}

function thaipost_get_status($barcode, $token) {
    // $token ที่ส่งเข้ามาให้ถือว่าเป็น API key หลัก
    $auth = thaipost_authenticate($token);

    if (empty($auth['status'])) {
        return [
            'status'    => false,
            'error'     => $auth['error'] ?? 'Cannot authenticate with Thailand Post',
            'http_code' => $auth['http_code'] ?? 0,
            'step'      => 'authenticate',
        ];
    }

    $accessToken = $auth['access_token'] ?? '';
    if ($accessToken === '') {
        return [
            'status'    => false,
            'error'     => 'Empty access token from Thailand Post',
            'http_code' => $auth['http_code'] ?? 0,
            'step'      => 'authenticate',
        ];
    }

    $url     = "https://trackapi.thailandpost.co.th/post/api/v1/track";
    $payload = [
        "status"   => "all",
        "language" => "TH",
        "barcode"  => [$barcode],
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Token ' . $accessToken,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT    => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return [
            'status'    => false,
            'error'     => $error,
            'http_code' => $httpCode,
        ];
    }

    $decoded = $response !== '' ? json_decode($response, true) : null;

    if ($decoded === null) {
        return [
            'status'    => false,
            'error'     => 'Invalid or empty response from Thailand Post',
            'http_code' => $httpCode,
            'body'      => $response,
        ];
    }

    return $decoded;
}
