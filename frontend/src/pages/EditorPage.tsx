import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PanelRight } from 'lucide-react';
import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import { useTemplate } from '@/hooks/useTemplate';
import { useEditorStore } from '@/store/useEditorStore';
import { getSavedPrinterId } from '@/utils/printerPreference';
import { TopBar } from '@/components/editor/TopBar';
import { Toolbar } from '@/components/editor/Toolbar';
import { Canvas } from '@/components/editor/Canvas';
import { EditorPanelTabs } from '@/components/editor/EditorPanelTabs';

// Wrapper que fuerza un remount COMPLETO de EditorPage cada vez que cambia
// el :id de la ruta (incluido pasar de "sin id" a "con id" o viceversa).
export function EditorRoute() {
	const { id } = useParams<{ id: string }>();
	return <EditorPage key={id ?? 'new'} />;
}

function EditorPage() {
	const { id } = useParams<{ id: string }>();
	const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

	const { profiles, loading: loadingProfiles, error: profilesError } = usePrinterProfiles();
	const { template, error: templateError } = useTemplate(id);

	const profile = useEditorStore((s) => s.profile);
	const templateId = useEditorStore((s) => s.templateId);
	const setProfile = useEditorStore((s) => s.setProfile);
	const loadTemplate = useEditorStore((s) => s.loadTemplate);
	const resetEditor = useEditorStore((s) => s.resetEditor);

	// Si cambia el :id (o pasamos de una plantilla a "nueva"), reseteamos
	// el store antes de que los efectos de abajo vuelvan a poblarlo.
	useEffect(() => {
		if (templateId !== (id ?? null)) {
			resetEditor();
		}
	}, [id, templateId, resetEditor]);

	// El perfil/impresora es una preferencia del LIENZO, independiente de
	// qué plantilla esté cargada: se define una sola vez (preferencia
	// guardada en localStorage, o el primero disponible) y abrir una
	// plantilla nunca lo pisa. Corre tanto en editor nuevo como en uno
	// con :id.
	useEffect(() => {
		if (loadingProfiles || profiles.length === 0 || profile) return;
		const savedId = getSavedPrinterId();
		const defaultProfile = profiles.find((p) => p.id === savedId) ?? profiles[0];
		setProfile(defaultProfile!);
	}, [loadingProfiles, profiles, profile, setProfile]);

	// Carga los elements de la plantilla apenas llegan, sin esperar al
	// perfil y sin tocarlo.
	useEffect(() => {
		if (!id || !template || templateId === template.id) return;
		loadTemplate(template);
	}, [id, template, templateId, loadTemplate]);

	// Prioridad: si estamos viendo una plantilla puntual y falló, ese es
	// el error relevante. Si no, y encima no hay NINGÚN perfil activo,
	// mostramos el error de impresoras (si ya hay un perfil activo de
	// antes, un error transitorio de refetch no debería tapar el lienzo).
	const loadError = id ? templateError : !profile ? profilesError : null;

	return (
		<div className='flex h-full flex-col'>
			<TopBar
				profiles={profiles}
				profilesError={profilesError}
			/>
			<div className='flex flex-1 overflow-hidden'>
				<Toolbar />
				<Canvas loadError={loadError} />

				{!mobilePanelOpen && (
					<button
						type='button'
						onClick={() => setMobilePanelOpen(true)}
						aria-label='Abrir panel de propiedades'
						className='fixed bottom-4 right-4 z-30 flex size-11 items-center justify-center rounded-full bg-app-accent-500 text-app-accent-contrast shadow-lg active:bg-app-accent-700 lg:hidden'
					>
						<PanelRight className='size-5' />
					</button>
				)}

				<EditorPanelTabs
					mobileOpen={mobilePanelOpen}
					onCloseMobile={() => setMobilePanelOpen(false)}
				/>
			</div>
		</div>
	);
}
