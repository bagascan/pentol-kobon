const asyncHandler = require('express-async-handler');
const Ingredient = require('../models/ingredientModel');
const IngredientStock = require('../models/ingredientStockModel');
const Product = require('../models/productModel');

// @desc    Create a new ingredient in the master catalog
// @route   POST /api/ingredients
// @access  Private (Owner only)
const createIngredient = asyncHandler(async (req, res) => {
  const { name, unit } = req.body;

  if (!name || !unit) {
    res.status(400);
    throw new Error('Nama dan satuan bahan baku wajib diisi.');
  }

  const ingredientExists = await Ingredient.findOne({ name, user: req.user.id });
  if (ingredientExists) {
    res.status(409); // Conflict
    throw new Error(`Bahan baku dengan nama "${name}" sudah ada.`);
  }

  const ingredient = await Ingredient.create({
    name,
    unit,
    user: req.user.id,
  });

  res.status(201).json(ingredient);
});

// @desc    Get all ingredients from the master catalog
// @route   GET /api/ingredients
// @access  Private (Owner only)
const getIngredients = asyncHandler(async (req, res) => {
  const ingredients = await Ingredient.find({ user: req.user.id }).sort({ name: 1 });
  res.status(200).json(ingredients);
});

// @desc    Update an ingredient in the master catalog
// @route   PUT /api/ingredients/:id
// @access  Private (Owner only)
const updateIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);

  if (!ingredient || ingredient.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Bahan baku tidak ditemukan.');
  }

  const updatedIngredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedIngredient);
});

// @desc    Delete an ingredient from the master catalog
// @route   DELETE /api/ingredients/:id
// @access  Private (Owner only)
const deleteIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);

  if (!ingredient || ingredient.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Bahan baku tidak ditemukan.');
  }

  // Cek apakah bahan baku ini masih digunakan dalam resep produk
  const productUsingIngredient = await Product.findOne({ 'recipe.ingredient': req.params.id });
  if (productUsingIngredient) {
    res.status(400);
    throw new Error(`Bahan baku tidak bisa dihapus karena masih digunakan dalam resep produk "${productUsingIngredient.name}".`);
  }

  // Hapus juga semua stok bahan baku ini dari semua outlet
  await IngredientStock.deleteMany({ ingredient: req.params.id });

  await ingredient.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Bahan baku berhasil dihapus.' });
});

module.exports = {
  createIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
};