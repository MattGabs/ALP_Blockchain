const db = require('../config/db');

// 1. Menambahkan data ijazah baru ke MySQL (POST)
const addCredential = async (req, res) => {
    // Menangkap data ijazah dari request frontend
    const { token_id, student_wallet, institution_wallet, credential_type, title, grade, ipfs_uri } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO credentials (token_id, student_wallet, institution_wallet, credential_type, title, grade, ipfs_uri) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [token_id, student_wallet, institution_wallet, credential_type, title, grade, ipfs_uri]
        );
        
        res.status(201).json({ 
            message: "Data ijazah berhasil dicatat di database lokal!", 
            recordId: result.insertId 
        });
    } catch (error) {
        console.error("Error mencatat ijazah:", error);
        res.status(500).json({ error: "Gagal menyimpan riwayat ijazah" });
    }
};

// 2. Mengambil riwayat ijazah milik satu mahasiswa (GET)
const getCredentialsByStudent = async (req, res) => {
    const { walletAddress } = req.params;

    try {
        // Menggunakan JOIN agar nama institusi aslinya ikut terbawa
        const query = `
            SELECT c.*, i.name AS institution_name 
            FROM credentials c 
            JOIN institutions i ON c.institution_wallet = i.wallet_address 
            WHERE c.student_wallet = ?
        `;
        
        const [rows] = await db.query(query, [walletAddress]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error mengambil ijazah:", error);
        res.status(500).json({ error: "Gagal memuat riwayat ijazah" });
    }
};

// 3. Mengubah status ijazah menjadi dicabut / Revoked (PUT)
const revokeCredential = async (req, res) => {
    const { tokenId } = req.params;

    try {
        await db.query(
            'UPDATE credentials SET is_revoked = 1 WHERE token_id = ?',
            [tokenId]
        );
        res.status(200).json({ message: "Status ijazah berhasil diubah menjadi dicabut (revoked)!" });
    } catch (error) {
        console.error("Error mencabut ijazah:", error);
        res.status(500).json({ error: "Gagal memperbarui status ijazah" });
    }
};

// 4. Mengambil detail satu ijazah spesifik untuk Verifikator/HRD (GET)
const getCredentialByTokenId = async (req, res) => {
    const { tokenId } = req.params;

    try {
        // DOUBLE JOIN: Mengambil nama institusi DAN nama/data mahasiswa sekaligus
        const query = `
            SELECT c.*, i.name AS institution_name, s.full_name AS student_name, s.student_id, s.major
            FROM credentials c
            JOIN institutions i ON c.institution_wallet = i.wallet_address
            JOIN students s ON c.student_wallet = s.wallet_address
            WHERE c.token_id = ?
        `;
        
        const [rows] = await db.query(query, [tokenId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Ijazah tidak ditemukan di database" });
        }
        
        res.status(200).json(rows[0]); 
    } catch (error) {
        console.error("Error verifikasi ijazah:", error);
        res.status(500).json({ error: "Gagal memproses verifikasi ijazah" });
    }
};

module.exports = {
    addCredential,
    getCredentialsByStudent,
    revokeCredential,
    getCredentialByTokenId
};