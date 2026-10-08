export interface AuthUser {
  id: string;
  sessionId: string;
  email: string;
  roles: string[];
  permissions: string[];
}
