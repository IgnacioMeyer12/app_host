
// Definición de todas las rutas de navegación de la aplicación.

import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';                    /* Página inicial */
import { RegisterComponent } from './auth/register/register.component';   /* Registro de usuarios */
import { AltaVehiculoComponent } from './alta-vehiculo/alta-vehiculo.component'; /* Agregar vehículos */
import { CatalogoComponent } from './catalogo/catalogo.component';         /* Ver catálogo de vehículos */
import { CitaComponent } from './cita/cita.component';                    /* Agendar citas */
import { CitasAdminComponent } from './citas-admin/citas-admin.component'; /* Admin: ver todas las citas */
import { MisCitasComponent } from './mis-citas/mis-citas.component';       /* Usuario: ver sus citas */
import { AdministrarSucursalesComponent } from './administrar-sucursales/administrar-sucursales.component';       /* Usuario: ver sus citas */
import { AdministrarVehiculosComponent } from './administrar-vehiculos/administrar-vehiculos.component'; /* Gestión de vehículos */

/* DEFINICIÓN DE RUTAS */
export const routes: Routes = [
  /* Ruta raíz: / → muestra HomeComponent */
  { path: '', component: HomeComponent }, /* ruta raíz */
  /* Ruta: /register → muestra RegisterComponent (formulario de registro) */
  { path: 'register', component: RegisterComponent }, /* formulario de registro */
  /* Ruta: /alta-vehiculo → muestra AltaVehiculoComponent (agregar vehículo) */
  { path: 'alta-vehiculo', component: AltaVehiculoComponent }, /* sólo admin */
  /* Ruta: /catalogo → muestra CatalogoComponent (ver vehículos) */
  { path: 'catalogo', component: CatalogoComponent }, /* ver vehículos */
  /* Ruta: /cita → muestra CitaComponent (agendar cita) */
  { path: 'cita', component: CitaComponent }, /* agendar cita */
  /* Ruta: /citas → muestra CitasAdminComponent (admin ve todas las citas) */
  { path: 'citas', component: CitasAdminComponent }, /* admin todas las citas */
  /* Ruta: /mis-citas → muestra MisCitasComponent (usuario ve sus citas) */
  { path: 'mis-citas', component: MisCitasComponent }, /* cliente sus citas */
  /* Ruta: /administrar-sucursales → muestra AdministrarSucursalesComponent (admin gestiona sucursales) */
  { path: 'administrar-sucursales', component: AdministrarSucursalesComponent }, /* admin gestiona sucursales */
  /* Ruta: /administrar-vehiculos → muestra AdministrarVehiculosComponent (cliente/usuario gestiona vehículos) */
  { path: 'administrar-vehiculos', component: AdministrarVehiculosComponent },
  { path: '**', redirectTo: '' }
];
