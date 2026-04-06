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

export interface VerifyTwoFactorChallengeInput {
  challengeToken: string;
  code: string;
}

export interface TwoFactorCodeInput {
  code: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  hasRecoveryCodes: boolean;
  recoveryCodesRemaining: number;
}

export interface TwoFactorSetup {
  secret: string;
  provisioningUri: string;
  qrCode: string;
  recoveryCodes: string[];
}

export interface VerifyEmailCodeChallenge {
  requiresTwoFactor: true;
  challengeToken: string;
  expiresIn: number;
}

export interface VerifyEmailCodeSession {
  requiresTwoFactor: false;
  session: AuthSession;
}

export type VerifyEmailCodeResult =
  | VerifyEmailCodeSession
  | VerifyEmailCodeChallenge;

export interface ConfirmDeleteAccountInput {
  accessCode: string | number;
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
  verifyEmailCode(input: VerifyEmailCodeInput): Promise<VerifyEmailCodeResult>;
  verifyTwoFactorChallenge(
    input: VerifyTwoFactorChallengeInput,
  ): Promise<AuthSession>;
  getTwoFactorStatus(): Promise<TwoFactorStatus>;
  startTwoFactorSetup(): Promise<TwoFactorSetup>;
  verifyTwoFactorSetup(input: TwoFactorCodeInput): Promise<void>;
  disableTwoFactor(input: TwoFactorCodeInput): Promise<void>;
  regenerateTwoFactorRecoveryCodes(
    input: TwoFactorCodeInput,
  ): Promise<string[]>;
  resendCode(email: string): Promise<void>;
  requestDeleteAccountCode(turnstileToken?: string): Promise<void>;
  confirmDeleteAccount(input: ConfirmDeleteAccountInput): Promise<void>;
  lookup(input: UserLookupInput): Promise<UserLookupResult>;
  refreshTokens(refreshToken: string): Promise<AuthSession>;
  logout(refreshToken?: string): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
}
