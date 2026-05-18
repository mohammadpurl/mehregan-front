import { Column } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    filterComponent?: (props: {
      column: Column<TData, TValue>;
      value: any;
      onFilterChange: (value: any) => void;
    }) => React.ReactNode;
    /** برچسب کوتاه برای کارت موبایل */
    mobileLabel?: string;
  }
}