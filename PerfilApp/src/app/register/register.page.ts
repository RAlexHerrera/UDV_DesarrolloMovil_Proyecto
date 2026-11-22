import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { mensajeDeError } from '../utils/error-mensaje';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class RegisterPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  nombre = '';
  email = '';
  password = '';

  cargando = signal(false);
  error = signal<string | null>(null);

  async registrar(): Promise<void> {
    this.error.set(null);

    if (this.password.length < 4) {
      this.error.set('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    this.cargando.set(true);

    try {
      await this.authService.registrar(this.nombre.trim(), this.email.trim().toLowerCase(), this.password);
      await this.router.navigate(['/login'], { queryParams: { registrado: '1' } });
    } catch (e) {
      this.error.set(mensajeDeError(e, 'No se pudo crear la cuenta'));
    } finally {
      this.cargando.set(false);
    }
  }
}
