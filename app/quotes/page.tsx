import Link from 'next/link';

import { getQuotes } from '@/data-service/quotes';
import { cn } from '@/lib/utils';

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleString('hu-HU');
};

export default async function QuotesPage() {
  const quotes = await getQuotes();

  if (quotes.length === 0) {
    return (
      <div className='flex h-full flex-col gap-4 p-6'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Ajánlatkérések
          </h1>
          <p className='text-muted-foreground'>
            Itt jelennek meg az érkező megkeresések.
          </p>
        </div>
        <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground'>
          Még nincs beérkezett ajánlatkérés.
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Ajánlatkérések
        </h1>
      </div>

      <div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
        <table className='w-full table-fixed text-sm'>
          <thead className='bg-muted/60 text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 text-left font-semibold'>Név</th>
              <th className='px-4 py-3 text-left font-semibold'>Elérhetőség</th>
              <th className='px-4 py-3 text-left font-semibold'>Időszak</th>
              <th className='px-4 py-3 text-left font-semibold'>Járatok</th>
              <th className='px-4 py-3 text-left font-semibold'>Autó</th>
              <th className='px-4 py-3 text-left font-semibold'>Beérkezett</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr
                key={quote.id}
                className={cn('border-t transition-colors hover:bg-primary/10')}
              >
                <td className='px-4 py-3 align-top'>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className='block'
                    prefetch={false}
                  >
                    <div className='font-semibold text-foreground text-lg'>
                      {quote.name || '—'}
                    </div>
                  </Link>
                </td>
                <td className='px-4 py-3 align-top'>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className='block'
                    prefetch={false}
                  >
                    <div className='text-foreground'>{quote.email || '—'}</div>
                    <div className='text-muted-foreground'>
                      {quote.phone || '—'}
                    </div>
                  </Link>
                </td>
                <td className='px-4 py-3 align-top text-muted-foreground'>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className='block'
                    prefetch={false}
                  >
                    {quote.rentalStart || quote.rentalEnd
                      ? `${quote.rentalStart ?? '—'} → ${
                          quote.rentalEnd ?? '—'
                        }`
                      : '—'}
                  </Link>
                </td>
                <td className='px-4 py-3 align-top text-muted-foreground'>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className='block'
                    prefetch={false}
                  >
                    {quote.arrivalFlight || quote.departureFlight
                      ? `${quote.arrivalFlight || '—'} / ${
                          quote.departureFlight || '—'
                        }`
                      : '—'}
                  </Link>
                </td>
                <td className='px-4 py-3 align-top text-muted-foreground'>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className='block'
                    prefetch={false}
                  >
                    {quote.carName
                      ? quote.carName
                      : quote.carId
                        ? `#${quote.carId}`
                        : '—'}
                  </Link>
                </td>
                <td className='px-4 py-3 align-top text-muted-foreground'>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className='block'
                    prefetch={false}
                  >
                    {formatDate(quote.createdAt)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
