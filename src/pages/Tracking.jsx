import { useEffect, useState } from 'react';
import { fetchOrderTracking } from '../services/tracking';

const TRACKING_STEPS = [
  { label: 'Waiting Payment', icon: 'clock' },
  { label: 'In Production', icon: 'palette' },
  { label: 'Printing', icon: 'printer' },
  { label: 'Packing', icon: 'package' },
  { label: 'On Delivery', icon: 'truck' },
  { label: 'Completed', icon: 'check' },
];

function getProgressIndex(status) {
  const normalized = String(status || '')
    .trim()
    .toLowerCase();

  const statusMap = {
  'waiting payment': 0,
  'dp confirmed': 0,
  'down payment confirmed': 0,
  'in production': 1,
  printing: 2,
  packing: 3,
  'on delivery': 4,
  completed: 5,
};

  return statusMap[normalized] ?? -1;
}

function StepIcon({ type }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const paths = {
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M16 14h.01" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.7-3.1 1.5 1.5 0 0 1 1.3-2.3H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z" />
        <path d="M7.5 10h.01M10 7h.01M15 7.5h.01" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h11v12H3zM14 10h4l3 4v4h-7z" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    clock: (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
),
printer: (
  <>
    <path d="M6 9V3h12v6" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M6 14h12v7H6z" />
  </>
),
  };

  return <svg {...common}>{paths[type]}</svg>;
}

export default function Tracking({ initialOrderId = '', initialOrderToken = '' }) {
const [orderId, setOrderId] = useState(initialOrderId);
const [orderToken, setOrderToken] = useState(initialOrderToken);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function searchOrder(id, token) {
  setLoading(true);
  setError('');
  setOrder(null);

  try {
    const result = await fetchOrderTracking(id, token);
    setOrder(result);
  } catch (err) {
    setError(err.message || 'Pesanan tidak ditemukan.');
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  if (initialOrderId && initialOrderToken) {
    searchOrder(initialOrderId, initialOrderToken);
  }
}, [initialOrderId, initialOrderToken]);

  
  async function handleSearch(e) {
  e.preventDefault();
  await searchOrder(orderId, orderToken);
}

  const activeStep = order ? getProgressIndex(order.order_status) : -1;

  return (
    <section id="tracking" className="tracking-section">
      <div className="tracking-container">
        <h2>Track Your Order</h2>
        <p>
          Masukkan nomor order dan kode akses untuk melihat progres pesananmu.
        </p>

        <form onSubmit={handleSearch} className="tracking-form">
          <input
            type="text"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Order Token"
            value={orderToken}
            onChange={(e) => setOrderToken(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Check Order'}
          </button>
        </form>

        {error && <p className="tracking-error">{error}</p>}

        {order && (
          <>
            <div className="tracking-progress">
              <h3>Order Progress</h3>

              <div className="tracking-steps">
                {TRACKING_STEPS.map((step, index) => (
                  <div
                    className={`tracking-step ${
                      index <= activeStep ? 'completed' : ''
                    } ${index === activeStep ? 'active' : ''}`}
                    key={step.label}
                  >
                    <div className="tracking-step-icon">
                      <StepIcon type={step.icon} />
                    </div>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tracking-result">
              <h3>Order Details</h3>
              <p>
                <strong>Order ID:</strong> {order.order_id}
              </p>
              <p>
                <strong>Customer:</strong> {order.customer_name}
              </p>
              <p>
                <strong>Product:</strong> {order.product_type}
              </p>
              <p>
                <strong>Frame:</strong> {order.frame_type || '-'}
              </p>
              <p>
                <strong>Size:</strong> {order.size || '-'}
              </p>
              <p>
                <strong>Quantity:</strong> {order.quantity}
              </p>
              <p>
                <strong>Total:</strong>{' '}
                {Number(order.final_total || 0).toLocaleString('id-ID')}
              </p>
              <p>
                <strong>Payment:</strong> {order.payment_status}
              </p>
              <p>
                <strong>Order Status:</strong> {order.order_status}
              </p>
              <p>
                <strong>Progress Note:</strong> {order.tracking_note || '-'}
              </p>
              <p>
                <strong>Estimated Completion:</strong>{' '}
                {order.estimated_completion || '-'}
              </p>
              <p>
                <strong>Delivery:</strong> {order.delivery_status || '-'}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
