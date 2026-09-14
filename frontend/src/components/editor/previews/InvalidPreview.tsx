interface InvalidPreviewProps {
	message?: string;
}

export function InvalidPreview({ message = 'No se puede mostrar este elemento' }: InvalidPreviewProps) {
	return (
		<div className='flex items-center justify-center border border-dashed border-red-400 px-2 py-1 text-[10px] text-red-500'>
			{message}
		</div>
	);
}
