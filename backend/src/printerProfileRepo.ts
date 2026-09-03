import type { PrinterProfile } from 'shared';
import { db } from './db.js';
import { printerDevices, labelSizes, DEFAULT_DPI } from './printerDevices.js';

interface PrinterProfileRow {
	id: string;
	name: string;
	label: string;
	ip: string;
	width_mm: number;
	height_mm: number;
	dpi: number;
}

function rowToProfile(row: PrinterProfileRow): PrinterProfile {
	return {
		id: row.id,
		name: row.name,
		label: row.label,
		ip: row.ip,
		widthMm: row.width_mm,
		heightMm: row.height_mm,
		dpi: row.dpi,
	};
}

/**
 * Sincroniza la tabla printer_profiles con el array printerDevices.ts.
 * El código es la fuente de verdad; esto corre en cada arranque del servidor.
 * Usa la IP como id, así que si cambias la IP de una impresora existente,
 * se crea una fila nueva (comportamiento esperado: es, en la práctica, otro dispositivo).
 */
export function syncPrinterProfiles(): void {
	const upsert = db.prepare(`
    INSERT INTO printer_profiles (id, name, label, ip, width_mm, height_mm, dpi)
    VALUES (@id, @name, @ip, @widthMm, @heightMm, @dpi)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
			label = exclude.label
      width_mm = excluded.width_mm,
      height_mm = excluded.height_mm,
      dpi = excluded.dpi
  `);

	const syncAll = db.transaction((devices: typeof printerDevices) => {
		for (const device of devices) {
			const size = labelSizes[device.labelSize];
			upsert.run({
				id: device.ip,
				name: device.name,
				label: device.label,
				ip: device.ip,
				widthMm: size.widthMm,
				heightMm: size.heightMm,
				dpi: DEFAULT_DPI,
			});
		}
	});

	syncAll(printerDevices);
	console.log(`[PrinterProfiles] ${printerDevices.length} impresora(s) sincronizada(s) desde printerDevices.ts`);
}

export function listPrinterProfiles(): PrinterProfile[] {
	const rows = db.prepare(`SELECT * FROM printer_profiles ORDER BY name ASC`).all() as PrinterProfileRow[];
	return rows.map(rowToProfile);
}

export function getPrinterProfileById(id: string): PrinterProfile | undefined {
	const row = db.prepare(`SELECT * FROM printer_profiles WHERE id = ?`).get(id) as PrinterProfileRow | undefined;
	return row ? rowToProfile(row) : undefined;
}
