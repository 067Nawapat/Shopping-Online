<?php

function parse_tlv_payload($payload) {
    $result = [];
    $length = strlen($payload);
    $cursor = 0;

    while ($cursor + 4 <= $length) {
        $tag = substr($payload, $cursor, 2);
        $valueLength = (int)substr($payload, $cursor + 2, 2);
        $valueStart = $cursor + 4;
        $value = substr($payload, $valueStart, $valueLength);
        $result[$tag] = $value;
        $cursor = $valueStart + $valueLength;
    }

    return $result;
}

function normalize_promptpay_target($value) {
    $digits = preg_replace('/\D+/', '', (string)$value);
    if (!$digits) {
        return '';
    }

    if (strlen($digits) >= 13 && substr($digits, 0, 3) === '006') {
        return substr($digits, 3);
    }

    return $digits;
}

function extract_promptpay_details($qrPayload) {
    if (!$qrPayload || !is_string($qrPayload)) {
        return ['promptpay' => '', 'amount' => null];
    }

    $parsed = parse_tlv_payload($qrPayload);
    $merchantAccount = $parsed['29'] ?? ($parsed['30'] ?? '');
    $merchantFields = $merchantAccount ? parse_tlv_payload($merchantAccount) : [];
    $promptpay = normalize_promptpay_target($merchantFields['01'] ?? '');
    $amount = isset($parsed['54']) && $parsed['54'] !== '' ? (float)$parsed['54'] : null;

    return [
        'promptpay' => $promptpay,
        'amount'    => $amount,
    ];
}

function get_promptpay_target() {
    $value = trim((string)(getenv('PROMPTPAY_NUMBER') ?: ''));
    if ($value !== '') {
        return $value;
    }

    $localConfigPath = __DIR__ . '/../local-config.php';
    if (is_file($localConfigPath)) {
        $config = require $localConfigPath;
        if (is_array($config) && !empty($config['PROMPTPAY_NUMBER'])) {
            return trim((string)$config['PROMPTPAY_NUMBER']);
        }
    }

    return '';
}

function get_truemoney_target() {
    $value = trim((string)(getenv('TRUE_MONEY_NUMBER') ?: ''));
    if ($value !== '') {
        return $value;
    }

    $localConfigPath = __DIR__ . '/../local-config.php';
    if (is_file($localConfigPath)) {
        $config = require $localConfigPath;
        if (is_array($config) && !empty($config['TRUE_MONEY_NUMBER'])) {
            return trim((string)$config['TRUE_MONEY_NUMBER']);
        }
    }

    return '';
}

function get_thaipost_token() {
    $localConfigPath = __DIR__ . '/../local-config.php';
    if (is_file($localConfigPath)) {
        $config = require $localConfigPath;
        if (is_array($config) && !empty($config['THAIPOST_TOKEN'])) {
            return trim((string)$config['THAIPOST_TOKEN']);
        }
    }
    return trim((string)(getenv('THAIPOST_TOKEN') ?: ''));
}

function payment_method_label($paymentMethod) {
    return $paymentMethod === 'true_money' ? 'true_money' : 'promptpay';
}

function trailing_digits($value, $length = 4) {
    $digits = preg_replace('/\D+/', '', (string)$value);
    if ($digits === '') {
        return '';
    }

    return strlen($digits) <= $length ? $digits : substr($digits, -$length);
}

function promptpay_values_match($detected, $detectedExpected) {
    $detected         = normalize_promptpay_target($detected);
    $detectedExpected = normalize_promptpay_target($detectedExpected);

    if ($detected === '' || $detectedExpected === '') {
        return false;
    }

    if ($detected === $detectedExpected) {
        return true;
    }

    return str_ends_with($detectedExpected, $detected) || str_ends_with($detected, $detectedExpected);
}

function phone_values_match($detected, $phoneExpected) {
    $detected      = preg_replace('/\D+/', '', (string)$detected);
    $phoneExpected = preg_replace('/\D+/', '', (string)$phoneExpected);

    if ($detected === '' || $phoneExpected === '') {
        return false;
    }

    if ($detected === $phoneExpected) {
        return true;
    }

    $detectedSuffix = trailing_digits($detected, 4);
    $expectedSuffix = trailing_digits($phoneExpected, 4);

    return $detectedSuffix !== '' && $detectedSuffix === $expectedSuffix;
}
