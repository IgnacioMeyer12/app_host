import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  private apiUrl = `${environment.apiUrl}/api/sucursales`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getAllAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/todas`, {
      headers: this.getAuthHeaders()
    });
  }

  create(sucursal: any): Observable<any> {
    return this.http.post(this.apiUrl, sucursal, {
      headers: this.getAuthHeaders()
    });
  }

  update(id: number, sucursal: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, sucursal, {
      headers: this.getAuthHeaders()
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
