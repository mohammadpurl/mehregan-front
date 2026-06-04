export type ComboboxPageResult = {
  items: { value: string; label: string }[];
  total: number;
  hasMore?: boolean;
};

/** تشخیص وجود صفحهٔ بعد — بر اساس total API و تعداد واقعی آیتم‌های برگشتی */
export function computeHasMore(
  page: number,
  pageSize: number,
  itemCount: number,
  total?: number,
): boolean {
  if (itemCount <= 0) return false;
  const loaded = (page - 1) * pageSize + itemCount;
  if (typeof total === 'number' && total > 0) {
    return loaded < total;
  }
  return itemCount >= pageSize;
}

export function toComboboxPageResult(
  page: number,
  pageSize: number,
  items: { value: string; label: string }[],
  total?: number,
): ComboboxPageResult {
  const safeTotal = typeof total === 'number' && total >= 0 ? total : items.length;
  return {
    items,
    total: safeTotal,
    hasMore: computeHasMore(page, pageSize, items.length, safeTotal),
  };
}
