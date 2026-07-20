import {
  HttpErrorResponse,
} from '@angular/common/http';
import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  finalize,
} from 'rxjs';

import {
  LoginApiResponse,
} from '../../../../core/auth/models/login-api.model';

import {
  AuthService,
} from '../../../../core/auth/services/auth.service';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authApiService =
    inject(AuthApiService);

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  private readonly activatedRoute =
    inject(ActivatedRoute);

  loginError = '';

  isSubmitting = false;

  showPassword = false;

  readonly loginForm =
    this.formBuilder.nonNullable.group({
      employeeCode: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
        ],
      ],

      rememberMe: [true],
    });

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate([
        '/dashboard',
      ]);
    }
  }

  submitLogin(): void {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const {
      employeeCode,
      password,
      rememberMe,
    } = this.loginForm.getRawValue();

    this.authApiService
      .login({
        employee_code:
          employeeCode.trim(),
        password,
      })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: (
          response: LoginApiResponse,
        ) => {
          const loginCompleted =
            this.authService
              .completeApiLogin(
                response,
                rememberMe,
              );

          if (!loginCompleted) {
            this.loginError =
              response.message ||
              'Unable to complete login.';

            return;
          }

          const requestedReturnUrl =
            this.activatedRoute.snapshot
              .queryParamMap.get(
                'returnUrl',
              );

          void this.router.navigateByUrl(
            this.getSafeReturnUrl(
              requestedReturnUrl,
            ),
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          console.error(
            'Login API error:',
            error,
          );

          this.loginError =
            this.getLoginErrorMessage(
              error,
            );
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword =
      !this.showPassword;
  }

  private getSafeReturnUrl(
    returnUrl: string | null,
  ): string {
    if (
      !returnUrl ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//') ||
      returnUrl.startsWith('/login')
    ) {
      return '/dashboard';
    }

    return returnUrl;
  }

  private getLoginErrorMessage(
    error: HttpErrorResponse,
  ): string {
    if (error.status === 0) {
      return 'Unable to connect to the Helpdesk server. Please check the API or CORS configuration.';
    }

    if (
      typeof error.error?.message ===
      'string'
    ) {
      return error.error.message;
    }

    if (error.status === 401) {
      return 'Invalid employee code or password.';
    }

    return 'Login failed. Please try again.';
  }
}