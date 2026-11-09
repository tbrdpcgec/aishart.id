const SHEET_URLS = {
  home: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=25658437&single=true&output=csv',

  settings:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=0&single=true&output=csv',

  products:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=1975394883&single=true&output=csv',

  prices:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=78139067&single=true&output=csv',

  options:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=1961533217&single=true&output=csv',

  collection:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=723334354&single=true&output=csv',

  frames:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=1133228849&single=true&output=csv',

  sizes:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK6i_Juxu4Bf0GUiPfr3vGIfiKvDaJ2xJ6Vg2KXWsHVyiG-AHoPsxPJvby-CwgNWGvkilkSvaExUkV/pub?gid=1619008104&single=true&output=csv',
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let insideQuotes = false;

  text = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') i++;

      row.push(cell.trim());

      if (row.some((value) => value !== '')) {
        rows.push(row);
      }

      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());

    if (row.some((value) => value !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

export async function fetchSheetRows(sheetName) {
  const url = SHEET_URLS[sheetName];

  if (!url) {
    throw new Error(`URL sheet "${sheetName}" tidak ditemukan.`);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Gagal mengambil ${sheetName}: HTTP ${response.status}`);
  }

  const text = await response.text();

  if (
    text.trim().startsWith('<!DOCTYPE html') ||
    text.trim().startsWith('<html')
  ) {
    throw new Error(
      `Sheet "${sheetName}" tidak mengembalikan CSV. Periksa publikasi Google Sheets.`
    );
  }

  return parseCSV(text);
}

// Membaca tabel harga dengan format:
// Kolom A = jenis frame
// Kolom B = jenis produk
// Kolom C dan seterusnya = harga berdasarkan ukuran
export async function fetchPrices() {
  const rows = await fetchSheet('prices');

  const result = {
    sizes: [],
    'Personalized Framed Artwork': {},
  };

  const activeSizes = new Set();

  for (const row of rows) {
    const productType = (row.product_type || '').trim().toUpperCase();
    const frameType = (row.frame_type || '').trim().toUpperCase();
    const size = (row.size || '').trim();
    const price = Number(String(row.price || '').replace(/[^\d]/g, ''));
    const active = (row.active || 'TRUE').trim().toUpperCase();

    if (active !== 'TRUE') continue;
    if (!size || !Number.isFinite(price) || price <= 0) continue;

    activeSizes.add(size);

    if (productType === 'PERSONALIZED FRAMED ARTWORK' && frameType) {
      if (!result['Personalized Framed Artwork'][frameType]) {
        result['Personalized Framed Artwork'][frameType] = {};
      }

      result['Personalized Framed Artwork'][frameType][size] = price;
    }
  }

  result.sizes = [...activeSizes];

  if (Object.keys(result['Personalized Framed Artwork']).length === 0) {
    throw new Error(
      'Data harga Personalized Framed Artwork tidak ditemukan. Periksa kolom product_type, frame_type, dan active.'
    );
  }

  return result;
}

export async function fetchSheet(sheetName) {
  const rows = await fetchSheetRows(sheetName);

  if (rows.length < 2) {
    throw new Error(`Sheet "${sheetName}" kosong.`);
  }

  const headers = rows[0].map((header) =>
    header
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
  );

  return rows
    .slice(1)
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, (row[index] ?? '').trim()])
      )
    );
}

// Membaca pengaturan dari tab Settings
export async function fetchSettings() {
  const rows = await fetchSheet('settings');

  const settings = {};

  for (const row of rows) {
    const key = (row.key || '').trim();
    const value = (row.value || '').trim();

    if (key) {
      settings[key] = value;
    }
  }

  return settings;
}

// Membaca pilihan dan harga tambahan dari tab Options
export async function fetchOptions() {
  const rows = await fetchSheet('options');
  return rows.map((row) => ({
    type: (row.type || '').trim().toUpperCase(),
    option: (row.option || '').trim(),
    price: Number(row.price) || 0,
  }));
}

// Membaca konten Home dari Google Sheets
export async function fetchHome() {
  const rows = await fetchSheet('home');

  const home = {};

  for (const row of rows) {
    const key = (row.key || '').trim();
    const value = (row.value || '').trim();

    if (key) {
      home[key] = value;
    }
  }

  return home;
}
