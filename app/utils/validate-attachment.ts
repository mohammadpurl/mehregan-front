import { ATTACHMENT_MAX_BYTES } from '@/app/constants/upload-limits';
import { formatBytesFa } from '@/app/utils/format-bytes-fa';

export { ATTACHMENT_MAX_BYTES };

export const ATTACHMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.heic',
  '.heif',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.zip',
] as const;

export const ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.heic,.heif,.gif,.bmp,.tif,.tiff,.zip,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip';

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

function fileExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!ext) return '';
  return ext === 'jpeg' ? '.jpg' : `.${ext}`;
}

export function validateAttachmentFile(file: File): string | null {
  if (!file || file.size === 0) {
    return `فایل «${file?.name || 'بدون نام'}» خالی است یا قابل ارسال نیست.`;
  }

  if (file.size > ATTACHMENT_MAX_BYTES) {
    return `فایل «${file.name}» (${formatBytesFa(file.size)}) بزرگ‌تر از حد مجاز است. حداکثر ${formatBytesFa(ATTACHMENT_MAX_BYTES)}`;
  }

  const ext = fileExtension(file.name);
  const extOk = ATTACHMENT_EXTENSIONS.includes(ext as (typeof ATTACHMENT_EXTENSIONS)[number]);
  const mimeOk =
    (file.type && file.type.startsWith('image/')) ||
    IMAGE_MIMES.has(file.type) ||
    file.type === 'application/pdf' ||
    file.type.includes('spreadsheet') ||
    file.type.includes('excel') ||
    file.type.includes('word') ||
    file.type === 'application/msword' ||
    file.type === 'application/zip' ||
    (file.type === 'application/octet-stream' && extOk);

  if (!extOk && !mimeOk) {
    return `فرمت فایل «${file.name}» مجاز نیست. مجاز: تصویر، PDF، Word، Excel، ZIP`;
  }

  return null;
}

export function filterValidAttachmentFiles(files: File[]): {
  valid: File[];
  errors: string[];
} {
  const valid: File[] = [];
  const errors: string[] = [];
  for (const f of files) {
    const err = validateAttachmentFile(f);
    if (err) errors.push(err);
    else valid.push(f);
  }
  return { valid, errors };
}

export function validateAttachmentFiles(files: File[]): string | null {
  for (const f of files) {
    const err = validateAttachmentFile(f);
    if (err) return err;
  }
  return null;
}
