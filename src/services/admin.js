const ADMIN_API_URL = '/.netlify/functions/admin';

async function adminRequest(data) {
  const response = await fetch(ADMIN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Gagal menghubungi server admin.');
  }

  return response.json();
}

// Login admin
export async function adminLogin(username, password) {
  return adminRequest({
    action: 'adminLogin',
    username,
    password,
  });
}

// Verifikasi sesi admin
export async function adminVerify(token) {
  return adminRequest({
    action: 'adminVerify',
    token,
  });
}

// Logout admin
export async function adminLogout(token) {
  return adminRequest({
    action: 'adminLogout',
    token,
  });
}

// Mengambil semua data order
export async function adminGetOrders(token) {
  return adminRequest({
    action: 'adminGetOrders',
    token,
  });
}

// Update data order
export async function adminUpdateOrder(token, orderId, updates) {
  return adminRequest({
    action: 'adminUpdateOrder',
    token,
    order_id: orderId,
    updates,
  });
}
