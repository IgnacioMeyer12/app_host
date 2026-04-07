const express = require('express');
const router = express.Router();
const vehiculosController = require('../controllers/vehiculosController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas de vehículos
router.post('/', authenticateToken, requireAdmin, vehiculosController.create);
router.get('/', vehiculosController.getAll); // Público
router.get('/search', vehiculosController.search); // Búsqueda avanzada - Público
router.get('/sucursal/:id', authenticateToken, requireAdmin, vehiculosController.getBySucursal);
router.get('/todas', authenticateToken, requireAdmin, vehiculosController.getAllAdmin);
router.put('/:id', authenticateToken, requireAdmin, vehiculosController.update);
router.delete('/:id', vehiculosController.delete);
router.get('/vehiculos-generados', authenticateToken, requireAdmin, vehiculosController.generateSampleVehicles);

module.exports = router;