declare module 'qrcode/lib/core/qrcode.js' {
	const QRCode: {
		create(
			data: string,
			options?: {
				errorCorrectionLevel?: string;
				version?: number;
				maskPattern?: number;
			},
		): {
			modules: {
				size: number;
				data: Uint8Array;
			};
		};
	};

	export default QRCode;
}
