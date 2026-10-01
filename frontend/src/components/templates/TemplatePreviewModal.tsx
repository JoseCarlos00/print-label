import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { PrinterProfile, Template } from 'shared';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { StaticLabelPreview } from './StaticLabelPreview';
import { formatLabelSize } from '@/utils/templateInfo';

interface TemplatePreviewModalProps {
	template: Template;
	profile: PrinterProfile | undefined;
	onClose: () => void;
	footer: ReactNode;
	subtitle?: ReactNode;
}

export function TemplatePreviewModal({ template, profile, onClose, footer, subtitle }: TemplatePreviewModalProps) {
	const [outOfBoundsCount, setOutOfBoundsCount] = useState(0);

	const handleOutOfBoundsCountChange = useCallback((count: number) => {
		setOutOfBoundsCount(count);
	}, []);

	useEffect(() => {
		setOutOfBoundsCount(0);
	}, [template.id]);

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className='flex max-h-[90vh] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'>
				<div className='min-w-0 border-b border-app-border p-4 pr-12'>
					<DialogTitle className='truncate text-lg font-semibold'>{template.name}</DialogTitle>
					<DialogDescription className='mt-1'>
						{subtitle && <span className='block'>{subtitle}</span>}
						<span className='block'>Etiqueta: {formatLabelSize(profile)}</span>
						{outOfBoundsCount > 0 && (
							<span className='mt-1 block text-amber-400 text-sm'>
								{outOfBoundsCount === 1
									? 'Hay 1 elemento fuera del área de impresión.'
									: `Hay ${outOfBoundsCount} elementos fuera del área de impresión.`}
							</span>
						)}
					</DialogDescription>
				</div>

				{profile ? (
					<StaticLabelPreview
						key={template.id}
						template={template}
						profile={profile}
						onOutOfBoundsCountChange={handleOutOfBoundsCountChange}
					/>
				) : (
					<div className='flex flex-1 items-center justify-center p-8'>
						<p className='text-sm text-red-400'>
							La impresora original de esta plantilla ya no está disponible, no se puede generar la vista previa.
						</p>
					</div>
				)}

				<div className='flex flex-wrap justify-end gap-2 border-t border-app-border p-3'>{footer}</div>
			</DialogContent>
		</Dialog>
	);
}
