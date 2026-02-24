export interface LoginInput {
  email: string;
}

export interface SignupInput {
  firstName?: string;
  lastName?: string;
  email: string;
  username: string;
  company?: string;
}

export interface VerifyEmailCodeInput {
  email: string;
  code: string;
}

export interface UserLookupInput {
  email?: string;
  username?: string;
}

export interface UserLookupResult {
  available: boolean;
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  name?: string;
  onboarded?: boolean;
}

export interface AuthSession {
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface AuthApi {
  login(input: LoginInput): Promise<void>;
  signup(input: SignupInput): Promise<void>;
  verifyEmailCode(input: VerifyEmailCodeInput): Promise<AuthSession>;
  resendCode(email: string): Promise<void>;
  lookup(input: UserLookupInput): Promise<UserLookupResult>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
}

