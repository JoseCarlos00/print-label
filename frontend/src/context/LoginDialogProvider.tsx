import { useState, type ReactNode } from 'react';

import { LoginDialog } from '@/components/LoginDialog';
import { LoginDialogContext } from './LoginDialogContext';

export function LoginDialogProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	const openLogin = () => setIsOpen(true);
	const closeLogin = () => setIsOpen(false);

	return (
		<LoginDialogContext.Provider
			value={{
				isOpen,
				openLogin,
				closeLogin,
			}}
		>
			{children}

			<LoginDialog
				open={isOpen}
				onOpenChange={setIsOpen}
			/>
		</LoginDialogContext.Provider>
	);
}
