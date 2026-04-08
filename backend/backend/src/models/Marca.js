const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Marca = sequelize.define('Marca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'ID único de la marca'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Nombre de la marca'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de la marca'
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Si la marca está activa'
  }
}, {
  tableName: 'marcas',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  comment: 'Tabla de marcas de vehículos'
});

module.exports = Marca;