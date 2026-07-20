import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  inject,
} from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { LoginRequest, LoginApiResponse } from '../../../core/auth/models/login-api.model';


@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http =
    inject(HttpClient);

  private readonly apiBaseUrl =
    environment.apiBaseUrl;

  login(
    payload: LoginRequest,
  ): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(
      `${this.apiBaseUrl}/auth/login`,
      payload,
    );
  }
}