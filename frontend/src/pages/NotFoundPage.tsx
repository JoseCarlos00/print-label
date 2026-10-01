import { CircleHelp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/state-panels';

export function NotFoundPage() {
	const navigate = useNavigate();

	return (
		<div className='flex h-full items-center justify-center overflow-y-auto p-6'>
			<EmptyState
				className='w-full max-w-lg'
				icon={CircleHelp}
				title='Página no encontrada'
				description='La dirección que abriste no corresponde a una página disponible.'
				action={
					<div className='flex flex-wrap justify-center gap-2'>
						<Button
							type='button'
							onClick={() => navigate('/')}
						>
							Ir al editor
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={() => navigate('/galeria')}
						>
							Galería
						</Button>
					</div>
				}
			/>
		</div>
	);
}
