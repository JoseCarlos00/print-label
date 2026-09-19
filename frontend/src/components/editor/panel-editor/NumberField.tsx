import { useRef } from 'react'
import { Field } from './Field';
import {
	NumberFieldRoot,
	NumberFieldGroup,
	NumberFieldInput,
	NumberFieldStepper,
	NumberFieldIncrement,
	NumberFieldDecrement,
} from '@/components/ui/number-field';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history'

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
}

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
}: NumberFieldProps) {
	const isEditing = useRef(false);

	const handleChange = (nextValue: number | undefined) => {
		if (!isEditing.current) {
			isEditing.current = true;
			beginHistoryTransaction();
		}

		onChange(nextValue ?? undefined);
	};


	const handleBlur = () => {
		if (!isEditing.current) return;

			isEditing.current = false;
			commitHistoryTransaction();
	};

	const handlePointerUp = () => {
		if (!isEditing.current) return;

		isEditing.current = false;
		commitHistoryTransaction();
	}

	return (
		<Field
			label={label}
			disabled={disabled}
		>
			<NumberFieldRoot
				value={value ?? null}
				onValueChange={(next) => handleChange(next ?? undefined)}
				onBlur={handleBlur}
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
						<NumberFieldIncrement onPointerUp={handlePointerUp} />
						<NumberFieldDecrement onPointerUp={handlePointerUp} />
					</NumberFieldStepper>
				</NumberFieldGroup>
			</NumberFieldRoot>
		</Field>
	);
}
