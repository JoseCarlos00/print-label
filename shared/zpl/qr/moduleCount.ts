import QRCode from 'qrcode/lib/core/qrcode.js';
import { QrErrorCorrection } from '../../types';

export function getQrModuleCount(content: string, errorCorrection: QrErrorCorrection = 'M'): number {
	return QRCode.create(content, { errorCorrectionLevel: errorCorrection }).modules.size;
}
