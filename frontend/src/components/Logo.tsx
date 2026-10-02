import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox='0 0 64 64'
			aria-hidden='true'
			className={cn('size-5 shrink-0', className)}
		>
			<rect
				width='64'
				height='64'
				rx='14'
				className='fill-app-accent-500'
			/>
			<path
				className='fill-app-bg'
				d='M18 14h28a4 4 0 0 1 4 4v20L38 50H18a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4Z'
			/>
			<path
				className='fill-app-accent-700'
				d='M50 38 38 50v-8a4 4 0 0 1 4-4Z'
			/>
			<g className='fill-app-accent-500'>
				<rect
					x='20'
					y='20'
					width='3'
					height='24'
				/>
				<rect
					x='25'
					y='20'
					width='2'
					height='24'
				/>
				<rect
					x='29'
					y='20'
					width='4'
					height='24'
				/>
				<rect
					x='35'
					y='20'
					width='2'
					height='24'
				/>
				<rect
					x='39'
					y='20'
					width='3'
					height='14'
				/>
			</g>
		</svg>
	);
}

interface LogoProps {
	className?: string;
	titleClassName?: string;
}

export function Logo({ className, titleClassName }: LogoProps) {
	return (
		<span className={cn('inline-flex items-center gap-2 text-sm font-semibold text-app-text', className)}>
			<LogoMark />
			<span className={titleClassName}>PrintLabel</span>
		</span>
	);
}
