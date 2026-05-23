import { getOneAccommodation } from '@/data-service/accommodations';
import EditAccommodationForm from '@/components/accommodation/edit-accommodation-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { getStatusMeta } from '@/lib/status';
import { Button } from '@/components/ui/button';
import { sendQrCode } from './action';
import SendQR from './send-qr-button';

export default async function page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accommodationDetails = await getOneAccommodation(id);

  if (!accommodationDetails) {
    notFound();
  }

  const formatRentalFee = (value: string | null | undefined) => {
    if (!value) {
      return '-';
    }

    return value.includes('€') ? value : `${value} €`;
  };

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1 flex justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {`Szállás szerkesztése: ${accommodationDetails.name}`}
          </h1>
          <p className='text-muted-foreground'>
            Szállás adatok módosítása és a kapcsolódó foglalások összesítése.
          </p>
        </div>
        <SendQR id={id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szállás adatai</CardTitle>
        </CardHeader>
        <CardContent>
          <EditAccommodationForm
            accommodationId={accommodationDetails.id}
            initialValues={{
              name: accommodationDetails.name,
              country: accommodationDetails.country,
              postalCode: accommodationDetails.postalCode,
              city: accommodationDetails.city,
              street: accommodationDetails.street,
              houseNumber: accommodationDetails.houseNumber,
              island: accommodationDetails.island,
              email: accommodationDetails.email ?? '',
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kapcsolódó foglalások</CardTitle>
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
    </div>
  );
}
