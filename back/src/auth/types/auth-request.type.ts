import { Request } from 'express';
import { AuthUser } from './auth-user.type.js';

export type AuthRequest = Request & {
  user?: AuthUser;
};
