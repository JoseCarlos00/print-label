import { useEffect, useRef, useState } from 'react';
import { Field } from './Field';
import {
	NumberFieldRoot,
	NumberFieldGroup,
	NumberFieldInput,
	NumberFieldStepper,
	NumberFieldIncrement,
	NumberFieldDecrement,
} from '@/components/ui/number-field';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history';

interface NumberFieldProps {
	label: string;
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	min?: number;
	max?: number;
	disabled?: boolean;
	step?: number;
	placeholder?: string;
	inputClassName?: string;
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
	inputClassName,
	debounceMs = DEFAULT_DEBOUNCE_MS,
}: NumberFieldProps) {
	const [localValue, setLocalValue] = useState<number | undefined>(value);

	const isEditing = useRef(false);
	const lastCommittedValue = useRef(value);
	const debounceTimer = useRef<number | null>(null);

	const stepperHeldRef = useRef(false);

	useEffect(() => {
		if (value === lastCommittedValue.current) return;
		setLocalValue(value);
		lastCommittedValue.current = value;
	}, [value]);

	const commitValue = (nextValue: number) => {
		if (debounceTimer.current !== null) {
			window.clearTimeout(debounceTimer.current);
			debounceTimer.current = null;
		}
		if (nextValue === lastCommittedValue.current) return;
		lastCommittedValue.current = nextValue;
		onChange(nextValue);
	};

	const handleValueChange = (next: number | null) => {
		if (!isEditing.current) {
			isEditing.current = true;
			beginHistoryTransaction();
		}

		setLocalValue(next ?? undefined);

		if (debounceTimer.current !== null) {
			window.clearTimeout(debounceTimer.current);
			debounceTimer.current = null;
		}

		if (next === null) return;

		debounceTimer.current = window.setTimeout(() => {
			commitValue(next);
		}, debounceMs);
	};

	const handleValueCommitted = (committed: number | null) => {
		if (stepperHeldRef.current) {
			if (committed !== null) commitValue(committed);
			return;
		}

		if (committed === null) {
			setLocalValue(lastCommittedValue.current);
		} else {
			commitValue(committed);
		}

		if (isEditing.current) {
			isEditing.current = false;
			commitHistoryTransaction();
		}
	};

	const handleStepperPointerDown = () => {
		stepperHeldRef.current = true;
		if (!isEditing.current) {
			isEditing.current = true;
			beginHistoryTransaction();
		}
	};

	const handleStepperPointerUp = () => {
		stepperHeldRef.current = false;
		if (isEditing.current) {
			isEditing.current = false;
			commitHistoryTransaction();
		}
	};

	useEffect(() => {
		return () => {
			if (debounceTimer.current !== null) {
				window.clearTimeout(debounceTimer.current);
			}
			if (isEditing.current) {
				isEditing.current = false;
				commitHistoryTransaction();
			}
		};
	}, []);

	return (
		<Field
			label={label}
			disabled={disabled}
		>
			<NumberFieldRoot
				value={localValue ?? null}
				onValueChange={handleValueChange}
				onValueCommitted={handleValueCommitted}
				min={min}
				max={max}
				step={step}
				disabled={disabled}
				className='mt-1'
			>
				<NumberFieldGroup>
					<NumberFieldInput
						placeholder={placeholder}
						className={inputClassName}
					/>
					<NumberFieldStepper>
						<NumberFieldIncrement
							onPointerDown={handleStepperPointerDown}
							onPointerUp={handleStepperPointerUp}
						/>
						<NumberFieldDecrement
							onPointerDown={handleStepperPointerDown}
							onPointerUp={handleStepperPointerUp}
						/>
					</NumberFieldStepper>
				</NumberFieldGroup>
			</NumberFieldRoot>
		</Field>
	);
}
