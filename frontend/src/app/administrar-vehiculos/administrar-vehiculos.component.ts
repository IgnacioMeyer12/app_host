// ============================================
// COMPONENTE ADMINISTRAR VEHÍCULOS (AdministrarVehiculosComponent)
// ============================================
// Permite a clientes (y administradores) gestionar los vehículos.
// Incluye:
// - Listado completo de vehículos (activos e inactivos)
// - Formulario para crear/editar vehículos
// - Vista previa antes de guardar
// - Acciones: activar/desactivar, editar, eliminar
// ============================================

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VehiculosService, Vehiculo } from '../services/vehiculos.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-administrar-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './administrar-vehiculos.component.html',
  styleUrls: ['./administrar-vehiculos.component.css']
})
export class AdministrarVehiculosComponent implements OnInit {
  // Lista de vehículos
  vehiculos: Vehiculo[] = [];

  // Estado UI
  loading = false;
  error = '';
  message = '';
  messageType: 'success' | 'error' = 'success';
  currentYear = new Date().getFullYear();

  // Formulario
  vehiculoForm: FormGroup;
  showForm = false;
  editingId: string | null = null;
  formTitle = 'Editar Vehículo';

  // Imágenes
  imageUrls: string[] = [];
  imageUrlInput = '';
  uploading = false;

  // Seguridad
  currentUser: any = null;
  isCliente = false;
  isAdmin = false;

  constructor(
    private fb: FormBuilder,
    private vehiculosService: VehiculosService,
    private http: HttpClient,
    private router: Router
  ) {
    this.vehiculoForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkUser();
    this.cargarVehiculos();
  }

  private checkUser(): void {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      this.error = 'Debes iniciar sesión para acceder a esta sección.';
      setTimeout(() => this.router.navigate(['/home']), 2000);
      return;
    }

    try {
      this.currentUser = JSON.parse(userData);
      this.isAdmin = this.currentUser.rol === 'admin';
      this.isCliente = this.currentUser.rol === 'cliente';

      if (!this.isAdmin && !this.isCliente) {
        this.error = 'Acceso denegado.';
        setTimeout(() => this.router.navigate(['/home']), 2000);
      }
    } catch (error) {
      this.error = 'Error verificando permisos.';
      setTimeout(() => this.router.navigate(['/home']), 2000);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      anio: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      precio: ['', [Validators.required, Validators.min(0.01)]],
      km: ['', [Validators.required, Validators.min(0)]],
      stock: [1, [Validators.required, Validators.min(0)]],
      color: ['#000000'],
      descripcion: ['']
    });
  }

  cargarVehiculos(): void {
    this.loading = true;
    this.error = '';

    this.vehiculosService.getVehiculosTodos().subscribe({
      next: (response) => {
        if (response.success) {
          this.vehiculos = response.vehiculos;
        } else {
          this.error = 'Error al cargar los vehículos.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al conectar con el servidor.';
        this.loading = false;
      }
    });
  }

  // No hay creación de vehículos en este panel. El formulario se muestra solo al editar.
  cancelEdit(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.vehiculoForm.reset();
    this.formTitle = 'Editar Vehículo';
    this.editingId = null;
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.message = '';
    this.error = '';
  }

  onSubmit(): void {
    if (!this.vehiculoForm.valid) {
      Object.values(this.vehiculoForm.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.guardarVehiculo();
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.editingId = vehiculo.idVehiculo;
    this.formTitle = `Editar Vehículo: ${vehiculo.marca} ${vehiculo.modelo}`;

    this.vehiculoForm.patchValue({
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      precio: vehiculo.precio,
      km: vehiculo.km,
      stock: vehiculo.stock,
      color: vehiculo.color || '#000000',
      descripcion: vehiculo.descripcion || ''
    });

    this.imageUrls = vehiculo.fotos || [];
    this.showForm = true;

    window.scrollTo(0, 0);
  }

  async uploadFiles(files: FileList | File[]): Promise<void> {
    const arr = Array.from(files as FileList);
    if (arr.length === 0) return;
    this.uploading = true;

    const form = new FormData();
    arr.forEach(f => form.append('files', f));

    try {
      const res: any = await this.http.post('http://localhost:3001/api/upload', form).toPromise();
      if (res && res.success && res.files && res.files.length) {
        this.imageUrls.push(...res.files);
      }
    } catch (err) {
      console.error('Error subiendo archivos', err);
      this.message = 'Error subiendo imágenes';
      this.messageType = 'error';
    } finally {
      this.uploading = false;
    }
  }

  addImage(): void {
    const url = this.imageUrlInput?.trim();
    if (!url) return;
    this.imageUrls.push(url);
    this.imageUrlInput = '';
  }

  removeImage(index: number): void {
    this.imageUrls.splice(index, 1);
  }

  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length) this.uploadFiles(files);
    event.target.value = null;
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length) {
      this.uploadFiles(ev.dataTransfer.files);
    }
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
  }

  onPaste(ev: ClipboardEvent): void {
    const items = ev.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length) {
      this.uploadFiles(files);
    }
  }

  private guardarVehiculo(): void {
    if (!this.editingId) {
      this.error = 'Selecciona un vehículo para editar.';
      return;
    }

    if (!this.vehiculoForm.valid) {
      this.error = 'Completa todos los campos requeridos';
      return;
    }

    this.loading = true;
    const datos: any = {
      ...this.vehiculoForm.value,
      fotos: this.imageUrls,
      activo: true
    };

    this.vehiculosService.actualizarVehiculo(this.editingId, datos).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.message = 'Vehículo actualizado correctamente';
          this.messageType = 'success';
          this.showForm = false;
          this.resetForm();
          this.cargarVehiculos();
          setTimeout(() => (this.message = ''), 3000);
        } else {
          this.error = response.message || 'Error al procesar la solicitud';
          this.messageType = 'error';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al conectar con el servidor';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  eliminarVehiculo(idVehiculo: string, titulo?: string): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar el vehículo "${titulo || idVehiculo}"?`)) {
      return;
    }

    this.loading = true;
    this.vehiculosService.eliminarVehiculo(idVehiculo).subscribe({
      next: (response) => {
        if (response.success) {
          this.error = '';
          this.cargarVehiculos();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al eliminar el vehículo.';
        this.loading = false;
      }
    });
  }

  cambiarEstado(vehiculo: Vehiculo): void {
    const nuevoEstado = !vehiculo.activo;
    this.loading = true;

    this.vehiculosService.actualizarVehiculo(vehiculo.idVehiculo, { activo: nuevoEstado }).subscribe({
      next: (response) => {
        if (response.success) {
          this.error = '';
          this.cargarVehiculos();
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al cambiar el estado del vehículo.';
        this.loading = false;
      }
    });
  }

  handleImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=800&fit=crop';
  }

  volver(): void {
    this.router.navigate(['/home']);
  }
}
