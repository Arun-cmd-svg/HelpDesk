import {
  HttpInterceptorFn,
} from '@angular/common/http';
import {
  inject,
} from '@angular/core';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export const authInterceptor:
  HttpInterceptorFn = (
    request,
    next,
  ) => {
    const authService =
      inject(AuthService);

    const accessToken =
      authService.getAccessToken();

    const isApiRequest =
      request.url.startsWith(
        environment.apiBaseUrl,
      );

    if (
      !accessToken ||
      !isApiRequest
    ) {
      return next(request);
    }

    const authenticatedRequest =
      request.clone({
        setHeaders: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      });

    return next(
      authenticatedRequest,
    );
  };