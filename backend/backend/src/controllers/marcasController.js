const { Marca } = require('../models');

class MarcasController {
  // Obtener todas las marcas activas
  async getAll(req, res) {
    try {
      const marcas = await Marca.findAll({
        where: { activa: true },
        order: [['nombre', 'ASC']]
      });

      res.json({
        success: true,
        marcas
      });

    } catch (error) {
      console.error('Error obteniendo marcas:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener todas las marcas (admin)
  async getAllAdmin(req, res) {
    try {
      const marcas = await Marca.findAll({
        order: [['nombre', 'ASC']]
      });

      res.json({
        success: true,
        marcas
      });

    } catch (error) {
      console.error('Error obteniendo marcas:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Crear marca
  async create(req, res) {
    try {
      const { nombre, descripcion } = req.body;

      // Validaciones
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la marca es obligatorio'
        });
      }

      // Verificar si la marca ya existe
      const existingMarca = await Marca.findOne({ where: { nombre } });
      if (existingMarca) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una marca con ese nombre'
        });
      }

      // Crear marca
      const newMarca = await Marca.create({
        nombre,
        descripcion
      });

      res.status(201).json({
        success: true,
        message: 'Marca creada exitosamente',
        marca: newMarca
      });

    } catch (error) {
      console.error('Error creando marca:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Actualizar marca
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de marca inválido'
        });
      }

      const marca = await Marca.findByPk(id);
      if (!marca) {
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      // Verificar nombre único si se está actualizando
      if (updates.nombre) {
        const existingMarca = await Marca.findOne({
          where: { nombre: updates.nombre, id: { [require('sequelize').Op.ne]: id } }
        });
        if (existingMarca) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otra marca con ese nombre'
          });
        }
      }

      // Actualizar campos permitidos
      const allowedFields = ['nombre', 'descripcion', 'activa'];
      const updateData = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      await marca.update(updateData);

      res.json({
        success: true,
        message: 'Marca actualizada exitosamente',
        marca
      });

    } catch (error) {
      console.error('Error actualizando marca:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Eliminar marca (desactivar)
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de marca inválido'
        });
      }

      const marca = await Marca.findByPk(id);
      if (!marca) {
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      // Verificar si tiene vehículos asociados
      const vehiculosCount = await marca.countVehiculos();
      if (vehiculosCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la marca porque tiene vehículos asociados'
        });
      }

      await marca.update({ activa: false });

      res.json({
        success: true,
        message: 'Marca eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando marca:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new MarcasController();