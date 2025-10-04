const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getUnverifiedUsers,
  getVerifiedUsers,
  verifyUser,
  subscribePush,
  testPush,
  assignOutlet,
} = require('../controllers/userController');
const { protect, owner } = require('../middleware/authMiddleware');

// --- Rute Publik ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Rute Terproteksi (Semua Role) ---
router.get('/me', protect, getMe);
router.post('/subscribe-push', protect, subscribePush);
router.post('/test-push', protect, testPush);

// --- Rute Khusus Owner ---
router.get('/unverified', protect, owner, getUnverifiedUsers);
router.get('/verified', protect, owner, getVerifiedUsers);
router.put('/verify/:id', protect, owner, verifyUser);
router.put('/assign-outlet/:id', protect, owner, assignOutlet);

module.exports = router;