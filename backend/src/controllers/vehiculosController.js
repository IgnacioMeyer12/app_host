const { Vehiculo } = require('../models');

function formatVehicle(vehicle) {
  if (!vehicle) return vehicle;
  const obj = vehicle.toJSON ? vehicle.toJSON() : { ...vehicle };
  if (obj.fotos && typeof obj.fotos === 'string') {
    try {
      obj.fotos = JSON.parse(obj.fotos);
    } catch (err) {
      obj.fotos = [];
    }
  }
  if (!Array.isArray(obj.fotos)) {
    obj.fotos = obj.fotos ? [obj.fotos] : [];
  }
  return obj;
}

class VehiculosController {
  // Crear vehículo
  async create(req, res) {
    try {
      const {
        idMarca,
        idSucursal,
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
      if (!idMarca || !modelo || !anio || !precio || km === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Campos obligatorios: idMarca, modelo, anio, precio, km'
        });
      }

      if (idSucursal !== undefined && idSucursal !== null && idSucursal !== '') {
        const sucursal = await require('../models').Sucursal.findByPk(idSucursal);
        if (!sucursal) {
          return res.status(400).json({
            success: false,
            message: 'La sucursal especificada no existe'
          });
        }
      }

      // Verificar que la marca existe
      const marca = await require('../models').Marca.findByPk(idMarca);
      if (!marca) {
        return res.status(400).json({
          success: false,
          message: 'La marca especificada no existe'
        });
      }

      // Procesar fotos
      let fotosArray = null;
      if (fotos !== undefined && fotos !== null) {
        if (Array.isArray(fotos)) {
          fotosArray = fotos;
        } else if (typeof fotos === 'string' && fotos.trim() !== '') {
          try {
            fotosArray = JSON.parse(fotos);
          } catch (parseError) {
            return res.status(400).json({
              success: false,
              message: 'Formato de fotos inválido, debe ser JSON válido o arreglo'
            });
          }
          if (!Array.isArray(fotosArray)) {
            return res.status(400).json({
              success: false,
              message: 'Formato de fotos inválido, se requiere un arreglo'
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: 'Formato de fotos inválido, debe ser un arreglo o JSON'
          });
        }
      }

      // Crear vehículo
      const newVehicle = await Vehiculo.create({
        idMarca,
        idSucursal: idSucursal || null,
        modelo,
        anio: parseInt(anio),
        precio: parseFloat(precio),
        km: parseInt(km),
        stock: stock ? parseInt(stock) : 1,
        color,
        fotos: fotosArray,
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
      const {
        marca,
        modelo,
        precioMin,
        precioMax,
        anioMin,
        anioMax,
        kmMin,
        kmMax,
        color,
        sucursal,
        idSucursal,
        sucursalTestdrive,
        vendedor,
        tieneCitas,
        tieneConversaciones,
        sortBy = 'fecha_creacion',
        sortOrder = 'DESC'
      } = req.query;

      // Construir condiciones de búsqueda
      const whereConditions = {
        activo: true
      };

      // Filtro por marca
      if (marca) {
        const marcaRecord = await require('../models').Marca.findOne({
          where: { nombre: { [require('sequelize').Op.iLike]: `%${marca}%` } }
        });
        if (marcaRecord) {
          whereConditions.idMarca = marcaRecord.id;
        }
      }

      // Filtro por modelo
      if (modelo) {
        whereConditions.modelo = { [require('sequelize').Op.like]: `%${modelo}%` };
      }

      // Filtros de precio
      if (precioMin || precioMax) {
        whereConditions.precio = {};
        if (precioMin) whereConditions.precio[require('sequelize').Op.gte] = parseFloat(precioMin);
        if (precioMax) whereConditions.precio[require('sequelize').Op.lte] = parseFloat(precioMax);
      }

      // Filtros de año
      if (anioMin || anioMax) {
        whereConditions.anio = {};
        if (anioMin) whereConditions.anio[require('sequelize').Op.gte] = parseInt(anioMin);
        if (anioMax) whereConditions.anio[require('sequelize').Op.lte] = parseInt(anioMax);
      }

      // Filtros de kilometraje
      if (kmMin || kmMax) {
        whereConditions.km = {};
        if (kmMin) whereConditions.km[require('sequelize').Op.gte] = parseInt(kmMin);
        if (kmMax) whereConditions.km[require('sequelize').Op.lte] = parseInt(kmMax);
      }

      // Filtro por color
      if (color) {
        whereConditions.color = { [require('sequelize').Op.like]: `%${color}%` };
      }

      // Filtro por sucursal
      if (idSucursal) {
        whereConditions.idSucursal = parseInt(idSucursal);
      } else if (sucursal) {
        const { Sucursal } = require('../models');
        const sucursalRecord = await Sucursal.findOne({
          where: { nombre: { [require('sequelize').Op.iLike]: `%${sucursal}%` } }
        });

        if (sucursalRecord) {
          whereConditions.idSucursal = sucursalRecord.id;
        }
      }

      // Construir opciones de consulta
      const queryOptions = {
        where: whereConditions,
        include: [
          {
            model: require('../models').Marca,
            as: 'marca',
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: require('../models').Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion'],
            where: { activa: true },
            required: true
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]]
      };

      // Filtros adicionales que requieren joins complejos
      let vehicleIds = null;

      // Filtro por vendedor (vehículos que tienen citas con este vendedor)
      if (vendedor) {
        const { Cita, Vendedor } = require('../models');
        const vendedorRecord = await Vendedor.findOne({
          where: { dni: vendedor }
        });

        if (vendedorRecord) {
          const citasVendedor = await Cita.findAll({
            where: { idVendedor: vendedorRecord.id },
            attributes: ['idVehiculo']
          });
          const idsFromVendedor = [...new Set(citasVendedor.map(c => c.idVehiculo))];
          vehicleIds = idsFromVendedor;
        }
      }

      // Filtro por vehículos que tienen citas
      if (tieneCitas === 'true') {
        const { Cita } = require('../models');
        const citas = await Cita.findAll({
          attributes: ['idVehiculo']
        });
        const idsFromCitas = [...new Set(citas.map(c => c.idVehiculo))];
        vehicleIds = vehicleIds ? vehicleIds.filter(id => idsFromCitas.includes(id)) : idsFromCitas;
      }

      // Filtro por vehículos que tienen conversaciones
      if (tieneConversaciones === 'true') {
        const { Conversacion, Cita } = require('../models');
        const conversaciones = await Conversacion.findAll({
          include: [{
            model: Cita,
            as: 'cita',
            attributes: ['idVehiculo']
          }],
          attributes: []
        });
        const idsFromConversaciones = [...new Set(conversaciones.map(c => c.cita?.idVehiculo).filter(id => id))];
        vehicleIds = vehicleIds ? vehicleIds.filter(id => idsFromConversaciones.includes(id)) : idsFromConversaciones;
      }

      // Aplicar filtro de IDs si existen
      if (vehicleIds && vehicleIds.length > 0) {
        queryOptions.where.idVehiculo = { [require('sequelize').Op.in]: vehicleIds };
      } else if (vehicleIds && vehicleIds.length === 0) {
        // Si no hay vehículos que cumplan los criterios, devolver array vacío
        return res.json({
          success: true,
          vehiculos: []
        });
      }

      // Filtro por sucursales con testdrive
      if (sucursalTestdrive === 'true') {
        const { Sucursal, Cita, Vendedor } = require('../models');

        // Obtener sucursales con testdrive
        const sucursalesConTestdrive = await Sucursal.findAll({
          where: { testdrive: true, activa: true },
          attributes: ['id']
        });

        if (sucursalesConTestdrive.length === 0) {
          return res.json({
            success: true,
            vehiculos: [],
            message: 'No hay sucursales con servicio de test drive disponible'
          });
        }

        const sucursalIds = sucursalesConTestdrive.map(s => s.id);

        // Obtener vendedores de esas sucursales
        const vendedoresSucursales = await Vendedor.findAll({
          where: {
            idSucursal: { [require('sequelize').Op.in]: sucursalIds },
            activo: true
          },
          attributes: ['id']
        });

        if (vendedoresSucursales.length === 0) {
          return res.json({
            success: true,
            vehiculos: [],
            message: 'No hay vendedores disponibles para test drive'
          });
        }

        const vendedorIds = vendedoresSucursales.map(v => v.id);

        // Obtener citas con esos vendedores
        const citasTestdrive = await Cita.findAll({
          where: {
            idVendedor: { [require('sequelize').Op.in]: vendedorIds },
            tipo: 'testdrive'
          },
          attributes: ['idVehiculo']
        });

        const idsFromTestdrive = [...new Set(citasTestdrive.map(c => c.idVehiculo))];
        vehicleIds = vehicleIds ? vehicleIds.filter(id => idsFromTestdrive.includes(id)) : idsFromTestdrive;

        if (vehicleIds && vehicleIds.length === 0) {
          return res.json({
            success: true,
            vehiculos: [],
            message: 'No hay vehículos disponibles para test drive'
          });
        }

        if (vehicleIds) {
          queryOptions.where.idVehiculo = { [require('sequelize').Op.in]: vehicleIds };
        }
      }

      const vehicles = await Vehiculo.findAll(queryOptions);

      const formatted = vehicles.map(v => formatVehicle(v));

      res.json({
        success: true,
        vehiculos: formatted
      });

    } catch (error) {
      console.error('Error obteniendo vehículos:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener vehículos por sucursal
  async getBySucursal(req, res) {
    try {
      const { id } = req.params;

      const vehicles = await Vehiculo.findAll({
        where: { idSucursal: id },
        include: [
          {
            model: require('../models').Marca,
            as: 'marca',
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: require('../models').Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion']
          }
        ],
        order: [['fecha_creacion', 'DESC']]
      });

      const formatted = vehicles.map(v => formatVehicle(v));
      res.json({
        success: true,
        vehicles: formatted
      });

    } catch (error) {
      console.error('Error obteniendo vehículos por sucursal:', error);
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
          },
          {
            model: require('../models').Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion']
          }
        ],
        order: [['fecha_creacion', 'DESC']]
      });

      const formatted = vehicles.map(v => formatVehicle(v));
      res.json({
        success: true,
        vehiculos: formatted
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

      // Validar idSucursal si se está actualizando
      if (updates.idSucursal !== undefined && updates.idSucursal !== null) {
        const sucursal = await require('../models').Sucursal.findByPk(updates.idSucursal);
        if (!sucursal) {
          return res.status(400).json({
            success: false,
            message: 'La sucursal especificada no existe'
          });
        }
      }

      // Actualizar campos permitidos
      const allowedFields = [
        'idMarca', 'idSucursal', 'modelo', 'anio', 'precio', 'km', 'stock',
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

  // Búsqueda avanzada de vehículos con filtros mejorados
  async search(req, res) {
    try {
      const {
        marca,
        modelo,
        precioMin,
        precioMax,
        anioMin,
        anioMax,
        kmMin,
        kmMax,
        color,
        sucursal,
        idSucursal,
        sucursalTestdrive,
        vendedor,
        tieneCitas,
        tieneConversaciones,
        sortBy = 'fecha_creacion',
        sortOrder = 'DESC',
        limit = 50,
        offset = 0
      } = req.query;

      // Construir condiciones de búsqueda
      const whereConditions = {
        activo: true
      };

      // Filtro por marca
      if (marca) {
        const marcaRecord = await require('../models').Marca.findOne({
          where: { nombre: { [require('sequelize').Op.iLike]: `%${marca}%` } }
        });
        if (marcaRecord) {
          whereConditions.idMarca = marcaRecord.id;
        }
      }

      // Filtro por modelo
      if (modelo) {
        whereConditions.modelo = { [require('sequelize').Op.like]: `%${modelo}%` };
      }

      // Filtros de precio
      if (precioMin || precioMax) {
        whereConditions.precio = {};
        if (precioMin) whereConditions.precio[require('sequelize').Op.gte] = parseFloat(precioMin);
        if (precioMax) whereConditions.precio[require('sequelize').Op.lte] = parseFloat(precioMax);
      }

      // Filtros de año
      if (anioMin || anioMax) {
        whereConditions.anio = {};
        if (anioMin) whereConditions.anio[require('sequelize').Op.gte] = parseInt(anioMin);
        if (anioMax) whereConditions.anio[require('sequelize').Op.lte] = parseInt(anioMax);
      }

      // Filtros de kilometraje
      if (kmMin || kmMax) {
        whereConditions.km = {};
        if (kmMin) whereConditions.km[require('sequelize').Op.gte] = parseInt(kmMin);
        if (kmMax) whereConditions.km[require('sequelize').Op.lte] = parseInt(kmMax);
      }

      // Filtro por color
      if (color) {
        whereConditions.color = { [require('sequelize').Op.like]: `%${color}%` };
      }

      // Filtro por sucursal
      if (idSucursal) {
        whereConditions.idSucursal = parseInt(idSucursal);
      } else if (sucursal) {
        const { Sucursal } = require('../models');
        const sucursalRecord = await Sucursal.findOne({
          where: { nombre: { [require('sequelize').Op.iLike]: `%${sucursal}%` } }
        });

        if (sucursalRecord) {
          whereConditions.idSucursal = sucursalRecord.id;
        } else {
          // Si no hay sucursal que coincida, devolvemos vacío directamente
          return res.json({
            success: true,
            vehicles: [],
            total: 0,
            pagination: { limit: parseInt(limit), offset: parseInt(offset), hasMore: false },
            filters: req.query
          });
        }
      }

      // Construir opciones de consulta base
      const queryOptions = {
        where: whereConditions,
        include: [
          {
            model: require('../models').Marca,
            as: 'marca',
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: require('../models').Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion'],
            where: { activa: true },
            required: true
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      // Filtros adicionales que requieren joins complejos
      let vehicleIds = null;

      // Filtro por vendedor (vehículos que tienen citas con este vendedor)
      if (vendedor) {
        const { Cita, Vendedor } = require('../models');
        const vendedorRecord = await Vendedor.findOne({
          where: { dni: vendedor }
        });

        if (vendedorRecord) {
          const citasVendedor = await Cita.findAll({
            where: { idVendedor: vendedorRecord.id },
            attributes: ['idVehiculo']
          });
          const idsFromVendedor = [...new Set(citasVendedor.map(c => c.idVehiculo))];
          vehicleIds = vehicleIds ? vehicleIds.filter(id => idsFromVendedor.includes(id)) : idsFromVendedor;
        }
      }

      // Filtro por vehículos que tienen citas
      if (tieneCitas === 'true') {
        const { Cita } = require('../models');
        const citas = await Cita.findAll({
          attributes: ['idVehiculo']
        });
        const idsFromCitas = [...new Set(citas.map(c => c.idVehiculo))];
        vehicleIds = vehicleIds ? vehicleIds.filter(id => idsFromCitas.includes(id)) : idsFromCitas;
      }

      // Filtro por vehículos que tienen conversaciones
      if (tieneConversaciones === 'true') {
        const { Conversacion, Cita } = require('../models');
        const conversaciones = await Conversacion.findAll({
          include: [{
            model: Cita,
            as: 'cita',
            attributes: ['idVehiculo']
          }],
          attributes: []
        });
        const idsFromConversaciones = [...new Set(conversaciones.map(c => c.cita?.idVehiculo).filter(id => id))];
        vehicleIds = vehicleIds ? vehicleIds.filter(id => idsFromConversaciones.includes(id)) : idsFromConversaciones;
      }

      // Aplicar filtro de IDs si existen
      if (vehicleIds && vehicleIds.length > 0) {
        queryOptions.where.idVehiculo = { [require('sequelize').Op.in]: vehicleIds };
      } else if (vehicleIds && vehicleIds.length === 0) {
        // Si no hay vehículos que cumplan los criterios, devolver array vacío
        return res.json({
          success: true,
          vehicles: [],
          total: 0,
          filters: req.query
        });
      }

      // Filtro por sucursales con testdrive
      if (sucursalTestdrive === 'true') {
        const { Sucursal, Cita, Vendedor } = require('../models');

        // Obtener sucursales con testdrive
        const sucursalesConTestdrive = await Sucursal.findAll({
          where: { testdrive: true, activa: true },
          attributes: ['id']
        });

        if (sucursalesConTestdrive.length === 0) {
          return res.json({
            success: true,
            vehicles: [],
            message: 'No hay sucursales con servicio de test drive disponible',
            total: 0,
            filters: req.query
          });
        }

        const sucursalIds = sucursalesConTestdrive.map(s => s.id);

        // Obtener vendedores de esas sucursales
        const vendedoresSucursales = await Vendedor.findAll({
          where: {
            idSucursal: { [require('sequelize').Op.in]: sucursalIds },
            activo: true
          },
          attributes: ['id']
        });

        if (vendedoresSucursales.length === 0) {
          return res.json({
            success: true,
            vehicles: [],
            message: 'No hay vendedores activos en sucursales con test drive',
            total: 0,
            filters: req.query
          });
        }

        const vendedorIds = vendedoresSucursales.map(v => v.id);

        // Obtener citas de esos vendedores
        const citasTestdrive = await Cita.findAll({
          where: {
            idVendedor: { [require('sequelize').Op.in]: vendedorIds }
          },
          attributes: ['idVehiculo']
        });

        const vehicleIdsTestdrive = [...new Set(citasTestdrive.map(c => c.idVehiculo))];

        if (vehicleIdsTestdrive.length === 0) {
          return res.json({
            success: true,
            vehicles: [],
            message: 'No hay vehículos disponibles para test drive en este momento',
            total: 0,
            filters: req.query
          });
        }

        // Combinar con otros filtros de IDs
        if (queryOptions.where.idVehiculo) {
          const existingIds = queryOptions.where.idVehiculo[require('sequelize').Op.in];
          queryOptions.where.idVehiculo[require('sequelize').Op.in] =
            existingIds.filter(id => vehicleIdsTestdrive.includes(id));
        } else {
          queryOptions.where.idVehiculo = { [require('sequelize').Op.in]: vehicleIdsTestdrive };
        }
      }

      // Obtener total para paginación
      const totalQuery = { ...queryOptions };
      delete totalQuery.limit;
      delete totalQuery.offset;
      delete totalQuery.order;
      const total = await Vehiculo.count(totalQuery);

      // Obtener vehículos
      const vehicles = await Vehiculo.findAll(queryOptions);
      const formatted = vehicles.map(v => formatVehicle(v));

      res.json({
        success: true,
        vehicles: formatted,
        total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        filters: req.query
      });

    } catch (error) {
      console.error('Error en búsqueda avanzada de vehículos:', error);
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
      console.log('Intentando eliminar vehículo con ID:', id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de vehículo requerido'
        });
      }

      const vehicle = await Vehiculo.findByPk(id);
      if (!vehicle) {
        console.log('Vehículo no encontrado con ID:', id);
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      console.log('Vehículo encontrado:', vehicle.idVehiculo, vehicle.modelo);
      await vehicle.update({ activo: false });
      console.log('Vehículo marcado como inactivo');

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