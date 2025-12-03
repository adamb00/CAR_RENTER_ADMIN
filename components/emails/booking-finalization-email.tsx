/* eslint-disable @next/next/no-img-element */
import * as React from 'react';

import { ADMIN_SIGNATURE, BRAND } from '@/lib/constants';
import type { BookingFinalizationCopy } from './utils/finalization-copy';

export type BookingFinalizationEmailInput = {
  bookingCode: string;
  bookingId: string;
  carLabel?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalFee?: string | null;
  deposit?: string | null;
  insurance?: string | null;
  deliveryFee?: string | null;
  extrasFee?: string | null;
  totalFee?: string | null;
  extrasList?: string[];
  locale?: string | null;
  adults?: number | null;
  children?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  invoice?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  delivery?: {
    placeType?: string | null;
    locationName?: string | null;
    address?: string | null;
    arrivalFlight?: string | null;
    departureFlight?: string | null;
  };
  signerName: string;
  thankYouUrl: string;
  contactUrl: string;
};

type BookingFinalizationEmailProps = {
  input: BookingFinalizationEmailInput;
  copy: BookingFinalizationCopy;
  logoSrc?: string | null;
};

const formatPrice = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? `${trimmed} €` : '—';
};

const formatDate = (value?: string | null, locale?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale ?? 'hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      border: '1px solid rgba(2,48,71,0.08)',
      borderRadius: 18,
      padding: '18px 20px',
      marginBottom: 18,
      background: `linear-gradient(135deg, ${BRAND.sky}10 0%, ${BRAND.amber}10 100%)`,
    }}
  >
    <p
      style={{
        marginTop: 0,
        fontSize: 12,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: BRAND.navy,
        fontWeight: 700,
      }}
    >
      {title}
    </p>
    {children}
  </div>
);

const formatLine = (value?: string | null) => value ?? '—';

export default function BookingFinalizationEmail({
  input,
  copy,
  logoSrc,
}: BookingFinalizationEmailProps) {
  const rentalPeriod = `${formatDate(
    input.rentalStart,
    input.locale
  )} → ${formatDate(input.rentalEnd, input.locale)}`;
  type InfoCard = { label: string; value: string };

  const summaryCards: InfoCard[] = [
    { label: copy.labels.bookingCode, value: input.bookingCode },
    { label: copy.labels.car, value: formatLine(input.carLabel) },
    { label: copy.labels.period, value: rentalPeriod },
  ];

  const feeCards: InfoCard[] = [];
  const addPriceCard = (
    label: string,
    value?: string | null,
    skipEmpty = false
  ) => {
    const formatted = formatPrice(value);
    if (skipEmpty && (!value || formatted === '—')) return;
    feeCards.push({ label, value: formatted });
  };
  addPriceCard(copy.labels.rentalFee, input.rentalFee);
  addPriceCard(copy.labels.insurance, input.insurance, true);
  addPriceCard(copy.labels.deposit, input.deposit, true);
  addPriceCard(copy.labels.deliveryFee, input.deliveryFee);
  addPriceCard(copy.labels.extrasFee, input.extrasFee, true);

  const totalPrice = formatPrice(input.totalFee);

  const bookingInfo: InfoCard[] = [
    {
      label: copy.labels.adults,
      value: input.adults != null ? String(input.adults) : '—',
    },
    {
      label: copy.labels.children,
      value: input.children != null ? String(input.children) : '—',
    },
    { label: copy.labels.contactName, value: formatLine(input.contactName) },
    { label: copy.labels.contactEmail, value: formatLine(input.contactEmail) },
    { label: copy.labels.contactPhone, value: formatLine(input.contactPhone) },
  ];

  const billingInfo: InfoCard[] = [
    { label: copy.labels.invoiceName, value: formatLine(input.invoice?.name) },
    {
      label: copy.labels.invoiceEmail,
      value: formatLine(input.invoice?.email),
    },
    {
      label: copy.labels.invoicePhone,
      value: formatLine(input.invoice?.phone),
    },
    {
      label: copy.labels.invoiceAddress,
      value: formatLine(input.invoice?.address),
    },
  ];

  const deliveryInfo: InfoCard[] = [
    {
      label: copy.labels.deliveryLocation,
      value: formatLine(input.delivery?.locationName),
    },
    {
      label: copy.labels.deliveryAddress,
      value: formatLine(input.delivery?.address),
    },
    {
      label: copy.labels.arrivalFlight,
      value: formatLine(input.delivery?.arrivalFlight),
    },
    {
      label: copy.labels.departureFlight,
      value: formatLine(input.delivery?.departureFlight),
    },
  ];

  return (
    <div style={{ margin: 0, padding: 0, background: BRAND.background }}>
      <table
        role='presentation'
        cellPadding={0}
        cellSpacing={0}
        width='100%'
        style={{
          borderCollapse: 'collapse',
          background: BRAND.background,
          padding: '24px 12px',
        }}
      >
        <tbody>
          <tr>
            <td align='center'>
              <table
                role='presentation'
                cellPadding={0}
                cellSpacing={0}
                width={560}
                style={{
                  maxWidth: 560,
                  borderCollapse: 'collapse',
                  background: '#ffffff',
                  borderRadius: 18,
                  boxShadow: '0 14px 40px rgba(2,48,71,0.12)',
                  overflow: 'hidden',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: 0,
                        background: `linear-gradient(135deg, ${BRAND.sky} 0%, ${BRAND.amber} 100%)`,
                      }}
                    >
                      <div
                        style={{
                          padding: '18px 24px',
                          textAlign: 'center',
                        }}
                      >
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt='Zodiacs Rent a Car'
                            style={{
                              height: 120,
                              maxWidth: 360,
                              display: 'inline-block',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              color: '#ffffff',
                              fontFamily: 'Arial, sans-serif',
                              fontWeight: 700,
                              fontSize: 20,
                              letterSpacing: 1,
                            }}
                          >
                            Zodiacs Rent a Car
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '28px 26px 24px',
                        color: BRAND.navy,
                      }}
                    >
                      <div
                        style={{
                          color: BRAND.navyLight,
                          fontSize: 13,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          marginBottom: 10,
                          fontWeight: 700,
                        }}
                      >
                        Zodiacs Rent a Car
                      </div>

                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          letterSpacing: '0.3px',
                          margin: '0 0 18px',
                        }}
                      >
                        {copy.heading}
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: BRAND.navyLight,
                          marginBottom: 12,
                        }}
                      >
                        {copy.intro}
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: BRAND.navyLight,
                          marginBottom: 18,
                        }}
                      >
                        {copy.instructions}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: 16,
                          marginBottom: 24,
                        }}
                      >
                        {summaryCards.map((card) => (
                          <div
                            key={card.label}
                            style={{
                              background: '#f7fbff',
                              border: '1px solid rgba(2,48,71,0.08)',
                              borderRadius: 16,
                              padding: '14px 16px',
                              marginBottom: '8px',
                              textAlign: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: BRAND.navyLight,
                                marginBottom: 6,
                                fontWeight: 700,
                              }}
                            >
                              {card.label}
                            </div>
                            <div
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: BRAND.navy,
                              }}
                            >
                              {card.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          textAlign: 'center',
                          marginBottom: 24,
                        }}
                      >
                        <a
                          href={input.thankYouUrl}
                          style={{
                            backgroundColor: '#1B9E5A',
                            color: '#fff',
                            textDecoration: 'none',
                            padding: '12px 24px',
                            borderRadius: 999,
                            fontSize: 15,
                            fontWeight: 600,
                            display: 'inline-block',
                            marginRight: 12,
                          }}
                        >
                          {copy.confirmCta}
                        </a>
                        <a
                          href={input.contactUrl}
                          style={{
                            backgroundColor: '#E23D3D',
                            color: '#fff',
                            textDecoration: 'none',
                            padding: '12px 24px',
                            borderRadius: 999,
                            fontSize: 15,
                            fontWeight: 600,
                            display: 'inline-block',
                          }}
                        >
                          {copy.questionCta}
                        </a>
                      </div>

                      <Section title={copy.sections.fees}>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 16,
                          }}
                        >
                          {feeCards.map((card) => (
                            <div
                              key={card.label}
                              style={{
                                flex: '1 1 180px',
                                minWidth: 120,
                                borderRadius: 16,
                                border: '1px solid rgba(2,48,71,0.08)',
                                background: `linear-gradient(135deg, ${BRAND.sky}15 0%, ${BRAND.amber}12 100%)`,
                                padding: '12px 16px',
                                marginRight: '4px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  color: BRAND.navyLight,
                                  marginBottom: 6,
                                  fontWeight: 700,
                                }}
                              >
                                {card.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 18,
                                  fontWeight: 800,
                                  color: BRAND.navy,
                                }}
                              >
                                {card.value}
                              </div>
                            </div>
                          ))}
                        </div>
                        {totalPrice && totalPrice !== '—' && (
                          <div
                            style={{
                              marginTop: 18,
                              padding: '14px 16px',
                              borderRadius: 18,
                              border: '1px solid rgba(2,48,71,0.12)',
                              background: '#fff',
                              textAlign: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: BRAND.navyLight,
                                marginBottom: 4,
                                fontWeight: 700,
                              }}
                            >
                              {copy.labels.totalLabel}
                            </div>
                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: BRAND.navy,
                              }}
                            >
                              {totalPrice}
                            </div>
                          </div>
                        )}
                      </Section>

                      <Section title={copy.sections.booking}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 14,
                          }}
                        >
                          {bookingInfo.map((item) => (
                            <div
                              key={item.label}
                              style={{
                                borderRadius: 14,
                                border: '1px solid rgba(2,48,71,0.08)',
                                padding: '12px 14px',
                                marginBottom: '8px',
                                background: '#fff',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  color: BRAND.navyLight,
                                  marginBottom: 5,
                                  fontWeight: 700,
                                }}
                              >
                                {item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: BRAND.navy,
                                }}
                              >
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section title={copy.sections.billing}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 14,
                          }}
                        >
                          {billingInfo.map((item) => (
                            <div
                              key={item.label}
                              style={{
                                borderRadius: 14,
                                border: '1px solid rgba(2,48,71,0.08)',
                                padding: '12px 14px',
                                background: '#fff',
                                marginBottom: '8px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  color: BRAND.navyLight,
                                  marginBottom: 5,
                                  fontWeight: 700,
                                }}
                              >
                                {item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: BRAND.navy,
                                }}
                              >
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section title={copy.sections.delivery}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 14,
                          }}
                        >
                          {deliveryInfo.map((item) => (
                            <div
                              key={item.label}
                              style={{
                                borderRadius: 14,
                                border: '1px solid rgba(2,48,71,0.08)',
                                padding: '12px 14px',
                                background: '#fff',
                                marginBottom: '8px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  color: BRAND.navyLight,
                                  marginBottom: 5,
                                  fontWeight: 700,
                                }}
                              >
                                {item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: BRAND.navy,
                                }}
                              >
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>

                      <table
                        role='presentation'
                        cellPadding={0}
                        cellSpacing={0}
                        width='100%'
                        style={{ marginTop: 32 }}
                      >
                        <tbody>
                          <tr>
                            <td align='right'>
                              <div
                                style={{
                                  textAlign: 'right',
                                  fontSize: 13,
                                  lineHeight: 1.6,
                                  color: BRAND.navy,
                                  display: 'inline-block',
                                  maxWidth: 260,
                                }}
                              >
                                <strong>{input.signerName}</strong>
                                <br />
                                {copy.signatureRole}
                                <br />
                                {ADMIN_SIGNATURE.company}
                                <br />
                                Tel: {ADMIN_SIGNATURE.phone}
                                <br />
                                Email: {ADMIN_SIGNATURE.email}
                                <br />
                                Web: {copy.signatureWebsite}
                                <br />
                                {copy.signatureLocation}
                                {copy.signatureSlogans.map((line) => (
                                  <React.Fragment key={line}>
                                    <br />
                                    <em>{line}</em>
                                  </React.Fragment>
                                ))}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
