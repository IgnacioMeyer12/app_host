const { Vendedor, Usuario, Sucursal } = require('../models');

class VendedoresController {
  // Obtener todos los vendedores
  async getAll(req, res) {
    try {
      const vendedores = await Vendedor.findAll({
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['dni', 'nombre', 'apellido', 'telefono']
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion']
          }
        ],
        where: { activo: true }
      });

      res.json({
        success: true,
        vendedores
      });
    } catch (error) {
      console.error('Error obteniendo vendedores:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener vendedores por sucursal
  async getBySucursal(req, res) {
    try {
      const { idSucursal } = req.params;

      const vendedores = await Vendedor.findAll({
        where: {
          idSucursal,
          activo: true
        },
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['dni', 'nombre', 'apellido', 'telefono']
          }
        ]
      });

      res.json({
        success: true,
        vendedores
      });
    } catch (error) {
      console.error('Error obteniendo vendedores por sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Crear vendedor
  async create(req, res) {
    try {
      const { dni, idSucursal } = req.body;

      // Validaciones
      if (!dni || !idSucursal) {
        return res.status(400).json({
          success: false,
          message: 'DNI e ID de sucursal son obligatorios'
        });
      }

      // Verificar que el usuario existe y es vendedor
      const usuario = await Usuario.findByPk(dni);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (usuario.rol !== 'vendedor') {
        return res.status(400).json({
          success: false,
          message: 'El usuario debe tener rol de vendedor'
        });
      }

      // Verificar que la sucursal existe
      const sucursal = await Sucursal.findByPk(idSucursal);
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      // Verificar que no existe ya como vendedor
      const existingVendedor = await Vendedor.findOne({ where: { dni } });
      if (existingVendedor) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya es vendedor'
        });
      }

      // Crear vendedor
      const vendedor = await Vendedor.create({
        dni,
        idSucursal,
        activo: true
      });

      res.status(201).json({
        success: true,
        message: 'Vendedor creado exitosamente',
        vendedor
      });

    } catch (error) {
      console.error('Error creando vendedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Actualizar vendedor
  async update(req, res) {
    try {
      const { id } = req.params;
      const { idSucursal, activo } = req.body;

      const vendedor = await Vendedor.findByPk(id);
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: 'Vendedor no encontrado'
        });
      }

      // Actualizar campos
      if (idSucursal !== undefined) {
        const sucursal = await Sucursal.findByPk(idSucursal);
        if (!sucursal) {
          return res.status(404).json({
            success: false,
            message: 'Sucursal no encontrada'
          });
        }
        vendedor.idSucursal = idSucursal;
      }

      if (activo !== undefined) {
        vendedor.activo = activo;
      }

      await vendedor.save();

      res.json({
        success: true,
        message: 'Vendedor actualizado exitosamente',
        vendedor
      });

    } catch (error) {
      console.error('Error actualizando vendedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Eliminar vendedor (desactivar)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const vendedor = await Vendedor.findByPk(id);
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: 'Vendedor no encontrado'
        });
      }

      vendedor.activo = false;
      await vendedor.save();

      res.json({
        success: true,
        message: 'Vendedor desactivado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando vendedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new VendedoresController();