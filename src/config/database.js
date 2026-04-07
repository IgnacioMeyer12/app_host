const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.RAILWAY_PRIVATE_DOMAIN || 'localhost';
const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306);
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'automotores_meyer_db';

if (dbUrl) {
  // Para Railway u otros servicios que proporcionan URL de conexión
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Configuración local o Railway con vars separadas
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión a MySQL (${dbName}) establecida correctamente`);
    await sequelize.sync({ alter: true }); // Sincroniza cambios en modelos con DB (añade columnas faltantes)
    console.log('✅ Modelos sincronizados con la base de datos (alter mode)');
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    console.log('💡 Verifica: credenciales, host, puerto en Railway');
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection
};