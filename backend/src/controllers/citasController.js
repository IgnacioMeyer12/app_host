const { Cita, Usuario, Vehiculo, Vendedor, Sucursal } = require('../models');
const { Op } = require('sequelize');

class CitasController {
  // Crear cita
  async create(req, res) {
    try {
      const { idVehiculo, fecha_hora, motivo, idSucursal, idVendedor } = req.body;
      const dni = req.user.dni; // Del token JWT

      // Validaciones
      if (!fecha_hora || !motivo || !idSucursal || !idVendedor) {
        return res.status(400).json({
          success: false,
          message: 'Fecha/hora, motivo, sucursal y vendedor son obligatorios'
        });
      }

      // Verificar que el usuario existe
      const user = await Usuario.findByPk(dni);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
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

      // Verificar que el vendedor existe, está activo y pertenece a la sucursal
      const vendedor = await Vendedor.findOne({
        where: {
          id: idVendedor,
          idSucursal,
          activo: true
        }
      });
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: 'Vendedor no encontrado o no disponible en esta sucursal'
        });
      }

      // Si se especifica vehículo, verificar que existe
      if (idVehiculo) {
        const vehicle = await Vehiculo.findByPk(idVehiculo);
        if (!vehicle) {
          return res.status(404).json({
            success: false,
            message: 'Vehículo no encontrado'
          });
        }
      }

      // Verificar que la fecha no esté en el pasado
      const appointmentDate = new Date(fecha_hora);
      if (appointmentDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de la cita debe ser futura'
        });
      }

      // Verificar que el vendedor no tenga otra cita en el mismo horario
      const conflictingCita = await Cita.findOne({
        where: {
          idVendedor,
          fecha_hora: appointmentDate,
          estado: {
            [Op.ne]: 'cancelada'
          }
        }
      });

      if (conflictingCita) {
        return res.status(400).json({
          success: false,
          message: 'El vendedor ya tiene una cita programada en este horario'
        });
      }

      // Crear cita
      const newCita = await Cita.create({
        dni,
        idVehiculo,
        fecha_hora: appointmentDate,
        motivo,
        idVendedor,
        estado: 'pendiente'
      });

      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        cita: newCita
      });

    } catch (error) {
      console.error('Error creando cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener citas del usuario
  async getUserCitas(req, res) {
    try {
      const dni = req.user.dni;

      const citas = await Cita.findAll({
        where: { dni },
        include: [
          {
            model: Vehiculo,
            as: 'vehiculo',
            required: false
          },
          {
            model: Vendedor,
            as: 'vendedor',
            required: false,
            include: [
              {
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido']
              },
              {
                model: Sucursal,
                as: 'sucursal',
                attributes: ['id', 'nombre']
              }
            ]
          }
        ],
        order: [['fecha_hora', 'DESC']]
      });

      res.json({
        success: true,
        citas
      });

    } catch (error) {
      console.error('Error obteniendo citas:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener todas las citas (admin)
  async getAllCitas(req, res) {
    try {
      const citas = await Cita.findAll({
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['dni', 'nombre', 'apellido', 'telefono'],
            required: false
          },
          {
            model: Vehiculo,
            as: 'vehiculo',
            required: false
          }
        ],
        order: [['fecha_hora', 'DESC']]
      });

      res.json({
        success: true,
        citas
      });

    } catch (error) {
      console.error('Error obteniendo citas:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Verificar disponibilidad de horarios
  async checkAvailability(req, res) {
    try {
      const { fecha } = req.query;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: 'Fecha requerida'
        });
      }

      // Obtener todas las citas para esa fecha
      const startDate = new Date(fecha + ' 00:00:00');
      const endDate = new Date(fecha + ' 23:59:59');

      const existingCitas = await Cita.findAll({
        where: {
          fecha_hora: {
            [Op.between]: [startDate, endDate]
          },
          estado: {
            [Op.in]: ['pendiente', 'aceptada']
          }
        },
        attributes: ['fecha_hora']
      });

      // Horarios disponibles (9:00 a 18:00)
      const availableSlots = [];
      for (let hour = 9; hour < 18; hour++) {
        const slotTime = new Date(fecha + ` ${hour.toString().padStart(2, '0')}:00:00`);
        const isTaken = existingCitas.some(cita => {
          const citaTime = new Date(cita.fecha_hora);
          return citaTime.getHours() === hour;
        });

        if (!isTaken && slotTime > new Date()) {
          availableSlots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: true
          });
        }
      }

      res.json({
        success: true,
        date: fecha,
        availableSlots
      });

    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Actualizar cita (admin)
  async update(req, res) {
    try {
      const { id } = req.params;
      const { estado, admin_message } = req.body;
      const admin_dni = req.user.dni;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de cita requerido'
        });
      }

      const cita = await Cita.findByPk(id);
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      const updateData = {
        estado: estado || cita.estado,
        admin_dni,
        admin_message: admin_message || cita.admin_message,
        actualizado_en: new Date()
      };

      await cita.update(updateData);

      res.json({
        success: true,
        message: 'Cita actualizada exitosamente',
        cita
      });

    } catch (error) {
      console.error('Error actualizando cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Confirmar cita (admin)
  async confirmarCita(req, res) {
    try {
      const { id } = req.params;
      const admin_dni = req.user.dni;

      const cita = await Cita.findByPk(id);
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      if (cita.estado !== 'pendiente') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden confirmar citas pendientes'
        });
      }

      await cita.update({
        estado: 'confirmada',
        admin_dni,
        actualizado_en: new Date()
      });

      res.json({
        success: true,
        message: 'Cita confirmada exitosamente'
      });

    } catch (error) {
      console.error('Error confirmando cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Cancelar cita (admin)
  async cancelarCita(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const admin_dni = req.user.dni;

      const cita = await Cita.findByPk(id);
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      if (cita.estado === 'cancelada' || cita.estado === 'finalizada') {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar una cita ya finalizada o cancelada'
        });
      }

      await cita.update({
        estado: 'cancelada',
        admin_dni,
        admin_message: motivo || 'Cancelada por administrador',
        actualizado_en: new Date()
      });

      res.json({
        success: true,
        message: 'Cita cancelada exitosamente'
      });

    } catch (error) {
      console.error('Error cancelando cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Finalizar cita manualmente (admin)
  async finalizarCita(req, res) {
    try {
      const { id } = req.params;
      const admin_dni = req.user.dni;

      const cita = await Cita.findByPk(id);
      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      if (cita.estado !== 'confirmada') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden finalizar citas confirmadas'
        });
      }

      await cita.update({
        estado: 'finalizada',
        admin_dni,
        actualizado_en: new Date()
      });

      res.json({
        success: true,
        message: 'Cita finalizada exitosamente'
      });

    } catch (error) {
      console.error('Error finalizando cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Finalizar citas automáticamente (método para cron job)
  async finalizarCitasAutomaticamente() {
    try {
      const ahora = new Date();
      const unaHoraAtras = new Date(ahora.getTime() - (60 * 60 * 1000)); // 1 hora atrás

      // Buscar citas confirmadas que ya pasaron hace más de 1 hora
      const citasPorFinalizar = await Cita.findAll({
        where: {
          estado: 'confirmada',
          fecha_hora: {
            [Op.lt]: unaHoraAtras
          }
        }
      });

      if (citasPorFinalizar.length > 0) {
        console.log(`Finalizando ${citasPorFinalizar.length} citas automáticamente...`);

        for (const cita of citasPorFinalizar) {
          await cita.update({
            estado: 'finalizada',
            actualizado_en: new Date()
          });
        }

        console.log('✅ Citas finalizadas automáticamente');
      }

      return citasPorFinalizar.length;

    } catch (error) {
      console.error('Error finalizando citas automáticamente:', error);
      throw error;
    }
  }

}

module.exports = new CitasController();