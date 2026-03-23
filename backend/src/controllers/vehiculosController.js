const { Vehiculo } = require('../models');

class VehiculosController {
  // Crear vehículo
  async create(req, res) {
    try {
      const {
        idVehiculo,
        idMarca,
        modelo,
        anio,
        precio,
        km,
        stock,
        color,
        fotos,
        descripcion
      } = req.body;

      // Validaciones
      if (!idVehiculo || !idMarca || !modelo || !anio || !precio || km === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Campos obligatorios: idVehiculo, idMarca, modelo, anio, precio, km'
        });
      }

      // Verificar que la marca existe
      const marca = await require('../models').Marca.findByPk(idMarca);
      if (!marca) {
        return res.status(400).json({
          success: false,
          message: 'La marca especificada no existe'
        });
      }

      // Verificar si el vehículo ya existe
      const existingVehicle = await Vehiculo.findByPk(idVehiculo);
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un vehículo con ese ID'
        });
      }

      // Crear vehículo
      const newVehicle = await Vehiculo.create({
        idVehiculo,
        idMarca,
        modelo,
        anio: parseInt(anio),
        precio: parseFloat(precio),
        km: parseInt(km),
        stock: stock ? parseInt(stock) : 1,
        color,
        fotos: fotos ? JSON.parse(fotos) : null,
        descripcion
      });

      res.status(201).json({
        success: true,
        message: 'Vehículo creado exitosamente',
        vehicle: newVehicle
      });

    } catch (error) {
      console.error('Error creando vehículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener todos los vehículos activos
  async getAll(req, res) {
    try {
      const vehicles = await Vehiculo.findAll({
        where: { activo: true },
        include: [
          {
            model: require('../models').Marca,
            as: 'marca',
            attributes: ['id', 'nombre', 'descripcion']
          }
        ],
        order: [['fecha_creacion', 'DESC']]
      });

      res.json({
        success: true,
        vehicles
      });

    } catch (error) {
      console.error('Error obteniendo vehículos:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener todos los vehículos (incluyendo inactivos) - admin
  async getAllAdmin(req, res) {
    try {
      const vehicles = await Vehiculo.findAll({
        include: [
          {
            model: require('../models').Marca,
            as: 'marca',
            attributes: ['id', 'nombre', 'descripcion']
          }
        ],
        order: [['fecha_creacion', 'DESC']]
      });

      res.json({
        success: true,
        vehicles
      });

    } catch (error) {
      console.error('Error obteniendo vehículos:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Actualizar vehículo
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validaciones
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de vehículo requerido'
        });
      }

      const vehicle = await Vehiculo.findByPk(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      // Validar idMarca si se está actualizando
      if (updates.idMarca !== undefined) {
        const marca = await require('../models').Marca.findByPk(updates.idMarca);
        if (!marca) {
          return res.status(400).json({
            success: false,
            message: 'La marca especificada no existe'
          });
        }
      }

      // Actualizar campos permitidos
      const allowedFields = [
        'idMarca', 'modelo', 'anio', 'precio', 'km', 'stock',
        'color', 'fotos', 'descripcion', 'activo'
      ];

      const updateData = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          if (field === 'fotos' && typeof updates[field] === 'string') {
            updateData[field] = JSON.parse(updates[field]);
          } else {
            updateData[field] = updates[field];
          }
        }
      }

      await vehicle.update(updateData);

      res.json({
        success: true,
        message: 'Vehículo actualizado exitosamente',
        vehicle
      });

    } catch (error) {
      console.error('Error actualizando vehículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Eliminar vehículo (desactivar)
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de vehículo requerido'
        });
      }

      const vehicle = await Vehiculo.findByPk(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      await vehicle.update({ activo: false });

      res.json({
        success: true,
        message: 'Vehículo eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando vehículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Generar vehículos de ejemplo
  async generateSampleVehicles(req, res) {
    try {
      // Obtener IDs de marcas
      const toyota = await require('../models').Marca.findOne({ where: { nombre: 'Toyota' } });
      const ford = await require('../models').Marca.findOne({ where: { nombre: 'Ford' } });
      const bmw = await require('../models').Marca.findOne({ where: { nombre: 'BMW' } });

      if (!toyota || !ford || !bmw) {
        return res.status(400).json({
          success: false,
          message: 'Marcas no encontradas. Ejecuta los seeders primero.'
        });
      }

      const sampleVehicles = [
        {
          idVehiculo: 'TOY-2024-001',
          idMarca: toyota.id,
          modelo: 'Corolla',
          anio: 2024,
          precio: 2500000,
          km: 0,
          stock: 2,
          color: 'Blanco',
          descripcion: 'Corolla último modelo, cero kilómetros'
        },
        {
          idVehiculo: 'FOR-2023-002',
          idMarca: ford.id,
          modelo: 'Focus',
          anio: 2023,
          precio: 1800000,
          km: 15000,
          stock: 1,
          color: 'Rojo',
          descripcion: 'Focus en excelente estado'
        },
        {
          idVehiculo: 'BMW-2022-003',
          idMarca: bmw.id,
          modelo: 'X3',
          anio: 2022,
          precio: 4500000,
          km: 25000,
          stock: 1,
          color: 'Negro',
          descripcion: 'BMW X3, SUV premium'
        }
      ];

      const createdVehicles = [];
      for (const vehicleData of sampleVehicles) {
        const existing = await Vehiculo.findByPk(vehicleData.idVehiculo);
        if (!existing) {
          const vehicle = await Vehiculo.create(vehicleData);
          createdVehicles.push(vehicle);
        }
      }

      res.json({
        success: true,
        message: `Se crearon ${createdVehicles.length} vehículos de ejemplo`,
        vehicles: createdVehicles
      });

    } catch (error) {
      console.error('Error generando vehículos:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new VehiculosController();