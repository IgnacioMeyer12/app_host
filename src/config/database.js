const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Para Railway u otros servicios que proporcionan DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
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
  // Configuración local
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = Number(process.env.DB_PORT || 3306);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'automotores_meyer_db';

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
      throw error;
    }
  }
};

module.exports = {
  sequelize,
  testConnection
};