const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { authenticateToken, requireAdmin, requireCliente, requireVendedor } = require('../middleware/auth');

// Rutas de citas
router.post('/', authenticateToken, citasController.create);
router.get('/availability', citasController.checkAvailability); // Público para ver disponibilidad
router.get('/', authenticateToken, requireAdmin, citasController.getAllCitas);
router.get('/mis-citas', authenticateToken, requireCliente, citasController.getUserCitas);
router.get('/vendedor-citas', authenticateToken, requireVendedor, citasController.getVendorCitas);
router.put('/:id', authenticateToken, requireAdmin, citasController.update);

// Gestión de estado de citas
router.put('/:id/confirmar', authenticateToken, requireAdmin, citasController.confirmarCita);
router.put('/:id/cancelar', authenticateToken, requireAdmin, citasController.cancelarCita);
router.put('/:id/finalizar', authenticateToken, requireVendedor, citasController.finalizarCita);

module.exports = router;