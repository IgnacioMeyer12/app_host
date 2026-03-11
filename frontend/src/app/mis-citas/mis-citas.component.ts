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

@Component({
  selector: 'app-mis-citas',           // Etiqueta HTML: <app-mis-citas>
  standalone: true,                      // Componente independiente
  imports: [CommonModule, RouterModule], // Módulos que necesita
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
    this.fetchCitas(user.dni);
  }

  // ============================================
  // fetchCitas - Obtiene las citas del backend
  // ============================================
  fetchCitas(dni: string): void {
    this.loading = true; // Activa el estado de carga
    
    // Hace una petición GET al backend con el DNI como parámetro
    this.http.get(`http://localhost:3001/api/citas?dni=${dni}`).subscribe({
      next: (res: any) => { // Si la petición funciona
        this.loading = false;
        
        if (res && res.success) {
          this.citas = res.citas || []; // Guarda las citas
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
  // mapEstado - Traduce el estado de la cita a texto legible
  // ============================================
  mapEstado(e: string) {
    if (!e) return '';
    if (e === 'pendiente') return 'Pendiente de aceptación';
    if (e === 'aceptada') return 'Aceptada';
    if (e === 'rechazada') return 'Rechazada';
    return e; // Por si viene algún estado no contemplado
  }
}