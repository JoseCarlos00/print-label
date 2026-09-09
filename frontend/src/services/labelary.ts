import type { PrinterProfile } from 'shared'

export async function renderZplToImage(zpl: string, printer: PrinterProfile): Promise<string> {
	const sizeLabel = `${(printer.widthMm / 25.4).toFixed(2)}x${(printer.heightMm / 25.4).toFixed(2)}`; // 4x4 - 2.82x1.28

	const response = await fetch(`https://api.labelary.com/v1/printers/8dpmm/labels/${sizeLabel}/0/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: zpl,
	});

	if (!response.ok) {
		throw new Error(await response.text());
	}

	const blob = await response.blob();

	return URL.createObjectURL(blob);
}
