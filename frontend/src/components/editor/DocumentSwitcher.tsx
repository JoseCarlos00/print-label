import { FilePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentSwitcherProps {
  templateId: string | null;
  templateName: string;
  onNewDocument: () => void;
}

export function DocumentSwitcher({
  templateId,
  templateName,
  onNewDocument,
}: DocumentSwitcherProps) {
  const hasTemplate = Boolean(templateId);

  if (!hasTemplate) {
    return (
      <Button
        variant='outline'
        size='sm'
        className='shrink-0 cursor-pointer'
        onClick={onNewDocument}
      >
        <FilePlus className='size-4' />
        Nueva etiqueta
      </Button>
    );
  }

  return (
    <div className='flex min-w-0 items-center rounded-md border border-app-border bg-app-surface'>
      <div className='flex min-w-0 items-center gap-2 px-3 py-1.5'>
        <span className='shrink-0 text-sm'>📄</span>
        <span
          className='truncate text-sm font-medium text-app-text'
          title={templateName}
        >
          {templateName}
        </span>
      </div>

      <Button
        variant='ghost'
        size='icon'
        className='mr-0.5 size-7 shrink-0 text-app-text-muted hover:text-app-text cursor-pointer'
        onClick={onNewDocument}
        title='Cerrar plantilla'
        aria-label='Cerrar plantilla'
      >
        <X className='size-4 text-red-600' />
      </Button>
    </div>
  );
}
