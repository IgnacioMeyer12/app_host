import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuditoriasService {
  private baseUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  /** Devuelve todos los vehículos (activos e inactivos) */
  getAllVehiculos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehiculos/todas`);
  }

  /** Devuelve todas las sucursales (activas e inactivas) */
  getAllSucursales(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sucursales/todas`);
  }

  /** Devuelve todas las citas */
  getAllCitas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/citas`);
  }

  /** Devuelve todos los usuarios (sin contraseñas) */
  getAllUsuarios(): Observable<any> {
    return this.http.get(`${this.baseUrl}/usuarios`);
  }
}
