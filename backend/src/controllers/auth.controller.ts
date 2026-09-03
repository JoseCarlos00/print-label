import type { Request, Response } from 'express';
import { config } from '../config.js';
import { safeCompare } from '../utils/credentials.js';
import { createSession, deleteSession } from '../sessionRepo.js';

const isProduction = config.NODE_ENV === 'production';

export const login = async (req: Request, res: Response) => {
	if (!req.body) {
		return res.status(400).json({ message: 'Falta el body de la request.' });
	}

	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: 'El username y password son requeridos' });
	}

	try {
		console.info(`Intento de inicio de sesión para el usuario: ${username}`);

		const validCredentials = safeCompare(username, config.ADMIN_USER) && safeCompare(password, config.ADMIN_PASSWORD);

		if (!validCredentials) {
			console.warn(`Credenciales inválidas para el usuario: ${username}`);
			return res.status(401).json({ message: 'Credenciales inválidas' });
		}

		const { token, expiresOn } = createSession();

		res.cookie(config.SESSION_COOKIE_NAME, token, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			expires: new Date(expiresOn),
		});

		console.info(`Inicio de sesión exitoso para el usuario: ${username}`);
		res.json({ user: username, message: 'Inicio de sesión exitoso' });
	} catch (error) {
		console.error(`Error en el proceso de login para ${username}: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const logout = (req: Request, res: Response) => {
	try {
		const token = req.cookies?.[config.SESSION_COOKIE_NAME];
		if (token) deleteSession(token);

		res.clearCookie(config.SESSION_COOKIE_NAME);
		console.info('Sesión cerrada exitosamente. Cookie eliminada.');
		
		res.status(200).json({ message: 'Sesión cerrada correctamente' });
	} catch (error) {
		console.error(`Error en logout: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const me = (req: Request, res: Response) => {
	res.json({ isAdmin: Boolean(req.isAdmin) });
};
