export const EDITOR_LIMITS = {
	dimensionMm: {
		min: 5,
		max: 300,
	},

	fontSizeMm: {
		min: 4,
		max: 200,
	},

	lineSpacingMm: {
		min: 0,
		max: 100,
	},

	qrSizeMm: {
		min: 6,
		max: 120,
	},

	positionMm: {
		max: 500,
	},

	contentLength: {
		text: 500,
		barcode: 80,
		qr: 1000,
	},
} as const;
