export default async function handler(req, res) {
  const body = req.body || {};
  // ...logika yang sama
  return res.status(200).json({ success: true });
}
