import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrinterProfiles } from '../hooks/usePrinterProfiles';
import { useTemplate } from '../hooks/useTemplate';
import { useEditorStore } from '../store/useEditorStore';
import { getSavedPrinterId } from '../utils/printerPreference';
import { TopBar } from '../components/editor/TopBar';
import { Toolbar } from '../components/editor/Toolbar';
import { Canvas } from '../components/editor/Canvas';
import { PropertiesPanel } from '../components/editor/PropertiesPanel';

export function EditorPage() {
	const { id } = useParams<{ id: string }>();
	const { isAdmin } = useAuth();

	const { profiles, loading: loadingProfiles, error: profilesError } = usePrinterProfiles();
	const { template, loading: loadingTemplate, error: templateError } = useTemplate(id);

	const [profileWarning, setProfileWarning] = useState<string | null>(null);

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
			setProfileWarning(null);
		}
	}, [id, templateId, resetEditor]);

	// Caso: cargar una plantilla existente
	useEffect(() => {
		if (!id || !template || profiles.length === 0 || profile) return;

		const matchingProfile = profiles.find((p) => p.id === template.profileId);
		if (matchingProfile) {
			loadTemplate(template, matchingProfile);
		} else {
			// La impresora original ya no existe en el catálogo: caemos a la
			// primera disponible y avisamos, en vez de dejar el editor bloqueado.
			loadTemplate(template, profiles[0]!);
			setProfileWarning(
				'La impresora original de esta plantilla ya no está disponible. Se seleccionó otra por defecto.',
			);
		}
	}, [id, template, profiles, profile, loadTemplate]);

	// Caso: editor en blanco -> perfil guardado en localStorage, o el primero
	useEffect(() => {
		if (id || loadingProfiles || profiles.length === 0 || profile) return;

		const savedId = getSavedPrinterId();
		const defaultProfile = profiles.find((p) => p.id === savedId) ?? profiles[0];
		setProfile(defaultProfile!);
	}, [id, loadingProfiles, profiles, profile, setProfile]);

	if (loadingProfiles || (id && loadingTemplate)) {
		return <p className='p-6 text-sm text-app-text-muted'>Cargando editor...</p>;
	}

	if (profilesError) {
		return <p className='p-6 text-sm text-red-400'>{profilesError}</p>;
	}

	if (id && templateError) {
		return <p className='p-6 text-sm text-red-400'>{templateError}</p>;
	}

	return (
		<div className='flex h-full flex-col'>
			{isAdmin && (
				<span className='mx-6 mt-4 inline-block w-fit rounded bg-amber-800 px-3 py-1 text-sm text-white'>
					Modo admin
				</span>
			)}
			{profileWarning && (
				<p className='mx-6 mt-2 rounded-md border border-amber-800 bg-amber-950 p-2 text-sm text-amber-300'>
					{profileWarning}
				</p>
			)}

			<TopBar profiles={profiles} />

			<div className='flex flex-1 overflow-hidden'>
				<Toolbar />
				<Canvas />
				<PropertiesPanel />
			</div>
		</div>
	);
}
