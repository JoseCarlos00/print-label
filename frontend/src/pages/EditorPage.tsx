import { useAuth } from '../context/AuthContext';

export function EditorPage() {
	const { isAdmin } = useAuth();

	return (
		<div className='p-6'>
			{isAdmin && (
				<span className='inline-block mb-4 rounded bg-amber-800 px-3 py-1 text-sm text-white'>Modo admin</span>
			)}
			<h1 className='text-3xl font-bold text-amber-900 dark:text-amber-100'>Editor de etiquetas</h1>
			{/* TODO: canvas WYSIWYG — próxima etapa */}
		</div>
	);
}
