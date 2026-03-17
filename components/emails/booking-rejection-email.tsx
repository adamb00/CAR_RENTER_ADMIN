/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react';

import { BRAND } from '@/lib/constants';
import {
  EmailSignatureBlock,
  buildEmailSignatureText,
  resolveEmailSignatureData,
} from './email-signature';
import type { BookingRejectionCopy } from '@/components/emails/utils/rejection-copy';
import { formatDatePeriod } from '@/lib/format/format-date';
import { Block } from '../ui/email-block';
import { sanitizeName } from '@/lib/sanitize-name';

export type BookingRejectionEmailInput = {
  bookingCode: string;
  name?: string | null;
  locale?: string | null;
  carLabel?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  signerName: string;
};

const lineValue = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '—';
};

export const buildBookingRejectionText = (
  copy: BookingRejectionCopy,
  input: BookingRejectionEmailInput,
) => {
  const period = formatDatePeriod(
    input.rentalStart,
    input.rentalEnd,
    input.locale,
  );
  const signatureData = resolveEmailSignatureData({
    signerName: input.signerName,
    locale: input.locale,
  });
  return [
    copy.greeting(sanitizeName(input.name)),
    '',
    copy.intro,
    `${copy.reasonLabel}: ${copy.reasonText}`,
    '',
    `${copy.bookingLabel}: ${input.bookingCode}`,
    `${copy.carLabel}: ${lineValue(input.carLabel)}`,
    `${copy.periodLabel}: ${lineValue(period)}`,
    '',
    copy.contactLine,
    '',
    `${copy.closing},`,
    buildEmailSignatureText(signatureData),
  ].join('\n');
};

type BookingRejectionEmailProps = {
  copy: BookingRejectionCopy;
  input: BookingRejectionEmailInput;
  logoSrc?: string | null;
};

export default function BookingRejectionEmail({
  copy,
  input,
  logoSrc,
}: BookingRejectionEmailProps) {
  const period = formatDatePeriod(
    input.rentalStart,
    input.rentalEnd,
    input.locale,
  );
  const name = sanitizeName(input.name);
  const summaryCards = [
    { label: copy.bookingLabel, value: input.bookingCode },
    { label: copy.carLabel, value: lineValue(input.carLabel) },
    { label: copy.periodLabel, value: lineValue(period) },
  ];
  const signatureData = resolveEmailSignatureData({
    signerName: input.signerName,
    locale: input.locale,
  });

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
                          marginBottom: 14,
                        }}
                      >
                        {copy.greeting(name)}
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: BRAND.navyLight,
                          marginBottom: 18,
                        }}
                      >
                        {copy.intro}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: 16,
                          marginBottom: 20,
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
                              marginBottom: 8,
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

                      <Block>
                        <p
                          style={{
                            margin: '0 0 8px 0',
                            fontSize: 12,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: BRAND.navyLight,
                            fontWeight: 700,
                          }}
                        >
                          {copy.reasonLabel}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 16,
                            lineHeight: 1.6,
                            color: BRAND.navy,
                            fontWeight: 600,
                          }}
                        >
                          {copy.reasonText}
                        </p>
                      </Block>

                      <Block>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: BRAND.navyLight,
                          }}
                        >
                          {copy.contactLine}
                        </p>
                      </Block>

                      <table
                        role='presentation'
                        cellPadding={0}
                        cellSpacing={0}
                        width='100%'
                        style={{ marginTop: 26 }}
                      >
                        <EmailSignatureBlock data={signatureData} />
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
