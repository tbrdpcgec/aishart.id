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
const handleWhatsApp = (order) => {
  let whatsappNumber = String(order.whatsapp || '').replace(/\D/g, '');

  if (!whatsappNumber) {
    alert('Nomor WhatsApp pelanggan tidak tersedia.');
    return;
  }

  // Mengubah nomor Indonesia ke format internasional
  if (whatsappNumber.startsWith('0')) {
    whatsappNumber = '62' + whatsappNumber.slice(1);
  } else if (whatsappNumber.startsWith('8')) {
    whatsappNumber = '62' + whatsappNumber;
  }

  const priceDetails = [
    priceMessageLine('Base Price', order.base_price),
    priceMessageLine('Additional Face', order.face_fee),
    priceMessageLine('Theme Fee', order.theme_fee),
    priceMessageLine('Other Fee', order.other_fee),
    priceMessageLine('Discount', order.discount),
    priceMessageLine('Express Fee', order.express_fee),
    priceMessageLine('Delivery Fee', order.delivery_fee),
  ].filter(Boolean);

  const paymentDetails = [
    priceMessageLine('Final Total', order.final_total),
    priceMessageLine('DP Paid', order.dp_paid),
    priceMessageLine('Remaining Payment', order.remaining_payment),
  ].filter(Boolean);

  const trackingLink = getTrackingLink(order);

  const message = `Halo ${order.customer_name || ''},

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

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};
  
  const statusCounts = {
    total: orders.length,
    waitingApproval: orders.filter((o) =>
      String(o.order_status).toLowerCase().includes('approval')
    ).length,
    waitingPayment: orders.filter((o) =>
      String(o.payment_status).toLowerCase().includes('waiting')
    ).length,
    production: orders.filter((o) => o.order_status === 'In Production').length,
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
                      </tr>
                    ))}

                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="26">No orders found.</td>
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
