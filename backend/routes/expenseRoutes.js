const express = require('express');
const router = express.Router();
const { createExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, owner } = require('../middleware/authMiddleware');

router.route('/').get(protect, owner, getExpenses).post(protect, owner, createExpense);
router.route('/:id').put(protect, owner, updateExpense).delete(protect, owner, deleteExpense);

module.exports = router;