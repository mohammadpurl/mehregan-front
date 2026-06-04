import { resolveMediaUrl } from '@/app/utils/media-url';

export type AttachmentDisplayItem = {
  id?: string | number;
  fileName: string;
  fileUrl: string;
};

/** مسیر پروکسی هم‌مبدأ Next.js — برای دانلود/مشاهده در مرورگر */
export function attachmentProxyDownloadPath(attachmentId: number | string): string {
  return `/api/attachments/${attachmentId}/download`;
}

export function extractAttachmentId(fileUrl: string): string | null {
  const m = fileUrl.match(/\/attachments\/(\d+)\/download/i);
  return m?.[1] ?? null;
}

/** آدرس مستقیم بک‌اند (fallback) */
export function resolveAttachmentDownloadUrl(fileUrl: string): string {
  return resolveMediaUrl(fileUrl) ?? '';
}

function fileNameFromUrl(url: string): string {
  try {
    const path = url.split('?')[0] ?? url;
    const segment = path.split('/').filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : 'فایل پیوست';
  } catch {
    return 'فایل پیوست';
  }
}

export function parseAttachmentsFromApi(raw: unknown): AttachmentDisplayItem[] {
  if (!Array.isArray(raw)) return [];
  const out: AttachmentDisplayItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = o.id != null ? (typeof o.id === 'number' ? o.id : String(o.id)) : undefined;
    const fileUrl = String(
      o.fileUrl ?? o.file_url ?? o.downloadUrl ?? o.download_url ?? o.url ?? '',
    ).trim();
    const fileName = String(o.fileName ?? o.file_name ?? o.name ?? '').trim();
    const resolvedUrl =
      fileUrl || (id != null ? attachmentProxyDownloadPath(id) : '');
    if (!resolvedUrl && !fileName) continue;
    out.push({
      id,
      fileName: fileName || fileNameFromUrl(resolvedUrl),
      fileUrl: resolvedUrl,
    });
  }
  return out.filter((a) => Boolean(a.fileUrl));
}

export function collectAttachmentItems(record: {
  documentsUrls?: string[];
  documents_urls?: string[];
  attachments?: { id?: string | number; fileName?: string; fileUrl?: string; file_name?: string; file_url?: string }[];
}): AttachmentDisplayItem[] {
  const fromObjects = parseAttachmentsFromApi(record.attachments);
  const urls = [
    ...(Array.isArray(record.documentsUrls) ? record.documentsUrls : []),
    ...(Array.isArray(record.documents_urls) ? record.documents_urls : []),
  ]
    .map((u) => String(u).trim())
    .filter(Boolean);

  const fromUrls: AttachmentDisplayItem[] = urls.map((fileUrl, i) => ({
    id: `url-${i}`,
    fileName: fileNameFromUrl(fileUrl),
    fileUrl,
  }));

  const seen = new Set<string>();
  const merged: AttachmentDisplayItem[] = [];
  for (const item of [...fromObjects, ...fromUrls]) {
    const key = item.fileUrl;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}
