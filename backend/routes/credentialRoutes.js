const express = require('express');
const router = express.Router();
const { addCredential, getCredentialsByStudent, revokeCredential, getCredentialByTokenId} = require('../controllers/credentialController');

// Route untuk POST data ijazah (Akses di: POST /api/credentials)
router.post('/', addCredential);

// Route untuk GET riwayat ijazah milik satu mahasiswa
// Akses di: GET /api/credentials/student/0x...
router.get('/student/:walletAddress', getCredentialsByStudent);

// Route untuk PUT mengubah status ijazah menjadi dicabut (Revoke)
// Akses di: PUT /api/credentials/revoke/0
router.put('/revoke/:tokenId', revokeCredential);

// Route untuk GET detail satu ijazah spesifik untuk Verifikator/HRD
// Akses di: GET /api/credentials/0
router.get('/:tokenId', getCredentialByTokenId);

module.exports = router;