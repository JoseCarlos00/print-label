import type { PrinterProfile, Template } from 'shared';
import { mmToPx } from '@/utils/scale';
import { StaticLabelElement } from './StaticLabelElement';

interface StaticLabelPreviewProps {
	template: Template;
	profile: PrinterProfile;
}

export function StaticLabelPreview({ template, profile }: StaticLabelPreviewProps) {
	return (
		<div className='flex flex-1 items-center justify-center overflow-auto bg-app-bg p-6 thin-scrollbar'>
			<div
				style={{ width: mmToPx(profile.widthMm), height: mmToPx(profile.heightMm) }}
				className='relative border border-app-border bg-gray-300 zebra-font-emulated'
			>
				{template.elements.map((el) => (
					<StaticLabelElement
						key={el.id}
						element={el}
						canvasWidthMm={profile.widthMm}
						canvasHeightMm={profile.heightMm}
						dpi={profile.dpi}
					/>
				))}
			</div>
		</div>
	);
}
