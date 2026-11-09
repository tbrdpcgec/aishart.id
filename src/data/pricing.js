export const sizes = [
  '21x30',
  '30x40',
  '30x45',
  '40x50',
  '40x60',
  '60x60',
  '60x80',
];

export const frameTypes = [
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

export const pricing = {
  'ART+FRAME': {
    'PUTIH POLOS': {
      '21x30': 85000,
      '30x40': 140000,
      '30x45': 155000,
      '40x50': 280000,
      '40x60': 300000,
      '60x60': 560000,
      '60x80': 600000,
    },

    'PUTIH EMAS': {
      '21x30': 125000,
      '30x40': 200000,
      '30x45': 215000,
      '40x50': 360000,
      '40x60': 380000,
      '60x60': 660000,
      '60x80': 700000,
    },

    'PUTIH UKIR': {
      '21x30': 165000,
      '30x40': 275000,
      '30x45': 295000,
      '40x50': 400000,
      '40x60': 425000,
      '60x60': 750000,
      '60x80': 800000,
    },
  },

  ART: {
    NONE: {
      '21x30': 100000,
      '30x40': 150000,
      '30x45': 160000,
      '40x50': 240000,
      '40x60': 260000,
      '60x60': 420000,
      '60x80': 450000,
    },
  },
};

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
