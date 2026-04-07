// ============================================
// COMPONENTE CITA (CitaComponent)
// ============================================
// Permite a los clientes agendar una cita para ver vehículos.
// Muestra un formulario con: selección de vehículo, fecha, horario disponible y motivo.
// Valida que el usuario esté logueado, que la fecha sea válida y que el horario esté libre.
// Se comunica con el backend para obtener vehículos, horarios disponibles y guardar la cita.
// ============================================

/* IMPORTACIONES DE ANGULAR */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';       // Para directivas *ngIf, *ngFor
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; // Para navegación y parámetros URL
import { HttpClient } from '@angular/common/http';    // Para peticiones HTTP
import { FormsModule } from '@angular/forms';         // Para usar [(ngModel)] en formularios
import { NotificationService } from '../services/notification.service';
import { SucursalesService } from '../services/sucursales.service';

/* DECORADOR DEL COMPONENTE */
@Component({
  selector: 'app-cita',                          // Etiqueta HTML: <app-cita>
  standalone: true,                               // Componente independiente
  imports: [CommonModule, RouterModule, FormsModule], // Módulos que necesita
  templateUrl: './cita.component.html',            // HTML del componente
  styleUrls: ['./cita.component.css']              // Estilos del componente
})

/* CLASE DEL COMPONENTE */
export class CitaComponent implements OnInit {
  
  // ============================================
  // PROPIEDADES - Datos que usa el HTML
  // ============================================
  
  vehicles: any[] = [];                    // Lista de vehículos disponibles
  selectedVehicleId: number | null = null;  // ID del vehículo seleccionado
  fecha = '';                               // Fecha seleccionada (YYYY-MM-DD)
  hora = '';                                 // Hora seleccionada (HH:MM)
  motivo = 'Consulta por vehículo';          // Motivo de la cita
  motivos = ['Consulta por vehículo', 'Prueba de vehículo', 'Asesoramiento', 'Otro']; // Opciones de motivo
  minFecha = '';                             // Fecha mínima permitida (hoy)
  minHora = '';                               // Hora mínima permitida (si es hoy)

  loading = false;                            // Estado de carga
  message = '';                               // Mensaje para el usuario
  messageType: 'success' | 'error' = 'success'; // Tipo de mensaje (verde/rojo)
  showFeedback = false;                       // Control de visibilidad del mensaje + botón

  slots: Array<{ time: string, available: boolean }> = []; // Horarios disponibles
  selectedSlot: string | null = null;          // Horario seleccionado

  selectedVehicleIdFromUrl: number | null = null; // Para almacenar temporalmente el ID de la URL
  selectedVehicle: any = null;                 // Vehículo seleccionado completo
  selectedSucursal: any = null;                // Sucursal del vehículo seleccionado
  horarioInicio = '';                          // Horario de apertura de la sucursal
  horarioFin = '';                             // Horario de cierre de la sucursal

  vendors: any[] = [];                         // Lista de vendedores de la sucursal seleccionada
  selectedVendorId: number | null = null;      // Vendedor elegido por el cliente
  selectedVendor: any = null;                  // Vendedor elegido completo

  sucursales: any[] = [];                      // Lista de sucursales disponibles
  selectedSucursalId: number | null = null;    // Sucursal seleccionada para asesoramiento
  selectedSucursalForAsesoramiento: any = null; // Sucursal completa para asesoramiento

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias
  // ============================================
  constructor(
    private http: HttpClient,      // Para peticiones HTTP
    public router: Router,          // Para navegar entre páginas
    private route: ActivatedRoute,  // Para leer parámetros de la URL
    private notificationService: NotificationService,
    private sucursalesService: SucursalesService
  ) {}

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {
    // Fecha mínima = hoy (fecha local, no UTC)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.minFecha = `${year}-${month}-${day}`; // Formato YYYY-MM-DD (local)

    // Hora mínima = ahora
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    this.minHora = `${hours}:${minutes}`;

    // Verificar si viene un ID de vehículo en la URL (ej: ?id=123)
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.selectedVehicleIdFromUrl = Number(params['id']);
      }
    });

    // Cargar la lista de vehículos
    this.fetchVehicles();

    // Cargar sucursales para asesoramiento
    this.fetchSucursales();

    // Inicializar vendedores basado en el motivo por defecto
    this.onMotivoChange();
  }

  // ============================================
  // setSelectedVehicle - Guarda datos del vehículo y sucursal seleccionada
  // ============================================
  setSelectedVehicle(): void {
    if (this.selectedVehicleId) {
      this.selectedVehicle = this.vehicles.find(v => v.idVehiculo === Number(this.selectedVehicleId));
      this.selectedSucursal = this.selectedVehicle?.sucursal || null;
      if (this.selectedSucursal) {
        this.horarioInicio = this.selectedSucursal.horario_inicio || this.horarioInicio;
        this.horarioFin = this.selectedSucursal.horario_fin || this.horarioFin;
        // Para motivos que no son asesoramiento, no cambiar la lista de vendedores
        // Mantener todos los vendedores disponibles
      } else {
        this.horarioInicio = '';
        this.horarioFin = '';
      }
    } else {
      this.selectedVehicle = null;
      this.selectedSucursal = null;
      this.horarioInicio = '';
      this.horarioFin = '';
    }
  }

  // ============================================
  // onVehicleChange - Detecta cambio de vehículo en el select
  // ============================================
  onVehicleChange(vehicleId: number | string): void {
    this.selectedVehicleId = Number(vehicleId) || null;
    this.setSelectedVehicle();
    
    // Si hay vehículo seleccionado y el motivo no es asesoramiento, filtrar vendedores por sucursal del vehículo
    if (this.selectedVehicleId && this.motivo !== 'Asesoramiento' && this.selectedSucursal) {
      this.fetchVendedores(this.selectedSucursal.id);
    }
    
    if (this.fecha) {
      this.fetchAvailability(this.fecha);
    }
  }

  // ============================================
  // fetchVehicles - Obtiene vehículos del backend
  // ============================================
  fetchVehicles(): void {
    this.loading = true;
    this.http.get('http://localhost:3001/api/vehiculos').subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp?.success) {
          this.vehicles = resp.vehiculos || [];
          this.setSelectedVehicle();
          
          // Aplicar preselección desde URL si existe
          if (this.selectedVehicleIdFromUrl) {
            this.selectedVehicleId = this.selectedVehicleIdFromUrl;
            this.onVehicleChange(this.selectedVehicleId);
            this.selectedVehicleIdFromUrl = null; // Limpiar para evitar re-ejecución
          }
          
          // Si hay vehículo preseleccionado y motivo no es asesoramiento, filtrar vendedores
          if (this.selectedVehicleId && this.motivo !== 'Asesoramiento' && this.selectedSucursal) {
            this.fetchVendedores(this.selectedSucursal.id);
          }
        } else {
          this.showError(resp.message || 'Error cargando vehículos');
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error al cargar vehículos:', err);

        if (err?.status === 0) {
          this.showError('No se puede conectar al servidor de vehículos. Verifica que backend esté activo.');
        } else {
          this.showError(err?.error?.message || 'Error conectando al servidor de vehículos');
        }
      }
    });
  }

  // ============================================
  // isWeekendDate - Retorna true si la fecha es sábado o domingo
  // ============================================
  private isWeekendDate(date: string): boolean {
    if (!date) return false;
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // domingo = 0, sábado = 6
  }

  // ============================================
  // fetchAvailability - Obtiene horarios disponibles para una fecha
  // ============================================
  fetchAvailability(date: string): void {
    if (!date) return;
    
    if (this.isWeekendDate(date)) {
      this.showError('No se pueden agendar citas los sábados ni domingos. Elige un día entre lunes y viernes.');
      this.fecha = '';
      this.slots = [];
      this.selectedSlot = null;
      return;
    }

    // Validar que la fecha no sea anterior a hoy (se parsea como fecha LOCAL para evitar desfases de zona horaria)
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() < today.getTime()) {
      this.showError('No puedes seleccionar una fecha anterior a hoy');
      this.fecha = '';
      this.slots = [];
      this.selectedSlot = null;
      return;
    }
    
    // El cliente debe elegir vendedor para ver disponibilidad en su agenda
    if (!this.selectedVendorId) {
      this.showError('Selecciona un vendedor para ver disponibilidad específica de su agenda.');
      this.slots = [];
      return;
    }

    // Parámetros para la petición
    const params: any = { fecha: date };
    if (this.selectedVendorId != null) params.idVendedor = this.selectedVendorId;
    
    if (this.motivo === 'Asesoramiento') {
      // Para asesoramiento, usar sucursal seleccionada
      if (this.selectedSucursalId != null) {
        params.idSucursal = this.selectedSucursalId;
      }
    } else {
      // Para otros motivos, usar vehículo si está seleccionado
      if (this.selectedVehicleId != null) {
        params.idVehiculo = this.selectedVehicleId;
      } else if (this.selectedVendorId != null) {
        // Si no hay vehículo seleccionado pero sí vendedor, obtener sucursal del vendedor
        const selectedVendor = this.vendors.find(v => v.id === this.selectedVendorId);
        if (selectedVendor && selectedVendor.idSucursal) {
          params.idSucursal = selectedVendor.idSucursal;
        }
      }
    }

    // Obtener slots disponibles
    this.http.get('http://localhost:3001/api/citas/availability', { params }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          // El backend devuelve availableSlots en vez de slots
          this.slots = res.availableSlots || res.slots || [];
          this.horarioInicio = res.horarioInicio || this.horarioInicio; // horario sucursal
          this.horarioFin = res.horarioFin || this.horarioFin;

          // Si es hoy, filtrar horas que ya pasaron
          if (selectedDate.getTime() === today.getTime()) {
            const now = new Date();
            this.slots = this.slots.filter(slot => {
              const [hours, minutes] = slot.time.split(':').map(Number);
              const slotTime = new Date();
              slotTime.setHours(hours, minutes, 0, 0);
              return slotTime > now;
            });
          }

          // Limpiar selección si el slot ya no está disponible
          if (this.selectedSlot && !this.slots.find(s => s.time === this.selectedSlot && s.available)) {
            this.selectedSlot = null;
          }
        } else {
          this.showError(res.message || 'Error obteniendo disponibilidad');
        }
      },
      error: (err: any) => {
        console.error('Error obteniendo disponibilidad:', err);

        if (err?.status === 0) {
          this.showError('No se puede conectar al servidor de citas. Verifica que el backend esté disponible.');
        } else {
          this.showError(err?.error?.message || 'Error obteniendo disponibilidad');
        }
      }
    });
  }

  // ============================================
  // selectVendor - Selecciona un vendedor
  // ============================================
  selectVendor(vendorId: number | string): void {
    this.selectedVendorId = Number(vendorId) || null;
    this.selectedVendor = this.vendors.find(v => v.id === this.selectedVendorId) || null;

    // Recalcular disponibilidad para el vendedor seleccionado
    if (this.fecha) {
      this.fetchAvailability(this.fecha);
    }
  }

  // ============================================
  // selectSlot - Selecciona un horario disponible
  // ============================================
  selectSlot(time: string, available: boolean): void {
    if (!available) return;
    
    // Validar que si es hoy, la hora no haya pasado
    if (this.fecha) {
      const [year, month, day] = this.fecha.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() === today.getTime()) {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        
        if (slotTime <= now) {
          this.showError('No puedes seleccionar una hora que ya pasó');
          return;
        }
      }
    }
    
    this.selectedSlot = time;
    this.hora = time; // Sincronizar con propiedad hora para compatibilidad
  }

  // ============================================
  // fetchVendedores - Obtiene vendedores de la sucursal o todos si no se especifica
  // ============================================
  fetchVendedores(idSucursal?: number): void {
    if (idSucursal) {
      // Cargar vendedores de una sucursal específica
      this.http.get(`http://localhost:3001/api/vendedores/sucursal/${idSucursal}`).subscribe({
        next: (res: any) => {
          if (res?.success && Array.isArray(res.vendedores)) {
            this.vendors = res.vendedores;
            if (this.vendors.length > 0) {
              // Mantener selección si pertenece a la sucursal
              const exists = this.vendors.find(v => v.id === this.selectedVendorId);
              this.selectedVendorId = exists ? exists.id : this.vendors[0].id;
              this.selectedVendor = this.vendors.find(v => v.id === this.selectedVendorId) || null;
            } else {
              this.selectedVendorId = null;
              this.selectedVendor = null;
            }
          } else {
            this.vendors = [];
            this.selectedVendorId = null;
            this.selectedVendor = null;
            this.showError('No hay vendedores disponibles en la sucursal seleccionada.');
          }
        },
        error: (err: any) => {
          console.error('Error al cargar vendedores:', err);
          this.vendors = [];
          this.selectedVendorId = null;
          this.selectedVendor = null;
          this.showError(err?.error?.message || 'Error al obtener vendedores.');
        }
      });
    } else {
      // Cargar todos los vendedores
      this.fetchAllVendedores();
    }
  }

  // ============================================
  // fetchAllVendedores - Obtiene todos los vendedores del sistema
  // ============================================
  fetchAllVendedores(): void {
    this.http.get('http://localhost:3001/api/vendedores').subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.vendedores)) {
          this.vendors = res.vendedores;
          if (this.vendors.length > 0 && !this.selectedVendorId) {
            // Seleccionar el primer vendedor por defecto si no hay selección previa
            this.selectedVendorId = this.vendors[0].id;
            this.selectedVendor = this.vendors[0];
          }
        } else {
          this.vendors = [];
          this.selectedVendorId = null;
          this.selectedVendor = null;
          this.showError('No hay vendedores disponibles.');
        }
      },
      error: (err: any) => {
        console.error('Error al cargar vendedores:', err);
        this.vendors = [];
        this.selectedVendorId = null;
        this.selectedVendor = null;
        this.showError(err?.error?.message || 'Error al obtener vendedores.');
      }
    });
  }

  // ============================================
  // fetchSucursales - Obtiene sucursales activas
  // ============================================
  fetchSucursales(): void {
    this.sucursalesService.getSucursales().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.sucursales)) {
          this.sucursales = res.sucursales;
        } else {
          this.sucursales = [];
          this.showError('No hay sucursales disponibles.');
        }
      },
      error: (err: any) => {
        console.error('Error al cargar sucursales:', err);
        this.sucursales = [];
        this.showError(err?.error?.message || 'Error al obtener sucursales.');
      }
    });
  }

  // ============================================
  // onMotivoChange - Maneja cambio de motivo y actualiza UI
  // ============================================
  onMotivoChange(): void {
    // Reset selections
    this.selectedVehicleId = null;
    this.selectedVehicle = null;
    this.selectedSucursalId = null;
    this.selectedSucursalForAsesoramiento = null;
    this.selectedVendorId = null;
    this.selectedVendor = null;
    this.vendors = [];
    this.fecha = '';
    this.selectedSlot = null;
    this.slots = [];

    if (this.motivo === 'Asesoramiento') {
      // Para asesoramiento, mostrar selector de sucursal
      // No cargar vendedores hasta que se seleccione sucursal
    } else {
      // Para otros motivos, mostrar selector de vehículo
      // Cargar todos los vendedores inicialmente
      this.fetchAllVendedores();
    }
  }

  // ============================================
  // onSucursalChange - Maneja cambio de sucursal para asesoramiento
  // ============================================
  onSucursalChange(sucursalId: number | string): void {
    this.selectedSucursalId = Number(sucursalId) || null;
    this.selectedSucursalForAsesoramiento = this.sucursales.find(s => s.id === this.selectedSucursalId) || null;
    
    // Reset vendor selection
    this.selectedVendorId = null;
    this.selectedVendor = null;
    this.fecha = '';
    this.selectedSlot = null;
    this.slots = [];

    if (this.selectedSucursalId) {
      // Cargar vendedores de la sucursal seleccionada
      this.fetchVendedores(this.selectedSucursalId);
    } else {
      this.vendors = [];
    }
  }

  // ============================================
  // showError - Muestra mensaje de error
  // ============================================
  showError(msg: string) {
    this.message = msg;
    this.messageType = 'error';
    this.showFeedback = true;
  }

  // ============================================
  // showSuccess - Muestra mensaje de éxito
  // ============================================
  showSuccess(msg: string) {
    this.message = msg;
    this.messageType = 'success';
    this.showFeedback = true;
  }

  // ============================================
  // goToMenu - Navega al menú principal
  // ============================================
  goToMenu(): void {
    this.router.navigate(['/']);
  }

  // ============================================
  // submit - Envía la cita al backend
  // ============================================
  submit(): void {
    this.message = '';

    // PASO 1: Verificar que el usuario esté logueado
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      this.showError('Debes iniciar sesión para solicitar una cita');
      return;
    }

    const user: any = JSON.parse(currentUser);
    if (user.rol !== 'cliente') {
      this.showError('Solo clientes pueden solicitar citas');
      return;
    }

    // PASO 2: Validar que haya fecha, hora y vendedor seleccionados
    if (!this.fecha || !this.selectedSlot || !this.selectedVendorId) {
      this.showError('Selecciona fecha, horario disponible y un vendedor');
      return;
    }

    // PASO 3: Validar que no sea fin de semana
    if (this.isWeekendDate(this.fecha)) {
      this.showError('No es posible solicitar citas los sábados ni domingos.');
      return;
    }

    // PASO 3: Verificar que el horario SIGA disponible
    this.loading = true;

    const availabilityParams: any = { fecha: this.fecha };
    if (this.selectedVehicleId != null) availabilityParams.idVehiculo = this.selectedVehicleId;
    if (this.selectedVendorId != null) availabilityParams.idVendedor = this.selectedVendorId;

    this.http.get('http://localhost:3001/api/citas/availability', {
      params: availabilityParams
    }).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (!res?.success) {
          this.showError(res?.message || 'Error al validar disponibilidad');
          return;
        }

        const slot = (res.availableSlots || res.slots || []).find((s: any) => s.time === this.selectedSlot);
        if (!slot?.available) {
          this.showError('El horario seleccionado ya no está disponible. Elige otro.');
          return;
        }

        if (this.isWeekendDate(this.fecha)) {
          this.showError('No se pueden agendar citas los sábados ni domingos.');
          return;
        }

        // Determinar la sucursal: depende del motivo
        let idSucursal: number;
        if (this.motivo === 'Asesoramiento') {
          // Para asesoramiento, usar la sucursal seleccionada
          if (!this.selectedSucursalId) {
            this.showError('Selecciona una sucursal para asesoramiento.');
            return;
          }
          idSucursal = this.selectedSucursalId;
        } else {
          // Para otros motivos, usar el vehículo si está seleccionado
          if (this.selectedVehicleId) {
            const selectedVehicle = this.vehicles.find(v => v.idVehiculo === this.selectedVehicleId);
            if (!selectedVehicle) {
              this.showError('Vehículo inválido. Refresca y selecciona de nuevo.');
              return;
            }
            if (!selectedVehicle.idSucursal) {
              this.showError('El vehículo no está asignado a una sucursal. Contacta al administrador.');
              return;
            }
            idSucursal = selectedVehicle.idSucursal;
          } else {
            // Si no hay vehículo, obtener sucursal del vendedor
            const selectedVendor = this.vendors.find(v => v.id === this.selectedVendorId);
            if (!selectedVendor || !selectedVendor.idSucursal) {
              this.showError('El vendedor seleccionado no tiene una sucursal asignada.');
              return;
            }
            idSucursal = selectedVendor.idSucursal;
          }
        }

        const payload = {
          idVehiculo: this.selectedVehicleId || null,
          idSucursal: idSucursal,
          idVendedor: this.selectedVendorId,
          fecha_hora: `${this.fecha} ${this.selectedSlot}:00`,
          motivo: this.motivo
        };

        this.loading = true;
        this.http.post('http://localhost:3001/api/citas', payload).subscribe({
          next: (postRes: any) => {
            this.loading = false;
            if (postRes?.success) {
              this.showSuccess(this.notificationService.success('Cita agendada correctamente'));
              // Scroll to top to show notification
              window.scrollTo({ top: 0, behavior: 'smooth' });
              this.fecha = '';
              this.selectedSlot = null;
              this.hora = '';
              this.slots = [];
              // Navegar automáticamente al menú después de 1 segundo
              setTimeout(() => this.router.navigate(['/']), 1000);
            } else {
              this.showError(postRes?.message || 'Error agendando cita');
            }
          },
          error: (err: any) => {
            this.loading = false;
            console.error('Error agendando cita:', err);

            if (err?.status === 0) {
              this.showError('No se puede conectar al servidor de citas. Verifica que backend esté activo.');
            } else {
              this.showError(err.error?.message || 'Error del servidor al agendar cita');
            }
          }
        });
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error validando disponibilidad:', err);

        if (err?.status === 0) {
          this.showError('No se puede conectar al servidor de citas. Revisa que el backend esté en funcionamiento.');
        } else {
          this.showError(err?.error?.message || 'Error validando disponibilidad');
        }
      }
    });
  }
  
}