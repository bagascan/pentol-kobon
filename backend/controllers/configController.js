const asyncHandler = require('express-async-handler');

// @desc    Get VAPID public key
// @route   GET /api/config/vapid-key
// @access  Public
const getVapidKey = asyncHandler(async (req, res) => {
  const publicKey = process.env.PUBLIC_VAPID_KEY;
  res.status(200).json({ publicKey });
});

module.exports = { getVapidKey };