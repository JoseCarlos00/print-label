import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from 'cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore } from '@/store/useEditorStore';
import { PropertiesPanel } from './panel-editor/PropertiesPanel';
import { QuickTemplatesPanel } from './QuickTemplatesPanel';

type PanelTab = 'panel' | 'templates';

interface EditorPanelTabsProps {
	mobileOpen: boolean;
	onCloseMobile: () => void;
}

// En desktop (lg+) es un panel fijo, siempre visible, sin forma de
// ocultarlo. En mobile es un drawer: fixed + translate-x, con fondo
// oscurecido detrás. El breakpoint "lg" separa ambos modos — por debajo
// de eso, lg:* nunca aplica y se comporta 100% como drawer.
export function EditorPanelTabs({ mobileOpen, onCloseMobile }: EditorPanelTabsProps) {
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const [tab, setTab] = useState<PanelTab>(selectedElementId ? 'panel' : 'templates');

	useEffect(() => {
		setTab(selectedElementId ? 'panel' : 'templates');
	}, [selectedElementId]);

	return (
		<>
			{mobileOpen && (
				<div
					className='fixed inset-0 z-40 bg-black/50 lg:hidden'
					onClick={onCloseMobile}
				/>
			)}

			<div
				className={cn(
					'z-50 flex w-70 max-w-[85vw] shrink-0 flex-col border-l border-app-border bg-app-bg',
					'fixed inset-y-0 right-0 transition-transform duration-200 ease-out',
					'lg:static lg:max-w-none lg:translate-x-0',
					mobileOpen ? 'translate-x-0' : 'translate-x-full',
				)}
			>
				<div className='flex items-center justify-end border-b border-app-border p-2 lg:hidden'>
					<button
						type='button'
						onClick={onCloseMobile}
						aria-label='Cerrar panel'
						className='rounded-md p-1 text-app-text-muted hover:bg-app-surface cursor-pointer'
					>
						<X className='size-4' />
					</button>
				</div>

				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value as PanelTab)}
					className='flex h-full flex-col gap-0'
				>
					<TabsList className='m-2'>
						<TabsTrigger value='panel'>Panel</TabsTrigger>
						<TabsTrigger value='templates'>Plantillas</TabsTrigger>
					</TabsList>

					<TabsContent
						value='panel'
						className='flex-1 overflow-y-auto thin-scrollbar'
					>
						<PropertiesPanel />
					</TabsContent>

					<TabsContent
						value='templates'
						className='flex-1 overflow-y-auto thin-scrollbar'
					>
						<QuickTemplatesPanel />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
