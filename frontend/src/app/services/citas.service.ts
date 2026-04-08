import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private apiUrl = `${environment.apiUrl}/api/citas`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  create(cita: any): Observable<any> {
    return this.http.post(this.apiUrl, cita, {
      headers: this.getAuthHeaders()
    });
  }

  checkAvailability(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get(`${this.apiUrl}/availability`, { params: httpParams });
  }

  getAllCitas(): Observable<any> {
    return this.http.get(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getMisCitas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-citas`, {
      headers: this.getAuthHeaders()
    });
  }

  getVendedorCitas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vendedor-citas`, {
      headers: this.getAuthHeaders()
    });
  }

  update(id: number, cita: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cita, {
      headers: this.getAuthHeaders()
    });
  }

  confirmar(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/confirmar`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  cancelar(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cancelar`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  finalizar(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/finalizar`, {}, {
      headers: this.getAuthHeaders()
    });
  }
}
