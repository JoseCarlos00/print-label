import net from 'node:net';

const PRINTER_PORT = 9100;
const CONNECTION_TIMEOUT_MS = 4000;

/**
 * Abre un socket TCP crudo al puerto 9100 de la impresora y envía el ZPL
 * tal cual — la impresora lo interpreta directo, sin pasar por el navegador
 * (spec §8).
 */
export function sendToPrinter(ip: string, zpl: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const socket = new net.Socket();
		let settled = false;

		const finish = (error?: Error) => {
			if (settled) return;
			settled = true;
			socket.destroy();
			error ? reject(error) : resolve();
		};

		socket.setTimeout(CONNECTION_TIMEOUT_MS);
		socket.once('timeout', () => finish(new Error(`Tiempo de espera agotado conectando a ${ip}:${PRINTER_PORT}`)));
		socket.once('error', (error) => finish(error));

		socket.connect(PRINTER_PORT, ip, () => {
			socket.write(zpl, (error) => (error ? finish(error) : finish()));
		});
	});
}
