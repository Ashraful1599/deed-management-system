import { createRoot } from 'react-dom/client';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
}

export function showConfirm(message: string, options?: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };

    root.render(
      <ConfirmDialog
        message={message}
        title={options?.title}
        confirmLabel={options?.confirmLabel}
        onConfirm={() => { cleanup(); resolve(true); }}
        onCancel={() => { cleanup(); resolve(false); }}
      />
    );
  });
}
