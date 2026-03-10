// ============================================
// COMPONENTE CITAS ADMIN (CitasAdminComponent)
// ============================================
// Es el panel de administración para gestionar todas las citas.
// Permite ver citas pendientes y contestadas, y aceptar/rechazar citas.
// Solo accesible para usuarios con rol 'admin'.
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';       // Para directivas *ngIf, *ngFor
import { HttpClient } from '@angular/common/http';    // Para peticiones HTTP
import { Router, RouterModule } from '@angular/router'; // Para navegación y redirecciones

@Component({
  selector: 'app-citas-admin',           // Etiqueta HTML: <app-citas-admin>
  standalone: true,                       // Componente independiente
  imports: [CommonModule, RouterModule],  // Módulos que necesita
  templateUrl: './citas-admin.component.html', // HTML del componente
  styleUrls: ['./citas-admin.component.css']   // Estilos del componente
})
export class CitasAdminComponent implements OnInit {
  // ============================================
  // PROPIEDADES
  // ============================================
  citas: any[] = [];           // Todas las citas que llegan del backend
  pendientes: any[] = [];       // Filtro: solo citas con estado 'pendiente'
  contestadas: any[] = [];      // Filtro: citas con estado 'aceptada' o 'rechazada'
  selectedTab: 'pendientes'|'contestadas' = 'pendientes'; // Pestaña activa
  loading = false;              // Controla estado de carga

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias
  // ============================================
  constructor(
    private http: HttpClient,   // Para hacer peticiones HTTP
    private router: Router      // Para redirigir si no es admin
  ) {}

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {
    // PASO 1: Verificar que el usuario es administrador
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser || currentUser.rol !== 'admin') {
      alert('Acceso denegado: Solo administradores');
      this.router.navigate(['/']); // Redirige al home
      return;
    }

    // PASO 2: Cargar todas las citas
    this.cargarCitas();
  }

  // ============================================
  // cargarCitas - Obtiene todas las citas del backend
  // ============================================
  cargarCitas(): void {
    this.loading = true; // Activa spinner de carga
    
    this.http.get('http://localhost:3001/api/citas').subscribe({
      next: (res: any) => {
        this.loading = false;
        
        if (res && res.success) {
          this.citas = res.citas || [];
          
          // FILTRAR: Separar pendientes de contestadas
          this.pendientes = this.citas.filter(c => 
            c.estado && c.estado.toLowerCase() === 'pendiente'
          );
          
          this.contestadas = this.citas.filter(c => 
            c.estado && c.estado.toLowerCase() !== 'pendiente'
          );
        }
      },
      error: () => {
        this.loading = false;
        alert('Error al cargar citas');
      }
    });
  }

  // ============================================
  // selectTab - Cambia la pestaña activa
  // ============================================
  selectTab(tab: 'pendientes'|'contestadas') {
    this.selectedTab = tab;
  }

  // ============================================
  // mapEstado - Traduce el estado a texto legible
  // ============================================
  mapEstado(e: string) {
    if (!e) return 'Desconocido';
    const estado = e.toLowerCase();
    if (estado === 'pendiente') return 'Pendiente';
    if (estado === 'aceptada') return 'Aceptada';
    if (estado === 'rechazada') return 'Rechazada';
    return e;
  }

  // ============================================
  // setEstado - Acepta o rechaza una cita
  // ============================================
  setEstado(cita: any, estado: 'aceptada' | 'rechazada') {
    // PASO 1: Obtener datos del admin actual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    let adminMessage = null;
    
    // PASO 2: Si es rechazo, pedir motivo (opcional)
    if (estado === 'rechazada') {
      adminMessage = prompt('Motivo del rechazo (opcional):');
      if (adminMessage === null) {
        return; // Usuario canceló el prompt
      }
      adminMessage = adminMessage.trim() || null; // Si está vacío, queda null
    }

    // PASO 3: Preparar datos para enviar al backend
    const body = { 
      estado: estado,               // Nuevo estado (aceptada/rechazada)
      adminDni: currentUser.dni,    // Quién está haciendo el cambio
      adminMessage: adminMessage    // Mensaje (solo si es rechazo)
    };

    // PASO 4: Enviar PATCH al backend
    this.http.patch(`http://localhost:3001/api/citas/${cita.id}`, body)
      .subscribe({
        next: (res: any) => {
          if (res && res.success) {
            alert(`✅ Cita ${estado} correctamente`);
            
            // PASO 5: Recargar todas las citas para actualizar la vista
            this.cargarCitas();
          } else {
            alert(res?.message || 'Error al actualizar');
          }
        },
        error: (err) => {
          console.error('❌ Error:', err);
          alert('Error al actualizar la cita');
        }
      });
  }
}