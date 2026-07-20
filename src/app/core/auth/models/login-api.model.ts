import { AppRole } from './auth-user.model';

export interface LoginRequest {
  employee_code: string;
  password: string;
}

export interface LoginEmployee {
  id: number;
  employee_code: string;
  employee_name: string;

  /*
   * These fields are not currently returned by
   * the backend, but they are required for the
   * application's role and department logic.
   */
  email?: string;
  department?: string;
  role?: AppRole;
}

export interface LoginApiResponse {
  success: boolean;
  message: string;
  access_token: string;
  employee: LoginEmployee;
}