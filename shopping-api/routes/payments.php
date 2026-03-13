<?php

switch ($action) {
    case 'generate_payment_qr':
        $data      = read_body();
        $amount    = (float)($data['amount'] ?? 0);
        $promptPay = get_promptpay_target();

        if ($amount <= 0) {
            json_response(["status" => "error", "message" => "Invalid amount"], 400);
        }

        $qrResponse = easyslip_json_post('https://bill-payment-api.easyslip.com/', [
            'type'   => 'PROMPTPAY',
            'msisdn' => $promptPay,
            'amount' => round($amount, 2),
        ]);

        if (!empty($qrResponse['error'])) {
            json_response(["status" => "error", "message" => $qrResponse['error']], 500);
        }

        if ($qrResponse['http_code'] < 200 || $qrResponse['http_code'] >= 300 || empty($qrResponse['json']['image_base64'])) {
            json_response([
                "status"  => "error",
                "message" => $qrResponse['json']['message'] ?? 'Unable to generate EasySlip QR',
                "debug"   => $qrResponse['body'],
            ], 500);
        }

        json_response([
            'status'     => 'success',
            'provider'   => 'easyslip',
            'qr_image'   => create_data_uri($qrResponse['json']['image_base64'], $qrResponse['json']['mime'] ?? 'image/png'),
            'qr_payload' => $qrResponse['json']['payload'] ?? '',
            'promptpay'  => $promptPay,
            'amount'     => $amount,
        ]);
        break;

    case 'upload_slip':
        $payload              = read_body();
        $orderId              = (int)(($_POST['order_id'] ?? 0) ?: ($payload['order_id'] ?? 0));
        $file                 = $_FILES['slip'] ?? null;
        $slipBase64           = trim((string)($payload['slip_base64'] ?? ''));
        $slipName             = trim((string)($payload['slip_name'] ?? 'slip.jpg'));
        $slipType             = trim((string)($payload['slip_type'] ?? 'image/jpeg'));
        $expectedPromptPay    = normalize_promptpay_target(get_promptpay_target());

        if (!$orderId) {
            json_response(["status" => "error", "message" => "Missing order id"], 400);
        }

        $uploadDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $safeOriginalName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($slipName ?: 'slip.jpg'));
        $name             = time() . "_" . $safeOriginalName;
        $savedPath        = $uploadDir . DIRECTORY_SEPARATOR . $name;

        if ($file && !empty($file['tmp_name'])) {
            if (!move_uploaded_file($file['tmp_name'], $savedPath)) {
                json_response(["status" => "error", "message" => "Unable to save uploaded slip"], 500);
            }
        } elseif ($slipBase64 !== '') {
            if (strpos($slipBase64, 'base64,') !== false) {
                $slipBase64 = substr($slipBase64, strpos($slipBase64, 'base64,') + 7);
            }

            $decodedImage = base64_decode($slipBase64, true);
            if ($decodedImage === false) {
                json_response(["status" => "error", "message" => "Invalid slip image data"], 400);
            }

            if (file_put_contents($savedPath, $decodedImage) === false) {
                json_response(["status" => "error", "message" => "Unable to save uploaded slip"], 500);
            }
        } else {
            json_response(["status" => "error", "message" => "Missing slip upload data"], 400);
        }

        $conn->begin_transaction();

        try {
            $stmt = $conn->prepare("SELECT total_price, payment_method FROM orders WHERE id = ? LIMIT 1");
            if (!$stmt) {
                throw new Exception($conn->error);
            }
            $stmt->bind_param("i", $orderId);
            $stmt->execute();
            $order = $stmt->get_result()->fetch_assoc();

            if (!$order) {
                throw new Exception('Order not found');
            }

            $paymentMethod    = payment_method_label($order['payment_method'] ?? 'promptpay');
            $expectedAmount   = (float)$order['total_price'];
            $expectedReceiver = $paymentMethod === 'true_money'
                ? preg_replace('/\D+/', '', get_truemoney_target())
                : normalize_promptpay_target(get_promptpay_target());

            $detectedAmount      = null;
            $detectedPromptPay   = '';
            $detectedProviderRef = '';
            $slipHash            = hash_file('sha256', $savedPath) ?: '';
            $verificationImageBase64 = $slipBase64 !== '' ? $slipBase64 : base64_encode((string)file_get_contents($savedPath));
            $isDuplicateSlip     = false;
            $receiverProxy       = '';
            $receiverBank        = '';
            $amountMatches       = false;
            $promptPayMatches    = false;
            $providerMessage     = '';
            $providerRaw         = null;
            $matchReason         = 'token_missing';
            $orderStatus         = 'verifying';

            $easySlipToken = get_easyslip_token();
            if ($easySlipToken) {
                $verifyResponse = $paymentMethod === 'true_money'
                    ? easyslip_verify_truewallet_image($savedPath, $easySlipToken, true)
                    : ($verificationImageBase64 !== ''
                        ? easyslip_verify_base64($verificationImageBase64, $easySlipToken, true)
                        : easyslip_verify_image($savedPath, $easySlipToken, true));

                $providerRaw     = $verifyResponse['json'];
                $providerMessage = trim((string)($verifyResponse['json']['message'] ?? ''));
                $verification    = $verifyResponse['json']['data'] ?? null;

                if (!empty($verifyResponse['error'])) {
                    $matchReason = 'easyslip_request_error';
                } elseif ($verification) {
                    if ($paymentMethod === 'true_money') {
                        $detectedAmount = isset($verification['amount']['amount'])
                            ? (float)$verification['amount']['amount']
                            : (isset($verification['amount']) ? (float)$verification['amount'] : null);
                        $detectedProviderRef = trim((string)($verification['transactionId'] ?? ($verification['transRef'] ?? '')));

                        $receiverPhone  = trim((string)($verification['receiver']['phone'] ?? ''));
                        $receiverProxy  = preg_replace('/\D+/', '', (string)($verification['receiver']['account']['proxy']['account'] ?? ''));
                        $receiverBank   = preg_replace('/\D+/', '', (string)($verification['receiver']['account']['bank']['account'] ?? ''));
                        $detectedPromptPay = $receiverPhone ?: ($receiverProxy ?: $receiverBank);
                    } else {
                        $detectedAmount      = isset($verification['amount']['amount']) ? (float)$verification['amount']['amount'] : null;
                        $detectedProviderRef = trim((string)($verification['transRef'] ?? ''));

                        $receiverProxy     = normalize_promptpay_target($verification['receiver']['account']['proxy']['account'] ?? '');
                        $receiverBank      = normalize_promptpay_target($verification['receiver']['account']['bank']['account'] ?? '');
                        $detectedPromptPay = $receiverProxy ?: $receiverBank;
                    }

                    $duplicateStmt = $conn->prepare("SELECT id, order_id FROM payments WHERE (provider_ref <> '' AND provider_ref = ?) OR (slip_hash <> '' AND slip_hash = ?) LIMIT 1");
                    if (!$duplicateStmt) {
                        throw new Exception($conn->error);
                    }
                    $duplicateStmt->bind_param("ss", $detectedProviderRef, $slipHash);
                    $duplicateStmt->execute();
                    $duplicatePayment = $duplicateStmt->get_result()->fetch_assoc();
                    $isDuplicateSlip  = !empty($duplicatePayment) || $providerMessage === 'duplicate_slip';

                    $amountMatches    = $detectedAmount !== null && abs($detectedAmount - $expectedAmount) < 0.01;
                    $promptPayMatches = $paymentMethod === 'true_money'
                        ? phone_values_match($detectedPromptPay, $expectedReceiver)
                        : promptpay_values_match($detectedPromptPay, $expectedReceiver);

                    if ($isDuplicateSlip) {
                        $orderStatus = 'rejected';
                        $matchReason = 'duplicate_slip';
                    } elseif ($amountMatches && $promptPayMatches) {
                        $orderStatus = 'waiting';
                        $matchReason = 'matched';
                    } else {
                        $orderStatus = 'rejected';
                        $matchReason = 'mismatch';
                    }
                } else {
                    switch ($providerMessage) {
                        case 'duplicate_slip':
                            $orderStatus = 'rejected';
                            $matchReason = 'duplicate_slip';
                            break;
                        case 'invalid_image':
                        case 'image_size_too_large':
                        case 'invalid_payload':
                        case 'slip_not_found':
                        case 'qrcode_not_found':
                        case 'transaction_not_found':
                            $orderStatus = 'rejected';
                            $matchReason = $providerMessage;
                            break;
                        case 'unauthorized':
                        case 'access_denied':
                        case 'account_not_verified':
                        case 'application_deactivated':
                        case 'quota_exceeded':
                        case 'server_error':
                        case 'api_server_error':
                            $orderStatus = 'verifying';
                            $matchReason = $providerMessage;
                            break;
                        default:
                            $matchReason = 'easyslip_verification_failed';
                            break;
                    }
                }
            }

            $paymentStatus = $orderStatus;
            $recordAmount  = $detectedAmount !== null ? $detectedAmount : $expectedAmount;

            if (!$isDuplicateSlip) {
                $stmt = $conn->prepare("INSERT INTO payments(order_id,payment_method,amount,slip_image,provider_ref,slip_hash,status) VALUES (?,?,?,?,?,?,?)");
                if (!$stmt) {
                    throw new Exception($conn->error);
                }
                $stmt->bind_param("isdssss", $orderId, $paymentMethod, $recordAmount, $name, $detectedProviderRef, $slipHash, $paymentStatus);
                $stmt->execute();
            }

            $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
            if (!$stmt) {
                throw new Exception($conn->error);
            }
            $stmt->bind_param("si", $orderStatus, $orderId);
            $stmt->execute();

            $conn->commit();

            json_response([
                "status"            => "success",
                "provider"          => $paymentMethod === 'true_money' ? 'easyslip_truewallet' : 'easyslip_bank',
                "payment_method"    => $paymentMethod,
                "order_status"      => $orderStatus,
                "matched"           => $orderStatus === 'waiting',
                "reason"            => $matchReason,
                "expected_amount"   => $expectedAmount,
                "detected_amount"   => $detectedAmount,
                "expected_promptpay" => $expectedReceiver,
                "detected_promptpay" => $detectedPromptPay,
                "expected_receiver" => $expectedReceiver,
                "detected_receiver" => $detectedPromptPay,
                "amount_matches"    => $amountMatches,
                "promptpay_matches" => $promptPayMatches,
                "receiver_proxy"    => $receiverProxy,
                "receiver_bank"     => $receiverBank,
                "provider_ref"      => $detectedProviderRef,
                "provider_message"  => $providerMessage,
                "slip_hash"         => $slipHash,
                "is_duplicate_slip" => $isDuplicateSlip,
                "verification"      => $providerRaw,
            ]);
        } catch (Throwable $e) {
            $conn->rollback();
            json_response(["status" => "error", "message" => $e->getMessage()], 500);
        }
        break;
}
