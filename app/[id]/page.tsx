import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type React from 'react';

import { getBookingById } from '@/data-service/bookings';
import { getQuoteById } from '@/data-service/quotes';
import { getStatusMeta } from '@/lib/status';
import { BookingRegistrationCheckbox } from './booking-registration-checkbox';
import { SendConfirmButton } from './send-confirm-button';

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

const formatDateShort = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const formatLocale = (locale: string | null | undefined) =>
  locale ? LOCALE_LABELS[locale] ?? locale : '—';

const formatDateTimeDetail = (value?: string | null) => {
  if (!value) return 'Ismeretlen időpont';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const capitalizeSlug = (value?: string | null) => {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
};

const formatPlaceType = (value?: string | null) => {
  if (!value) return '—';
  const map: Record<string, string> = {
    airport: 'Repülőtér',
    accommodation: 'Szállás',
  };
  return map[value] ?? capitalizeSlug(value);
};

const formatDocumentType = (value?: string | null) => {
  if (!value) return '—';
  const map: Record<string, string> = {
    passport: 'Útlevél',
    id_card: 'Személyi igazolvány',
  };
  return map[value] ?? capitalizeSlug(value);
};

const expiryBadge = (date?: string | null, label?: string) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const diffMs = parsed.getTime() - now.getTime();
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

  if (diffMs < 0) {
    return (
      <span className='ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-700'>
        <AlertTriangle className='h-3.5 w-3.5' />
        {label ? `${label} lejárt` : 'Lejárt'}
      </span>
    );
  }

  if (diffMs <= oneMonthMs) {
    return (
      <span className='ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2 py-0.5 text-[11px] font-semibold text-amber-700'>
        <AlertTriangle className='h-3.5 w-3.5' />
        {label ? `${label} hamarosan lejár` : 'Hamarosan lejár'}
      </span>
    );
  }

  return null;
};

const formatAddress = (address?: {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  streetType?: string;
  doorNumber?: string;
}) => {
  if (!address) return '—';
  const parts = [
    address.country,
    address.postalCode,
    address.city,
    address.street,
    address.streetType,
    address.doorNumber,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
};

const booleanLabel = (value: boolean | null | undefined) => {
  if (value == null) return '—';
  return value ? 'Igen' : 'Nem';
};

const formatChangeField = (value?: string) => {
  if (!value) return 'Ismeretlen mező';
  return value
    .split('.')
    .map((segment) => segment.replace(/\[\d+\]/g, '').trim())
    .filter(Boolean)
    .join(' › ');
};

const formatChangeValueDisplay = (value?: string) => {
  if (!value || value.trim().length === 0) return '—';
  return value;
};

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

const parseAmount = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(/[^\d,.\-]/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasPricingDetails = (pricing?: PricingBreakdown) =>
  Boolean(
    pricing &&
      (pricing.rentalFee ||
        pricing.insurance ||
        pricing.deposit ||
        pricing.deliveryFee ||
        pricing.extrasFee)
  );

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingById(id);
  const quote = await getQuoteById(booking?.quoteId || '');

  if (!booking) {
    notFound();
  }

  const delivery = booking.payload?.delivery;
  const invoice = booking.payload?.invoice;
  // const consents = booking.payload?.consents;
  const contactName = booking.payload?.contact?.name ?? booking.contactName;
  const contactEmail = booking.payload?.contact?.email ?? booking.contactEmail;
  const rentalStart =
    booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const rentalEnd = booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;
  const children = booking.payload?.children ?? [];
  const drivers = booking.payload?.driver ?? [];
  const extras = booking.payload?.extras ?? [];
  const quoteHumanId = quote?.humanId || quote?.id;
  const localeLabel = formatLocale(booking.payload?.locale ?? booking.locale);
  const hasInsuranceConsent = booking.payload?.consents?.insurance ?? null;
  const savedPricing: PricingBreakdown | undefined =
    booking.payload?.pricing ?? undefined;
  const quotePricing: PricingBreakdown | undefined =
    quote?.bookingRequestData ?? undefined;
  const hasQuotePricing = !savedPricing && Boolean(quotePricing);
  const pricingData: PricingBreakdown | undefined =
    savedPricing ?? quotePricing ?? undefined;
  const showPricingBreakdown = hasPricingDetails(pricingData);

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Foglalás</h1>
          <p className='text-muted-foreground'>
            A foglalás részletes adatai és az esetleges ajánlatkérés kapcsolata.
          </p>
        </div>
        <div className='flex w-full flex-col gap-3 sm:max-w-sm'>
          <SendConfirmButton
            bookingCode={booking.humanId ?? booking.id}
            bookingId={booking.id}
            localeLabel={localeLabel}
            carLabel={
              booking.carLabel ?? booking.carId ?? booking.payload?.carId
            }
            rentalStart={rentalStart}
            rentalEnd={rentalEnd}
            contact={{
              name: contactName,
              email: contactEmail,
              phone: booking.contactPhone,
              same: booking.payload?.contact?.same ?? null,
            }}
            invoice={invoice}
            tax={booking.payload?.tax}
            delivery={delivery}
            extras={extras}
            adults={booking.payload?.adults}
            childPassengers={children}
            hasInsuranceConsent={hasInsuranceConsent}
            hasQuote={hasQuotePricing}
            pricing={pricingData}
          />
          <BookingRegistrationCheckbox
            bookingId={booking.id}
            initialStatus={booking.status}
          />
        </div>
      </div>

      <div className='space-y-4'>
        <Section title='Foglalási adatok'>
          <Detail
            label='Foglalás azonosító'
            value={booking.humanId ?? booking.id}
          />
          <Detail label='Név' value={contactName} />
          <Detail label='Email' value={contactEmail} />
          <Detail label='Telefon' value={booking.contactPhone} />
          <Detail label='Nyelv' value={localeLabel} />
          <Detail
            label='Állapot'
            value={(() => {
              const meta = getStatusMeta(booking.status);
              return (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${meta.badge}`}
                >
                  {meta.label}
                </span>
              );
            })()}
          />
          <Detail
            label='Biztosítás'
            value={booleanLabel(booking.payload?.consents?.insurance)}
          />
          <Detail
            label='Autó'
            value={booking.carLabel ?? booking.carId ?? booking.payload?.carId}
          />
          <Detail
            label='Kapcsolt ajánlat'
            value={
              quoteHumanId ? (
                <Link
                  href={`/quotes/${booking.quoteId}`}
                  className='text-primary underline-offset-4 hover:underline'
                >
                  {quoteHumanId}
                </Link>
              ) : (
                '—'
              )
            }
          />
          <div className='grid gap-3 md:grid-cols-2'>
            <Detail label='Kezdés' value={formatDateShort(rentalStart)} />
            <Detail label='Vége' value={formatDateShort(rentalEnd)} />
          </div>
          <div className='grid gap-3 md:grid-cols-2'>
            <Detail
              label='Beérkezett'
              value={formatDateShort(booking.createdAt)}
            />
            <Detail
              label='Frissítve'
              value={formatDateShort(booking.updatedAt)}
            />
          </div>
        </Section>

        {showPricingBreakdown && (
          <Section title='Korábban ajánlott díjak'>
            <Detail
              label='Foglalási díj'
              value={formatPriceValue(pricingData?.rentalFee)}
            />
            <Detail
              label='Biztosítás díja'
              value={formatPriceValue(pricingData?.insurance)}
            />
            {!pricingData?.insurance && (
              <Detail
                label='Kaució'
                value={formatPriceValue(pricingData?.deposit)}
              />
            )}
            <Detail
              label='Kiszállás díja'
              value={formatPriceValue(pricingData?.deliveryFee)}
            />
            <Detail
              label='Extrák díja'
              value={formatPriceValue(pricingData?.extrasFee)}
            />
          </Section>
        )}

        <Section title='Utasok'>
          <Detail label='Felnőttek' value={booking.payload?.adults} />
          <div className='flex flex-col gap-2 rounded-lg border px-3 py-3'>
            <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Gyerekek
            </span>
            {children.length > 0 ? (
              <ul className='space-y-1 text-base font-medium text-foreground'>
                {children.map((child, index) => (
                  <li key={index} className='flex items-center gap-3'>
                    <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground'>
                      {index + 1}
                    </span>
                    <span className='text-sm text-foreground'>
                      {child.age != null ? `${child.age} év` : 'Életkor: —'}
                      {child.height != null ? ` • ${child.height} cm` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className='text-base font-medium text-foreground'>—</span>
            )}
          </div>
        </Section>

        <Section title='Sofőrök'>
          {drivers.length === 0 && (
            <span className='text-base font-medium text-foreground'>—</span>
          )}
          {drivers.map((driver, idx) => {
            const fullName = [driver.firstName_1, driver.lastName_1]
              .filter(Boolean)
              .join(' ');
            return (
              <div
                key={idx}
                className='space-y-4 rounded-lg border px-4 py-4 shadow-sm md:col-span-2'
              >
                <div className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
                  <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                    {idx + 1}
                  </span>
                  Sofőr kártya
                </div>

                <div className='grid gap-4 lg:grid-cols-2'>
                  <div className='space-y-2 rounded-md bg-muted/40 p-3'>
                    <div className='text-xs font-semibold uppercase text-muted-foreground'>
                      Alapadatok
                    </div>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      <DetailInline label='Név' value={fullName || '—'} />
                      <DetailInline
                        label='2. keresztnév'
                        value={driver.firstName_2 ?? '—'}
                      />
                      <DetailInline
                        label='2. vezetéknév'
                        value={driver.lastName_2 ?? '—'}
                      />
                      <DetailInline
                        label='Telefon'
                        value={
                          driver.phoneNumber ?? booking.contactPhone ?? '—'
                        }
                      />
                      <DetailInline
                        label='Email'
                        value={driver.email ?? contactEmail ?? '—'}
                      />
                    </div>
                  </div>

                  <div className='space-y-2 rounded-md bg-muted/40 p-3'>
                    <div className='text-xs font-semibold uppercase text-muted-foreground mb-2'>
                      Születési adatok
                    </div>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      <DetailInline
                        label='Születési idő'
                        value={
                          driver.dateOfBirth
                            ? formatDateShort(driver.dateOfBirth)
                            : '—'
                        }
                      />
                      <DetailInline
                        label='Születési hely'
                        value={driver.placeOfBirth ?? '—'}
                      />
                    </div>
                  </div>
                </div>

                <div className='rounded-md bg-muted/30 p-3'>
                  <div className='text-xs font-semibold uppercase text-muted-foreground'>
                    Lakcím
                  </div>
                  <DetailInline
                    label=''
                    value={
                      driver.location ? formatAddress(driver.location) : '—'
                    }
                  />
                </div>

                <div className='grid gap-4 lg:grid-cols-2'>
                  <div className='space-y-2 rounded-md bg-muted/40 p-3'>
                    <div className='text-xs font-semibold uppercase text-muted-foreground'>
                      Személyi okmány
                    </div>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      <DetailInline
                        label='Típus'
                        value={formatDocumentType(driver.document?.type)}
                      />
                      <DetailInline
                        label='Szám'
                        value={driver.document?.number ?? '—'}
                      />
                      <DetailInline
                        label='Érvényesség kezdete'
                        value={
                          driver.document?.validFrom
                            ? formatDateShort(driver.document.validFrom)
                            : '—'
                        }
                      />
                      <DetailInline
                        label='Érvényesség vége'
                        value={
                          driver.document?.validUntil ? (
                            <span className='gap-1 flex items-start xl:items-center flex-col xl:flex-row'>
                              {formatDateShort(driver.document.validUntil)}
                              {expiryBadge(
                                driver.document.validUntil,
                                'Okmány'
                              )}
                            </span>
                          ) : (
                            '—'
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className='space-y-2 rounded-md bg-muted/40 p-3'>
                    <div className='text-xs font-semibold uppercase text-muted-foreground'>
                      Jogosítvány
                    </div>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      <DetailInline
                        label='Jogosítvány szám'
                        value={driver.document?.drivingLicenceNumber ?? '—'}
                      />
                      <DetailInline
                        label='Kategória'
                        value={driver.document?.drivingLicenceCategory ?? '—'}
                      />
                      <DetailInline
                        label='Érvényesség kezdete'
                        value={
                          driver.document?.drivingLicenceValidFrom
                            ? formatDateShort(
                                driver.document.drivingLicenceValidFrom
                              )
                            : '—'
                        }
                      />
                      <DetailInline
                        label='Érvényesség vége'
                        value={
                          driver.document?.drivingLicenceValidUntil ? (
                            <span className='gap-1 flex items-start xl:items-center flex-col xl:flex-row'>
                              {formatDateShort(
                                driver.document.drivingLicenceValidUntil
                              )}
                              {expiryBadge(
                                driver.document.drivingLicenceValidUntil,
                                'Jogosítvány'
                              )}
                            </span>
                          ) : (
                            '—'
                          )
                        }
                      />
                      <DetailInline
                        label='3 évnél régebbi?'
                        value={booleanLabel(
                          driver.document?.drivingLicenceIsOlderThan_3
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Section>

        <Section title='Kapcsolat / Számlázás'>
          <Detail
            label='Kapcsolattartó'
            value={booking.payload?.contact?.name ?? booking.contactName}
          />
          <Detail
            label='Kapcsolattartó azonos?'
            value={booleanLabel(booking.payload?.contact?.same)}
          />
          <Detail label='Számlázási név' value={invoice?.name} />
          <Detail label='Számlázási telefon' value={invoice?.phoneNumber} />
          <Detail label='Számlázási email' value={invoice?.email} />
          <Detail
            label='Számlázási cím'
            value={formatAddress(invoice?.location)}
          />
          <Detail
            label='Számlázás egyezik?'
            value={booleanLabel(invoice?.same)}
          />
        </Section>

        <Section title='Kiszállítás / Átvétel'>
          <Detail
            label='Helytípus'
            value={formatPlaceType(delivery?.placeType)}
          />
          <Detail label='Helyszín' value={delivery?.locationName} />
          <Detail label='Érkező járat' value={delivery?.arrivalFlight} />
          <Detail label='Távozó járat' value={delivery?.departureFlight} />
          <Detail label='Cím' value={formatAddress(delivery?.address)} />
        </Section>

        <Section title='Egyéb'>
          <div className='flex flex-col gap-2 rounded-lg border px-3 py-3'>
            <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Extrák
            </span>
            {extras.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {extras.map((item, idx) => (
                  <span
                    key={idx}
                    className='rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground'
                  >
                    {capitalizeSlug(item)}
                  </span>
                ))}
              </div>
            ) : (
              <span className='text-base font-medium text-foreground'>—</span>
            )}
          </div>
        </Section>
        {booking.selfServiceEvents?.length ? (
          <Section title='Önkiszolgáló módosítások'>
            {booking.selfServiceEvents.map((event, eventIndex) => (
              <div
                key={`${event.timestamp ?? 'event'}-${eventIndex}`}
                className='md:col-span-2 space-y-3 rounded-lg border px-3 py-3'
              >
                <div className='flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  <span>Módosítás {eventIndex + 1}</span>
                  <span>{formatDateTimeDetail(event.timestamp)}</span>
                </div>
                <div className='space-y-3'>
                  {event.changes.map((change, changeIndex) => (
                    <div
                      key={`${change.field}-${changeIndex}`}
                      className='rounded-md bg-muted/40 p-3'
                    >
                      <div className='text-sm font-semibold text-foreground'>
                        {formatChangeField(change.field)}
                      </div>
                      <div className='mt-1 text-xs text-muted-foreground'>
                        <span className='font-semibold text-foreground'>
                          {formatChangeValueDisplay(change.previous)}
                        </span>{' '}
                        →{' '}
                        <span className='font-semibold text-foreground'>
                          {formatChangeValueDisplay(change.next)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Section>
        ) : null}
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
    <div className='mt-3 grid gap-3 md:grid-cols-2'>{children}</div>
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
