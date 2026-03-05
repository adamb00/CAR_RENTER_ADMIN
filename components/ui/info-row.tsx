import { ReactNode } from 'react';

export default function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className='flex flex-col rounded-md border px-3 py-2'>
      <span className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </span>
      <span className='text-sm font-medium text-foreground wrap-break-word'>
        {value ?? '—'}
      </span>
    </div>
  );
}
