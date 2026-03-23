export type BuilderRole = 'admin' | 'flow-author' | 'reviewer';

export interface BuilderUserInfo {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: BuilderRole;
  is_super: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface BuilderJwtPayload {
  sub: string;
  tenant_id: string;
  email: string;
  name: string;
  role: BuilderRole;
}

export interface BuilderLoginRequest {
  email: string;
  password: string;
}

export interface BuilderLoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: BuilderRole;
  };
}

export interface CreateBuilderUserRequest {
  email: string;
  name: string;
  password: string;
  role: BuilderRole;
}
