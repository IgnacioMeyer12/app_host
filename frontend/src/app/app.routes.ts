
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
// AdministrarVehiculosComponent fue reemplazado por catálogo; route /administrar-vehiculos redirige a /catalogo
import { AdministrarVendedoresComponent } from './administrar-vendedores/administrar-vendedores.component';
import { VendedorCitasComponent } from './vendedor-citas/vendedor-citas.component';
import { VendedorCalificacionesComponent } from './vendedor-calificaciones/vendedor-calificaciones.component';
import { VendedorConversacionesComponent } from './vendedor-conversaciones/vendedor-conversaciones.component';
import { AdministrarMarcasComponent } from './administrar-marcas/administrar-marcas.component';
import { TopVendedoresComponent } from './top-vendedores/top-vendedores.component';

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
  /* Ruta: /administrar-vendedores → muestra AdministrarVendedoresComponent (admin gestiona vendedores) */
  { path: 'administrar-vendedores', component: AdministrarVendedoresComponent },
  { path: 'vendedor-citas', component: VendedorCitasComponent },
  { path: 'vendedor-calificaciones', component: VendedorCalificacionesComponent },
  { path: 'vendedor-conversaciones', component: VendedorConversacionesComponent },
  { path: 'administrar-marcas', component: AdministrarMarcasComponent },
  { path: 'top-vendedores', component: TopVendedoresComponent },
  /* Ruta obsoleta: /administrar-vehiculos → redirige a catálogo */
  { path: 'administrar-vehiculos', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
