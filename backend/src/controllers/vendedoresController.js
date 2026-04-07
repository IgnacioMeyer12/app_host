const { Vendedor, Sucursal, Calificacion, Cliente, Administrador } = require('../models');

class VendedoresController {
// Obtener todos los vendedores
async getAll(req, res) {
  try {
    const vendedoresRaw = await Vendedor.findAll({
      include: [
        {
          model: Sucursal,
          as: 'sucursal',
          attributes: ['id', 'nombre', 'direccion']
        },
        {
          model: Calificacion,
          as: 'calificaciones',
          required: false
        }
      ]
      // Eliminar la línea: where: { activo: true }
    });

    const vendedores = vendedoresRaw.map(vendedor => {
      const calificaciones = vendedor.calificaciones || [];
      const totalCalificaciones = calificaciones.length;
      const promedio = totalCalificaciones > 0
        ? calificaciones.reduce((sum, c) => sum + c.puntuacion, 0) / totalCalificaciones
        : 0;

      return {
        id: vendedor.id,
        dni: vendedor.dni,
        nombre: vendedor.nombre,
        apellido: vendedor.apellido,
        telefono: vendedor.telefono,
        idSucursal: vendedor.idSucursal,
        activo: vendedor.activo,
        fecha_creacion: vendedor.fecha_creacion,
        fecha_actualizacion: vendedor.fecha_actualizacion,
        sucursal: vendedor.sucursal,
        totalCalificaciones,
        puntuacionPromedio: Math.round(promedio * 10) / 10
      };
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

      const vendedoresRaw = await Vendedor.findAll({
        where: {
          idSucursal,
          activo: true
        },
        include: [
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion'],
            required: false
          },
          {
            model: Calificacion,
            as: 'calificaciones',
            required: false
          }
        ]
      });

      const vendedores = vendedoresRaw.map(vendedor => {
        const calificaciones = vendedor.calificaciones || [];
        const totalCalificaciones = calificaciones.length;
        const promedio = totalCalificaciones > 0
          ? calificaciones.reduce((sum, c) => sum + c.puntuacion, 0) / totalCalificaciones
          : 0;

        return {
          id: vendedor.id,
          dni: vendedor.dni,
          nombre: vendedor.nombre,
          apellido: vendedor.apellido,
          telefono: vendedor.telefono,
          idSucursal: vendedor.idSucursal,
          activo: vendedor.activo,
          sucursal: vendedor.sucursal,
          totalCalificaciones,
          puntuacionPromedio: Math.round(promedio * 10) / 10
        };
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
      const { dni, idSucursal, nombre, apellido, telefono } = req.body;

      // Validaciones
      if (!dni || !idSucursal) {
        return res.status(400).json({
          success: false,
          message: 'DNI e ID de sucursal son obligatorios'
        });
      }

      if (!nombre || !apellido || !telefono) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, apellido y teléfono son obligatorios'
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

      // Verificar que el usuario está registrado como cliente o administrador (si aplica)
      const existingCliente = await Cliente.findOne({ where: { dni } });
      const existingAdmin = await Administrador.findOne({ where: { dni } });
      if (!existingCliente && !existingAdmin) {
        return res.status(404).json({
          success: false,
          message: 'El usuario no está registrado en el sistema'
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

      // Crear vendedor
      const vendedor = await Vendedor.create({
        dni,
        idSucursal,
        nombre,
        apellido,
        telefono,
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
      const { idSucursal, activo, nombre, apellido, telefono } = req.body;

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

      if (nombre !== undefined) {
        vendedor.nombre = nombre;
      }
      if (apellido !== undefined) {
        vendedor.apellido = apellido;
      }
      if (telefono !== undefined) {
        vendedor.telefono = telefono;
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