import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-conversaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vendedor-conversaciones.component.html',
  styleUrls: ['./vendedor-conversaciones.component.css']
})
export class VendedorConversacionesComponent implements OnInit {
  conversaciones: any[] = [];
  conversacionSeleccionada: any = null;
  nuevoMensaje = '';
  loading = false;
  enviandoMensaje = false;
  message = '';

  searchTerm = '';
  filterSucursal = '';
  filterVehiculo = '';
  activeCitaId: number | null = null;
  currentUserDni = '';
  currentUserRole = '';

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  volverAMisCitas(): void {
    this.router.navigate(['/mis-citas']);
  }

  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      alert('Debes iniciar sesión');
      this.router.navigate(['/']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      const idCita = Number(params['idCita'] || localStorage.getItem('activeCitaId'));
      if (idCita && !isNaN(idCita)) {
        this.activeCitaId = idCita;
      }
    });

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserDni = currentUser.dni ? String(currentUser.dni) : '';
    this.currentUserRole = currentUser.rol || '';

    this.fetchConversaciones();
  }

  fetchConversaciones(): void {
    this.loading = true;
    this.http.get('http://localhost:3001/api/conversaciones/mis-conversaciones').subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.conversaciones = res.conversaciones || [];
          this.ordenarConversaciones();

          if (this.activeCitaId) {
            this.conversacionSeleccionada = this.conversaciones.find(conv => conv.idCita === this.activeCitaId) || null;
            localStorage.removeItem('activeCitaId');
          }

          if (this.conversacionSeleccionada) {
            this.conversacionSeleccionada.mensajesNoLeidos = 0;
            this.moverConversacionAlInicio(this.conversacionSeleccionada.idCita);
          }
        } else {
          this.message = res.message || 'No hay conversaciones';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error conectando al servidor';
      }
    });
  }

  seleccionarConversacion(conversacion: any): void {
    this.conversacionSeleccionada = conversacion;
    this.nuevoMensaje = '';
    this.activeCitaId = conversacion?.idCita || null;

    if (conversacion && conversacion.mensajesNoLeidos) {
      conversacion.mensajesNoLeidos = 0;
    }

    if (conversacion?.idCita) {
      this.fetchConversacion(conversacion.idCita);
      this.marcarComoLeido(conversacion.idCita);
    }
  }

  filteredConversaciones(): any[] {
    const term = this.searchTerm?.trim().toLowerCase() || '';
    return this.conversaciones.filter(conv => {
      const cliente = ((conv.cita?.cliente?.nombre || '') + ' ' + (conv.cita?.cliente?.apellido || '')).toLowerCase();
      const vendedor = ((conv.cita?.vendedor?.nombre || '') + ' ' + (conv.cita?.vendedor?.apellido || '')).toLowerCase();
      const auto = ((conv.cita?.vehiculo?.marca?.nombre || '') + ' ' + (conv.cita?.vehiculo?.modelo || '')).toLowerCase();
      const sucursal = (conv.cita?.sucursal?.nombre || conv.cita?.vendedor?.sucursal?.nombre || '').toLowerCase();
      const last = (conv.ultimoMensaje || '').toLowerCase();

      const matchesSearch = !term || cliente.includes(term) || vendedor.includes(term) || auto.includes(term) || last.includes(term);
      const matchesSucursal = !this.filterSucursal || sucursal === this.filterSucursal.toLowerCase();
      const matchesVehiculo = !this.filterVehiculo || auto.includes(this.filterVehiculo.toLowerCase());

      return matchesSearch && matchesSucursal && matchesVehiculo;
    });
  }

  get sucursales(): string[] {
    const set = new Set<string>();
    this.conversaciones.forEach(conv => {
      const name = conv.cita?.sucursal?.nombre || conv.cita?.vendedor?.sucursal?.nombre;
      if (name) set.add(name);
    });
    return [...set];
  }

  get vehiculos(): string[] {
    const set = new Set<string>();
    this.conversaciones.forEach(conv => {
      const v = `${conv.cita?.vehiculo?.marca?.nombre || ''} ${conv.cita?.vehiculo?.modelo || ''}`.trim();
      if (v) set.add(v);
    });
    return [...set];
  }

  fetchConversacion(idCita: number): void {
    if (!idCita) return;

    this.http.get(`http://localhost:3001/api/conversaciones/cita/${idCita}`).subscribe({
      next: (res: any) => {
        if (res?.success) {
          const citaData = res.cita || this.conversacionSeleccionada?.cita || {};
          const mensajes = (res.conversaciones || []).map((msg: any) => {
            const emisorDni = String(msg.idEmisor || '').trim();
            const receptorDni = String(msg.idReceptor || '').trim();
            const currentDni = String(this.currentUserDni || '').trim();
            const clienteDni = String(citaData?.cliente?.dni || '').trim();
            const vendedorDni = String(citaData?.vendedor?.dni || '').trim();

            const isMine = emisorDni && currentDni && emisorDni === currentDni;
            let sender = 'Desconocido';
            let recipient = 'Desconocido';

            if (isMine) {
              sender = 'Tú';
            } else if (clienteDni && emisorDni === clienteDni) {
              sender = `${citaData.cliente.nombre || 'Cliente'} ${citaData.cliente.apellido || ''}`.trim();
            } else if (vendedorDni && emisorDni === vendedorDni) {
              sender = `${citaData.vendedor.nombre || 'Vendedor'} ${citaData.vendedor.apellido || ''}`.trim();
            }

            if (receptorDni && receptorDni === currentDni) {
              recipient = 'Tú';
            } else if (clienteDni && receptorDni === clienteDni) {
              recipient = `${citaData.cliente.nombre || 'Cliente'} ${citaData.cliente.apellido || ''}`.trim();
            } else if (vendedorDni && receptorDni === vendedorDni) {
              recipient = `${citaData.vendedor.nombre || 'Vendedor'} ${citaData.vendedor.apellido || ''}`.trim();
            } else if (this.currentUserRole === 'vendedor') {
              recipient = 'Vendedor';
            } else if (this.currentUserRole === 'cliente') {
              recipient = 'Cliente';
            }

            if (!sender || sender === 'Desconocido') {
              if (emisorDni === currentDni) {
                sender = 'Tú';
              } else if (clienteDni && emisorDni === clienteDni) {
                sender = `${citaData.cliente.nombre || 'Cliente'} ${citaData.cliente.apellido || ''}`.trim();
              } else if (vendedorDni && emisorDni === vendedorDni) {
                sender = `${citaData.vendedor.nombre || 'Vendedor'} ${citaData.vendedor.apellido || ''}`.trim();
              } else {
                sender = this.currentUserRole === 'vendedor' ? 'Cliente' : (this.currentUserRole === 'cliente' ? 'Vendedor' : 'Tú');
              }
            }

            if (!recipient || recipient === 'Desconocido') {
              if (receptorDni === currentDni) {
                recipient = 'Tú';
              } else if (clienteDni && receptorDni === clienteDni) {
                recipient = `${citaData.cliente.nombre || 'Cliente'} ${citaData.cliente.apellido || ''}`.trim();
              } else if (vendedorDni && receptorDni === vendedorDni) {
                recipient = `${citaData.vendedor.nombre || 'Vendedor'} ${citaData.vendedor.apellido || ''}`.trim();
              } else {
                recipient = this.currentUserRole === 'vendedor' ? 'Cliente' : (this.currentUserRole === 'cliente' ? 'Vendedor' : 'Desconocido');
              }
            }

            return {
              ...msg,
              isMine,
              sender,
              recipient
            };
          });

          const converted = this.conversaciones.find(conv => conv.idCita === idCita);
          if (converted) {
            converted.mensajes = mensajes;
            converted.ultimoMensaje = mensajes.length ? mensajes[mensajes.length - 1].mensaje : '';
            converted.ultimoMensajeSender = mensajes.length ? mensajes[mensajes.length - 1].sender : '';
            converted.ultimoMensajeFecha = mensajes.length ? mensajes[mensajes.length - 1].fecha_creacion : converted.ultimoMensajeFecha;
            converted.mensajesNoLeidos = mensajes.filter((m: any) => !m.leido && m.idReceptor === this.currentUserDni).length;
            this.moverConversacionAlInicio(idCita);
          }

          this.conversacionSeleccionada = converted || {
            idCita,
            cita: res.cita,
            mensajes,
            ultimoMensaje: mensajes.length ? mensajes[mensajes.length - 1].mensaje : '',
            ultimoMensajeFecha: mensajes.length ? mensajes[mensajes.length - 1].fecha_creacion : '',
            mensajesNoLeidos: mensajes.filter((m: any) => !m.leido && m.idReceptor === this.currentUserDni).length
          };

          // Reordenar lista tras cambiar mensajes para comportamiento tipo WhatsApp
          this.ordenarConversaciones();
        }
      },
      error: (err) => {
        console.error('Error cargando conversación:', err);
      }
    });
  }

  marcarComoLeido(idCita: number): void {
    if (!idCita) return;
    this.http.put(`http://localhost:3001/api/conversaciones/cita/${idCita}/leido`, {}).subscribe({
      next: () => {
        const conv = this.conversaciones.find(c => c.idCita === idCita);
        if (conv) conv.mensajesNoLeidos = 0;
      },
      error: err => {
        console.error('Error marcando como leídos:', err);
      }
    });
  }

  ordenarConversaciones(): void {
    this.conversaciones.sort((a, b) => {
      const aTime = new Date(a.ultimoMensajeFecha || a.cita?.fecha_creacion || a.cita?.fecha).getTime();
      const bTime = new Date(b.ultimoMensajeFecha || b.cita?.fecha_creacion || b.cita?.fecha).getTime();
      return bTime - aTime;
    });
  }

  private moverConversacionAlInicio(idCita: number): void {
    if (!idCita) return;
    const index = this.conversaciones.findIndex(conv => conv.idCita === idCita);
    if (index <= 0) return;
    const [conv] = this.conversaciones.splice(index, 1);
    this.conversaciones.unshift(conv);
  }

  private actualizarUltimoMensajeEnLista(idCita: number, mensaje: string): void {
    const conv = this.conversaciones.find(c => c.idCita === idCita);
    if (!conv) return;
    conv.ultimoMensaje = mensaje;
    conv.ultimoMensajeFecha = new Date().toISOString();
    this.moverConversacionAlInicio(idCita);
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.conversacionSeleccionada) return;

    this.enviandoMensaje = true;
    const payload = {
      idCita: this.conversacionSeleccionada.idCita || this.conversacionSeleccionada.cita?.id || null,
      mensaje: this.nuevoMensaje,
      tipo: 'texto'
    };

    this.http.post('http://localhost:3001/api/conversaciones', payload).subscribe({
      next: (res: any) => {
        this.enviandoMensaje = false;
        if (res.success) {
          this.actualizarUltimoMensajeEnLista(this.conversacionSeleccionada?.idCita || 0, this.nuevoMensaje);
          this.nuevoMensaje = '';
          this.fetchConversaciones();
          if (this.conversacionSeleccionada?.idCita) {
            this.fetchConversacion(this.conversacionSeleccionada.idCita);
          }
        }
      },
      error: (err) => {
        this.enviandoMensaje = false;
        this.message = err.error?.message || 'Error enviando mensaje';
        console.error('Error enviando mensaje:', err);
      }
    });
  }

  obtenerNombreContacto(conversacion: any): string {
    if (!conversacion || !conversacion.cita) return 'Contacto';

    const cliente = conversacion.cita.cliente;
    const vendedor = conversacion.cita.vendedor;

    if (this.currentUserDni === cliente?.dni) {
      return `${vendedor?.nombre || 'Vendedor'} ${vendedor?.apellido || ''}`.trim();
    }
    if (this.currentUserDni === vendedor?.dni) {
      return `${cliente?.nombre || 'Cliente'} ${cliente?.apellido || ''}`.trim();
    }

    return `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim() || 'Contacto';
  }

  obtenerRemitente(msg: any, cita: any): string {
    if (!msg) return '';
    if (msg.isMine) {
      return 'Tú';
    }

    if (cita?.cliente?.dni && msg.idEmisor === cita.cliente.dni) {
      return `${cita.cliente.nombre || 'Cliente'} ${cita.cliente.apellido || ''}`.trim();
    }

    if (cita?.vendedor?.dni && msg.idEmisor === cita.vendedor.dni) {
      return `${cita.vendedor.nombre || 'Vendedor'} ${cita.vendedor.apellido || ''}`.trim();
    }

    // Fallback global por rol
    if (this.currentUserRole === 'vendedor') return 'Cliente';
    if (this.currentUserRole === 'cliente') return 'Vendedor';

    return 'Desconocido';
  }

  obtenerReceptor(msg: any, cita: any): string {
    if (!msg) return '';

    if (msg.idReceptor === this.currentUserDni) {
      return 'Tú';
    }

    if (cita?.cliente?.dni && msg.idReceptor === cita.cliente.dni) {
      return `${cita.cliente.nombre || 'Cliente'} ${cita.cliente.apellido || ''}`.trim();
    }

    if (cita?.vendedor?.dni && msg.idReceptor === cita.vendedor.dni) {
      return `${cita.vendedor.nombre || 'Vendedor'} ${cita.vendedor.apellido || ''}`.trim();
    }

    if (this.currentUserRole === 'vendedor') return 'Vendedor';
    if (this.currentUserRole === 'cliente') return 'Cliente';

    return 'Desconocido';
  }

  obtenerIdentidadChat(): string {
    if (!this.conversacionSeleccionada || !this.conversacionSeleccionada.cita) return '';

    return this.currentUserRole === 'vendedor'
      ? `Conversación entre tú (Vendedor) y ${this.conversacionSeleccionada.cita.cliente?.nombre || 'Cliente'}`
      : `Conversación entre tú (Cliente) y ${this.conversacionSeleccionada.cita.vendedor?.nombre || 'Vendedor'}`;
  }

  formatearFecha(fecha: any): string {
    const date = new Date(fecha);
    if (!fecha || isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

    finalizarCitaDesdeChat(cita: any): void {
      if (!cita?.id) {
        alert('ID de cita no válido');
        return;
      }
      if (this.currentUserRole !== 'vendedor') {
        alert('Solo el vendedor puede finalizar una cita');
        return;
      }
      if (!confirm('¿Seguro que deseas finalizar esta cita?')) return;
      this.loading = true;
      this.http.put(`http://localhost:3001/api/citas/${cita.id}/finalizar`, {}).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.success) {
            alert('Cita finalizada correctamente');
            this.fetchConversaciones();
          } else {
            alert(res.message || 'No se pudo finalizar la cita');
          }
        },
        error: (err) => {
          this.loading = false;
          alert(err.error?.message || 'Error al finalizar la cita');
        }
      });
    }
}
