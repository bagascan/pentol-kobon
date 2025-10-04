const express = require('express');
const router = express.Router();
const { getInventoryByOutlet, addOrUpdateInventory } = require('../controllers/inventoryController');
const { protect, owner } = require('../middleware/authMiddleware');

router.route('/').post(protect, owner, addOrUpdateInventory);
router.route('/:outletId').get(protect, getInventoryByOutlet);

module.exports = router;