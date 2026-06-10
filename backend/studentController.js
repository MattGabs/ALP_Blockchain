const db = require('./db');

exports.registerStudentOffChain = async (req, res) => {
    const { wallet_address, full_name, student_id, major, enrollment_year } = req.body;
    
    try {
        // Simpan data ke MySQL terlebih dahulu
        await db.query(
            `INSERT INTO students (wallet_address, full_name, student_id, major, enrollment_year) 
             VALUES (?, ?, ?, ?, ?)`,
            [wallet_address.toLowerCase(), full_name, student_id, major, enrollment_year]
        );
        
        res.status(201).json({ 
            success: true, 
            message: "Data mahasiswa berhasil disimpan secara off-chain. Siap disinkronkan ke blockchain via frontend." 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};