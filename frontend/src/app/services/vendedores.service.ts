import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VendedoresService {
  private apiUrl = `${environment.apiUrl}/api/vendedores`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getBySucursal(idSucursal: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sucursal/${idSucursal}`, {
      headers: this.getAuthHeaders()
    });
  }

  create(vendedor: any): Observable<any> {
    return this.http.post(this.apiUrl, vendedor, {
      headers: this.getAuthHeaders()
    });
  }

  update(id: number, vendedor: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, vendedor, {
      headers: this.getAuthHeaders()
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
