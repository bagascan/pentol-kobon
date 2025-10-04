const asyncHandler = require('express-async-handler');
const DailyLog = require('../models/dailyLogModel');
const Outlet = require('../models/outletModel');
const mongoose = require('mongoose');

// @desc    Get aggregated monthly report
// @route   GET /api/reports/monthly
// @access  Private (Owner)
const getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, startMonth, endMonth, outletId } = req.query;

  if (!year || !startMonth || !endMonth) {
    res.status(400);
    throw new Error('Tahun dan rentang bulan wajib diisi.');
  }

  const startDate = new Date(Date.UTC(year, startMonth - 1, 1));
  const endDate = new Date(Date.UTC(year, endMonth, 0, 23, 59, 59, 999));

  let matchQuery = {
    'createdAt': { $gte: startDate, $lte: endDate },
    'status': 'CLOSED'
  };

  // Filter by owner's outlets
  const ownerOutlets = await Outlet.find({ owner: req.user.id }).select('_id');
  const ownerOutletIds = ownerOutlets.map(o => o._id);
  matchQuery.outlet = { $in: ownerOutletIds };

  if (outletId && outletId !== 'all') {
    matchQuery.outlet = new mongoose.Types.ObjectId(outletId);
  }

  const summaryReport = await DailyLog.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$calculated.totalRevenue' },
        totalCOGS: { $sum: '$calculated.totalCOGS' },
        totalExpense: { $sum: '$calculated.totalExpense' },
        netProfit: { $sum: '$calculated.netProfit' },
        totalTransactions: { $sum: { $size: '$transactions' } },
      }
    }
  ]);

  const assetReport = await DailyLog.aggregate([
    { $match: matchQuery },
    // Hanya proses log yang memiliki data peralatan
    { $match: { 'startOfDay.assetStock.0': { $exists: true } } },
    // Unwind array peralatan awal
    { $unwind: '$startOfDay.assetStock' },
    // Tambahkan field baru untuk peralatan akhir yang cocok
    {
      $addFields: {
        endAsset: {
          $let: {
            vars: {
              currentAssetName: '$startOfDay.assetStock.name',
              remainingAssets: '$endOfDay.remainingAssetStock'
            },
            in: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$$remainingAssets',
                    as: 'asset',
                    cond: { $eq: ['$$asset.name', '$$currentAssetName'] }
                  }
                }, 0
              ]
            }
          }
        }
      }
    },
    // Kelompokkan berdasarkan nama peralatan
    {
      $group: {
        _id: '$startOfDay.assetStock.name',
        totalBrought: { $sum: '$startOfDay.assetStock.quantity' },
        totalReturned: { $sum: { $ifNull: ['$endAsset.quantity', 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    summary: summaryReport[0] || { totalRevenue: 0, totalCOGS: 0, totalExpense: 0, netProfit: 0, totalTransactions: 0 },
    assetReport: assetReport,
  });
});

// @desc    Get aggregated yearly report
// @route   GET /api/reports/yearly
// @access  Private (Owner)
const getYearlyReport = asyncHandler(async (req, res) => {
  const { year, outletId } = req.query;

  if (!year) {
    res.status(400);
    throw new Error('Tahun wajib diisi.');
  }

  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  let matchQuery = {
    'createdAt': { $gte: startDate, $lte: endDate },
    'status': 'CLOSED'
  };

  // Filter by owner's outlets
  const ownerOutlets = await Outlet.find({ owner: req.user.id }).select('_id');
  const ownerOutletIds = ownerOutlets.map(o => o._id);
  matchQuery.outlet = { $in: ownerOutletIds };

  if (outletId && outletId !== 'all') {
    matchQuery.outlet = new mongoose.Types.ObjectId(outletId);
  }

  const report = await DailyLog.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        totalRevenue: { $sum: '$calculated.totalRevenue' },
        totalCOGS: { $sum: '$calculated.totalCOGS' },
        totalExpense: { $sum: '$calculated.totalExpense' },
        netProfit: { $sum: '$calculated.netProfit' },
        totalTransactions: { $sum: { $size: '$transactions' } },
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);

  // Untuk laporan tahunan, kita akan fokus pada ringkasan keuangan per bulan.
  // Laporan aset tahunan bisa ditambahkan di sini jika diperlukan di masa depan.
  const assetReport = await DailyLog.aggregate([
    { $match: matchQuery },
    { $match: { 'startOfDay.assetStock.0': { $exists: true } } },
    { $unwind: '$startOfDay.assetStock' },
    {
      $addFields: {
        endAsset: {
          $let: {
            vars: {
              currentAssetName: '$startOfDay.assetStock.name',
              remainingAssets: '$endOfDay.remainingAssetStock'
            },
            in: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$$remainingAssets',
                    as: 'asset',
                    cond: { $eq: ['$$asset.name', '$$currentAssetName'] }
                  }
                }, 0
              ]
            }
          }
        }
      }
    },
    {
      $group: {
        _id: '$startOfDay.assetStock.name',
        totalBrought: { $sum: '$startOfDay.assetStock.quantity' },
        totalReturned: { $sum: { $ifNull: ['$endAsset.quantity', 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    summary: report,
    assetReport: assetReport,
  });
});

module.exports = {
  getMonthlyReport,
  getYearlyReport,
};