const express = require('express');
const router = express.Router();
const vendedoresController = require('../controllers/vendedoresController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener todos los vendedores
router.get('/', vendedoresController.getAll);

// Obtener vendedores por sucursal
router.get('/sucursal/:idSucursal', vendedoresController.getBySucursal);

// Crear vendedor (solo admin)
router.post('/', auth, (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden crear vendedores.'
    });
  }
  next();
}, vendedoresController.create);

// Actualizar vendedor (solo admin)
router.put('/:id', auth, (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden actualizar vendedores.'
    });
  }
  next();
}, vendedoresController.update);

// Eliminar vendedor (solo admin)
router.delete('/:id', auth, (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden eliminar vendedores.'
    });
  }
  next();
}, vendedoresController.delete);

module.exports = router;