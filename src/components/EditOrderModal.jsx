import { useState } from 'react';
import { adminUpdateOrder } from '../services/admin';

const STATUS_OPTIONS = {
  express_status: ['N/A', 'Pending', 'Approved'],
  payment_status: ['Waiting Payment', 'DP 50%', 'Completed 100%'],
  order_status: [
    'Waiting Approval',
    'In Production',
    'Printing Process',
    'Packing',
    'On Delivery',
    'Completed',
  ],
};

const PRICE_FIELDS = [
  ['face_fee', 'Face Fee'],
  ['theme_fee', 'Theme Fee'],
  ['other_fee', 'Other Fee'],
  ['discount', 'Discount'],
  ['express_fee', 'Express Fee'],
  ['delivery_fee', 'Delivery Fee'],
];

const toNumberString = (value) => String(value ?? '').replace(/[^\d]/g, '');

export default function EditOrderModal({ order, token, onClose, onSaved }) {
  const [formData, setFormData] = useState(() => ({
    face_fee: toNumberString(order.face_fee),
    theme_fee: toNumberString(order.theme_fee),
    other_fee: toNumberString(order.other_fee),
    discount: toNumberString(order.discount),
    express_fee: toNumberString(order.express_fee),
    delivery_fee: toNumberString(order.delivery_fee),
    dp_paid: toNumberString(order.dp_paid),

    express_status: order.express_status || 'N/A',
    payment_status: order.payment_status || 'Waiting Payment',
    order_status: order.order_status || 'Waiting Approval',
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updates = {
        ...formData,
      };

      const result = await adminUpdateOrder(token, order.order_id, updates);

      if (!result.success) {
        throw new Error(result.message || 'Gagal memperbarui order.');
      }

      onSaved();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-order-overlay" onClick={onClose}>
      <div className="edit-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-order-header">
          <div>
            <h2>Edit Order</h2>
            <p>
              {order.order_id} · {order.customer_name}
            </p>
          </div>

          <button type="button" className="edit-order-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-order-content">
            {/* PRICE */}
            <section className="edit-order-section">
              <h3>PRICE</h3>

              <div className="edit-order-grid">
                {PRICE_FIELDS.map(([field, label]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      type="number"
                      min="0"
                      value={formData[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* PAYMENT */}
            <section className="edit-order-section">
              <h3>PAYMENT</h3>

              <div className="edit-order-grid">
                <label>
                  <span>DP Paid</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.dp_paid}
                    onChange={(e) => handleChange('dp_paid', e.target.value)}
                  />
                </label>
              </div>
            </section>

            {/* STATUS */}
            <section className="edit-order-section">
              <h3>STATUS</h3>

              <div className="edit-order-grid">
                {Object.entries(STATUS_OPTIONS).map(([field, options]) => (
                  <label key={field}>
                    <span>{field.replaceAll('_', ' ')}</span>

                    <select
                      value={formData[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                    >
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>

            {error && <div className="edit-order-error">{error}</div>}
          </div>

          <div className="edit-order-footer">
            <button
              type="button"
              className="edit-order-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-order-save"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
