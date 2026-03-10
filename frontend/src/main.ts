// Importamos la función bootstrapApplication desde el módulo de plataforma del navegador de Angular.
import { bootstrapApplication } from '@angular/platform-browser';

// Importamos el componente raíz de nuestra aplicación, AppComponent.
import { AppComponent } from './app/app.component';

// Importamos la configuración principal de la aplicación (appConfig).
import { appConfig } from './app/app.config';

// Llamamos a la función bootstrapApplication.
bootstrapApplication(AppComponent, appConfig)
  // capturamos el error con .catch().
  .catch((err: any) => 
    console.error(err)
  );