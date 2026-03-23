# Backend Automotores Meyer - API REST

## 📁 Estructura del Proyecto

El backend ha sido completamente refactorizado para seguir una arquitectura MVC organizada y modular:

```
backend/
├── src/
│   ├── app.js                 # Archivo principal - Servidor Express
│   ├── config/
│   │   └── database.js        # Configuración de Sequelize y conexión a MySQL
│   ├── models/                # Modelos de datos (Sequelize)
│   │   ├── Usuario.js
│   │   ├── Vehiculo.js
│   │   ├── Cita.js
│   │   ├── Sucursal.js
│   │   └── index.js           # Definición de relaciones entre modelos
│   ├── controllers/           # Lógica de negocio
│   │   ├── authController.js
│   │   ├── vehiculosController.js
│   │   ├── citasController.js
│   │   └── sucursalesController.js
│   ├── routes/                # Definición de rutas API
│   │   ├── auth.js
│   │   ├── vehiculos.js
│   │   ├── citas.js
│   │   └── sucursales.js
│   ├── middleware/            # Middlewares personalizados
│   │   ├── auth.js            # Autenticación JWT
│   │   └── upload.js          # Subida de archivos
│   └── seeders/               # Datos iniciales
│       └── databaseSeeder.js
├── public/
│   └── uploads/               # Archivos subidos
├── .env                       # Variables de entorno
├── package.json
└── README.md
```

## 🚀 Inicio Rápido

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar base de datos:**
   - Asegurarse de que MySQL/XAMPP esté ejecutándose
   - Crear la base de datos `automotores_meyer_db` (o configurar en .env)
   - Las tablas se crean automáticamente con Sequelize

3. **Configurar variables de entorno (.env):**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=automotores_meyer_db
   PORT=3001
   JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui
   NODE_ENV=development
   ```

4. **Ejecutar el servidor:**
   ```bash
   npm start
   ```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/admins` - Crear admin (desarrollo)

### Vehículos
- `GET /api/vehiculos` - Listar vehículos activos (público)
- `GET /api/vehiculos/todas` - Listar todos (admin)
- `POST /api/vehiculos` - Crear vehículo (admin)
- `PUT /api/vehiculos/:id` - Actualizar vehículo (admin)
- `DELETE /api/vehiculos/:id` - Eliminar vehículo (admin)
- `GET /api/vehiculos-generados` - Generar datos de ejemplo (admin)

### Citas
- `POST /api/citas` - Crear cita (autenticado)
- `GET /api/citas/mis-citas` - Mis citas (cliente)
- `GET /api/citas` - Todas las citas (admin)
- `GET /api/citas/availability?fecha=2024-01-01` - Ver disponibilidad
- `PUT /api/citas/:id` - Actualizar cita (admin)

### Sucursales
- `GET /api/sucursales` - Listar sucursales activas (público)
- `GET /api/sucursales/todas` - Listar todas (admin)
- `POST /api/sucursales` - Crear sucursal (admin)
- `PUT /api/sucursales/:id` - Actualizar sucursal (admin)
- `DELETE /api/sucursales/:id` - Eliminar sucursal (admin)

### Marcas
- `GET /api/marcas` - Listar marcas activas (público)
- `GET /api/marcas/todas` - Listar todas las marcas (admin)
- `POST /api/marcas` - Crear marca (admin)
- `PUT /api/marcas/:id` - Actualizar marca (admin)
- `DELETE /api/marcas/:id` - Eliminar marca (admin)

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación:

1. **Registro/Login** devuelve un token
2. **Incluir token** en header: `Authorization: Bearer <token>`
3. **Middlewares de protección:**
   - `authenticateToken` - Verifica token válido
   - `requireAdmin` - Solo administradores
   - `requireCliente` - Solo clientes

## 🗄️ Base de Datos

### Tablas
- **usuarios** - Usuarios del sistema
- **marcas** - Marcas de vehículos
- **vehiculos** - Catálogo de vehículos (relacionado con marcas)
- **citas** - Agendamiento de citas
- **sucursales** - Información de sucursales

### Seeders
Datos iniciales se crean automáticamente:
- Usuario admin: `12345678` / `admin123`
- Usuario cliente: `87654321` / `cliente123`
- 5 marcas de ejemplo (Toyota, Ford, BMW, Honda, Chevrolet)
- 3 vehículos de ejemplo
- 2 sucursales de ejemplo

## 🛠️ Tecnologías

- **Express.js** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL2** - Driver de MySQL
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Multer** - Subida de archivos
- **CORS** - Control de acceso cruzado

## 📈 Mejoras Implementadas

✅ **Antes:** 1639 líneas en un solo archivo
✅ **Después:** Código modular y organizado
✅ **Modelos Sequelize** en lugar de SQL crudo
✅ **Controladores** separados por funcionalidad
✅ **Rutas** organizadas por módulo
✅ **Middlewares** reutilizables
✅ **Seeders** para datos iniciales
✅ **Estructura MVC** clara
✅ **Documentación** completa

## 🔧 Desarrollo

Para desarrollo, puedes usar:
```bash
npm run dev  # Con nodemon si está configurado
```

O directamente:
```bash
node src/app.js
```

## 🚨 Notas Importantes

- Asegurarse de que MySQL esté ejecutándose antes de iniciar
- Las tablas se crean automáticamente con Sequelize
- Los archivos subidos van a `/public/uploads/`
- JWT secret debe ser seguro en producción
- Puerto por defecto: 3001

## ✨ **NUEVA FUNCIONALIDAD: Gestión de Marcas**

Se ha agregado un sistema completo de gestión de marcas de vehículos:

### **Nuevos Endpoints:**
- `GET /api/marcas` - Listar marcas activas
- `GET /api/marcas/todas` - Listar todas las marcas (admin)
- `POST /api/marcas` - Crear nueva marca (admin)
- `PUT /api/marcas/:id` - Actualizar marca (admin)
- `DELETE /api/marcas/:id` - Desactivar marca (admin)

### **Nuevos Modelos:**
- **Marca.js** - Modelo para marcas de vehículos
- Relación uno-a-muchos: Una marca puede tener muchos vehículos

### **Cambios en Vehículos:**
- Los vehículos ahora usan `idMarca` (foreign key) en lugar de campo `marca` (string)
- Las consultas de vehículos incluyen automáticamente la información de la marca
- Validación de que la marca existe antes de crear/actualizar vehículos

### **Datos de Ejemplo:**
- 5 marcas incluidas en seeders: Toyota, Ford, BMW, Honda, Chevrolet
- Vehículos de ejemplo actualizados para usar las nuevas marcas