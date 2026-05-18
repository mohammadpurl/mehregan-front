import type { ComponentBase } from '@/types/component-base.type';

export type ProgressProps = Omit<ComponentBase, 'isDisabled'> & {
  value: number;
  /** پیش‌فرض ۱۰۰ — برای `<progress max>` */
  max?: number;
};
