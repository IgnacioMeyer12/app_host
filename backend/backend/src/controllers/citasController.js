const { Cita, Vehiculo, Vendedor, Sucursal, Calificacion, Cliente, Administrador, Conversacion, Marca } = require('../models');
const { Op } = require('sequelize');

function normalizeVehicle(vehiculo) {
  if (!vehiculo) return vehiculo;
  const vehicle = vehiculo.toJSON ? vehiculo.toJSON() : { ...vehiculo };
  if (vehicle.fotos && typeof vehicle.fotos === 'string') {
    try {
      vehicle.fotos = JSON.parse(vehicle.fotos);
    } catch {
      vehicle.fotos = [];
    }
  }
  if (!Array.isArray(vehicle.fotos)) {
    vehicle.fotos = vehicle.fotos ? [vehicle.fotos] : [];
  }
  return vehicle;
}

async function enrichCitaRelations(item) {
  if (!item) return item;
  const cita = item.toJSON ? item.toJSON() : { ...item };

  if (!cita.vendedor && cita.idVendedor) {
    const vendedor = await Vendedor.findByPk(cita.idVendedor, {
      include: [
        {
          model: Sucursal,
          as: 'sucursal',
          attributes: ['id', 'nombre', 'direccion', 'telefono', 'horario_inicio', 'horario_fin'],
          required: false
        }
      ]
    });
    if (vendedor) cita.vendedor = vendedor.toJSON();
  }

  if (!cita.administrador && cita.idAdministrador) {
    const administrador = await Administrador.findByPk(cita.idAdministrador);
    if (administrador) cita.administrador = administrador.toJSON();
  }

  if (!cita.cliente && cita.idCliente) {
    const cliente = await Cliente.findByPk(cita.idCliente);
    if (cliente) cita.cliente = cliente.toJSON();
  }

  if (!cita.sucursal && cita.idSucursal) {
    const sucursal = await Sucursal.findByPk(cita.idSucursal);
    if (sucursal) cita.sucursal = sucursal.toJSON();
  }

  if (cita.vehiculo) {
    cita.vehiculo = normalizeVehicle(cita.vehiculo);
  }

  return cita;
}

function normalizeCita(cita) {
  if (!cita) return cita;
  const item = cita.toJSON ? cita.toJSON() : { ...cita };
  item.vehiculo = normalizeVehicle(item.vehiculo);
  return item;
}

class CitasController {
  // Crear cita
  async create(req, res) {
    try {
      const { idVehiculo, fecha_hora, motivo, idSucursal, idVendedor } = req.body;
      const clienteDni = req.user.dni; // Del token JWT

      // Validaciones
      if (!fecha_hora || !motivo || !idSucursal || !idVendedor) {
        return res.status(400).json({
          success: false,
          message: 'Fecha/hora, motivo, sucursal y vendedor son obligatorios'
        });
      }

      const cliente = await Cliente.findOne({ where: { dni: clienteDni, activo: true } });
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado o inactivo'
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

      if (!sucursal.activa) {
        return res.status(400).json({
          success: false,
          message: 'La sucursal está inactiva'
        });
      }

      // Validar horario de sucursal y hora de la cita
      const appointmentDate = new Date(fecha_hora);
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Fecha/hora inválida'
        });
      }

      const getTimeString = (date) => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      };

      const appointmentTime = getTimeString(appointmentDate);
      const horarioInicio = sucursal.horario_inicio || '09:00';
      const horarioFin = sucursal.horario_fin || '18:00';

      if (appointmentTime < horarioInicio || appointmentTime >= horarioFin) {
        return res.status(400).json({
          success: false,
          message: `El horario seleccionado está fuera del rango de atención de la sucursal (${horarioInicio} - ${horarioFin})`
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
        const vehicle = await Vehiculo.findByPk(idVehiculo, {
          include: [
            {
              model: Sucursal,
              as: 'sucursal',
              attributes: ['id', 'activa']
            }
          ]
        });
        if (!vehicle) {
          return res.status(404).json({
            success: false,
            message: 'Vehículo no encontrado'
          });
        }
        if (!vehicle.activo) {
          return res.status(400).json({
            success: false,
            message: 'El vehículo no está disponible'
          });
        }
        if (!vehicle.sucursal || !vehicle.sucursal.activa) {
          return res.status(400).json({
            success: false,
            message: 'El vehículo pertenece a una sucursal inactiva'
          });
        }
      }

      // Verificar que la fecha no esté en el pasado
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
        idCliente: cliente.id,
        idVehiculo,
        idSucursal, // Ahora se guarda la sucursal asociada
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

  // Obtener citas del usuario (cliente)
  async getUserCitas(req, res) {
    try {
      const clienteDni = req.user.dni;
      const cliente = await Cliente.findOne({ where: { dni: clienteDni, activo: true } });
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado o inactivo'
        });
      }

      const citas = await Cita.findAll({
        where: { idCliente: cliente.id },
        include: [
          {
            model: Vehiculo,
            as: 'vehiculo',
            required: false,
            include: [{ model: Marca, as: 'marca', attributes: ['nombre'], required: false }]
          },
          {
            model: Vendedor,
            as: 'vendedor',
            required: false,
            include: [
              {
                model: Sucursal,
                as: 'sucursal',
                attributes: ['id', 'nombre', 'direccion', 'telefono', 'horario_inicio', 'horario_fin'],
                required: false
              }
            ]
          },
          {
            model: Calificacion,
            as: 'calificacion',
            required: false
          }
        ],
        order: [['fecha_hora', 'DESC']]
      });

      const idsCitas = citas.map(c => c.id);
      const mensajesNoLeidos = await Conversacion.findAll({
        where: {
          idCita: idsCitas,
          idReceptor: clienteDni,
          leido: false
        }
      });

      const unreadByCita = {};
      mensajesNoLeidos.forEach(m => {
        unreadByCita[m.idCita] = (unreadByCita[m.idCita] || 0) + 1;
      });

      const citasConUnread = await Promise.all(citas.map(async cita => {
        const normalized = normalizeCita(cita);
        const enriched = await enrichCitaRelations(normalized);
        return {
          ...enriched,
          unreadMessages: enriched.id ? unreadByCita[enriched.id] || 0 : 0
        };
      }));

      res.json({
        success: true,
        citas: citasConUnread
      });

    } catch (error) {
      console.error('Error obteniendo citas:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener citas del vendedor (vendedor)
  async getVendorCitas(req, res) {
    try {
      const dni = req.user.dni;

      const vendedor = await Vendedor.findOne({ where: { dni, activo: true } });
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: 'Vendedor no encontrado o inactivo'
        });
      }

      const citas = await Cita.findAll({
        where: { idVendedor: vendedor.id },
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'dni', 'nombre', 'apellido', 'telefono'],
            required: false
          },
          {
            model: Administrador,
            as: 'administrador',
            attributes: ['id', 'dni', 'nombre', 'apellido', 'telefono'],
            required: false
          },
          {
            model: Vehiculo,
            as: 'vehiculo',
            required: false,
            include: [{ model: Marca, as: 'marca', attributes: ['nombre'], required: false }]
          },
          {
            model: Vendedor,
            as: 'vendedor',
            required: false,
            include: [
              {
                model: Sucursal,
                as: 'sucursal',
                attributes: ['id', 'nombre', 'direccion', 'telefono', 'horario_inicio', 'horario_fin'],
                required: false
              }
            ]
          },
          {
            model: Calificacion,
            as: 'calificacion',
            required: false
          }
        ],
        order: [['fecha_hora', 'DESC']]
      });

      const citasFormateadas = await Promise.all(citas.map(async (cita) => {
        const normalized = normalizeCita(cita);
        return await enrichCitaRelations(normalized);
      }));

      res.json({
        success: true,
        citas: citasFormateadas
      });

    } catch (error) {
      console.error('Error obteniendo citas del vendedor:', error);
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
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'dni', 'nombre', 'apellido', 'telefono'],
            required: false
          },
          {
            model: Administrador,
            as: 'administrador',
            attributes: ['id', 'dni', 'nombre', 'apellido', 'telefono'],
            required: false
          },
          {
            model: Vehiculo,
            as: 'vehiculo',
            required: false,
            include: [{ model: Marca, as: 'marca', attributes: ['nombre'], required: false }]
          },
          {
            model: Vendedor,
            as: 'vendedor',
            attributes: ['id', 'dni', 'nombre', 'apellido'],
            required: false,
            include: [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'], required: false }]
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre'],
            required: false
          }
        ],
        order: [['fecha_hora', 'DESC']]
      });

      const citasFormateadas = await Promise.all(citas.map(async (cita) => {
        const normalized = normalizeCita(cita);
        return await enrichCitaRelations(normalized);
      }));

      res.json({
        success: true,
        citas: citasFormateadas
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
      const { fecha, idVehiculo, idSucursal, idVendedor } = req.query;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: 'Fecha requerida'
        });
      }

      // Definir rango de horarios según sucursal
      let horarioInicio = '09:00';
      let horarioFin = '18:00';

      if (idVehiculo) {
        const vehicle = await Vehiculo.findByPk(idVehiculo);
        if (vehicle && vehicle.idSucursal) {
          const sucursal = await Sucursal.findByPk(vehicle.idSucursal);
          if (sucursal) {
            horarioInicio = sucursal.horario_inicio || horarioInicio;
            horarioFin = sucursal.horario_fin || horarioFin;
          }
        }
      } else if (idSucursal) {
        const sucursal = await Sucursal.findByPk(idSucursal);
        if (sucursal) {
          horarioInicio = sucursal.horario_inicio || horarioInicio;
          horarioFin = sucursal.horario_fin || horarioFin;
        }
      }

      const startDate = new Date(`${fecha} 00:00:00`);
      const endDate = new Date(`${fecha} 23:59:59`);

      const citaFilter = {
        fecha_hora: {
          [Op.between]: [startDate, endDate]
        },
        estado: {
          [Op.in]: ['pendiente', 'aceptada']
        }
      };

      if (idVendedor) {
        citaFilter.idVendedor = idVendedor;
      }

      const existingCitas = await Cita.findAll({
        where: citaFilter,
        attributes: ['fecha_hora']
      });

      const allSlots = [];
      const takenTimes = new Set(existingCitas.map(cita => {
        const citaTime = new Date(cita.fecha_hora);
        return `${String(citaTime.getHours()).padStart(2, '0')}:${String(citaTime.getMinutes()).padStart(2, '0')}`;
      }));

      let current = new Date(`${fecha} ${horarioInicio}:00`);
      const endTime = new Date(`${fecha} ${horarioFin}:00`);

      while (current < endTime) {
        const timeString = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
        const isTaken = takenTimes.has(timeString);
        const isPast = current <= new Date();

        const slot = {
          time: timeString,
          available: !isTaken && !isPast
        };

        allSlots.push(slot);
        current.setMinutes(current.getMinutes() + 60); // slots de 1h
      }

      res.json({
        success: true,
        date: fecha,
        availableSlots: allSlots,
        horarioInicio,
        horarioFin
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
      const adminDni = req.user.dni;

      const admin = await Administrador.findOne({ where: { dni: adminDni, activo: true } });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado o inactivo'
        });
      }

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
        idAdministrador: admin.id,
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
      const adminDni = req.user.dni;

      const admin = await Administrador.findOne({ where: { dni: adminDni, activo: true } });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado o inactivo'
        });
      }

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
        idAdministrador: admin.id,
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
      const adminDni = req.user.dni;

      const admin = await Administrador.findOne({ where: { dni: adminDni, activo: true } });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado o inactivo'
        });
      }

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
        idAdministrador: admin.id,
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

  // Finalizar cita manualmente (vendedor asignado)
  async finalizarCita(req, res) {
    try {
      const { id } = req.params;
      const dniVendedor = req.user.dni;

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

      const vendedor = await Vendedor.findOne({ where: { dni: dniVendedor, activo: true } });
      if (!vendedor || vendedor.id !== cita.idVendedor) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para finalizar esta cita'
        });
      }

      await cita.update({
        estado: 'finalizada',
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