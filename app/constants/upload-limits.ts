/** هم‌تراز با Backend2 `app/constants/upload_limits.py` */

export const ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

export const AVATAR_MAX_BYTES = 10 * 1024 * 1024;

export const ATTACHMENT_MAX_MB = ATTACHMENT_MAX_BYTES / (1024 * 1024);

export const AVATAR_MAX_MB = AVATAR_MAX_BYTES / (1024 * 1024);

/** برای serverActions در next.config */
export const SERVER_ACTION_BODY_LIMIT = '35mb';
