import { useCallback, useEffect, useState } from 'react';
import type { PrinterProfile, Template } from 'shared';
import { mmToPx } from '@/utils/scale';
import { StaticLabelElement } from './StaticLabelElement';
import { cn } from '@/lib/utils';

interface StaticLabelPreviewProps {
	template: Template;
	profile: PrinterProfile;
	onOutOfBoundsCountChange: (count: number) => void;
}

export function StaticLabelPreview({ template, profile, onOutOfBoundsCountChange }: StaticLabelPreviewProps) {
	const [outOfBoundsElementIds, setOutOfBoundsElementIds] = useState<Set<string>>(() => new Set());

	const handleOutOfBoundsChange = useCallback((elementId: string, isOutOfBounds: boolean) => {
		setOutOfBoundsElementIds((current) => {
			if (current.has(elementId) === isOutOfBounds) return current;

			const next = new Set(current);
			if (isOutOfBounds) {
				next.add(elementId);
			} else {
				next.delete(elementId);
			}
			return next;
		});
	}, []);

	useEffect(() => {
		onOutOfBoundsCountChange(outOfBoundsElementIds.size);
	}, [onOutOfBoundsCountChange, outOfBoundsElementIds]);

	return (
		<div className='min-h-0 min-w-0 flex-1 overflow-auto bg-app-bg thin-scrollbar'>
			<div className='flex min-h-full min-w-full w-max items-center justify-center p-6'>
				<div
					style={{ width: mmToPx(profile.widthMm), height: mmToPx(profile.heightMm) }}
					className={cn(
						'relative shrink-0 border border-app-border bg-gray-300 zebra-font-emulated',
						outOfBoundsElementIds.size > 0 && 'border-amber-400',
					)}
				>
					{template.elements.map((el) => (
						<StaticLabelElement
							key={el.id}
							element={el}
							canvasWidthMm={profile.widthMm}
							canvasHeightMm={profile.heightMm}
							dpi={profile.dpi}
							onOutOfBoundsChange={handleOutOfBoundsChange}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
