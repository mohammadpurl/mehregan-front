'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
} as const;

export function AdvancedModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  footer,
}: AdvancedModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex w-full max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-primary bg-white shadow-2xl duration-200 dark:bg-zinc-950 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'inset-x-3 top-[max(0.5rem,env(safe-area-inset-top,0px))] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)]',
            'md:inset-x-auto md:left-1/2 md:top-1/2 md:max-h-[96vh] md:w-full md:-translate-x-1/2 md:-translate-y-1/2',
            sizeClasses[size]
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-2 border-b bg-primary p-3 text-white">
            <div className="min-w-0 flex-1 pr-1">
              <Dialog.Title className="text-lg font-semibold tracking-tight sm:text-xl">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-white/90">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl touch-manipulation transition-colors hover:bg-white/10 dark:hover:bg-zinc-800"
                aria-label="بستن"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 py-3">
            {children}
          </div>

          {footer && (
            <div className="flex shrink-0 flex-col gap-2 border-t p-4 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3 [&_button]:w-full sm:[&_button]:w-auto sm:[&_button]:min-w-32">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}