import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Lo opuesto a authGuard: si ya hay sesión guardada, salta login/registro y va directo
// al perfil (equivalente a "recordar login").
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return true;
  }

  return router.parseUrl('/perfil');
};
