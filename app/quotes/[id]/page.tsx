import Link from 'next/link';
import { notFound } from 'next/navigation';
import type React from 'react';

import { getBookingByQuoteId } from '@/data-service/bookings';
import { getQuoteById } from '@/data-service/quotes';
import { db } from '@/lib/db';
import { getStatusMeta } from '@/lib/status';
import { BookingRequestButton } from './booking-request-button';
import { LOCALE_LABELS } from '@/lib/constants';

type PricingBreakdown = {
  rentalFee?: string | null;
  insurance?: string | null;
  deposit?: string | null;
  deliveryFee?: string | null;
  extrasFee?: string | null;
};

const formatPriceValue = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? `${trimmed} €` : '—';
};

const hasPricingDetails = (pricing?: PricingBreakdown) =>
  Boolean(
    pricing &&
    (pricing.rentalFee ||
      pricing.insurance ||
      pricing.deposit ||
      pricing.deliveryFee ||
      pricing.extrasFee),
  );

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

  const linkedBooking = await getBookingByQuoteId(id);

  const carForPricing = quote.carId
    ? await db.car.findUnique({
        where: { id: quote.carId },
        select: { monthlyPrices: true },
      })
    : null;
  const monthlyPrice =
    carForPricing?.monthlyPrices?.[new Date().getMonth()] ?? null;
  const allCars = await db.car.findMany({
    select: { id: true, manufacturer: true, model: true, monthlyPrices: true },
  });

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleString('hu-HU');
  };

  const formatLocale = (locale: string | null | undefined) =>
    locale ? (LOCALE_LABELS[locale] ?? locale) : '—';

  const formatPlaceType = (value?: string | null) => {
    if (!value) return '—';
    const map: Record<string, string> = {
      airport: 'Átvétel a reptéren',
      accommodation: 'Átvétel a szállodánál',
      office: 'Átvétel az irodánál',
    };
    return map[value] ?? value;
  };

  const pricing = quote.bookingRequestData;
  const pricingList = Array.isArray(pricing)
    ? pricing
    : pricing
      ? [pricing]
      : [];
  const showPricingBreakdown = pricingList.some((entry) =>
    hasPricingDetails(entry),
  );

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Ajánlatkérés
          </h1>
          <p className='text-muted-foreground'>
            Beérkezett megkeresés részletei.
          </p>
        </div>

        <BookingRequestButton
          quoteId={quote.id}
          email={quote.email}
          phone={quote.phone}
          preferredChannel={quote.preferredChannel}
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
            <Detail
              label='Ajánlat azonosító'
              value={quote.humanId ?? quote.id}
            />
            <Detail label='Név' value={quote.name} />
            <Detail label='Email' value={quote.email} />
            <Detail label='Telefon' value={quote.phone} />
            <Detail label='Preferált csatorna' value={quote.preferredChannel} />
            <Detail label='Nyelv' value={formatLocale(quote.locale)} />
          </Section>

          <Section title='Érkezés / Távozás / Járat / Napok száma'>
            <Detail label='Kezdés' value={quote.rentalStart} />
            <Detail label='Vége' value={quote.rentalEnd} />
            <Detail label='Érkező járat' value={quote.arrivalFlight} />
            <Detail label='Távozó járat' value={quote.departureFlight} />
            <Detail label='Napok száma' value={quote.rentalDays ?? undefined} />
          </Section>

          <Section title='Létszám'>
            <Detail label='Utazók száma' value={quote.partySize} />
            <Detail label='Gyerekek' value={quote.children} />
          </Section>

          <Section title='Extrák'>
            <Detail
              label='Kért extrák'
              value={
                quote.extras && quote.extras.length > 0
                  ? quote.extras.join(', ')
                  : '—'
              }
            />
          </Section>

          {showPricingBreakdown && (
            <Section title='Korábban ajánlott díjak'>
              <div className='space-y-4'>
                {pricingList.map((offer, index) => (
                  <div key={`offer-${index}`} className='space-y-2'>
                    <div className='text-sm font-semibold'>
                      Ajánlat {index + 1}
                      {offer?.carName ? ` – ${offer.carName}` : ''}
                    </div>
                    <Detail
                      label='Foglalási díj'
                      value={formatPriceValue(offer?.rentalFee)}
                    />
                    <Detail
                      label='Biztosítás díja'
                      value={formatPriceValue(offer?.insurance)}
                    />
                    <Detail
                      label='Kaució'
                      value={formatPriceValue(offer?.deposit)}
                    />
                    <Detail
                      label='Átvétel díja'
                      value={formatPriceValue(offer?.deliveryFee)}
                    />
                    <Detail
                      label='Extrák díja'
                      value={formatPriceValue(offer?.extrasFee)}
                    />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title='Átvétel'>
            <Detail
              label='Átvétel helye'
              value={formatPlaceType(quote.delivery?.placeType)}
            />
            <Detail
              label='Helyszín neve'
              value={quote.delivery?.locationName}
            />
            <Detail
              label='Cím'
              value={
                quote.delivery?.address
                  ? [
                      quote.delivery.address.country,
                      quote.delivery.address.postalCode,
                      quote.delivery.address.city,
                      quote.delivery.address.street,
                      quote.delivery.address.streetType,
                      quote.delivery.address.doorNumber,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : '—'
              }
            />
          </Section>
        </div>

        <div className='space-y-4'>
          <Section title='Autó'>
            <Detail
              label='Kapcsolt autó'
              value={quote.carName || quote.carId}
            />
            <Detail
              label='Állapot'
              value={(() => {
                const meta = getStatusMeta(quote.status);
                return (
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                );
              })()}
            />
          </Section>

          <Section title='Kapcsolatok'>
            <Detail
              label='Kapcsolt foglalás'
              value={
                linkedBooking ? (
                  <Link
                    href={`/${linkedBooking.id}`}
                    className='text-primary underline-offset-4 hover:underline'
                  >
                    {linkedBooking.carLabel
                      ? `${linkedBooking.carLabel} (foglalás)`
                      : `Foglalás #${linkedBooking.id}`}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
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
  value: React.ReactNode | string | number | null | undefined;
}) => (
  <div className='flex flex-col rounded-lg border px-3 py-3'>
    <span className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
      {label}
    </span>
    <span className='text-base font-medium text-foreground'>
      {value || '—'}
    </span>
  </div>
);
