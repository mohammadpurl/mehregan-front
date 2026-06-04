'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { cn } from '@/lib/utils';

export type ComboboxPageResult = {
  items: { value: string; label: string }[];
  total: number;
  hasMore?: boolean;
};

type NoneOption = {
  label: string;
  value: string;
};

export type InfiniteScrollComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  clearable?: boolean;
  noneOption?: NoneOption;
  selectedFallbackLabel?: string;
  queryKey: readonly unknown[];
  fetchPage: (page: number, search: string) => Promise<ComboboxPageResult>;
};

function getNextPageFromResult(
  lastPage: ComboboxPageResult,
  allPages: ComboboxPageResult[],
): number | undefined {
  if (lastPage.hasMore) return allPages.length + 1;
  return undefined;
}

export function InfiniteScrollCombobox({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = 'انتخاب کنید…',
  searchPlaceholder = 'جستجو…',
  clearable = true,
  noneOption,
  selectedFallbackLabel,
  queryKey,
  fetchPage,
}: InfiniteScrollComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const infiniteQuery = useInfiniteQuery({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: ({ pageParam }) => fetchPage(pageParam as number, debouncedSearch),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => getNextPageFromResult(lastPage, allPages),
    enabled: open,
    staleTime: 0,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } = infiniteQuery;

  const options = useMemo(() => {
    const merged = new Map<string, { value: string; label: string }>();
    for (const page of infiniteQuery.data?.pages ?? []) {
      for (const item of page.items) merged.set(item.value, item);
    }
    if (value && !merged.has(value)) {
      merged.set(value, {
        value,
        label: selectedFallbackLabel?.trim() || `شناسه ${value}`,
      });
    }
    return Array.from(merged.values());
  }, [infiniteQuery.data?.pages, selectedFallbackLabel, value]);

  const selectedLabel =
    options.find((item) => item.value === value)?.label ??
    (value ? selectedFallbackLabel?.trim() || `شناسه ${value}` : '');

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch('');
      setDebouncedSearch('');
      onBlur?.();
    }
  };

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;
      const nearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < 72;
      if (nearBottom) loadMore();
    },
    [loadMore],
  );

  useEffect(() => {
    if (!open) return;
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { root, rootMargin: '64px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, open, options.length, hasNextPage]);

  useEffect(() => {
    if (!open || !hasNextPage || isFetchingNextPage) return;
    const list = listRef.current;
    if (!list) return;
    if (list.scrollHeight <= list.clientHeight + 1) loadMore();
  }, [open, hasNextPage, isFetchingNextPage, loadMore, options.length]);

  const showInitialLoading = isLoading && options.length === 0;

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={handleOpenChange} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'h-9 min-w-0 flex-1 justify-between px-2.5 font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{value ? selectedLabel : placeholder}</span>
            {isFetching && open ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,24rem)] p-0"
          align="start"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <div className="flex items-center border-b px-3">
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div
            ref={listRef}
            role="listbox"
            className="max-h-[min(280px,45vh)] overflow-y-auto overscroll-contain p-1"
            onScroll={handleScroll}
          >
            {showInitialLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال بارگذاری…
              </div>
            ) : null}

            {!showInitialLoading && options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">موردی یافت نشد</div>
            ) : null}

            {noneOption ? (
              <button
                type="button"
                role="option"
                aria-selected={value === noneOption.value}
                className="flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(noneOption.value);
                  handleOpenChange(false);
                }}
              >
                <Check
                  className={cn(
                    'ml-2 h-4 w-4 shrink-0',
                    value === noneOption.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {noneOption.label}
              </button>
            ) : null}

            {options.map((item) => (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={value === item.value}
                className="flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(item.value);
                  handleOpenChange(false);
                }}
              >
                <Check
                  className={cn(
                    'ml-2 h-4 w-4 shrink-0',
                    value === item.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="truncate text-right">{item.label}</span>
              </button>
            ))}

            <div ref={sentinelRef} className="h-2 w-full shrink-0" aria-hidden />

            {isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                بارگذاری بیشتر…
              </div>
            ) : null}

            {hasNextPage && !isFetchingNextPage ? (
              <button
                type="button"
                className="w-full py-2 text-center text-xs text-primary hover:underline"
                onClick={loadMore}
              >
                نمایش بیشتر
                {infiniteQuery.data?.pages[0]?.total
                  ? ` (${options.length} از ${infiniteQuery.data.pages[0].total})`
                  : ''}
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {clearable && value && noneOption ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={disabled}
          aria-label="پاک کردن"
          onClick={() => onChange(noneOption.value)}
        >
          <X className="h-4 w-4 opacity-60" />
        </Button>
      ) : null}
    </div>
  );
}
