const ORDER_API_URL =
  'https://script.google.com/macros/s/AKfycbzwsuAFysR3fCNjoMc9FsoEWW4Iz4wmh6cvSQ-rw68m8pZ7QIl4FqPUwK_qi39Rv9CS/exec';

export async function submitOrder(orderData) {
  const response = await fetch(ORDER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error('Gagal menghubungi server pesanan.');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Pesanan gagal disimpan.');
  }

  return result;
}
