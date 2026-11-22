import { Component, Input, inject, signal } from '@angular/core';
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
  selector: 'app-login',
  templateUrl: './login.page.html',
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
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Se llena vía query param (?registrado=1) cuando venimos de un registro exitoso.
  @Input() registrado?: string;

  email = '';
  password = '';

  cargando = signal(false);
  error = signal<string | null>(null);

  async iniciarSesion(): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);

    try {
      await this.authService.login(this.email.trim().toLowerCase(), this.password);
      await this.router.navigateByUrl('/perfil', { replaceUrl: true });
    } catch (e) {
      this.error.set(mensajeDeError(e, 'No se pudo iniciar sesión'));
    } finally {
      this.cargando.set(false);
    }
  }
}
