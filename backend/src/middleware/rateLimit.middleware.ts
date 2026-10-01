import type { NextFunction, Request, Response } from 'express';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const STAGING_COOLDOWN_MS = 2 * 1000;
const PRINT_COOLDOWN_MS = 1 * 1000;

const loginAttempts = new Map<string, number[]>();
const lastStagingRequest = new Map<string, number>();
const lastPrintRequest = new Map<string, number>();

function getClientKey(req: Request): string {
	return req.ip || req.socket.remoteAddress || 'unknown';
}

const cleanupTimer = setInterval(() => {
	const now = Date.now();

	for (const [key, attempts] of loginAttempts) {
		const recentAttempts = attempts.filter((attempt) => now - attempt < LOGIN_WINDOW_MS);
		if (recentAttempts.length === 0) {
			loginAttempts.delete(key);
		} else {
			loginAttempts.set(key, recentAttempts);
		}
	}

	for (const [key, timestamp] of lastStagingRequest) {
		if (now - timestamp >= STAGING_COOLDOWN_MS) {
			lastStagingRequest.delete(key);
		}
	}

	for (const [key, timestamp] of lastPrintRequest) {
		if (now - timestamp >= PRINT_COOLDOWN_MS) {
			lastPrintRequest.delete(key);
		}
	}
}, LOGIN_WINDOW_MS);
cleanupTimer.unref();

export function limitLoginAttempts(req: Request, res: Response, next: NextFunction) {
	const key = getClientKey(req);
	const now = Date.now();
	const attempts = (loginAttempts.get(key) ?? []).filter((attempt) => now - attempt < LOGIN_WINDOW_MS);

	if (attempts.length >= LOGIN_MAX_ATTEMPTS) {
		const retryAfterSeconds = Math.ceil((attempts[0]! + LOGIN_WINDOW_MS - now) / 1000);
		res.setHeader('Retry-After', retryAfterSeconds);
		return res.status(429).json({ message: 'Demasiados intentos de inicio de sesión. Intenta más tarde.' });
	}

	loginAttempts.set(key, attempts);
	next();
}

export function recordFailedLoginAttempt(req: Request): void {
	const key = getClientKey(req);
	const now = Date.now();
	const attempts = (loginAttempts.get(key) ?? []).filter((attempt) => now - attempt < LOGIN_WINDOW_MS);
	attempts.push(now);
	loginAttempts.set(key, attempts);
}

export function clearFailedLoginAttempts(req: Request): void {
	loginAttempts.delete(getClientKey(req));
}

export function limitStagingSubmissions(req: Request, res: Response, next: NextFunction) {
	const key = getClientKey(req);
	const now = Date.now();
	const previousRequest = lastStagingRequest.get(key);

	if (previousRequest !== undefined && now - previousRequest < STAGING_COOLDOWN_MS) {
		const retryAfterSeconds = Math.ceil((STAGING_COOLDOWN_MS - (now - previousRequest)) / 1000);
		res.setHeader('Retry-After', retryAfterSeconds);
		return res.status(429).json({
			message: 'Espera un momento antes de enviar otra solicitud de plantilla.',
		});
	}

	lastStagingRequest.set(key, now);
	next();
}

export function limitPrintRequests(req: Request, res: Response, next: NextFunction) {
	const key = getClientKey(req);
	const now = Date.now();
	const previousRequest = lastPrintRequest.get(key);

	if (previousRequest !== undefined && now - previousRequest < PRINT_COOLDOWN_MS) {
		const retryAfterSeconds = Math.ceil((PRINT_COOLDOWN_MS - (now - previousRequest)) / 1000);
		res.setHeader('Retry-After', retryAfterSeconds);
		return res.status(429).json({
			message: 'Espera un momento antes de enviar otra solicitud de impresión.',
		});
	}

	lastPrintRequest.set(key, now);
	next();
}
