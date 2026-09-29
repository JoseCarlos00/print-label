import { useNavigate } from 'react-router-dom';
import { confirmLeaveEditor } from '@/utils/navigationGuard';
import { clearHistory } from '@/store/history';
import { useEditorStore } from '@/store/useEditorStore';

export function useNewDocument() {
	const navigate = useNavigate();
	const newDocument = useEditorStore((state) => state.newDocument);

	return () => {
		if (!confirmLeaveEditor()) return;

		newDocument();
		clearHistory();
		navigate('/');
	};
}
