type PhaseBadgeProps = {
  phase: string;
};

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
      {phase}
    </span>
  );
}
