/* ============================================================
   SERVIDOR BACKEND - AUTOMOTORES MEYER
   ============================================================
   Archivo principal de la API REST con Express.js - Versión Organizada

   ESTRUCTURA:
   - Modelos Sequelize en /models
   - Controladores en /controllers
   - Rutas en /routes
   - Middlewares en /middleware
   - Configuración en /config

   FUNCIONALIDADES:
   - Gestión de vehículos (crear, leer, actualizar, eliminar)
   - Autenticación de usuarios (registro, login)
   - Agendamiento de citas
   - Subida de imágenes (fotos de vehículos)
   - Base de datos MySQL con Sequelize

   ============================================================ */

/* IMPORTACIONES: Librerías necesarias para el servidor */
const express = require('express');
const cors = require('cors');
const path = require('path');

/* IMPORTACIONES: Módulos propios */
const { testConnection } = require('./config/database');
const databaseSeeder = require('./seeders/databaseSeeder');
const { uploadMultiple } = require('./middleware/upload');
const { iniciarCronJob } = require('./utils/cronJobs');

/* IMPORTACIONES: Rutas */
const authRoutes = require('./routes/auth');
const vehiculosRoutes = require('./routes/vehiculos');
const citasRoutes = require('./routes/citas');
const sucursalesRoutes = require('./routes/sucursales');
const marcasRoutes = require('./routes/marcas');
const vendedoresRoutes = require('./routes/vendedores');
const calificacionesRoutes = require('./routes/calificaciones');

/* CREAR LA APLICACIÓN EXPRESS */
const app = express();

/* ============================================================
   MIDDLEWARES: Procesa las peticiones antes de llegar a las rutas
   ============================================================ */

/* MIDDLEWARE: CORS (Control de Acceso de Origen Cruzado)
   Permite que el frontend (localhost:4200) acceda a la API */
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));

/* MIDDLEWARE: Parsing de JSON y URL-encoded
   Convierte el body de las peticiones en objetos JavaScript */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* SERVIR ARCHIVOS ESTÁTICOS
   Los archivos en /public/uploads/ se pueden acceder vía /uploads/ */
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

/* ============================================================
   RUTAS DE LA API
   ============================================================ */

/* RUTA: POST /api/upload
   Permite subir múltiples imágenes (máximo 10) */
app.post('/api/upload', uploadMultiple, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron archivos'
      });
    }

    const uploadedFiles = req.files.map(f => {
      return `${req.protocol}://${req.get('host')}/uploads/${f.filename}`;
    });

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (err) {
    console.error('Error en /api/upload:', err);
    res.status(500).json({
      success: false,
      message: 'Error subiendo archivos'
    });
  }
});

/* RUTAS: API organizada por módulos */
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/calificaciones', calificacionesRoutes);

/* RUTA: GET /api/health
   Endpoint de salud para verificar que la API está funcionando */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Automotores Meyer funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

/* MIDDLEWARE: Manejo de rutas no encontradas */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

/* MIDDLEWARE: Manejo de errores global */
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

/* ============================================================
   INICIALIZACIÓN DEL SERVIDOR
   ============================================================ */

async function startServer() {
  try {
    console.log('🚗 Iniciando servidor Automotores Meyer...');

    /* PASO 1: Probar conexión a la base de datos */
    await testConnection();

    /* PASO 2: Ejecutar seeders para datos iniciales */
    await databaseSeeder.seed();

    /* PASO 3: Iniciar cron jobs */
    iniciarCronJob();

    /* PASO 4: Iniciar el servidor Express */
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Usuario admin: DNI 12345678, Contraseña: admin123`);
      console.log(`👤 Usuario cliente: DNI 87654321, Contraseña: cliente123`);
      console.log('\n📁 Estructura organizada:');
      console.log('   📂 /models - Modelos Sequelize');
      console.log('   📂 /controllers - Lógica de negocio');
      console.log('   📂 /routes - Definición de rutas');
      console.log('   📂 /middleware - Middlewares personalizados');
      console.log('   📂 /config - Configuración de base de datos');
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

/* INICIAR SERVIDOR */
startServer();

module.exports = app;