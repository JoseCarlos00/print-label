export const EDITOR_LIMITS = {
	dimensionMm: {
		min: 1,
		max: 500,
	},

	fontSizeMm: {
		min: 3,
		max: 200,
	},

	lineSpacingMm: {
		min: 0,
		max: 100,
	},

	qrSizeMm: {
		min: 1,
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
