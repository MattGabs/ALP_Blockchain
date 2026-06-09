const express = require('express');
const router = express.Router();
const { addInstitution,getInstitutions, removeInstitution, getInstitutionByWallet } = require('../controllers/institutionController');

// Route untuk POST data institusi (Akses di: POST /api/institutions)
router.post('/', addInstitution);

// Route untuk GET semua data institusi
// Akses di: GET http://localhost:5000/api/institutions
router.get('/', getInstitutions);

// Route untuk GET detail satu institusi berdasarkan Wallet
// Akses di: GET http://localhost:5000/api/institutions/0x123...
router.get('/:walletAddress', getInstitutionByWallet);

// Route untuk PUT (Update) status institusi menjadi dicabut/non-aktif
// Akses di: PUT http://localhost:5000/api/institutions/remove/0x123...
router.put('/remove/:walletAddress', removeInstitution);

module.exports = router;