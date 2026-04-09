import { getQuotes } from '@/data-service/quotes';
import { db } from '@/lib/db';
import { SendQuoteButton } from './send-quote-button';
import QuotesTable from './quotes-table';
import { getAllUser } from '@/data-service/user';

export default async function QuotesPage() {
  const users = await getAllUser();
  const [quotes, cars] = await Promise.all([
    getQuotes(),
    db.car.findMany({
      select: {
        id: true,
        manufacturer: true,
        model: true,
        monthlyPrices: true,
        images: true,
      },
      orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }],
    }),
  ]);

  const quoteOptions = quotes.map((quote) => ({
    id: quote.id,
    humanId: quote.humanId ?? null,
    name: quote.name,
    email: quote.email ?? null,
    phone: quote.phone ?? null,
    preferredChannel: quote.preferredChannel ?? 'email',
    locale: quote.locale ?? null,
    rentalStart: quote.rentalStart ?? null,
    rentalEnd: quote.rentalEnd ?? null,
    carId: quote.carId ?? null,
    cars: quote.cars ?? null,
  }));

  const carOptions = cars.map((car) => ({
    id: car.id,
    label: `${car.manufacturer} ${car.model}`.trim(),
    monthlyPrices: car.monthlyPrices ?? [],
    images: car.images ?? [],
  }));

  if (quotes.length === 0) {
    return (
      <div className='flex h-full flex-col gap-4 p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Ajánlatkérések
            </h1>
            <p className='text-muted-foreground'>
              Itt jelennek meg az érkező megkeresések.
            </p>
          </div>
          <SendQuoteButton
            quotes={quoteOptions}
            carOptions={carOptions}
            users={users}
          />
        </div>
        <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground'>
          Még nincs beérkezett ajánlatkérés.
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Ajánlatkérések
          </h1>
          <p className='text-muted-foreground'>
            Ajánlat küldése e-mailen vagy WhatsAppon.
          </p>
        </div>
        <SendQuoteButton
          quotes={quoteOptions}
          carOptions={carOptions}
          users={users}
        />
      </div>

      <QuotesTable data={quotes} />
    </div>
  );
}
