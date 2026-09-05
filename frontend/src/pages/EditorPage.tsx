import { useEffect, useMemo, useState } from 'react';
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

	const [fallbackProfileId, setFallbackProfileId] = useState<string>('');

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
			setFallbackProfileId('');
		}
	}, [id, templateId, resetEditor]);

	const matchingProfile = useMemo(
		() => (template ? profiles.find((p) => p.id === template.profileId) : undefined),
		[template, profiles],
	);

	const needsProfileSelection = Boolean(id && template && profiles.length > 0 && !matchingProfile && !profile);

	// Caso: plantilla existente cuya impresora SÍ está disponible -> carga directa
	useEffect(() => {
		if (!id || !template || !matchingProfile || profile) return;
		loadTemplate(template, matchingProfile);
	}, [id, template, matchingProfile, profile, loadTemplate]);

	// Caso: editor en blanco -> perfil guardado en localStorage, o el primero
	useEffect(() => {
		if (id || loadingProfiles || profiles.length === 0 || profile) return;
		const savedId = getSavedPrinterId();
		const defaultProfile = profiles.find((p) => p.id === savedId) ?? profiles[0];
		setProfile(defaultProfile!);
	}, [id, loadingProfiles, profiles, profile, setProfile]);

	const handleConfirmFallbackProfile = () => {
		const chosen = profiles.find((p) => p.id === fallbackProfileId);
		if (chosen && template) loadTemplate(template, chosen);
	};

	if (loadingProfiles || (id && loadingTemplate)) {
		return <p className='p-6 text-sm text-app-text-muted'>Cargando editor...</p>;
	}

	if (profilesError) return <p className='p-6 text-sm text-red-400'>{profilesError}</p>;
	if (id && templateError) return <p className='p-6 text-sm text-red-400'>{templateError}</p>;

	if (needsProfileSelection) {
		return (
			<div className='mx-auto mt-20 max-w-sm space-y-4 p-6'>
				<p className='text-sm text-amber-300'>
					La impresora original de esta plantilla ya no está disponible. Elegí una impresora para continuar editando "
					{template!.name}".
				</p>
				<select
					className='w-full rounded-md border border-app-border bg-app-surface p-2 text-app-text'
					value={fallbackProfileId}
					onChange={(e) => setFallbackProfileId(e.target.value)}
				>
					<option
						value=''
						disabled
					>
						Selecciona una impresora
					</option>
					{profiles.map((p) => (
						<option
							key={p.id}
							value={p.id}
						>
							{p.name} ({p.ip})
						</option>
					))}
				</select>
				<button
					disabled={!fallbackProfileId}
					onClick={handleConfirmFallbackProfile}
					className='rounded-md bg-app-accent px-3 py-1.5 text-sm font-medium text-app-accent-contrast disabled:opacity-50'
				>
					Continuar
				</button>
			</div>
		);
	}

	return (
		<div className='flex h-full flex-col'>
			{isAdmin && (
				<span className='mx-6 mt-4 inline-block w-fit rounded bg-amber-800 px-3 py-1 text-sm text-white'>
					Modo admin
				</span>
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
