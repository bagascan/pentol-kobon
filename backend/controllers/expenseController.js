const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (Owner only)
const createExpense = asyncHandler(async (req, res) => {
  const { description, amount, category, date, outletId } = req.body;

  if (!description || !amount) {
    res.status(400);
    throw new Error('Deskripsi dan jumlah wajib diisi.');
  }

  if (!outletId) {
    res.status(400);
    throw new Error('ID Outlet wajib disertakan.');
  }

  const expense = await Expense.create({
    description,
    amount,
    category,
    date: date ? new Date(date) : new Date(),
    user: req.user.id,
    outlet: outletId,
  });

  // Populate data outlet sebelum mengirim respons agar nama outlet langsung tampil
  const populatedExpense = await Expense.findById(expense._id).populate('outlet', 'name');

  res.status(201).json(populatedExpense);
});

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private (Owner only)
const getExpenses = asyncHandler(async (req, res) => {
  const Outlet = require('../models/outletModel'); // Impor di sini untuk menghindari circular dependency jika diperlukan
  const { outletId } = req.query;
  let query = {};

  if (outletId) {
    query.outlet = outletId;
  } else {
    const ownerOutlets = await Outlet.find({ owner: req.user.id }).select('_id');
    const ownerOutletIds = ownerOutlets.map(o => o._id);
    query.outlet = { $in: ownerOutletIds };
  }

  // Filter pengeluaran berdasarkan outletId
  const expenses = await Expense.find(query)
    .populate('outlet', 'name') // <-- TAMBAHKAN INI untuk mengambil nama outlet
    .sort({ date: -1 });
  res.status(200).json(expenses);
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (Owner only)
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Data pengeluaran tidak ditemukan.');
  }

  // Cek kepemilikan
  if (expense.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Tidak terotorisasi untuk mengubah data ini.');
  }

  const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Mengembalikan dokumen yang sudah diupdate
  }).populate('outlet', 'name'); // Populate lagi setelah update

  res.status(200).json(updatedExpense);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Owner only)
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  // Cek apakah pengeluaran ada
  if (!expense) {
    res.status(404);
    throw new Error('Data pengeluaran tidak ditemukan.');
  }

  // Cek kepemilikan
  if (expense.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Tidak terotorisasi untuk menghapus data ini.');
  }

  await expense.deleteOne();
  res.status(200).json({ id: req.params.id, message: 'Pengeluaran berhasil dihapus.' });
});

module.exports = { createExpense, getExpenses, updateExpense, deleteExpense };