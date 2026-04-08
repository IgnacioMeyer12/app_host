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

// ✅ CORS actualizado para Railway y Render
const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'https://IgnacioMeyer12.github.io', // GitHub Pages en producción
];

// Agregar origen dinámico si está en Render
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(process.env.FRONTEND_URL || 'https://IgnacioMeyer12.github.io');
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Servir archivos estáticos (uploads)
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

// ✅ Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/conversaciones', conversacionesRoutes);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Automotores Meyer',
    version: '1.0.0'
  });
});

// ✅ Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// ✅ Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

const PORT = Number(process.env.PORT || 8080);
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    console.log(`🚀 Iniciando servidor en ambiente: ${NODE_ENV}`);
    console.log(`📦 Variables de entorno cargadas`);
    
    // ✅ Prueba conexión a BD
    console.log('🔄 Probando conexión a base de datos...');
    await testConnection();
    console.log('✅ Conexión a BD establecida');

    // ✅ Ejecutar seed (solo en desarrollo, comentar en producción si causa problemas)
    if (NODE_ENV === 'development') {
      console.log('🌱 Ejecutando database seeder...');
      await databaseSeeder.seed();
      console.log('✅ Database seeder completado');
    }

    // ✅ Iniciar cron jobs
    try {
      console.log('⏰ Iniciando cron jobs...');
      iniciarCronJob();
      console.log('✅ Cron jobs iniciados');
    } catch (cronError) {
      console.warn('⚠️ Advertencia en cron jobs:', cronError.message);
    }

    // ✅ Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`${'='.repeat(50)}\n`);
      
      if (NODE_ENV === 'development') {
        console.log(`Credenciales de prueba:\n` +
          `  👤 admin: DNI 12345678 / admin123\n` +
          `  👤 cliente: DNI 87654321 / cliente123\n` +
          `  👤 vendedor: DNI 11111111 / vendedor123\n`);
      }
    });

    // ✅ Manejo de errores del servidor
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso.`);
        console.error(`Opciones:\n` +
          `  1. Cambia PORT en .env\n` +
          `  2. Cierra el proceso que usa el puerto\n` +
          `  3. Usa: lsof -i :${PORT} (macOS/Linux) o netstat -ano | findstr :${PORT} (Windows)`);
      } else {
        console.error('❌ Error en el servidor:', err.message);
      }
      process.exit(1);
    });

    // ✅ Manejo de señales de cierre graceful
    process.on('SIGTERM', () => {
      console.log('📴 SIGTERM recibido, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('📴 SIGINT recibido, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

startServer();

module.exports = app;