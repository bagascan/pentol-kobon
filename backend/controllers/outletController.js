const asyncHandler = require('express-async-handler');
const Outlet = require('../models/outletModel');
const User = require('../models/userModel');

// @desc    Get all outlets for the logged-in owner
// @route   GET /api/outlets
// @access  Private (Owner)
const getOutlets = asyncHandler(async (req, res) => {
  let outlets;
  if (req.user.role === 'owner') {
    // Jika owner, ambil semua outlet miliknya
    outlets = await Outlet.find({ owner: req.user.id });
  } else {
    // PERBAIKAN: Jika karyawan, cukup ambil satu outlet tempat dia ditugaskan.
    const assignedOutlet = await Outlet.findById(req.user.outlet);
    if (assignedOutlet) {
      outlets = [assignedOutlet]; // Kembalikan sebagai array berisi satu objek
    }
  }
  res.status(200).json(outlets || []); // Pastikan selalu mengembalikan array
});

// @desc    Create a new outlet
// @route   POST /api/outlets
// @access  Private (Owner)
const createOutlet = asyncHandler(async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    res.status(400);
    throw new Error('Nama dan alamat outlet wajib diisi.');
  }

  // Cek manual apakah nama outlet sudah ada untuk owner ini
  const outletExists = await Outlet.findOne({ owner: req.user.id, name });
  if (outletExists) {
    res.status(409); // 409 Conflict
    throw new Error(`Outlet dengan nama "${name}" sudah ada.`);
  }

  const outlet = await Outlet.create({
    name,
    address,
    owner: req.user.id,
  });

  res.status(201).json(outlet);
});

// @desc    Update an outlet
// @route   PUT /api/outlets/:id
// @access  Private (Owner)
const updateOutlet = asyncHandler(async (req, res) => {
  const outlet = await Outlet.findById(req.params.id);

  if (!outlet) {
    res.status(404);
    throw new Error('Outlet tidak ditemukan.');
  }

  // Pastikan owner yang sedang login adalah pemilik outlet
  if (outlet.owner.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Tidak terotorisasi.');
  }

  // Cek duplikasi nama saat update, pastikan tidak sama dengan outlet lain
  if (req.body.name) {
    const outletExists = await Outlet.findOne({ owner: req.user.id, name: req.body.name, _id: { $ne: req.params.id } });
    if (outletExists) {
      res.status(409); // 409 Conflict
      throw new Error(`Outlet dengan nama "${req.body.name}" sudah ada.`);
    }
  }

  const updatedOutlet = await Outlet.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedOutlet);
});

// @desc    Delete an outlet
// @route   DELETE /api/outlets/:id
// @access  Private (Owner)
const deleteOutlet = asyncHandler(async (req, res) => {
  const outlet = await Outlet.findById(req.params.id);

  if (!outlet) {
    res.status(404);
    throw new Error('Outlet tidak ditemukan.');
  }

  if (outlet.owner.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Tidak terotorisasi.');
  }

  await outlet.deleteOne();
  res.status(200).json({ id: req.params.id, message: 'Outlet berhasil dihapus.' });
});

module.exports = {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
};