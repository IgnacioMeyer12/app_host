/* SERVICIO DE VENDEDORES */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Vendedor {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rol?: string;
  password?: string;
  activo: boolean;
  fecha_registro?: string;
  idSucursal: number;
  sucursal?: {
    id: number;
    nombre: string;
    direccion?: string;
  };
  totalCalificaciones?: number;
  puntuacionPromedio?: number;
}

@Injectable({ providedIn: 'root' })
export class VendedoresService {
  private apiUrl = `${environment.apiUrl}/vendedores`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) {
      return { headers: new HttpHeaders() };
    }
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  getAll(): Observable<{ success: boolean; vendedores: Vendedor[] }> {
    return this.http.get<{ success: boolean; vendedores: Vendedor[] }>(this.apiUrl, this.getAuthHeaders());
  }

  getBySucursal(idSucursal: number): Observable<{ success: boolean; vendedores: Vendedor[] }> {
    return this.http.get<{ success: boolean; vendedores: Vendedor[] }>(`${this.apiUrl}/sucursal/${idSucursal}`, this.getAuthHeaders());
  }

  create(vendedor: { dni: string; idSucursal: number; nombre: string; apellido: string; telefono: string; password: string }): Observable<{ success: boolean; message: string; vendedor?: Vendedor }> {
    return this.http.post<{ success: boolean; message: string; vendedor?: Vendedor }>(this.apiUrl, vendedor, this.getAuthHeaders());
  }

  update(id: number, payload: Partial<Vendedor>): Observable<{ success: boolean; message: string; vendedor?: Vendedor }> {
    return this.http.put<{ success: boolean; message: string; vendedor?: Vendedor }>(`${this.apiUrl}/${id}`, payload, this.getAuthHeaders());
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
