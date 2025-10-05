const getImageUrl = (imagePath) => {
  // URL dasar backend Anda, tanpa /api
  const backendBaseUrl = 'https://60c8f364-ede3-46f3-bdc5-eb369a5125ee-00-2hm7qr1hutgxs.pike.replit.dev';

  if (!imagePath) {
    return ''; // Kembalikan string kosong jika path gambar tidak ada
  }

  // Gabungkan URL dasar backend dengan path gambar
  return `${backendBaseUrl}${imagePath}`;
};

export { getImageUrl };
