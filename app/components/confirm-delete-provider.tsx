'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import { DELETE_CONFIRM_MESSAGE, confirmDeleteFallback } from '@/app/utils/confirm-delete';

type ConfirmDeleteContextValue = {
  confirmDelete: () => Promise<boolean>;
};

const ConfirmDeleteContext = createContext<ConfirmDeleteContextValue | null>(null);

export function ConfirmDeleteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirmDelete = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOpen(true);
    });
  }, []);

  const finish = (value: boolean) => {
    setOpen(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) finish(false);
  };

  return (
    <ConfirmDeleteContext.Provider value={{ confirmDelete }}>
      {children}
      <AdvancedModal
        open={open}
        onOpenChange={handleOpenChange}
        title="تأیید حذف"
        size="sm"
        footer={
          <div className="flex w-full flex-row-reverse flex-wrap justify-start gap-2 sm:flex-row-reverse sm:justify-start">
            <Button type="button" variant="outline" onClick={() => finish(false)}>
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => finish(true)}
            >
              حذف
            </Button>
          </div>
        }
      >
        <p className="text-right text-lg top-2 h-10 leading-relaxed text-foreground">{DELETE_CONFIRM_MESSAGE}</p>
      </AdvancedModal>
    </ConfirmDeleteContext.Provider>
  );
}

export function useConfirmDelete() {
  const ctx = useContext(ConfirmDeleteContext);
  const confirmDelete = useCallback(async () => {
    if (ctx) return ctx.confirmDelete();
    return confirmDeleteFallback();
  }, [ctx]);
  return { confirmDelete };
}
