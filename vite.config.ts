import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzwsuAFysR3fCNjoMc9FsoEWW4Iz4wmh6cvSQ-rw68m8pZ7QIl4FqPUwK_qi39Rv9CS/exec';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'apps-script-proxy',
      configureServer(server) {
        server.middlewares.use('/api/admin', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }

          let body = '';
          req.setEncoding('utf8');

          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'text/plain;charset=utf-8',
                },
                body,
                redirect: 'follow',
              });

              const result = await response.text();

              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(result);
            } catch (error) {
              console.error('Apps Script Proxy Error:', error);
              res.statusCode = 502;
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'Gagal menghubungi Google Apps Script.',
                })
              );
            }
          });
        });
      },
    },
  ],
});
