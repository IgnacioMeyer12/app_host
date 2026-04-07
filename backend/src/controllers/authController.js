const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Cliente, Administrador, Vendedor } = require('../models');

class AuthController {
  // Registro de usuario (adaptado a 3 tablas)
  async register(req, res) {
    try {
      const { dni, nombre, apellido, telefono, password, rol } = req.body;
      if (!dni || !nombre || !apellido || !telefono || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
      }
      const role = (rol || 'cliente').toLowerCase();
      let Model, roleValue;
      if (role === 'admin') {
        Model = Administrador;
        roleValue = 'admin';
      } else if (role === 'vendedor') {
        Model = Vendedor;
        roleValue = 'vendedor';
      } else {
        Model = Cliente;
        roleValue = 'cliente';
      }
      // Verificar si el usuario ya existe en la tabla correspondiente
      const existingUser = await Model.findOne({ where: { dni } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'El DNI ya está registrado' });
      }
      // Verificar teléfono único en la tabla correspondiente
      const existingPhone = await Model.findOne({ where: { telefono } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'El teléfono ya está registrado' });
      }
      // Control de roles: solo admin puede crear admins o vendedores
      if (['admin', 'vendedor'].includes(role)) {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(403).json({ success: false, message: 'Permisos insuficientes para crear este tipo de usuario' });
        }
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
          if (decoded.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'Permisos insuficientes. Solo administradores pueden crear admin/vendedor.' });
          }
        } catch (verifyErr) {
          return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
        }
      }
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      // Crear usuario en la tabla correspondiente
      const newUser = await Model.create({
        dni,
        nombre,
        apellido,
        telefono,
        password: hashedPassword,
        rol: roleValue,
        activo: true
      });
      // Generar token JWT
      const token = jwt.sign(
        { dni: newUser.dni, rol: newUser.rol },
        process.env.JWT_SECRET || 'tu_secreto_jwt',
        { expiresIn: '24h' }
      );
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          dni: newUser.dni,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          telefono: newUser.telefono,
          rol: newUser.rol
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }

  // Login de usuario (adaptado a 3 tablas)
  async login(req, res) {
    try {
      const { dni, password } = req.body;
      if (!dni || !password) {
        return res.status(400).json({ success: false, message: 'DNI y contraseña son obligatorios' });
      }
      // Buscar usuario en las tres tablas con fallback inteligente
      const admin = await Administrador.findOne({ where: { dni } });
      const vendedor = await Vendedor.findOne({ where: { dni } });
      const cliente = await Cliente.findOne({ where: { dni } });

      // Función auxiliar para validar contraseña y estado
      const validateLogin = async (candidate) => {
        if (!candidate || !candidate.activo) return null;
        const match = await bcrypt.compare(password, candidate.password);
        return match ? candidate : null;
      };

      // Prioridad: Administrador > Vendedor > Cliente
      let user = await validateLogin(admin);
      if (!user) user = await validateLogin(vendedor);
      if (!user) user = await validateLogin(cliente);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      // Generar token JWT
      const token = jwt.sign(
        { dni: user.dni, rol: user.rol },
        process.env.JWT_SECRET || 'tu_secreto_jwt',
        { expiresIn: '24h' }
      );
      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          dni: user.dni,
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: user.telefono,
          rol: user.rol
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }

  // Crear usuario administrador (solo para desarrollo)
  async createAdmin(req, res) {
    try {
      const { dni, nombre, apellido, telefono, password } = req.body;

      // Verificar si ya existe un admin con ese DNI
      const existingAdmin = await Usuario.findByPk(dni);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con ese DNI'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await Usuario.create({
        dni,
        nombre,
        apellido,
        telefono,
        password: hashedPassword,
        rol: 'admin'
      });

      res.status(201).json({
        success: true,
        message: 'Administrador creado exitosamente',
        admin: {
          dni: admin.dni,
          nombre: admin.nombre,
          rol: admin.rol
        }
      });

    } catch (error) {
      console.error('Error creando admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new AuthController();