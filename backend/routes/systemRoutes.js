const express = require('express');
const router = express.Router();
const { testConnection } = require('../controllers/systemController');

// Route untuk test koneksi (GET /api/system/test)
router.get('/test', testConnection);

module.exports = router;