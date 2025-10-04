const express = require('express');
const router = express.Router();
const { getOutlets, createOutlet, updateOutlet, deleteOutlet } = require('../controllers/outletController');
const { protect, owner } = require('../middleware/authMiddleware');

// PERBAIKAN: Hapus middleware 'owner' dari rute GET
// Rute GET ini sekarang bisa diakses oleh semua pengguna yang sudah login (protect)
router.route('/').get(protect, getOutlets).post(protect, owner, createOutlet);

// Rute lain tetap hanya untuk owner
router.route('/:id').put(protect, owner, updateOutlet).delete(protect, owner, deleteOutlet);

module.exports = router;
