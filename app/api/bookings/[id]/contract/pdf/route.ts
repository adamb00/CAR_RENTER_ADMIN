import { auth } from '@/auth';
import { buildBookingContractPdf } from '@/lib/booking-contract';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const booking = await db.rentRequests.findUnique({
    where: { id },
    select: {
      id: true,
      humanId: true,
      bookingContract: {
        select: {
          signerName: true,
          signedAt: true,
          contractText: true,
          signatureData: true,
          lessorSignatureData: true,
        },
      },
      bookingContractInvites: {
        where: {
          revokedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        select: {
          signerName: true,
          sentAt: true,
          locale: true,
          contractText: true,
          lessorSignatureData: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { message: 'A foglalás nem található.' },
      { status: 404 },
    );
  }

  const contract = booking.bookingContract;
  const latestInvite = booking.bookingContractInvites[0] ?? null;
  const source = contract
    ? {
        signerName: contract.signerName,
        signedAt: contract.signedAt,
        contractText: contract.contractText,
        renterSignatureDataUrl: contract.signatureData,
        lessorSignatureDataUrl: contract.lessorSignatureData,
        locale: null,
      }
    : latestInvite
      ? {
          signerName: latestInvite.signerName,
          signedAt: null,
          contractText: latestInvite.contractText,
          renterSignatureDataUrl: '',
          lessorSignatureDataUrl: latestInvite.lessorSignatureData,
          locale: latestInvite.locale,
        }
      : null;

  if (!source) {
    return NextResponse.json(
      { message: 'Ehhez a foglaláshoz még nincs letölthető szerződés.' },
      { status: 404 },
    );
  }

  try {
    const pdf = await buildBookingContractPdf({
      bookingId: booking.id,
      signerName: source.signerName,
      signedAt: source.signedAt,
      contractText: source.contractText,
      renterSignatureDataUrl: source.renterSignatureDataUrl,
      lessorSignatureDataUrl: source.lessorSignatureDataUrl,
      locale: source.locale,
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rental-agreement-${booking.humanId ?? booking.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('admin contract pdf route', error);
    return NextResponse.json(
      { message: 'Nem sikerült létrehozni a PDF-et.' },
      { status: 500 },
    );
  }
}
