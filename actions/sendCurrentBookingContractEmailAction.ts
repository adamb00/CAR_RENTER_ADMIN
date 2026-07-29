'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getBookingById } from '@/data-service/bookings';
import { buildBookingContractPdf } from '@/lib/booking-contract';
import { BOOKING_EMAIL_FROM } from '@/lib/constants';
import { db } from '@/lib/db';
import {
  BOOKING_FROM_ADDRESS,
  MAIL_USER,
  getTransporter,
  hasMailerConfig,
} from '@/lib/mailer';

const sendCurrentBookingContractEmailSchema = z.object({
  bookingId: z.string().min(1),
});

type SendCurrentBookingContractEmailResult = {
  success?: string;
  error?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const sendCurrentBookingContractEmailAction = async (
  input: z.infer<typeof sendCurrentBookingContractEmailSchema>,
): Promise<SendCurrentBookingContractEmailResult> => {
  const parsed = sendCurrentBookingContractEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen foglalás azonosító.' };
  }

  const booking = await getBookingById(parsed.data.bookingId.trim());
  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const recipient = booking.contactEmail?.trim();
  if (!recipient) {
    return { error: 'Ehhez a foglaláshoz nincs kapcsolattartó e-mail cím.' };
  }

  if (!hasMailerConfig() || !BOOKING_FROM_ADDRESS) {
    return {
      error:
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const contractSource = await db.rentRequests.findUnique({
    where: { id: booking.id },
    select: {
      id: true,
      humanId: true,
      bookingContract: {
        select: {
          id: true,
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

  if (!contractSource) {
    return { error: 'A foglalás nem található.' };
  }

  const contract = contractSource.bookingContract;
  const latestInvite = contractSource.bookingContractInvites[0] ?? null;
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
    return {
      error: 'Ehhez a foglaláshoz még nincs kiküldhető szerződés.',
    };
  }

  try {
    const bookingCode = contractSource.humanId ?? contractSource.id;
    const pdfBuffer = await buildBookingContractPdf({
      bookingId: contractSource.id,
      signerName: source.signerName,
      signedAt: source.signedAt,
      contractText: source.contractText,
      renterSignatureDataUrl: source.renterSignatureDataUrl,
      lessorSignatureDataUrl: source.lessorSignatureDataUrl,
      locale: source.locale,
    });
    const subject = `Aktuális bérleti szerződés (${bookingCode})`;
    const contactName = booking.contactName?.trim() || 'Kapcsolattartó';
    const text = [
      `Kedves ${contactName},`,
      '',
      'A foglaláshoz tartozó aktuális bérleti szerződést csatoltuk PDF-ben.',
      '',
      'Üdvözlettel,',
      'Zodiacs Rent a Car',
    ].join('\n');
    const html = `<!doctype html>
      <div style="margin:0;padding:0;background:#f2f4f7;color:#0f172a;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
          <div style="border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);background:#ffffff;border:1px solid #e5e7eb;">
            <div style="padding:20px 22px;background:linear-gradient(135deg, #8ecae6 0%, #ffc933 100%);color:#ffffff;">
              <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">Zodiacs Rent a Car</div>
              <h1 style="margin:6px 0 4px;font-size:22px;font-weight:700;">${escapeHtml(subject)}</h1>
            </div>
            <div style="padding:22px;">
              <p style="margin:0 0 14px;color:#1f2937;">Kedves ${escapeHtml(contactName)},</p>
              <p style="margin:0 0 14px;color:#475569;">A foglaláshoz tartozó aktuális bérleti szerződést csatoltuk PDF-ben.</p>
              <table style="border-collapse:collapse;width:100%;font-size:14px;margin:4px 0 12px;">
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#f7f8fa;font-weight:600;color:#023047;width:38%;">Foglalás</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#ffffff;color:#1f2937;">${escapeHtml(bookingCode)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#f7f8fa;font-weight:600;color:#023047;width:38%;">Címzett</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#ffffff;color:#1f2937;">${escapeHtml(recipient)}</td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Üdvözlettel,<br/>Zodiacs Rent a Car</p>
            </div>
          </div>
        </div>
      </div>`;

    const transporter = await getTransporter();
    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: recipient,
      subject,
      text,
      html,
      replyTo: MAIL_USER ?? BOOKING_EMAIL_FROM,
      attachments: [
        {
          filename: `rental-agreement-${bookingCode}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (contract) {
      await db.bookingContract.update({
        where: { id: contract.id },
        data: { pdfSentAt: new Date() },
      });
      revalidatePath(`/bookings/${booking.id}/edit`);
    }

    return {
      success: `A szerződést elküldtük a kapcsolattartónak: ${recipient}`,
    };
  } catch (error) {
    console.error('sendCurrentBookingContractEmailAction', error);
    if (error instanceof Error && error.message.includes('PDF betűkészlet')) {
      return { error: error.message };
    }
    return {
      error: 'Nem sikerült elküldeni a szerződést. Próbáld meg később.',
    };
  }
};
