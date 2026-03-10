/* IMPORTACIONES
   =============
   Traigo todos los elementos necesarios desde los módulos de Angular
   para configurar correctamente mi aplicación. */

// Importo ApplicationConfig, que es un tipo (una especie de plantilla)
import { ApplicationConfig } from '@angular/core';

// el sistema de rutas (navegación) en mi aplicación.
import { provideRouter } from '@angular/router';

// Importo provideHttpClient, que me permite hacer peticiones HTTP
import { provideHttpClient } from '@angular/common/http';

// Importo las rutas que he definido en otro archivo (app.routes.ts).
import { routes } from './app.routes';

// Exporto esta constante para que pueda ser usada en otros archivos
// (principalmente en main.ts, donde arranco la aplicación).
export const appConfig: ApplicationConfig = {
  

  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};