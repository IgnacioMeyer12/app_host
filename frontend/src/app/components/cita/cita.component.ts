import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CitasService } from '../../services/citas.service';
import { VendedoresService } from '../../services/vendedores.service';
import { SucursalesService } from '../../services/sucursales.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cita',
  templateUrl: './cita.component.html',
  styleUrls: ['./cita.component.css']
})
export class CitaComponent implements OnInit {
  cita = {
    idVehiculo: null as number | null,
    idVendedor: '',
    idSucursal: '',
    fecha: '',
    hora: '',
    notas: ''
  };

  vendedores: any[] = [];
  sucursales: any[] = [];
  horasDisponibles: string[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(
    private citasService: CitasService,
    private vendedoresService: VendedoresService,
    private sucursalesService: SucursalesService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idVehiculo = this.route.snapshot.queryParamMap.get('vehiculo');
    if (idVehiculo) {
      this.cita.idVehiculo = +idVehiculo;
    }
    this.cargarSucursales();
  }

  cargarSucursales(): void {
    this.sucursalesService.getAll().subscribe({
      next: (res: any) => {
        this.sucursales = res.data || res;
      },
      error: (err: any) => console.error('Error al cargar sucursales', err)
    });
  }

  onSucursalChange(): void {
    if (this.cita.idSucursal) {
      this.vendedoresService.getBySucursal(+this.cita.idSucursal).subscribe({
        next: (res: any) => {
          this.vendedores = res.data || res;
        },
        error: (err: any) => console.error('Error al cargar vendedores', err)
      });
    }
  }

  verificarDisponibilidad(): void {
    if (this.cita.idVendedor && this.cita.fecha) {
      this.citasService.checkAvailability({
        idVendedor: this.cita.idVendedor,
        fecha: this.cita.fecha
      }).subscribe({
        next: (res: any) => {
          this.horasDisponibles = res.horasDisponibles || [];
        },
        error: (err: any) => console.error('Error al verificar disponibilidad', err)
      });
    }
  }

  onSubmit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.citasService.create(this.cita).subscribe({
      next: () => {
        this.success = 'Cita agendada exitosamente';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/mis-citas']), 1500);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al agendar cita';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
