import type { Request, Response } from 'express';
import { config } from '../config.js';
import { Bcrypt } from "../utils/Bcrypt.js";


const timeExpireAccessToken = 15 * 60 * 1000;
const timeExpireRefreshToken = 7 * 24 * 60 * 60 * 1000;


export const login = async (req: Request, res: Response) => {
	if (!req.body) {
		return res.status(400).json({ message: 'Falta el body de la request.' });
	}

	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: 'El username y password son requeridos' });
	}

	try {
		// 1. Buscar al usuario por su nombre de usuario.
		console.info(`Intento de inicio de sesión para el usuario: ${username}`);
		const user = username === config.ADMIN_USER ? config.ADMIN_USER : undefined;
		const adminPasswordHash = await config.ADMIN_PASSWORD_HASH

		// 2. Si el usuario no existe o la contraseña es incorrecta, devolver un error.
		if (!user || !(await Bcrypt.comparePassword(password, adminPasswordHash))) {
			console.warn(`Credenciales inválidas para el usuario: ${username}`);
			return res.status(401).json({ message: 'Credenciales inválidas' });
		}

		// Es mejor no devolver el payload en la respuesta. El cliente puede decodificar el accessToken si lo necesita.
		console.info(`Inicio de sesión exitoso para el usuario: ${username}`);
		res.json({ user, message: 'Inicio de sesión exitoso' });
	} catch (error) {
		console.error(`Error en el proceso de login para ${username}: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const logout = (_req: Request, res: Response) => {
	try {
		
		console.info('Sesión cerrada exitosamente. Cookies eliminadas.');
		res.status(200).json({ message: 'Sesión cerrada correctamente' });
	} catch (error) {
		console.error(`Error en logout: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

