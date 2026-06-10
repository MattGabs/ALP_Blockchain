require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Import Routes
const systemRoutes = require('./routes/systemRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const studentRoutes = require('./routes/studentRoutes'); 
const credentialRoutes = require('./routes/credentialRoutes'); 


// Middleware
app.use(cors());
app.use(express.json());

// Menggunakan Routes
app.use('/api/system', systemRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/credentials', credentialRoutes); 


// Menyalakan Server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});