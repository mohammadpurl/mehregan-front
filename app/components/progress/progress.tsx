import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';
import type { ProgressProps } from './progress.types';

const track = tv({
  base: 'relative w-full min-w-0 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/40',

  variants: {
    size: {
      tiny: 'h-1',
      small: 'h-2',
      normal: 'h-3',
      large: 'h-4',
    },
  },
  defaultVariants: { size: 'small' },
});

const fill = tv({
  base: 'relative h-full w-full overflow-hidden rounded-full shadow-sm will-change-[width] motion-safe:transition-[width] motion-safe:duration-100 motion-safe:ease-linear',

  variants: {
    variant: {
      neutral: 'bg-foreground',
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      accent: 'bg-accent',
      info: 'bg-info',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-destructive',
      ghost: 'bg-muted-foreground/80',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

export type ProgressVariant = VariantProps<typeof fill>['variant'];

function clampProgress(value: unknown, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(0, n));
}

export const Progress: React.FC<ProgressProps> = ({
  variant = 'neutral',
  size = 'small',
  className,
  value,
  max = 100,
}) => {
  const maxSafe = Math.max(1, max);
  const clamped = clampProgress(value, maxSafe);
  const pct = (clamped / maxSafe) * 100;

  return (
    <div
      className={cn(track({ size }), className)}
      dir="ltr"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={maxSafe}
      aria-valuenow={Math.round(clamped)}
    >
      <div className="h-full overflow-hidden rounded-full" style={{ width: `${pct}%` }}>
        <div className={fill({ variant: variant ?? 'neutral' })}>
          <span
            className="progress-gloss-layer pointer-events-none absolute inset-y-0 left-0 w-[220%] bg-linear-to-r from-transparent via-white/30 to-transparent"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
};
