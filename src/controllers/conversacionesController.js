const models = require('../models');
const { Conversacion, Cita, Vendedor, Cliente, Administrador } = models;

class ConversacionesController {
  // Crear un nuevo mensaje en una conversación
  async create(req, res) {
    try {
      const { idCita, mensaje, tipo = 'texto' } = req.body;
      const idEmisor = req.user.dni;

      // Validaciones
      if (!idCita || !mensaje) {
        return res.status(400).json({
          success: false,
          message: 'ID de cita y mensaje son obligatorios'
        });
      }

      // Verificar que la cita existe y el usuario está involucrado
      const cita = await Cita.findByPk(idCita, {
        include: [
          { model: require('../models').Vendedor, as: 'vendedor' },
          { model: require('../models').Cliente, as: 'cliente' }
        ]
      });

      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      // Determinar el receptor basado en el rol del emisor
      let idReceptor;
      if (req.user.rol === 'cliente') {
        const cliente = await require('../models').Cliente.findOne({ where: { dni: idEmisor, activo: true } });
        if (cliente && cita.idCliente === cliente.id) {
          idReceptor = cita.vendedor?.dni;
        } else {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para enviar mensajes en esta conversación'
          });
        }
      } else if (req.user.rol === 'vendedor') {
        // Verificar que el vendedor está asignado a esta cita
        const vendedor = await require('../models').Vendedor.findOne({ where: { dni: idEmisor } });
        if (vendedor && cita.idVendedor === vendedor.id) {
          idReceptor = cita.cliente?.dni || (await require('../models').Cliente.findByPk(cita.idCliente))?.dni;
        } else {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para enviar mensajes en esta conversación'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para enviar mensajes en esta conversación'
        });
      }

      if (!idReceptor) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo determinar el receptor del mensaje'
        });
      }

      // Crear el mensaje
      const conversacion = await Conversacion.create({
        idCita,
        idEmisor,
        idReceptor,
        mensaje,
        tipo
      });

      res.status(201).json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        conversacion
      });

    } catch (error) {
      console.error('Error creando conversación:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener conversaciones de una cita
  async getByCita(req, res) {
    try {
      const { idCita } = req.params;
      const userDni = req.user.dni;

      // Verificar que el usuario está involucrado en la cita
      const cita = await Cita.findByPk(idCita, {
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id', 'dni', 'nombre', 'apellido', 'telefono'] },
          { model: Vendedor, as: 'vendedor', attributes: ['id', 'dni', 'nombre', 'apellido', 'telefono'] }
        ]
      });

      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      // Verificar permisos
      let esCliente = false;
      let esVendedor = false;

      if (req.user.rol === 'cliente') {
        const cliente = await Cliente.findOne({ where: { dni: userDni, activo: true } });
        if (cliente) {
          esCliente = cita.idCliente === cliente.id;
        }
      } else if (req.user.rol === 'vendedor') {
        const vendedor = await Vendedor.findOne({ where: { dni: userDni, activo: true } });
        if (vendedor) {
          esVendedor = cita.idVendedor === vendedor.id;
        }
      }

      if (!esCliente && !esVendedor) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta conversación'
        });
      }

      const conversaciones = await Conversacion.findAll({
        where: { idCita },
        order: [['fecha_creacion', 'ASC']]
      });

      res.json({
        success: true,
        conversaciones,
        cita: {
          id: cita.id,
          fecha: cita.fecha,
          hora: cita.hora,
          estado: cita.estado,
          cliente: cita.cliente ? {
            id: cita.cliente.id,
            nombre: cita.cliente.nombre,
            apellido: cita.cliente.apellido,
            dni: cita.cliente.dni
          } : null,
          vendedor: cita.vendedor ? {
            id: cita.vendedor.id,
            nombre: cita.vendedor.nombre,
            apellido: cita.vendedor.apellido,
            dni: cita.vendedor.dni
          } : null
        }
      });

    } catch (error) {
      console.error('Error obteniendo conversaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Obtener conversaciones del usuario actual
  async getMyConversations(req, res) {
    try {
      const userDni = req.user.dni;
      const userRol = req.user.rol;
      const { Op } = require('sequelize');
      // Buscar todas las citas donde el usuario es cliente o vendedor asignado
      let citas = [];
      if (userRol === 'cliente') {
        const cliente = await require('../models').Cliente.findOne({ where: { dni: userDni, activo: true } });
        if (!cliente) {
          return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }

        citas = await Cita.findAll({
          where: { idCliente: cliente.id },
          include: [
            { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
            { model: require('../models').Vehiculo, as: 'vehiculo', attributes: ['idVehiculo', 'modelo', 'anio'], include: [{ model: require('../models').Marca, as: 'marca', attributes: ['nombre'] }] },
            { model: Vendedor, as: 'vendedor', attributes: ['id', 'nombre', 'apellido', 'dni'], include: [{ model: models.Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }] },
            { model: models.Sucursal, as: 'sucursal', attributes: ['id', 'nombre', 'direccion'] }
          ],
          order: [['fecha_hora', 'DESC']]
        });
      } else if (userRol === 'vendedor') {
        // Buscar el id del vendedor
        const vendedor = await require('../models').Vendedor.findOne({ where: { dni: userDni } });
        if (vendedor) {
          citas = await Cita.findAll({
            where: { idVendedor: vendedor.id },
            include: [
              { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
              { model: require('../models').Vehiculo, as: 'vehiculo', attributes: ['idVehiculo', 'modelo', 'anio'], include: [{ model: require('../models').Marca, as: 'marca', attributes: ['nombre'] }] },
              { model: Vendedor, as: 'vendedor', attributes: ['id', 'nombre', 'apellido', 'dni'], include: [{ model: models.Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }] },
              { model: models.Sucursal, as: 'sucursal', attributes: ['id', 'nombre', 'direccion'] }
            ],
            order: [['fecha_hora', 'DESC']]
          });
        }
      }

      // Buscar todos los mensajes del usuario
      const mensajes = await Conversacion.findAll({
        where: {
          [Op.or]: [
            { idEmisor: userDni },
            { idReceptor: userDni }
          ]
        },
        order: [['fecha_creacion', 'ASC']]
      });

      // Agrupar mensajes por cita
      const mensajesPorCita = {};
      mensajes.forEach(msg => {
        const m = (msg && typeof msg.get === 'function') ? msg.get({ plain: true }) : msg;
        if (!mensajesPorCita[m.idCita]) mensajesPorCita[m.idCita] = [];
        mensajesPorCita[m.idCita].push(m);
      });

      // Construir la lista de "conversaciones" para el frontend
      const conversaciones = citas.map(cita => {
        const mensajesCita = (mensajesPorCita[cita.id] || []).map(msg => {
          const isMine = msg.idEmisor === userDni;
          let sender = isMine ? 'Tú' : (msg.idEmisor || 'Usuario');
          let recipient = msg.idReceptor || 'Usuario';

          if (!isMine) {
            if (cita.cliente && msg.idEmisor === cita.cliente.dni) {
              sender = `${cita.cliente.nombre || 'Cliente'} ${cita.cliente.apellido || ''}`.trim();
            } else if (cita.vendedor && msg.idEmisor === cita.vendedor.dni) {
              sender = `${cita.vendedor.nombre || 'Vendedor'} ${cita.vendedor.apellido || ''}`.trim();
            }
          }

          if (msg.idReceptor === userDni) {
            recipient = 'Tú';
          } else if (cita.cliente && msg.idReceptor === cita.cliente.dni) {
            recipient = `${cita.cliente.nombre || 'Cliente'} ${cita.cliente.apellido || ''}`.trim();
          } else if (cita.vendedor && msg.idReceptor === cita.vendedor.dni) {
            recipient = `${cita.vendedor.nombre || 'Vendedor'} ${cita.vendedor.apellido || ''}`.trim();
          }

          return {
            ...msg,
            isMine,
            sender,
            recipient
          };
        });

        const ultimoMensaje = mensajesCita.length > 0 ? mensajesCita[mensajesCita.length - 1] : null;
        return {
          idCita: cita.id,
          cita,
          mensajes: mensajesCita,
          ultimoMensaje: ultimoMensaje ? ultimoMensaje.mensaje : '',
          ultimoMensajeSender: (ultimoMensaje && ultimoMensaje.sender && ultimoMensaje.sender !== 'Desconocido') ? ultimoMensaje.sender : '',
          ultimoMensajeFecha: ultimoMensaje ? ultimoMensaje.fecha_creacion : cita.creado_en,
          totalMensajes: mensajesCita.length,
          mensajesNoLeidos: mensajesCita.filter(m => !m.leido && m.idReceptor === userDni).length
        };
      });

      // Ordenar por último mensaje (de más reciente a más antiguo)
      conversaciones.sort((a, b) => {
        const aFecha = new Date(a.ultimoMensajeFecha || a.cita?.fecha_hora || 0).getTime();
        const bFecha = new Date(b.ultimoMensajeFecha || b.cita?.fecha_hora || 0).getTime();
        return bFecha - aFecha;
      });

      res.json({
        success: true,
        conversaciones
      });
    } catch (error) {
      console.error('Error obteniendo conversaciones del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Marcar mensajes como leídos
  async markAsRead(req, res) {
    try {
      const { idCita } = req.params;
      const userDni = req.user.dni;

      await Conversacion.update(
        { leido: true },
        {
          where: {
            idCita,
            idReceptor: userDni,
            leido: false
          }
        }
      );

      res.json({
        success: true,
        message: 'Mensajes marcados como leídos'
      });

    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new ConversacionesController();