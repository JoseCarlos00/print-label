import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore } from '@/store/useEditorStore';
import { PropertiesPanel } from './panel-editor/PropertiesPanel';
import { QuickTemplatesPanel } from './QuickTemplatesPanel';

type PanelTab = 'panel' | 'templates';

export function EditorPanelTabs() {
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const [tab, setTab] = useState<PanelTab>(selectedElementId ? 'panel' : 'templates');

	// Cambia de tab automático según haya o no selección, pero solo
	// reacciona a CAMBIOS de selección — el usuario puede navegar entre
	// tabs libremente mientras la selección no cambie.
	useEffect(() => {
		setTab(selectedElementId ? 'panel' : 'templates');
	}, [selectedElementId]);

	return (
		<div className='flex w-70 shrink-0 flex-col border-l border-app-border'>
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
	);
}
