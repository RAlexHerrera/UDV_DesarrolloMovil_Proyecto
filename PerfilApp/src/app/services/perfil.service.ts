import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImagenGaleria } from '../models/imagen-galeria.model';
import { Usuario } from '../models/usuario.model';

interface RespuestaFoto {
  usuario: Usuario;
  imagenGaleria: ImagenGaleria | null;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);

  obtenerPerfil(): Promise<Usuario> {
    return firstValueFrom(this.http.get<Usuario>(`${environment.apiUrl}/perfil`));
  }

  // `fotoBase64` ya viene como data URL (data:image/jpeg;base64,...) desde el plugin de Cámara.
  // El backend guarda esta foto como perfil Y como copia nueva en la galería del usuario.
  actualizarFoto(fotoBase64: string): Promise<RespuestaFoto> {
    return firstValueFrom(
      this.http.put<RespuestaFoto>(`${environment.apiUrl}/perfil/foto`, { foto: fotoBase64 })
    );
  }

  async quitarFoto(): Promise<Usuario> {
    const respuesta = await firstValueFrom(
      this.http.put<RespuestaFoto>(`${environment.apiUrl}/perfil/foto`, { foto: null })
    );
    return respuesta.usuario;
  }

  // Reutiliza una imagen que ya está en la galería del usuario como foto de perfil
  // (no sube nada nuevo, solo copia lo que ya existe).
  usarFotoDeGaleria(id: number): Promise<Usuario> {
    return firstValueFrom(
      this.http.put<Usuario>(`${environment.apiUrl}/perfil/foto/desde-galeria/${id}`, {})
    );
  }

  listarGaleria(): Promise<ImagenGaleria[]> {
    return firstValueFrom(this.http.get<ImagenGaleria[]>(`${environment.apiUrl}/perfil/galeria`));
  }

  async eliminarDeGaleria(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${environment.apiUrl}/perfil/galeria/${id}`));
  }
}
