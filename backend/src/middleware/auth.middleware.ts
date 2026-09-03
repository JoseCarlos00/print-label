import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { findValidSession } from '../sessionRepo.js';

declare global {
	namespace Express {
		interface Request {
			isAdmin?: boolean;
		}
	}
}

/** Lee la cookie de sesión (si existe) y setea req.isAdmin. No bloquea la request. */
export function attachAdminStatus(req: Request, _res: Response, next: NextFunction) {
	const token = req.cookies?.[config.SESSION_COOKIE_NAME];
	req.isAdmin = Boolean(token && findValidSession(token));
	next();
}

/** Bloquea la request si no hay sesión de admin válida. Usar después de attachAdminStatus. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	if (!req.isAdmin) {
		return res.status(401).json({ message: 'Se requiere sesión de administrador' });
	}
	next();
}
