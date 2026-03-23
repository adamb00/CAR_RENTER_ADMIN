import { revalidatePath } from 'next/cache';

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
import {
  buildContractDataFromBooking,
  getContractRecipientFromBooking,
} from '@/lib/contract-data';
import {
  CONTRACT_COPY,
  type ContractLocale,
  resolveContractLocale,
} from '@/lib/contract-copy';
import {
  EmailSignatureBlock,
  buildEmailSignatureText,
  resolveEmailSignatureData,
} from '@/components/emails/email-signature';
import { stripContractTitle } from '@/lib/contract-invite';

type ContractDispatchEmailCopy = {
  subjectPrefix: string;
  greetingPrefix: string;
  signedLine: string;
  attachmentLine: string;
  closing: string;
  renterFallback: string;
};

type FinalizeBookingContractInput = {
  bookingId: string;
  signerName: string;
  renterSignatureData: string;
  lessorSignatureData: string;
  recipientEmail?: string | null;
  locale?: string | null;
  contractText?: string | null;
  successMessage?: string;
};

type FinalizeBookingContractResult = {
  success?: string;
  error?: string;
  bookingId?: string;
  bookingCode?: string;
  contractId?: string;
};

type BuildBookingContractPdfInput = {
  bookingId: string;
  signerName?: string | null;
  signedAt?: Date | null;
  renterSignatureDataUrl?: string | null;
  lessorSignatureDataUrl?: string | null;
  locale?: string | null;
  contractText: string;
};

const CONTRACT_DISPATCH_EMAIL_COPY: Record<
  ContractLocale,
  ContractDispatchEmailCopy
> = {
  en: {
    subjectPrefix: 'Rental agreement',
    greetingPrefix: 'Dear',
    signedLine: 'Your rental agreement has been signed.',
    attachmentLine: 'You can find the signed PDF in the attachment.',
    closing: 'Best regards,',
    renterFallback: 'Renter',
  },
  hu: {
    subjectPrefix: 'Bérleti szerződés',
    greetingPrefix: 'Kedves',
    signedLine: 'A bérleti szerződésed aláírásra került.',
    attachmentLine: 'A csatolmányban találod az aláírt PDF-et.',
    closing: 'Üdvözlettel,',
    renterFallback: 'Bérlő',
  },
  de: {
    subjectPrefix: 'Mietvertrag',
    greetingPrefix: 'Guten Tag',
    signedLine: 'Ihr Mietvertrag wurde unterzeichnet.',
    attachmentLine: 'Das unterschriebene PDF finden Sie im Anhang.',
    closing: 'Mit freundlichen Grüßen,',
    renterFallback: 'Mieter',
  },
  ro: {
    subjectPrefix: 'Contract de închiriere',
    greetingPrefix: 'Bună',
    signedLine: 'Contractul tău de închiriere a fost semnat.',
    attachmentLine: 'Găsești PDF-ul semnat în atașament.',
    closing: 'Cu stimă,',
    renterFallback: 'Chiriaș',
  },
  fr: {
    subjectPrefix: 'Contrat de location',
    greetingPrefix: 'Bonjour',
    signedLine: 'Votre contrat de location a été signé.',
    attachmentLine: 'Vous trouverez le PDF signé en pièce jointe.',
    closing: 'Cordialement,',
    renterFallback: 'Locataire',
  },
  es: {
    subjectPrefix: 'Contrato de alquiler',
    greetingPrefix: 'Hola',
    signedLine: 'Tu contrato de alquiler ha sido firmado.',
    attachmentLine: 'Encontrarás el PDF firmado en el archivo adjunto.',
    closing: 'Un saludo,',
    renterFallback: 'Arrendatario',
  },
  it: {
    subjectPrefix: 'Contratto di noleggio',
    greetingPrefix: 'Buongiorno',
    signedLine: 'Il tuo contratto di noleggio è stato firmato.',
    attachmentLine: 'Trovi il PDF firmato in allegato.',
    closing: 'Cordiali saluti,',
    renterFallback: 'Cliente',
  },
  sk: {
    subjectPrefix: 'Nájomná zmluva',
    greetingPrefix: 'Dobrý deň',
    signedLine: 'Vaša nájomná zmluva bola podpísaná.',
    attachmentLine: 'Podpísané PDF nájdete v prílohe.',
    closing: 'S pozdravom,',
    renterFallback: 'Nájomca',
  },
  cz: {
    subjectPrefix: 'Nájemní smlouva',
    greetingPrefix: 'Dobrý den',
    signedLine: 'Vaše nájemní smlouva byla podepsána.',
    attachmentLine: 'Podepsané PDF najdete v příloze.',
    closing: 'S pozdravem,',
    renterFallback: 'Nájemce',
  },
  se: {
    subjectPrefix: 'Hyresavtal',
    greetingPrefix: 'Hej',
    signedLine: 'Ditt hyresavtal har signerats.',
    attachmentLine: 'Du hittar den signerade PDF-filen i bilagan.',
    closing: 'Vänliga hälsningar,',
    renterFallback: 'Hyresgäst',
  },
  no: {
    subjectPrefix: 'Leieavtale',
    greetingPrefix: 'Hei',
    signedLine: 'Leieavtalen din er signert.',
    attachmentLine: 'Du finner den signerte PDF-filen i vedlegget.',
    closing: 'Med vennlig hilsen,',
    renterFallback: 'Leietaker',
  },
  dk: {
    subjectPrefix: 'Lejeaftale',
    greetingPrefix: 'Hej',
    signedLine: 'Din lejeaftale er underskrevet.',
    attachmentLine: 'Du finder den underskrevne PDF-fil i vedhæftningen.',
    closing: 'Med venlig hilsen,',
    renterFallback: 'Lejer',
  },
  pl: {
    subjectPrefix: 'Umowa najmu',
    greetingPrefix: 'Cześć',
    signedLine: 'Twoja umowa najmu została podpisana.',
    attachmentLine: 'Podpisany plik PDF znajdziesz w załączniku.',
    closing: 'Pozdrawiamy,',
    renterFallback: 'Najemca',
  },
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const resolveRecipient = (booking: Awaited<ReturnType<typeof getBookingById>>) =>
  booking ? getContractRecipientFromBooking(booking) : null;

const buildRenderData = async (
  booking: NonNullable<Awaited<ReturnType<typeof getBookingById>>>,
  signedAt: Date,
  localeOverride?: string | null,
) => {
  const vehicleId =
    booking.assignedFleetVehicleId ?? booking.payload?.assignedFleetVehicleId;
  const vehicle = vehicleId
    ? await db.fleetVehicle.findUnique({
        where: { id: vehicleId },
        select: { plate: true },
      })
    : null;

  const contractData = buildContractDataFromBooking(booking, vehicle);
  const locale = localeOverride ?? booking.locale ?? booking.payload?.locale ?? null;
  const template = buildContractTemplate(contractData, {
    signedAt,
    locale,
  });

  return {
    contractData,
    locale,
    template,
  };
};

export const buildBookingContractPdf = async ({
  bookingId,
  signerName,
  signedAt,
  renterSignatureDataUrl,
  lessorSignatureDataUrl,
  locale,
  contractText,
}: BuildBookingContractPdfInput) => {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new Error('A foglalás nem található.');
  }

  const renderData = await buildRenderData(
    booking,
    signedAt ?? new Date(),
    locale ?? booking.locale ?? booking.payload?.locale ?? null,
  );

  return buildContractPdf({
    template: renderData.template,
    contractText: stripContractTitle(contractText),
    signerName: signerName ?? null,
    signedAt: signedAt ?? null,
    renterSignatureDataUrl: renterSignatureDataUrl ?? '',
    lessorSignatureDataUrl: lessorSignatureDataUrl ?? '',
    locale: renderData.locale,
  });
};

export const finalizeBookingContract = async ({
  bookingId,
  signerName,
  renterSignatureData,
  lessorSignatureData,
  recipientEmail,
  locale,
  contractText,
  successMessage,
}: FinalizeBookingContractInput): Promise<FinalizeBookingContractResult> => {
  const trimmedBookingId = bookingId.trim();
  const trimmedSignerName = signerName.trim();

  if (!renterSignatureData.startsWith('data:image/')) {
    return { error: 'A bérlő aláírásának formátuma nem megfelelő.' };
  }

  if (!lessorSignatureData.startsWith('data:image/')) {
    return { error: 'A bérbeadó aláírásának formátuma nem megfelelő.' };
  }

  const booking = await getBookingById(trimmedBookingId);
  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const resolvedRecipient = recipientEmail?.trim() || resolveRecipient(booking);
  if (!resolvedRecipient) {
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

  const signedAt = new Date();
  const renderData = await buildRenderData(booking, signedAt, locale);
  const resolvedLocale = resolveContractLocale(renderData.locale);
  const snapshotText = contractText?.trim() || formatContractText(renderData.template);
  const contractBodyText = stripContractTitle(snapshotText);
  const renterName = renderData.contractData.renterName ?? booking.contactName;
  const emailCopy = CONTRACT_DISPATCH_EMAIL_COPY[resolvedLocale];
  const renterDisplayName = renterName?.trim() || emailCopy.renterFallback;
  const greetingLine = `${emailCopy.greetingPrefix} ${renterDisplayName},`;

  let contractId: string | null = null;
  try {
    const created = await db.bookingContract.create({
      data: {
        bookingId: booking.id,
        signerName: trimmedSignerName,
        signerEmail: resolvedRecipient,
        contractVersion: CONTRACT_VERSION,
        contractText: snapshotText,
        signatureData: renterSignatureData,
        lessorSignatureData,
        signedAt,
      },
      select: { id: true },
    });
    contractId = created.id;

    const pdfBuffer = await buildContractPdf({
      template: renderData.template,
      contractText: contractBodyText,
      signerName: trimmedSignerName,
      signedAt,
      renterSignatureDataUrl: renterSignatureData,
      lessorSignatureDataUrl: lessorSignatureData,
      locale: resolvedLocale,
    });

    const transporter = await getTransporter();
    const bookingCode = booking.humanId ?? booking.id;
    const subject = `${emailCopy.subjectPrefix} (${bookingCode})`;
    const signatureData = resolveEmailSignatureData({
      signerName: trimmedSignerName,
      locale: resolvedLocale,
    });
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const signatureHtml = renderToStaticMarkup(
      createElement(
        'table',
        {
          role: 'presentation',
          width: '100%',
          cellPadding: 0,
          cellSpacing: 0,
          style: { borderCollapse: 'collapse', marginTop: 16 },
        },
        createElement(EmailSignatureBlock, { data: signatureData }),
      ),
    );
    const text = [
      greetingLine,
      '',
      emailCopy.signedLine,
      emailCopy.attachmentLine,
      '',
      emailCopy.closing,
      buildEmailSignatureText(signatureData),
    ].join('\n');
    const html = `<!doctype html>
      <div style="margin:0;padding:0;background:#f2f4f7;color:#0f172a;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
          <div style="border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);background:#ffffff;border:1px solid #e5e7eb;">
            <div style="padding:20px 22px;background:linear-gradient(135deg, #8ecae6 0%, #ffc933 100%);color:#ffffff;">
              <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">Zodiacs Rent a Car</div>
              <h1 style="margin:6px 0 4px;font-size:22px;font-weight:700;">${escapeHtml(subject)}</h1>
              <p style="margin:0;font-size:14px;opacity:0.95;">${escapeHtml(emailCopy.signedLine)}</p>
            </div>
            <div style="padding:22px 22px 10px;">
              <p style="margin:0 0 14px;color:#1f2937;">${escapeHtml(greetingLine)}</p>
              <p style="margin:0 0 14px;color:#475569;">${escapeHtml(emailCopy.attachmentLine)}</p>
              <table style="border-collapse:collapse;width:100%;font-size:14px;margin:4px 0 12px;">
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#f7f8fa;font-weight:600;color:#023047;width:38%;">${escapeHtml(CONTRACT_COPY[resolvedLocale].detailLabels.bookingId)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#ffffff;color:#1f2937;">${escapeHtml(bookingCode)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#f7f8fa;font-weight:600;color:#023047;width:38%;">${escapeHtml(CONTRACT_COPY[resolvedLocale].detailLabels.renterName)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#ffffff;color:#1f2937;">${escapeHtml(trimmedSignerName)}</td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${escapeHtml(emailCopy.closing)}</p>
              <div style="margin-top:16px;">
                ${signatureHtml}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: resolvedRecipient,
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

    await db.rentRequests.update({
      where: { id: booking.id },
      data: {
        updatedAt: new Date(),
      },
    });
    await db.$executeRaw`
      UPDATE "RentRequests"
      SET "signerName" = ${trimmedSignerName}
      WHERE "id" = ${booking.id}::uuid
    `;

    await db.bookingContract.update({
      where: { id: created.id },
      data: { pdfSentAt: new Date() },
    });

    revalidatePath(`/bookings/${booking.id}/contract`);
    revalidatePath(`/bookings/${booking.id}/carout`);
    revalidatePath(`/bookings/${booking.id}/edit`);
    revalidatePath(`/${booking.id}`);

    return {
      success: successMessage ?? 'A szerződés elmentve és elküldve.',
      bookingCode,
      bookingId: booking.id,
      contractId: created.id,
    };
  } catch (error) {
    console.error('finalizeBookingContract error', error);
    if (error instanceof Error && error.message.includes('PDF betűkészlet')) {
      return { error: error.message };
    }
    if (contractId) {
      try {
        await db.bookingContract.delete({ where: { id: contractId } });
      } catch (cleanupError) {
        console.error('finalizeBookingContract cleanup', cleanupError);
      }
    }
    return {
      error: 'Nem sikerült létrehozni a szerződést. Próbáld meg később.',
    };
  }
};
