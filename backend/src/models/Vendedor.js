const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vendedor = sequelize.define('Vendedor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'ID único del vendedor'
  },
  dni: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'DNI del usuario vendedor'
  },
  idSucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de la sucursal a la que pertenece'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Si el vendedor está activo'
  }
}, {
  tableName: 'vendedores',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  comment: 'Tabla de vendedores'
});

module.exports = Vendedor;