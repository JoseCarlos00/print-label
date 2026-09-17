import { Field } from './Field';
import { beginHistoryTransaction, commitHistoryTransaction } from '@/store/history';
import {
	NumberFieldRoot,
	NumberFieldGroup,
	NumberFieldInput,
	NumberFieldStepper,
	NumberFieldIncrement,
	NumberFieldDecrement,
} from '@/components/ui/number-field';

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
	return (
		<Field
			label={label}
			disabled={disabled}
		>
			<NumberFieldRoot
				value={value ?? null}
				onValueChange={(next) => onChange(next ?? undefined)}
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
						onFocus={beginHistoryTransaction}
						onBlur={commitHistoryTransaction}
					/>
					<NumberFieldStepper>
						<NumberFieldIncrement
							onPointerDown={beginHistoryTransaction}
							onPointerUp={commitHistoryTransaction}
						/>
						<NumberFieldDecrement
							onPointerDown={beginHistoryTransaction}
							onPointerUp={commitHistoryTransaction}
						/>
					</NumberFieldStepper>
				</NumberFieldGroup>
			</NumberFieldRoot>
		</Field>
	);
}
