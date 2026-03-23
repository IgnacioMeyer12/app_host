const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cita = sequelize.define('Cita', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'ID único de la cita'
  },
  dni: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'DNI del cliente que agendó'
  },
  idVehiculo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'ID del vehículo (opcional)'
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha y hora de la cita'
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Razón de la cita'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'finalizada'),
    defaultValue: 'pendiente',
    allowNull: false,
    comment: 'Estado de la cita'
  },
  admin_dni: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'DNI del admin que respondió'
  },
  admin_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensaje del admin'
  },
  idVendedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del vendedor asignado a la cita'
  }
}, {
  tableName: 'citas',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en',
  comment: 'Tabla de citas agendadas'
});

module.exports = Cita;