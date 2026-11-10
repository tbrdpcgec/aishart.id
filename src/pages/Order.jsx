import { useEffect, useMemo, useState } from 'react';
import { fetchPrices, fetchSettings, fetchOptions } from '../services/sheets';
import { submitOrder } from '../services/orders';
import { formatRupiah } from '../data/pricing';

const DEFAULT_SIZES = [
  '21x30',
  '30x40',
  '30x45',
  '40x50',
  '40x60',
  '60x60',
  '60x80',
];

const FRAME_TYPES = [
  {
    id: 'PUTIH POLOS',
    name: 'Putih Polos',
    description: 'Clean and minimalist',
  },
  {
    id: 'PUTIH EMAS',
    name: 'Putih Emas',
    description: 'Elegant with golden accents',
  },
  {
    id: 'PUTIH UKIR',
    name: 'Putih Ukir',
    description: 'Classic decorative style',
  },
];

function isSizeAbove3040(size) {
  if (!size) return false;

  const dimensions = String(size)
    .toLowerCase()
    .split('x')
    .map((value) => Number(value.trim()));

  if (dimensions.length !== 2 || dimensions.some(Number.isNaN)) {
    return false;
  }

  const [width, height] = dimensions;

  return Math.max(width, height) > 40 || Math.min(width, height) > 30;
}

export default function Order({ initialProduct = '' }) {
  const [productType, setProductType] = useState('Personalized Framed Artwork');
  const [frameType, setFrameType] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [options, setOptions] = useState([]);
  const [faceCount, setFaceCount] = useState(1);
  const [theme, setTheme] = useState('');

  const [serviceType, setServiceType] = useState('STANDARD');
  const [requestedCompletionDate, setRequestedCompletionDate] = useState('');
  const [requestedCompletionTime, setRequestedCompletionTime] = useState('');

  // Pickup & Delivery
  const [deliveryMethod, setDeliveryMethod] = useState('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMapsUrl, setDeliveryMapsUrl] = useState('');

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupMapsUrl, setPickupMapsUrl] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const settings = await fetchSettings();

        if (cancelled) return;

        const number = (settings.contact_whatsapp || '').replace(/\D/g, '');
        setWhatsappNumber(number);
        setPickupAddress(settings.pickup_address || '');
        setPickupMapsUrl(settings.pickup_maps_url || '');
      } catch (err) {
        console.error('Gagal memuat Settings:', err);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleContactAdmin(type) {
    if (!whatsappNumber) {
      alert('WhatsApp admin belum tersedia. Silakan coba lagi.');
      return;
    }

    const messages = {
      consultation:
        'Hello Admin! I would like to consult about your caricature and frame services before placing an order. Could you please assist me?',
      chat: 'Hello Admin! I would like to ask about your caricature and frame services.',
    };

    const message = messages[type] || messages.chat;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  // form pelanggan
  const [customer, setCustomer] = useState({
    name: '',
    whatsapp: '',
    clothingDescription: '',
    backgroundDescription: '',
    artworkText: '',
    artworkDescription: '',
  });

  // Mengambil harga dari Google Sheets.
  useEffect(() => {
    let cancelled = false;

    async function loadPrices() {
      try {
        setLoading(true);
        setError('');

        const data = await fetchPrices();

        if (cancelled) return;

        setPrices(data);

        // Jangan memilih ukuran secara otomatis.
        // Pelanggan harus memilih sendiri.

        setSize('');

        // Jangan memilih frame secara otomatis.
        setFrameType('');
      } catch (err) {
        if (!cancelled) {
          console.error('Gagal memuat harga:', err);
          setError(err.message || 'Gagal memuat harga.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPrices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const data = await fetchOptions();

        if (cancelled) return;

        setOptions(data);
      } catch (err) {
        console.error('Gagal memuat Options:', err);
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sinkronkan pilihan produk dengan tombol dari halaman Home.
  useEffect(() => {
    setProductType('Personalized Framed Artwork');
    setFrameType('');
    setSize('');
  }, [initialProduct]);

  const sizes = prices?.sizes?.length > 0 ? prices.sizes : DEFAULT_SIZES;

  const unitPrice = useMemo(() => {
    if (!prices || !frameType || !size) return 0;

    return prices['Personalized Framed Artwork']?.[frameType]?.[size] ?? 0;
  }, [prices, frameType, size]);

  const isOrderComplete = Boolean(frameType) && Boolean(size) && unitPrice > 0;

  const totalPrice = unitPrice * quantity;

  const additionalFacePrice = useMemo(() => {
    const faceOption = options.find(
      (item) => item.type === 'FACE' && item.option === 'Additional Face'
    );

    const pricePerFace = faceOption?.price ?? 30000;

    return Math.max(0, Number(faceCount) - 1) * pricePerFace;
  }, [options, faceCount]);

  const isLargeSize = isSizeAbove3040(size);

  const standardMinDays = theme === 'Complex' || isLargeSize ? 4 : 3;

  const standardMaxDays = theme === 'Complex' || isLargeSize ? 5 : 4;

  const themePrice = useMemo(() => {
    const themeOption = options.find(
      (item) =>
        item.type === 'THEME' &&
        item.option.toLowerCase() === theme.toLowerCase()
    );

    return themeOption?.price ?? 0;
  }, [options, theme]);

  const estimatedTotal = useMemo(() => {
    return unitPrice * quantity + additionalFacePrice + themePrice;
  }, [unitPrice, quantity, additionalFacePrice, themePrice]);

  const availableFrames = prices
    ? FRAME_TYPES.filter(
        (frame) => prices['Personalized Framed Artwork']?.[frame.id]
      )
    : FRAME_TYPES;

  function handleRetry() {
    window.location.reload();
  }

  ///reset order
  function resetOrderForm() {
    setProductType('Personalized Framed Artwork');
    setFrameType('');
    setSize('');
    setQuantity(1);
    setFaceCount(1);
    setTheme('');

    setCustomer({
      name: '',
      whatsapp: '',
      clothingDescription: '',
      backgroundDescription: '',
      artworkText: '',
      artworkDescription: '',
    });

    setShowCustomerForm(false);
    setSubmitError('');

    setServiceType('STANDARD');
    setRequestedCompletionDate('');
    setRequestedCompletionTime('');

    setDeliveryMethod('PICKUP');
    setDeliveryAddress('');
    setDeliveryMapsUrl('');
  }

  async function handleSubmitOrder(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitError('');

    if (!isOrderComplete) {
      setSubmitError('Silakan pilih frame dan ukuran terlebih dahulu.');
      return;
    }

    if (
      serviceType === 'EXPRESS' &&
      (!requestedCompletionDate || !requestedCompletionTime)
    ) {
      setSubmitError(
        'Silakan pilih tanggal dan batas waktu penyelesaian untuk Express Order.'
      );
      return;
    }

    if (!customer.name.trim() || !customer.whatsapp.trim()) {
      setSubmitError('Nama dan nomor WhatsApp wajib diisi.');
      return;
    }

    if (!whatsappNumber) {
      setSubmitError(
        'Nomor WhatsApp admin belum tersedia. Periksa contact_whatsapp di Settings.'
      );
      return;
    }

    // Buka tab terlebih dahulu agar tidak mudah diblokir browser.

    setSubmitting(true);

    try {
      const orderData = {
        customer_name: customer.name.trim(),
        whatsapp: customer.whatsapp.trim(),
        product_type: 'Personalized Framed Artwork',
        frame_type: frameType,
        size,
        quantity,
        face_count: faceCount,
        theme: theme,
        clothing_description: customer.clothingDescription,
        background_description: customer.backgroundDescription,
        artwork_text: customer.artworkText,
        customer_note: customer.artworkDescription.trim(),
        reference_url: '',
        base_price: unitPrice,
        face_fee: additionalFacePrice,
        theme_fee: themePrice,
        other_fee: 0,
        discount: 0,

        // Production time & Express Order
        service_type: serviceType,
        standard_min_days: standardMinDays,
        standard_max_days: standardMaxDays,
        requested_completion_date:
          serviceType === 'EXPRESS' ? requestedCompletionDate : '',
        requested_completion_time:
          serviceType === 'EXPRESS' ? requestedCompletionTime : '',

        // Pickup & Delivery
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === 'DELIVERY' ? deliveryAddress : '',
        delivery_maps_url: deliveryMethod === 'DELIVERY' ? deliveryMapsUrl : '',

        delivery_fee: 0,

        delivery_status: deliveryMethod === 'DELIVERY' ? 'Pending' : 'N/A',

        delivery_admin_notes: '',
      };

      const result = await submitOrder(orderData);

      const message = [
  '🎨 *aishart.id | ORDER CONFIRMATION*',
  '',
  `Halo *${customer.name}*! 👋`,
  'Terima kasih telah melakukan pemesanan di *@aishart.id*.',
  '',
  'Berikut detail pesanan yang ingin saya konfirmasi:',
  '',
  '━━━━━━━━━━━━━━━━━━',
  '🧾 *ORDER INFORMATION*',
  '━━━━━━━━━━━━━━━━━━',
  `🔖 Order ID: *${result.order_id}*`,
  '',
  '━━━━━━━━━━━━━━━━━━',
  '👤 *DETAIL CUSTOMER*',
  '━━━━━━━━━━━━━━━━━━',
  `👤 Nama: ${customer.name}`,
  `📱 WhatsApp: ${customer.whatsapp}`,
  '',
  '━━━━━━━━━━━━━━━━━━',
  '🖼️ *DETAIL PESANAN*',
  '━━━━━━━━━━━━━━━━━━',
  '🎨 Produk: Personalized Framed Artwork',
  `🖼️ Frame: ${frameType}`,
  `📐 Ukuran: ${size}`,
  `📦 Jumlah pesanan: ${quantity}`,
  `👥 Jumlah wajah: ${faceCount}`,
  `🎭 Tema artwork: ${theme}`,
  '',
  '━━━━━━━━━━━━━━━━━━',
  '✏️ *KUSTOMISASI ARTWORK*',
  '━━━━━━━━━━━━━━━━━━',
  `👕 Pakaian / Seragam: ${customer.clothingDescription}`,
  `🏞️ Background: ${customer.backgroundDescription}`,
  `💬 Ucapan / Teks: ${customer.artworkText || '-'}`,
  `📝 Deskripsi Artwork: ${customer.artworkDescription || '-'}`,
  '',
  '━━━━━━━━━━━━━━━━━━',
  '⏱️ *LAYANAN & ESTIMASI PENGERJAAN*',
  '━━━━━━━━━━━━━━━━━━',
  `⚡ Layanan: ${
    serviceType === 'EXPRESS' ? 'Express Order' : 'Standard Order'
  }`,
  `📅 Estimasi standar: ${standardMinDays}-${standardMaxDays} hari kerja`,
  ...(serviceType === 'EXPRESS'
    ? [
        `📆 Tanggal yang diminta: ${requestedCompletionDate}`,
        `🕒 Target waktu: Sebelum ${requestedCompletionTime}`,
        '📌 Status Express: Waiting Approval',
      ]
    : []),
  '',
  '📍 Catatan: Estimasi mulai dihitung setelah DP 50% diterima dan dikonfirmasi admin.',
  '',
  '━━━━━━━━━━━━━━━━━━',
  '🚚 *METODE PENERIMAAN PESANAN*',
  '━━━━━━━━━━━━━━━━━━',
  `📦 Metode: ${
    deliveryMethod === 'PICKUP'
      ? 'Ambil Sendiri'
      : 'Dikirim ke Alamat Saya'
  }`,
  ...(deliveryMethod === 'PICKUP'
    ? [
        `📍 Alamat Pickup: ${pickupAddress}`,
        `🗺️ Google Maps: ${pickupMapsUrl || '-'}`,
      ]
    : [
        `📍 Alamat Pengiriman: ${deliveryAddress}`,
        `🗺️ Google Maps: ${deliveryMapsUrl || '-'}`,
        '💰 Biaya Pengiriman: Waiting Approval',
      ]),
  '',
  '━━━━━━━━━━━━━━━━━━',
  '💰 *RINCIAN HARGA*',
  '━━━━━━━━━━━━━━━━━━',
  `🖼️ Harga produk: ${formatRupiah(unitPrice * quantity)}`,
  `👥 Biaya tambahan wajah: ${formatRupiah(additionalFacePrice)}`,
  `🎭 Biaya tema: ${formatRupiah(themePrice)}`,
  '',
  `💵 *ESTIMASI TOTAL: ${formatRupiah(estimatedTotal)}*`,
  '',
  '━━━━━━━━━━━━━━━━━━',
  '🙏 *KONFIRMASI PESANAN*',
  '━━━━━━━━━━━━━━━━━━',
  'Mohon konfirmasi pesanan dan harga final saya.',
  '',
  'Terima kasih! ❤️',
  '',
  '✨ *Your memories, made timeless.*',
].join('\n');

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        message
      )}`;

      window.open(whatsappUrl, '_blank');

      resetOrderForm();
      console.log('Reset form berhasil dipanggil');
    } catch (err) {
      console.error('Gagal mengirim pesanan:', err);

      setSubmitError(
        err.message || 'Pesanan gagal disimpan. Silakan coba kembali.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="order-section" id="order">
      <div className="order-heading">
        <span className="eyebrow">LET'S CREATE SOMETHING SPECIAL</span>

        <h2>
          Customize your <span>artwork.</span>
        </h2>

        <p>Customize your personalized framed artwork.</p>
      </div>

      {loading && (
        <div className="order-status" role="status">
          <span className="loading-spinner" />
          <span>Memuat katalog dan harga...</span>
        </div>
      )}

      {!loading && error && (
        <div className="order-error" role="alert">
          <strong>Harga belum dapat dimuat.</strong>
          <p>{error}</p>
          <button className="button button-dark" onClick={handleRetry}>
            Coba Lagi
          </button>
        </div>
      )}

      {!loading && !error && prices && (
        <div className="order-layout">
          <div className="order-form">
            <div className="form-group">
              <label>Your Product</label>
              <div className="choice-grid">
                <div className="choice-card selected">
                  <strong>Personalized Framed Artwork</strong>
                  <span>Custom artwork with your preferred frame.</span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Pilih Frame</label>

              <div className="choice-grid">
                {availableFrames.map((frame) => (
                  <button
                    type="button"
                    key={frame.id}
                    className={`choice-card ${
                      frameType === frame.id ? 'selected' : ''
                    }`}
                    onClick={() => setFrameType(frame.id)}
                  >
                    <strong>{frame.name}</strong>
                    <span>{frame.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Pilih Ukuran</label>

              <div className="size-grid">
                {sizes.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`size-option ${size === item ? 'selected' : ''}`}
                    onClick={() => setSize(item)}
                  >
                    {item.replace('x', ' × ')} cm
                  </button>
                ))}
              </div>
            </div>
           <div className="quantity-row">
  <div className="form-group">
    <label>Jumlah Wajah</label>

    <div className="quantity-control">
      <button
        type="button"
        aria-label="Kurangi jumlah wajah"
        onClick={() =>
          setFaceCount((count) => Math.max(1, count - 1))
        }
        disabled={faceCount <= 1}
      >
        −
      </button>

      <span>{faceCount}</span>

      <button
        type="button"
        aria-label="Tambah jumlah wajah"
        onClick={() => setFaceCount((count) => count + 1)}
      >
        +
      </button>
    </div>
  </div>
</div>

            {/* Pilihan tema */}
            <div className="form-group">
              <label>Artwork Theme</label>

              <div className="theme-descriptions">
                {options
                  .filter((item) => item.type === 'THEME')
                  .map((item) => {
                    const descriptions = {
                      Simple:
                        'Tema dan background sederhana, seperti studio atau warna polos.',
                      Custom: 'Tema dan background sesuai permintaan customer.',
                      Complex:
                        'Tema dan background detail dengan banyak objek atau permintaan yang rumit.',
                    };

                    return (
                      <button
                        key={item.option}
                        type="button"
                        className={`theme-option ${
                          theme === item.option ? 'selected' : ''
                        }`}
                        onClick={() => setTheme(item.option)}
                      >
                        <span className="theme-option-header">
                          <strong>{item.option}</strong>

                          <span className="theme-option-price">
                            {item.price === 0
                              ? 'Free'
                              : `Start from ${formatRupiah(item.price)}`}
                          </span>
                        </span>

                        <span className="theme-option-description">
                          {descriptions[item.option] || ''}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          <aside className="order-summary">
            <span className="eyebrow">YOUR SELECTION</span>

            <h3>Order Summary</h3>

            <div className="summary-line">
              <span>Product</span>
              <strong>Personalized Framed Artwork</strong>
            </div>

            <div className="summary-line">
              <span>Frame</span>
              <strong>
                {FRAME_TYPES.find((frame) => frame.id === frameType)?.name ||
                  frameType ||
                  '-'}
              </strong>
            </div>

            <div className="summary-line">
              <span>Size</span>
              <strong>{size.replace('x', ' × ')} cm</strong>
            </div>

            <div className="summary-line">
              <span>Unit price</span>
              <strong>{formatRupiah(unitPrice)}</strong>
            </div>

            <div className="summary-line">
              <span>Quantity</span>
              <strong>{quantity}</strong>
            </div>

            <div className="summary-line">
              <span>Number of Faces</span>
              <strong>{faceCount}</strong>
            </div>

            <div className="summary-line">
              <span>Artwork Theme</span>
              <strong>{theme || '-'}</strong>
            </div>

            {additionalFacePrice > 0 && (
              <div className="summary-line">
                <span>Additional Faces</span>
                <strong>{formatRupiah(additionalFacePrice)}</strong>
              </div>
            )}

            {themePrice > 0 && (
              <div className="summary-line">
                <span>Theme Fee</span>
                <strong>{formatRupiah(themePrice)}</strong>
              </div>
            )}

            <div className="summary-total">
              <span>Estimated Total</span>
              <strong>{formatRupiah(estimatedTotal)}</strong>
            </div>

            <div className="production-time-card">
              <h4>⏱️ Production Time</h4>

              <div className="summary-line">
                <span>Service</span>
                <strong>Standard</strong>
              </div>

              <div className="summary-line">
                <span>Estimated Duration</span>
                <strong>
                  {standardMinDays}–{standardMaxDays} business days
                </strong>
              </div>

              <p className="summary-remark">
                Produksi dimulai setelah pembayaran DP 50% diterima dan
                dikonfirmasi oleh admin. Sabtu dan Minggu tidak termasuk hari
                kerja.
              </p>
            </div>

            <div className="service-selection">
              <div className="form-group">
                <label>Choose Your Service</label>

                <div className="choice-grid">
                  <button
                    type="button"
                    className={`choice-card ${
                      serviceType === 'STANDARD' ? 'selected' : ''
                    }`}
                    onClick={() => {
                      setServiceType('STANDARD');
                      setRequestedCompletionDate('');
                      setRequestedCompletionTime('');
                    }}
                  >
                    <strong>Standard Order</strong>
                    <span>
                      {standardMinDays}–{standardMaxDays} Hari Kerja
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`choice-card ${
                      serviceType === 'EXPRESS' ? 'selected' : ''
                    }`}
                    onClick={() => setServiceType('EXPRESS')}
                  >
                    <strong>Express Order</strong>
                    <span>Request lebih cepat</span>
                  </button>
                </div>
              </div>

              {serviceType === 'EXPRESS' && (
                <div className="express-request">
                  <p className="summary-note">
                    Isi tanggal dan waktu yang diinginkan, waktu dan kerumitan
                    desain menjadi faktor penambahan biaya oleh admin.
                  </p>

                  <div className="requested-date-time">
                    <div className="form-group">
                      <label htmlFor="requested-completion-date">
                        Tanggal Permintaan
                      </label>

                      <input
                        id="requested-completion-date"
                        type="date"
                        value={requestedCompletionDate}
                        onChange={(event) =>
                          setRequestedCompletionDate(event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="requested-completion-time">
                        Waktu Permintaan
                      </label>

                      <select
                        id="requested-completion-time"
                        value={requestedCompletionTime}
                        onChange={(event) =>
                          setRequestedCompletionTime(event.target.value)
                        }
                        required
                      >
                        <option value="">Select completion time</option>
                        <option value="09:00">Before 09:00</option>
                        <option value="12:00">Before 12:00</option>
                        <option value="15:00">Before 15:00</option>
                        <option value="18:00">Before 18:00</option>
                        <option value="21:00">Before 21:00</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="button button-dark summary-button"
              disabled={unitPrice <= 0}
              onClick={() => {
                if (!theme) {
                  setError('Please select an artwork theme.');
                  return;
                }

                setError('');
                setShowCustomerForm(true);

                setTimeout(() => {
                  document
                    .getElementById('customer-form')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
            >
              Continue to Order <span>↗</span>
            </button>

            <p className="summary-note">
              Your final order details will be confirmed before submission.
            </p>
          </aside>
        </div>
      )}

      {showCustomerForm && !loading && !error && prices && (
        <div className="customer-form-section" id="customer-form">
          <div className="order-heading">
            <span className="eyebrow">ALMOST THERE</span>

            <h2>
              Tell us about <span>yourself.</span>
            </h2>

            <p>Isi form berikut untuk melanjutkan order.</p>
          </div>

          <form className="customer-form" onSubmit={handleSubmitOrder}>
            {submitError && (
              <div className="order-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="form-section-heading">
              <h3>Customer Information</h3>
              <p>Your contact details for order confirmation.</p>
            </div>

            <div className="form-group">
              <label htmlFor="customer-name">Nama *</label>

              <input
                id="customer-name"
                type="text"
                placeholder="Masukan Nama"
                value={customer.name}
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    name: event.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-whatsapp">WhatsApp *</label>

              <input
                id="customer-whatsapp"
                type="tel"
                placeholder="Contoh: 081234567890"
                value={customer.whatsapp}
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    whatsapp: event.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-section-heading">
              <h3>Detail Karikatur</h3>
              <p>Isi dengan detail sesuai permintaan.</p>
            </div>

            {/* Clothing / Uniform */}
            <div className="form-group">
              <label htmlFor="clothing-description">Pakaian / Seragam *</label>

              <textarea
                id="clothing-description"
                placeholder="Contoh; Setelan Jas hitam dengan dasi merah."
                rows={3}
                value={customer.clothingDescription}
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    clothingDescription: event.target.value,
                  })
                }
                required
              />
            </div>

            {/* Background */}
            <div className="form-group">
              <label htmlFor="background-description">Background *</label>

              <textarea
                id="background-description"
                placeholder="Contoh; Gedung rumah dinas dan taman bunga."
                rows={3}
                value={customer.backgroundDescription}
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    backgroundDescription: event.target.value,
                  })
                }
                required
              />
            </div>

            {/* Artwork Text */}
            <div className="form-group">
              <label htmlFor="artwork-text">Ucapan / Teks (Optional)</label>

              <textarea
                id="artwork-text"
                placeholder="Contoh; Selamat menjalani masa purnabhakti. dsb"
                rows={3}
                value={customer.artworkText}
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    artworkText: event.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="artwork-description">
                Deskripsi tambahan (Optional)
              </label>

              <textarea
                id="artwork-description"
                placeholder="Contoh; sedang memegang koper dan melambaikan tangan."
                rows={5}
                value={customer.artworkDescription}
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    artworkDescription: event.target.value,
                  })
                }
              />
            </div>

            {/* Metode Penerimaan Pesanan */}
            <div className="customer-order-summary">
              <h3>Metode Penerimaan Pesanan</h3>

              <p className="summary-note">
                Pilih apakah pesanan akan diambil sendiri atau dikirim ke alamat
                kamu.
              </p>

              <div className="choice-grid">
                <button
                  type="button"
                  className={`choice-card ${
                    deliveryMethod === 'PICKUP' ? 'selected' : ''
                  }`}
                  onClick={() => setDeliveryMethod('PICKUP')}
                >
                  <strong>🏠 Diambil</strong>
                  <span>Ambil pesanan di tempat kami</span>
                </button>

                <button
                  type="button"
                  className={`choice-card ${
                    deliveryMethod === 'DELIVERY' ? 'selected' : ''
                  }`}
                  onClick={() => setDeliveryMethod('DELIVERY')}
                >
                  <strong>🚚 Dikirim</strong>
                  <span>Pesanan dikirim ke alamat kamu</span>
                </button>
              </div>

              {deliveryMethod === 'PICKUP' && (
  <div className="express-request">
    <h4>📍 Alamat Pengambilan Pesanan</h4>

    <p>{pickupAddress || 'Alamat pengambilan belum tersedia.'}</p>

    {pickupMapsUrl && (
      <a
        href={pickupMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="maps-link"
      >
        Buka di Google Maps ↗
      </a>
    )}
  </div>
)}


              {deliveryMethod === 'DELIVERY' && (
                <div className="express-request">
                  <h4>Alamat Pengiriman</h4>

                  <div className="form-group">
                    <label htmlFor="delivery-address">Alamat Lengkap *</label>

                    <textarea
                      id="delivery-address"
                      placeholder="Tulis nama penerima, nomor rumah, jalan, RT/RW, kecamatan, kota, kode pos, dan patokan lokasi."
                      rows={5}
                      value={deliveryAddress}
                      onChange={(event) =>
                        setDeliveryAddress(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="delivery-maps-url">
                      Link Lokasi Google Maps (Opsional)
                    </label>

                    <input
                      id="delivery-maps-url"
                      type="url"
                      placeholder="Tempelkan link lokasi Google Maps"
                      value={deliveryMapsUrl}
                      onChange={(event) =>
                        setDeliveryMapsUrl(event.target.value)
                      }
                    />

                    <p className="summary-note">
                      Buka Google Maps, pilih lokasi rumah kamu, lalu bagikan
                      link lokasi tersebut dan tempelkan di sini.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="customer-order-summary">
              <h3>Your Order</h3>

              <div className="summary-line">
                <span>Product</span>
                <strong>Personalized Framed Artwork</strong>
              </div>

              <div className="summary-line">
                <span>Frame</span>
                <strong>
                  {FRAME_TYPES.find((frame) => frame.id === frameType)?.name ||
                    frameType ||
                    '-'}
                </strong>
              </div>

              <div className="summary-line">
                <span>Size</span>
                <strong>{size ? `${size.replace('x', ' × ')} cm` : '-'}</strong>
              </div>

              <div className="summary-line">
                <span>Quantity</span>
                <strong>{quantity}</strong>
              </div>

              <div className="summary-line">
                <span>Number of Faces</span>
                <strong>{faceCount}</strong>
              </div>

              <div className="summary-line">
                <span>Artwork Theme</span>
                <strong>{theme || '-'}</strong>
              </div>

              {additionalFacePrice > 0 && (
                <div className="summary-line">
                  <span>Additional Faces</span>
                  <strong>{formatRupiah(additionalFacePrice)}</strong>
                </div>
              )}

              {themePrice > 0 && (
                <div className="summary-line">
                  <span>Theme Fee</span>
                  <strong>{formatRupiah(themePrice)}</strong>
                </div>
              )}

              <div className="summary-total">
                <span>Estimated Total</span>
                <strong>{formatRupiah(estimatedTotal)}</strong>
              </div>
            </div>

            <div className="customer-form-actions">
              <button
                type="button"
                className="button button-light"
                onClick={() => {
                  setShowCustomerForm(false);

                  document
                    .getElementById('order')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ← Back to Selection
              </button>

              <button
                type="submit"
                className="button button-dark"
                disabled={submitting}
              >
                {submitting ? 'Saving Order...' : 'Continue to WhatsApp'}
                {!submitting && <span> ↗</span>}
              </button>
            </div>

            <p className="summary-note">
              Your order details will be reviewed before the payment process.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
