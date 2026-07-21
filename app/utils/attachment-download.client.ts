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

/**
 * دانلود پیوست فقط از طریق پروکسی همان‌مبدأ (/api/attachments/...) با کوکی httpOnly.
 * دیگر accessToken سمت کلاینت لازم نیست.
 */
export async function fetchAttachmentBlob(
  fileUrl: string,
  attachmentId?: string | number | null,
): Promise<Blob> {
  const url = resolveFetchTarget(fileUrl, attachmentId);
  if (!url) {
    throw new Error('آدرس فایل پیوست نامعتبر است');
  }

  const isSameOriginProxy = url.startsWith('/api/attachments/');
  if (!isSameOriginProxy) {
    // اجبار به پروکسی امن — جلوگیری از Bearer در مرورگر
    const id = attachmentId ?? extractAttachmentId(fileUrl);
    if (id != null && String(id).match(/^\d+$/)) {
      return fetchAttachmentBlob(fileUrl, id);
    }
    throw new Error('دانلود مستقیم پیوست از دامنهٔ خارجی مجاز نیست. شناسه پیوست لازم است.');
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
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

export async function downloadAttachmentFile(
  fileUrl: string,
  fileName: string,
  attachmentId?: string | number | null,
): Promise<void> {
  const blob = await fetchAttachmentBlob(fileUrl, attachmentId);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function openAttachmentFile(
  fileUrl: string,
  attachmentId?: string | number | null,
): Promise<void> {
  const blob = await fetchAttachmentBlob(fileUrl, attachmentId);
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
