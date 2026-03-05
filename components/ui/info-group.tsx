import React, { ReactNode } from 'react';

export default function InfoGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className='rounded-lg border bg-card p-4'>
      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {title}
      </p>
      <div className='mt-3 grid gap-2'>{children}</div>
    </div>
  );
}
