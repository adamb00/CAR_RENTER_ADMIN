import ContractForm from '@/components/contract-form';
import { getBookingById } from '@/data-service/bookings';
import { getVehicleById } from '@/data-service/cars';
import { db } from '@/lib/db';
import {
  buildContractTemplate,
  formatContractText,
} from '@/lib/contract-template';
import { buildContractDataFromBooking } from '@/lib/contract-data';
import { formatDate } from '@/lib/format/format-date';
import Link from 'next/link';
import { getAllUser } from '@/data-service/user';

export default async function BookingContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingById(id);
  const admins = await getAllUser();

  if (!booking) {
    return (
      <div className='flex h-full flex-col gap-6 p-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Foglalás nem található
          </h1>
          <p className='text-muted-foreground'>
            A megadott azonosítóval nem található foglalás.
          </p>
        </div>
        <Link
          className='text-sm text-primary underline-offset-4 hover:underline'
          href='/calendar'
        >
          Vissza a naptárhoz
        </Link>
      </div>
    );
  }

  const vehicle = await getVehicleById(
    booking.assignedFleetVehicleId ??
      booking.payload?.assignedFleetVehicleId ??
      '',
  );

  const existingContract = await db.bookingContract.findUnique({
    where: { bookingId: booking.id },
    select: {
      signedAt: true,
      signerName: true,
      signatureData: true,
      lessorSignatureData: true,
    },
  });
  const latestInvite = await db.bookingContractInvite.findFirst({
    where: {
      bookingId: booking.id,
      revokedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
    },
  });

  const contractData = buildContractDataFromBooking(booking, vehicle);
  const signedAt = new Date();
  const template = buildContractTemplate(contractData, {
    signedAt,
    locale: booking.locale ?? booking.payload?.locale ?? null,
  });
  const contractText = formatContractText(template);

  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Digitális szerződés
        </h1>
        <p className='text-muted-foreground'>
          Itt tudod aláíratni a bérleti szerződést a bérlővel.
        </p>
      </div>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <p className='text-sm text-muted-foreground'>
          Foglalás azonosító:{' '}
          <span className='font-medium text-foreground'>
            {booking.humanId ?? booking.id}
          </span>
        </p>
        <p className='text-sm text-muted-foreground'>
          Foglalt autó:{' '}
          <span className='font-medium text-foreground'>
            {booking.carLabel} &bull; {formatDate(booking.rentalStart, 'short')}{' '}
            - {formatDate(booking.rentalEnd, 'short')} &bull;{' '}
            {booking.rentalDays ?? '—'} nap
          </span>
        </p>
      </div>
      <ContractForm
        admins={admins}
        bookingId={booking.id}
        template={template}
        contractText={contractText}
        renterName={contractData.renterName}
        renterEmail={contractData.renterEmail}
        downloadHref={
          existingContract || latestInvite
            ? `/api/bookings/${booking.id}/contract/pdf`
            : null
        }
        existingContract={
          existingContract
            ? {
                signedAt: existingContract.signedAt.toISOString(),
                signerName: existingContract.signerName,
                signatureData: existingContract.signatureData,
                lessorSignatureData: existingContract.lessorSignatureData,
              }
            : null
        }
      />
    </div>
  );
}
