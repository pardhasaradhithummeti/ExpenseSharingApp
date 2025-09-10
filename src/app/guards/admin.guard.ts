import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.user?.isAdmin) {
    return true;
  }

  router.navigate(['/unauthorized']); // or redirect to dashboard
  return false;
};
