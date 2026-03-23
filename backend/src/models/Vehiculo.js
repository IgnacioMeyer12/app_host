const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehiculo = sequelize.define('Vehiculo', {
  idVehiculo: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    comment: 'ID único del vehículo'
  },
  idMarca: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'marcas',
      key: 'id'
    },
    comment: 'ID de la marca del vehículo'
  },
  modelo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Modelo del vehículo'
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Año de fabricación'
  },
  precio: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Precio en pesos'
  },
  km: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Kilómetros del vehículo'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'Cantidad disponible'
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'Color del vehículo'
  },
  fotos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'URLs de fotos en formato JSON'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Si está disponible para venta'
  }
}, {
  tableName: 'vehiculos',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  comment: 'Tabla de vehículos disponibles'
});

module.exports = Vehiculo;