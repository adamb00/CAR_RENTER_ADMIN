'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { AccommodationBookingCommissionDetails } from '@/data-service/accommodations';
import { formatDatePeriod } from '@/lib/format/format-date';
import { getCommissionStatusMeta, getStatusMeta } from '@/lib/status';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { bookTipsAction } from './action';

type SerializableAccommodationBookingCommissionDetails = Omit<
  AccommodationBookingCommissionDetails,
  'amount'
> & {
  amount: string | null;
};

const formatRentalFee = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }

  return value.includes('€') ? value : `${value} €`;
};

const parseDate = (value?: Date | string | null) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateInputStart = (value: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateInputEnd = (value: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isBookingInDateRange = (
  commission: SerializableAccommodationBookingCommissionDetails,
  filterStart: Date | null,
  filterEnd: Date | null,
) => {
  if (!filterStart && !filterEnd) {
    return true;
  }

  const bookingStart = parseDate(commission.booking.rentalstart);
  const bookingEnd = parseDate(commission.booking.rentalend);

  if (!bookingStart && !bookingEnd) {
    return false;
  }

  const rangeStart = bookingStart ?? bookingEnd;
  const rangeEnd = bookingEnd ?? bookingStart;

  if (!rangeStart || !rangeEnd) {
    return false;
  }

  if (filterStart && rangeEnd < filterStart) {
    return false;
  }

  if (filterEnd && rangeStart > filterEnd) {
    return false;
  }

  return true;
};

export default function AccommodationBookingTable({
  accommodationDetails,
}: {
  accommodationDetails: SerializableAccommodationBookingCommissionDetails[];
}) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredAccommodationDetails = useMemo(() => {
    const start = parseDateInputStart(filterStart);
    const end = parseDateInputEnd(filterEnd);

    return accommodationDetails.filter((commission) =>
      isBookingInDateRange(commission, start, end),
    );
  }, [accommodationDetails, filterEnd, filterStart]);

  useEffect(() => {
    const visibleIds = new Set(
      filteredAccommodationDetails.map((commission) => commission.id),
    );
    setSelectedItems((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [filteredAccommodationDetails]);

  const handleOnClick = () => {
    const idsToProcess = selectedItems;
    setSelectedItems([]);

    startTransition(async () => {
      await bookTipsAction(idsToProcess);
      router.refresh();
    });
  };

  const hasDateFilter = Boolean(filterStart || filterEnd);

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <CardTitle>Kapcsolódó foglalások</CardTitle>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <Input
                type='date'
                label='Időszak kezdete'
                value={filterStart}
                onChange={(event) => setFilterStart(event.target.value)}
              />
              <Input
                type='date'
                label='Időszak vége'
                value={filterEnd}
                onChange={(event) => setFilterEnd(event.target.value)}
              />
            </div>
            {hasDateFilter && (
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setFilterStart('');
                  setFilterEnd('');
                }}
              >
                Szűrő törlése
              </Button>
            )}
            {selectedItems.length > 0 && (
              <Button
                type='button'
                variant='outline'
                disabled={isPending}
                onClick={() => handleOnClick()}
              >
                Jattok feldolgozása ({selectedItems.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {accommodationDetails.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Ehhez a szálláshoz még nincs kapcsolt foglalás.
          </div>
        ) : filteredAccommodationDetails.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Nincs a megadott időszaknak megfelelő foglalás.
          </div>
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <table className='w-full min-w-140 text-sm'>
              <thead className='bg-muted/60 text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'></th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'>
                    ID
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'>
                    Foglalás Státusz
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'>
                    Jatt
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'>
                    Jatt kifizetésének státusza
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'>
                    Bérlés időszaka
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccommodationDetails.map((commission) =>
                  (() => {
                    const statusMeta = getStatusMeta(commission.booking.status);
                    const comissionStatusMeta = getCommissionStatusMeta(
                      commission.status,
                    );
                    return (
                      <tr key={commission.id} className='border-t'>
                        <td className='px-4 py-3'>
                          <input
                            type='checkbox'
                            checked={selectedItems.includes(commission.id)}
                            onChange={() => {
                              setSelectedItems((prev) =>
                                prev.includes(commission.id)
                                  ? prev.filter((id) => id !== commission.id)
                                  : [...prev, commission.id],
                              );
                            }}
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <Link
                            href={`/${commission.booking.id}`}
                            className='text-blue-600 hover:underline'
                          >
                            {commission.booking.humanId || '-'}
                          </Link>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusMeta.badge}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className='px-4 py-3 font-medium'>
                          {formatRentalFee(commission.amount)}
                        </td>
                        <td className='px-4 py-3 '>
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${comissionStatusMeta.badge}`}
                          >
                            {comissionStatusMeta.label}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          {formatDatePeriod(
                            commission.booking.rentalstart?.toString(),
                            commission.booking.rentalend?.toString(),
                          )}
                        </td>
                      </tr>
                    );
                  })(),
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
