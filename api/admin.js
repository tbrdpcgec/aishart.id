export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({
      success: false,
      message: 'APPS_SCRIPT_URL belum diatur di environment variables.',
    });
  }

  try {
    // Vercel bisa mengirim body sebagai string atau objek, jadi samakan ke string
    const body =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
    });

    const result = await response.text();
    const contentType = response.headers.get('content-type') || '';

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      console.error('Invalid Apps Script response:', {
        status: response.status,
        contentType,
        responseUrl: response.url,
      });

      return res.status(502).json({
        success: false,
        message: 'Google Apps Script mengembalikan respons bukan JSON.',
        upstream_status: response.status,
        upstream_content_type: contentType,
        upstream_preview:
          result.slice(0, 500) + '\n--- BAGIAN AKHIR ---\n' + result.slice(-3000),
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(response.status).json(parsed);
  } catch (error) {
    console.error('Admin Function Error:', error);

    return res.status(502).json({
      success: false,
      message: 'Gagal menghubungi Google Apps Script.',
      detail: error.message,
    });
  }
}