const { Sucursal } = require('../models');

class SucursalesController {
  // Obtener todas las sucursales activas
  async getAll(req, res) {
    try {
      const sucursales = await Sucursal.findAll({
        where: { activa: true },
        order: [['nombre', 'ASC']]
      });

      res.json({
        success: true,
        sucursales
      });

    } catch (error) {
      console.error('Error obteniendo sucursales:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener todas las sucursales (admin)
  async getAllAdmin(req, res) {
    try {
      const sucursales = await Sucursal.findAll({
        order: [['nombre', 'ASC']]
      });

      res.json({
        success: true,
        sucursales
      });

    } catch (error) {
      console.error('Error obteniendo sucursales:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Crear sucursal
  async create(req, res) {
    try {
      const { nombre, direccion, telefono, latitud, longitud } = req.body;

      // Validaciones
      if (!nombre || !latitud || !longitud) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, latitud y longitud son obligatorios'
        });
      }

      // Validar coordenadas
      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          message: 'Latitud inválida'
        });
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Longitud inválida'
        });
      }

      // Crear sucursal
      const newSucursal = await Sucursal.create({
        nombre,
        direccion,
        telefono,
        latitud: lat,
        longitud: lng
      });

      res.status(201).json({
        success: true,
        message: 'Sucursal creada exitosamente',
        sucursal: newSucursal
      });

    } catch (error) {
      console.error('Error creando sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Actualizar sucursal
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de sucursal inválido'
        });
      }

      const sucursal = await Sucursal.findByPk(id);
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      // Validar coordenadas si se actualizan
      if (updates.latitud !== undefined) {
        const lat = parseFloat(updates.latitud);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return res.status(400).json({
            success: false,
            message: 'Latitud inválida'
          });
        }
        updates.latitud = lat;
      }

      if (updates.longitud !== undefined) {
        const lng = parseFloat(updates.longitud);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return res.status(400).json({
            success: false,
            message: 'Longitud inválida'
          });
        }
        updates.longitud = lng;
      }

      // Actualizar campos permitidos
      const allowedFields = ['nombre', 'direccion', 'telefono', 'latitud', 'longitud', 'activa'];
      const updateData = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      await sucursal.update(updateData);

      res.json({
        success: true,
        message: 'Sucursal actualizada exitosamente',
        sucursal
      });

    } catch (error) {
      console.error('Error actualizando sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Eliminar sucursal
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de sucursal inválido'
        });
      }

      const sucursal = await Sucursal.findByPk(id);
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      await sucursal.destroy();

      res.json({
        success: true,
        message: 'Sucursal eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new SucursalesController();