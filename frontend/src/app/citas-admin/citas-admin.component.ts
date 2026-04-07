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
import { environment } from '../../environments/environment';

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
    
    this.http.get(`${environment.apiUrl}/citas`).subscribe({
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
    if (estado === 'confirmada') return 'Confirmada';
    if (estado === 'cancelada') return 'Cancelada';
    if (estado === 'aceptada') return 'Aceptada';
    if (estado === 'rechazada') return 'Rechazada';
    return e;
  }

  getClienteNombre(cita: any): string {
    const nombre = cita?.cliente?.nombre || cita?.cliente?.usuario?.nombre || cita?.cliente?.nombre || cita?.nombre || '';
    const apellido = cita?.cliente?.apellido || cita?.cliente?.usuario?.apellido || cita?.cliente?.apellido || cita?.apellido || '';
    return nombre || apellido ? `${nombre} ${apellido}`.trim() : 'Cliente no asignado';
  }

  getVendedorNombre(cita: any): string {
    const nombre = cita?.vendedor?.nombre || cita?.vendedor?.usuario?.nombre || '';
    const apellido = cita?.vendedor?.apellido || cita?.vendedor?.usuario?.apellido || '';
    if (nombre || apellido) return `${nombre} ${apellido}`.trim();
    return cita?.idVendedor ? `ID ${cita.idVendedor}` : 'Vendedor no asignado';
  }

  getAdministradorNombre(cita: any): string {
    const nombre = cita?.administrador?.nombre || '';
    const apellido = cita?.administrador?.apellido || '';
    if (nombre || apellido) return `${nombre} ${apellido}`.trim();
    return cita?.idAdministrador ? `ID ${cita.idAdministrador}` : 'Admin no asignado';
  }

  getSucursalNombre(cita: any): string {
    if (cita?.sucursal?.nombre) return cita.sucursal.nombre;
    if (cita?.vendedor?.sucursal?.nombre) return cita.vendedor.sucursal.nombre;
    if (cita?.vehiculo?.sucursal?.nombre) return cita.vehiculo.sucursal.nombre;
    return cita?.idSucursal ? `ID ${cita.idSucursal}` : 'Sucursal no asignada';
  }

  // formatDateTime - Muestra DD/MM/YYYY HH:mm en vez de ISO
  // ============================================
  formatDateTime(fechaHora: string | Date | undefined): string {
    if (!fechaHora) return '-';

    const d = new Date(fechaHora);
    if (Number.isNaN(d.getTime())) return String(fechaHora);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // ============================================
  // setEstado - Acepta o rechaza una cita
  // ============================================
  setEstado(cita: any, estado: 'aceptada' | 'rechazada') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let adminMessage = null;
    if (estado === 'rechazada') {
      adminMessage = prompt('Motivo del rechazo (opcional):');
      if (adminMessage === null) return;
      adminMessage = adminMessage.trim() || null;
    }
    let endpoint = '';
    let body: any = {};
    if (estado === 'aceptada') {
      endpoint = `${environment.apiUrl}/citas/${cita.id}/confirmar`;
      body = {};
    } else if (estado === 'rechazada') {
      endpoint = `${environment.apiUrl}/citas/${cita.id}/cancelar`;
      body = { motivo: adminMessage };
    }
    this.http.put(endpoint, body).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          alert(`✅ Cita ${estado === 'aceptada' ? 'aceptada' : 'rechazada'} correctamente`);
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