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
import { FormsModule } from '@angular/forms';         // Para ngModel en formularios
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-catalogo',           // Etiqueta HTML: <app-catalogo>
  standalone: true,                    // Componente independiente
  imports: [CommonModule, RouterModule, FormsModule], // Módulos que necesita
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

  // Filtros de búsqueda
  filters = {
    marca: '',
    modelo: '',
    precioMin: '',
    precioMax: '',
    anioMin: '',
    anioMax: '',
    kmMin: '',
    kmMax: '',
    color: '',
    idSucursal: '',
    sucursalTestdrive: false,
    vendedor: '',
    tieneCitas: false,
    tieneConversaciones: false,
    sortBy: 'fecha_creacion',
    sortOrder: 'DESC'
  };

  showFilters = false;     // Controla si mostrar el panel de filtros

  // Índice de imagen seleccionada por vehículo (para mostrar varias imágenes)
  selectedImageIndex: Record<string, number> = {};

  sucursales: any[] = [];
  isAdmin = false;
  editVehicleId: string | null = null;
  editVehicleData: any = {
    idSucursal: null,
    activo: true,
    precio: null,
    stock: null,
    fotos: []
  };
  editPhotoUrl = '';
  editMessage = '';
  editError = '';

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
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        this.isAdmin = user?.rol === 'admin';
      } catch {
        this.isAdmin = false;
      }
    }

    // Carga las sucursales y vehículos apenas se abre la página
    this.fetchSucursales();
    this.fetchVehicles();
  }

  // ============================================
  // fetchSucursales - Obtiene las sucursales para filtro
  // ============================================
  fetchSucursales(): void {
    this.http.get(`${environment.apiUrl}/sucursales`).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.sucursales = res.sucursales || [];
        }
      },
      error: (err: any) => {
        console.error('Error cargando sucursales:', err);
      }
    });
  }

  // ============================================
  // fetchVehicles - Obtiene los vehículos del backend con filtros
  // ============================================
  fetchVehicles(): void {
    this.loading = true;  // Activa el spinner
    this.error = '';      // Limpia errores anteriores

    // Construir parámetros de consulta
    const params: any = {};

    if (this.filters.marca) params.marca = this.filters.marca;
    if (this.filters.modelo) params.modelo = this.filters.modelo;
    if (this.filters.precioMin) params.precioMin = this.filters.precioMin;
    if (this.filters.precioMax) params.precioMax = this.filters.precioMax;
    if (this.filters.anioMin) params.anioMin = this.filters.anioMin;
    if (this.filters.anioMax) params.anioMax = this.filters.anioMax;
    if (this.filters.kmMin) params.kmMin = this.filters.kmMin;
    if (this.filters.kmMax) params.kmMax = this.filters.kmMax;
    if (this.filters.color) params.color = this.filters.color;
    if (this.filters.sucursalTestdrive) params.sucursalTestdrive = 'true';
    if (this.filters.vendedor) params.vendedor = this.filters.vendedor;
    if (this.filters.tieneCitas) params.tieneCitas = 'true';
    if (this.filters.tieneConversaciones) params.tieneConversaciones = 'true';
    if (this.filters.idSucursal) params.idSucursal = this.filters.idSucursal;
    params.sortBy = this.filters.sortBy;
    params.sortOrder = this.filters.sortOrder;

    // Petición GET al backend con parámetros de búsqueda
    const endpoint = `${environment.apiUrl}/vehiculos/`;

    this.http.get(endpoint, { params }).subscribe({
      next: (resp: any) => {  // Si la petición es exitosa
        console.log('fetchVehicles respuesta:', resp);
        this.loading = false;

        if (resp && resp.success) {
          // Guarda los vehículos en la propiedad (o array vacío si no hay)
          this.vehicles = (resp.vehiculos || resp.vehicles || []).map((vehicle: any) => ({
            ...vehicle,
            fotos: this.parseFotos(vehicle.fotos)
          }));
          console.log('Vehículos actualizados:', this.vehicles.length);
        } else {
          // Si el backend devuelve error, muestra el mensaje
          this.error = resp.message || 'Error cargando vehículos';
        }
      },
      error: (err) => {  // Si hay error de conexión o servidor
        console.error('Error en fetchVehicles:', err);
        this.loading = false;

        if (err.status === 0) {
          // Error de conexión (servidor no disponible)
          this.error = 'No se puede conectar al servidor.';
        } else {
          // Otro tipo de error (ej: 500, 404)
          this.error = err.error?.message || 'Error cargando vehículos';
        }
      }
    });
  }

  selectedVehicleDetails: any = null;

  // ============================================
  // viewDetails - Muestra todos los detalles del vehículo en panel detalle
  // ============================================
  viewDetails(vehicle: any): void {
    this.selectedVehicleDetails = vehicle;
  }

  cerrarDetalles(): void {
    this.selectedVehicleDetails = null;
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
  // getMainImage - Devuelve la imagen principal seleccionada para un vehículo
  // ============================================
  getMainImage(vehicle: any): string | null {
    if (!vehicle?.fotos || !vehicle.fotos.length) return null;
    const index = this.selectedImageIndex[vehicle.idVehiculo] ?? 0;
    return vehicle.fotos[index] || vehicle.fotos[0];
  }

  // ============================================
  // parseFotos - Asegura que el valor de fotos sea un array de URLs
  // ============================================
  private parseFotos(fotos: any): string[] {
    if (!fotos) return [];
    if (Array.isArray(fotos)) return fotos;
    if (typeof fotos === 'string') {
      try {
        const parsed = JSON.parse(fotos);
        return Array.isArray(parsed) ? parsed : [fotos];
      } catch {
        return [fotos];
      }
    }
    return [String(fotos)];
  }

  // ============================================
  // selectImage - Cambia la imagen principal mostrada en la tarjeta
  // ============================================
  selectImage(vehicle: any, index: number): void {
    if (!vehicle?.idVehiculo) return;
    this.selectedImageIndex[vehicle.idVehiculo] = index;
  }

  // ============================================
  // ADMIN: inicio edición de vehículo
  // ============================================
  editVehicle(vehicle: any): void {
    if (!this.isAdmin) return;

    if (this.editVehicleId === vehicle.idVehiculo) {
      // Cerrar modo edición si se clickea de nuevo
      this.cancelEdit();
      return;
    }

    this.editVehicleId = vehicle.idVehiculo;
    this.editVehicleData = {
      idSucursal: vehicle.idSucursal || null,
      activo: vehicle.activo,
      precio: vehicle.precio,
      stock: vehicle.stock,
      fotos: this.parseFotos(vehicle.fotos)
    };
    this.editPhotoUrl = '';
    this.editMessage = '';
    this.editError = '';
  }

  cancelEdit(): void {
    this.editVehicleId = null;
    this.editVehicleData = { idSucursal: null, activo: true };
    this.editMessage = '';
    this.editError = '';
  }

  saveEdit(): void {
    if (!this.isAdmin || !this.editVehicleId) {
      this.editError = 'Solo administradores pueden editar vehículos.';
      return;
    }

    const payload: any = {
      idSucursal: this.editVehicleData.idSucursal,
      activo: this.editVehicleData.activo,
      precio: this.editVehicleData.precio,
      stock: this.editVehicleData.stock,
      fotos: this.editVehicleData.fotos
    };

    this.http.put(`${environment.apiUrl}/vehiculos/${this.editVehicleId}`, payload).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.editMessage = 'Vehículo actualizado exitosamente.';
          this.editError = '';
          this.cancelEdit();
          this.fetchVehicles();
          setTimeout(() => this.router.navigate(['/']), 1000);
        } else {
          this.editError = res.message || 'No se pudo actualizar el vehículo.';
          this.editMessage = '';
        }
      },
      error: (err: any) => {
        this.editError = err.error?.message || 'Error al actualizar el vehículo.';
        this.editMessage = '';
      }
    });
  }

  addPhotoUrl(): void {
    const url = this.editPhotoUrl?.trim();
    if (!url) {
      this.editError = 'La URL de la imagen no puede quedar vacía.';
      return;
    }
    this.editVehicleData.fotos = this.editVehicleData.fotos || [];
    this.editVehicleData.fotos.push(url);
    this.editPhotoUrl = '';
    this.editError = '';
  }

  removePhoto(index: number): void {
    if (!this.editVehicleData.fotos || index < 0 || index >= this.editVehicleData.fotos.length) {
      return;
    }
    this.editVehicleData.fotos.splice(index, 1);
  }

  deleteVehicle(vehicle: any): void {
    console.log('🚨 deleteVehicle LLAMADO con vehículo:', vehicle);
    console.log('ID del vehículo:', vehicle?.idVehiculo);
    if (!vehicle?.idVehiculo) {
      console.error('❌ ERROR: Vehículo sin ID válido');
      this.editError = 'Vehículo sin ID válido.';
      return;
    }

    // Temporalmente sin confirmación para probar
    // if (!confirm(`¿Estás seguro que querés eliminar el vehículo ${vehicle.marca?.nombre} ${vehicle.modelo}?`)) {
    //   return;
    // }

    console.log('Procediendo con eliminación...');

    console.log('Enviando DELETE request a:', `${environment.apiUrl}/vehiculos/${vehicle.idVehiculo}`);
    this.http.delete(`${environment.apiUrl}/vehiculos/${vehicle.idVehiculo}`).subscribe({
      next: (res: any) => {
        console.log('Respuesta del DELETE:', res);
        if (res && res.success) {
          this.editMessage = 'Vehículo eliminado correctamente.';
          this.editError = '';
          this.cancelEdit();
          console.log('Llamando fetchVehicles después de eliminación');
          this.fetchVehicles();
          setTimeout(() => this.router.navigate(['/']), 1000);
        } else {
          this.editError = res.message || 'No se pudo eliminar el vehículo.';
          this.editMessage = '';
        }
      },
      error: (err: any) => {
        console.error('Error en DELETE request:', err);
        this.editError = err.error?.message || 'Error al eliminar el vehículo.';
        this.editMessage = '';
      }
    });
    this.http.delete(`${environment.apiUrl}/vehiculos/${vehicle.idVehiculo}`).subscribe({
      next: (res: any) => {
        console.log('Respuesta del DELETE:', res);
        if (res && res.success) {
          this.editMessage = 'Vehículo eliminado correctamente.';
          this.editError = '';
          this.cancelEdit();
          console.log('Llamando fetchVehicles después de eliminación');
          this.fetchVehicles();
          setTimeout(() => this.router.navigate(['/']), 1000);
        } else {
          this.editError = res.message || 'No se pudo eliminar el vehículo.';
          this.editMessage = '';
        }
      },
      error: (err: any) => {
        console.error('Error en DELETE request:', err);
        this.editError = err.error?.message || 'Error al eliminar el vehículo.';
        this.editMessage = '';
      }
    });
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

  // ============================================
  // MÉTODOS DE FILTROS
  // ============================================

  // Aplicar filtros y buscar
  applyFilters(): void {
    this.fetchVehicles();
  }

  // Limpiar todos los filtros
  clearFilters(): void {
    this.filters = {
      marca: '',
      modelo: '',
      precioMin: '',
      precioMax: '',
      anioMin: '',
      anioMax: '',
      kmMin: '',
      kmMax: '',
      color: '',
      idSucursal: '',
      sucursalTestdrive: false,
      vendedor: '',
      tieneCitas: false,
      tieneConversaciones: false,
      sortBy: 'fecha_creacion',
      sortOrder: 'DESC'
    };
    this.fetchVehicles();
  }

  // Alternar visibilidad del panel de filtros
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Cambiar ordenamiento
  changeSort(sortBy: string): void {
    if (this.filters.sortBy === sortBy) {
      // Si ya está ordenado por este campo, cambiar dirección
      this.filters.sortOrder = this.filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filters.sortBy = sortBy;
      this.filters.sortOrder = 'DESC'; // Por defecto descendente
    }
    this.fetchVehicles();
  }

  // Obtener texto del ordenamiento actual
  getSortText(): string {
    const fieldNames: { [key: string]: string } = {
      'fecha_creacion': 'Fecha',
      'precio': 'Precio',
      'anio': 'Año',
      'km': 'Kilometraje',
      'modelo': 'Modelo'
    };
    const field = fieldNames[this.filters.sortBy] || 'Fecha';
    const order = this.filters.sortOrder === 'ASC' ? '↑' : '↓';
    return `${field} ${order}`;
  }
}