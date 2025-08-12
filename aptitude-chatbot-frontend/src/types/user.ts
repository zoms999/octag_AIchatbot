// User related types
export interface BaseUser {
  id: string;
  name: string;
  ac_id: string;
}

export interface PersonalUser extends BaseUser {
  type: 'personal';
  sex: string;
  isPaid: boolean;
  productType: string;
  isExpired: boolean;
  state: string;
}

export interface OrganizationUser extends BaseUser {
  type: 'organization_admin' | 'organization_member';
  sessionCode: string;
  ins_seq?: number;
}

export type User = PersonalUser | OrganizationUser;

export interface LoginCredentials {
  username: string;
  password: string;
  loginType: 'personal' | 'organization';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
}

export interface LoginFormData {
  username: string;
  password: string;
  loginType: 'personal' | 'organization';
  rememberMe?: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}
