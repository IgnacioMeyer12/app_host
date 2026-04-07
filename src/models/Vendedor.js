const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vendedor = sequelize.define('Vendedor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  dni: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('vendedor'),
    allowNull: false,
    defaultValue: 'vendedor'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  idSucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'vendedores',
  timestamps: false
});

module.exports = Vendedor;
