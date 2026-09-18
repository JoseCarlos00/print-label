import { forwardRef, useEffect, useRef, useState } from 'react';
import { Field } from './Field';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history';

interface TextAreaFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	rows?: number;
	debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 120;

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
	{ label, value, onChange, disabled = false, rows = 2, debounceMs = DEFAULT_DEBOUNCE_MS },
	ref,
) {
	const [inputValue, setInputValue] = useState(value);
	const lastCommittedValue = useRef(value);

	useEffect(() => {
		if (value === lastCommittedValue.current) {
			return;
		}

		setInputValue(value);
		lastCommittedValue.current = value;
	}, [value]);

	useEffect(() => {
		if (inputValue === lastCommittedValue.current) {
			return;
		}

		const timer = window.setTimeout(() => {
			lastCommittedValue.current = inputValue;
			onChange(inputValue);
		}, debounceMs);

		return () => window.clearTimeout(timer);
	}, [inputValue, debounceMs, onChange]);

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
				onChange={(e) => setInputValue(e.target.value)}
				onFocus={beginHistoryTransaction}
				onBlur={commitHistoryTransaction}
				className='mt-1 w-full rounded-md border border-app-border bg-app-surface p-1 text-app-text'
			/>
		</Field>
	);
});
