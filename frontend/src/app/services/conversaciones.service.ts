import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConversacionesService {
  private apiUrl = `${environment.apiUrl}/api/conversaciones`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  create(mensaje: any): Observable<any> {
    return this.http.post(this.apiUrl, mensaje, {
      headers: this.getAuthHeaders()
    });
  }

  getByCita(idCita: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cita/${idCita}`, {
      headers: this.getAuthHeaders()
    });
  }

  getMisConversaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-conversaciones`, {
      headers: this.getAuthHeaders()
    });
  }

  markAsRead(idCita: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/cita/${idCita}/leido`, {}, {
      headers: this.getAuthHeaders()
    });
  }
}
