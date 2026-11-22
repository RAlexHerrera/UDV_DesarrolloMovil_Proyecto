import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udv.perfilapp',
  appName: 'PerfilApp',
  webDir: 'www',
  // El backend de desarrollo es http (no https). Si la app se sirve por https://localhost
  // (el default de Capacitor), el navegador bloquea esas llamadas como "Mixed Content".
  // Sirviendo la app también por http se evita ese bloqueo.
  server: {
    androidScheme: 'http',
  },
};

export default config;
