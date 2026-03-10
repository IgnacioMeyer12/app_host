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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms'; // Formularios reactivos
import { HttpClient } from '@angular/common/http'; // Peticiones HTTP
import { Router, RouterModule } from '@angular/router'; // Navegación
import { CommonModule } from '@angular/common'; // Directivas *ngIf, *ngFor

@Component({
  selector: 'app-alta-vehiculo',           // Etiqueta HTML: <app-alta-vehiculo>
  standalone: true,                         // Componente independiente
  imports: [ReactiveFormsModule, FormsModule, RouterModule, CommonModule], // Módulos que necesita
  templateUrl: './alta-vehiculo.component.html', // HTML del componente
  styleUrls: ['./alta-vehiculo.component.css']   // Estilos del componente
})
export class AltaVehiculoComponent implements OnInit {
  
  // ============================================
  // PROPIEDADES DEL FORMULARIO
  // ============================================
  vehiculoForm: FormGroup;           // Formulario reactivo
  loading = false;                    // Estado de carga
  message = '';                       // Mensaje para el usuario
  messageType: 'success' | 'error' = 'success'; // Tipo de mensaje (verde/rojo)
  currentYear = new Date().getFullYear(); // Año actual para validaciones
  createdVehicle: any = null;          // Datos del vehículo recién creado

  // ============================================
  // PROPIEDADES DE IMÁGENES
  // ============================================
  imageUrls: string[] = [];            // Array con URLs de las imágenes subidas
  imageUrlInput = '';                  // Input para agregar URL manualmente
  previewVehicle: any = null;           // Datos del vehículo en modo preview
  isVerified = false;                   // Controla si ya se verificó el formulario

  // ============================================
  // UPLOAD DE ARCHIVOS
  // ============================================
  uploading = false;                    // Indica si se están subiendo archivos

  // ============================================
  // OPCIONES DE COLOR (predefinidas)
  // ============================================
  colorOptions = ['#000000', '#ffffff', '#b71c1c', '#0d47a1', '#1b5e20', '#ff9800', '#9c27b0', '#607d8b'];

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias y crea formulario
  // ============================================
  constructor(
    private fb: FormBuilder,      // Para formularios reactivos
    private http: HttpClient,      // Para peticiones HTTP
    private router: Router         // Para navegación
  ) {
    this.vehiculoForm = this.createForm(); // Crea el formulario al instanciar
  }

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {}

  // ============================================
  // toggle0km - Maneja el checkbox "Es 0km"
  // ============================================
  toggle0km(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.vehiculoForm.get('es0km')?.setValue(checked);
    const kmControl = this.vehiculoForm.get('km');
    
    if (checked) {
      // Si es 0km: setea km a 0 y deshabilita el campo km
      kmControl?.setValue(0);
      kmControl?.disable({ emitEvent: false });
      
      // Asegura que haya al menos 1 en stock
      const stockControl = this.vehiculoForm.get('stock');
      if (!stockControl?.value || parseInt(stockControl?.value) <= 0) {
        stockControl?.setValue(1);
      }
    } else {
      // Si no es 0km: habilita el campo km nuevamente
      kmControl?.enable({ emitEvent: false });
    }
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
      // idVehiculo lo genera el backend, no lo ingresa el usuario
      marca: ['', [Validators.required]],                    // Marca obligatoria
      modelo: ['', [Validators.required]],                   // Modelo obligatorio
      anio: ['', [                                           // Año con validaciones
        Validators.required,
        Validators.min(1900),
        Validators.max(this.currentYear + 1)
      ]],
      precio: ['', [                                          // Precio obligatorio, positivo
        Validators.required,
        Validators.min(0.01)
      ]],
      km: ['', [                                              // Kilometraje obligatorio, no negativo
        Validators.required,
        Validators.min(0)
      ]],
      es0km: [false],                                         // Checkbox 0km (por defecto false)
      stock: [1],                                             // Stock (por defecto 1)
      color: ['#000000'],                                     // Color (por defecto negro)
      descripcion: ['']                                       // Descripción opcional
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
    // En lugar de enviar directamente, va al paso de verificación
    this.verify();
  }

  // ============================================
  // addImage - Agrega una URL manual al array de imágenes
  // ============================================
  addImage(): void {
    const url = this.imageUrlInput?.trim();
    if (!url) return;
    this.imageUrls.push(url);
    this.imageUrlInput = ''; // Limpia el input
  }

  // ============================================
  // onFilesSelected - Maneja selección de archivos desde input
  // ============================================
  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length) this.uploadFiles(files);
    // Resetea el input para permitir seleccionar el mismo archivo nuevamente
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
        this.imageUrls.push(...res.files); // Agrega las URLs de las imágenes subidas
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
    // PASO 1: Validar que el formulario sea válido
    if (!this.vehiculoForm.valid) {
      this.markAllFieldsAsTouched();
      this.isVerified = false;
      return;
    }

    // PASO 2: Si es 0km, verificar que haya stock
    const es0 = this.vehiculoForm.get('es0km')?.value;
    if (es0) {
      const stock = parseInt(this.vehiculoForm.get('stock')?.value) || 0;
      if (stock <= 0) {
        this.message = 'Ingrese la cantidad de stock para vehículos 0 km';
        this.messageType = 'error';
        this.isVerified = false;
        return;
      }
    }

    // PASO 3: Preparar datos para preview
    const data = this.prepareFormData();
    data.color = this.vehiculoForm.get('color')?.value;
    data.stock = this.vehiculoForm.get('stock')?.value || 0;
    data.es0km = this.vehiculoForm.get('es0km')?.value || false;

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
            this.message = 'Vehículo registrado exitosamente';
            this.messageType = 'success';
            this.createdVehicle = response.vehiculo || null;
            
            // Limpiar formulario y preview
            this.vehiculoForm.reset();
            this.imageUrls = [];
            this.previewVehicle = null;
            this.isVerified = false;
          } else {
            this.message = response.message || 'Error al registrar el vehículo';
            this.messageType = 'error';
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

    // Usar el array imageUrls en lugar de un textarea
    const fotosArray = this.imageUrls.slice();

    return {
      marca: formValue.marca,
      modelo: formValue.modelo,
      anio: parseInt(formValue.anio),
      precio: Math.round(parseFloat(formValue.precio) * 100) / 100, // Redondea a 2 decimales
      km: parseInt(formValue.km),
      fotos: fotosArray,
      descripcion: formValue.descripcion || ''
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
    this.vehiculoForm.reset();
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.previewVehicle = null;
    this.isVerified = false;
    this.message = '';
    this.createdVehicle = null;
  }

  // ============================================
  // irInicio - Navega a home
  // ============================================
  irInicio(): void {
    this.router.navigate(['/home']);
  }

  // ============================================
  // formatCurrency - Formatea un número como moneda USD
  // ============================================
  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}