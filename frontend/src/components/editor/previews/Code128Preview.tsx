import { useEffect, useRef, useState } from 'react';
import type { BarcodeElement } from 'shared';
import { createCode128Bitmap } from 'shared/zpl';
import { useEditorStore } from '../../../store/useEditorStore';
import { mmToPx } from '../../../utils/scale';

export function Code128Preview({ element }: { element: BarcodeElement }) {
	const [textOverflow, setTextOverflow] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);

	const profile = useEditorStore((s) => s.profile);
	const dpi = profile?.dpi ?? 203;


	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const bitmap = createCode128Bitmap(element, dpi);

		canvas.width = bitmap.widthDots;
		canvas.height = bitmap.heightDots;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const imageData = ctx.createImageData(bitmap.widthDots, bitmap.heightDots);

		for (let y = 0; y < bitmap.heightDots; y++) {
			for (let x = 0; x < bitmap.widthDots; x++) {
				const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);

				const bitIndex = 7 - (x % 8);

				const isBlack = (bitmap.data[byteIndex] & (1 << bitIndex)) !== 0;

				const pixelIndex = (y * bitmap.widthDots + x) * 4;

				const value = isBlack ? 0 : 255;

				imageData.data[pixelIndex] = value;
				imageData.data[pixelIndex + 1] = value;
				imageData.data[pixelIndex + 2] = value;
				imageData.data[pixelIndex + 3] = 255;
			}
		}

		ctx.putImageData(imageData, 0, 0);
	}, [element, dpi]);

	const textGap = mmToPx(1);
	const textSize = mmToPx(3);

	const textStyle: React.CSSProperties = {
		position: 'absolute',
		width: `${mmToPx(element.width)}px`,
		fontSize: `${textSize}px`,
		lineHeight: 1,
		whiteSpace: 'nowrap',
		left: '50%',
		transform: 'translateX(-50%)',
		top: `calc(100% + ${textGap}px)`,
		overflow: 'hidden',
		opacity: textOverflow ? 0.45 : 1,
	};

	useEffect(() => {
		const text = textRef.current;
		if (!text) return;

		setTextOverflow(text.scrollWidth > text.clientWidth);
	}, [element.content, element.width, textSize]);

	return (
		<div
			style={{
				position: 'relative',
				width: mmToPx(element.width),
				height: mmToPx(element.height),
			}}
		>
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
					display: 'block',
				}}
			/>

			{element.showText && (
				<span
					ref={textRef}
					className='text-black'
					style={textStyle}
				>
					{element.content}

					{textOverflow && (
						<span
							style={{
								position: 'absolute',
								inset: 0,
								background: 'repeating-linear-gradient(135deg, transparent 0 4px, rgba(255,0,0,.35) 4px 6px)',
								pointerEvents: 'none',
							}}
						/>
					)}
				</span>
			)}
		</div>
	);
}
