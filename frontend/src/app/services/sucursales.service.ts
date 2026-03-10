/* IMPORTACIONES
   ============= */
import { Injectable } from '@angular/core';      // Para que Angular pueda inyectar este servicio
import { HttpClient } from '@angular/common/http'; // Para hacer peticiones HTTP (GET, POST, etc.)
import { Observable } from 'rxjs';                // Para manejar respuestas asíncronas

/* INTERFAZ SUCURSAL
   ================ */
// Defino la estructura que debe tener una sucursal en mi aplicación
export interface Sucursal {
  id: number;              // Identificador único (obligatorio)
  nombre: string;          // Nombre de la sucursal (obligatorio)
  direccion?: string;      // Dirección (opcional, por eso el ?)
  telefono?: string;       // Teléfono (opcional)
  latitud: number;         // Coordenada para el mapa (obligatoria)
  longitud: number;        // Coordenada para el mapa (obligatoria)
  activa: boolean;         // Si está activa o no (obligatorio)
  fecha_creacion?: string; // Fecha de creación (opcional, la asigna el backend)
}

/* SERVICIO DE SUCURSALES
   ===================== */
@Injectable({
  providedIn: 'root'  // Este servicio está disponible en toda la aplicación (singleton)
})
export class SucursalesService {
  
  private apiUrl = 'http://localhost:3001/api/sucursales';  // Dirección del backend

  // El constructor inyecta el HttpClient para poder hacer peticiones
  constructor(private http: HttpClient) { }

  // Obtener todas las sucursales activas (las que se muestran en el mapa)
  getSucursales(): Observable<{ success: boolean; sucursales: Sucursal[] }> {
    return this.http.get<{ success: boolean; sucursales: Sucursal[] }>(this.apiUrl);
  }

  // Obtener TODAS las sucursales (incluyendo inactivas) - solo para administradores
  getSucursalesTodas(): Observable<{ success: boolean; sucursales: Sucursal[] }> {
    return this.http.get<{ success: boolean; sucursales: Sucursal[] }>(`${this.apiUrl}/todas`);
  }

  // Crear una nueva sucursal
  // Uso Omit para decir: "esto es una sucursal pero sin id ni fecha_creacion (los pone el backend)"
  crearSucursal(sucursal: Omit<Sucursal, 'id' | 'fecha_creacion'>): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.apiUrl, sucursal);
  }

  // Actualizar una sucursal existente
  // Uso Partial para decir: "puede venir con algunos campos, no necesariamente todos"
  actualizarSucursal(id: number, sucursal: Partial<Sucursal>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, sucursal);
  }

  // Eliminar una sucursal (borrado lógico en el backend)
  eliminarSucursal(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}