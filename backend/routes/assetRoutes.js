const express = require('express');
const router = express.Router();
const {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} = require('../controllers/assetController');
const { protect, owner } = require('../middleware/authMiddleware');

router.route('/').get(protect, owner, getAssets).post(protect, owner, createAsset);
router.route('/:id').put(protect, owner, updateAsset).delete(protect, owner, deleteAsset);

module.exports = router;