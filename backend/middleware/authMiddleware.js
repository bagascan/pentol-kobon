const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Ambil token dari header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Ambil data user dari ID di dalam token, dan kecualikan password
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Lanjutkan ke controller
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Tidak terotorisasi, token gagal');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Tidak terotorisasi, tidak ada token');
  }
});

const owner = (req, res, next) => {
  // Middleware ini harus digunakan setelah middleware 'protect'
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(401);
    throw new Error('Tidak terotorisasi, hanya untuk owner');
  }
};

module.exports = { protect, owner };