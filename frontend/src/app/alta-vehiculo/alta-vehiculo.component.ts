// ============================================
// COMPONENTE ALTA VEHÍCULO (AltaVehiculoComponent)
// ============================================
// Permite a los administradores dar de alta nuevos vehículos en el catálogo.
// Incluye:
// - Formulario completo con validaciones (marca, modelo, año, precio, km, etc.)
// - Subida de imágenes (por URL, archivo, drag & drop, pegado)
// - Vista previa antes de guardar
// - Verificación en dos pasos: VERIFICAR → REGISTRAR
// - Manejo de vehículos 0km (km=0, stock obligatorio)
// ============================================

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SucursalesService, Sucursal } from '../services/sucursales.service';
import { MarcasService, Marca } from '../services/marcas.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-alta-vehiculo',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterModule, CommonModule],
  templateUrl: './alta-vehiculo.component.html',
  styleUrls: ['./alta-vehiculo.component.css']
})
export class AltaVehiculoComponent implements OnInit {
  
  // ============================================
  // PROPIEDADES DEL FORMULARIO
  // ============================================
  vehiculoForm: FormGroup;
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showFeedback = false;
  currentYear = new Date().getFullYear();
  createdVehicle: any = null;

  // ============================================
  // PROPIEDADES DE MARCAS
  // ============================================
  marcas: Marca[] = [];

  // ============================================
  // PROPIEDADES DE SUCURSALES
  // ============================================
  sucursales: Sucursal[] = [];

  // ============================================
  // PROPIEDADES DE IMÁGENES
  // ============================================
  imageUrls: string[] = [];
  imageUrlInput = '';
  previewVehicle: any = null;
  isVerified = false;

  // ============================================
  // UPLOAD DE ARCHIVOS
  // ============================================
  uploading = false;

  // ============================================
  // OPCIONES DE COLOR (predefinidas)
  // ============================================
  colorOptions = ['#000000', '#ffffff', '#b71c1c', '#0d47a1', '#1b5e20', '#ff9800', '#9c27b0', '#607d8b'];

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private sucursalesService: SucursalesService,
    private marcasService: MarcasService,
    private notificationService: NotificationService
  ) {
    this.vehiculoForm = this.createForm();
  }

  // ============================================
  // ngOnInit
  // ============================================
  ngOnInit(): void {
    this.cargarSucursales();
    this.cargarMarcas();
  }

  // ============================================
  // cargarSucursales - Trae sucursales para selector
  // ============================================
  cargarSucursales(): void {
    this.sucursalesService.getSucursalesTodas().subscribe({
      next: (res) => {
        if (res.success) {
          this.sucursales = res.sucursales;
        }
      },
      error: () => {
        console.error('No se pudieron cargar sucursales para el formulario de alta de vehículo.');
      }
    });
  }

  cargarMarcas(): void {
    this.marcasService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.marcas = res.marcas;
        }
      },
      error: () => {
        console.error('No se pudieron cargar las marcas para el formulario de alta de vehículo.');
      }
    });
  }

  // ============================================
  // toggle0km - Maneja el checkbox "Es 0km"
  // ============================================
  toggle0km(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.vehiculoForm.get('es0km')?.setValue(checked);
    
    const kmControl = this.vehiculoForm.get('km');
    const stockControl = this.vehiculoForm.get('stock');
    
    if (checked) {
      // Si es 0km: setea km a 0 y actualiza validaciones
      kmControl?.setValue(0);
      kmControl?.clearValidators(); // Quita los validators
      kmControl?.setValidators([Validators.min(0)]); // Solo valida que no sea negativo
      kmControl?.updateValueAndValidity();
      
      // Stock es obligatorio para 0km
      stockControl?.setValidators([Validators.required, Validators.min(1)]);
      if (!stockControl?.value || parseInt(stockControl?.value) <= 0) {
        stockControl?.setValue(1);
      }
    } else {
      // Si no es 0km: restaura validaciones del km
      kmControl?.setValidators([Validators.required, Validators.min(0)]);
      kmControl?.updateValueAndValidity();
      
      // Stock ya no es obligatorio
      stockControl?.clearValidators();
      stockControl?.setValue(null);
    }
    
    stockControl?.updateValueAndValidity();
  }

  // ============================================
  // selectColor - Selecciona un color de la paleta
  // ============================================
  selectColor(color: string): void {
    this.vehiculoForm.get('color')?.setValue(color);
  }

  // ============================================
  // createForm - Define la estructura del formulario
  // ============================================
  createForm(): FormGroup {
    return this.fb.group({
      idMarca: [null, [Validators.required]],
      modelo: ['', [Validators.required]],
      anio: ['', [
        Validators.required,
        Validators.min(1900),
        Validators.max(this.currentYear + 1)
      ]],
      precio: ['', [
        Validators.required,
        Validators.min(0.01)
      ]],
      km: ['', [
        Validators.required,
        Validators.min(0)
      ]],
      es0km: [false],
      stock: [null],
      idSucursal: [null, Validators.required],
      color: ['#000000'],
      descripcion: ['']
    });
  }

  // ============================================
  // isFieldInvalid - Verifica si un campo es inválido
  // ============================================
  isFieldInvalid(fieldName: string): boolean {
    const field = this.vehiculoForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  // ============================================
  // onSubmit - Maneja el envío del formulario
  // ============================================
  onSubmit(): void {
    this.verify();
  }

  // ============================================
  // addImage - Agrega una URL manual al array de imágenes
  // ============================================
  addImage(): void {
    const url = this.imageUrlInput?.trim();
    if (!url) return;
    this.imageUrls.push(url);
    this.imageUrlInput = '';
  }

  // ============================================
  // onFilesSelected - Maneja selección de archivos desde input
  // ============================================
  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length) this.uploadFiles(files);
    event.target.value = null;
  }

  // ============================================
  // uploadFiles - Sube archivos al servidor
  // ============================================
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

  // ============================================
  // onDrop - Maneja drag & drop de archivos
  // ============================================
  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length) {
      this.uploadFiles(ev.dataTransfer.files);
    }
  }

  // ============================================
  // onDragOver - Necesario para permitir drop
  // ============================================
  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
  }

  // ============================================
  // onPaste - Maneja pegado de imágenes desde portapapeles
  // ============================================
  async onPaste(ev: ClipboardEvent): Promise<void> {
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
      await this.uploadFiles(files);
    }
  }

  // ============================================
  // removeImage - Elimina una imagen del array
  // ============================================
  removeImage(index: number): void {
    this.imageUrls.splice(index, 1);
  }

  // ============================================
  // focusImageInput - Abre el selector de archivos
  // ============================================
  focusImageInput(): void {
    const fileInput = document.querySelector('.dropzone input[type=file]') as HTMLInputElement | null;
    if (fileInput) fileInput.click();
  }

  // ============================================
  // verify - Verifica el formulario y muestra preview
  // ============================================
  verify(): void {
    // PASO 1: Verificar si es 0km y el stock es válido
    const es0 = this.vehiculoForm.get('es0km')?.value;
    const stock = this.vehiculoForm.get('stock')?.value;
    
    if (es0 && (!stock || stock <= 0)) {
      this.message = 'Ingrese la cantidad de stock para vehículos 0 km';
      this.messageType = 'error';
      this.isVerified = false;
      return;
    }

    // PASO 2: Validar que el formulario sea válido
    if (!this.vehiculoForm.valid) {
      this.markAllFieldsAsTouched();
      this.isVerified = false;
      return;
    }

    // PASO 3: Preparar datos para preview
    const data = this.prepareFormData();
    data.color = this.vehiculoForm.get('color')?.value;
    data.stock = es0 ? parseInt(stock) || 0 : 0;
    data.es0km = es0;

    // PASO 4: Crear objeto de preview
    this.previewVehicle = { ...data };
    this.isVerified = true;

    // PASO 5: Scroll suave hacia la sección de preview
    setTimeout(() => {
      const el = document.getElementById('preview');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  // ============================================
  // register - Envía el vehículo al backend
  // ============================================
  register(): void {
    if (!this.previewVehicle) return;
    
    this.loading = true;
    this.message = '';

    this.http.post('http://localhost:3001/api/vehiculos', this.previewVehicle)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          
          if (response.success) {
            this.message = this.notificationService.success('Vehículo registrado exitosamente');
            this.messageType = 'success';
            this.showFeedback = true;
            this.createdVehicle = response.vehiculo || null;
            
            // Limpiar formulario y preview
            this.vehiculoForm.reset();
            this.imageUrls = [];
            this.previewVehicle = null;
            this.isVerified = false;
          } else {
            this.message = response.message || 'Error al registrar el vehículo';
            this.messageType = 'error';
            this.showFeedback = true;
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error en alta de vehículo:', error);

          if (error.status === 400) {
            this.message = error.error?.message || 'Datos inválidos';
          } else if (error.status === 500) {
            this.message = 'Error del servidor. Intente nuevamente.';
          } else {
            this.message = 'Error de conexión. Verifique su conexión a internet.';
          }
          this.messageType = 'error';
          this.showFeedback = true;
        }
      });
  }

  // ============================================
  // editar - Vuelve al modo edición desde preview
  // ============================================
  editar(): void {
    this.isVerified = false;
    setTimeout(() => this.focusImageInput(), 50);
  }

  // ============================================
  // prepareFormData - Prepara los datos del formulario para enviar
  // ============================================
  private prepareFormData(): any {
    const formValue = this.vehiculoForm.value;
    const es0 = this.vehiculoForm.get('es0km')?.value;

    const selectedMarca = this.marcas.find(m => m.id === Number(formValue.idMarca));

    return {
      idMarca: Number(formValue.idMarca),
      marcaTexto: selectedMarca ? selectedMarca.nombre : '',
      marcaDescripcion: selectedMarca ? selectedMarca.descripcion : '',
      modelo: formValue.modelo,
      anio: parseInt(formValue.anio),
      precio: Math.round(parseFloat(formValue.precio) * 100) / 100,
      km: es0 ? 0 : parseInt(formValue.km), // Si es 0km, siempre enviar 0
      fotos: this.imageUrls.slice(),
      descripcion: formValue.descripcion || '',
      color: formValue.color,
      stock: es0 ? parseInt(formValue.stock) || 0 : 0,
      idSucursal: formValue.idSucursal || null,
      es0km: es0
    };
  }

  // ============================================
  // markAllFieldsAsTouched - Marca todos los campos como tocados
  // ============================================
  private markAllFieldsAsTouched(): void {
    Object.keys(this.vehiculoForm.controls).forEach(key => {
      const control = this.vehiculoForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // ============================================
  // limpiarFormulario - Resetea todo el formulario
  // ============================================
  limpiarFormulario(): void {
    this.vehiculoForm.reset({
      es0km: false,
      color: '#000000'
    });
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.previewVehicle = null;
    this.isVerified = false;
    this.message = '';
    this.createdVehicle = null;
  }

  // ============================================
  // irInicio - Navega a inicio
  // ============================================
  irInicio(): void {
    this.router.navigate(['/']);
  }

  // ============================================
  // formatCurrency - Formatea un número como moneda USD
  // ============================================
  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}