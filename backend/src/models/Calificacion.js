const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Calificacion = sequelize.define('Calificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'ID único de la calificación'
  },
  idCita: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de la cita calificada'
  },
  idVendedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del vendedor calificado'
  },
  puntuacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Puntuación del 1 al 5'
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentario opcional de la calificación'
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Fecha de la calificación'
  }
}, {
  tableName: 'calificaciones',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en',
  comment: 'Tabla de calificaciones de vendedores'
});

module.exports = Calificacion;