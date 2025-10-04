const express = require('express');
const router = express.Router();
const {
  createIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
} = require('../controllers/ingredientController');
const { protect, owner } = require('../middleware/authMiddleware');

router.route('/').get(protect, owner, getIngredients).post(protect, owner, createIngredient);
router.route('/:id').put(protect, owner, updateIngredient).delete(protect, owner, deleteIngredient);

module.exports = router;