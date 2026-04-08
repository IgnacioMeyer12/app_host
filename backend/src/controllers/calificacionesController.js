const { Calificacion, Cita, Vendedor, Cliente, Sucursal } = require('../models');
const { Op } = require('sequelize');

class CalificacionesController {
  // Crear calificación
  async create(req, res) {
    try {
      const { idCita, puntuacion, comentario } = req.body;
      const dniCliente = req.user.dni;

      // Validaciones
      if (!idCita || !puntuacion) {
        return res.status(400).json({
          success: false,
          message: 'ID de cita y puntuación son obligatorios'
        });
      }

      if (puntuacion < 1 || puntuacion > 5) {
        return res.status(400).json({
          success: false,
          message: 'La puntuación debe estar entre 1 y 5'
        });
      }

      // Verificar que la cita existe y pertenece al cliente
      const cliente = await require('../models').Cliente.findOne({ where: { dni: dniCliente, activo: true } });
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado o inactivo'
        });
      }

      const cita = await Cita.findOne({
        where: {
          id: idCita,
          idCliente: cliente.id
        },
        include: [
          {
            model: Vendedor,
            as: 'vendedor',
            required: true
          }
        ]
      });

      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada o no pertenece al cliente'
        });
      }

      // Verificar que la cita esté finalizada
      if (cita.estado !== 'finalizada') {
        return res.status(400).json({
          success: false,
          message: 'Solo se puede calificar citas finalizadas'
        });
      }

      // Verificar que no exista ya una calificación para esta cita
      const existingCalificacion = await Calificacion.findOne({
        where: { idCita }
      });

      if (existingCalificacion) {
        return res.status(400).json({
          success: false,
          message: 'Esta cita ya ha sido calificada'
        });
      }

      // Crear calificación
      const calificacion = await Calificacion.create({
        idCita,
        idVendedor: cita.idVendedor,
        puntuacion,
        comentario: comentario || null
      });

      // Actualizar promedio y total de calificaciones del vendedor
      const todas = await Calificacion.findAll({ where: { idVendedor: cita.idVendedor } });
      const total = todas.length;
      const promedio = total > 0 ? (todas.reduce((acc, c) => acc + c.puntuacion, 0) / total) : 0;
      await Vendedor.update({
        puntuacionPromedio: Math.round(promedio * 10) / 10,
        totalCalificaciones: total
      }, { where: { id: cita.idVendedor } });

      res.status(201).json({
        success: true,
        message: 'Calificación creada exitosamente',
        calificacion
      });

    } catch (error) {
      console.error('Error creando calificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener calificaciones de un vendedor
  async getByVendedor(req, res) {
    try {
      const { idVendedor } = req.params;

      const calificaciones = await Calificacion.findAll({
        where: { idVendedor },
        include: [
          {
            model: Cita,
            as: 'cita',
            include: [
              {
                model: Cliente,
                as: 'cliente',
                attributes: ['nombre', 'apellido']
              }
            ]
          }
        ],
        order: [['fecha', 'DESC']]
      });

      res.json({
        success: true,
        calificaciones
      });

    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener calificaciones del vendedor logueado (vendedor)
  async getMyCalificaciones(req, res) {
    try {
      const dni = req.user.dni;
      const vendedor = await Vendedor.findOne({ where: { dni, activo: true } });
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: 'Vendedor no encontrado o inactivo'
        });
      }

      const calificaciones = await Calificacion.findAll({
        where: { idVendedor: vendedor.id },
        include: [
          {
            model: Cita,
            as: 'cita',
            include: [
              {
                model: Cliente,
                as: 'cliente',
                attributes: ['nombre', 'apellido']
              }
            ]
          }
        ],
        order: [['fecha', 'DESC']]
      });

      res.json({
        success: true,
        calificaciones
      });

    } catch (error) {
      console.error('Error obteniendo calificaciones del vendedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener ranking de vendedores
  async getRanking(req, res) {
    try {
      const { idSucursal, minCalificaciones = 5 } = req.query;

      let whereCondition = {
        activo: true
      };

      if (idSucursal) {
        whereCondition.idSucursal = idSucursal;
      }

      // Obtener vendedores con sus calificaciones
      const vendedores = await Vendedor.findAll({
        where: whereCondition,
        include: [
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre']
          },
          {
            model: Calificacion,
            as: 'calificaciones',
            required: false
          }
        ]
      });

      // Calcular estadísticas para cada vendedor
      const ranking = vendedores
        .filter(vendedor => vendedor.sucursal)
        .map(vendedor => {
          const calificaciones = vendedor.calificaciones || [];
          const totalCalificaciones = calificaciones.length;
          const promedio = totalCalificaciones > 0
            ? calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0) / totalCalificaciones
            : 0;

          return {
            id: vendedor.id,
            nombre: `${vendedor.nombre} ${vendedor.apellido}`,
            sucursal: vendedor.sucursal ? vendedor.sucursal.nombre : 'Sin sucursal',
            totalCalificaciones,
            promedio: Math.round(promedio * 10) / 10,
            calificaciones: calificaciones.map(cal => ({
              puntuacion: cal.puntuacion,
              comentario: cal.comentario,
              fecha: cal.fecha
            }))
          };
        });

      // Ordenar por promedio de mayor a menor
      const rankingOrdenado = ranking.sort((a, b) => b.promedio - a.promedio);

      const result = rankingOrdenado.map(v => ({
        ...v,
        cumplioMinimo: v.totalCalificaciones >= Number(minCalificaciones)
      }));

      return res.json({
        success: true,
        ranking: result,
        message: result.length === 0 ? 'No hay vendedores para mostrar aún' : 'Ranking cargado correctamente'
      });

    } catch (error) {
      console.error('Error obteniendo ranking:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener calificación de una cita específica
  async getByCita(req, res) {
    try {
      const { idCita } = req.params;
      const dniCliente = req.user.dni;

      // Verificar que la cita pertenece al cliente
      const cita = await Cita.findOne({
        where: {
          id: idCita,
          dni: dniCliente
        }
      });

      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      const calificacion = await Calificacion.findOne({
        where: { idCita },
        include: [
          {
            model: Vendedor,
            as: 'vendedor',
            include: [
              {
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido']
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        calificacion
      });

    } catch (error) {
      console.error('Error obteniendo calificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new CalificacionesController();