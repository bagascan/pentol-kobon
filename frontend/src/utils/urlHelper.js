const getImageUrl = (imagePath) => {
  // Vite menyediakan variabel `import.meta.env.DEV`
  // yang bernilai `true` saat development dan `false` saat production.
  if (import.meta.env.DEV) {
    // Saat development, kita butuh URL lengkap ke server backend lokal.
    return `http://localhost:5001${imagePath}`;
  }
  // Saat production di Vercel, path-nya sudah benar karena berada di domain yang sama.
  return imagePath;
};

export { getImageUrl };
