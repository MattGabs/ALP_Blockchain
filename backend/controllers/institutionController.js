const db = require('../config/db');

// 1. Menambahkan institusi baru ke MySQL (POST)
const addInstitution = async (req, res) => {
    const { wallet_address, name, accreditation, email } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO institutions (wallet_address, name, accreditation, email) VALUES (?, ?, ?, ?)',
            [wallet_address, name, accreditation, email]
        );
        
        res.status(201).json({ 
            message: "Institusi berhasil ditambahkan ke database lokal!", 
            institutionId: result.insertId 
        });
    } catch (error) {
        console.error("Error menambah institusi:", error);
        res.status(500).json({ error: "Gagal menyimpan data institusi ke database" });
    }
};

// 2. Mengambil semua data institusi (GET)
const getInstitutions = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM institutions');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error mengambil daftar institusi:", error);
        res.status(500).json({ error: "Gagal mengambil data institusi" });
    }
};

// 3. Mengubah status institusi menjadi tidak terdaftar / Soft Delete (PUT)
const removeInstitution = async (req, res) => {
    const { walletAddress } = req.params;

    try {
        await db.query(
            'UPDATE institutions SET is_registered = 0 WHERE wallet_address = ?',
            [walletAddress]
        );
        res.status(200).json({ message: "Akses institusi berhasil dicabut di database lokal!" });
    } catch (error) {
        console.error("Error mencabut akses institusi:", error);
        res.status(500).json({ error: "Gagal memperbarui status institusi" });
    }
};

// 4. Mengambil data satu institusi berdasarkan wallet address (GET)
const getInstitutionByWallet = async (req, res) => {
    const { walletAddress } = req.params;

    try {
        const [rows] = await db.query('SELECT * FROM institutions WHERE wallet_address = ?', [walletAddress]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Institusi tidak ditemukan di database" });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error mengambil detail institusi:", error);
        res.status(500).json({ error: "Gagal memuat detail institusi" });
    }
};

module.exports = {
    addInstitution,
    getInstitutions,
    removeInstitution,
    getInstitutionByWallet
};