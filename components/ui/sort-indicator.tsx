export const SortIndicator = ({
  direction,
}: {
  direction: false | 'asc' | 'desc';
}) => (
  <span className='text-xs text-muted-foreground'>
    {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : ''}
  </span>
);
