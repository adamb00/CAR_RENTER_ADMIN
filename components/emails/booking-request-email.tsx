/* eslint-disable @next/next/no-img-element */
import { BRAND } from '@/lib/constants';
import { escapeHtml } from '@/lib/escape-html';
import { formatDatePeriod, rentalDays } from '@/lib/format/format-date';
import { normalizeConfirmationLocale } from '@/lib/format/format-locale';
import { sanitizeName } from '@/lib/sanitize-name';
import { buildOfferBlocks } from './build-offer-blocks';
import {
  EmailSignatureBlock,
  resolveEmailSignatureData,
} from './email-signature';
import { BookingRequestEmailProps } from './types';
import { getStaticTexts } from './utils/get-static-text';

export function BookingRequestEmailTemplate({
  copy,
  input,
  logoSrc,
}: BookingRequestEmailProps) {
  const safeName = sanitizeName(input.name);
  const safeNameForHtml = safeName ? escapeHtml(safeName) : undefined;

  const heading = escapeHtml(copy.subject);
  const greeting = copy.greeting(safeNameForHtml);
  const thankYou = escapeHtml(copy.thankYou);
  const instructions = escapeHtml(copy.instructions);
  const paymentNote = escapeHtml(copy.paymentNote);

  const dateRange = formatDatePeriod(
    input.rentalStart,
    input.rentalEnd,
    input.locale ?? 'hu-HU',
  );
  const days = rentalDays(input.rentalStart, input.rentalEnd);
  const localeSafe = normalizeConfirmationLocale(input.locale);
  const staticText = getStaticTexts(localeSafe);

  const signatureData = resolveEmailSignatureData({
    signerName: input.adminName,
    locale: localeSafe,
    adminTitle: staticText.adminTitle,
    localizedSiteUrl: `https://zodiacsrentacar.com/${localeSafe}`,
    sloganLines: staticText.slogans,
  });

  const offers = Array.isArray(input.offers) ? input.offers : [];
  const offerBlocks = buildOfferBlocks(offers, staticText, copy);

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
                width={640}
                style={{
                  maxWidth: 640,
                  borderCollapse: 'collapse',
                  background: '#ffffff',
                  borderRadius: 18,
                  boxShadow: '0 14px 40px rgba(2,48,71,0.12)',
                  overflow: 'hidden',
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
                              height: 200,
                              maxWidth: 2520,
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
                        padding: '28px 26px 8px',
                        fontFamily: 'Arial, sans-serif',
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
                          fontSize: 22,
                          fontWeight: 800,
                          letterSpacing: '0.3px',
                          margin: '0 0 14px',
                        }}
                      >
                        {heading}
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: BRAND.navyLight,
                          marginBottom: 12,
                        }}
                      >
                        {greeting}
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: BRAND.navyLight,
                          marginBottom: 12,
                        }}
                      >
                        {thankYou}
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: BRAND.navyLight,
                          marginBottom: 22,
                        }}
                      >
                        {instructions}
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: BRAND.navyLight,
                          marginBottom: 22,
                          fontWeight: 600,
                        }}
                      >
                        {paymentNote}
                      </div>

                      {dateRange && (
                        <div
                          style={{
                            margin: '0 0 18px',
                            padding: '14px 16px',
                            border: '1px solid rgba(2,48,71,0.08)',
                            borderRadius: 14,
                            background: `linear-gradient(135deg, ${BRAND.sky}15 0%, ${BRAND.amber}12 100%)`,
                          }}
                        >
                          {dateRange && (
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: BRAND.navy,
                                marginBottom: 6,
                              }}
                            >
                              {escapeHtml(dateRange)}
                              {days
                                ? ` (${days} ${escapeHtml(
                                    staticText.daysSuffix,
                                  )})`
                                : ''}
                            </div>
                          )}
                        </div>
                      )}

                      {offerBlocks}

                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.6,
                          fontWeight: '600',
                          textAlign: 'center',
                          color: BRAND.navyLight,
                          margin: '-6px 0 18px',
                        }}
                      >
                        {escapeHtml(staticText.extrasNote)}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.6,
                          fontWeight: '600',
                          textAlign: 'center',
                          color: BRAND.navyLight,
                          margin: '-6px 0 18px',
                        }}
                      >
                        {escapeHtml(staticText.deliveryNote)}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        padding: '18px 24px 26px',
                        fontFamily: 'Arial, sans-serif',
                        color: BRAND.navyLight,
                        fontSize: 14,
                        lineHeight: 1.6,
                        borderTop: '1px solid rgba(2,48,71,0.06)',
                      }}
                    >
                      <table
                        role='presentation'
                        width='100%'
                        cellPadding={0}
                        cellSpacing={0}
                        style={{ borderCollapse: 'collapse' }}
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
export default BookingRequestEmailTemplate;
