const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { authenticateToken, requireAdmin, requireCliente } = require('../middleware/auth');

// Rutas de citas
router.post('/', authenticateToken, citasController.create);
router.get('/availability', citasController.checkAvailability); // Público para ver disponibilidad
router.get('/', authenticateToken, requireAdmin, citasController.getAllCitas);
router.get('/mis-citas', authenticateToken, citasController.getUserCitas);
router.put('/:id', authenticateToken, requireAdmin, citasController.update);

// Gestión de estado de citas (solo admin)
router.put('/:id/confirmar', authenticateToken, requireAdmin, citasController.confirmarCita);
router.put('/:id/cancelar', authenticateToken, requireAdmin, citasController.cancelarCita);
router.put('/:id/finalizar', authenticateToken, requireAdmin, citasController.finalizarCita);

module.exports = router;