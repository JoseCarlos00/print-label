import { useEffect, useRef, useState, type Ref } from 'react';
import { Field } from './Field';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history';

interface TextAreaFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	rows?: number;
	debounceMs?: number;
	ref?: Ref<HTMLTextAreaElement>;
}

const DEFAULT_DEBOUNCE_MS = 120;

export function TextAreaField({
	label,
	value,
	onChange,
	disabled = false,
	rows = 2,
	debounceMs = DEFAULT_DEBOUNCE_MS,
	ref,
}: TextAreaFieldProps) {
	const [inputValue, setInputValue] = useState(value);

	// Último valor que realmente fue aceptado/guardado.
	const lastCommittedValue = useRef(value);

	// Mantiene el valor que estaba en el store antes de que el usuario
	// empezara a editar.
	const previousValue = useRef(value);

	const debounceTimer = useRef<number | null>(null);

	useEffect(() => {
		// El valor cambió externamente.
		if (value === lastCommittedValue.current) {
			return;
		}

		setInputValue(value);
		lastCommittedValue.current = value;
		previousValue.current = value;
	}, [value]);

	const commitValue = (nextValue: string) => {
		if (!nextValue.trim()) {
			return;
		}

		if (nextValue === lastCommittedValue.current) {
			return;
		}

		lastCommittedValue.current = nextValue;
		previousValue.current = nextValue;
		onChange(nextValue);
	};

	const handleChange = (nextValue: string) => {
		setInputValue(nextValue);

		if (debounceTimer.current !== null) {
			window.clearTimeout(debounceTimer.current);
		}

		if (!nextValue.trim()) {
			return;
		}

		debounceTimer.current = window.setTimeout(() => {
			commitValue(nextValue);
			debounceTimer.current = null;
		}, debounceMs);
	};

	const handleFocus = () => {
		previousValue.current = lastCommittedValue.current;
		beginHistoryTransaction();
	};

	const handleBlur = () => {
		if (debounceTimer.current !== null) {
			window.clearTimeout(debounceTimer.current);
			debounceTimer.current = null;
		}

		if (!inputValue.trim()) {
			setInputValue(previousValue.current);
		} else {
			// Si el debounce todavía estaba pendiente, guardamos
			// inmediatamente al perder el focus.
			commitValue(inputValue);
		}

		commitHistoryTransaction();
	};

	useEffect(() => {
		return () => {
			if (debounceTimer.current !== null) {
				window.clearTimeout(debounceTimer.current);
			}
		};
	}, []);

	return (
		<Field
			label={label}
			disabled={disabled}
		>
			<textarea
				ref={ref}
				value={inputValue}
				rows={rows}
				disabled={disabled}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={handleFocus}
				onBlur={handleBlur}
				className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
			/>
		</Field>
	);
}
