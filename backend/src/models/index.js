const Vehiculo = require('./Vehiculo');
const Cita = require('./Cita');
const Sucursal = require('./Sucursal');
const Marca = require('./Marca');
const Vendedor = require('./Vendedor');
const Calificacion = require('./Calificacion');
const Cliente = require('./Cliente');
const Administrador = require('./Administrador');
const Conversacion = require('./Conversacion');

// Relaciones mínimas para sincronizar tablas
// Puedes agregar relaciones entre Cliente, Administrador, VendedorNuevo y otras según sea necesario

// Relación: Un vehículo pertenece a una marca
Vehiculo.belongsTo(Marca, {
  foreignKey: 'idMarca',
  targetKey: 'id',
  as: 'marca'
});

// Relación: Un vehículo pertenece a una sucursal
Vehiculo.belongsTo(Sucursal, {
  foreignKey: 'idSucursal',
  targetKey: 'id',
  as: 'sucursal'
});

// Una marca puede tener muchos vehículos
Marca.hasMany(Vehiculo, {
  foreignKey: 'idMarca',
  sourceKey: 'id',
  as: 'vehiculos'
});

// Una sucursal puede tener muchos vehículos
Sucursal.hasMany(Vehiculo, {
  foreignKey: 'idSucursal',
  sourceKey: 'id',
  as: 'vehiculos'
});

// Un vendedor pertenece a una sucursal
Vendedor.belongsTo(Sucursal, {
  foreignKey: 'idSucursal',
  targetKey: 'id',
  as: 'sucursal'
});

// Una sucursal puede tener muchos vendedores
Sucursal.hasMany(Vendedor, {
  foreignKey: 'idSucursal',
  sourceKey: 'id',
  as: 'vendedores'
});

// Una cita puede tener un vendedor asignado
Cita.belongsTo(Vendedor, {
  foreignKey: 'idVendedor',
  targetKey: 'id',
  as: 'vendedor'
});

// Una cita puede tener un cliente asociado (id)
Cita.belongsTo(Cliente, {
  foreignKey: 'idCliente',
  targetKey: 'id',
  as: 'cliente'
});

// Una cita puede tener un administrador asociado (id)
Cita.belongsTo(Administrador, {
  foreignKey: 'idAdministrador',
  targetKey: 'id',
  as: 'administrador'
});

// Una cita puede tener un vehículo asociado
Cita.belongsTo(Vehiculo, {
  foreignKey: 'idVehiculo',
  targetKey: 'idVehiculo',
  as: 'vehiculo'
});

// Una cita pertenece a una sucursal
Cita.belongsTo(Sucursal, {
  foreignKey: 'idSucursal',
  targetKey: 'id',
  as: 'sucursal'
});

// Un vehículo puede tener muchas citas
Vehiculo.hasMany(Cita, {
  foreignKey: 'idVehiculo',
  sourceKey: 'idVehiculo',
  as: 'citas'
});

// Un cliente puede tener muchas citas
Cliente.hasMany(Cita, {
  foreignKey: 'idCliente',
  sourceKey: 'id',
  as: 'citas'
});

// Un administrador puede tener muchas citas
Administrador.hasMany(Cita, {
  foreignKey: 'idAdministrador',
  sourceKey: 'id',
  as: 'citas'
});

// Un vendedor puede tener muchas citas
Vendedor.hasMany(Cita, {
  foreignKey: 'idVendedor',
  sourceKey: 'id',
  as: 'citas'
});

// Una calificación pertenece a una cita
Calificacion.belongsTo(Cita, {
  foreignKey: 'idCita',
  targetKey: 'id',
  as: 'cita'
});

// Una cita puede tener una calificación (1:1)
Cita.hasOne(Calificacion, {
  foreignKey: 'idCita',
  sourceKey: 'id',
  as: 'calificacion'
});

// Una calificación pertenece a un vendedor
Calificacion.belongsTo(Vendedor, {
  foreignKey: 'idVendedor',
  targetKey: 'id',
  as: 'vendedor'
});

// Un vendedor puede tener muchas calificaciones
Vendedor.hasMany(Calificacion, {
  foreignKey: 'idVendedor',
  sourceKey: 'id',
  as: 'calificaciones'
});

module.exports = {
  Vehiculo,
  Cita,
  Sucursal,
  Marca,
  Vendedor,
  Calificacion,
  Cliente,
  Administrador,
  Conversacion
};