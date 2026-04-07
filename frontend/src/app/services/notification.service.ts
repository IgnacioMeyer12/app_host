import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly backText = 'Presioná el botón para volver al menú.';

  getBackText(): string {
    return this.backText;
  }

  success(entity: string): string {
    const base = entity.trim().replace(/\.*$/, '');
    return `${base}. ${this.backText}`;
  }

  successCustom(message: string): string {
    const base = message.trim().replace(/\.*$/, '');
    return `${base}. ${this.backText}`;
  }

  error(message: string): string {
    return message;
  }
}
