const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Vehiculo = sequelize.define(
  "Vehiculo",
  {
    idVehiculo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      field: "id_vehiculo",
      comment: "ID único del vehículo",
    },

    idMarca: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_marca",
      references: {
        model: "marcas",
        key: "id",
      },
      comment: "ID de la marca del vehículo",
    },

    modelo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Modelo del vehículo",
    },

    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Año de fabricación",
    },

    precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: "Precio en USD",
    },

    km: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Kilómetros del vehículo",
    },

    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "Cantidad disponible",
    },

    color: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: "Color del vehículo",
    },

    idSucursal: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "id_sucursal",
      references: {
        model: "sucursales",
        key: "id",
      },
      comment: "Sucursal asignada al vehículo",
    },

    fotos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "URLs de fotos en formato JSON",
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada",
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Si está disponible para venta",
    },
  },
  {
    tableName: "vehiculos",
    timestamps: true,
    underscored: true,
    createdAt: "fecha_creacion",
    updatedAt: "fecha_actualizacion",
    comment: "Tabla de vehículos disponibles",
  }
);

module.exports = Vehiculo;