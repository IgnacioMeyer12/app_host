import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { VendedoresService, Vendedor } from '../services/vendedores.service';
import { SucursalesService, Sucursal } from '../services/sucursales.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-administrar-vendedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './administrar-vendedores.component.html',
  styleUrls: ['./administrar-vendedores.component.css']
})
export class AdministrarVendedoresComponent implements OnInit {
  vendedores: Vendedor[] = [];
  sucursales: Sucursal[] = [];

  loading = false;
  error = '';
  message = '';
  messageType: 'success' | 'error' = 'success';

  showForm = false;
  formTitle = 'Agregar Vendedor';

  form: FormGroup;
  editingId: number | null = null;

  currentUser: any = null;
  isAdmin = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private vendedoresService: VendedoresService,
    private sucursalesService: SucursalesService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(7)]],
      idSucursal: ['', Validators.required],
      activo: [true, Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]]
    });
  }

  ngOnInit(): void {
    this.checkAdmin();
    this.loadSucursales();
    this.loadVendedores();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  private setSuccess(message: string): void {
    this.message = this.notificationService.success(message);
    this.messageType = 'success';
    this.error = '';
  }

  private setError(message: string): void {
    this.error = message;
    this.message = '';
    this.messageType = 'error';
  }

  private checkAdmin(): void {
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
      this.router.navigate(['/']);
      return;
    }
    this.currentUser = JSON.parse(stored);
    if (this.currentUser.rol !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
    this.isAdmin = true;
  }

  loadSucursales(): void {
    this.sucursalesService.getSucursalesTodas().subscribe({
      next: (res) => {
        if (res.success) {
          this.sucursales = res.sucursales;
        }
      },
      error: () => {
        this.error = 'No se pudieron cargar sucursales.';
      }
    });
  }

  loadVendedores(): void {
    this.loading = true;
    this.error = '';
    this.vendedoresService.getAll().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.vendedores = res.vendedores;
        } else {
          this.setError('No se pudieron cargar vendedores.');
        }
      },
      error: (err) => {
        this.loading = false;
        this.setError(err.error?.message || 'Error del servidor');
      }
    });
  }

  submit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const vendorPayload = {
      dni: this.form.value.dni,
      idSucursal: this.form.value.idSucursal,
      activo: this.form.value.activo,
      nombre: this.form.value.nombre,
      apellido: this.form.value.apellido,
      telefono: this.form.value.telefono,
      password: this.form.value.password
    };

    this.loading = true;

    const request = this.editingId
      ? this.vendedoresService.update(this.editingId, vendorPayload)
      : this.vendedoresService.create(vendorPayload);

    request.subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.setSuccess(this.editingId ? 'Vendedor actualizado' : 'Vendedor creado');
          this.loadVendedores();
          this.resetForm();
          this.showForm = false;
        } else {
          this.setError(res.message || 'Error al guardar vendedor');
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.setError(err?.error?.message || 'Error del servidor');
      }
    });
  }

  editar(v: Vendedor): void {
    this.editingId = v.id;
    this.form.patchValue({
      dni: v.dni,
      idSucursal: v.idSucursal || '',
      activo: v.activo,
      nombre: v.nombre || '',
      apellido: v.apellido || '',
      telefono: v.telefono || '',
      email: ''
    });
    this.formTitle = 'Editar Vendedor';
    this.showForm = true;
    this.error = '';
    this.message = '';
  }

  eliminar(v: Vendedor): void {
    if (!confirm(`Eliminar vendedor ${v.nombre} ${v.apellido}?`)) {
      return;
    }
    this.vendedoresService.delete(v.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.setSuccess(res.message);
          this.loadVendedores();
        } else {
          this.setError(res.message || 'Error eliminando vendedor');
        }
      },
      error: (err) => {
        this.setError(err.error?.message || 'Error eliminando vendedor');
      }
    });
  }

  cambiarEstado(v: Vendedor): void {
    const nuevoEstado = !v.activo;
    this.vendedoresService.update(v.id, { activo: nuevoEstado }).subscribe({
      next: (res) => {
        if (res.success) {
          this.setSuccess(`Vendedor ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
          this.loadVendedores();
        } else {
          this.setError(res.message || 'Error al cambiar estado del vendedor');
        }
      },
      error: (err) => {
        this.setError(err.error?.message || 'Error del servidor al cambiar estado');
      }
    });
  }

  resetForm(): void {
    this.form.reset({ dni: '', idSucursal: '', activo: true });
    this.editingId = null;
    this.formTitle = 'Agregar Vendedor';
    this.error = '';
    this.message = '';
  }

  cancel(): void {
    this.showForm = false;
    this.resetForm();
  }

  back(): void {
    this.router.navigate(['/']);
  }
}
