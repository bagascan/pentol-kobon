const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, owner } = require('../middleware/authMiddleware');

router.route('/').get(protect, getProducts).post(protect, owner, createProduct);
router.route('/:id').put(protect, owner, updateProduct).delete(protect, owner, deleteProduct);

module.exports = router;