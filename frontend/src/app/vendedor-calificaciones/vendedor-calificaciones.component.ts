import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-vendedor-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendedor-calificaciones.component.html',
  styleUrls: ['./vendedor-calificaciones.component.css']
})
export class VendedorCalificacionesComponent implements OnInit {
  calificaciones: any[] = [];
  loading = false;
  message = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      alert('Debes iniciar sesión como vendedor');
      this.router.navigate(['/']);
      return;
    }

    const currentUser = JSON.parse(user);
    if (currentUser.rol !== 'vendedor') {
      alert('Acceso denegado. Solo vendedores.');
      this.router.navigate(['/']);
      return;
    }

    this.fetchCalificaciones();
  }

  fetchCalificaciones(): void {
    this.loading = true;
    this.http.get('http://localhost:3001/api/calificaciones/mis-calificaciones').subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.calificaciones = res.calificaciones;
        } else {
          this.message = res.message || 'No hay calificaciones disponibles';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error conectando al servidor';
      }
    });
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString();
  }

  // Métodos para estadísticas
  getPromedio(): number {
    if (this.calificaciones.length === 0) return 0;
    const suma = this.calificaciones.reduce((acc, cal) => acc + (cal.puntuacion ?? 0), 0);
    return Math.round((suma / this.calificaciones.length) * 10) / 10;
  }

  getPorcentajePositivas(): number {
    if (this.calificaciones.length === 0) return 0;
    const positivas = this.calificaciones.filter(cal => (cal.puntuacion ?? 0) >= 4).length;
    return Math.round((positivas / this.calificaciones.length) * 100);
  }

  getUltimaCalificacion(): number {
    if (this.calificaciones.length === 0) return 0;
    // Asumiendo que las calificaciones están ordenadas por fecha descendente
    return this.calificaciones[0].puntuacion ?? 0;
  }
}
