import type * as React from 'react';
import { ADMIN_SIGNATURE, BRAND } from '@/lib/constants';

export type BookingConfirmationEmailInput = {
  bookingCode: string;
  name?: string | null;
  locale?: string | null;
  carLabel?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalFee?: string | null;
  insuranceFee?: string | null;
  deposit?: string | null;
  extrasFee?: string | null;
};

export type BookingConfirmationCopy = {
  subject: string;
  greeting: (name?: string | null) => string;
  intro: string;
  paymentNote: string;
  outro: string;
  pricingHeading: string;
  rentalFeeLabel: string;
  insuranceLabel: string;
  depositLabel: string;
  extrasLabel: string;
  bookingLabel: string;
  periodLabel: string;
  carLabel: string;
  successMessage: string;
};

export const BOOKING_CONFIRMATION_COPY: Record<
  string,
  BookingConfirmationCopy
> = {
  hu: {
    subject: 'Foglalás megerősítése - Zodiac Rent a Car',
    greeting: (name) => `Szia${name ? ` ${name}` : ''}!`,
    intro:
      'Az alábbiakban összegyűjtöttük az eddig ismert díjakat a foglalásodhoz.',
    paymentNote: 'A fizetés készpénzzel vagy bankkártyával is lehetséges.',
    outro:
      'Ha bármilyen kérdésed van, kérlek vedd fel velünk a kapcsolatot, hogy segítsünk a részletekben.',
    pricingHeading: 'Díjak összesítése',
    rentalFeeLabel: 'Foglalási díj',
    insuranceLabel: 'Biztosítás',
    depositLabel: 'Kaució',
    extrasLabel: 'Extrák díja',
    bookingLabel: 'Foglalás azonosító',
    periodLabel: 'Időszak',
    carLabel: 'Autó',
    successMessage: 'Számla-információs e-mail elküldve.',
  },
  en: {
    subject: 'Booking confirmation - Zodiac Rent a Car',
    greeting: (name) => `Hi${name ? ` ${name}` : ''},`,
    intro: 'Here is a summary of the fees we currently have on file.',
    paymentNote: 'Payment can be made in cash or by bank card.',
    outro:
      'If you have any questions, feel free to reply so we can assist you further.',
    pricingHeading: 'Fee summary',
    rentalFeeLabel: 'Rental fee',
    insuranceLabel: 'Insurance',
    depositLabel: 'Deposit',
    extrasLabel: 'Extras fee',
    bookingLabel: 'Booking ID',
    periodLabel: 'Rental period',
    carLabel: 'Car',
    successMessage: 'Confirmation email sent.',
  },
};

export const normalizeConfirmationLocale = (locale?: string | null) => {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase();
  return BOOKING_CONFIRMATION_COPY[normalized] ? normalized : 'en';
};

const sanitizeName = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const formatDate = (value?: string | null, locale?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale ?? 'hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatPeriod = (
  start?: string | null,
  end?: string | null,
  locale?: string | null
) => {
  if (!start && !end) return null;
  const formattedStart = formatDate(start, locale);
  const formattedEnd = formatDate(end, locale);
  if (formattedStart && formattedEnd) return `${formattedStart} → ${formattedEnd}`;
  return formattedStart ?? formattedEnd;
};

const formatPrice = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return `${trimmed} €`;
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => (
  <tr>
    <td
      style={{
        padding: '6px 0',
        fontSize: '13px',
        color: BRAND.navy,
        fontWeight: 600,
        width: '40%',
      }}
    >
      {label}
    </td>
    <td
      style={{
        padding: '6px 0',
        fontSize: '13px',
        color: BRAND.navyLight,
      }}
    >
      {value ?? '—'}
    </td>
  </tr>
);

type BookingConfirmationEmailProps = {
  copy: BookingConfirmationCopy;
  input: BookingConfirmationEmailInput;
};

export const buildBookingConfirmationText = (
  copy: BookingConfirmationCopy,
  input: BookingConfirmationEmailInput
) => {
  const rentalFee = formatPrice(input.rentalFee);
  const insuranceFee = formatPrice(input.insuranceFee);
  const deposit = formatPrice(input.deposit);
  const extrasFee = formatPrice(input.extrasFee);
  const period = formatPeriod(input.rentalStart, input.rentalEnd, input.locale);
  const car = input.carLabel ?? '—';

  return [
    copy.greeting(sanitizeName(input.name)),
    '',
    copy.intro,
    copy.paymentNote,
    '',
    `${copy.bookingLabel}: ${input.bookingCode}`,
    `${copy.carLabel}: ${car}`,
    `${copy.periodLabel}: ${period ?? '—'}`,
    `${copy.rentalFeeLabel}: ${rentalFee ?? '—'}`,
    `${copy.insuranceLabel}: ${insuranceFee ?? '—'}`,
    `${copy.depositLabel}: ${deposit ?? '—'}`,
    `${copy.extrasLabel}: ${extrasFee ?? '—'}`,
    '',
    copy.outro,
    '',
    ADMIN_SIGNATURE.company,
    ADMIN_SIGNATURE.phone,
    ADMIN_SIGNATURE.email,
  ].join('\n');
};

export default function BookingConfirmationEmail({
  copy,
  input,
}: BookingConfirmationEmailProps) {
  const rentalFee = formatPrice(input.rentalFee);
  const insuranceFee = formatPrice(input.insuranceFee);
  const deposit = formatPrice(input.deposit);
  const extrasFee = formatPrice(input.extrasFee);
  const period = formatPeriod(input.rentalStart, input.rentalEnd, input.locale);
  const name = sanitizeName(input.name);

  return (
    <html lang={input.locale ?? 'hu'}>
      <body
        style={{
          fontFamily: 'Inter, Arial, sans-serif',
          backgroundColor: BRAND.background,
          margin: 0,
          padding: 0,
        }}
      >
        <table
          width='100%'
          cellPadding='0'
          cellSpacing='0'
          role='presentation'
          style={{ padding: '24px 0' }}
        >
          <tbody>
            <tr>
              <td>
                <table
                  width='600'
                  cellPadding='0'
                  cellSpacing='0'
                  role='presentation'
                  style={{
                    margin: '0 auto',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: '0 12px 35px rgba(2,48,71,0.08)',
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', paddingBottom: '20px' }}>
                        <h1
                          style={{
                            margin: 0,
                            fontSize: '22px',
                            color: BRAND.navy,
                          }}
                        >
                          {copy.subject}
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '14px', color: BRAND.navyLight }}>
                        <p style={{ marginTop: 0 }}>
                          {copy.greeting(name)}<br />
                          {copy.intro}
                        </p>
                        <p
                          style={{
                            marginTop: 0,
                            fontWeight: 600,
                            color: BRAND.navy,
                          }}
                        >
                          {copy.paymentNote}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: '16px',
                          backgroundColor: 'rgba(2,48,71,0.03)',
                          borderRadius: '10px',
                        }}
                      >
                        <p
                          style={{
                            marginTop: 0,
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            color: BRAND.navy,
                            textTransform: 'uppercase',
                          }}
                        >
                          {copy.pricingHeading}
                        </p>
                        <table width='100%' role='presentation'>
                          <tbody>
                            <InfoRow
                              label={copy.bookingLabel}
                              value={input.bookingCode}
                            />
                            <InfoRow
                              label={copy.carLabel}
                              value={input.carLabel ?? '—'}
                            />
                            <InfoRow
                              label={copy.periodLabel}
                              value={period ?? '—'}
                            />
                            <InfoRow
                              label={copy.rentalFeeLabel}
                              value={rentalFee}
                            />
                            <InfoRow
                              label={copy.insuranceLabel}
                              value={insuranceFee}
                            />
                            <InfoRow
                              label={copy.depositLabel}
                              value={deposit}
                            />
                            <InfoRow
                              label={copy.extrasLabel}
                              value={extrasFee}
                            />
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '13px', color: BRAND.navyLight }}>
                        <p>{copy.outro}</p>
                        <p style={{ marginBottom: 0 }}>
                          {ADMIN_SIGNATURE.company}
                          <br />
                          {ADMIN_SIGNATURE.phone}
                          <br />
                          {ADMIN_SIGNATURE.email}
                          <br />
                          {ADMIN_SIGNATURE.website}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
