import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from 'cn';

function NumberFieldRoot({ className, ...props }: NumberFieldPrimitive.Root.Props) {
	return (
		<NumberFieldPrimitive.Root
			data-slot='number-field'
			className={cn('w-full', className)}
			{...props}
		/>
	);
}

function NumberFieldGroup({ className, ...props }: NumberFieldPrimitive.Group.Props) {
	return (
		<NumberFieldPrimitive.Group
			data-slot='number-field-group'
			className={cn(
				'flex items-stretch overflow-hidden rounded-md border border-app-border bg-app-surface',
				'has-[input:focus-visible]:border-app-accent-500 has-[input:focus-visible]:ring-1 has-[input:focus-visible]:ring-app-accent-500',
				className,
			)}
			{...props}
		/>
	);
}

function NumberFieldInput({ className, ...props }: NumberFieldPrimitive.Input.Props) {
	return (
		<NumberFieldPrimitive.Input
			data-slot='number-field-input'
			className={cn('w-full min-w-0 bg-transparent px-2 py-1 text-sm text-app-text outline-none', className)}
			{...props}
		/>
	);
}

function NumberFieldStepper({ children }: { children: React.ReactNode }) {
	return <div className='flex flex-col border-l border-app-border'>{children}</div>;
}

function NumberFieldIncrement({ className, ...props }: NumberFieldPrimitive.Increment.Props) {
	return (
		<NumberFieldPrimitive.Increment
			data-slot='number-field-increment'
			className={cn(
				'flex flex-1 items-center justify-center px-1 text-app-text-muted hover:bg-app-border disabled:opacity-40 cursor-pointer',
				className,
			)}
			{...props}
		>
			<ChevronUp className='size-3' />
		</NumberFieldPrimitive.Increment>
	);
}

function NumberFieldDecrement({ className, ...props }: NumberFieldPrimitive.Decrement.Props) {
	return (
		<NumberFieldPrimitive.Decrement
			data-slot='number-field-decrement'
			className={cn(
				'flex flex-1 items-center justify-center border-t border-app-border px-1 text-app-text-muted hover:bg-app-border disabled:opacity-40 cursor-pointer',
				className,
			)}
			{...props}
		>
			<ChevronDown className='size-3' />
		</NumberFieldPrimitive.Decrement>
	);
}

export {
	NumberFieldRoot,
	NumberFieldGroup,
	NumberFieldInput,
	NumberFieldStepper,
	NumberFieldIncrement,
	NumberFieldDecrement,
};
