import {
  attachmentProxyDownloadPath,
  extractAttachmentId,
  resolveAttachmentDownloadUrl,
} from '@/app/utils/attachment-display.utils';
import { notifyFormError } from '@/app/utils/form-notify';

function resolveFetchTarget(
  fileUrl: string,
  attachmentId?: string | number | null,
): string {
  if (attachmentId != null && String(attachmentId).match(/^\d+$/)) {
    return attachmentProxyDownloadPath(attachmentId);
  }
  const fromUrl = extractAttachmentId(fileUrl);
  if (fromUrl) return attachmentProxyDownloadPath(fromUrl);
  return resolveAttachmentDownloadUrl(fileUrl);
}

export async function fetchAttachmentBlob(
  fileUrl: string,
  attachmentId?: string | number | null,
  accessToken?: string | null,
): Promise<Blob> {
  const url = resolveFetchTarget(fileUrl, attachmentId);
  if (!url) {
    throw new Error('آدرس فایل پیوست نامعتبر است');
  }

  const isSameOriginProxy = url.startsWith('/api/attachments/');
  const headers: Record<string, string> = {};
  if (!isSameOriginProxy && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: isSameOriginProxy ? 'include' : 'include',
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'دسترسی به فایل پیوست مجاز نیست. دوباره وارد شوید.'
        : response.status === 404
          ? 'فایل پیوست یافت نشد.'
          : 'دریافت فایل پیوست ناموفق بود',
    );
  }

  return response.blob();
}

/** دانلود فایل پیوست */
export async function downloadAttachmentFile(
  fileUrl: string,
  fileName: string,
  accessToken?: string | null,
  attachmentId?: string | number | null,
): Promise<void> {
  const blob = await fetchAttachmentBlob(fileUrl, attachmentId, accessToken);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** باز کردن پیوست در تب جدید (مثلاً PDF / تصویر) */
export async function openAttachmentFile(
  fileUrl: string,
  accessToken?: string | null,
  attachmentId?: string | number | null,
): Promise<void> {
  const blob = await fetchAttachmentBlob(fileUrl, attachmentId, accessToken);
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('مرورگر اجازه باز کردن پنجره جدید را نداد. پاپ‌آپ را فعال کنید.');
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}

export function reportAttachmentActionError(mode: 'download' | 'view', err: unknown) {
  const fallback = mode === 'view' ? 'نمایش فایل ممکن نشد.' : 'دانلود فایل ممکن نشد.';
  const message = err instanceof Error && err.message ? err.message : fallback;
  notifyFormError(message);
}
