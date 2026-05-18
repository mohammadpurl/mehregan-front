'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Filter, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ColumnFilterProps {
  children: React.ReactNode;           // فرم فیلتر مخصوص این ستون
  isActive: boolean;                   // آیا فیلتر فعال است؟
  onClear: () => void;
  title?: string;
}

export function ColumnFilter({
  children,
  isActive,
  onClear,
  title = "فیلتر ستون",
}: ColumnFilterProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-800",
            isActive && "text-blue-600 dark:text-blue-400"
          )}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-80 rounded-2xl border bg-white dark:bg-zinc-950 p-5 shadow-xl z-50"
          sideOffset={8}
          align="start"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">{title}</h4>
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-red-500 hover:text-red-600"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                پاک کردن
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {children}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              بستن
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              اعمال فیلتر
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}