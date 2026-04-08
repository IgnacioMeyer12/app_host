import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VehiculosService } from '../../services/vehiculos.service';
import { MarcasService } from '../../services/marcas.service';
import { SucursalesService } from '../../services/sucursales.service';

@Component({
  selector: 'app-alta-vehiculo',
  templateUrl: './alta-vehiculo.component.html',
  styleUrls: ['./alta-vehiculo.component.css']
})
export class AltaVehiculoComponent implements OnInit {
  vehiculo = {
    marca: '',
    modelo: '',
    anio: '',
    precio: '',
    descripcion: '',
    idSucursal: '',
    imagenes: [] as string[]
  };

  marcas: any[] = [];
  sucursales: any[] = [];
  selectedFiles: File[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(
    private vehiculosService: VehiculosService,
    private marcasService: MarcasService,
    private sucursalesService: SucursalesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMarcas();
    this.cargarSucursales();
  }

  cargarMarcas(): void {
    this.marcasService.getAllAdmin().subscribe({
      next: (res: any) => {
        this.marcas = res.data || res;
      },
      error: (err: any) => console.error('Error al cargar marcas', err)
    });
  }

  cargarSucursales(): void {
    this.sucursalesService.getAllAdmin().subscribe({
      next: (res: any) => {
        this.sucursales = res.data || res;
      },
      error: (err: any) => console.error('Error al cargar sucursales', err)
    });
  }

  onFilesSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    if (this.selectedFiles.length > 0) {
      this.vehiculosService.uploadImages(this.selectedFiles).subscribe({
        next: (res: any) => {
          this.vehiculo.imagenes = res.files || [];
          this.crearVehiculo();
        },
        error: (err: any) => {
          this.error = 'Error al subir imágenes';
          this.loading = false;
          console.error(err);
        }
      });
    } else {
      this.crearVehiculo();
    }
  }

  private crearVehiculo(): void {
    this.vehiculosService.create(this.vehiculo).subscribe({
      next: () => {
        this.success = 'Vehículo creado exitosamente';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/admin/vehiculos']), 1500);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al crear vehículo';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
