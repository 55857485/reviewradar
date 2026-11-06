import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

const variants: Record<AlertVariant, string> = {
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  info: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export function Alert({ className, variant = 'info', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn('rounded-lg border px-4 py-3 text-sm', variants[variant], className)}
      {...props}
    />
  );
}
