import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce un error HTTP a un mensaje específico en español para mostrar al usuario:
 * si el backend mandó un campo "mensaje" (nuestras rutas lo hacen en todos los errores
 * de negocio), se usa ese texto; si fue un error de red real (sin respuesta del
 * servidor), se da un mensaje distinto según la causa.
 */
export function mensajeDeError(error: unknown, mensajePorDefecto = 'Ocurrió un error inesperado'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return mensajePorDefecto;
  }

  if (error.status === 0) {
    // status 0 = el navegador/WebView nunca recibió respuesta (servidor caído, URL
    // equivocada, sin red, CORS, etc.) — no es un error de negocio del backend.
    return 'No se pudo conectar con el servidor. Verifica la URL configurada y tu conexión.';
  }

  const mensajeBackend = (error.error as { mensaje?: string } | null)?.mensaje;
  return mensajeBackend ?? `Error del servidor (código ${error.status})`;
}
