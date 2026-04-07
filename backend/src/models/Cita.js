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
  idCliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_cliente',
    references: {
      model: 'clientes',
      key: 'id'
    },
    comment: 'ID del cliente que agendó'
  },
  idVehiculo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_vehiculo',
    references: {
      model: 'vehiculos',
      key: 'id_vehiculo'
    },
    comment: 'ID del vehículo (opcional)'
  },
  idSucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_sucursal',
    references: {
      model: 'sucursales',
      key: 'id'
    },
    comment: 'ID de la sucursal asociada a la cita'
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
  // admin_dni is kept only for backwards compatibility but is no longer used as main field
  // in tickets / appointment workflow. Use idAdministrador instead.
  idAdministrador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_administrador',
    references: {
      model: 'administradores',
      key: 'id'
    },
    comment: 'ID del administrador que respondió'
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