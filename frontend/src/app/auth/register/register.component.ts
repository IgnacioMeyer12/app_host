// ============================================
// COMPONENTE REGISTRO (RegisterComponent)
// ============================================
// Maneja el registro de nuevos usuarios en la aplicación.
// Soporta dos modos:
// - Registro público: cualquier persona puede registrarse como cliente
// - Registro de administradores: solo accesible para admins (vía ?as=admin en URL)
// Incluye validaciones, medidor de fortaleza de contraseña y toggle de visibilidad.
// ============================================

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms'; // Para formularios reactivos
import { HttpClient } from '@angular/common/http'; // Para peticiones HTTP
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; // Para navegación y parámetros URL
import { CommonModule } from '@angular/common'; // Para directivas *ngIf, *ngFor

@Component({
  selector: 'app-register',                    // Etiqueta HTML: <app-register>
  standalone: true,                             // Componente independiente
  imports: [ReactiveFormsModule, RouterModule, CommonModule], // Módulos que necesita
  templateUrl: './register.component.html',      // HTML del componente
  styleUrls: ['./register.component.css']        // Estilos del componente
})
export class RegisterComponent implements OnInit {
  
  // ============================================
  // PROPIEDADES
  // ============================================
  loading = false;                 // Controla estado de carga
  currentYear = new Date().getFullYear(); // Año actual para el footer
  registerForm: FormGroup;         // Formulario reactivo
  showPassword = false;            // Controla visibilidad del campo password
  showConfirmPassword = false;     // Controla visibilidad del campo confirmPassword

  adminMode = false;               // Indica si estamos en modo registro de admin

  // ============================================
  // CONSTRUCTOR - Inyecta dependencias y configura formulario
  // ============================================
  constructor(
    private fb: FormBuilder,           // Para crear formularios reactivos
    private http: HttpClient,           // Para peticiones HTTP
    private router: Router,             // Para navegar entre páginas
    private route: ActivatedRoute       // Para leer parámetros de la URL
  ) {
    // Configura el formulario con validaciones
    this.registerForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(7)]],          // DNI obligatorio, mínimo 7 caracteres
      nombre: ['', [Validators.required]],                                 // Nombre obligatorio
      apellido: ['', [Validators.required]],                               // Apellido obligatorio
      telefono: ['', [Validators.required]],                               // Teléfono obligatorio
      password: ['', [Validators.required, Validators.minLength(6)]],      // Password obligatorio, mínimo 6 caracteres
      confirmPassword: ['', [Validators.required]]                         // Confirmación obligatoria
    }, { validators: this.passwordMatchValidator }); // Validador personalizado que compara password y confirmPassword
  }

  // ============================================
  // ngOnInit - Se ejecuta al iniciar el componente
  // ============================================
  ngOnInit(): void {
    // Lee los parámetros de la URL (ej: ?as=admin)
    this.route.queryParams.subscribe((params: any) => {
      if (params['as'] === 'admin') {
        // Modo admin: verificar que el usuario actual sea administrador
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
          alert('Debes iniciar sesión como administrador');
          this.router.navigate(['/']);
          return;
        }
        const user = JSON.parse(currentUser);
        if (user.rol !== 'admin') {
          alert('Acceso denegado. Solo administradores pueden dar de alta otros admins.');
          this.router.navigate(['/']);
          return;
        }
        this.adminMode = true; // Activa el modo admin
      }
    });
  }

  // ============================================
  // passwordMatchValidator - Valida que password y confirmPassword coincidan
  // ============================================
  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { mismatch: true }; // Error: no coinciden
    }
    return null; // Válido
  }

  // ============================================
  // togglePasswordVisibility - Muestra/oculta la contraseña
  // ============================================
  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else if (field === 'confirmPassword') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // ============================================
  // getPasswordStrength - Evalúa la fortaleza de la contraseña
  // ============================================
  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (password.length === 0) return 'empty';
    if (password.length < 6) return 'weak';      // Menos de 6: débil
    if (password.length < 8) return 'medium';    // 6-7: media
    return 'strong';                              // 8+: fuerte
  }

  // ============================================
  // getPasswordStrengthText - Texto descriptivo de la fortaleza
  // ============================================
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'empty': return '';
      case 'weak': return 'Débil';
      case 'medium': return 'Media';
      case 'strong': return 'Fuerte';
      default: return '';
    }
  }

  // ============================================
  // onRegister - Procesa el envío del formulario
  // ============================================
  onRegister(): void {
    // PASO 1: Validar que el formulario sea válido
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar errores
      return;
    }

    this.loading = true; // Activa el estado de carga
    
    // PASO 2: Preparar payload (datos a enviar)
    const payload: any = { ...this.registerForm.value };
    delete payload.confirmPassword; // Elimina confirmPassword (no va al backend)

    // PASO 3: Determinar si es registro de admin o cliente
    if (this.adminMode) {
      // REGISTRO DE ADMINISTRADOR
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || currentUser.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores.');
        this.router.navigate(['/']);
        this.loading = false;
        return;
      }
      
      // Agrega datos adicionales para el backend
      payload.creatorDni = currentUser.dni; // Quién está creando este admin
      payload.rol = 'admin';                 // Rol a asignar

      // Envía al mismo endpoint pero con datos de admin
      this.http.post('http://localhost:3001/api/register', payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res?.success) {
            alert('Administrador creado correctamente');
            this.router.navigate(['/']);
          } else {
            alert(res.message || 'Error creando administrador');
          }
        },
        error: (err) => {
          this.loading = false;
          alert(err.error?.message || 'Error del servidor');
        }
      });

    } else {
      // REGISTRO PÚBLICO (clientes)
      this.http.post('http://localhost:3001/api/register', payload).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            this.router.navigate(['/']);
          } else {
            alert(response.message || 'Error en el registro');
          }
        },
        error: (error) => {
          this.loading = false;
          if (error.status === 400) {
            alert(error.error?.message || 'Error en el registro. Verifique los datos.');
          } else {
            alert('Error del servidor. Intente nuevamente.');
          }
        }
      });
    }
  }
}