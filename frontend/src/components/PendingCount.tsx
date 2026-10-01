export function PendingCount({ count }: { count: number }) {
	if (count <= 0) return null;

	return (
		<span
			className='ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-app-accent-500 px-1 text-[10px] font-semibold text-app-accent-contrast'
			aria-label={`${count} solicitudes pendientes`}
		>
			{count > 99 ? '99+' : count}
		</span>
	);
}
