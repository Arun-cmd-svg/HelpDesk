import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  AppRole,
  AuthUser,
} from '../models/auth-user.model';
import {
  LoginApiResponse,
} from '../models/login-api.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router =
    inject(Router);

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly localUserKey =
    'isd-authenticated-user';

  private readonly sessionUserKey =
    'isd-session-user';

  private readonly localTokenKey =
    'isd-access-token';

  private readonly sessionTokenKey =
    'isd-session-access-token';

  private readonly currentUserSignal =
    signal<AuthUser | null>(
      this.restoreUser(),
    );

  readonly currentUser =
    this.currentUserSignal.asReadonly();

  readonly isAuthenticated = computed(
    () =>
      this.currentUserSignal() !== null &&
      Boolean(this.getAccessToken()),
  );

  readonly currentRole = computed(
    () =>
      this.currentUserSignal()?.role ?? null,
  );

  completeApiLogin(
    response: LoginApiResponse,
    rememberMe: boolean,
  ): boolean {
    if (
      !response.success ||
      !response.access_token ||
      !response.employee
    ) {
      return false;
    }

    const authenticatedUser: AuthUser = {
      id: response.employee.id,

      employeeCode:
        response.employee.employee_code,

      fullName:
        response.employee.employee_name,

      email:
        response.employee.email ??
        'Not available',

      department:
        response.employee.department ??
        this.resolveTemporaryDepartment(
          response.employee.employee_code,
        ),

      role:
        response.employee.role ??
        this.resolveTemporaryRole(
          response.employee.employee_code,
        ),
    };

    this.currentUserSignal.set(
      authenticatedUser,
    );

    this.saveSession(
      authenticatedUser,
      response.access_token,
      rememberMe,
    );

    return true;
  }

  getAccessToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    return (
      localStorage.getItem(
        this.localTokenKey,
      ) ??
      sessionStorage.getItem(
        this.sessionTokenKey,
      )
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);

    this.clearStoredSession();

    void this.router.navigate(['/login']);
  }

  hasRole(
    ...allowedRoles: AppRole[]
  ): boolean {
    const currentRole =
      this.currentUserSignal()?.role;

    return Boolean(
      currentRole &&
      allowedRoles.includes(currentRole),
    );
  }

  isSystemAdmin(): boolean {
    return this.hasRole('System Admin');
  }

  isDepartmentManager(): boolean {
    return this.hasRole(
      'Department Manager',
    );
  }

  isEmployee(): boolean {
    return this.hasRole('Employee');
  }

  private saveSession(
    user: AuthUser,
    accessToken: string,
    rememberMe: boolean,
  ): void {
    if (!this.isBrowser()) {
      return;
    }

    this.clearStoredSession();

    const serializedUser =
      JSON.stringify(user);

    if (rememberMe) {
      localStorage.setItem(
        this.localUserKey,
        serializedUser,
      );

      localStorage.setItem(
        this.localTokenKey,
        accessToken,
      );

      return;
    }

    sessionStorage.setItem(
      this.sessionUserKey,
      serializedUser,
    );

    sessionStorage.setItem(
      this.sessionTokenKey,
      accessToken,
    );
  }

  private restoreUser(): AuthUser | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const storedUser =
        localStorage.getItem(
          this.localUserKey,
        ) ??
        sessionStorage.getItem(
          this.sessionUserKey,
        );

      if (!storedUser) {
        return null;
      }

      const parsedUser =
        JSON.parse(storedUser) as AuthUser;

      if (
        !parsedUser.id ||
        !parsedUser.employeeCode ||
        !parsedUser.fullName ||
        !parsedUser.role
      ) {
        this.clearStoredSession();
        return null;
      }

      return parsedUser;
    } catch {
      this.clearStoredSession();
      return null;
    }
  }

  private clearStoredSession(): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem(
      this.localUserKey,
    );

    localStorage.removeItem(
      this.localTokenKey,
    );

    sessionStorage.removeItem(
      this.sessionUserKey,
    );

    sessionStorage.removeItem(
      this.sessionTokenKey,
    );
  }

  /*
   * Temporary mapping because the current login
   * response does not provide a system role.
   *
   * Remove this method when the backend returns role.
   */
  private resolveTemporaryRole(
    employeeCode: string,
  ): AppRole {
    if (employeeCode === 'NHCTEST001') {
      return 'System Admin';
    }

    return 'Employee';
  }

  /*
   * Temporary mapping because the current login
   * response does not provide a department.
   */
  private resolveTemporaryDepartment(
    employeeCode: string,
  ): string {
    if (employeeCode === 'NHCTEST001') {
      return 'Information Technology';
    }

    return 'Not Assigned';
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(
      this.platformId,
    );
  }
}