export enum Role {
  ADMIN = 'ADMIN',
  KAPITEN = 'KAPITEN',
  IGRAC = 'IGRAC',
}

export interface User {
  id: number;
  email: string;
  ime: string;
  uloga: Role;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
