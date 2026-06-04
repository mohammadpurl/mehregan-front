'use client';

import { useState } from 'react';
import { Download, Eye, FileSpreadsheet, FileText, FileType, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useSessionStore } from '@/app/_store/auth-store';
import type { AttachmentDisplayItem } from '@/app/utils/attachment-display.utils';
import {
  downloadAttachmentFile,
  openAttachmentFile,
  reportAttachmentActionError,
} from '@/app/utils/attachment-download.client';
import { cn } from '@/lib/utils';

function fileIcon(name: string) {
  const lower = name.toLowerCase();
  if (/\.(png|jpe?g|gif|webp)$/i.test(lower)) return ImageIcon;
  if (/\.(xlsx?|csv)$/i.test(lower)) return FileSpreadsheet;
  if (/\.pdf$/i.test(lower)) return FileType;
  return FileText;
}

type Props = {
  items: AttachmentDisplayItem[];
  className?: string;
};

export function WorkflowTimelineAttachmentChips({ items, className }: Props) {
  const accessToken = useSessionStore(
    (s) =>
      s.session?.accesstoken ??
      (s.session as { accessToken?: string } | null)?.accessToken,
  );
  const [busyId, setBusyId] = useState<string | number | null>(null);

  if (!items.length) return null;

  const run = async (item: AttachmentDisplayItem, mode: 'view' | 'download') => {
    const key = item.id ?? item.fileUrl;
    setBusyId(key);
    try {
      if (mode === 'view') await openAttachmentFile(item.fileUrl, accessToken, item.id);
      else await downloadAttachmentFile(item.fileUrl, item.fileName, accessToken, item.id);
    } catch (err) {
      reportAttachmentActionError(mode, err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground">پیوست‌ها</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = fileIcon(item.fileName);
          const key = String(item.id ?? item.fileUrl);
          const busy = busyId === (item.id ?? item.fileUrl);
          return (
            <li
              key={key}
              className="flex max-w-full items-center gap-1 rounded-lg border bg-background px-2 py-1.5 text-xs shadow-sm"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="max-w-[140px] truncate" title={item.fileName}>
                {item.fileName}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={busy}
                onClick={() => void run(item, 'view')}
                title="مشاهده"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={busy}
                onClick={() => void run(item, 'download')}
                title="دانلود"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
