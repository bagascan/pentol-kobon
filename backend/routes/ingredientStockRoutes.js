const express = require('express');
const router = express.Router();
const {
  getIngredientStockByOutlet,
  addOrUpdateIngredientStock,
} = require('../controllers/ingredientStockController');
const { protect, owner } = require('../middleware/authMiddleware');

router.route('/').post(protect, owner, addOrUpdateIngredientStock);
router.route('/:outletId').get(protect, owner, getIngredientStockByOutlet);

module.exports = router;