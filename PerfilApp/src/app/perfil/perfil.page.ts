import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { cameraOutline, cloudUploadOutline, imagesOutline, personCircleOutline, trashOutline } from 'ionicons/icons';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { PerfilService } from '../services/perfil.service';
import { mensajeDeError } from '../utils/error-mensaje';
import { ImagenGaleria } from '../models/imagen-galeria.model';

addIcons({
  'camera-outline': cameraOutline,
  'cloud-upload-outline': cloudUploadOutline,
  'images-outline': imagesOutline,
  'person-circle-outline': personCircleOutline,
  'trash-outline': trashOutline,
});

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonAvatar,
    IonIcon,
    IonText,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class PerfilPage implements OnInit {
  private authService = inject(AuthService);
  private perfilService = inject(PerfilService);
  private router = inject(Router);

  usuario = this.authService.usuario;

  fotoSrc = computed(() => {
    const datos = this.usuario();
    if (!datos?.fotoPerfil) return null;
    return `data:${datos.fotoPerfilMime ?? 'image/jpeg'};base64,${datos.fotoPerfil}`;
  });

  galeria = signal<ImagenGaleria[]>([]);

  cargandoFoto = signal(false);
  error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const [usuario, galeria] = await Promise.all([
        this.perfilService.obtenerPerfil(),
        this.perfilService.listarGaleria(),
      ]);
      await this.authService.actualizarUsuario(usuario);
      this.galeria.set(galeria);
    } catch (e) {
      this.error.set(mensajeDeError(e, 'No se pudo cargar el perfil'));
    }
  }

  srcDeImagenGaleria(item: ImagenGaleria): string {
    return `data:${item.imagenMime};base64,${item.imagen}`;
  }

  // Toma una foto nueva con la cámara y la guarda como foto de perfil (y en la galería).
  async tomarFoto(): Promise<void> {
    await this.capturarYGuardarComoAvatar(CameraSource.Camera);
  }

  // Sube una foto desde el dispositivo y la guarda como foto de perfil (y en la galería).
  async subirFoto(): Promise<void> {
    await this.capturarYGuardarComoAvatar(CameraSource.Photos);
  }

  // Reutiliza una foto que ya está en la galería del usuario como foto de perfil.
  async usarFotoDeGaleria(item: ImagenGaleria): Promise<void> {
    this.error.set(null);
    this.cargandoFoto.set(true);

    try {
      const usuario = await this.perfilService.usarFotoDeGaleria(item.id);
      await this.authService.actualizarUsuario(usuario);
    } catch (e) {
      this.error.set(mensajeDeError(e, 'No se pudo usar esa imagen como foto de perfil'));
    } finally {
      this.cargandoFoto.set(false);
    }
  }

  async quitarFoto(): Promise<void> {
    this.error.set(null);
    this.cargandoFoto.set(true);

    try {
      const usuario = await this.perfilService.quitarFoto();
      await this.authService.actualizarUsuario(usuario);
    } catch (e) {
      this.error.set(mensajeDeError(e, 'No se pudo quitar la foto'));
    } finally {
      this.cargandoFoto.set(false);
    }
  }

  async eliminarDeGaleria(item: ImagenGaleria): Promise<void> {
    this.error.set(null);

    try {
      await this.perfilService.eliminarDeGaleria(item.id);
      this.galeria.update((actual) => actual.filter((imagen) => imagen.id !== item.id));
    } catch (e) {
      this.error.set(mensajeDeError(e, 'No se pudo eliminar la imagen'));
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async capturarYGuardarComoAvatar(source: CameraSource): Promise<void> {
    this.error.set(null);

    let foto;
    try {
      foto = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source,
        allowEditing: false,
      });
    } catch {
      // El usuario canceló el selector de cámara/galería: no es un error real.
      return;
    }

    if (!foto.dataUrl) {
      this.error.set('No se pudo obtener la imagen');
      return;
    }

    this.cargandoFoto.set(true);

    try {
      const { usuario, imagenGaleria } = await this.perfilService.actualizarFoto(foto.dataUrl);
      await this.authService.actualizarUsuario(usuario);
      if (imagenGaleria) {
        this.galeria.update((actual) => [imagenGaleria, ...actual]);
      }
    } catch (e) {
      this.error.set(mensajeDeError(e, 'No se pudo actualizar la foto'));
    } finally {
      this.cargandoFoto.set(false);
    }
  }
}
