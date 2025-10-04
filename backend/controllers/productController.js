const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const fs = require('fs'); // Impor modul fs
const Inventory = require('../models/inventoryModel'); // Impor model Inventory

// @desc    Get all products from the master catalog
// @route   GET /api/products
// @access  Private (Owner only)
const getProducts = asyncHandler(async (req, res) => {
  // Fungsi ini sekarang hanya mengembalikan semua produk di katalog utama.
  // Populate resep dengan nama dan satuan bahan baku
  const products = await Product.find({ user: req.user.id }).populate('recipe.ingredient', 'name unit');
  res.status(200).json(products);
});

// @desc    Create a new product in the master catalog
// @route   POST /api/products
// @access  Private (Owner only)
const createProduct = asyncHandler(async (req, res) => {
  const { name, costPrice, sellingPrice, category, image, recipe } = req.body;

  if (!name || !sellingPrice || !category) {
    res.status(400);
    throw new Error('Nama, harga jual, dan kategori wajib diisi');
  }

  // Validasi baru: Harga jual tidak boleh lebih rendah dari harga pokok
  if (parseFloat(sellingPrice) < parseFloat(costPrice || 0)) {
    res.status(400);
    throw new Error('Harga jual tidak boleh lebih rendah dari harga pokok.');
  }

  const product = await Product.create({
    name,
    costPrice: costPrice || 0,
    sellingPrice,
    category,
    image,
    recipe, // Tambahkan resep
    user: req.user.id,
  });

  res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Owner only)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Produk tidak ditemukan');
  }

  // Otorisasi: Pastikan hanya owner yang membuat produk yang bisa mengupdatenya
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Tidak terotorisasi');
  }

  // Validasi baru untuk update: Harga jual tidak boleh lebih rendah dari harga pokok
  if (req.body.sellingPrice && req.body.costPrice && parseFloat(req.body.sellingPrice) < parseFloat(req.body.costPrice)) {
    res.status(400);
    throw new Error('Harga jual tidak boleh lebih rendah dari harga pokok.');
  }

  // Jika tidak ada gambar baru yang di-upload, jangan timpa gambar yang sudah ada
  if (!req.body.image) {
    req.body.image = product.image;
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Mengembalikan dokumen yang sudah diupdate
  });

  res.status(200).json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Owner only)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Produk tidak ditemukan');
  }

  // Otorisasi: Pastikan hanya owner yang membuat produk yang bisa menghapusnya
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Tidak terotorisasi');
  }

  // Sebelum menghapus produk, hapus juga semua entri inventaris yang terkait
  const inventoryEntries = await Inventory.find({ product: product._id });
  if (inventoryEntries.length > 0) {
    await Inventory.deleteMany({ product: product._id });
  }

  // Hapus file gambar terkait jika ada
  if (product.image) {
    const imagePath = `./${product.image}`; // Path relatif ke root backend
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error(`Gagal menghapus file gambar ${imagePath}:`, err);
      }
    });
  }

  await product.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Produk berhasil dihapus' });
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};