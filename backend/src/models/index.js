const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');
const Cita = require('./Cita');
const Sucursal = require('./Sucursal');
const Marca = require('./Marca');
const Vendedor = require('./Vendedor');
const Calificacion = require('./Calificacion');

// Definir relaciones entre modelos
// Una cita pertenece a un usuario
Cita.belongsTo(Usuario, {
  foreignKey: 'dni',
  targetKey: 'dni',
  as: 'usuario'
});

// Una cita puede estar relacionada con un vehículo
Cita.belongsTo(Vehiculo, {
  foreignKey: 'idVehiculo',
  targetKey: 'idVehiculo',
  as: 'vehiculo'
});

// Un usuario puede tener muchas citas
Usuario.hasMany(Cita, {
  foreignKey: 'dni',
  sourceKey: 'dni',
  as: 'citas'
});

// Un vehículo puede estar en muchas citas
Vehiculo.hasMany(Cita, {
  foreignKey: 'idVehiculo',
  sourceKey: 'idVehiculo',
  as: 'citas'
});

// Un vehículo pertenece a una marca
Vehiculo.belongsTo(Marca, {
  foreignKey: 'idMarca',
  targetKey: 'id',
  as: 'marca'
});

// Una marca puede tener muchos vehículos
Marca.hasMany(Vehiculo, {
  foreignKey: 'idMarca',
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

// Un vendedor pertenece a un usuario
Vendedor.belongsTo(Usuario, {
  foreignKey: 'dni',
  targetKey: 'dni',
  as: 'usuario'
});

// Un usuario puede ser un vendedor (1:1)
Usuario.hasOne(Vendedor, {
  foreignKey: 'dni',
  sourceKey: 'dni',
  as: 'vendedor'
});

// Una cita puede tener un vendedor asignado
Cita.belongsTo(Vendedor, {
  foreignKey: 'idVendedor',
  targetKey: 'id',
  as: 'vendedor'
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
  Usuario,
  Vehiculo,
  Cita,
  Sucursal,
  Marca,
  Vendedor,
  Calificacion
};