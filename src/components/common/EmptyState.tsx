import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      ) : null}
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
