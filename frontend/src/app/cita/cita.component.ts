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
  selectedVehicleId: string | null = null;  // ID del vehículo seleccionado
  fecha = '';                               // Fecha seleccionada (YYYY-MM-DD)
  hora = '';                                 // Hora seleccionada (HH:MM)
  motivo = 'Consulta por vehículo';          // Motivo de la cita
  motivos = ['Consulta por vehículo', 'Prueba de vehículo', 'Asesoramiento', 'Otro']; // Opciones de motivo
  minFecha = '';                             // Fecha mínima permitida (hoy)
  minHora = '';                               // Hora mínima permitida (si es hoy)

  loading = false;                            // Estado de carga
  message = '';                               // Mensaje para el usuario
  messageType: 'success' | 'error' = 'success'; // Tipo de mensaje (verde/rojo)

  slots: Array<{ time: string, available: boolean }> = []; // Horarios disponibles
  selectedSlot: string | null = null;          // Horario seleccionado

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias
  // ============================================
  constructor(
    private http: HttpClient,      // Para peticiones HTTP
    public router: Router,          // Para navegar entre páginas
    private route: ActivatedRoute   // Para leer parámetros de la URL
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
      if (params['id']) this.selectedVehicleId = params['id'];
    });

    // Cargar la lista de vehículos
    this.fetchVehicles();
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
        } else {
          this.showError(resp.message || 'Error cargando vehículos');
        }
      },
      error: () => {
        this.loading = false;
        this.showError('Error conectando al servidor');
      }
    });
  }

  // ============================================
  // fetchAvailability - Obtiene horarios disponibles para una fecha
  // ============================================
  fetchAvailability(date: string): void {
    if (!date) return;
    
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
    
    // Parámetros para la petición
    const params: any = { date };
    if (this.selectedVehicleId) params.idVehiculo = this.selectedVehicleId;

    // Obtener slots disponibles
    this.http.get('http://localhost:3001/api/citas/availability', { params }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.slots = res.slots || [];
          
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
      error: () => {
        this.showError('Error conectando al servidor');
      }
    });
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
  // showError - Muestra mensaje de error
  // ============================================
  showError(msg: string) {
    this.message = msg;
    this.messageType = 'error';
  }

  // ============================================
  // showSuccess - Muestra mensaje de éxito
  // ============================================
  showSuccess(msg: string) {
    this.message = msg;
    this.messageType = 'success';
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

    const user = JSON.parse(currentUser);
    if (user.rol !== 'cliente') {
      this.showError('Solo clientes pueden solicitar citas');
      return;
    }

    // PASO 2: Validar que haya fecha y hora seleccionadas
    if (!this.fecha || !this.selectedSlot) {
      this.showError('Selecciona fecha y un horario disponible');
      return;
    }

    // PASO 3: Verificar que el horario SIGA disponible
    this.loading = true;
    this.http.get('http://localhost:3001/api/citas/availability', { 
      params: { date: this.fecha, idVehiculo: this.selectedVehicleId || '' } 
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          const slot = (res.slots || []).find((s: any) => s.time === this.selectedSlot);
          if (!slot?.available) {
            this.showError('El horario seleccionado ya no está disponible. Elige otro.');
            return;
          }

          // PASO 4: Preparar datos de la cita
          const payload = {
            dni: user.dni,
            idVehiculo: this.selectedVehicleId || null,
            fecha: this.fecha,
            hora: this.selectedSlot,
            motivo: this.motivo
          };

          // PASO 5: Enviar cita al backend
          this.loading = true;
          this.http.post('http://localhost:3001/api/citas', payload).subscribe({
            next: (postRes: any) => {
              this.loading = false;
              if (postRes?.success) {
                this.showSuccess('Cita agendada correctamente');
                // Limpiar formulario
                this.fecha = '';
                this.selectedSlot = null;
                this.hora = '';
                this.slots = [];
              } else {
                this.showError(postRes.message || 'Error agendando cita');
              }
            },
            error: (err) => {
              this.loading = false;
              this.showError(err.error?.message || 'Error del servidor al agendar cita');
            }
          });

        } else {
          this.loading = false;
          this.showError(res.message || 'Error al validar disponibilidad');
        }
      },
      error: () => {
        this.loading = false;
        this.showError('Error validando disponibilidad');
      }
    });
  }
}