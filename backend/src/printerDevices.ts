export interface LabelSize {
	widthMm: number;
	heightMm: number;
}

// Catálogo de tamaños físicos de etiqueta que soportan tus impresoras.
export const labelSizes = {
	'4x4': { widthMm: 101.6, heightMm: 101.6 },
	'70x32': { widthMm: 70, heightMm: 32 },
} as const satisfies Record<string, LabelSize>;

export type LabelSizeKey = keyof typeof labelSizes;

// DPI fijo: todas tus impresoras son 203 dpi
export const DEFAULT_DPI = 203;

export interface PrinterDevice {
	name: string;
	ip: string;
	label: string;
	labelSize: LabelSizeKey;
}

export const printerDevices: PrinterDevice[] = [
	{ name: 'Embarque', ip: '192.168.15.210', label: 'LabelPrinter210', labelSize: '4x4' },
	{ name: 'Empaque01', ip: '192.168.15.219', label: 'LabelPrinter219', labelSize: '4x4' },
	{ name: 'Empaque02', ip: '192.168.15.223', label: 'LabelPrinter223', labelSize: '4x4' },
	{ name: 'Empaque04', ip: '192.168.15.213', label: 'LabelPrinter213', labelSize: '4x4' },
	{ name: 'Empaque05', ip: '192.168.15.225', label: 'LabelPrinter225', labelSize: '4x4' },
	{ name: 'Empaque06', ip: '192.168.15.218', label: 'LabelPrinter218', labelSize: '4x4' },
	{ name: 'Empaque07', ip: '192.168.15.222', label: 'LabelPrinter222', labelSize: '4x4' },
	{ name: 'Empaque08', ip: '192.168.15.221', label: 'LabelPrinter221', labelSize: '4x4' },
	{ name: 'Empaque09', ip: '192.168.15.220', label: 'LabelPrinter220', labelSize: '4x4' },
	{ name: 'Empaque10', ip: '192.168.15.216', label: 'LabelPrinter216', labelSize: '4x4' },
	{ name: 'Empaque11', ip: '192.168.15.214', label: 'LabelPrinter214', labelSize: '4x4' },
	{ name: 'Empaque12', ip: '192.168.15.211', label: 'LabelPrinter211', labelSize: '4x4' },
	{ name: 'Empaque13', ip: '192.168.15.215', label: 'LabelPrinter215', labelSize: '4x4' },
	{ name: 'Empaque14', ip: '192.168.15.217', label: 'LabelPrinter217', labelSize: '4x4' },
	{ name: 'Empaque15', ip: '192.168.15.212', label: 'LabelPrinter212', labelSize: '4x4' },
	{ name: 'Empaque16', ip: '192.168.15.226', label: 'LabelPrinter226', labelSize: '4x4' },
	{ name: 'Empaque17', ip: '192.168.15.232', label: 'LabelPrinter232', labelSize: '4x4' },
	{ name: 'Empaque18', ip: '192.168.15.224', label: 'LabelPrinter224', labelSize: '4x4' },
	{ name: 'Empaque19', ip: '192.168.15.233', label: 'LabelPrinter228', labelSize: '4x4' },
	{ name: 'Etiquetado01', ip: '192.168.15.227', label: 'LabelPrinter227', labelSize: '4x4' },
	{ name: 'Etiquetado02', ip: '192.168.15.231', label: 'LabelPrinter231', labelSize: '4x4' },
	{ name: 'Etiquetado03', ip: '192.168.15.229', label: 'LabelPrinter229', labelSize: '4x4' },
	{ name: 'Impresora246', ip: '192.168.15.230', label: 'LabelPrinter230', labelSize: '4x4' },


	{ name: 'ImpZebra-01', ip: '192.168.15.235', label: 'EtiquetadoraChica', labelSize: '70x32' },
	{ name: 'ImpZebra-02', ip: '192.168.15.233', label: 'EtiquetadoraChica', labelSize: '70x32' },
	{ name: 'ImpZebra-03', ip: '192.168.15.237', label: 'EtiquetadoraChica', labelSize: '70x32' },
	
];
