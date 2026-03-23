const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

class AuthController {
  // Registro de usuario
  async register(req, res) {
    try {
      const { dni, nombre, apellido, telefono, password, rol } = req.body;

      // Validaciones
      if (!dni || !nombre || !apellido || !telefono || !password) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios'
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await Usuario.findByPk(dni);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El DNI ya está registrado'
        });
      }

      // Verificar teléfono único
      const existingPhone = await Usuario.findOne({ where: { telefono } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono ya está registrado'
        });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await Usuario.create({
        dni,
        nombre,
        apellido,
        telefono,
        password: hashedPassword,
        rol: rol || 'cliente'
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
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  // Login de usuario
  async login(req, res) {
    try {
      const { dni, password } = req.body;

      if (!dni || !password) {
        return res.status(400).json({
          success: false,
          message: 'DNI y contraseña son obligatorios'
        });
      }

      // Buscar usuario
      const user = await Usuario.findByPk(dni);
      if (!user || !user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
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
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
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