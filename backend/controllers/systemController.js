const db = require('../config/db');

const testConnection = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.status(200).json({ 
            message: "Server Backend Web3 Berjalan Lancar!",
            database: "Terhubung ke database alp_blockchain",
            testQuery: rows[0].result
        });
    } catch (error) {
        console.error("Gagal terhubung ke database:", error);
        res.status(500).json({ error: "Koneksi Database Gagal" });
    }
};

module.exports = {
    testConnection
};