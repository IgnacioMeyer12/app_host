// ============================================
// SERVICIO DE MAPA (MapService)
// ============================================
// Es un servicio que maneja TODA la lógica de mapas en la aplicación.
// Centraliza la creación, configuración y manipulación de mapas con Leaflet/OpenStreetMap.
// ============================================

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // Disponible en toda la app
})
export class MapService {
  // ============================================
  // PROPIEDADES PRIVADAS
  // ============================================
  private map: any;              // Instancia del mapa Leaflet
  private markers: any[] = [];   // Array con todos los marcadores
  private leafletLoaded = false; // Controla si Leaflet ya se cargó
  private mapInitialized = false; // Controla si el mapa ya está listo
  private currentMarker: any = null; // Marcador actual (seleccionado)
  private onSucursalClick: ((sucursal: any) => void) | null = null; // Callback cuando se selecciona sucursal
  private resizeTimeout: any = null;  // Timeout para recálculo de tamaño

  constructor() { }

  /**
   * Obtiene la instancia actual del mapa
   */
  getMap(): any {
    return this.map;
  }

  /**
   * Inicializa un mapa profesional con OpenStreetMap
   */
  initMap(elementId: string, latitude: number, longitude: number, title: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // PASO 1: Cargar Leaflet si no está cargado
        await this.loadLeaflet();
        
        const L = (window as any).L;
        const mapElement = document.getElementById(elementId);
        
        if (!mapElement) {
          reject(`Elemento con id ${elementId} no encontrado`);
          return;
        }

        // PASO 2: Limpiar elemento por si ya tenía algo
        mapElement.innerHTML = '';

        // PASO 3: Crear mapa con configuración profesional
        this.map = L.map(elementId, {
          center: [latitude, longitude],
          zoom: 16,
          maxZoom: 21,
          minZoom: 1,
          zoomControl: true,
          fadeAnimation: true,
          zoomAnimation: true,
          markerZoomAnimation: true,
          attributionControl: true,
          scrollWheelZoom: true,
          dragging: true,
          tap: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          closePopupOnClick: false,
          zoomSnap: 0.5,
          zoomDelta: 0.5
        });

        // PASO 4: Agregar capa base (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abc',
          maxZoom: 21,
          minZoom: 1,
          tileSize: 256,
          zoomOffset: 0,
          detectRetina: true,
          keepBuffer: 2
        }).addTo(this.map);

        // PASO 5: Agregar escala
        L.control.scale({
          imperial: false,
          metric: true,
          position: 'bottomleft',
          maxWidth: 200
        }).addTo(this.map);

        // PASO 6: Evento cuando el mapa esté listo
        this.map.whenReady(() => {
          console.log('Mapa profesional cargado exitosamente');
          this.mapInitialized = true;
          
          // Forzar recálculo del tamaño
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize(true);
            }
          }, 300);
        });

        resolve(this.map);
      } catch (error) {
        console.error('Error al inicializar el mapa:', error);
        reject(error);
      }
    });
  }

  /**
   * Actualiza la ubicación del marcador principal (para selección de ubicación)
   */
  updateLocation(latitude: number, longitude: number, address: string = ''): void {
    if (!this.map) {
      console.error('Mapa no inicializado');
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    try {
      // PASO 1: Forzar recálculo del tamaño del mapa
      this.map.invalidateSize(true);

      // PASO 2: Delay para que el DOM se actualice
      setTimeout(() => {
        if (!this.map) return;
        
        // PASO 3: Centrar el mapa
        this.map.setView([latitude, longitude], 16, {
          animate: false,
          duration: 0
        });

        // PASO 4: Eliminar marcador anterior
        if (this.currentMarker) {
          this.map.removeLayer(this.currentMarker);
          this.currentMarker = null;
        }

        // PASO 5: Crear nuevo marcador
        const markerHtml = `
          <div class="custom-marker-wrapper">
            <div class="marker-pin selected">
              <div class="marker-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div class="marker-pulse"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-marker-container',
          html: markerHtml,
          iconSize: [50, 50],
          iconAnchor: [25, 50],
          popupAnchor: [0, -50]
        });

        this.currentMarker = L.marker([latitude, longitude], {
          icon: customIcon,
          title: 'Ubicación seleccionada',
          riseOnHover: true,
          zIndexOffset: 1000
        }).addTo(this.map);

        // PASO 6: Agregar popup
        const popupContent = this.createLocationPopup(latitude, longitude, address);

        this.currentMarker.bindPopup(popupContent, {
          maxWidth: 380,
          minWidth: 300,
          className: 'professional-popup',
          closeButton: true,
          autoClose: false,
          closeOnEscapeKey: true,
          keepInView: true
        }).openPopup();

        this.markers.push(this.currentMarker);

        // PASO 7: Recálculo final
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 100);

      }, 150);
      
    } catch (error) {
      console.error('❌ Error en updateLocation:', error);
    }
  }

  /**
   * Refresca el mapa manualmente (útil cuando cambia el tamaño del contenedor)
   */
  refreshMap(): void {
    if (this.map) {
      try {
        this.map.invalidateSize(true);
      } catch (e) {
        console.error('Error al refrescar mapa:', e);
      }
    }
  }

  /**
   * Agrega un marcador adicional genérico
   */
  addMarker(latitude: number, longitude: number, title: string, options?: any): void {
    if (!this.map) return;

    const L = (window as any).L;
    const marker = L.marker([latitude, longitude], {
      title: title,
      ...options
    }).addTo(this.map);

    if (options?.popupContent) {
      marker.bindPopup(options.popupContent);
    }

    this.markers.push(marker);
  }

  /**
   * Agrega un marcador para una sucursal específica
   */
  addSucursalMarker(sucursal: any): void {
    if (!this.map) return;
    
    const lat = parseFloat(sucursal.latitud);
    const lng = parseFloat(sucursal.longitud);
    
    // Validar coordenadas
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('⚠️ Coordenadas inválidas para sucursal:', sucursal.nombre);
      return;
    }

    const L = (window as any).L;
    
    // Marcador personalizado para sucursal
    const markerHtml = `
      <div class="custom-marker-wrapper">
        <div class="marker-pin sucursal">
          <div class="marker-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>
        <div class="marker-pulse"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-marker-container',
      html: markerHtml,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50]
    });

    const marker = L.marker([lat, lng], {
      icon: customIcon,
      title: sucursal.nombre,
      riseOnHover: true,
      zIndexOffset: 100
    }).addTo(this.map);

    const popupContent = this.createSucursalPopup(sucursal, lat, lng);

    marker.bindPopup(popupContent, {
      maxWidth: 380,
      minWidth: 300,
      className: 'professional-popup',
      closeButton: true,
      autoClose: false,
      closeOnEscapeKey: true,
      keepInView: true
    });

    marker.on('click', () => {
      if (this.onSucursalClick) {
        this.onSucursalClick(sucursal);
      }
    });

    this.markers.push(marker);
  }

  /**
   * Agrega múltiples sucursales al mapa de una vez
   */
  setOnSucursalClick(handler: (sucursal: any) => void): void {
    this.onSucursalClick = handler;
  }

  addSucursales(sucursales: any[]): void {
    if (!this.map) return;
    sucursales.forEach(sucursal => this.addSucursalMarker(sucursal));
  }

  /**
   * Centra el mapa en una ubicación específica
   */
  setView(latitude: number, longitude: number, zoom: number = 16): void {
    if (this.map) {
      this.map.setView([latitude, longitude], zoom, {
        animate: true,
        duration: 0.5
      });
    }
  }

  /**
   * Limpia todos los marcadores del mapa
   */
  clearMarkers(): void {
    if (this.currentMarker && this.map) {
      this.map.removeLayer(this.currentMarker);
      this.currentMarker = null;
    }
    
    this.markers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  /**
   * Destruye el mapa completamente (liberar recursos)
   */
  destroyMap(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.currentMarker = null;
    this.markers = [];
    this.mapInitialized = false;
  }

  /**
   * Verifica si el mapa está inicializado y listo
   */
  isMapInitialized(): boolean {
    return this.mapInitialized && this.map !== null;
  }

  // ============================================
  // MÉTODOS PRIVADOS (auxiliares)
  // ============================================

  /**
   * Crea el popup para la ubicación seleccionada
   */
  private createLocationPopup(latitude: number, longitude: number, address: string): string {
    return `
      <div class="popup-container">
        <div class="popup-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="popup-header-content">
            <div class="popup-logo">
              <i class="fas fa-map-marker-alt" style="font-size: 24px; color: white;"></i>
            </div>
            <div class="popup-title-section">
              <h3 class="popup-title" style="color: white; margin: 0;">Ubicación Seleccionada</h3>
            </div>
          </div>
        </div>
        <div class="popup-content" style="padding: 16px;">
          <div class="popup-info-row" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
            <div class="popup-icon-circle" style="background: #667eea20; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <i class="fas fa-globe" style="color: #667eea;"></i>
            </div>
            <div class="popup-info-text" style="flex: 1;">
              <span style="font-size: 12px; color: #666; display: block;">Coordenadas</span>
              <span style="font-size: 14px; font-weight: 600; font-family: monospace; display: block;">
                ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
              </span>
            </div>
          </div>
          ${address ? `
            <div class="popup-info-row" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <div class="popup-icon-circle" style="background: #48bb7820; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <i class="fas fa-road" style="color: #48bb78;"></i>
              </div>
              <div class="popup-info-text" style="flex: 1;">
                <span style="font-size: 12px; color: #666; display: block;">Dirección</span>
                <span style="font-size: 14px; font-weight: 500; display: block;">${address}</span>
              </div>
            </div>
          ` : ''}
          <div style="margin: 16px 0; border-top: 1px solid #edf2f7;"></div>
          <div class="popup-actions" style="display: flex; gap: 8px;">
            <a href="https://www.openstreetmap.org/directions?from=&to=${latitude}%2C${longitude}" 
               target="_blank" 
               style="flex: 1; padding: 10px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <i class="fas fa-directions"></i>
              Cómo llegar
            </a>
            <a href="https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}" 
               target="_blank" 
               style="flex: 1; padding: 10px; background: #48bb78; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <i class="fas fa-external-link-alt"></i>
              Ver mapa
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Crea el popup para una sucursal
   */
  private createSucursalPopup(sucursal: any, lat: number, lng: number): string {
    return `
      <div class="popup-container">
        <div class="popup-header" style="background: linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%);">
          <div class="popup-header-content">
            <div class="popup-logo">
              <i class="fas fa-building" style="font-size: 24px; color: white;"></i>
            </div>
            <div class="popup-title-section">
              <h3 class="popup-title" style="color: white; margin: 0;">${sucursal.nombre || 'Sucursal'}</h3>
              <span class="popup-badge" style="background: rgba(255,255,255,0.2); color: white;">Sucursal</span>
            </div>
          </div>
        </div>
        <div class="popup-content" style="padding: 16px;">
          ${sucursal.direccion ? `
            <div class="popup-info-row" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <div class="popup-icon-circle" style="background: #4299e120; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <i class="fas fa-map-marker-alt" style="color: #4299e1;"></i>
              </div>
              <div class="popup-info-text" style="flex: 1;">
                <span style="font-size: 12px; color: #666; display: block;">Dirección</span>
                <span style="font-size: 14px; font-weight: 500; display: block;">${sucursal.direccion}</span>
              </div>
            </div>
          ` : ''}
          ${sucursal.telefono ? `
            <div class="popup-info-row" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <div class="popup-icon-circle" style="background: #9f7aea20; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <i class="fas fa-phone-alt" style="color: #9f7aea;"></i>
              </div>
              <div class="popup-info-text" style="flex: 1;">
                <span style="font-size: 12px; color: #666; display: block;">Teléfono</span>
                <span style="font-size: 14px; font-weight: 500; display: block;">${sucursal.telefono}</span>
              </div>
            </div>
          ` : ''}
          <div class="popup-info-row" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
            <div class="popup-icon-circle" style="background: #48bb7820; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <i class="fas fa-globe" style="color: #48bb78;"></i>
            </div>
            <div class="popup-info-text" style="flex: 1;">
              <span style="font-size: 12px; color: #666; display: block;">Coordenadas</span>
              <span style="font-size: 12px; font-family: monospace; display: block;">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </span>
            </div>
          </div>
          <div style="margin: 16px 0; border-top: 1px solid #edf2f7;"></div>
          <div class="popup-actions" style="display: flex; gap: 8px;">
            <a href="https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}" 
               target="_blank" 
               style="flex: 1; padding: 10px; background: #4299e1; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <i class="fas fa-directions"></i>
              Cómo llegar
            </a>
            <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}" 
               target="_blank" 
               style="flex: 1; padding: 10px; background: #48bb78; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <i class="fas fa-external-link-alt"></i>
              Ver mapa
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Carga Leaflet dinámicamente (CSS y JS)
   */
  private loadLeaflet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).L && (window as any).L.version) {
        this.leafletLoaded = true;
        resolve();
        return;
      }

      // Cargar CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Cargar JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        this.leafletLoaded = true;
        resolve();
      };
      script.onerror = () => reject('Error al cargar Leaflet');
      document.head.appendChild(script);
    });
  }
}