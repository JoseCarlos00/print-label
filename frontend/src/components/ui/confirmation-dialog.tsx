import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	confirmVariant?: 'default' | 'destructive';
	busy?: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void | Promise<void>;
}

export function ConfirmationDialog({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = 'Cancelar',
	confirmVariant = 'default',
	busy = false,
	onOpenChange,
	onConfirm,
}: ConfirmationDialogProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!busy) onOpenChange(nextOpen);
			}}
		>
			<DialogContent
				className='top-1/4'
				showCloseButton={!busy}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription className='whitespace-pre-line'>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						disabled={busy}
						onClick={() => onOpenChange(false)}
					>
						{cancelLabel}
					</Button>
					<Button
						type='button'
						variant={confirmVariant}
						disabled={busy}
						onClick={() => void onConfirm()}
					>
						{busy ? 'Procesando...' : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
