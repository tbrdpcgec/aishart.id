
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzwsuAFysR3fCNjoMc9FsoEWW4Iz4wmh6cvSQ-rw68m8pZ7QIl4FqPUwK_qi39Rv9CS/exec';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  try {
    const body = await request.text();

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body,
      redirect: 'follow',
    });

    const result = await response.text();
    const contentType =
      response.headers.get('content-type') || '';

    // Validasi respons Google Apps Script
    try {
      JSON.parse(result);
    } catch (parseError) {
      console.error('Invalid Apps Script response:', {
        status: response.status,
        contentType,
        responseUrl: response.url,
      });

      return Response.json({
        success: false,
        message: 'Google Apps Script mengembalikan respons bukan JSON.',
        upstream_status: response.status,
        upstream_content_type: contentType,
        upstream_preview:
  result.slice(0, 500) +
  '\n--- BAGIAN AKHIR ---\n' +
  result.slice(-3000),
      }, { status: 502 });
    }

    // Jika respons valid JSON, teruskan ke frontend
    return new Response(result, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Admin Function Error:', error);

    return Response.json({
      success: false,
      message: 'Gagal menghubungi Google Apps Script.',
      detail: error.message,
    }, { status: 502 });
  }
};
