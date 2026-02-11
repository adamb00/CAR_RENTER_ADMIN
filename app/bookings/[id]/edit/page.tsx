import Link from 'next/link';

export default async function BookingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Foglalás módosítása
        </h1>
        <p className='text-muted-foreground'>
          Itt lesznek a foglalás szerkeszthető részletei.
        </p>
      </div>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <p className='text-sm text-muted-foreground'>
          Foglalás azonosító: <span className='font-medium text-foreground'>{id}</span>
        </p>
      </div>
      <Link className='text-sm text-primary underline-offset-4 hover:underline' href={`/${id}`}>
        Vissza a foglalás részleteihez
      </Link>
    </div>
  );
}
