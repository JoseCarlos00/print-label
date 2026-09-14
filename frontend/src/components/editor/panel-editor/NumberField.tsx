import { useEffect, useRef, useState } from 'react';
import { Field } from './Field';

interface NumberFieldProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	disabled?: boolean;
	step?: number;
	placeholder?: string;
	debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 120;

export function NumberField({
	label,
	value,
	onChange,
	min,
	max,
	disabled = false,
	step = 1,
	placeholder,
	debounceMs = DEFAULT_DEBOUNCE_MS,
}: NumberFieldProps) {
	const [inputValue, setInputValue] = useState(String(value));
	const lastCommittedValue = useRef(value);

	/*
	 * Si el valor cambia desde fuera del componente
	 * (por ejemplo, al seleccionar otro elemento),
	 * sincronizamos el input local.
	 */
	useEffect(() => {
		if (value === lastCommittedValue.current) {
			return;
		}

		setInputValue(String(value));
		lastCommittedValue.current = value;
	}, [value]);

	useEffect(() => {
		const parsed = Number(inputValue);

		if (!Number.isFinite(parsed)) {
			return;
		}

		const timer = window.setTimeout(() => {
			let nextValue = parsed;

			if (min !== undefined) {
				nextValue = Math.max(min, nextValue);
			}

			if (max !== undefined) {
				nextValue = Math.min(max, nextValue);
			}

			if (nextValue !== lastCommittedValue.current) {
				lastCommittedValue.current = nextValue;
				onChange(nextValue);
			}
		}, debounceMs);

		return () => window.clearTimeout(timer);
	}, [inputValue, min, max, debounceMs, onChange]);

	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		e.currentTarget.select();
	};

	const handleBlur = () => {
		if (inputValue.trim() === '') {
			setInputValue(String(value));
			return;
		}

		const parsed = Number(inputValue);

		if (!Number.isFinite(parsed)) {
			setInputValue(String(value));
			return;
		}

		let nextValue = parsed;

		if (min !== undefined) {
			nextValue = Math.max(min, nextValue);
		}

		if (max !== undefined) {
			nextValue = Math.min(max, nextValue);
		}

		setInputValue(String(nextValue));

		if (nextValue !== lastCommittedValue.current) {
			lastCommittedValue.current = nextValue;
			onChange(nextValue);
		}
	};

	return (
		<Field
			label={label}
			disabled={disabled}
		>
			<input
				type='number'
				value={inputValue}
				min={min}
				max={max}
				step={step}
				placeholder={placeholder}
				disabled={disabled}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onChange={(e) => setInputValue(e.target.value)}
				className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
			/>
		</Field>
	);
}
