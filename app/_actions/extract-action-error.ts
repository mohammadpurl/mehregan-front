/** تبدیل detail خطای API به متن قابل نمایش */
function formatErrorDetail(detail: unknown): string | undefined {
  if (detail == null) return undefined;
  if (typeof detail === 'string') return detail.trim() || undefined;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const o = item as { msg?: string; message?: string; loc?: unknown[] };
          const text = o.msg || o.message;
          if (!text) return undefined;
          const loc = Array.isArray(o.loc) ? o.loc.filter(Boolean).join('.') : '';
          return loc ? `${loc}: ${text}` : text;
        }
        return undefined;
      })
      .filter((x): x is string => Boolean(x));
    return parts.length > 0 ? parts.join('\n') : undefined;
  }

  if (typeof detail === 'object') {
    const o = detail as { message?: string; msg?: string; detail?: string };
    if (typeof o.message === 'string') return o.message;
    if (typeof o.msg === 'string') return o.msg;
    if (typeof o.detail === 'string') return o.detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }

  return String(detail);
}

/** تبدیل مقدار فیلد validation به لیست رشته (FastAPI / ProblemDetails شکل‌های مختلف) */
function normalizeFieldMessages(msgs: unknown): string[] {
  if (msgs == null) return [];
  if (typeof msgs === 'string') return msgs.trim() ? [msgs.trim()] : [];
  if (typeof msgs === 'number' || typeof msgs === 'boolean') return [String(msgs)];
  if (Array.isArray(msgs)) {
    return msgs.flatMap((item) => normalizeFieldMessages(item));
  }
  if (typeof msgs === 'object') {
    const o = msgs as { msg?: string; message?: string; detail?: string };
    if (typeof o.msg === 'string' && o.msg.trim()) return [o.msg.trim()];
    if (typeof o.message === 'string' && o.message.trim()) return [o.message.trim()];
    if (typeof o.detail === 'string' && o.detail.trim()) return [o.detail.trim()];
    try {
      return [JSON.stringify(msgs)];
    } catch {
      return [String(msgs)];
    }
  }
  return [String(msgs)];
}

function formatValidationErrors(errors: Record<string, unknown> | undefined): string | undefined {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return undefined;
  const lines = Object.entries(errors).flatMap(([field, msgs]) =>
    normalizeFieldMessages(msgs).map((m) => `${field}: ${m}`),
  );
  return lines.length > 0 ? lines.join('\n') : undefined;
}

/** استخراج پیام خطا از پاسخ API یا شیء پرتاب‌شده توسط http-error-strategies — همیشه string */
export function extractActionErrorMessage(err: unknown, fallback: string): string {
  if (err == null) return fallback;
  if (typeof err === 'string') return err.trim() || fallback;

  const e = err as {
    message?: unknown;
    detail?: unknown;
    title?: unknown;
    errors?: Record<string, unknown>;
    response?: { data?: { message?: unknown; detail?: unknown; title?: unknown; errors?: Record<string, unknown> } };
  };

  const candidates = [
    formatErrorDetail(e.response?.data?.detail),
    formatErrorDetail(e.response?.data?.message),
    formatValidationErrors(e.response?.data?.errors),
    formatErrorDetail(e.detail),
    formatErrorDetail(e.message),
    formatValidationErrors(e.errors),
    formatErrorDetail(e.response?.data?.title),
    formatErrorDetail(e.title),
  ];

  for (const c of candidates) {
    if (c) return c;
  }

  return fallback;
}
