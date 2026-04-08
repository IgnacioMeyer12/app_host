const express = require('express');
const router = express.Router();
const conversacionesController = require('../controllers/conversacionesController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear mensaje
router.post('/', conversacionesController.create);

// Obtener conversaciones de una cita
router.get('/cita/:idCita', conversacionesController.getByCita);

// Obtener conversaciones del usuario actual
router.get('/mis-conversaciones', conversacionesController.getMyConversations);

// Marcar mensajes como leídos
router.put('/cita/:idCita/leido', conversacionesController.markAsRead);

module.exports = router;