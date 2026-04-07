const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sucursal = sequelize.define('Sucursal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'ID único de la sucursal'
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre de la sucursal'
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Dirección de la sucursal'
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Teléfono de contacto'
  },
  horario_inicio: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '09:00',
    comment: 'Horario de apertura HH:mm'
  },
  horario_fin: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '18:00',
    comment: 'Horario de cierre HH:mm'
  },
  latitud: {
    type: DataTypes.DECIMAL(12, 8),
    allowNull: false,
    comment: 'Latitud para el mapa'
  },
  longitud: {
    type: DataTypes.DECIMAL(12, 8),
    allowNull: false,
    comment: 'Longitud para el mapa'
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Si la sucursal está activa'
  },
  testdrive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Si la sucursal permite test drives'
  }
}, {
  tableName: 'sucursales',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  comment: 'Tabla de sucursales'
});

module.exports = Sucursal;