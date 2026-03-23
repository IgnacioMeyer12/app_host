const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  dni: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    comment: 'DNI del usuario'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del usuario'
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Apellido del usuario'
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Teléfono de contacto'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Contraseña encriptada'
  },
  rol: {
    type: DataTypes.ENUM('admin', 'cliente', 'vendedor'),
    defaultValue: 'cliente',
    allowNull: false,
    comment: 'Rol del usuario'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Si el usuario está activo'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'fecha_registro',
  updatedAt: false,
  comment: 'Tabla de usuarios del sistema'
});

module.exports = Usuario;