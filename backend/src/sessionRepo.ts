import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { config } from './config.js';

interface SessionRow {
	token: string;
	create_on: string;
	expires_on: string;
}

export function createSession(): { token: string; expiresOn: string } {
	const token = randomBytes(32).toString('hex');
	const createOn = new Date().toISOString();
	const expiresOn = new Date(Date.now() + config.SESSION_DURATION_MS).toISOString();

	db.prepare(`INSERT INTO sessions (token, create_on, expires_on) VALUES (?, ?, ?)`).run(token, createOn, expiresOn);

	return { token, expiresOn };
}

export function findValidSession(token: string): SessionRow | undefined {
	const row = db.prepare(`SELECT * FROM sessions WHERE token = ?`).get(token) as SessionRow | undefined;

	if (!row) return undefined;

	if (new Date(row.expires_on).getTime() < Date.now()) {
		deleteSession(token);
		return undefined;
	}

	return row;
}

export function deleteSession(token: string): void {
	db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}
