import { randomUUID } from 'node:crypto';
import type { CreateTemplateInput, StateTemplate, Template } from 'shared';
import { db } from './db.js';

// SQLite no tiene tipos nativos de boolean/JSON, así que la fila que
// devuelve better-sqlite3 no coincide 1:1 con el tipo Plantilla de shared.
interface RowTemplate {
	id: string;
	name: string;
	profile_id: string;
	elements: string;
	public: number;
	state: StateTemplate;
	by_request: string | null;
	create_on: string;
	update_on: string;
}

function rowToTemplate(fila: RowTemplate): Template {
	return {
		id: fila.id,
		name: fila.name,
		profileId: fila.profile_id,
		elements: JSON.parse(fila.elements),
		public: Boolean(fila.public),
		state: fila.state,
		byRequest: fila.by_request ?? '',
		createOn: fila.create_on,
		updateOn: fila.update_on,
	};
}

export function createTemplate(input: CreateTemplateInput, state: StateTemplate): Template {
	const ahora = new Date().toISOString();
	const template: Template = {
		id: randomUUID(),
		name: input.name,
		profileId: input.profileId,
		elements: input.elements,
		public: input.public,
		state,
		byRequest: state === 'pending' ? input.byRequest ?? '' : '',
		createOn: ahora,
		updateOn: ahora,
	};

	db.prepare(
		`INSERT INTO templates
      (id, name, perfil_id, elements, public, state, by_request, create_on, update_on)
     VALUES
      (@id, @name, @profileId, @elements, @public, @state, @byRequest, @createOn, @updateOn)`,
	).run({
		id: template.id,
		name: template.name,
		profileId: template.profileId,
		elements: JSON.stringify(template.elements),
		public: template.public ? 1 : 0,
		state: template.state,
		byRequest: template.byRequest ?? '',
		createOn: template.createOn,
		updateOn: template.updateOn,
	});

	return template;
}

export function listApprovedPublics(): Template[] {
	const filas = db
		.prepare(`SELECT * FROM templates WHERE state = 'approved' AND public = 1 ORDER BY update_on DESC`)
		.all() as RowTemplate[];
	return filas.map(rowToTemplate);
}

export function listAllApproved(): Template[] {
	const filas = db
		.prepare(`SELECT * FROM templates WHERE state = 'approved' ORDER BY update_on DESC`)
		.all() as RowTemplate[];
	return filas.map(rowToTemplate);
}

export function listPending(): Template[] {
	const filas = db
		.prepare(`SELECT * FROM templates WHERE state = 'pending' ORDER BY create_on ASC`)
		.all() as RowTemplate[];
	return filas.map(rowToTemplate);
}

export function getById(id: string): Template | undefined {
	const fila = db.prepare(`SELECT * FROM templates WHERE id = ?`).get(id) as RowTemplate | undefined;
	return fila ? rowToTemplate(fila) : undefined;
}

export function updateState(id: string, state: StateTemplate): Template | undefined {
	const ahora = new Date().toISOString();
	db.prepare(`UPDATE templates SET state = ?, update_on = ? WHERE id = ?`).run(state, ahora, id);
	return getById(id);
}
