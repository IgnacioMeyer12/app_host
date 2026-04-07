const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const databaseSeeder = require('./seeders/databaseSeeder');
const { uploadMultiple } = require('./middleware/upload');
const { iniciarCronJob } = require('./utils/cronJobs');

const authRoutes = require('./routes/auth');
const vehiculosRoutes = require('./routes/vehiculos');
const citasRoutes = require('./routes/citas');
const sucursalesRoutes = require('./routes/sucursales');
const marcasRoutes = require('./routes/marcas');
const vendedoresRoutes = require('./routes/vendedores');
const calificacionesRoutes = require('./routes/calificaciones');
const conversacionesRoutes = require('./routes/conversaciones');

const path = require('path');

const app = express();

app.use(cors({ origin: ['http://localhost:4200', 'http://127.0.0.1:4200'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.post('/api/upload', uploadMultiple, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No se recibieron archivos' });
    }

    const uploadedFiles = req.files.map((f) => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);

    res.json({ success: true, files: uploadedFiles });
  } catch (err) {
    console.error('Error en /api/upload:', err);
    res.status(500).json({ success: false, message: 'Error subiendo archivos' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/conversaciones', conversacionesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor', error: err.message });
});

const PORT = Number(process.env.PORT || 3001);

async function startServer() {
  try {
    await testConnection();
    await databaseSeeder.seed();

    const server = app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('Health: http://localhost:' + PORT + '/api/health');
      console.log(`Credenciales de prueba:\n` +
        `  admin: DNI 12345678 / admin123\n` +
        `  cliente: DNI 87654321 / cliente123\n` +
        `  vendedor: DNI 11111111 / vendedor123`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso. Cambia PORT en .env o cierra el proceso que lo usa.`);
      } else {
        console.error('❌ Error en el servidor:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
