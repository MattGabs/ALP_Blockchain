const db = require('./db');

exports.syncCredentialOnChain = async (req, res) => {
    const { token_id, student_wallet, institution_wallet, credential_type, title, grade, ipfs_uri, tx_hash } = req.body;

    try {
        // Validasi data dasar
        if (token_id === undefined || !tx_hash) {
            return res.status(400).json({ success: false, message: "Token ID dan Transaction Hash wajib disertakan!" });
        }

        // Simpan data ijazah yang sudah sah ke MySQL
        await db.query(
            `INSERT INTO credentials (token_id, student_wallet, institution_wallet, credential_type, title, grade, ipfs_uri, tx_hash) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [token_id, student_wallet.toLowerCase(), institution_wallet.toLowerCase(), credential_type, title, grade, ipfs_uri, tx_hash]
        );

        res.status(200).json({
            success: true,
            message: `Data On-chain (SBT ID: ${token_id}) berhasil disinkronkan dengan Database Off-chain MySQL.`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};