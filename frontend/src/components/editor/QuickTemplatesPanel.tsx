import { FilePlus, CircleCheckBig, Circle, LayoutTemplate } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTemplates } from '@/hooks/useTemplates';
import { useEditorStore } from '@/store/useEditorStore';
import { useNewDocument } from '@/hooks/useNewDocument';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-panels';
import { formatLabelSize } from '@/utils/templateInfo';
import { cn } from '@/lib/utils';
import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import type { Template } from 'shared';

const QUICK_TEMPLATE_LIMIT = 10;

export function QuickTemplatesPanel() {
	const { profiles } = usePrinterProfiles();
	const { templates, loading, error, reload } = useTemplates(false);

	const templateId = useEditorStore((state) => state.templateId);
	const handleNewDocument = useNewDocument();

	const labelSize = (template: Template) =>
		formatLabelSize(profiles.find((p) => p.id === template.profileId))?.replaceAll('mm', '') ?? '';

	return (
		<div className='flex flex-col gap-2 p-4'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium uppercase text-app-text-muted'>Plantillas</p>

				<Link
					to='/galeria'
					className='text-xs text-app-accent hover:underline'
				>
					Ver todas
				</Link>
			</div>

			<Button
				variant='outline'
				size='sm'
				className='justify-start'
				onClick={handleNewDocument}
			>
				<FilePlus className='size-4' />
				Nueva etiqueta
			</Button>

			{loading && (
				<LoadingState
					compact
					label='Cargando plantillas...'
				/>
			)}

			{error && (
				<ErrorState
					compact
					title='No se pudieron cargar las plantillas'
					message={error}
					onRetry={reload}
				/>
			)}

			{!loading && !error && templates.length === 0 && (
				<EmptyState
					compact
					icon={LayoutTemplate}
					title='Aún no hay plantillas'
					description='Diseña una etiqueta y usa «Guardar plantilla» o «Solicitar plantilla» para crear la primera.'
				/>
			)}

			{templates.slice(0, QUICK_TEMPLATE_LIMIT).map((template) => {
				const isSelected = template.id === templateId;

				return (
					<Link
						key={template.id}
						to={`/editor/${template.id}`}
						className={cn(
							'group relative flex items-center gap-2 rounded-md border px-3 py-2 pr-20 text-left text-sm transition-colors',
							isSelected
								? 'border-app-accent bg-app-accent/10 text-app-text'
								: 'border-app-border text-app-text hover:bg-app-surface',
						)}
					>
						<span className='flex size-4 shrink-0 items-center justify-center'>
							{isSelected ? (
								<CircleCheckBig className='size-4 text-app-accent' />
							) : (
								<Circle className='size-4 text-app-text/50' />
							)}
						</span>

						<span className='min-w-0 truncate'>{template.name}</span>
						<span className='absolute right-3 w-16.25 truncate text-right text-xs text-app-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
							{labelSize(template)}
						</span>
					</Link>
				);
			})}
		</div>
	);
}
