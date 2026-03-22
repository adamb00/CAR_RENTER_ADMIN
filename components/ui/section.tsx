const Section = ({
  title,
  children,
  cols = 2,
}: {
  title: string;
  children: React.ReactNode;
  cols?: number;
}) => (
  <div className='rounded-xl border bg-card p-4 shadow-sm'>
    <h2 className='text-base font-semibold text-muted-foreground'>{title}</h2>
    <div className={`mt-3 grid gap-3 md:grid-cols-${cols}`}>{children}</div>
  </div>
);

export default Section;
