import EditAccommodationForm from '@/components/accommodation/edit-accommodation-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOneAccommodation } from '@/data-service/accommodations';
import { notFound } from 'next/navigation';
import SendQR from './send-qr-button';
import AccommodationBookingTable from './AccommodationBookingTable';

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

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
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
      <AccommodationBookingTable accommodationDetails={accommodationDetails} />
    </div>
  );
}
