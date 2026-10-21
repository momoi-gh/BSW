import { LoaderCircle } from 'lucide-react';

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = '正在加载…' }: LoadingScreenProps) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500"
      role="status"
      aria-live="polite"
    >
      <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
        B
      </span>
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
