import { Component, OnInit } from '@angular/core';
import { VehiculosService } from '../../services/vehiculos.service';
import { MarcasService } from '../../services/marcas.service';
import { SucursalesService } from '../../services/sucursales.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent implements OnInit {
  vehiculos: any[] = [];
  marcas: any[] = [];
  sucursales: any[] = [];
  loading = false;
  error = '';

  filtros = {
    marca: '',
    modelo: '',
    anioMin: '',
    anioMax: '',
    precioMin: '',
    precioMax: '',
    sucursal: ''
  };

  constructor(
    private vehiculosService: VehiculosService,
    private marcasService: MarcasService,
    private sucursalesService: SucursalesService
  ) {}

  ngOnInit(): void {
    this.cargarVehiculos();
    this.cargarMarcas();
    this.cargarSucursales();
  }

  cargarVehiculos(): void {
    this.loading = true;
    this.vehiculosService.getAll().subscribe({
      next: (res: any) => {
        this.vehiculos = res.data || res;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Error al cargar vehículos';
        this.loading = false;
        console.error(err);
      }
    });
  }

  cargarMarcas(): void {
    this.marcasService.getAll().subscribe({
      next: (res: any) => {
        this.marcas = res.data || res;
      },
      error: (err: any) => console.error('Error al cargar marcas', err)
    });
  }

  cargarSucursales(): void {
    this.sucursalesService.getAll().subscribe({
      next: (res: any) => {
        this.sucursales = res.data || res;
      },
      error: (err: any) => console.error('Error al cargar sucursales', err)
    });
  }

  buscar(): void {
    this.loading = true;
    this.vehiculosService.search(this.filtros).subscribe({
      next: (res: any) => {
        this.vehiculos = res.data || res;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Error en la búsqueda';
        this.loading = false;
        console.error(err);
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      marca: '',
      modelo: '',
      anioMin: '',
      anioMax: '',
      precioMin: '',
      precioMax: '',
      sucursal: ''
    };
    this.cargarVehiculos();
  }
}
