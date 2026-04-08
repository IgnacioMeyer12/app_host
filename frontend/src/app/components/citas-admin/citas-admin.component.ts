import { Component, OnInit } from '@angular/core';
import { CitasService } from '../../services/citas.service';

@Component({
  selector: 'app-citas-admin',
  templateUrl: './citas-admin.component.html',
  styleUrls: ['./citas-admin.component.css']
})
export class CitasAdminComponent implements OnInit {
  citas: any[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(private citasService: CitasService) {}

  ngOnInit(): void {
    this.cargarCitas();
  }

  cargarCitas(): void {
    this.loading = true;
    this.citasService.getAllCitas().subscribe({
      next: (res: any) => {
        this.citas = res.data || res;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Error al cargar citas';
        this.loading = false;
        console.error(err);
      }
    });
  }

  confirmarCita(id: number): void {
    this.citasService.confirmar(id).subscribe({
      next: () => {
        this.success = 'Cita confirmada';
        this.cargarCitas();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al confirmar cita';
        console.error(err);
      }
    });
  }

  cancelarCita(id: number): void {
    this.citasService.cancelar(id).subscribe({
      next: () => {
        this.success = 'Cita cancelada';
        this.cargarCitas();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al cancelar cita';
        console.error(err);
      }
    });
  }

  finalizarCita(id: number): void {
    this.citasService.finalizar(id).subscribe({
      next: () => {
        this.success = 'Cita finalizada';
        this.cargarCitas();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al finalizar cita';
        console.error(err);
      }
    });
  }
}
