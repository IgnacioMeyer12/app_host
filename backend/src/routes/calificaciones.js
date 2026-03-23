const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Crear calificación (solo clientes)
router.post('/', auth, (req, res, next) => {
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo clientes pueden calificar.'
    });
  }
  next();
}, calificacionesController.create);

// Obtener calificaciones de un vendedor
router.get('/vendedor/:idVendedor', calificacionesController.getByVendedor);

// Obtener ranking de vendedores
router.get('/ranking', calificacionesController.getRanking);

// Obtener calificación de una cita específica
router.get('/cita/:idCita', calificacionesController.getByCita);

module.exports = router;