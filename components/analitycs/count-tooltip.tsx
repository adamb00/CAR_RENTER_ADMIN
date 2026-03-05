import { numberFormatter } from '@/lib/format/format-number';
import React from 'react';

export default function CountTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className='rounded-md border bg-background px-3 py-2 text-xs shadow-sm'>
      {payload.map((item) => (
        <p key={item.name}>
          {item.name}: {numberFormatter.format(item.value ?? 0)} db
        </p>
      ))}
    </div>
  );
}
