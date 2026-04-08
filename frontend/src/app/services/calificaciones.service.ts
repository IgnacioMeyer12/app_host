import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalificacionesService {
  private apiUrl = `${environment.apiUrl}/api/calificaciones`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  create(calificacion: any): Observable<any> {
    return this.http.post(this.apiUrl, calificacion, {
      headers: this.getAuthHeaders()
    });
  }

  getByVendedor(idVendedor: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/vendedor/${idVendedor}`, {
      headers: this.getAuthHeaders()
    });
  }

  getMisCalificaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-calificaciones`, {
      headers: this.getAuthHeaders()
    });
  }

  getRanking(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ranking`, {
      headers: this.getAuthHeaders()
    });
  }

  getByCita(idCita: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cita/${idCita}`, {
      headers: this.getAuthHeaders()
    });
  }
}
