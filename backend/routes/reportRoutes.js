const express = require('express');
const router = express.Router();
const {
  getMonthlyReport,
  getYearlyReport,
} = require('../controllers/reportController');
const { protect, owner } = require('../middleware/authMiddleware');

router.get('/monthly', protect, owner, getMonthlyReport);
router.get('/yearly', protect, owner, getYearlyReport);

module.exports = router;