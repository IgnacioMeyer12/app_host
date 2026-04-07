/* SERVICIO DE SUCURSALES - Comunica la app con el backend para todo lo relacionado a sucursales */
/* IMPORTACIONES
   ============= */
import { Injectable } from '@angular/core';      // Hace que el servicio sea inyectable
import { HttpClient } from '@angular/common/http'; // Permite hacer peticiones HTTP
import { Observable } from 'rxjs';                // Maneja respuestas asíncronas

/* INTERFAZ SUCURSAL - Define la estructura de datos de una sucursal */
export interface Sucursal {
  id: number;              // ID único
  nombre: string;          // Nombre
  direccion?: string;      // Dirección (opcional)
  telefono?: string;       // Teléfono (opcional)
  latitud: number;         // Latitud para el mapa
  longitud: number;        // Longitud para el mapa
  horario_inicio?: string; // Horario de apertura HH:mm
  horario_fin?: string;    // Horario de cierre HH:mm
  activa: boolean;         // Estado (activa/inactiva)
  fecha_creacion?: string; // Fecha (opcional, la pone el backend)
}

@Injectable({
  providedIn: 'root'  // Disponible en toda la app
})
export class SucursalesService {
  
  private apiUrl = 'http://localhost:3001/api/sucursales';  // URL del backend

  constructor(private http: HttpClient) { } // Inyecta HttpClient para hacer peticiones

  // Trae las sucursales activas (para el mapa público)
  getSucursales(): Observable<{ success: boolean; sucursales: Sucursal[] }> {
    return this.http.get<{ success: boolean; sucursales: Sucursal[] }>(this.apiUrl);
  }

  // Trae TODAS las sucursales (para el panel admin)
  getSucursalesTodas(): Observable<{ success: boolean; sucursales: Sucursal[] }> {
    return this.http.get<{ success: boolean; sucursales: Sucursal[] }>(`${this.apiUrl}/todas`);
  }

  // Crea una sucursal nueva (sin ID ni fecha, los genera el backend)
  crearSucursal(sucursal: Omit<Sucursal, 'id' | 'fecha_creacion'>): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.apiUrl, sucursal);
  }

  // Actualiza una sucursal existente (solo envía los campos modificados)
  actualizarSucursal(id: number, sucursal: Partial<Sucursal>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, sucursal);
  }

  // Elimina una sucursal (borrado lógico en backend)
  eliminarSucursal(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}