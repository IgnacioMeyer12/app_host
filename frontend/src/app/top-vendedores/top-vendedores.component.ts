import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-top-vendedores',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-vendedores.component.html',
  styleUrls: ['./top-vendedores.component.css']
})
export class TopVendedoresComponent implements OnInit {
  ranking: any[] = [];
  loading = false;
  message = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.http.get('http://localhost:3001/api/calificaciones/ranking').subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.ranking = res.ranking;
        } else {
          this.message = res.message || 'No hay ranking disponible';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error conectando al servidor';
      }
    });
  }
}
