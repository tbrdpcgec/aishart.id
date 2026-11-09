const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzwsuAFysR3fCNjoMc9FsoEWW4Iz4wmh6cvSQ-rw68m8pZ7QIl4FqPUwK_qi39Rv9CS/exec';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'POST',
      },
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

    return new Response(result, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Admin Function Error:', error);

    return Response.json(
      {
        success: false,
        message: 'Gagal menghubungi Google Apps Script.',
      },
      { status: 502 }
    );
  }
};
