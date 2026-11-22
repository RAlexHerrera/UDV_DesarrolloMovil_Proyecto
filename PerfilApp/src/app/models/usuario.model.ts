export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  fotoPerfil: string | null; // Base64 (sin prefijo data:...)
  fotoPerfilMime: string | null;
}
