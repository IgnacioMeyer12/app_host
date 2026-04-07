/* SERVICIO DE VEHÍCULOS - Comunica la app con el backend para manejar vehículos */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Vehiculo {
  idVehiculo: string;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  km: number;
  stock: number;
  color?: string;
  fotos: string[];
  descripcion?: string;
  activo: boolean;
  idSucursal?: number;
  sucursal?: {
    id: number;
    nombre: string;
    direccion: string;
  };
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehiculosService {
  private apiUrl = `${environment.apiUrl}/vehiculos`;

  constructor(private http: HttpClient) {}

  /** Obtiene vehículos activos (para catálogo público) */
  getVehiculos(): Observable<{ success: boolean; vehiculos: Vehiculo[] }> {
    return this.http.get<{ success: boolean; vehiculos: Vehiculo[] }>(this.apiUrl);
  }

  /** Obtiene todos los vehículos (activos e inactivos) */
  getVehiculosTodos(): Observable<{ success: boolean; vehiculos: Vehiculo[] }> {
    return this.http.get<{ success: boolean; vehiculos: Vehiculo[] }>(`${this.apiUrl}/todas`);
  }

  /** Crea un nuevo vehículo */
  crearVehiculo(vehiculo: Omit<Vehiculo, 'idVehiculo' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.apiUrl, vehiculo);
  }

  /** Actualiza un vehículo existente (parcialmente) */
  actualizarVehiculo(idVehiculo: string, datos: Partial<Vehiculo>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/${idVehiculo}`, datos);
  }

  /** Elimina un vehículo */
  eliminarVehiculo(idVehiculo: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${idVehiculo}`);
  }
}
