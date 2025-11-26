import { notFound } from 'next/navigation';

import { getQuoteById } from '@/data-service/quotes';
import { db } from '@/lib/db';
import { BookingRequestButton } from './booking-request-button';

const LOCALE_LABELS: Record<string, string> = {
  hu: 'Magyar',
  en: 'Angol',
  de: 'Német',
  ro: 'Román',
  fr: 'Francia',
  es: 'Spanyol',
  it: 'Olasz',
  sk: 'Szlovák',
  cz: 'Cseh',
  se: 'Svéd',
  no: 'Norvég',
  dk: 'Dán',
  pl: 'Lengyel',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Új',
  contacted: 'Kapcsolatfelvétel folyamatban',
  in_progress: 'Folyamatban',
  pending: 'Folyamatban',
  closed: 'Lezárva',
  answered: 'Ajánlatkérés feldolgozva',
  done: 'Ajánlatkérés feldolgozva',
  resolved: 'Ajánlatkérés feldolgozva',
  canceled: 'Lemondva',
  cancelled: 'Lemondva',
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteById(id);

  if (!quote) {
    notFound();
  }

  const carForPricing = quote.carId
    ? await db.car.findUnique({
        where: { id: quote.carId },
        select: { monthlyPrices: true },
      })
    : null;
  const monthlyPrice = carForPricing?.monthlyPrices?.[new Date().getMonth()] ?? null;
  const allCars = await db.car.findMany({
    select: { id: true, manufacturer: true, model: true, monthlyPrices: true },
  });

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleString('hu-HU');
  };

  const formatLocale = (locale: string | null | undefined) =>
    locale ? LOCALE_LABELS[locale] ?? locale : '—';

  const formatStatus = (status: string | null | undefined) =>
    status ? STATUS_LABELS[status] ?? status : '—';

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Ajánlatkérés</h1>
          <p className='text-muted-foreground'>
            Beérkezett megkeresés részletei.
          </p>
        </div>

        <BookingRequestButton
          quoteId={quote.id}
          email={quote.email}
          name={quote.name}
          locale={quote.locale}
          carId={quote.carId}
          carName={quote.carName}
          rentalStart={quote.rentalStart}
          rentalEnd={quote.rentalEnd}
          monthlyPrice={monthlyPrice}
          carOptions={allCars.map((car) => ({
            id: car.id,
            label: `${car.manufacturer} ${car.model}`,
            monthlyPrices: car.monthlyPrices,
          }))}
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-[2fr,1fr]'>
        <div className='space-y-4'>
          <Section title='Kapcsolat'>
            <Detail label='Név' value={quote.name} />
            <Detail label='Email' value={quote.email} />
            <Detail label='Telefon' value={quote.phone} />
            <Detail label='Preferált csatorna' value={quote.preferredChannel} />
            <Detail label='Nyelv' value={formatLocale(quote.locale)} />
          </Section>

          <Section title='Érkezés / Távozás / Járat'>
            <Detail label='Kezdés' value={quote.rentalStart} />
            <Detail label='Vége' value={quote.rentalEnd} />
            <Detail label='Érkező járat' value={quote.arrivalFlight} />
            <Detail label='Távozó járat' value={quote.departureFlight} />
          </Section>

          <Section title='Létszám'>
            <Detail label='Utazók száma' value={quote.partySize} />
            <Detail label='Gyerekek' value={quote.children} />
          </Section>
        </div>

        <div className='space-y-4'>
          <Section title='Autó'>
            <Detail label='Kapcsolt autó' value={quote.carName || quote.carId} />
            <Detail label='Állapot' value={formatStatus(quote.status)} />
          </Section>

          <Section title='Meta'>
            <Detail label='Beérkezett' value={formatDate(quote.createdAt)} />
            <Detail label='Frissítve' value={formatDate(quote.updatedAt)} />
          </Section>
        </div>
      </div>
    </div>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className='rounded-xl border bg-card p-4 shadow-sm'>
    <h2 className='text-base font-semibold text-muted-foreground'>{title}</h2>
    <div className='mt-3 grid gap-3'>{children}</div>
  </div>
);

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div className='flex flex-col rounded-lg border px-3 py-3'>
    <span className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
      {label}
    </span>
    <span className='text-base font-medium text-foreground'>{value || '—'}</span>
  </div>
);
