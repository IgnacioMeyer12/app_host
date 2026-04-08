import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehiculosService {
  private apiUrl = `${environment.apiUrl}/api/vehiculos`;

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

  search(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get(`${this.apiUrl}/search`, { params: httpParams });
  }

  getBySucursal(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sucursal/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  create(vehiculo: any): Observable<any> {
    return this.http.post(this.apiUrl, vehiculo, {
      headers: this.getAuthHeaders()
    });
  }

  update(id: number, vehiculo: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, vehiculo, {
      headers: this.getAuthHeaders()
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  uploadImages(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post(`${environment.apiUrl}/api/upload`, formData, {
      headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` })
    });
  }
}
