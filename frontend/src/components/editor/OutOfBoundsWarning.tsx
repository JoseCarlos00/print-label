interface OutOfBoundsWarningProps {
	x: number; // px, relativo al lienzo
	y: number; // px, relativo al lienzo
}

// Ícono flotante centrado sobre un elemento que quedó fuera del área
// imprimible. Puramente visual: no bloquea imprimir ni guardar —
// el recorte real ocurre en la generación de ZPL (shared/zpl).
export function OutOfBoundsWarning({ x, y }: OutOfBoundsWarningProps) {
	return (
		<div
			className='group pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2'
			style={{ left: x, top: y }}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<div className='pointer-events-auto flex size-6 items-center justify-center rounded-full border border-red-400 bg-app-bg/90 text-red-400 shadow'>
				<svg
					className='size-3.5'
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 512 512'
					fill='currentColor'
				>
					<path d='M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z' />
				</svg>
			</div>

			<div className='pointer-events-none absolute left-1/2 top-full z-30 mt-1 w-max -translate-x-1/2 rounded-md border border-app-border bg-app-surface px-2 py-1 text-[10px] text-app-text opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100'>
				Objeto fuera de la etiqueta
			</div>
		</div>
	);
}
