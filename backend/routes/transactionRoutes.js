const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getSessionSales,
  getTransactions,
} = require('../controllers/transactionController');
const { protect, owner } = require('../middleware/authMiddleware'); // Assuming you have an 'owner' middleware

// Route for creating a transaction (accessible by owner and karyawan)
// Route for getting all transactions (accessible by owner only)
router.route('/')
  .post(protect, createTransaction)
  .get(protect, owner, getTransactions); // Add the GET handler here

// Route for getting current session sales
router.route('/session-sales').get(protect, getSessionSales);

module.exports = router;
