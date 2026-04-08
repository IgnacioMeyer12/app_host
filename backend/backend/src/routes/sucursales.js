const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas de sucursales
router.get('/', sucursalesController.getAll); // Público
router.get('/todas', authenticateToken, requireAdmin, sucursalesController.getAllAdmin);
router.post('/', authenticateToken, requireAdmin, sucursalesController.create);
router.put('/:id', authenticateToken, requireAdmin, sucursalesController.update);
router.delete('/:id', authenticateToken, requireAdmin, sucursalesController.delete);

module.exports = router;