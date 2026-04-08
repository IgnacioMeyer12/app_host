// ============================================
// COMPONENTE HOME (HomeComponent)
// ============================================
// ¿Qué hace este código?
// Es el componente principal de la página de inicio. Maneja:
// - Login/logout de usuarios
// - Mapa interactivo con la ubicación de la concesionaria
// - Visualización de sucursales en el mapa
// - Navegación a las diferentes secciones según el rol del usuario
// - Efecto parallax en el header
// ============================================

import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Para formularios reactivos
import { HttpClient } from '@angular/common/http'; // Para peticiones HTTP
import { Router, RouterModule } from '@angular/router'; // Para navegación
import { CommonModule } from '@angular/common'; // Para directivas como *ngIf, *ngFor
import { MapService } from '../services/map.service'; // Servicio personalizado para mapas
import { SucursalesService } from '../services/sucursales.service'; // Servicio para sucursales
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',                          // Etiqueta HTML: <app-home>
  standalone: true,                               // Componente independiente
  imports: [ReactiveFormsModule, RouterModule, CommonModule], // Módulos que necesita
  templateUrl: './home.component.html',            // HTML del componente (archivo externo)
  styleUrls: ['./home.component.css']              // Estilos del componente
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
    // Navega al ranking de vendedores
    verTopVendedores() {
      this.router.navigate(['/top-vendedores']);
    }
  // ============================================
  // PROPIEDADES DE ESTADO
  // ============================================
  loading = false;                 // Controla estado de carga en login
  currentYear = new Date().getFullYear(); // Año actual para el footer
  loginForm: FormGroup;            // Formulario reactivo para login
  errorMessage = '';               // Mensajes de error en login
  isLoggedIn = false;              // Indica si hay usuario logueado
  currentUser: any = null;         // Datos del usuario actual
  isAdmin = false;                 // Indica si el usuario tiene rol admin
  mapInitialized = false;          // Controla si el mapa ya se inicializó
  mapError = false;                // Controla si hubo error al cargar mapa
  serverOnline = true;             // Controla si el backend responde

  sucursales: any[] = [];          // Lista de sucursales cargadas
  selectedSucursal: any = null;    // Sucursal seleccionada en el mapa

  // ============================================
  // COORDENADAS EXACTAS DE LA CONCESIONARIA
  // Amenábar 2469, Rosario, Santa Fe
  // ============================================
  private readonly AMENABAR_LAT = -32.970833;   // Latitud exacta
  private readonly AMENABAR_LNG = -60.649444;   // Longitud exacta
  private readonly AMENABAR_ZOOM = 18;          // Nivel de zoom (muy cercano)

  private _onScroll: any; // Referencia al evento scroll para limpiarlo después

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias y configura formulario
  // ============================================
  constructor(
    private fb: FormBuilder,           // Para crear formularios reactivos
    private http: HttpClient,           // Para peticiones HTTP
    private router: Router,             // Para navegar entre páginas
    private mapService: MapService,     // Servicio de mapas
    private sucursalesService: SucursalesService // Servicio de sucursales
  ) {
    // Configura el formulario de login con validaciones
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(7)]],      // DNI obligatorio, mínimo 7 caracteres
      password: ['', [Validators.required, Validators.minLength(6)]]  // Password obligatorio, mínimo 6 caracteres
    });
  }

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {
    // Asegura que el usuario siempre vea el inicio de la página al entrar
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    this.checkLoginStatus(); // Verifica si hay sesión activa en localStorage
    this.checkServerStatus(); // Verifica que el backend esté online
    this.refrescarSucursales(); // Recarga sucursales (para detectar cambios)
  }

  // ============================================
  // ngAfterViewInit - Se ejecuta después de que la vista se renderizó
  // Útil para inicializar elementos que dependen del DOM
  // ============================================
  ngAfterViewInit(): void {
    this.initParallaxEffect(); // Efecto parallax en el header
    
    // Pequeño delay para asegurar que el DOM está completamente listo
    setTimeout(() => {
      this.initializeMap(); // Inicializa el mapa
    }, 500);
  }

  // ============================================
  // ngOnDestroy - Se ejecuta al destruir el componente (limpieza)
  // Evita memory leaks eliminando event listeners y mapas
  // ============================================
  ngOnDestroy(): void {
    // Limpia event listeners para evitar memory leaks
    if (this._onScroll) {
      window.removeEventListener('scroll', this._onScroll);
    }
    this.mapService.destroyMap(); // Destruye el mapa para liberar recursos
  }

  // ============================================
  // MÉTODOS DEL MAPA
  // ============================================

  /**
   * Inicializa el mapa con la ubicación de la concesionaria
   * Usa el MapService para crear un mapa profesional con marcador
   */
  initializeMap(): void {
    const mapElement = document.getElementById('location-map');
    
    if (!mapElement) {
      console.error('❌ Elemento #location-map no encontrado');
      this.mapError = true;
      this.showMapFallback(); // Muestra versión de respaldo (sin mapa)
      return;
    }

    if (this.mapInitialized) {
      console.log('⚠️ El mapa ya está inicializado');
      return;
    }

    // Llama al servicio para inicializar el mapa
    this.mapService.initMap(
      'location-map',                       // ID del elemento contenedor
      this.AMENABAR_LAT,                     // Latitud
      this.AMENABAR_LNG,                     // Longitud
      'Automotores Meyer'                    // Título
    ).then(() => {
      this.mapInitialized = true;
      this.mapError = false;
      console.log('✅ Mapa inicializado correctamente en Amenábar 2469');
      
      // Carga las sucursales en el mapa
      this.cargarSucursalesEnMapa();
      
      // Centra el mapa en la ubicación exacta con un pequeño delay
      setTimeout(() => {
        this.mapService.setView(this.AMENABAR_LAT, this.AMENABAR_LNG, this.AMENABAR_ZOOM);
      }, 200);
    }).catch((error) => {
      console.error('❌ Error al inicializar el mapa:', error);
      this.mapError = true;
      this.showMapFallback();
    });
  }

  /**
   * Carga las sucursales activas y las muestra en el mapa
   * Obtiene las sucursales del servicio y las agrega como marcadores
   */
  private cargarSucursalesEnMapa(): void {
    // Pequeño delay para asegurar que Leaflet está completamente cargado
    setTimeout(() => {
      this.sucursalesService.getSucursales().subscribe({
        next: (response) => {
          if (response.success && response.sucursales?.length > 0) {
            console.log(`📍 Cargando ${response.sucursales.length} sucursales en el mapa`);
            this.sucursales = response.sucursales;
            this.mapService.setOnSucursalClick((sucursal: any) => this.selectSucursal(sucursal));
            this.mapService.addSucursales(response.sucursales);
            if (!this.selectedSucursal && response.sucursales.length > 0) {
              this.selectSucursal(response.sucursales[0]);
            }
          }
        },
        error: (error) => {
          console.warn('⚠️ No se pudieron cargar las sucursales:', error);
        }
      });
    }, 300);
  }

  selectSucursal(sucursal: any): void {
    if (!sucursal) return;
    this.selectedSucursal = sucursal;
    this.mapService.setView(parseFloat(sucursal.latitud), parseFloat(sucursal.longitud), 16);
  }

  getSucursalField(field: string, fallback: string): string {
    if (this.selectedSucursal && this.selectedSucursal[field]) {
      return String(this.selectedSucursal[field]);
    }
    return fallback;
  }

  /**
   * Refresca las sucursales (limpia y vuelve a cargar)
   * Útil cuando se agrega/elimina una sucursal
   */
  private refrescarSucursales(): void {
    if (this.mapInitialized) {
      console.log('🔄 Refrescando sucursales en el mapa...');
      this.mapService.clearMarkers();
      this.cargarSucursalesEnMapa();
    }
  }

  /**
   * Muestra versión de respaldo cuando el mapa no puede cargarse
   * Fallback visual con información de contacto y enlaces
   */
  private showMapFallback(): void {
    const mapElement = document.getElementById('location-map');
    if (mapElement) {
      mapElement.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(145deg, #f8fafc, #f1f5f9); border-radius: 20px; padding: 30px; text-align: center;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #2563eb, #1e40af); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            <i class="fas fa-map-marked-alt" style="font-size: 36px; color: white;"></i>
          </div>
          <h3 style="color: #0f172a; font-size: 24px; font-weight: 700;">Automotores Meyer</h3>
          <p style="color: #475569;">Amenábar 2469, Rosario</p>
          <p style="color: #64748b;">📞 341 383 8911</p>
          <div style="display: flex; gap: 16px; margin-top: 16px;">
            <a href="https://www.openstreetmap.org/?mlat=${this.AMENABAR_LAT}&mlon=${this.AMENABAR_LNG}#map=18/${this.AMENABAR_LAT}/${this.AMENABAR_LNG}" 
               target="_blank" class="btn btn-primary">Ver mapa</a>
          </div>
        </div>
      `;
    }
  }

  /**
   * Reintenta cargar el mapa si hubo error
   */
  retryMap(): void {
    this.mapError = false;
    this.mapInitialized = false;
    this.initializeMap();
  }

  // ============================================
  // MÉTODOS DE LOGIN/AUTENTICACIÓN
  // ============================================

  /**
   * Efecto parallax en el header al hacer scroll
   * Hace que el header se mueva más lento que el scroll para efecto visual
   */
  private initParallaxEffect(): void {
    this._onScroll = () => {
      const header = document.querySelector('.header-content') as HTMLElement;
      const scrollPosition = window.scrollY;
      if (header && scrollPosition < 600) {
        header.style.transform = `translateY(${scrollPosition * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', this._onScroll);
  }

  /**
   * Verifica si hay usuario logueado en localStorage
   * Al iniciar el componente, revisa si existe currentUser
   */
  checkLoginStatus(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isLoggedIn = true;
        // actualizar banderas de rol
        this.isAdmin = this.currentUser?.rol === 'admin';
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Verifica que el backend esté disponible vía endpoint de healthcheck
   */
  checkServerStatus(): void {
    this.http.get<any>(`${environment.apiUrl}/health`).subscribe({
      next: () => {
        this.serverOnline = true;
      },
      error: (error) => {
        console.error('Error al verificar estado del servidor:', error);
        this.serverOnline = false;
        this.showToast('No se puede conectar al servidor backend', 'error');
      }
    });
  }

  /**
   * Procesa el formulario de login
   * Envía credenciales al backend y maneja la respuesta
   */
  onLogin(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      const loginData = this.loginForm.value;
      
      this.http.post(`${environment.apiUrl}/auth/login`, loginData).subscribe({
        next: (response: any) => {
          this.loading = false;
          
          if (response.success) {
            // Guardar token y usuario en localStorage para mantener sesión
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUser = response.user;
            this.isLoggedIn = true;
            // actualizar banderas de rol
            this.isAdmin = this.currentUser?.rol === 'admin';
            this.loginForm.reset();

            // Asegura que siempre se vuelva al inicio de la página al loguearse
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          } else {
            this.errorMessage = response.message || 'Error en el login';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Login error:', error);
          
          if (error.status === 0) {
            this.errorMessage = 'No se puede conectar al servidor.';
          } else if (error.status === 401) {
            this.errorMessage = 'Credenciales incorrectas.';
          } else {
            this.errorMessage = 'Error del servidor. Intente nuevamente.';
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  /**
   * Cierra la sesión del usuario
   * Elimina el usuario de localStorage y actualiza el estado
   */
  onLogout(): void {
    localStorage.removeItem('currentUser');
    this.isLoggedIn = false;
    this.currentUser = null;
    this.isAdmin = false;
    this.loginForm.reset();

    // Asegura que el scroll vuelva al principio al cerrar sesión
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  /**
   * Llena el formulario con credenciales de ejemplo (útil para pruebas)
   * @param type 'admin', 'cliente' o 'vendedor' - qué tipo de usuario cargar
   */
  fillDemoCredentials(type: 'admin' | 'cliente' | 'vendedor'): void {
    if (type === 'admin') {
      this.loginForm.patchValue({
        dni: '12345678',
        password: 'admin123'
      });
    } else if (type === 'cliente') {
      this.loginForm.patchValue({
        dni: '87654321',
        password: 'cliente123'
      });
    } else if (type === 'vendedor') {
      this.loginForm.patchValue({
        dni: '11111111',
        password: 'vendedor123'
      });
    }
    this.errorMessage = '';
  }

  /**
   * Copia texto al portapapeles
   * @param text Texto a copiar
   */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copiado al portapapeles');
    }).catch(() => {
      this.showToast('Error al copiar', 'error');
    });
  }

  /**
   * Muestra una notificación temporal (toast)
   * @param message Mensaje a mostrar
   * @param type 'success' o 'error'
   */
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============================================
  // MÉTODOS DE NAVEGACIÓN
  // Redirigen a los diferentes componentes de la aplicación
  // ============================================
  
  private showAuthError(message: string): void {
    this.showToast(message, 'error');
  }

  private requireLogin(): boolean {
    if (!this.isLoggedIn || !this.currentUser) {
      this.showAuthError('Debes iniciar sesión para usar esta opción');
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }

  private requireRole(role: string): boolean {
    if (!this.requireLogin()) {
      return false;
    }
    if (this.currentUser?.rol !== role) {
      this.showAuthError('No tienes permisos para acceder a esta opción');
      return false;
    }
    return true;
  }

  /** Navega al catálogo de vehículos (abierto) */
  verVehiculos(): void { this.router.navigate(['/catalogo']); }

  /** Navega al catálogo desde panel admin */
  administrarVehiculos(): void { this.router.navigate(['/catalogo']); }

  /** Navega al panel de administración de vendedores */
  administrarVendedores(): void {
    if (this.requireRole('admin')) {
      this.router.navigate(['/administrar-vendedores']);
    }
  }

  /** Navega al panel de administración de marcas */
  administrarMarcas(): void {
    if (this.requireRole('admin')) {
      this.router.navigate(['/administrar-marcas']);
    }
  }

  /** Navega al formulario de solicitud de cita (cliente) */
  realizarCita(): void {
    if (this.requireRole('cliente')) {
      this.router.navigate(['/cita']);
    }
  }

  /** Navega a la lista de citas del cliente */
  verMisCitas(): void {
    if (this.requireRole('cliente')) {
      this.router.navigate(['/mis-citas']);
    }
  }

  /** Navega a las citas asignadas del vendedor */
  verVendedorCitas(): void {
    if (this.requireRole('vendedor')) {
      this.router.navigate(['/vendedor-citas']);
    }
  }

  /** Navega a las calificaciones del vendedor */
  verMisCalificaciones(): void {
    if (this.requireRole('vendedor')) {
      this.router.navigate(['/vendedor-calificaciones']);
    }
  }

  /** Navega a las conversaciones de vendedor/cliente */
  verMisConversaciones(): void {
    if (this.requireLogin()) {
      const rol = this.currentUser?.rol;
      if (rol === 'vendedor' || rol === 'cliente') {
        this.router.navigate(['/vendedor-conversaciones']);
      } else {
        this.showAuthError('No tienes permiso para ver conversaciones');
      }
    }
  }

  /** Navega al registro de administradores (solo admin) */
  darAltaAdmin(): void {
    if (this.requireRole('admin')) {
      this.router.navigate(['/register'], { queryParams: { as: 'admin' } });
    }
  }

  /** Navega al registro de vendedores (solo admin) */
  darAltaVendedor(): void {
    if (this.requireRole('admin')) {
      this.router.navigate(['/register'], { queryParams: { as: 'vendedor' } });
    }
  }

  /** Navega a la gestión de citas (solo admin) */
  verCitas(): void {
    if (this.requireRole('admin')) {
      this.router.navigate(['/citas']);
    }
  }

  /** Navega al formulario de alta de vehículos (solo admin) */
  darAltaVehiculo(): void {
    if (this.requireRole('admin')) {
      this.router.navigate(['/alta-vehiculo']);
    }
  }

  /** Navega a la gestión de sucursales (solo admin) */
  administrarSucursales(): void {
    if (this.requireRole('admin')) {
      this.router.navigate(['/administrar-sucursales']);
    }
  }

  /**
   * Maneja errores de carga de imágenes (carga una imagen por defecto)
   * @param event Evento de error de imagen
   */
  handleImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=800&fit=crop';
  }
}