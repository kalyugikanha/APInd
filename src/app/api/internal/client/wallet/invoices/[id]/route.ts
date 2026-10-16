import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): { userId: string; role: string } | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload ? { userId: payload.userId, role: payload.role } : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getUserId(req);
    if (!auth) {
      return new Response("Unauthorized", { status: 401 });
    }

    const txId = params.id;
    const tx = await db.walletTransaction.findUnique({
      where: { id: txId },
      include: {
        wallet: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!tx) {
      return new Response("Transaction not found", { status: 404 });
    }

    // Tenant check: User must own the wallet or be SUPER_ADMIN
    if (auth.role !== "SUPER_ADMIN" && tx.wallet.userId !== auth.userId) {
      return new Response("Forbidden: You do not have access to this invoice", { status: 403 });
    }

    let meta: any = {};
    try {
      meta = tx.metadata ? JSON.parse(tx.metadata) : {};
    } catch {
      meta = {};
    }

    const user = tx.wallet.user;
    const invoiceNumber = meta.invoiceNumber || `CD-INV-${new Date(tx.createdAt).getFullYear()}-${tx.id.slice(-6)}`;
    const netAmount = meta.netAmount || tx.amount;
    const gstAmount = meta.gstAmount || Number((netAmount * 0.18).toFixed(2));
    const cgst = Number((gstAmount / 2).toFixed(2));
    const sgst = Number((gstAmount / 2).toFixed(2));
    const totalPaid = meta.totalPaid || Number((netAmount + gstAmount).toFixed(2));
    const paymentId = meta.paymentId || tx.referenceId || "N/A";
    const paymentMethod = meta.paymentMethod || "UPI / Online";
    const invoiceDate = new Date(tx.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoiceNumber} - Colladome</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px 20px; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 28px; border-bottom: 2px solid #0f172a; margin-bottom: 32px; }
    .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #09090b; }
    .brand-subtitle { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .invoice-tag { text-align: right; }
    .invoice-badge { display: inline-block; background: #09090b; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .invoice-num { font-size: 18px; font-weight: 700; margin-top: 8px; color: #0f172a; font-family: ui-monospace, monospace; }
    .invoice-date { font-size: 12px; color: #64748b; margin-top: 4px; }
    
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700; margin-bottom: 8px; }
    .meta-block p { font-size: 13px; line-height: 1.6; color: #334155; }
    .meta-block strong { color: #0f172a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { text-align: left; padding: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, monospace; }

    .summary-grid { display: flex; justify-content: flex-end; margin-bottom: 36px; }
    .summary-table { width: 320px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #475569; }
    .summary-total { display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; font-weight: 800; color: #09090b; border-top: 2px solid #0f172a; margin-top: 8px; }

    .payment-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; font-size: 12px; color: #475569; line-height: 1.6; margin-bottom: 32px; }
    .stamp-box { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; color: #10b981; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }

    .actions { max-width: 800px; margin: 24px auto 0; display: flex; justify-content: flex-end; gap: 12px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer; text-decoration: none; border: none; }
    .btn-primary { background: #09090b; color: #ffffff; }
    .btn-secondary { background: #ffffff; border: 1px solid #cbd5e1; color: #334155; }

    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-title">COLLADOME</div>
        <div class="brand-subtitle">API Gateway & Monetization Platform</div>
      </div>
      <div class="invoice-tag">
        <span class="invoice-badge">Tax Invoice (Original)</span>
        <div class="invoice-num">${invoiceNumber}</div>
        <div class="invoice-date">Invoice Date: ${invoiceDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-block">
        <h3>Supplier (Billed From)</h3>
        <p>
          <strong>Colladome Technologies Private Limited</strong><br>
          Cyber City, DLF Phase II, Sector 24<br>
          Gurugram, Haryana, 122002, India<br>
          <strong>GSTIN:</strong> 07AABCC1234F1Z5<br>
          <strong>PAN:</strong> AABCC1234F<br>
          <strong>State Code:</strong> 07 (Haryana)
        </p>
      </div>

      <div class="meta-block">
        <h3>Customer (Billed To)</h3>
        <p>
          <strong>${user.companyName || user.fullName}</strong><br>
          Client Code: <span class="font-mono">${user.clientCode}</span><br>
          Email: ${user.email}<br>
          ${user.phone ? `Phone: ${user.phone}<br>` : ""}
          Place of Supply: India<br>
          Reverse Charge: No
        </p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description of Services</th>
          <th>SAC Code</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Taxable Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>Colladome Gateway Verification Credits</strong><br>
            <span style="font-size: 11px; color: #64748b;">Direct prepaid wallet balance recharge for API hit authentication</span>
          </td>
          <td class="font-mono">998313</td>
          <td class="text-right">1</td>
          <td class="text-right font-mono">₹${netAmount.toFixed(2)}</td>
          <td class="text-right font-mono"><strong>₹${netAmount.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="summary-grid">
      <div class="summary-table">
        <div class="summary-row">
          <span>Total Taxable Amount</span>
          <span class="font-mono">₹${netAmount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>CGST (9.0%)</span>
          <span class="font-mono">₹${cgst.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>SGST (9.0%)</span>
          <span class="font-mono">₹${sgst.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Total GST (18.0%)</span>
          <span class="font-mono">₹${gstAmount.toFixed(2)}</span>
        </div>
        <div class="summary-total">
          <span>Grand Total (INR)</span>
          <span class="font-mono">₹${totalPaid.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="payment-info">
      <strong>Payment Confirmation & Audit Details:</strong><br>
      • Transaction ID / UTR: <span class="font-mono">${paymentId}</span><br>
      • Payment Method: ${paymentMethod}<br>
      • Payment Status: <strong style="color: #10b981;">SUCCESSFUL / CAPTURED</strong><br>
      • Colladome Internal Ref: <span class="font-mono">${tx.id}</span>
    </div>

    <div class="stamp-box">
      ✓ Electronically Generated Tax Invoice • No Physical Signature Required
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    console.error("Invoice generation error:", err);
    return new Response("Internal Server Error: " + err.message, { status: 500 });
  }
}
