const express = require('express');
const cors = require('cors');
require('dotenv').config();

const studentRoutes = require('./routes/studentRoutes');
const credentialRoutes = require('./routes/credentialRoutes');

const app = express();

app.use(cors());
app.use(express.json()); // Supaya bisa membaca payload JSON dari React

// Routing API
app.use('/api/students', studentRoutes);
app.use('/api/credentials', credentialRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend EduVerify running on port ${PORT}`);
});