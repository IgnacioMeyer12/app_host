const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la conexión a MySQL con Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'automotores_meyer_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    }
  }
);

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente');

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados con la base de datos');

  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    console.log('💡 Verifica que:');
    console.log('   1. XAMPP esté ejecutándose');
    console.log('   2. MySQL esté iniciado en XAMPP');
    console.log('   3. La base de datos exista (o créala en phpMyAdmin)');
  }
};

module.exports = {
  sequelize,
  testConnection
};