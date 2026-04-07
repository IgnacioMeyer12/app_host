import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Marca {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Injectable({ providedIn: 'root' })
export class MarcasService {
  private apiUrl = 'http://localhost:3001/api/marcas';

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ success: boolean; marcas: Marca[] }> {
    return this.http.get<{ success: boolean; marcas: Marca[] }>(this.apiUrl);
  }

  getAllAdmin(): Observable<{ success: boolean; marcas: Marca[] }> {
    return this.http.get<{ success: boolean; marcas: Marca[] }>(`${this.apiUrl}/todas`);
  }

  create(marca: { nombre: string; descripcion?: string }): Observable<{ success: boolean; message: string; marca?: Marca }> {
    return this.http.post<{ success: boolean; message: string; marca?: Marca }>(this.apiUrl, marca);
  }

  update(id: number, payload: Partial<Marca>): Observable<{ success: boolean; message: string; marca?: Marca }> {
    return this.http.put<{ success: boolean; message: string; marca?: Marca }>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
