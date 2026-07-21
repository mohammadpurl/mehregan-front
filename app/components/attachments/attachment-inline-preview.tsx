'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { fetchAttachmentBlob } from '@/app/utils/attachment-download.client';
import { isLikelyImageFile } from '@/app/components/attachments/attachment-image-thumb';
import {
  extractAttachmentId,
} from '@/app/utils/attachment-display.utils';

function isPdfName(name: string): boolean {
  return /\.pdf$/i.test(name) || name.toLowerCase().includes('pdf');
}

type RemoteProps = {
  fileUrl: string;
  fileName?: string | null;
  attachmentId?: string | number | null;
  className?: string;
};

/** پیش‌نمایش inline تصویر یا PDF از URL پیوست ذخیره‌شده */
export function RemoteAttachmentPreview({
  fileUrl,
  fileName,
  attachmentId,
  className,
}: RemoteProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [kind, setKind] = useState<'image' | 'pdf' | 'other'>('other');
  const [error, setError] = useState(false);
  const name = fileName?.trim() || 'فایل';
  const id = attachmentId ?? extractAttachmentId(fileUrl);

  useEffect(() => {
    if (!fileUrl) return;
    let revoked = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const blob = await fetchAttachmentBlob(fileUrl, id);
        if (revoked) return;
        const isImage =
          blob.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);
        const isPdf = blob.type === 'application/pdf' || isPdfName(name);
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setKind(isImage ? 'image' : isPdf ? 'pdf' : 'other');
      } catch {
        if (!revoked) setError(true);
      }
    })();

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, id, name]);

  if (error) {
    return (
      <div
        className={`flex h-40 items-center justify-center rounded-md border bg-muted/30 text-xs text-muted-foreground ${className ?? ''}`}
      >
        پیش‌نمایش در دسترس نیست
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`flex h-40 items-center justify-center rounded-md border bg-muted/20 text-xs text-muted-foreground ${className ?? ''}`}
      >
        در حال بارگذاری پیش‌نمایش…
      </div>
    );
  }

  if (kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`max-h-80 w-full rounded-md border object-contain bg-background ${className ?? ''}`}
      />
    );
  }

  if (kind === 'pdf') {
    return (
      <iframe
        title={name}
        src={src}
        className={`h-80 w-full rounded-md border bg-background ${className ?? ''}`}
      />
    );
  }

  return (
    <div
      className={`flex h-24 items-center gap-2 rounded-md border bg-muted/20 px-3 text-sm ${className ?? ''}`}
    >
      <FileText className="h-5 w-5 text-muted-foreground" />
      <span className="truncate">{name}</span>
    </div>
  );
}

type LocalProps = {
  file: File;
  className?: string;
};

/** پیش‌نمایش فایل انتخاب‌شده قبل از آپلود */
export function LocalFileInlinePreview({ file, className }: LocalProps) {
  const [src, setSrc] = useState<string | null>(null);
  const isImage = isLikelyImageFile(file);
  const isPdf = file.type === 'application/pdf' || isPdfName(file.name);

  useEffect(() => {
    if (!isImage && !isPdf) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage, isPdf]);

  if (isImage && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={file.name}
        className={`max-h-64 w-full rounded-md border object-contain bg-background ${className ?? ''}`}
      />
    );
  }

  if (isPdf && src) {
    return (
      <iframe
        title={file.name}
        src={src}
        className={`h-64 w-full rounded-md border bg-background ${className ?? ''}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm ${className ?? ''}`}
    >
      <FileText className="h-5 w-5 text-muted-foreground" />
      <span className="truncate">{file.name}</span>
    </div>
  );
}
