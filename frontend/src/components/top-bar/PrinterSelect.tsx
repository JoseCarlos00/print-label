import type { EditorStore } from '@/store/editorStore.types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PrinterProfile } from 'shared'

interface PrinterSelectProps extends Pick<EditorStore, 'setProfile'> {
	profiles: PrinterProfile[];
	loading: boolean;
	profile: PrinterProfile | null;
}

export function PrinterSelect({ profiles, loading, profile, setProfile }: PrinterSelectProps) {
	const handleChange = (profileId: string | null) => {
		const selectedProfile = profiles.find((item) => item.name === profileId);

		setProfile(selectedProfile ?? null);
	};

	const placeholder = loading
		? 'Cargando impresoras...'
		: profiles.length === 0
			? 'Sin impresoras disponibles'
			: 'Seleccionar impresora';

	return (
		<Select
			value={profile?.name ?? ''}
			onValueChange={handleChange}
			disabled={profiles.length === 0}
		>
			<SelectTrigger className='w-36 sm:w-48'>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>

			<SelectContent className='max-h-150'>
				{profiles.map((item) => (
					<SelectItem
						key={item.name}
						value={item.name}
					>
						<div className='flex min-w-0 flex-col py-1 px-0.5'>
							<span className='truncate'>{item.name}</span>

							<span className='truncate text-[10px] text-app-text-muted'>{item.label}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
