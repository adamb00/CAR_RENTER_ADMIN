'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getBookingById } from '@/data-service/bookings';
import { db } from '@/lib/db';
import { BOOKING_EMAIL_FROM } from '@/lib/constants';
import {
  BOOKING_FROM_ADDRESS,
  MAIL_USER,
  getTransporter,
  hasMailerConfig,
} from '@/lib/mailer';
import {
  CONTRACT_VERSION,
  buildContractTemplate,
  formatContractText,
} from '@/lib/contract-template';
import { buildContractPdf } from '@/lib/contract-pdf';
import { buildContractDataFromBooking } from '@/lib/contract-data';

const createBookingContractSchema = z.object({
  bookingId: z.string().min(1),
  signerName: z.string().min(1),
  renterSignatureData: z.string().min(1),
  lessorSignatureData: z.string().min(1),
});

type CreateBookingContractResult = {
  success?: string;
  error?: string;
};

const resolveRecipient = (booking: Awaited<ReturnType<typeof getBookingById>>) =>
  booking?.contactEmail ??
  booking?.payload?.contact?.email ??
  booking?.payload?.invoice?.email ??
  null;

export const createBookingContractAction = async (
  input: z.infer<typeof createBookingContractSchema>,
): Promise<CreateBookingContractResult> => {
  const parsed = createBookingContractSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen adatok, kérjük ellenőrizd a mezőket.' };
  }

  const data = parsed.data;
  if (!data.renterSignatureData.startsWith('data:image/')) {
    return { error: 'A bérlő aláírásának formátuma nem megfelelő.' };
  }
  if (!data.lessorSignatureData.startsWith('data:image/')) {
    return { error: 'A bérbeadó aláírásának formátuma nem megfelelő.' };
  }
  const booking = await getBookingById(data.bookingId.trim());
  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const recipient = resolveRecipient(booking);
  if (!recipient) {
    return { error: 'Ehhez a foglaláshoz nincs megadható e-mail cím.' };
  }

  if (!hasMailerConfig() || !BOOKING_FROM_ADDRESS) {
    return {
      error:
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const existing = await db.bookingContract.findUnique({
    where: { bookingId: booking.id },
    select: { id: true },
  });
  if (existing) {
    return { error: 'Ehhez a foglaláshoz már van aláírt szerződés.' };
  }

  const vehicleId =
    booking.assignedFleetVehicleId ?? booking.payload?.assignedFleetVehicleId;
  const vehicle = vehicleId
    ? await db.fleetVehicle.findUnique({
        where: { id: vehicleId },
        select: { plate: true },
      })
    : null;

  const contractData = buildContractDataFromBooking(booking, vehicle);
  const signedAt = new Date();
  const template = buildContractTemplate(contractData, {
    signedAt,
    locale: booking.locale ?? booking.payload?.locale ?? null,
  });
  const contractText = formatContractText(template);
  const contractBodyText = formatContractText(template, { includeTitle: false });
  const renterName = contractData.renterName ?? booking.contactName;

  let contractId: string | null = null;
  try {
    const created = await db.bookingContract.create({
      data: {
        bookingId: booking.id,
        signerName: data.signerName.trim(),
        signerEmail: recipient,
        contractVersion: CONTRACT_VERSION,
        contractText,
        signatureData: data.renterSignatureData,
        lessorSignatureData: data.lessorSignatureData,
        signedAt,
      },
      select: { id: true },
    });
    contractId = created.id;

    const pdfBuffer = await buildContractPdf({
      template,
      contractText: contractBodyText,
      signerName: data.signerName.trim(),
      signedAt,
      renterSignatureDataUrl: data.renterSignatureData,
      lessorSignatureDataUrl: data.lessorSignatureData,
    });

    const transporter = await getTransporter();
    const bookingCode = booking.humanId ?? booking.id;
    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: recipient,
      subject: `Bérleti szerződés (${bookingCode})`,
      text: `Kedves ${renterName ?? 'Bérlő'}!\n\nA bérleti szerződésed aláírásra került. A PDF csatolmányban találod.\n\nÜdv,\nZODIACS Rent a Car`,
      html: `<!doctype html><div style="font-family: Arial, sans-serif; font-size: 14px; color: #0f172a;">
        <p>Kedves ${renterName ?? 'Bérlő'}!</p>
        <p>A bérleti szerződésed aláírásra került. A PDF csatolmányban találod.</p>
        <p>Üdv,<br/>ZODIACS Rent a Car</p>
      </div>`,
      replyTo: MAIL_USER ?? BOOKING_EMAIL_FROM,
      attachments: [
        {
          filename: `berleti-szerzodes-${bookingCode}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    await db.bookingContract.update({
      where: { id: created.id },
      data: { pdfSentAt: new Date() },
    });
  } catch (error) {
    console.error('createBookingContractAction error', error);
    if (error instanceof Error && error.message.includes('PDF betűkészlet')) {
      return { error: error.message };
    }
    if (contractId) {
      try {
        await db.bookingContract.delete({ where: { id: contractId } });
      } catch (cleanupError) {
        console.error('createBookingContractAction cleanup', cleanupError);
      }
    }
    return {
      error: 'Nem sikerült létrehozni a szerződést. Próbáld meg később.',
    };
  }

  revalidatePath(`/bookings/${booking.id}/contract`);
  revalidatePath(`/bookings/${booking.id}/carout`);

  return { success: 'A szerződés elmentve és elküldve.' };
};
