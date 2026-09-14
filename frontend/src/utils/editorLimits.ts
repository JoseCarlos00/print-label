export const EDITOR_LIMITS = {
	dimensionMm: {
		min: 1,
		max: 500,
	},

	fontSizeMm: {
		min: 1,
		max: 100,
	},

	lineSpacingMm: {
		min: 0,
		max: 100,
	},

	qrSizeMm: {
		min: 1,
		max: 500,
	},

	positionMm: {
		max: 500,
	},
} as const;
