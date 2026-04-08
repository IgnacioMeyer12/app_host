import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  userData = {
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  };

  loading = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.userData.password !== this.userData.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const { confirmPassword, ...registerData } = this.userData;

    this.authService.register(registerData).subscribe({
      next: (res: any) => {
        this.success = 'Registro exitoso. Redirigiendo al login...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al registrarse';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
