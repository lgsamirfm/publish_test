import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, signPaymentResult } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { simulatedPaymentsEnabled } from "@/lib/payment";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function scriptValue(value: string) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function errorPage(message: string, status: number) {
  return htmlResponse(
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>درگاه آزمایشی</title></head><body style="font-family:Tahoma,sans-serif;padding:3rem;text-align:center"><h1>خطا</h1><p>${escapeHtml(message)}</p><a href="/cart">بازگشت به سبد خرید</a></body></html>`,
    status
  );
}

/**
 * Explicit local-development payment simulator. It never asks for or handles
 * card data, and the production guard is unconditional.
 */
export async function GET(req: NextRequest) {
  if (!simulatedPaymentsEnabled()) return new Response("Not Found", { status: 404 });

  let user;
  try {
    user = await requireUser();
  } catch {
    return errorPage("ابتدا وارد حساب شوید.", 401);
  }

  const transactionId = req.nextUrl.searchParams.get("txn");
  const orderId = req.nextUrl.searchParams.get("order");
  if (
    !transactionId ||
    transactionId.length > 128 ||
    !orderId ||
    orderId.length > 128
  ) {
    return errorPage("پارامترهای درخواست نامعتبر است.", 400);
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return errorPage("سفارش یافت نشد.", 404);
  if (order.userId !== user.id) return errorPage("دسترسی غیرمجاز است.", 403);
  if (
    order.transactionId !== transactionId ||
    order.paymentStatus !== "PENDING"
  ) {
    return errorPage("تراکنش قابل پردازش نیست.", 409);
  }

  const successSignature = signPaymentResult(transactionId, orderId, true);
  const failureSignature = signPaymentResult(transactionId, orderId, false);
  const amount = escapeHtml(formatPrice(order.total + order.shippingCost));

  return htmlResponse(`<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>شبیه‌ساز پرداخت توسعه</title>
  <style>
    body{font-family:Tahoma,Arial,sans-serif;background:#f3f4f6;margin:0;min-height:100vh;display:grid;place-items:center;color:#172033}
    main{width:min(92vw,460px);background:white;border:2px solid #dc2626;border-radius:18px;padding:28px;box-shadow:0 12px 35px #0002;text-align:center}
    .warning{background:#fef2f2;color:#991b1b;padding:14px;border-radius:10px;font-weight:700;line-height:1.8}
    .amount{font-size:1.5rem;font-weight:800;margin:24px 0}
    button,a{display:block;width:100%;box-sizing:border-box;border:0;border-radius:10px;padding:13px;margin-top:10px;font:inherit;cursor:pointer;text-decoration:none}
    #success{background:#15803d;color:white} #failure{background:#e5e7eb;color:#172033} a{color:#374151}
    button:disabled{opacity:.6;cursor:wait}
  </style>
</head>
<body>
<main>
  <div class="warning">فقط محیط توسعه — این یک بانک واقعی نیست.<br>هیچ اطلاعات کارت بانکی وارد نکنید.</div>
  <p class="amount">${amount}</p>
  <button id="success" type="button">شبیه‌سازی پرداخت موفق</button>
  <button id="failure" type="button">شبیه‌سازی پرداخت ناموفق</button>
  <a href="/cart">بازگشت بدون تغییر</a>
  <p id="status" aria-live="polite"></p>
</main>
<script>
const transactionId=${scriptValue(transactionId)};
const orderId=${scriptValue(orderId)};
const successSignature=${scriptValue(successSignature)};
const failureSignature=${scriptValue(failureSignature)};
async function complete(success){
  document.querySelectorAll('button').forEach(button=>button.disabled=true);
  document.getElementById('status').textContent='در حال ثبت نتیجه آزمایشی…';
  const response=await fetch('/api/payment/verify',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({transactionId,orderId,success,signature:success?successSignature:failureSignature})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){document.getElementById('status').textContent=data.error||'خطا';document.querySelectorAll('button').forEach(button=>button.disabled=false);return;}
  location.href='/cart?payment='+(success?'success':'cancelled')+'&order='+encodeURIComponent(orderId);
}
document.getElementById('success').addEventListener('click',()=>complete(true));
document.getElementById('failure').addEventListener('click',()=>complete(false));
</script>
</body></html>`);
}
