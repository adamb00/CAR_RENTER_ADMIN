/* eslint-disable @next/next/no-img-element */
import { BRAND } from '@/lib/constants';
import {
  EmailSignatureBlock,
  buildEmailSignatureText,
  resolveEmailSignatureData,
} from './email-signature';
import { EMAIL_COPY } from './utils/email-copy';
import { LOCALIZED_STATIC } from './utils/localized-static';

export type BookingRequestOfferBase = {
  carId?: string | null;
  carName?: string | null;
  rentalFee?: string;
  deposit?: string;
  insurance?: string;
  deliveryFee?: string;
  deliveryLocation?: string;
  extrasFee?: string;
  carImages?: string[] | null;
};

export type BookingRequestOffer = BookingRequestOfferBase & {
  bookingLink: string;
};

export type BookingRequestOfferInput = BookingRequestOfferBase & {
  bookingLink?: string | null;
};

export type SendBookingRequestEmailInput = {
  quoteId: string;
  email: string | null | undefined;
  name?: string | null;
  locale?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  adminName?: string | null;
  offers: BookingRequestOfferInput[];
};

export type SendBookingRequestEmailResolvedInput = Omit<
  SendBookingRequestEmailInput,
  'offers'
> & {
  offers: BookingRequestOffer[];
};

export type EmailCopy = {
  subject: string;
  greeting: (name?: string | null) => string;
  thankYou: string;
  instructions: string;
  paymentNote: string;
  cta: string;
  signature: string;
  successMessage?: string;
};

export type BookingRequestEmailProps = {
  copy: EmailCopy;
  input: SendBookingRequestEmailResolvedInput;
  logoSrc?: string;
};

const sanitizeName = (name?: string | null) => {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rentalDays = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
  const diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return null;
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
};

const formatDateRange = (
  start?: string | null,
  end?: string | null,
  locale = 'hu-HU',
) => {
  if (!start && !end) return null;
  const fmt = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
};

export const normalizeLocale = (locale?: string | null) => {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase();
  return EMAIL_COPY[normalized] ? normalized : 'en';
};

const formatPrice = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return `${trimmed} €`;
};

const getStaticTexts = (locale: string) =>
  LOCALIZED_STATIC[locale] ?? LOCALIZED_STATIC.en;

const buildOfferBlocks = (
  offers: BookingRequestOffer[],
  staticText: ReturnType<typeof getStaticTexts>,
  copy: EmailCopy,
) => {
  return offers.map((offer, index) => {
    const rawCarLabel = offer.carName || offer.carId || '';
    const carLabel = rawCarLabel ? escapeHtml(rawCarLabel) : '';
    const rentalFee = formatPrice(offer.rentalFee);
    const deposit = formatPrice(offer.deposit);
    const insurancePrice = formatPrice(offer.insurance);
    const deliveryFee = formatPrice(offer.deliveryFee);
    const deliveryLocation = offer.deliveryLocation?.trim();
    const extrasFee = formatPrice(offer.extrasFee);
    const insuranceNote = insurancePrice ? staticText.insuranceNote : null;
    const carImages = Array.isArray(offer.carImages)
      ? offer.carImages
          .map((url) => (typeof url === 'string' ? url.trim() : ''))
          .filter((url) => url.length > 0)
      : [];
    const carImageRows: string[][] = [];
    for (let i = 0; i < carImages.length; i += 2) {
      carImageRows.push(carImages.slice(i, i + 2));
    }
    const carImagesLabel = escapeHtml(staticText.carImagesLabel);
    const offerLabel = escapeHtml(staticText.offerLabel);

    return (
      <div
        key={`offer-${index}`}
        style={{
          margin: '0 0 18px',
          padding: '14px 16px',
          border: '1px solid rgba(2,48,71,0.08)',
          borderRadius: 14,
          background: '#ffffff',
        }}
      >
        <div
          style={{
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: BRAND.navyLight,
            marginBottom: 10,
            fontWeight: 700,
          }}
        >
          {offerLabel} {index + 1}
        </div>

        {carLabel && (
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: BRAND.navy,
              marginBottom: 10,
            }}
          >
            {carLabel}
          </div>
        )}

        {carImageRows.length > 0 && (
          <div
            style={{
              margin: '0 0 14px',
              padding: '12px 12px',
              border: '1px solid rgba(2,48,71,0.08)',
              borderRadius: 12,
              background: '#f8fafc',
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: BRAND.navyLight,
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              {carImagesLabel}
            </div>
            <table
              role='presentation'
              width='100%'
              cellPadding={0}
              cellSpacing={0}
              style={{ borderCollapse: 'collapse' }}
            >
              <tbody>
                {carImageRows.map((row, rowIndex) => (
                  <tr key={`car-img-row-${rowIndex}`}>
                    {row.map((src, cellIndex) => (
                      <td
                        key={`car-img-${rowIndex}-${cellIndex}`}
                        style={{
                          width: '50%',
                          padding: '4px',
                        }}
                      >
                        <img
                          src={src}
                          alt={`${rawCarLabel || staticText.carImagesLabel} ${
                            rowIndex * 2 + cellIndex + 1
                          }`}
                          style={{
                            width: '100%',
                            display: 'block',
                            borderRadius: 12,
                            border: '1px solid rgba(2,48,71,0.08)',
                          }}
                        />
                      </td>
                    ))}
                    {row.length < 2 && <td style={{ width: '50%', padding: '4px' }} />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(rentalFee || deposit || insurancePrice) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              margin: '0 -10px 8px 0',
              alignItems: 'stretch',
            }}
          >
            {rentalFee && (
              <div
                style={{
                  flex: 1,
                  minWidth: 150,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(2,48,71,0.08)',
                  background: `linear-gradient(135deg, ${BRAND.sky}15 0%, ${BRAND.amber}12 100%)`,
                  margin: '0 12px 12px 0',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: BRAND.navyLight,
                    marginBottom: 6,
                  }}
                >
                  {escapeHtml(staticText.rentalFeeLabel)}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: BRAND.navy,
                  }}
                >
                  {escapeHtml(rentalFee)}
                </div>
              </div>
            )}

            {deposit && (
              <div
                style={{
                  flex: 1,
                  minWidth: 150,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(2,48,71,0.08)',
                  background: `linear-gradient(135deg, ${BRAND.sky}15 0%, ${BRAND.amber}12 100%)`,
                  margin: '0 12px 12px 0',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: BRAND.navyLight,
                    marginBottom: 6,
                  }}
                >
                  {escapeHtml(staticText.depositLabel)}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: BRAND.navy,
                  }}
                >
                  {escapeHtml(deposit)}
                </div>
              </div>
            )}

            {insurancePrice && (
              <div
                style={{
                  flex: 1,
                  minWidth: 150,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(2,48,71,0.08)',
                  background: `linear-gradient(135deg, ${BRAND.sky}15 0%, ${BRAND.amber}12 100%)`,
                  margin: '0 12px 12px 0',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: BRAND.navyLight,
                    marginBottom: 6,
                  }}
                >
                  {escapeHtml(staticText.insuranceLabel)}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: BRAND.navy,
                  }}
                >
                  {escapeHtml(insurancePrice)}
                </div>
              </div>
            )}

            <div
              style={{
                flex: 1,
                minWidth: 150,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(2,48,71,0.08)',
                background: `linear-gradient(135deg, ${BRAND.sky}12 0%, ${BRAND.amber}10 100%)`,
                margin: '0 12px 12px 0',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: BRAND.navyLight,
                  marginBottom: 6,
                }}
              >
                {escapeHtml(staticText.extrasLabel)}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: BRAND.navyLight,
                  lineHeight: 1.5,
                }}
              >
                {(deliveryFee || extrasFee) && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      color: BRAND.navy,
                    }}
                  >
                {deliveryFee && (
                  <div>
                    {escapeHtml(staticText.deliveryFeeLabel)}:{' '}
                    {escapeHtml(deliveryFee)}
                  </div>
                )}
                {deliveryLocation && (
                  <div>
                    {escapeHtml(staticText.deliveryLocationLabel)}:{' '}
                    {escapeHtml(deliveryLocation)}
                  </div>
                )}
                {extrasFee && (
                  <div>
                    {escapeHtml(staticText.extrasFeeLabel)}:{' '}
                    {escapeHtml(extrasFee)}
                  </div>
                )}
                  </div>
                )}
                <br />
              </div>
            </div>
          </div>
        )}

        {insuranceNote && (
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              fontWeight: 'bold',
              textAlign: 'center',
              color: BRAND.navyLight,
              margin: '-6px 0 18px',
            }}
          >
            {insuranceNote}
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            margin: '18px 0 18px',
          }}
        >
          <a
            href={offer.bookingLink}
            style={{
              display: 'inline-block',
              padding: '13px 22px',
              background: BRAND.blue,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
              borderRadius: 999,
              boxShadow: '0 10px 24px rgba(33,158,188,0.22)',
            }}
          >
            {escapeHtml(copy.cta)}
          </a>
        </div>

        <div
          style={{
            fontSize: 12,
            color: BRAND.navyLight,
            lineHeight: 1.5,
            textAlign: 'center',
            margin: '8px 0 10px',
          }}
        >
          {escapeHtml(staticText.fallbackLink)}
          <br />
          <a
            href={offer.bookingLink}
            style={{
              color: BRAND.navy,
              fontWeight: 600,
              textDecoration: 'none',
              wordBreak: 'break-all',
            }}
          >
            {offer.bookingLink}
          </a>
        </div>
      </div>
    );
  });
};

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

  const dateRange = formatDateRange(
    input.rentalStart,
    input.rentalEnd,
    input.locale ?? 'hu-HU',
  );
  const days = rentalDays(input.rentalStart, input.rentalEnd);
  const localeSafe = normalizeLocale(input.locale);
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

export const buildTextBody = (
  copy: EmailCopy,
  input: SendBookingRequestEmailResolvedInput,
) => {
  const safeName = sanitizeName(input.name);
  const dateRange = formatDateRange(
    input.rentalStart,
    input.rentalEnd,
    input.locale ?? 'hu-HU',
  );
  const days = rentalDays(input.rentalStart, input.rentalEnd);
  const localeSafe = normalizeLocale(input.locale);
  const staticText = getStaticTexts(localeSafe);
  const signatureData = resolveEmailSignatureData({
    signerName: input.adminName,
    locale: localeSafe,
    adminTitle: staticText.adminTitle,
    localizedSiteUrl: `https://zodiacsrentacar.com/${localeSafe}`,
    sloganLines: staticText.slogans,
  });

  const offers = Array.isArray(input.offers) ? input.offers : [];
  const offersText = offers
    .map((offer, index) => {
      const rentalFee = formatPrice(offer.rentalFee);
      const deposit = formatPrice(offer.deposit);
      const insurancePrice = formatPrice(offer.insurance);
      const deliveryFee = formatPrice(offer.deliveryFee);
      const deliveryLocation = offer.deliveryLocation?.trim();
      const extrasFee = formatPrice(offer.extrasFee);
      const carLabel = offer.carName || offer.carId || '';
      const insuranceNote =
        insurancePrice && deposit ? staticText.insuranceNote : null;
      return `\n${staticText.offerLabel} ${index + 1}:\n${
        carLabel ? `${carLabel}` : ''
      }\n${
        rentalFee ? `${staticText.rentalFeeLabel}: ${rentalFee}` : ''
      }\n${deposit ? `${staticText.depositLabel}: ${deposit}` : ''}\n${
        insurancePrice ? `${insuranceNote ?? ''}` : ''
      }\n${
        insurancePrice ? `${staticText.insuranceLabel}: ${insurancePrice}` : ''
      }\n${
        deliveryFee ? `${staticText.deliveryFeeLabel}: ${deliveryFee}` : ''
      }\n${
        deliveryLocation
          ? `${staticText.deliveryLocationLabel}: ${deliveryLocation}`
          : ''
      }\n${
        extrasFee ? `${staticText.extrasFeeLabel}: ${extrasFee}` : ''
      }\n${copy.cta}: ${offer.bookingLink}\n`;
    })
    .join('\n');

  return `${copy.greeting(safeName)}
  
  ${copy.thankYou}
  ${copy.instructions}
  ${copy.paymentNote}
  
  ${
    dateRange
      ? `${dateRange}${days ? ` (${days} ${staticText.daysSuffix})` : ''}`
      : ''
  }

  ${offersText}
  
  ${staticText.extrasNote}
  ${staticText.deliveryNote}
  
  ${copy.signature}

  ${buildEmailSignatureText(signatureData)}`;
};
