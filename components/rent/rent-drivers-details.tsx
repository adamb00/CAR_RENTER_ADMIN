import { Booking } from '@/data-service/bookings';
import { formatAddress } from '@/lib/format/format-address';
import { booleanLabel } from '@/lib/format/format-boolean';
import { formatDate } from '@/lib/format/format-date';
import { formatDocumentType } from '@/lib/format/format-document';
import { getRentDetails } from '@/lib/rent-details';
import { DetailInline } from '../ui/detail';
import { expiryBadge } from '../ui/expiry-badge';
import Section from '../ui/section';

export default function RentDriversDetails({ booking }: { booking: Booking }) {
  const { drivers, contactEmail } = getRentDetails(booking);

  return (
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
                    value={driver.phoneNumber ?? booking.contactPhone ?? '—'}
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
                        ? formatDate(driver.dateOfBirth, 'short')
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
                value={driver.location ? formatAddress(driver.location) : '—'}
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
                        ? formatDate(driver.document.validFrom, 'short')
                        : '—'
                    }
                  />
                  <DetailInline
                    label='Érvényesség vége'
                    value={
                      driver.document?.validUntil ? (
                        <span className='gap-1 flex items-start 2xl:items-center flex-col 2xl:flex-row'>
                          {formatDate(driver.document.validUntil, 'short')}
                          {expiryBadge(driver.document.validUntil, 'Okmány')}
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
                        ? formatDate(
                            driver.document.drivingLicenceValidFrom,
                            'short',
                          )
                        : '—'
                    }
                  />
                  <DetailInline
                    label='Érvényesség vége'
                    value={
                      driver.document?.drivingLicenceValidUntil ? (
                        <span className='gap-1 flex items-start 2xl:items-center flex-col 2xl:flex-row'>
                          {formatDate(
                            driver.document.drivingLicenceValidUntil,
                            'short',
                          )}
                          {expiryBadge(
                            driver.document.drivingLicenceValidUntil,
                            'Jogosítvány',
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
                      driver.document?.drivingLicenceIsOlderThan_3,
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </Section>
  );
}
