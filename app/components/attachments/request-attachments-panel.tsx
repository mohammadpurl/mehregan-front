'use client';

import { useState } from 'react';
import { Download, Eye, Paperclip } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useSessionStore } from '@/app/_store/auth-store';
import {
  type AttachmentDisplayItem,
  collectAttachmentItems,
} from '@/app/utils/attachment-display.utils';
import {
  downloadAttachmentFile,
  openAttachmentFile,
  reportAttachmentActionError,
} from '@/app/utils/attachment-download.client';
import { AttachmentImageThumb } from '@/app/components/attachments/attachment-image-thumb';

type Props = {
  title?: string;
  documentsUrls?: string[];
  attachments?: { id?: string | number; fileName?: string; fileUrl?: string }[];
  items?: AttachmentDisplayItem[];
  className?: string;
};

export function RequestAttachmentsPanel({
  title = 'پیوست‌ها',
  documentsUrls,
  attachments,
  items: itemsProp,
  className,
}: Props) {
  const accessToken = useSessionStore(
    (s) =>
      s.session?.accesstoken ??
      (s.session as { accessToken?: string } | null)?.accessToken,
  );
  const [busyId, setBusyId] = useState<string | number | null>(null);

  const items =
    itemsProp ??
    collectAttachmentItems({
      documentsUrls,
      attachments,
    });

  const runDownload = async (item: AttachmentDisplayItem, mode: 'download' | 'view') => {
    const key = item.id ?? item.fileUrl;
    setBusyId(key);
    try {
      if (mode === 'view') {
        await openAttachmentFile(item.fileUrl, accessToken, item.id);
      } else {
        await downloadAttachmentFile(item.fileUrl, item.fileName, accessToken, item.id);
      }
    } catch (err) {
      reportAttachmentActionError(mode, err);
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className={`rounded-lg border border-dashed bg-muted/10 p-3 text-sm text-muted-foreground ${className ?? ''}`}>
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 shrink-0 opacity-60" />
          <span>پیوستی ثبت نشده است.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-muted/20 p-3 ${className ?? ''}`}>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Paperclip className="h-4 w-4" />
        {title}
        <span className="text-xs font-normal text-muted-foreground">({items.length} فایل)</span>
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const key = item.id ?? item.fileUrl;
          const busy = busyId === key;
          return (
            <li
              key={String(key)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <AttachmentImageThumb
                  fileUrl={item.fileUrl}
                  fileName={item.fileName}
                  attachmentId={item.id}
                  onOpen={() => void runDownload(item, 'view')}
                />
                <span className="truncate text-sm" title={item.fileName}>
                  {item.fileName}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runDownload(item, 'view')}
                >
                  <Eye className="ml-1 h-4 w-4" />
                  مشاهده
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runDownload(item, 'download')}
                >
                  <Download className="ml-1 h-4 w-4" />
                  دانلود
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
