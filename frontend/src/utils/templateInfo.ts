import type { PrinterProfile } from 'shared';

export function formatLabelSize(profile: PrinterProfile | undefined): string {
	if (!profile) return 'Tamaño no disponible';
	return `${profile.widthMm} × ${profile.heightMm} mm`;
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}
