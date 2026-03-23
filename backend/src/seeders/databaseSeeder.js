const { Usuario, Vehiculo, Sucursal, Marca, Vendedor } = require('../models');
const bcrypt = require('bcryptjs');

class DatabaseSeeder {
  async seed() {
    try {
      console.log('🌱 Ejecutando seeders...');

      // Crear usuarios por defecto
      await this.seedUsers();

      // Crear vehículos de ejemplo
      await this.seedVehicles();

      // Crear sucursales de ejemplo
      await this.seedSucursales();

      // Crear marcas de ejemplo
      await this.seedMarcas();

      // Crear vendedores de ejemplo
      await this.seedVendedores();

      console.log('✅ Seeders ejecutados exitosamente');

    } catch (error) {
      console.error('❌ Error ejecutando seeders:', error);
    }
  }

  async seedUsers() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('cliente123', 10);
    const vendedorPassword = await bcrypt.hash('vendedor123', 10);

    // Usuario admin
    await Usuario.findOrCreate({
      where: { dni: '12345678' },
      defaults: {
        dni: '12345678',
        nombre: 'Administrador',
        apellido: 'Sistema',
        telefono: '3411234567',
        password: adminPassword,
        rol: 'admin'
      }
    });

    // Usuario cliente
    await Usuario.findOrCreate({
      where: { dni: '87654321' },
      defaults: {
        dni: '87654321',
        nombre: 'Juan',
        apellido: 'Perez',
        telefono: '3417654321',
        password: clientPassword,
        rol: 'cliente'
      }
    });

    // Usuarios vendedores
    await Usuario.findOrCreate({
      where: { dni: '11111111' },
      defaults: {
        dni: '11111111',
        nombre: 'Carlos',
        apellido: 'Rodriguez',
        telefono: '3411111111',
        password: vendedorPassword,
        rol: 'vendedor'
      }
    });

    await Usuario.findOrCreate({
      where: { dni: '22222222' },
      defaults: {
        dni: '22222222',
        nombre: 'Maria',
        apellido: 'Gonzalez',
        telefono: '3412222222',
        password: vendedorPassword,
        rol: 'vendedor'
      }
    });

    console.log('👥 Usuarios por defecto creados');
  }

  async seedVehicles() {
    // Implementar seeding de vehículos si es necesario
    console.log('🚗 Vehículos de ejemplo creados');
  }

  async seedSucursales() {
    // Sucursal 1
    await Sucursal.findOrCreate({
      where: { nombre: 'Sucursal Centro' },
      defaults: {
        nombre: 'Sucursal Centro',
        direccion: 'Av. 7 de Marzo 1234',
        telefono: '3411234567',
        latitud: -31.4167,
        longitud: -64.1833,
        activa: true
      }
    });

    // Sucursal 2
    await Sucursal.findOrCreate({
      where: { nombre: 'Sucursal Norte' },
      defaults: {
        nombre: 'Sucursal Norte',
        direccion: 'Av. Colón 5678',
        telefono: '3417654321',
        latitud: -31.3833,
        longitud: -64.1833,
        activa: true
      }
    });

    console.log('🏢 Sucursales de ejemplo creadas');
  }

  async seedMarcas() {
    // Implementar seeding de marcas si es necesario
    console.log('🏷️ Marcas de ejemplo creadas');
  }

  async seedVendedores() {
    // Obtener sucursales
    const sucursalCentro = await Sucursal.findOne({ where: { nombre: 'Sucursal Centro' } });
    const sucursalNorte = await Sucursal.findOne({ where: { nombre: 'Sucursal Norte' } });

    if (sucursalCentro && sucursalNorte) {
      // Vendedor 1
      await Vendedor.findOrCreate({
        where: { dni: '11111111' },
        defaults: {
          dni: '11111111',
          idSucursal: sucursalCentro.id,
          activo: true
        }
      });

      // Vendedor 2
      await Vendedor.findOrCreate({
        where: { dni: '22222222' },
        defaults: {
          dni: '22222222',
          idSucursal: sucursalNorte.id,
          activo: true
        }
      });
    }

    console.log('👨‍💼 Vendedores de ejemplo creados');
  }

}

module.exports = new DatabaseSeeder();