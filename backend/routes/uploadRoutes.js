const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const sharp = require('sharp');
const fs = require('fs');

// Konfigurasi penyimpanan untuk multer (menyimpan sementara di memori)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Folder tempat menyimpan file
  },
  filename(req, file, cb) {
    // Pengecekan untuk memastikan originalname ada
    if (!file.originalname) {
      return cb(new Error('Nama file original tidak ditemukan'));
    }
    // Membuat nama file unik: fieldname-timestamp.extension
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Fungsi untuk memvalidasi tipe file (hanya gambar)
function checkFileType(req, file, cb) {
  // Pengecekan untuk memastikan originalname ada
  if (!file.originalname) {
    return cb(new Error('Nama file original tidak ditemukan'));
  }

  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Hanya gambar (jpg, jpeg, png) yang diizinkan!'));
  }
}

const upload = multer({ storage, fileFilter: checkFileType });

// Endpoint untuk upload dan proses gambar
// POST /api/upload
router.post('/', upload.single('image'), async (req, res, next) => {
  if (!req.file) {
    res.status(400);
    return next(new Error('File tidak valid atau tidak ada file yang diunggah'));
  }

  try {
    const originalPath = req.file.path;
    const newFilename = `${path.parse(req.file.filename).name}.webp`;
    const newPath = path.join('uploads', newFilename);

    // Proses gambar dengan sharp
    await sharp(originalPath)
      .resize(800) // Ubah ukuran lebar gambar menjadi maksimal 800px
      .webp({ quality: 80 }) // Konversi ke format WebP dengan kualitas 80%
      .toFile(newPath);

    // Hapus file asli setelah konversi berhasil
    fs.unlinkSync(originalPath);

    res.status(200).json({ message: 'Gambar berhasil diunggah', image: `/uploads/${newFilename}` });
  } catch (error) {
    console.error('Gagal memproses gambar:', error);
    return next(new Error('Gagal memproses gambar.'));
  }
});

module.exports = router;