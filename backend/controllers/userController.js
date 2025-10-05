const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const webpush = require('web-push');

// Fungsi helper untuk generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user baru
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Validasi input
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Mohon isi semua field');
  }

  // 2. Cek apakah user sudah ada
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email sudah terdaftar');
  }

  // 3. Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Buat user baru
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    // role dan isVerified akan menggunakan nilai default dari model
  });

  // 5. Jika user berhasil dibuat, kirim response
  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Data user tidak valid');
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  console.log('--- DEBUG: Proses Login Dimulai ---');
  const { email, password } = req.body;
  console.log(`Mencoba login dengan email: ${email}`);

  // 1. Cek email user
  const user = await User.findOne({ email });

  if (!user) {
    console.log('User tidak ditemukan di database.');
    res.status(400); // Gunakan 400 untuk kredensial tidak valid
    throw new Error('Kredensial tidak valid');
  }
  console.log(`User ditemukan: ${user.name}. Memeriksa password...`);
  console.log(`Password dari DB (ada?): ${user.password ? 'Ya' : 'Tidak'}`);

  // 2. Jika user ditemukan, bandingkan password
  const isMatch = user && user.password && (await bcrypt.compare(password, user.password));

  if (isMatch) {
    console.log('Password cocok. Memeriksa status verifikasi...');
    if (!user.isVerified) {
      console.log('Login gagal: Akun belum diverifikasi.');
      res.status(401);
      throw new Error('Akun Anda belum diverifikasi oleh owner. Mohon tunggu.');
    }

    console.log('Login berhasil! Mengirim token...');
    res.status(200).json({ _id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, outlet: user.outlet, token: generateToken(user._id) });
  } else {
    console.log('Login gagal: Password tidak cocok.');
    res.status(400); // Gunakan 400 untuk kredensial tidak valid
    throw new Error('Kredensial tidak valid');
  }
});

// @desc    Get data user yang sedang login
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// @desc    Get all unverified users
// @route   GET /api/users/unverified
// @access  Private/Owner
const getUnverifiedUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isVerified: false }).select('-password');
  res.status(200).json(users);
});

// @desc    Get all verified employees
// @route   GET /api/users/verified
// @access  Private/Owner
const getVerifiedUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isVerified: true, role: 'karyawan' }).select('-password').populate('outlet', 'name');
  res.status(200).json(users);
});

// @desc    Verify a user by ID
// @route   PUT /api/users/verify/:id
// @access  Private/Owner
const verifyUser = asyncHandler(async (req, res) => {
  const { outletId } = req.body; // Ambil outletId dari body
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User tidak ditemukan');
  }

  if (!outletId) {
    res.status(400);
    throw new Error('Mohon pilih outlet untuk karyawan ini.');
  }

  user.isVerified = true;
  user.role = 'karyawan'; // Pastikan role diatur menjadi karyawan saat verifikasi
  user.outlet = outletId; // Tetapkan outlet untuk user
  const updatedUser = await user.save();

  res.status(200).json({
    message: `User ${updatedUser.name} berhasil diverifikasi.`,
    user: {
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isVerified: updatedUser.isVerified,
    },
  });
});

// @desc    Subscribe to push notifications
// @route   POST /api/users/subscribe-push
// @access  Private
const subscribePush = asyncHandler(async (req, res) => {
  const subscription = req.body;
  const user = await User.findById(req.user.id);

  if (user) {
    // Cek agar tidak ada subscription duplikat
    const existingSubscription = user.pushSubscriptions.find(sub => sub.endpoint === subscription.endpoint);
    if (!existingSubscription) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
    res.status(201).json({ message: 'Berhasil berlangganan notifikasi.' });
  } else {
    res.status(404);
    throw new Error('User tidak ditemukan');
  }
});

// @desc    Send a test push notification
// @route   POST /api/users/test-push
// @access  Private
const testPush = asyncHandler(async (req, res) => {
  const { subscription } = req.body;

  if (!subscription) {
    res.status(400);
    throw new Error('Subscription object tidak ditemukan.');
  }

  const payload = JSON.stringify({
    title: 'Tes Notifikasi Pentol Kobong',
    body: 'Jika Anda melihat ini, notifikasi berfungsi dengan baik!',
    data: {
      url: '/'
    }
  });

  await webpush.sendNotification(subscription, payload).catch(err => {
    throw new Error('Gagal mengirim notifikasi dari web-push.');
  });

  res.status(200).json({ message: 'Notifikasi tes berhasil dikirim.' });
});


// @desc    Assign or change an outlet for a verified user
// @route   PUT /api/users/assign-outlet/:id
// @access  Private (Owner)
const assignOutlet = asyncHandler(async (req, res) => {
  const { outletId } = req.body;
  const userToUpdate = await User.findById(req.params.id);

  if (!userToUpdate) {
    res.status(404);
    throw new Error('Karyawan tidak ditemukan.');
  }

  if (!outletId) {
    res.status(400);
    throw new Error('Mohon pilih outlet.');
  }

  userToUpdate.outlet = outletId;
  await userToUpdate.save();

  res.status(200).json({ message: `Karyawan ${userToUpdate.name} berhasil dipindahkan ke outlet baru.` });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUnverifiedUsers,
  getVerifiedUsers,
  verifyUser,
  subscribePush,
  testPush,
  assignOutlet,
};