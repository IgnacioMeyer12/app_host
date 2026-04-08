// ============================================
// COMPONENTE ADMINISTRAR MARCAS (AdministrarMarcasComponent)
// ============================================
// Permite a los administradores gestionar las marcas de vehículos.
// Incluye:
// - Listado de todas las marcas (activas e inactivas)
// - Formulario para crear/editar marcas (nombre y descripción)
// - Cambiar estado (activa/inactiva) y eliminar marcas
// ============================================

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MarcasService, Marca } from '../services/marcas.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-administrar-marcas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './administrar-marcas.component.html',
  styleUrls: ['./administrar-marcas.component.css']
})
export class AdministrarMarcasComponent implements OnInit {
  
  // ============================================
  // PROPIEDADES PRINCIPALES
  // ============================================
  marcas: Marca[] = [];
  loading = false;
  error = '';
  message = '';
  messageType: 'success' | 'error' = 'success';
  currentYear = new Date().getFullYear();

  // ============================================
  // PROPIEDADES DEL FORMULARIO
  // ============================================
  form: FormGroup;
  showForm = false;
  editingMarcaId: number | null = null;
  formTitle = 'Agregar Nueva Marca';

  // ============================================
  // PROPIEDADES DE SEGURIDAD
  // ============================================
  isAdmin = false;
  currentUser: any = null;

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor(
    private fb: FormBuilder,
    private marcasService: MarcasService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['']
    });
  }

  // ============================================
  // ngOnInit
  // ============================================
  ngOnInit(): void {
    this.checkAdmin();
    this.cargarMarcas();
  }

  // ============================================
  // checkAdmin - Verifica permisos de administrador
  // ============================================
  checkAdmin(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isAdmin = this.currentUser.rol === 'admin';
        if (!this.isAdmin) {
          this.error = 'Acceso denegado. Solo administradores pueden acceder a esta sección.';
          setTimeout(() => this.router.navigate(['/home']), 2000);
        }
      } catch (error) {
        this.error = 'Error al verificar permisos.';
        this.router.navigate(['/home']);
      }
    } else {
      this.error = 'Debes iniciar sesión.';
      setTimeout(() => this.router.navigate(['/home']), 2000);
    }
  }

  // ============================================
  // cargarMarcas - Obtiene todas las marcas del backend (admin incluye inactivas)
  // ============================================
  cargarMarcas(): void {
    this.loading = true;
    this.error = '';
    
    this.marcasService.getAllAdmin().subscribe({
      next: (response) => {
        if (response.success) {
          this.marcas = response.marcas;
        } else {
          this.error = 'Error al cargar las marcas.';
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

  // ============================================
  // toggleForm - Muestra/oculta el formulario
  // ============================================
  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  // ============================================
  // resetForm - Resetea el formulario a su estado inicial
  // ============================================
  resetForm(): void {
    this.form.reset();
    this.editingMarcaId = null;
    this.formTitle = 'Agregar Nueva Marca';
    this.message = '';
    this.error = '';
  }

  // ============================================
  // save - Guarda (crea o actualiza) la marca
  // ============================================
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value;
    this.loading = true;

    if (this.editingMarcaId) {
      // Actualizar marca existente
      this.marcasService.update(this.editingMarcaId, payload).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.message = 'Marca actualizada correctamente';
            this.messageType = 'success';
            this.resetForm();
            this.cargarMarcas();
            this.showForm = false;
            setTimeout(() => this.message = '', 3000);
          } else {
            this.error = response.message || 'Error al actualizar';
            this.messageType = 'error';
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.error = 'Error al conectar con el servidor';
          this.messageType = 'error';
          this.loading = false;
        }
      });
    } else {
      // Crear nueva marca
      this.marcasService.create(payload).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.message = this.notificationService.success('Marca creada correctamente');
            this.messageType = 'success';
            this.resetForm();
            this.cargarMarcas();
            this.showForm = false;
            setTimeout(() => this.message = '', 3000);
          } else {
            this.error = response.message || 'Error al crear';
            this.messageType = 'error';
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.error = 'Error al conectar con el servidor';
          this.messageType = 'error';
          this.loading = false;
        }
      });
    }
  }

  // ============================================
  // edit - Carga una marca existente para editar
  // ============================================
  edit(marca: Marca): void {
    this.editingMarcaId = marca.id;
    this.formTitle = `Editar Marca: ${marca.nombre}`;
    this.form.patchValue({
      nombre: marca.nombre,
      descripcion: marca.descripcion || ''
    });
    this.showForm = true;
    window.scrollTo(0, 0);
  }

  // ============================================
  // delete - Elimina una marca (con confirmación)
  // ============================================
  delete(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta marca?')) return;
    
    this.loading = true;
    this.marcasService.delete(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.message = 'Marca eliminada correctamente';
          this.messageType = 'success';
          this.cargarMarcas();
          setTimeout(() => this.message = '', 3000);
        } else {
          this.error = response.message || 'Error al eliminar';
          this.messageType = 'error';
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al conectar con el servidor';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  // ============================================
  // cambiarEstado - Activa/desactiva una marca
  // ============================================
  cambiarEstado(marca: Marca): void {
    const nuevoEstado = !marca.activa;
    this.loading = true;
    this.marcasService.update(marca.id, { activa: nuevoEstado }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.message = `Marca ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`;
          this.messageType = 'success';
          this.cargarMarcas();
          setTimeout(() => this.message = '', 3000);
        } else {
          this.error = response.message || 'Error al cambiar el estado';
          this.messageType = 'error';
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al conectar con el servidor';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  // ============================================
  // cancel - Cancela la edición y cierra el formulario
  // ============================================
  cancel(): void {
    this.showForm = false;
    this.resetForm();
  }

  // ============================================
  // back - Navega al menú principal
  // ============================================
  back(): void {
    this.router.navigate(['/']);
  }
}