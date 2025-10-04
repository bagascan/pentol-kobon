const asyncHandler = require('express-async-handler');
const Inventory = require('../models/inventoryModel');
const Outlet = require('../models/outletModel');

// @desc    Get inventory for a specific outlet
// @route   GET /api/inventory/:outletId
// @access  Private (Owner/Karyawan)
const getInventoryByOutlet = asyncHandler(async (req, res) => {
  const { outletId } = req.params;

  // Validasi: Pastikan user punya akses ke outlet ini
  if (req.user.role === 'owner') {
    const outlet = await Outlet.findById(outletId);
    if (!outlet || outlet.owner.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Akses ditolak ke outlet ini.');
    }
  } else if (req.user.role === 'karyawan') {
    if (req.user.outlet.toString() !== outletId) {
      res.status(403);
      throw new Error('Anda tidak ditugaskan di outlet ini.');
    }
  }

  const inventory = await Inventory.find({ outlet: outletId }).populate('product');
  res.status(200).json(inventory);
});

// @desc    Add or update inventory for a product in an outlet
// @route   POST /api/inventory
// @access  Private (Owner only)
const addOrUpdateInventory = asyncHandler(async (req, res) => {
  const { productId, outletId, stock } = req.body;

  if (!productId || !outletId || stock === undefined) {
    res.status(400);
    throw new Error('Data produk, outlet, dan stok wajib diisi.');
  }

  const inventoryItem = await Inventory.findOneAndUpdate(
    { product: productId, outlet: outletId }, // Cari berdasarkan produk dan outlet
    { stock: stock }, // Update stoknya
    { new: true, upsert: true, runValidators: true } // Opsi: `new` mengembalikan dokumen baru, `upsert` membuat baru jika tidak ada
  ).populate('product');

  res.status(200).json(inventoryItem);
});

// Anda bisa menambahkan fungsi delete jika perlu

module.exports = {
  getInventoryByOutlet,
  addOrUpdateInventory,
};