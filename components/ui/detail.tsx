const Detail = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}) => (
  <div className='flex flex-col rounded-lg border px-3 py-3'>
    <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
      {label}
    </span>
    <span className='text-base font-medium text-foreground'>
      {value ?? '—'}
    </span>
  </div>
);

const DetailInline = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}) => (
  <div className='flex flex-col'>
    <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
      {label}
    </span>
    <span className='text-base font-medium text-foreground'>
      {value ?? '—'}
    </span>
  </div>
);

export { Detail, DetailInline };
