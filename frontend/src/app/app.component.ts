/* IMPORTACIONES
   ============= */
// Traigo las herramientas necesarias de Angular
import { Component, OnInit } from '@angular/core';    // Para crear componentes
import { RouterModule } from '@angular/router';       // Para la navegación entre páginas
import { CommonModule } from '@angular/common';       // Para usar directivas como *ngIf, *ngFor

/* DECORADOR DEL COMPONENTE
   ======================= */
@Component({
  selector: 'app-root',           // Cómo voy a llamar a este componente en el HTML: <app-root>
  standalone: true,                // Es un componente independiente (no necesita módulos)
  imports: [CommonModule, RouterModule],  // Módulos que necesito que funcionen aquí
  template: `                      
    <router-outlet></router-outlet>  <!-- Este es el placeholder donde se cargarán las páginas -->
  `
})

/* CLASE DEL COMPONENTE
   =================== */
export class AppComponent implements OnInit {  // Implemento OnInit para tener el método ngOnInit
  title = 'Automotores Meyer';  // Una variable con el nombre de mi aplicación
  
  constructor() {  // Aquí normalmente inyectaría servicios que necesite
    // Vacío por ahora, pero listo para cuando necesite servicios
  }

  ngOnInit(): void {  // Este método se ejecuta automáticamente al iniciar el componente
    // Aquí pondría lógica de inicialización, como cargar datos iniciales
  }
}