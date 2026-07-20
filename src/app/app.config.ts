import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import {
  authInterceptor,
} from './core/http/interceptors/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        authInterceptor,
      ]),
    ),
  ],
};
