const express = require('express');
const router = express.Router();
const { getVapidKey } = require('../controllers/configController');

router.get('/vapid-key', getVapidKey);

module.exports = router;