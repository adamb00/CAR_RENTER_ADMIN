import { escapeHtml } from '@/lib/escape-html';
import { BookingRequestOffer, EmailCopy } from './types';
import { formatPriceValue } from '@/lib/format/format-price';
import { BRAND } from '@/lib/constants';
import { getStaticTexts } from './utils/get-static-text';
import { resolveOfferCarsCount } from '@/lib/offer-car-count';
import { resolveOfferRentalPricing } from '@/lib/quote-offer-pricing';

export const buildOfferBlocks = (
  offers: BookingRequestOffer[],
  staticText: ReturnType<typeof getStaticTexts>,
  copy: EmailCopy,
) => {
  return offers.map((offer, index) => {
    const hasValue = (value?: string | null) =>
      Boolean(value && value.trim().length > 0);
    const rawCarLabel = offer.carName || offer.carId || '';
    const carLabel = rawCarLabel ? escapeHtml(rawCarLabel) : '';
    const pricing = resolveOfferRentalPricing(offer);
    const rentalFee = pricing.effectiveRentalFee
      ? formatPriceValue(pricing.effectiveRentalFee)
      : null;
    const originalRentalFee = pricing.originalRentalFee
      ? formatPriceValue(pricing.originalRentalFee)
      : null;
    const appliesToCars = resolveOfferCarsCount(offer.appliesToCars);
    const carsScopeText = appliesToCars
      ? staticText.priceAppliesToCarsText(appliesToCars)
      : null;
    const deposit = hasValue(offer.deposit) ? formatPriceValue(offer.deposit) : null;
    const insurancePrice = hasValue(offer.insurance)
      ? formatPriceValue(offer.insurance)
      : null;
    const deliveryFee = hasValue(offer.deliveryFee)
      ? formatPriceValue(offer.deliveryFee)
      : null;
    const deliveryLocation = offer.deliveryLocation?.trim();
    const extrasFee = hasValue(offer.extrasFee)
      ? formatPriceValue(offer.extrasFee)
      : null;
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

        {carsScopeText && (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: BRAND.navyLight,
              marginBottom: 12,
            }}
          >
            {escapeHtml(carsScopeText)}
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
                    {row.length < 2 && (
                      <td style={{ width: '50%', padding: '4px' }} />
                    )}
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
                    {escapeHtml(
                      pricing.hasDiscount
                        ? staticText.discountedPriceLabel
                        : staticText.rentalFeeLabel,
                    )}
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

            {originalRentalFee && (
              <div
                style={{
                  flex: 1,
                  minWidth: 150,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(2,48,71,0.08)',
                  background: '#f8fafc',
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
                  {escapeHtml(staticText.originalPriceLabel)}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: BRAND.navyLight,
                    textDecoration: 'line-through',
                  }}
                >
                  {escapeHtml(originalRentalFee)}
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
                {(deliveryFee || extrasFee || deliveryLocation) && (
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
