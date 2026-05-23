import { db } from '@/lib/db';
import { RegisterNewRentForm } from '@/components/register-new-rent/register-new-rent-form';

type SearchParams = Record<string, string | string[] | undefined>;

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function RegisterNewRentPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const accommodationId = firstParam(resolvedSearchParams?.accommodationId);

  if (!accommodationId) {
    return (
      <main className='mx-auto max-w-3xl p-4 sm:p-6'>
        <div className='rounded-lg border border-red-300 bg-red-50 p-4 text-red-700'>
          Invalid QR code. Missing accommodation identifier.
        </div>
      </main>
    );
  }

  const accommodation = await db.accommodation.findUnique({
    where: { id: accommodationId },
    select: {
      id: true,
      name: true,
      address: true,
      island: true,
    },
  });
  const cars = await db.car.findMany({
    select: {
      id: true,
      manufacturer: true,
      model: true,
    },
    orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }],
  });

  if (!accommodation) {
    return (
      <main className='mx-auto max-w-3xl p-4 sm:p-6'>
        <div className='rounded-lg border border-red-300 bg-red-50 p-4 text-red-700'>
          Accommodation not found for this QR code.
        </div>
      </main>
    );
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8'>
      <header className='space-y-3'>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
          Register New Rental at {accommodation.name}
        </h1>
        <p className='max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base'>
          Fill in the details below to submit a new rental request.
        </p>
      </header>

      <section className='rounded-xl border bg-card p-4 shadow-sm sm:p-6'>
        <RegisterNewRentForm accommodation={accommodation} cars={cars} />
      </section>
    </main>
  );
}
