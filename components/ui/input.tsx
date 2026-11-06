import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-500 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
