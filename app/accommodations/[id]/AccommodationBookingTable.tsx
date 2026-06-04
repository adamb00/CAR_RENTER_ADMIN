'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccommodationDetails } from '@/data-service/accommodations';
import { getStatusMeta } from '@/lib/status';
import { useState } from 'react';

const formatRentalFee = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }

  return value.includes('€') ? value : `${value} €`;
};

export default function AccommodationBookingTable({
  accommodationDetails,
}: {
  accommodationDetails: AccommodationDetails;
}) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const handleOnClick = () => {
    console.log('Selected Rent Request IDs:', selectedItems);
  };
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Kapcsolódó foglalások</CardTitle>
          {selectedItems.length > 0 && (
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOnClick()}
            >
              Button
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {accommodationDetails.rentRequests.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Ehhez a szálláshoz még nincs kapcsolt foglalás.
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
                    Státusz
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide'>
                    Rental Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {accommodationDetails.rentRequests.map((rentRequest) =>
                  (() => {
                    const statusMeta = getStatusMeta(rentRequest.status);
                    return (
                      <tr key={rentRequest.id} className='border-t'>
                        <td className='px-4 py-3'>
                          <input
                            type='checkbox'
                            onChange={() => {
                              setSelectedItems((prev) =>
                                prev.includes(rentRequest.id)
                                  ? prev.filter((id) => id !== rentRequest.id)
                                  : [...prev, rentRequest.id],
                              );
                            }}
                          />
                        </td>
                        <td className='px-4 py-3'>
                          {rentRequest.humanId || '-'}
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusMeta.badge}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className='px-4 py-3 font-medium'>
                          {formatRentalFee(
                            rentRequest.bookingPricingSnapshot?.rentalFee,
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
