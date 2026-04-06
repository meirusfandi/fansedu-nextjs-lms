# Midtrans Snap & webhook (backend)

Variabel lingkungan untuk **server API** (Go), bukan untuk build Next.js:

```bash
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_IS_PRODUCTION=false
# optional
MIDTRANS_SNAP_BASE_URL=
```

## Uji cepat (curl)

### 1) Buat payment session (respons berisi `redirect_url` Snap)

```bash
curl -s -X POST "http://localhost:8080/api/v1/checkout/payment-session" \
  -H "Content-Type: application/json" \
  -d '{
    "checkoutId": "<ORDER_ID>",
    "paymentMethod": "midtrans"
  }'
```

### 2) Simulasi webhook Midtrans (lokal)

`signature_key` harus valid sesuai formula Midtrans.

```bash
curl -s -X POST "http://localhost:8080/api/v1/webhook/payment" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<ORDER_ID>",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "status_code": "200",
    "gross_amount": "150000.00",
    "signature_key": "<MIDTRANS_SIGNATURE>"
  }'
```

## Admin (frontend LMS)

Di halaman **Manage → Payment**, panel **Pembayaran Midtrans (Snap)** memanggil endpoint yang sama untuk mengisi order/checkout ID dan membuka atau menyalin URL redirect.

## Hardening produksi (disarankan di backend)

- Menyimpan `snap_token` / `transaction_id` ke database.
- Mapping status Midtrans lengkap (expire, cancel, deny, refund, dll.).
- Idempotency pada webhook + audit log khusus payment.
