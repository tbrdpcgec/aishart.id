const TRACKING_API_URL =
  'https://script.google.com/macros/s/AKfycbzwsuAFysR3fCNjoMc9FsoEWW4Iz4wmh6cvSQ-rw68m8pZ7QIl4FqPUwK_qi39Rv9CS/exec';

export async function fetchOrderTracking(orderId, orderToken) {
  const params = new URLSearchParams({
    action: 'track',
    order_id: orderId.trim(),
    order_token: orderToken.trim(),
  });

  const response = await fetch(`${TRACKING_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Gagal mengambil data order: HTTP ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Pesanan tidak ditemukan.');
  }

  return result.order;
}
