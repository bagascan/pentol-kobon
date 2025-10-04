const asyncHandler = require('express-async-handler');
const Asset = require('../models/assetModel');

// @desc    Get all assets for the logged-in owner
// @route   GET /api/assets
// @access  Private (Owner)
const getAssets = asyncHandler(async (req, res) => {
  const assets = await Asset.find({ owner: req.user.id }).sort({ name: 1 });
  res.status(200).json(assets);
});

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Private (Owner)
const createAsset = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Nama peralatan wajib diisi.');
  }

  const assetExists = await Asset.findOne({ owner: req.user.id, name });
  if (assetExists) {
    res.status(400);
    throw new Error('Peralatan dengan nama ini sudah ada.');
  }

  const asset = await Asset.create({
    name,
    owner: req.user.id,
  });

  res.status(201).json(asset);
});

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Private (Owner)
const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset || asset.owner.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Peralatan tidak ditemukan.');
  }
  const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedAsset);
});

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private (Owner)
const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset || asset.owner.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Peralatan tidak ditemukan.');
  }
  await asset.deleteOne();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
};