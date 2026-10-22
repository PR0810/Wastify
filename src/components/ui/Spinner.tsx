import { type ReactNode } from 'react';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
};

export function Spinner({ size = 'md', label }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600`} />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner size="lg" label={label} />
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon?: ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {message && <p className="mt-1 text-xs text-slate-400">{message}</p>}
    </div>
  );
}
