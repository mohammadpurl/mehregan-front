'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { fetchAttachmentBlob } from '@/app/utils/attachment-download.client';

function isImageFileName(fileName: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName);
}

type Props = {
  fileUrl: string;
  fileName: string;
  attachmentId?: string | number | null;
  className?: string;
  onOpen?: () => void;
};

/** پیش‌نمایش تصویر پیوست از طریق پروکسی همان‌مبدأ — برای غیرتصویر آیکون فایل */
export function AttachmentImageThumb({
  fileUrl,
  fileName,
  attachmentId,
  className,
  onOpen,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isImage = isImageFileName(fileName);

  useEffect(() => {
    if (!isImage || !fileUrl) return;
    let revoked = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const blob = await fetchAttachmentBlob(fileUrl, attachmentId);
        if (revoked) return;
        if (!blob.type.startsWith('image/') && !isImageFileName(fileName)) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!revoked) setFailed(true);
      }
    })();

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId, fileName, fileUrl, isImage]);

  if (!isImage || failed || !src) {
    return (
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-md border bg-muted/40 ${className ?? ''}`}
      >
        <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-background ${className ?? ''}`}
      onClick={onOpen}
      title={`مشاهده ${fileName}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={fileName} className="h-full w-full object-cover" />
    </button>
  );
}

export function isLikelyImageFile(file: File): boolean {
  return file.type.startsWith('image/') || isImageFileName(file.name);
}
