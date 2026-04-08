const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support Railway's MySQL environment variables, with fallback to generic DB_* vars
const dbHost = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
const dbUser = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const dbPassword = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'automotores_meyer_db';

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    }
  });
} else {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
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
    if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
      console.log(`⚠️ La base de datos ${dbName} no existe. Creándola...`);

      const serverSequelize = new Sequelize('', dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: 'mysql',
        logging: false
      });

      try {
        await serverSequelize.authenticate();
        await serverSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
        console.log(`✅ Base de datos '${dbName}' creada`);
        await serverSequelize.close();

        await sequelize.authenticate();
        await sequelize.sync({ force: false });
        console.log('✅ Modelos sincronizados con la base de datos');
      } catch (innerError) {
        console.error('❌ No se pudo crear la base de datos:', innerError.message);
        throw innerError;
      }
    } else {
      console.error('❌ Error al conectar con MySQL:', error.message);
      console.log('💡 Verifica: XAMPP/MySQL activo, credenciales, host, puerto');
      console.log('⚠️ El servidor continuará sin conexión a BD - las rutas devolverán errores 500');
      // En producción, no salir del proceso - permitir que el servidor siga corriendo
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    }
  }
};

module.exports = {
  sequelize,
  testConnection
};