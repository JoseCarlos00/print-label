import { randomUUID } from 'node:crypto';
import type { CreateTemplateInput, StateTemplate, Template, UpdateTemplateInput } from 'shared';
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
	requested_by: string | null;
	position_locked: number;
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
		requestedBy: fila.requested_by!,
		positionLocked: Boolean(fila.position_locked),
		createOn: fila.create_on,
		updateOn: fila.update_on,
	};
}

export function createTemplate(input: CreateTemplateInput, state: StateTemplate): Template {
	const now = new Date().toISOString();

	const template: Template = {
		id: randomUUID(),
		name: input.name,
		profileId: input.profileId,
		elements: input.elements,
		public: input.public,
		state,
		requestedBy: state === 'pending'
						? input.requestedBy ?? null
						: null,
		positionLocked: input.positionLocked ?? false,
		createOn: now,
		updateOn: now,
	};

	db.prepare(
		`INSERT INTO templates
      (id, name, profile_id, elements, public, state, requested_by, position_locked, create_on, update_on)
     VALUES
      (@id, @name, @profileId, @elements, @public, @state, @requestedBy, @positionLocked, @createOn, @updateOn)`,
	).run({
		id: template.id,
		name: template.name,
		profileId: template.profileId,
		elements: JSON.stringify(template.elements),
		public: template.public ? 1 : 0,
		state: template.state,
		requestedBy: template.requestedBy,
		positionLocked: template.positionLocked ? 1 : 0,
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
	const now = new Date().toISOString();

	db.prepare(`UPDATE templates SET state = ?, update_on = ? WHERE id = ?`).run(state, now, id);
	return getById(id);
}

export function approveTemplate(id: string): Template | undefined {
	const now = new Date().toISOString();

	const result = db
		.prepare(
			`
		UPDATE templates
		SET
			state = 'approved',
			update_on = @updateOn

		WHERE id = @id
			AND state = 'pending'
	`,
		)
		.run({
			id,
			updateOn: now,
		});

	if (result.changes === 0) {
		return undefined;
	}

	return getById(id);
}

export function rejectTemplate(id: string): Template | undefined {
	const now = new Date().toISOString();

	const result = db
		.prepare(
			`
		UPDATE templates
		SET
			state = 'rejected',
			update_on = @updateOn
			
		WHERE id = @id
			AND state = 'pending'
	`,
		)
		.run({
			id,
			updateOn: now,
		});

	if (result.changes === 0) {
		return undefined;
	}

	return getById(id);
}


export function updateTemplate(id: string, input: UpdateTemplateInput): Template | undefined {
	const now = new Date().toISOString();

	const result = db
		.prepare(
			`
		UPDATE templates
		SET
			name = @name,
			profile_id = @profileId,
			elements = @elements,
			public = @public,
			position_locked = @positionLocked,
			update_on = @updateOn
		WHERE id = @id
	`,
		)
		.run({
			id,
			name: input.name,
			profileId: input.profileId,
			elements: JSON.stringify(input.elements),
			public: input.public ? 1 : 0,
			positionLocked: input.positionLocked ? 1 : 0,
			updateOn: now,
		});

	if (result.changes === 0) {
		return undefined;
	}

	return getById(id);
}
