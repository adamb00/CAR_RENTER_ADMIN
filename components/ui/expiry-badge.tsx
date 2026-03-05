import { AlertTriangle } from 'lucide-react';

export const expiryBadge = (date?: string | null, label?: string) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const diffMs = parsed.getTime() - now.getTime();
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

  if (diffMs < 0) {
    return (
      <span className='ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-700'>
        <AlertTriangle className='h-3.5 w-3.5' />
        {label ? `${label} lejárt` : 'Lejárt'}
      </span>
    );
  }

  if (diffMs <= oneMonthMs) {
    return (
      <span className='ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2 py-0.5 text-[11px] font-semibold text-amber-700'>
        <AlertTriangle className='h-3.5 w-3.5' />
        {label ? `${label} hamarosan lejár` : 'Hamarosan lejár'}
      </span>
    );
  }

  return null;
};
