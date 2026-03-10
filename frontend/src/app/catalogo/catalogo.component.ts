// ============================================
// COMPONENTE CATÁLOGO (CatalogoComponent)
// ============================================
// Muestra el catálogo de vehículos disponibles para la venta.
// Obtiene la lista de vehículos del backend y permite:
// - Ver detalles básicos de cada vehículo
// - Solicitar una cita para ver un vehículo específico (solo clientes logueados)
// - Formatear precios en moneda USD
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';       // Para directivas *ngIf, *ngFor
import { Router, RouterModule } from '@angular/router'; // Para navegación y routerLink
import { HttpClient } from '@angular/common/http';    // Para peticiones HTTP

@Component({
  selector: 'app-catalogo',           // Etiqueta HTML: <app-catalogo>
  standalone: true,                    // Componente independiente
  imports: [CommonModule, RouterModule], // Módulos que necesita
  templateUrl: './catalogo.component.html', // HTML del componente
  styleUrls: ['./catalogo.component.css']   // Estilos del componente
})
export class CatalogoComponent implements OnInit {
  // ============================================
  // PROPIEDADES
  // ============================================
  vehicles: any[] = [];    // Lista de vehículos que llega del backend
  loading = false;         // Controla el estado de carga (spinner)
  error = '';              // Mensaje de error si algo falla

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias
  // ============================================
  constructor(
    private http: HttpClient,   // Para hacer peticiones HTTP
    private router: Router      // Para navegar a otras páginas
  ) {}

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {
    // Carga los vehículos apenas se abre la página
    this.fetchVehicles();
  }

  // ============================================
  // fetchVehicles - Obtiene los vehículos del backend
  // ============================================
  fetchVehicles(): void {
    this.loading = true;  // Activa el spinner
    this.error = '';      // Limpia errores anteriores

    // Petición GET al backend
    this.http.get('http://localhost:3001/api/vehiculos').subscribe({
      next: (resp: any) => {  // Si la petición es exitosa
        this.loading = false;
        
        if (resp && resp.success) {
          // Guarda los vehículos en la propiedad (o array vacío si no hay)
          this.vehicles = resp.vehiculos || [];
        } else {
          // Si el backend devuelve error, muestra el mensaje
          this.error = resp.message || 'Error cargando vehículos';
        }
      },
      error: (err) => {  // Si hay error de conexión o servidor
        this.loading = false;
        
        if (err.status === 0) {
          // Error de conexión (servidor no disponible)
          this.error = 'No se puede conectar al servidor. Verifica que el backend esté en http://localhost:3001';
        } else {
          // Otro tipo de error (ej: 500, 404)
          this.error = err.error?.message || 'Error cargando vehículos';
        }
      }
    });
  }

  // ============================================
  // viewDetails - Muestra detalles básicos del vehículo
  // ============================================
  viewDetails(vehicle: any): void {
    // Por ahora solo muestra un alert con información básica
    // En el futuro podría navegar a una página de detalles
    alert(`${vehicle.marca} ${vehicle.modelo} (${vehicle.anio}) - Precio: ${this.formatCurrency(vehicle.precio)}`);
  }

  // ============================================
  // formatCurrency - Formatea un número como moneda USD
  // ============================================
  formatCurrency(amount: number): string {
    // Si el monto es inválido, devuelve vacío
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    
    // Formatea usando el API de internacionalización de JavaScript
    // Ejemplo: 25000 → "$25,000.00"
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  }

  // ============================================
  // schedule - Navega al formulario de cita para un vehículo
  // ============================================
  schedule(vehicle: any): void {
    console.log('CatalogoComponent.schedule called with', vehicle);

    // PASO 1: Verificar si hay usuario logueado
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Debes iniciar sesión como cliente para solicitar una cita. Te redirecciono a la pantalla de login.');
      this.router.navigate(['/']); // Redirige al home (login)
      return;
    }

    // PASO 2: Verificar que el usuario sea cliente
    const user = JSON.parse(currentUser);
    if (user.rol !== 'cliente') {
      alert('Solo usuarios con rol de cliente pueden solicitar citas.');
      return;
    }

    // PASO 3: Verificar que el vehículo sea válido
    if (!vehicle || !vehicle.idVehiculo) {
      alert('Vehículo inválido');
      return;
    }

    // PASO 4: Navegar a la página de cita con el ID del vehículo en la URL
    // Usa queryParams para pasar el ID: /cita?id=123
    
    // Intenta con navigate estándar
    this.router.navigate(['/cita'], { queryParams: { id: vehicle.idVehiculo } }).catch(err => {
      console.warn('Router.navigate failed, falling back to navigateByUrl', err);
      
      // Si falla, intenta con navigateByUrl como respaldo
      try {
        this.router.navigateByUrl(`/cita?id=${encodeURIComponent(vehicle.idVehiculo)}`);
      } catch (e) {
        console.error('Fallback navigation also failed', e);
        alert('No fue posible navegar a la pantalla de citas. Refresca la página e intenta nuevamente.');
      }
    });
  }
}