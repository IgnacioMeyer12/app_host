// ============================================
// COMPONENTE MIS CITAS (MisCitasComponent)
// ============================================
// Muestra al usuario todas sus citas agendadas (pendientes, aceptadas, rechazadas).
// Se asegura que el usuario haya iniciado sesión, obtiene su DNI del localStorage,
// y pide al backend las citas asociadas a ese DNI.
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';       // Para usar directivas como *ngIf, *ngFor
import { HttpClient } from '@angular/common/http';    // Para hacer peticiones HTTP
import { Router, RouterModule } from '@angular/router'; // Para navegar entre páginas
import { FormsModule } from '@angular/forms'; // Para usar ngModel en formularios
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-mis-citas',           // Etiqueta HTML: <app-mis-citas>
  standalone: true,                      // Componente independiente
  imports: [CommonModule, RouterModule, FormsModule], // Módulos que necesita
  templateUrl: './mis-citas.component.html', // HTML del componente (archivo aparte)
  styleUrls: ['./mis-citas.component.css']   // Estilos del componente (archivo aparte)
})
export class MisCitasComponent implements OnInit {
  // ============================================
  // PROPIEDADES
  // ============================================
  citas: any[] = [];     // Aquí guardamos las citas que trae del backend
  loading = false;       // Controla si estamos cargando datos (para mostrar spinner)
  message = '';          // Mensajes de error o información
  ratingForm: { [key: number]: { puntuacion: number; comentario: string } } = {}; // para calificar citas

  // ============================================
  // CONSTRUCTOR (inyecta dependencias)
  // ============================================
  constructor(
    private http: HttpClient,  // Para hacer peticiones HTTP
    private router: Router     // Para redirigir al usuario si no está logueado
  ) {}

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {
    // PASO 1: Verificar si hay usuario logueado
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Debes iniciar sesión para ver tus citas');
      this.router.navigate(['/']); // Redirige al home
      return;
    }
    
    // PASO 2: Obtener el DNI del usuario logueado
    const user = JSON.parse(currentUser);
    
    // PASO 3: Traer las citas de ese usuario
    this.fetchCitas();
  }

  // ============================================
  // fetchCitas - Obtiene las citas del backend
  // ============================================
  fetchCitas(): void {
    this.loading = true; // Activa el estado de carga
    
    // Hace una petición GET al backend que usa el token para determinar el usuario
    this.http.get(`${environment.apiUrl}/citas/mis-citas`).subscribe({
      next: (res: any) => { // Si la petición funciona
        this.loading = false;
        
        if (res && res.success) {
          this.citas = res.citas || []; // Guarda las citas
          // Inicializar formulario de calificación para cada cita finalizada sin calificación
          this.citas.forEach((c: any) => {
            if (!this.ratingForm[c.id]) {
              this.ratingForm[c.id] = { puntuacion: 0, comentario: '' };
            }
          });
        } else {
          this.message = res.message || 'Error cargando citas';
        }
      },
      error: (err) => { // Si hay error de conexión
        this.loading = false;
        this.message = 'Error conectando al servidor';
      }
    });
  }

  // ============================================
  // abrirConversacion - Redirige para hablar con el vendedor
  // ============================================
  abrirConversacion(cita: any) {
    if (!cita || !cita.id) return;

    // Guardar cita actual para preseleccionar en la pantalla de conversaciones
    localStorage.setItem('activeCitaId', String(cita.id));
    this.router.navigate(['/vendedor-conversaciones']);
  }

  // ============================================
  // rateCita - Envía calificación de una cita finalizada
  // ============================================
  rateCita(cita: any): void {
    if (!cita || !cita.id) return;

    const rating = this.ratingForm[cita.id];
    if (!rating || !rating.puntuacion || rating.puntuacion < 1 || rating.puntuacion > 5) {
      alert('Ingresa una puntuación válida entre 1 y 5');
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}/calificaciones`, {
      idCita: cita.id,
      puntuacion: rating.puntuacion,
      comentario: rating.comentario || ''
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.message = 'Calificación enviada. ¡Gracias por tu opinión!';
          this.fetchCitas();
        } else {
          this.message = res.message || 'No se pudo enviar la calificación';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error conectando al servidor';
      }
    });
  }

  // ============================================
  // mapEstado - Traduce el estado de la cita a texto legible
  // ============================================
  mapEstado(e: string) {
    if (!e) return '';
    if (e === 'pendiente') return 'Pendiente de aceptación';
    if (e === 'confirmada') return 'Aceptada';
    if (e === 'cancelada') return 'Rechazada';
    if (e === 'finalizada') return 'Finalizada';
    return e;
  }

  // formatDateTime - Mostrar reloj estilo DD/MM/YYYY HH:mm
  // ============================================
  formatDateTime(fechaHora: string | Date | undefined): string {
    if (!fechaHora) return '-';
    const d = new Date(fechaHora);
    if (Number.isNaN(d.getTime())) return String(fechaHora);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }

  obtenerFotoVehiculo(cita: any): string | null {
  // Intenta múltiples rutas posibles
  const v = cita.vehiculo;
  if (!v) return null;
  if (v.fotos && v.fotos.length > 0) return v.fotos[0];
  if (v.imagenes && v.imagenes.length > 0) return v.imagenes[0];
  if (v.foto_url) return v.foto_url;
  if (v.imagen_url) return v.imagen_url;
  return null;
}

onImageError(event: Event) {
  // Si la imagen falla, muestra el placeholder
  (event.target as HTMLImageElement).style.display = 'none';
  // Opcional: reemplazar con placeholder
}

}