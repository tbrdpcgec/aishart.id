import { useEffect, useState } from 'react';
import { adminGetOrders, adminLogout } from '../services/admin';
import EditOrderModal from './EditOrderModal';


export default function AdminPanel({ token, onLogout, onClose }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await adminGetOrders(token);

      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data order.');
      }

      setOrders(result.orders || []);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout(token);
    } finally {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_expires_at');
      onLogout();
    }
  };

  const formatRupiah = (value) => {
    const number = Number(String(value || 0).replace(/[^\d]/g, ''));
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

// Mengubah nilai harga menjadi angka
const getPriceNumber = (value) => {
  return Number(String(value ?? 0).replace(/[^\d-]/g, '')) || 0;
};

// Membuat baris harga hanya jika nilainya lebih dari 0
const priceMessageLine = (label, value) => {
  if (getPriceNumber(value) <= 0) return null;

  return `${label}: ${formatRupiah(value)}`;
};

// Membuat link tracking
const getTrackingLink = (order) => {
  const params = new URLSearchParams({
    order_id: order.order_id || '',
    order_token: order.order_token || '',
  });

  return `${window.location.origin}/?${params.toString()}`;
};

// Membuat pesan WhatsApp
const normalizeWhatsapp = (raw) => {
  let n = String(raw || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  else if (n.startsWith('8')) n = '62' + n;
  return n;
};

const getPriceRows = (order) =>
  [
    ['Base Price', order.base_price],
    ['Additional Face', order.face_fee],
    ['Theme Fee', order.theme_fee],
    ['Other Fee', order.other_fee],
    ['Discount', order.discount],
    ['Express Fee', order.express_fee],
    ['Delivery Fee', order.delivery_fee],
  ].filter(([, v]) => getPriceNumber(v) > 0);

const getPaymentRows = (order) =>
  [
    ['Final Total', order.final_total],
    ['DP Paid', order.dp_paid],
    ['Remaining Payment', order.remaining_payment],
  ].filter(([, v]) => getPriceNumber(v) > 0);

const buildWhatsAppMessage = (order) => {
  const priceDetails = getPriceRows(order).map(
    ([label, v]) => `${label}: ${formatRupiah(v)}`
  );
  const paymentDetails = getPaymentRows(order).map(
    ([label, v]) => `${label}: ${formatRupiah(v)}`
  );
  const trackingLink = getTrackingLink(order);

  // SALIN template `message` lama kamu ke sini (mulai dari `Halo ${order.customer_name || ''},` sampai `❤️.`)
  return `Halo ${order.customer_name || ''},

🎨 *aishart.id | ORDER CONFIRMATION*

Halo *${order.customer_name || 'Customer'}*! 👋

Terima kasih telah melakukan pemesanan di *@aishart.id*.

Berikut detail konfirmasi pesanan Anda:

━━━━━━━━━━━━━━━━━━
🧾 *ORDER INFORMATION*
━━━━━━━━━━━━━━━━━━

🔖 Order ID:
*${order.order_id || '-'}*

━━━━━━━━━━━━━━━━━━
🖼️ *DETAIL PESANAN*
━━━━━━━━━━━━━━━━━━

🎨 Produk: ${order.product_type || '-'}
🖼️ Frame: ${order.frame_type || '-'}
📐 Ukuran: ${order.size || '-'}

━━━━━━━━━━━━━━━━━━
💰 *RINCIAN HARGA*
━━━━━━━━━━━━━━━━━━

${priceDetails.length ? priceDetails.join('\n') : '-'}

━━━━━━━━━━━━━━━━━━
💳 *TOTAL PEMBAYARAN*
━━━━━━━━━━━━━━━━━━

${paymentDetails.join('\n') || '-'}

━━━━━━━━━━━━━━━━━━
🏦 *METODE PEMBAYARAN*
━━━━━━━━━━━━━━━━━━

*1. Bank Syariah Indonesia (BSI)*
No. Rekening: \`4386683570\`
Atas Nama: *Puji Alimin*

*2. SeaBank*
No. Rekening: \`08977340266\`
Atas Nama: *Puji Alimin*

━━━━━━━━━━━━━━━━━━

📌 *INFORMASI PEMBAYARAN*

Silakan melakukan pembayaran sesuai rincian di atas dan mengirimkan bukti pembayaran kepada admin untuk konfirmasi.

📦 *TRACKING PESANAN*

Pantau progres pesanan Anda melalui link berikut:

${trackingLink}

━━━━━━━━━━━━━━━━━━

Terima kasih telah mempercayakan momen spesial Anda kepada *@aishart.id*.

✨ *Your memories, made timeless.* ❤️.`;
};

const handleWhatsApp = (order) => {
  const number = normalizeWhatsapp(order.whatsapp);
  if (!number) {
    alert('Nomor WhatsApp pelanggan tidak tersedia.');
    return;
  }
  const url = `https://wa.me/${number}?text=${encodeURIComponent(
    buildWhatsAppMessage(order)
  )}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const buildInvoicePdf = async (order) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ===== Tema (samakan dengan CSS web kamu) =====
  const THEME = {
    bg: [255, 248, 241],     // krem latar halaman
    card: [255, 255, 255],   // kartu putih
    line: [232, 213, 196],   // garis/border lembut
    brand: [155, 98, 71],    // cokelat utama (warna tombol Login)
    dark: [74, 48, 36],      // cokelat tua untuk teks
    muted: [140, 115, 100],  // teks sekunder
  };
  const FONT_HEADING = 'times';     // serif, mirip judul "Admin Login"
  const FONT_BODY = 'helvetica';    // sans-serif untuk isi

  const W = 210, H = 297, L = 20, R = 190, ROW = 6.8;
  let y = 0;

  const txt = (s, x, o = {}) => {
    const { size = 10.5, style = 'normal', font = FONT_BODY, color = THEME.dark, align = 'left' } = o;
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(String(s ?? '-'), x, y, { align });
  };

  const row = (label, value, o = {}) => {
    txt(label, L + 6, { color: o.labelColor || THEME.muted, style: o.bold ? 'bold' : 'normal' });
    txt(value, R - 6, { align: 'right', style: o.bold ? 'bold' : 'normal', color: o.color || THEME.dark });
    y += ROW;
  };

  const drawCard = (height) => {
    doc.setFillColor(...THEME.card);
    doc.setDrawColor(...THEME.line);
    doc.setLineWidth(0.3);
    doc.roundedRect(L, y, R - L, height, 3, 3, 'FD');
  };

  const cardTitle = (title) => {
    y += 8;
    txt(title.toUpperCase(), L + 6, { size: 8.5, style: 'bold', color: THEME.brand });
    y += 7;
  };

  const simpleCard = (title, rows) => {
    const top = y;
    const h = 8 + 7 + rows.length * ROW + 2;
    drawCard(h);
    cardTitle(title);
    rows.forEach(([l, v]) => row(l, v));
    y = top + h + 6;
  };

  // ===== Latar halaman =====
  doc.setFillColor(...THEME.bg);
  doc.rect(0, 0, W, H, 'F');

  // ===== Header =====
  y = 28;
  txt('@aishart.id', L, { size: 26, style: 'bold', font: FONT_HEADING, color: THEME.brand });
  txt('INVOICE', R, { size: 9, style: 'bold', color: THEME.brand, align: 'right' });
  y += 7;
  txt('Your memories, made timeless.', L, { size: 10, style: 'italic', font: FONT_HEADING, color: THEME.muted });
  txt(order.order_id || '-', R, { size: 15, style: 'bold', font: FONT_HEADING, align: 'right' });
  y += 6;
  txt(order.order_date || '-', R, { size: 9.5, color: THEME.muted, align: 'right' });
  y += 5;
  doc.setDrawColor(...THEME.brand);
  doc.setLineWidth(0.6);
  doc.line(L, y, R, y);
  y += 9;

  // ===== Customer & Pesanan =====
  simpleCard('Customer', [
    ['Nama', order.customer_name || '-'],
    ['WhatsApp', order.whatsapp || '-'],
  ]);

  simpleCard('Pesanan', [
    ['Produk', order.product_type || '-'],
    ['Frame', order.frame_type || '-'],
    ['Ukuran', order.size || '-'],
  ]);

  // ===== Rincian harga =====
  const priceRows = [
    ['Base price', order.base_price, false],
    ['Additional face', order.face_fee, false],
    ['Theme fee', order.theme_fee, false],
    ['Other fee', order.other_fee, false],
    ['Express fee', order.express_fee, false],
    ['Delivery fee', order.delivery_fee, false],
    ['Discount', order.discount, true],
  ].filter(([, v]) => getPriceNumber(v) > 0);

  const hasDp = getPriceNumber(order.dp_paid) > 0;
  const hasRemaining = getPriceNumber(order.remaining_payment) > 0;
  const extraRows = (hasDp ? 1 : 0) + (hasRemaining ? 1 : 0);

  const priceTop = y;
  const priceH = 8 + 7 + priceRows.length * ROW + 3 + 11 + 3 + extraRows * ROW + 2;
  drawCard(priceH);
  cardTitle('Rincian harga');

  priceRows.forEach(([label, v, isDiscount]) =>
    row(label, `${isDiscount ? '- ' : ''}${formatRupiah(v)}`)
  );

  // Baris Total (disorot)
  y += 1;
  doc.setFillColor(...THEME.brand);
  doc.roundedRect(L + 4, y - 1, R - L - 8, 11, 2, 2, 'F');
  y += 6.2;
  txt('Total', L + 8, { style: 'bold', color: [255, 255, 255], size: 11 });
  txt(formatRupiah(order.final_total), R - 8, {
    style: 'bold', color: [255, 255, 255], size: 11, align: 'right',
  });
  y += 8.5;

  if (hasDp) row('DP dibayar', formatRupiah(order.dp_paid));
  if (hasRemaining) {
    row('Sisa pembayaran', formatRupiah(order.remaining_payment), {
      bold: true, color: THEME.brand, labelColor: THEME.dark,
    });
  }
  y = priceTop + priceH + 6;

  // ===== Metode pembayaran =====
  simpleCard('Metode pembayaran', [
    ['Bank Syariah Indonesia (BSI)', '4386683570'],
    ['SeaBank', '08977340266'],
    ['Atas nama', 'Puji Alimin'],
  ]);

  // ===== Lacak pesanan =====
  const trackTop = y;
  const trackH = 8 + 7 + 6 + 2;
  drawCard(trackH);
  cardTitle('Lacak pesanan');
  const link = getTrackingLink(order);
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...THEME.brand);
  doc.textWithLink('Klik di sini untuk melacak progres pesanan', L + 6, y, { url: link });
  y = trackTop + trackH + 6;

  // ===== Penutup =====
  y = H - 22;
  doc.setDrawColor(...THEME.line);
  doc.setLineWidth(0.3);
  doc.line(L, y - 8, R, y - 8);
  txt('Making ordinary moments feel extraordinary.', W / 2, {
    size: 10.5, style: 'italic', font: FONT_HEADING, color: THEME.muted, align: 'center',
  });

  return doc.output('blob');
};

const handleInvoice = async (order) => {
  const number = normalizeWhatsapp(order.whatsapp);
  if (!number) {
    alert('Nomor WhatsApp pelanggan tidak tersedia.');
    return;
  }

  try {
    const blob = await buildInvoicePdf(order);
    const fileName = `Invoice-${order.order_id || 'order'}.pdf`;
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const message = buildWhatsAppMessage(order);

    // HP: kirim PDF + teks langsung lewat menu share (pilih WhatsApp, lalu chat pelanggan)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: message, title: fileName });
      return;
    }

    // Desktop: unduh PDF, lalu buka chat WhatsApp berisi teks yang sama
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
    alert('PDF sudah terunduh. Lampirkan file PDF tersebut di chat WhatsApp.');
  } catch (err) {
    if (err?.name !== 'AbortError') {
      alert('Gagal membuat invoice: ' + (err.message || 'unknown error'));
    }
  }
};
  
  const statusCounts = {
  total: orders.length,
  waitingApproval: orders.filter((o) =>
    String(o.order_status).toLowerCase().includes('approval')
  ).length,
  waitingPayment: orders.filter((o) => {
    const orderStatus = String(o.order_status).toLowerCase();
    const paymentStatus = String(o.payment_status).toLowerCase();
    return orderStatus === 'waiting payment' || paymentStatus.includes('waiting');
  }).length,
  production: orders.filter((o) => o.order_status === 'In Production').length,
  printing: orders.filter((o) => o.order_status === 'Printing').length,
  packing: orders.filter((o) => o.order_status === 'Packing').length,
  delivery: orders.filter((o) => o.order_status === 'On Delivery').length,
  completed: orders.filter((o) => o.order_status === 'Completed').length,
};

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'All') return true;
    return order.order_status === statusFilter;
  });

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel-modal">
        <header className="admin-panel-header">
          <div>
            <h2>@aishart.id</h2>
            <p>Order Management</p>
          </div>

          <div className="admin-panel-header-actions">
            <button onClick={loadOrders}>Refresh</button>
            <button onClick={handleLogout}>Logout</button>
            <button onClick={onClose}>×</button>
          </div>
        </header>

        <nav className="admin-panel-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Table Order
          </button>
        </nav>

        <main className="admin-panel-content">
          {loading ? (
            <p>Loading orders...</p>
          ) : error ? (
            <p className="admin-panel-error">{error}</p>
          ) : activeTab === 'dashboard' ? (
            <div className="admin-dashboard">
              <h3>Dashboard Overview</h3>

              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span>Total Orders</span>
                  <strong>{statusCounts.total}</strong>
                </div>

                <div className="admin-stat-card">
                  <span>Waiting Approval</span>
                  <strong>{statusCounts.waitingApproval}</strong>
                </div>

                <div className="admin-stat-card">
                  <span>Waiting Payment</span>
                  <strong>{statusCounts.waitingPayment}</strong>
                </div>

                <div className="admin-stat-card">
                  <span>In Production</span>
                  <strong>{statusCounts.production}</strong>
                </div>

                <div className="admin-stat-card">
  <span>Printing</span>
  <strong>{statusCounts.printing}</strong>
</div>

                <div className="admin-stat-card">
                  <span>Packing</span>
                  <strong>{statusCounts.packing}</strong>
                </div>

                <div className="admin-stat-card">
                  <span>On Delivery</span>
                  <strong>{statusCounts.delivery}</strong>
                </div>

                <div className="admin-stat-card">
                  <span>Completed</span>
                  <strong>{statusCounts.completed}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-orders">
              <div className="admin-orders-heading">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="admin-status-filter"
                >
                  <option value="All">All Orders</option>
                  {[
                    ...new Set(
                      orders.map((order) => order.order_status).filter(Boolean)
                    ),
                  ]
                    .sort()
                    .map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                </select>

                <span>{filteredOrders.length} orders</span>
              </div>

              <div className="admin-orders-table-wrapper">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>Edit</th>
                      <th>Order ID</th>
                      <th>Order Date</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Frame</th>
                      <th>Size</th>
                      <th>Base Price</th>

                      <th>Face Fee</th>
                      <th>Theme Fee</th>
                      <th>Other Fee</th>
                      <th>Discount</th>
                      <th>Express Fee</th>
                      <th>Delivery Fee</th>
                      <th>Final Total</th>

                      <th>DP Paid</th>
                      <th>Remaining Payment</th>
                      <th>Payment Status</th>

                      <th>Standard Max Days</th>
                      <th>Estimated Completion</th>

                      <th>Requested Date</th>
                      <th>Requested Time</th>
                      <th>Express Status</th>
<th>Order Status</th>
<th>Tracking</th>
<th>WhatsApp</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <tr key={order.order_id || index}>
                        <td>
                          <button
                            type="button"
                            className="admin-edit-button"
                            title="Edit Order"
                            onClick={() => setEditingOrder(order)}
                          >
                            ✎
                          </button>
                        </td>
                        <td>{order.order_id}</td>
                        <td>{order.order_date}</td>
                        <td>{order.customer_name}</td>
                        <td>{order.product_type}</td>
                        <td>{order.frame_type}</td>
                        <td>{order.size}</td>
                        <td>{formatRupiah(order.base_price)}</td>

                        <td>{formatRupiah(order.face_fee)}</td>
                        <td>{formatRupiah(order.theme_fee)}</td>
                        <td>{formatRupiah(order.other_fee)}</td>
                        <td>{formatRupiah(order.discount)}</td>
                        <td>{formatRupiah(order.express_fee)}</td>
                        <td>{formatRupiah(order.delivery_fee)}</td>
                        <td>
                          <strong>{formatRupiah(order.final_total)}</strong>
                        </td>

                        <td>{formatRupiah(order.dp_paid)}</td>
                        <td>{formatRupiah(order.remaining_payment)}</td>
                        <td>{order.payment_status}</td>

                        <td>{order.standard_max_days}</td>
                        <td>{order.estimated_completion}</td>

                        <td>{order.requested_completion_date}</td>
                        <td>{order.requested_completion_time}</td>
                        <td>{order.express_status}</td>
<td>{order.order_status}</td>

<td className="admin-action-cell">
  {order.order_id && order.order_token ? (
    <a
      href={getTrackingLink(order)}
      target="_blank"
      rel="noopener noreferrer"
      className="admin-action-button tracking-action-button"
      title="Open Tracking"
    >
      Tracking
    </a>
  ) : (
    <span>-</span>
  )}
</td>

<td className="admin-action-cell">
  <button
    type="button"
    className="admin-action-button whatsapp-action-button"
    title="Send WhatsApp Confirmation"
    onClick={() => handleWhatsApp(order)}
  >
    WhatsApp
  </button>
</td>
                      <td className="admin-action-cell">
  <button
    type="button"
    className="admin-action-button invoice-action-button"
    title="Kirim Invoice PDF + Tracking"
    onClick={() => handleInvoice(order)}
  >
    Invoice PDF
  </button>
</td>
                      </tr>
                    ))}

                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="27">No orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
      {editingOrder && (
  <EditOrderModal
    order={editingOrder}
    token={token}
    onClose={() => setEditingOrder(null)}
    onSaved={async () => {
      setEditingOrder(null);
      await loadOrders();
    }}
  />
)}
    </div>

    
  );
}
