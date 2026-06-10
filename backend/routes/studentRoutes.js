const express = require('express');
const router = express.Router();
const { addStudent, getStudentByWallet } = require('../controllers/studentController');

// Route untuk POST data mahasiswa (Akses di: POST /api/students)
router.post('/', addStudent);

// Route untuk GET profil mahasiswa berdasarkan Wallet
// Akses di: GET http://localhost:5000/api/students/0x123...
router.get('/:walletAddress', getStudentByWallet);

module.exports = router;