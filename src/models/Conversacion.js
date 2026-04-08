const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversacion = sequelize.define('Conversacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'ID único de la conversación'
  },
  idCita: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'citas',
      key: 'id'
    },
    comment: 'ID de la cita relacionada'
  },
  idEmisor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'DNI del usuario que envía el mensaje'
  },
  idReceptor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'DNI del usuario que recibe el mensaje'
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Contenido del mensaje'
  },
  tipo: {
    type: DataTypes.ENUM('texto', 'imagen', 'archivo'),
    defaultValue: 'texto',
    allowNull: false,
    comment: 'Tipo de mensaje'
  },
  leido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Si el mensaje ha sido leído'
  }
}, {
  tableName: 'conversaciones',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  comment: 'Tabla de conversaciones entre clientes y vendedores'
});

// Relaciones
Conversacion.associate = (models) => {
  Conversacion.belongsTo(models.Cita, {
    foreignKey: 'idCita',
    as: 'cita'
  });
};

module.exports = Conversacion;