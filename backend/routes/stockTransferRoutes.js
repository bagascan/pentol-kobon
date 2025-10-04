const express = require('express');
const router = express.Router();
const { createStockTransfer, getTransfers } = require('../controllers/stockTransferController');
const { protect, owner } = require('../middleware/authMiddleware');

router.route('/').post(protect, owner, createStockTransfer).get(protect, owner, getTransfers);

module.exports = router;