const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root', // Sesuaikan user mysql kamu
    password: '', // Sesuaikan password mysql kamu
    database: 'edu_verify'
});

// Endpoint untuk mengambil daftar mahasiswa yang siap di-minting
app.get('/api/mahasiswa', (req, res) => {
    db.query('SELECT * FROM mahasiswa', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Endpoint setelah berhasil minting di Frontend, update status di DB
app.post('/api/update-status', (req, res) => {
    const { id, ipfsHash } = req.body;
    db.query(
        'UPDATE mahasiswa SET ipfs_hash = ?, status_minting = "Success" WHERE id = ?',
        [ipfsHash, id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Status database berhasil diperbarui!" });
        }
    );
});

app.listen(5000, () => console.log('Server berjalan di port 5000'));