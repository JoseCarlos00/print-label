const profiles = ...; // de usePrinterProfiles
const profile = useEditorStore((s) => s.profile);
const setProfile = useEditorStore((s) => s.setProfile);
const elements = useEditorStore((s) => s.elements);
const [printState, setPrintState] = useState<'idle' | 'printing'>('idle');
const [printError, setPrintError] = useState<string | null>(null);
const [printSuccess, setPrintSuccess] = useState(false);

const handlePrint = async () => {
	if (!profile) return;
	setPrintState('printing');
	setPrintError(null);
	setPrintSuccess(false);
	try {
		await api.post('/print', { elements, profileId: profile.id });
		setPrintSuccess(true);
	} catch (err) {
		setPrintError(err instanceof ApiError ? err.message : 'Error al imprimir');
	} finally {
		setPrintState('idle');
	}
};

return (
	<div className="flex items-center gap-3">
		<label className="text-sm text-app-text-muted">
			Imprimiendo a:
			<select
				className="ml-2 rounded-md border border-app-border bg-app-surface p-1 text-app-text"
				value={profile?.id ?? ''}
				onChange={(e) => {
					const next = profiles.find((p) => p.id === e.target.value);
					if (next) setProfile(next);
				}}
			>
				{profiles.map((p) => (
					<option key={p.id} value={p.id}>
						{p.name} ({p.ip})
					</option>
				))}
			</select>
		</label>

		<button
			onClick={handlePrint}
			disabled={printState === 'printing' || !profile || elements.length === 0}
			className="rounded-md bg-app-accent px-3 py-1.5 text-sm font-medium text-app-accent-contrast disabled:opacity-50"
		>
			{printState === 'printing' ? 'Imprimiendo...' : 'Imprimir'}
		</button>

		{printSuccess && <span className="text-sm text-green-400">Enviado a {profile?.name}</span>}
		{printError && <span className="text-sm text-red-400">{printError}</span>}
	</div>
);
