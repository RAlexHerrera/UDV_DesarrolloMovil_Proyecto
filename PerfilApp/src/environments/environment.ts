// `ng build` reemplaza este archivo por environment.prod.ts (ver angular.json).

export const environment = {
  production: false,
  // Alias especial del emulador de Android Studio: apunta al localhost de la PC anfitriona.
  // Para dispositivo físico, cambiar por la IP de la PC en la red Wi-Fi (PerfilApi la imprime al arrancar).
  apiUrl: 'http://10.0.2.2:3001/api',
};
