const express = require('express');
const router = express.Router();
const {
  startDaySession,
  getTodaySession,
  updateDaySession,
  deleteDaySession,
  closeDaySession,
  getLogs,
  getOpenSessions,
} = require('../controllers/dailyLogController');
const { protect, owner } = require('../middleware/authMiddleware');

router.post('/start', protect, owner, startDaySession);
router.get('/open', protect, owner, getOpenSessions); // Rute baru
router.get('/today', protect, getTodaySession);
router.put('/close', protect, closeDaySession); // Bisa diakses Karyawan & Owner
router.route('/:id').put(protect, owner, updateDaySession).delete(protect, owner, deleteDaySession);
router.route('/').get(protect, owner, getLogs);

module.exports = router;