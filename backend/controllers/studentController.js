const db = require('../config/db');

// 1. Menambahkan mahasiswa baru ke MySQL (POST)
const addStudent = async (req, res) => {
    // Menangkap data mahasiswa dari request frontend
    const { wallet_address, full_name, student_id, major, enrollment_year } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO students (wallet_address, full_name, student_id, major, enrollment_year) VALUES (?, ?, ?, ?, ?)',
            [wallet_address, full_name, student_id, major, enrollment_year]
        );
        
        res.status(201).json({ 
            message: "Mahasiswa berhasil didaftarkan ke database!", 
            internalId: result.insertId 
        });
    } catch (error) {
        console.error("Error menambah mahasiswa:", error);
        res.status(500).json({ error: "Gagal menyimpan data mahasiswa" });
    }
};

// 2. Mengambil data satu mahasiswa berdasarkan Wallet Address (GET)
const getStudentByWallet = async (req, res) => {
    const { walletAddress } = req.params; 
    
    try {
        const [rows] = await db.query('SELECT * FROM students WHERE wallet_address = ?', [walletAddress]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Mahasiswa belum terdaftar di database" });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error mencari mahasiswa:", error);
        res.status(500).json({ error: "Gagal mencari data mahasiswa" });
    }
};

module.exports = {
    addStudent,
    getStudentByWallet
};