import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-vendedor-citas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendedor-citas.component.html',
  styleUrls: ['./vendedor-citas.component.css']
})
export class VendedorCitasComponent implements OnInit {
  citas: any[] = [];
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

    this.fetchCitas();
  }

  private parseFotosArray(fotos: any): string[] {
    if (!fotos) return [];
    if (Array.isArray(fotos)) return fotos;
    if (typeof fotos === 'string') {
      try {
        const parsed = JSON.parse(fotos);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        return [fotos];
      }
    }
    return [String(fotos)];
  }

  private normalizeCita(cita: any): any {
    if (!cita) return cita;
    const copy = { ...cita };
    if (copy.vehiculo) {
      copy.vehiculo = { ...copy.vehiculo };
      copy.vehiculo.fotos = this.parseFotosArray(copy.vehiculo.fotos);
    }
    return copy;
  }

  fetchCitas(): void {
    this.loading = true;
    this.http.get('http://localhost:3001/api/citas/vendedor-citas').subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.citas = (res.citas || []).map((c: any) => this.normalizeCita(c));
        } else {
          this.message = res.message || 'No hay citas asignadas';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error conectando al servidor';
      }
    });
  }

  async finalizarCita(cita: any): Promise<void> {
    if (!cita || !cita.id || cita.estado !== 'confirmada') return;

    this.loading = true;
    this.http.put(`http://localhost:3001/api/citas/${cita.id}/finalizar`, {}).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.message = 'Cita finalizada correctamente';
          this.fetchCitas();
        } else {
          this.message = res.message || 'No se pudo finalizar la cita';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error conectando al servidor';
      }
    });
  }

  irConversacion(cita: any): void {
    if (!cita || !cita.id) return;

    localStorage.setItem('activeCitaId', String(cita.id));
    this.router.navigate(['/vendedor-conversaciones']);
  }

  mapEstado(e: string): string {
    if (!e) return '';
    if (e === 'pendiente') return 'Pendiente';
    if (e === 'confirmada') return 'Aceptada';
    if (e === 'cancelada') return 'Rechazada';
    if (e === 'finalizada') return 'Finalizada';
    return e;
  }
}
