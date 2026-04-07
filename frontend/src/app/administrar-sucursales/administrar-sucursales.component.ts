// ============================================
// COMPONENTE ADMINISTRAR SUCURSALES (AdministrarSucursalesComponent)
// ============================================
// Permite a los administradores gestionar las sucursales de la concesionaria.
// Incluye:
// - Listado de todas las sucursales (activas e inactivas)
// - Formulario para crear/editar sucursales
// - Selector de ubicación en mapa con búsqueda de direcciones
// - Vista previa antes de guardar
// - Cambiar estado (activa/inactiva) y eliminar sucursales
// ============================================

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms'; // Formularios reactivos
import { CommonModule } from '@angular/common'; // Directivas *ngIf, *ngFor
import { RouterModule, Router } from '@angular/router'; // Navegación
import { SucursalesService, Sucursal } from '../services/sucursales.service'; // Servicio de sucursales
import { MapService } from '../services/map.service'; // Servicio de mapas
import { NotificationService } from '../services/notification.service';

// Interfaz para la vista previa (sin id ni fecha_creacion)
interface PreviewSucursal {
  nombre: string;
  direccion: string;
  telefono: string;
  latitud: number;
  longitud: number;
  horario_inicio: string;
  horario_fin: string;
}

@Component({
  selector: 'app-administrar-sucursales',           // Etiqueta HTML: <app-administrar-sucursales>
  standalone: true,                                   // Componente independiente
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule], // Módulos que necesita
  templateUrl: './administrar-sucursales.component.html', // HTML del componente
  styleUrls: ['./administrar-sucursales.component.css']   // Estilos del componente
})
export class AdministrarSucursalesComponent implements OnInit {
  
  // ============================================
  // PROPIEDADES PRINCIPALES
  // ============================================
  sucursales: Sucursal[] = [];      // Lista completa de sucursales
  loading = false;                    // Estado de carga
  error = '';                         // Mensaje de error
  message = '';                       // Mensaje de éxito/error
  messageType: 'success' | 'error' = 'success'; // Tipo de mensaje
  currentYear = new Date().getFullYear(); // Año actual para el footer

  // ============================================
  // PROPIEDADES DEL FORMULARIO
  // ============================================
  sucursalForm: FormGroup;            // Formulario reactivo
  showForm = false;                    // Controla visibilidad del formulario
  editingId: number | null = null;     // ID de la sucursal que se está editando
  formTitle = 'Agregar Nueva Sucursal'; // Título dinámico del formulario

  // ============================================
  // PROPIEDADES DEL WORKFLOW (verificación/preview)
  // ============================================
  isVerified = false;                   // Indica si ya se verificó el formulario
  previewSucursal: PreviewSucursal | null = null; // Datos para preview

  // ============================================
  // PROPIEDADES DEL MAPA SELECTOR
  // ============================================
  showMapSelector = false;               // Muestra/oculta el selector de mapa
  mapInitialized = false;                 // Indica si el mapa ya se inicializó
  locationMapElement: any = null;         // Referencia al elemento del mapa
  selectedLatitude: number | null = null; // Latitud seleccionada
  selectedLongitude: number | null = null; // Longitud seleccionada
  selectedAddress = '';                    // Dirección de la ubicación seleccionada
  searchAddress = '';                      // Dirección ingresada para buscar
  searchError = '';                         // Error en la búsqueda

  // ============================================
  // PROPIEDADES DE SEGURIDAD (verificación de admin)
  // ============================================
  isAdmin = false;                         // Indica si el usuario es admin
  currentUser: any = null;                  // Datos del usuario actual

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias y crea formulario
  // ============================================
  constructor(
    private fb: FormBuilder,                    // Para formularios reactivos
    private sucursalesService: SucursalesService, // Servicio de sucursales
    private mapService: MapService,              // Servicio de mapas
    private router: Router,                      // Para navegación
    private notificationService: NotificationService
  ) {
    // Configura el formulario con validaciones
    this.sucursalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      direccion: [''],
      telefono: [''],
      latitud: ['', [Validators.required]],
      longitud: ['', [Validators.required]],
      horario_inicio: ['09:00', [Validators.required, Validators.pattern('^([01]\\d|2[0-3]):([0-5]\\d)$')]],
      horario_fin: ['18:00', [Validators.required, Validators.pattern('^([01]\\d|2[0-3]):([0-5]\\d)$')]]
    });
  }

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {
    this.checkAdmin();      // Verifica que el usuario sea admin
    this.cargarSucursales(); // Carga la lista de sucursales
  }

  // ============================================
  // checkAdmin - Verifica permisos de administrador
  // ============================================
  checkAdmin(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isAdmin = this.currentUser.rol === 'admin';
        if (!this.isAdmin) {
          this.error = 'Acceso denegado. Solo administradores pueden acceder a esta sección.';
          setTimeout(() => this.router.navigate(['/home']), 2000);
        }
      } catch (error) {
        this.error = 'Error al verificar permisos.';
        this.router.navigate(['/home']);
      }
    } else {
      this.error = 'Debes iniciar sesión.';
      setTimeout(() => this.router.navigate(['/home']), 2000);
    }
  }

  // ============================================
  // cargarSucursales - Obtiene todas las sucursales del backend
  // ============================================
  cargarSucursales(): void {
    this.loading = true;
    this.error = '';
    
    this.sucursalesService.getSucursalesTodas().subscribe({
      next: (response) => {
        if (response.success) {
          this.sucursales = response.sucursales;
        } else {
          this.error = 'Error al cargar las sucursales.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al conectar con el servidor.';
        this.loading = false;
      }
    });
  }

  // ============================================
  // toggleForm - Muestra/oculta el formulario
  // ============================================
  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm(); // Si se oculta, resetea todo
      this.showMapSelector = false;
      this.mapInitialized = false;
      this.isVerified = false;
      this.selectedAddress = '';
    }
  }

  // ============================================
  // resetForm - Resetea el formulario a su estado inicial
  // ============================================
  resetForm(): void {
    this.sucursalForm.reset();
    this.editingId = null;
    this.formTitle = 'Agregar Nueva Sucursal';
    this.selectedLatitude = null;
    this.selectedLongitude = null;
    this.selectedAddress = '';
    this.searchAddress = '';
    this.searchError = '';
    this.isVerified = false;
    this.previewSucursal = null;
    this.message = '';
  }

  // ============================================
  // onSubmit - Procesa el formulario (VERIFICAR)
  // ============================================
  async onSubmit(): Promise<void> {
    if (this.sucursalForm.valid) {
      this.loading = true;
      try {
        // Obtener dirección a partir de coordenadas (reverse geocoding)
        const direccion = await this.getReverseGeocoding(
          this.sucursalForm.get('latitud')?.value,
          this.sucursalForm.get('longitud')?.value
        );

        // Actualizar el formulario con la dirección obtenida
        if (direccion) {
          this.sucursalForm.patchValue({ direccion });
        }

        // Crear objeto para preview
        this.previewSucursal = {
          nombre: this.sucursalForm.get('nombre')?.value,
          direccion: this.sucursalForm.get('direccion')?.value || direccion || 'Dirección no disponible',
          telefono: this.sucursalForm.get('telefono')?.value || '-',
          latitud: this.sucursalForm.get('latitud')?.value,
          longitud: this.sucursalForm.get('longitud')?.value,
          horario_inicio: this.sucursalForm.get('horario_inicio')?.value,
          horario_fin: this.sucursalForm.get('horario_fin')?.value
        };

        this.isVerified = true;
        this.loading = false;

        // Scroll suave hacia el preview
        setTimeout(() => {
          const preview = document.getElementById('preview');
          if (preview) preview.scrollIntoView({ behavior: 'smooth' });
        }, 100);

      } catch (error) {
        console.error('Error en verificación:', error);
        this.error = 'Error al obtener la dirección. Verifica las coordenadas.';
        this.loading = false;
      }
    } else {
      this.sucursalForm.markAllAsTouched(); // Marca todos los campos para mostrar errores
    }
  }

  // ============================================
  // getReverseGeocoding - Obtiene dirección a partir de coordenadas
  // ============================================
  private async getReverseGeocoding(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'AutomotoresMeyer/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      } else if (data.address) {
        const address = data.address;
        const parts = [];
        if (address.road) parts.push(address.road);
        if (address.house_number) parts.push(address.house_number);
        if (address.city || address.town || address.village) {
          parts.push(address.city || address.town || address.village);
        }
        if (address.state) parts.push(address.state);
        return parts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Error en reverse geocoding:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  // ============================================
  // editar - Vuelve al modo edición desde preview
  // ============================================
  editar(): void {
    this.isVerified = false;
    window.scrollTo(0, 0);
  }

  // ============================================
  // register - Confirma y guarda la sucursal
  // ============================================
  register(): void {
    if (this.previewSucursal) {
      this.guardarSucursal();
    }
  }

  // ============================================
  // editarSucursal - Carga una sucursal existente para editar
  // ============================================
  editarSucursal(sucursal: Sucursal): void {
    this.editingId = sucursal.id;
    this.formTitle = `Editar Sucursal: ${sucursal.nombre}`;
    this.sucursalForm.patchValue({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      latitud: sucursal.latitud,
      longitud: sucursal.longitud,
      horario_inicio: sucursal.horario_inicio || '09:00',
      horario_fin: sucursal.horario_fin || '18:00'
    });
    this.selectedLatitude = sucursal.latitud;
    this.selectedLongitude = sucursal.longitud;
    this.selectedAddress = sucursal.direccion || '';
    this.isVerified = false;
    this.previewSucursal = null;
    this.showForm = true;
    window.scrollTo(0, 0);
  }

  // ============================================
  // FUNCIONALIDAD DE MAPA SELECTOR
  // ============================================

  // Abre el selector de ubicación en el mapa
  abrirSelectorUbicacion(): void {
    this.showMapSelector = true;
    this.mapService.destroyMap(); // Destruye mapa anterior
    this.mapInitialized = false;
    
    setTimeout(() => {
      this.initializarMapaSelectorUbicacion();
    }, 200);
  }

  // Inicializa el mapa selector
  private initializarMapaSelectorUbicacion(): void {
    const mapElement = document.getElementById('location-selector-map');
    
    if (!mapElement) {
      this.searchError = 'Elemento del mapa no encontrado';
      return;
    }

    mapElement.innerHTML = ''; // Limpia el elemento

    // Coordenadas por defecto (Rosario) o las seleccionadas
    const lat = this.selectedLatitude || -32.970833;
    const lng = this.selectedLongitude || -60.649444;

    this.mapService.initMap('location-selector-map', lat, lng, 'Selecciona una ubicación')
      .then(() => {
        this.mapInitialized = true;
        this.setupMapClickListener();
        
        if (this.selectedLatitude && this.selectedLongitude) {
          this.mapService.updateLocation(this.selectedLatitude, this.selectedLongitude, this.selectedAddress);
        }
      })
      .catch((error) => {
        console.error('❌ Error inicializando mapa:', error);
        this.searchError = 'Error al cargar el mapa. Intenta nuevamente.';
        this.mapInitialized = false;
      });
  }

  // Configura el listener de click en el mapa
  private setupMapClickListener(): void {
    const map = this.mapService.getMap();
    if (!map) return;

    map.on('click', async (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      this.selectedLatitude = lat;
      this.selectedLongitude = lng;
      
      try {
        const address = await this.getReverseGeocoding(lat, lng);
        this.selectedAddress = address;
        this.mapService.updateLocation(lat, lng, address);
      } catch (error) {
        console.error('Error obteniendo dirección:', error);
        this.mapService.updateLocation(lat, lng, '');
      }
    });
  }

  // Busca una dirección usando Nominatim
  buscarUbicacion(): void {
    if (!this.searchAddress.trim()) {
      this.searchError = 'Ingresa una dirección para buscar en el Gran Rosario';
      return;
    }

    this.loading = true;
    this.searchError = '';

    const query = encodeURIComponent(`${this.searchAddress}, Santa Fe, Argentina`);
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=ar`, {
      headers: { 'User-Agent': 'AutomotoresMeyer/1.0' }
    })
      .then(response => response.json())
      .then((data: any) => {
        this.loading = false;
        
        if (data && data.length > 0) {
          const result = data[0];
          this.selectedLatitude = parseFloat(result.lat);
          this.selectedLongitude = parseFloat(result.lon);
          this.selectedAddress = result.display_name || this.searchAddress;

          // Actualizar formulario
          this.sucursalForm.patchValue({
            latitud: this.selectedLatitude,
            longitud: this.selectedLongitude,
            direccion: this.selectedAddress
          });

          // Recargar el mapa con la nueva ubicación
          this.mapService.destroyMap();
          this.mapInitialized = false;
          setTimeout(() => this.abrirSelectorUbicacion(), 100);
          
          this.searchError = '';
        } else {
          this.searchError = 'No se encontró la dirección. Verifica e intenta nuevamente.';
        }
      })
      .catch(error => {
        this.loading = false;
        console.error('❌ Error en búsqueda:', error);
        this.searchError = 'Error al buscar la dirección. Por favor, intenta nuevamente.';
      });
  }

  // Confirma la ubicación seleccionada y cierra el selector
  confirmarUbicacion(): void {
    if (this.selectedLatitude && this.selectedLongitude) {
      this.sucursalForm.patchValue({
        latitud: this.selectedLatitude,
        longitud: this.selectedLongitude,
        direccion: this.selectedAddress || ''
      });
      this.showMapSelector = false;
      this.mapService.destroyMap();
      this.mapInitialized = false;
    }
  }

  // Cierra el selector sin guardar
  cerrarSelectorUbicacion(): void {
    this.showMapSelector = false;
    this.mapService.destroyMap();
    this.mapInitialized = false;
  }

  // ============================================
  // guardarSucursal - Guarda (crea o actualiza) la sucursal
  // ============================================
  private guardarSucursal(): void {
    if (this.sucursalForm.valid) {
      this.loading = true;
      const datos = this.sucursalForm.value;

      if (this.editingId) {
        // ACTUALIZAR sucursal existente
        this.sucursalesService.actualizarSucursal(this.editingId, datos).subscribe({
          next: (response) => {
            if (response.success) {
              this.message = 'Sucursal actualizada correctamente';
              this.messageType = 'success';
              this.isVerified = false;
              this.showForm = false;
              this.cargarSucursales();
              setTimeout(() => this.message = '', 3000);
            } else {
              this.error = response.message || 'Error al actualizar';
              this.messageType = 'error';
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error:', error);
            this.error = 'Error al conectar con el servidor';
            this.messageType = 'error';
            this.loading = false;
          }
        });
      } else {
        // CREAR nueva sucursal
        this.sucursalesService.crearSucursal(datos).subscribe({
          next: (response) => {
            if (response.success) {
              this.message = this.notificationService.success('Sucursal creada correctamente');
              this.messageType = 'success';
              this.isVerified = false;
              this.showForm = false;
              this.resetForm();
              this.cargarSucursales();
              setTimeout(() => this.message = '', 3000);
            } else {
              this.error = response.message || 'Error al crear';
              this.messageType = 'error';
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error:', error);
            this.error = 'Error al conectar con el servidor';
            this.messageType = 'error';
            this.loading = false;
          }
        });
      }
    }
  }

  // ============================================
  // eliminarSucursal - Elimina una sucursal (con confirmación)
  // ============================================
  eliminarSucursal(id: number, nombre: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la sucursal "${nombre}"?`)) {
      this.loading = true;
      this.sucursalesService.eliminarSucursal(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.error = '';
            this.cargarSucursales();
          } else {
            this.error = response.message;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.error = 'Error al eliminar la sucursal.';
          this.loading = false;
        }
      });
    }
  }

  // ============================================
  // cambiarEstado - Activa/desactiva una sucursal
  // ============================================
  cambiarEstado(sucursal: Sucursal): void {
    const nuevoEstado = !sucursal.activa;
    this.loading = true;
    this.sucursalesService.actualizarSucursal(sucursal.id, { activa: nuevoEstado }).subscribe({
      next: (response) => {
        if (response.success) {
          this.error = '';
          this.cargarSucursales();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al cambiar el estado.';
        this.loading = false;
      }
    });
  }

  // ============================================
  // openInMap - Abre la ubicación en OpenStreetMap
  // ============================================
  openInMap(latitud: number, longitud: number): void {
    window.open(`https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=18/${latitud}/${longitud}`, '_blank');
  }

  // ============================================
  // volver - Navega a home
  // ============================================
  volver(): void {
    this.router.navigate(['/home']);
  }
}