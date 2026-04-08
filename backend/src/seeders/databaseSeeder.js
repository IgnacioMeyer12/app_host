const { Cliente, Administrador, Vehiculo, Sucursal, Marca, Vendedor } = require('../models');
const bcrypt = require('bcryptjs');

class DatabaseSeeder {
  async seed() {
    try {
      console.log('🌱 Ejecutando seeders...');


      // Crear sucursal principal primero
      await this.seedSucursales();

      // Crear usuarios por defecto (usa la sucursal creada)
      await this.seedUsers();

      // Crear vehículos de ejemplo
      await this.seedVehicles();

      // Crear marcas de ejemplo
      await this.seedMarcas();

      console.log('✅ Seeders ejecutados exitosamente');

    } catch (error) {
      console.error('❌ Error ejecutando seeders:', error);
    }
  }

  async seedUsers() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('cliente123', 10);
    const vendedorPassword = await bcrypt.hash('vendedor123', 10);

    // Buscar sucursal principal para asignar a los vendedores
    const sucursalPrincipal = await Sucursal.findOne({ where: { nombre: 'Sucursal Principal' } });
    const idSucursal = sucursalPrincipal ? sucursalPrincipal.id : 1;

    // Administrador
    await Administrador.findOrCreate({
      where: { dni: '12345678' },
      defaults: {
        dni: '12345678',
        nombre: 'Administrador',
        apellido: 'Sistema',
        telefono: '3411234567',
        password: adminPassword,
        rol: 'admin',
        activo: true
      }
    });

    // Cliente
    await Cliente.findOrCreate({
      where: { dni: '87654321' },
      defaults: {
        dni: '87654321',
        nombre: 'Juan',
        apellido: 'Perez',
        telefono: '3417654321',
        password: clientPassword,
        rol: 'cliente',
        activo: true
      }
    });

    // Vendedores
    await Vendedor.findOrCreate({
      where: { dni: '11111111' },
      defaults: {
        dni: '11111111',
        nombre: 'Carlos',
        apellido: 'Rodriguez',
        telefono: '3411111111',
        password: vendedorPassword,
        rol: 'vendedor',
        activo: true,
        idSucursal
      }
    });

    await Vendedor.findOrCreate({
      where: { dni: '22222222' },
      defaults: {
        dni: '22222222',
        nombre: 'Maria',
        apellido: 'Gonzalez',
        telefono: '3412222222',
        password: vendedorPassword,
        rol: 'vendedor',
        activo: true,
        idSucursal
      }
    });

    console.log('👥 Usuarios por defecto creados');
  }

  async seedVehicles() {
    // Implementar seeding de vehículos si es necesario
    console.log('🚗 Vehículos de ejemplo creados');
  }

  async seedSucursales() {
    await Sucursal.findOrCreate({
      where: { nombre: 'Sucursal Principal' },
      defaults: {
        nombre: 'Sucursal Principal',
        direccion: 'Amenabar 2469',
        telefono: '3413838911',
        latitud: -32.9511, // valor de ejemplo
        longitud: -60.6667, // valor de ejemplo
        activa: true,
        testdrive: true
      }
    });
    console.log('🏢 Sucursal Principal creada');
  }

  async seedMarcas() {
    // Implementar seeding de marcas si es necesario
    console.log('🏷️ Marcas de ejemplo creadas');
  }



}

module.exports = new DatabaseSeeder();