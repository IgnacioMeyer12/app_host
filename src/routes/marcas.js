const express = require('express');
const router = express.Router();
const marcasController = require('../controllers/marcasController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas de marcas
router.get('/', marcasController.getAll); // Público
router.get('/todas', authenticateToken, requireAdmin, marcasController.getAllAdmin);
router.post('/', authenticateToken, requireAdmin, marcasController.create);
router.put('/:id', authenticateToken, requireAdmin, marcasController.update);
router.delete('/:id', authenticateToken, requireAdmin, marcasController.delete);

module.exports = router;