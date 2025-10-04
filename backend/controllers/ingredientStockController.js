const asyncHandler = require('express-async-handler');
const IngredientStock = require('../models/ingredientStockModel');
const Outlet = require('../models/outletModel');

// @desc    Get ingredient stock for a specific outlet
// @route   GET /api/ingredient-stocks/:outletId
// @access  Private (Owner only)
const getIngredientStockByOutlet = asyncHandler(async (req, res) => {
  const { outletId } = req.params;

  // Validasi: Pastikan owner punya akses ke outlet ini
  const outlet = await Outlet.findById(outletId);
  if (!outlet || outlet.owner.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Akses ditolak ke stok bahan baku outlet ini.');
  }

  const stock = await IngredientStock.find({ outlet: outletId }).populate('ingredient', 'name unit');
  res.status(200).json(stock);
});

// @desc    Add or update ingredient stock in an outlet
// @route   POST /api/ingredient-stocks
// @access  Private (Owner only)
const addOrUpdateIngredientStock = asyncHandler(async (req, res) => {
  const { ingredientId, outletId, quantity, cost } = req.body;

  if (!ingredientId || !outletId || quantity === undefined || cost === undefined) {
    res.status(400);
    throw new Error('Data bahan baku, outlet, jumlah, dan harga wajib diisi.');
  }

  const stockItem = await IngredientStock.findOne({ ingredient: ingredientId, outlet: outletId });

  if (stockItem) {
    // --- LOGIKA BARU UNTUK UPDATE ---
    // Hitung total nilai stok lama dan nilai stok baru
    const oldTotalValue = stockItem.averageCostPrice * stockItem.stock;
    const newTotalValue = oldTotalValue + cost; // `cost` adalah total harga pembelian baru
    const totalStock = stockItem.stock + quantity; // `quantity` adalah jumlah pembelian baru

    stockItem.stock = totalStock;
    // Hitung harga rata-rata baru
    stockItem.averageCostPrice = newTotalValue / totalStock;

    await stockItem.save();
    res.status(200).json(stockItem);
  } else {
    // --- LOGIKA BARU UNTUK CREATE ---
    // Buat entri stok baru dan langsung hitung harga per unit
    const newStockItem = await IngredientStock.create({
      ingredient: ingredientId,
      outlet: outletId,
      stock: quantity,
      averageCostPrice: cost / quantity, // Hitung harga per unit
    });
    res.status(201).json(newStockItem);
  }
});

module.exports = {
  getIngredientStockByOutlet,
  addOrUpdateIngredientStock,
};