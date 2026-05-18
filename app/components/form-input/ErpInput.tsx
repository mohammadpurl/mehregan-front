import { forwardRef } from 'react';
// import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { ErpTextInputProps } from './text-input/text-input.types';



export const ErpInput = forwardRef<HTMLInputElement, ErpTextInputProps>(
  ({ label, error, description, rightAligned = true, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-right block">
            {label}
            {props.required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}

        <Input
          ref={ref}
          className={cn(
            rightAligned && 'text-right',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />

        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

ErpInput.displayName = 'ErpInput';