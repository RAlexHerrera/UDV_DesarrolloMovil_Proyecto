import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';

const CLAVE_TOKEN = 'perfilapp_token';
const CLAVE_USUARIO = 'perfilapp_usuario';

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // Estado en memoria, cargado desde Preferences al iniciar la app (ver init()).
  private tokenSignal = signal<string | null>(null);
  private usuarioSignal = signal<Usuario | null>(null);

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly estaAutenticado = computed(() => this.tokenSignal() !== null);

  // Se llama una sola vez, antes de que la app renderice (ver app.config.ts).
  async init(): Promise<void> {
    const [{ value: token }, { value: usuarioJson }] = await Promise.all([
      Preferences.get({ key: CLAVE_TOKEN }),
      Preferences.get({ key: CLAVE_USUARIO }),
    ]);

    this.tokenSignal.set(token);
    this.usuarioSignal.set(usuarioJson ? JSON.parse(usuarioJson) : null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  async registrar(nombre: string, email: string, password: string): Promise<void> {
    // No inicia sesión: el usuario debe hacer login por separado después de registrarse.
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/register`, { nombre, email, password })
    );
  }

  async login(email: string, password: string): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
    );

    await this.guardarSesion(respuesta.token, respuesta.usuario);
  }

  async actualizarUsuario(usuario: Usuario): Promise<void> {
    this.usuarioSignal.set(usuario);
    await Preferences.set({ key: CLAVE_USUARIO, value: JSON.stringify(usuario) });
  }

  async cerrarSesion(): Promise<void> {
    this.tokenSignal.set(null);
    this.usuarioSignal.set(null);
    await Promise.all([
      Preferences.remove({ key: CLAVE_TOKEN }),
      Preferences.remove({ key: CLAVE_USUARIO }),
    ]);
  }

  private async guardarSesion(token: string, usuario: Usuario): Promise<void> {
    this.tokenSignal.set(token);
    this.usuarioSignal.set(usuario);
    await Promise.all([
      Preferences.set({ key: CLAVE_TOKEN, value: token }),
      Preferences.set({ key: CLAVE_USUARIO, value: JSON.stringify(usuario) }),
    ]);
  }
}
