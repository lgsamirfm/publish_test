import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, signPaymentResult } from "@/lib/auth";
import { formatPrice, toFa } from "@/lib/format";

/**
 * HTML-escape a string to prevent XSS when interpolating into HTML templates.
 * Covers: & < > " '
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * GET /api/payment/gateway
 * Simulated payment gateway page (like ZarinPal).
 * Query params: txn (transaction ID), order (order ID)
 * Returns a self-contained HTML page that looks like a real Iranian payment gateway.
 * REQUIRES: authenticated user who owns the order.
 */
export async function GET(req: NextRequest) {
  // Authenticate — only the order owner can access the gateway
  let user;
  try {
    user = await requireUser();
  } catch {
    return new Response(
      getErrorPage("لطفاً ابتدا وارد حساب کاربری شوید."),
      { headers: { "content-type": "text/html; charset=utf-8" }, status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const txn = searchParams.get("txn");
  const orderId = searchParams.get("order");

  if (!txn || !orderId) {
    return new Response(
      getErrorPage("پارامترهای درخواست نامعتبر است."),
      { headers: { "content-type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  // Look up the order
  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return new Response(
      getErrorPage("سفارش یافت نشد."),
      { headers: { "content-type": "text/html; charset=utf-8" }, status: 404 }
    );
  }

  // Verify ownership — only the order owner can access the gateway
  if (order.userId !== user.id) {
    return new Response(
      getErrorPage("دسترسی غیرمجاز."),
      { headers: { "content-type": "text/html; charset=utf-8" }, status: 403 }
    );
  }

  // Verify transaction ID
  if (order.transactionId !== txn) {
    return new Response(
      getErrorPage("شناسه تراکنش نامعتبر است."),
      { headers: { "content-type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  // Verify payment is pending
  if (order.paymentStatus !== "PENDING") {
    return new Response(
      getErrorPage("این تراکنش قبلاً پردازش شده است."),
      { headers: { "content-type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  const totalAmount = order.total + order.shippingCost;
  const formattedAmount = formatPrice(totalAmount);
  const formattedTxn = toFa(txn);

  // Pre-compute HMAC signatures for both outcomes so the client-side JS
  // doesn't need access to the server secret.
  const successSignature = signPaymentResult(txn, orderId, true);
  const failureSignature = signPaymentResult(txn, orderId, false);

  const html = getGatewayPage({
    amount: totalAmount,
    formattedAmount,
    transactionId: txn,
    formattedTxn,
    orderId,
    successSignature,
    failureSignature,
  });

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function getErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>خطا - درگاه پرداخت بافخانه</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Tahoma, Arial, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; direction: rtl; }
    .error-card { background: #fff; border-radius: 12px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
    .error-icon { font-size: 48px; margin-bottom: 16px; }
    .error-msg { color: #333; font-size: 16px; line-height: 1.8; }
    .back-link { display: inline-block; margin-top: 20px; color: #1a3a5c; text-decoration: none; font-size: 14px; }
    .back-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="error-card">
    <div class="error-icon">⚠️</div>
    <p class="error-msg">${escapeHtml(message)}</p>
    <a href="/" class="back-link">بازگشت به فروشگاه</a>
  </div>
</body>
</html>`;
}

interface GatewayPageParams {
  amount: number;
  formattedAmount: string;
  transactionId: string;
  formattedTxn: string;
  orderId: string;
  successSignature: string;
  failureSignature: string;
}

function getGatewayPage(params: GatewayPageParams): string {
  const { formattedAmount, transactionId, formattedTxn, orderId, successSignature, failureSignature } = params;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>درگاه پرداخت بافخانه</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Tahoma, Arial, sans-serif;
      background: #e8ecf1;
      direction: rtl;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .gateway-header {
      width: 100%;
      max-width: 460px;
      background: linear-gradient(135deg, #1a3a5c 0%, #1e4d6e 100%);
      border-radius: 16px 16px 0 0;
      padding: 24px 20px;
      text-align: center;
      color: #fff;
    }
    .gateway-header .logo-area {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .gateway-header .logo-icon {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .gateway-header h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
    .gateway-header .subtitle { font-size: 12px; opacity: 0.7; margin-top: 4px; }

    .gateway-card {
      width: 100%;
      max-width: 460px;
      background: #fff;
      border-radius: 0 0 16px 16px;
      padding: 24px 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    .amount-section {
      text-align: center;
      padding: 16px;
      background: #f7f9fb;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .amount-label { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
    .amount-value { font-size: 26px; font-weight: 800; color: #1a3a5c; }
    .txn-id { font-size: 11px; color: #9ca3af; margin-top: 8px; direction: ltr; unicode-bidi: embed; }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .form-group input {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      font-size: 15px;
      font-family: Tahoma, Arial, sans-serif;
      direction: ltr;
      text-align: left;
      outline: none;
      transition: border-color 0.2s;
      background: #fafbfc;
    }
    .form-group input:focus { border-color: #1a3a5c; background: #fff; }
    .form-group input::placeholder { color: #b0b7c3; font-size: 13px; }

    .card-number-input { letter-spacing: 2px; font-family: 'Courier New', monospace; font-size: 17px !important; }

    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }

    .bank-indicator {
      display: flex; align-items: center; gap: 8px; padding: 10px 14px;
      background: #fefce8; border: 1px solid #fde68a; border-radius: 10px;
      margin-bottom: 20px; font-size: 12px; color: #92400e;
    }
    .bank-indicator .bank-logo {
      width: 32px; height: 32px; background: #1a3a5c; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 14px; font-weight: 700; flex-shrink: 0;
    }

    .btn-group { display: flex; gap: 10px; margin-top: 24px; }
    .btn-pay {
      flex: 2; padding: 14px 20px;
      background: linear-gradient(135deg, #1a3a5c 0%, #1e4d6e 100%);
      color: #fff; border: none; border-radius: 12px;
      font-size: 16px; font-weight: 700; font-family: Tahoma, Arial, sans-serif;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-pay:hover { background: linear-gradient(135deg, #152f4a 0%, #194059 100%); }
    .btn-pay:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-cancel {
      flex: 1; padding: 14px 20px; background: #f3f4f6; color: #6b7280;
      border: 1.5px solid #e5e7eb; border-radius: 12px;
      font-size: 14px; font-weight: 600; font-family: Tahoma, Arial, sans-serif;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-cancel:hover { background: #e5e7eb; color: #374151; }

    .spinner {
      width: 20px; height: 20px;
      border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.8s linear infinite; display: none;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .status-overlay {
      display: none; position: fixed; inset: 0; background: rgba(255,255,255,0.95);
      z-index: 100; justify-content: center; align-items: center; flex-direction: column;
    }
    .status-overlay.active { display: flex; }
    .status-overlay .status-icon { font-size: 64px; margin-bottom: 16px; }
    .status-overlay .status-text { font-size: 18px; font-weight: 700; color: #1a3a5c; }
    .status-overlay .status-sub { font-size: 14px; color: #6b7280; margin-top: 8px; }

    .secure-badge {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 16px; font-size: 11px; color: #9ca3af;
    }
    .secure-badge svg { width: 14px; height: 14px; }

    @media (max-width: 480px) {
      body { padding: 10px; }
      .gateway-header { padding: 18px 16px; }
      .gateway-card { padding: 18px 16px; }
      .amount-value { font-size: 22px; }
      .btn-group { flex-direction: column; }
      .btn-pay, .btn-cancel { flex: auto; }
    }
  </style>
</head>
<body>

  <div class="gateway-header">
    <div class="logo-area">
      <div class="logo-icon">🧶</div>
      <h1>درگاه پرداخت بافخانه</h1>
    </div>
    <div class="subtitle">پرداخت امن با رمزنگاری SSL</div>
  </div>

  <div class="gateway-card">
    <div class="amount-section">
      <div class="amount-label">مبلغ قابل پرداخت</div>
      <div class="amount-value">${escapeHtml(formattedAmount)}</div>
      <div class="txn-id">شناسه تراکنش: ${escapeHtml(formattedTxn)}</div>
    </div>

    <div class="bank-indicator">
      <div class="bank-logo">ملت</div>
      <span>کارت بانک ملت - درگاه شبیه‌سازی شده</span>
    </div>

    <form id="payForm" onsubmit="return false;">
      <div class="form-group">
        <label>شماره کارت</label>
        <input
          type="text" id="cardNumber" class="card-number-input"
          maxlength="19" placeholder="6219-8610-xxxx-xxxx"
          value="6219-8610-" autocomplete="off"
        />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>تاریخ انقضا</label>
          <input type="text" id="expDate" maxlength="5" placeholder="MM/YY" autocomplete="off" />
        </div>
        <div class="form-group">
          <label>CVV2</label>
          <input type="password" id="cvv2" maxlength="4" placeholder="****" autocomplete="off" />
        </div>
      </div>

      <div class="btn-group">
        <button type="button" class="btn-pay" id="payBtn" onclick="processPayment()">
          <span class="spinner" id="spinner"></span>
          <span id="payBtnText">پرداخت</span>
        </button>
        <button type="button" class="btn-cancel" onclick="cancelPayment()">انصراف</button>
      </div>
    </form>

    <div class="secure-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      <span>اتصال امن و رمزنگاری‌شده</span>
    </div>
  </div>

  <div class="status-overlay" id="statusOverlay">
    <div class="status-icon" id="statusIcon">⏳</div>
    <div class="status-text" id="statusText">در حال پردازش...</div>
    <div class="status-sub" id="statusSub">لطفاً منتظر بمانید</div>
  </div>

  <script>
    /* ===== Card number formatting ===== */
    var cardInput = document.getElementById('cardNumber');
    var expInput = document.getElementById('expDate');

    cardInput.addEventListener('input', function() {
      var digits = this.value.replace(/[^0-9]/g, '');
      if (digits.length > 16) digits = digits.substring(0, 16);
      if (!digits.startsWith('62198610') && digits.length < 8) {
        digits = '62198610';
      }
      var formatted = '';
      for (var i = 0; i < digits.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += '-';
        formatted += digits[i];
      }
      this.value = formatted;
    });

    expInput.addEventListener('input', function() {
      var digits = this.value.replace(/[^0-9]/g, '');
      if (digits.length > 4) digits = digits.substring(0, 4);
      if (digits.length >= 3) {
        digits = digits.substring(0, 2) + '/' + digits.substring(2);
      }
      this.value = digits;
    });

    /* ===== Server-embedded constants ===== */
    var TXN_ID = ${JSON.stringify(transactionId)};
    var ORDER_ID = ${JSON.stringify(orderId)};
    var SUCCESS_SIG = ${JSON.stringify(successSignature)};
    var FAILURE_SIG = ${JSON.stringify(failureSignature)};

    /* ===== Status overlay ===== */
    function showStatus(icon, text, sub) {
      document.getElementById('statusIcon').textContent = icon;
      document.getElementById('statusText').textContent = text;
      document.getElementById('statusSub').textContent = sub || '';
      document.getElementById('statusOverlay').classList.add('active');
    }

    function hideStatus() {
      document.getElementById('statusOverlay').classList.remove('active');
    }

    /* ===== Pay ===== */
    async function processPayment() {
      var cardDigits = cardInput.value.replace(/[^0-9]/g, '');
      var expDigits = expInput.value.replace(/[^0-9]/g, '');
      var cvvDigits = document.getElementById('cvv2').value.replace(/[^0-9]/g, '');

      if (cardDigits.length < 16) { alert('شماره کارت را کامل وارد کنید.'); return; }
      if (expDigits.length < 4) { alert('تاریخ انقضا را کامل وارد کنید.'); return; }
      if (cvvDigits.length < 3) { alert('CVV2 را وارد کنید.'); return; }

      var payBtn = document.getElementById('payBtn');
      var spinner = document.getElementById('spinner');
      var btnText = document.getElementById('payBtnText');
      payBtn.disabled = true;
      spinner.style.display = 'block';
      btnText.textContent = 'در حال پردازش...';

      showStatus('⏳', 'در حال اتصال به بانک...', 'لطفاً منتظر بمانید');

      await new Promise(function(r) { setTimeout(r, 2000); });

      try {
        var res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: TXN_ID,
            orderId: ORDER_ID,
            success: true,
            signature: SUCCESS_SIG
          })
        });

        var data = await res.json();

        if (data.success || (res.ok && !data.error)) {
          showStatus('✅', 'پرداخت موفق!', 'در حال بازگشت به فروشگاه...');
          setTimeout(function() {
            window.close();
            window.location.href = '/cart?payment=success&order=' + encodeURIComponent(ORDER_ID);
          }, 1500);
        } else {
          showStatus('❌', 'پرداخت ناموفق', data.error || 'خطایی رخ داد.');
          setTimeout(function() {
            hideStatus();
            payBtn.disabled = false;
            spinner.style.display = 'none';
            btnText.textContent = 'پرداخت';
          }, 2500);
        }
      } catch (err) {
        showStatus('❌', 'خطا در ارتباط', 'لطفاً دوباره تلاش کنید.');
        setTimeout(function() {
          hideStatus();
          payBtn.disabled = false;
          spinner.style.display = 'none';
          btnText.textContent = 'پرداخت';
        }, 2500);
      }
    }

    /* ===== Cancel ===== */
    async function cancelPayment() {
      showStatus('⏳', 'در حال انصراف...', '');

      try {
        await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: TXN_ID,
            orderId: ORDER_ID,
            success: false,
            signature: FAILURE_SIG
          })
        });
      } catch (e) {}

      setTimeout(function() {
        window.close();
        window.location.href = '/cart?payment=cancelled';
      }, 1000);
    }
  </script>
</body>
</html>`;
}