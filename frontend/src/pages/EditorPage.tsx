import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookImage, PanelRight, RotateCw } from 'lucide-react';

import { usePrinterProfiles } from '@/hooks/usePrinterProfiles';
import { useTemplate } from '@/hooks/useTemplate';

import { useEditorStore } from '@/store/useEditorStore';
import { clearHistory } from '@/store/history';

import { getSavedPrinterId } from '@/utils/printerPreference';

import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/TopBar';
import { Toolbar } from '@/components/Toolbar';
import { Canvas } from '@/components/editor/Canvas';
import { EditorPanelTabs } from '@/components/editor/EditorPanelTabs';
import { FloatingActionBar } from '@/components/editor/FloatingActionBar';
import { useMediaQuery } from '@/hooks/useMediaQuery'


// Wrapper que fuerza un remount COMPLETO de EditorPage cada vez que cambia
// el :id de la ruta (incluido pasar de "sin id" a "con id" o viceversa).
export function EditorRoute() {
	const { id } = useParams<{ id: string }>();
	return <EditorPage key={id ?? 'new'} />;
}

function EditorPage() {
	const { id } = useParams<{ id: string }>();
	const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
	const matches = useMediaQuery('(min-width: 64rem)');

	const navigate = useNavigate();

	const { profiles, loading: loadingProfiles, error: profilesError, reload: reloadProfiles } = usePrinterProfiles();
	const { template, error: templateError, errorStatus: templateErrorStatus, reload: reloadTemplate } = useTemplate(id);

	const profile = useEditorStore((s) => s.profile);
	const templateId = useEditorStore((s) => s.templateId);
	const selectedElementId = useEditorStore((s) => s.selectedElementId);
	const setProfile = useEditorStore((s) => s.setProfile);
	const loadTemplate = useEditorStore((s) => s.loadTemplate);
	const newDocument = useEditorStore((s) => s.newDocument);

	useEffect(() => {
		if (!selectedElementId || matches) return;
		setMobilePanelOpen(true);
	}, [selectedElementId, matches]);

	// Si cambia el :id (o pasamos de una plantilla a "nueva"), reseteamos
	// el store antes de que los efectos de abajo vuelvan a poblarlo.
	useEffect(() => {
		if (!id) {
			if (templateId !== null) {
				newDocument();
			}

			clearHistory();
			return;
		}

		if (templateId !== id) {
			newDocument();
			clearHistory();
		}
	}, [id, templateId, newDocument]);

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
		clearHistory();
	}, [id, template, templateId, loadTemplate]);

	// Prioridad: si estamos viendo una plantilla puntual y falló, ese es
	// el error relevante. Si no, y encima no hay NINGÚN perfil activo,
	// mostramos el error de impresoras (si ya hay un perfil activo de
	// antes, un error transitorio de refetch no debería tapar el lienzo).
	const loadError = id ? templateError : !profile ? profilesError : null;

	// Un 404 no se arregla reintentando: solo se ofrece volver a la galería.
	const loadErrorActions = id ? (
		<>
			{templateErrorStatus !== 404 && (
				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={reloadTemplate}
				>
					<RotateCw />
					Reintentar
				</Button>
			)}
			<Button
				type='button'
				size='sm'
				onClick={() => navigate('/galeria')}
			>
				<BookImage />
				Ir a la galería
			</Button>
		</>
	) : (
		<Button
			type='button'
			variant='outline'
			size='sm'
			onClick={reloadProfiles}
		>
			<RotateCw />
			Reintentar
		</Button>
	);

	return (
		<div className='flex h-full flex-col'>
			<TopBar
				profiles={profiles}
				profilesLoading={loadingProfiles}
				profilesError={profilesError}
				onRetryProfiles={reloadProfiles}
			/>

			<div className='flex flex-1 overflow-hidden'>
				<main className='relative min-w-0 flex flex-1 flex-col overflow-hidden'>
					<Toolbar />
					<Canvas
						loadError={loadError}
						loadErrorActions={loadErrorActions}
						onRequestOpenPropertiesPanel={() => {
							if (!matches) setMobilePanelOpen(true);
						}}
					/>
					<FloatingActionBar />

					{!mobilePanelOpen && (
						<button
							type='button'
							onClick={() => setMobilePanelOpen(true)}
							aria-label='Abrir panel de propiedades'
							className='absolute cursor-pointer top-1 right-4 z-30 flex size-9 items-center justify-center rounded-full bg-app-accent-500 text-app-accent-contrast shadow-lg active:bg-app-accent-700 lg:hidden'
						>
							<PanelRight className='size-5' />
						</button>
					)}
				</main>

				<EditorPanelTabs
					mobileOpen={mobilePanelOpen}
					onCloseMobile={() => setMobilePanelOpen(false)}
				/>
			</div>
		</div>
	);
}
