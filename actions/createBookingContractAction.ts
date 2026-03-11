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

type ContractDispatchEmailCopy = {
  greetingPrefix: string;
  signedLine: string;
  attachmentLine: string;
  closing: string;
  renterFallback: string;
};

const CONTRACT_DISPATCH_EMAIL_COPY: Record<ContractLocale, ContractDispatchEmailCopy> = {
  en: {
    greetingPrefix: 'Dear',
    signedLine: 'Your rental agreement has been signed.',
    attachmentLine: 'You can find the signed PDF in the attachment.',
    closing: 'Best regards,',
    renterFallback: 'Renter',
  },
  hu: {
    greetingPrefix: 'Kedves',
    signedLine: 'A bérleti szerződésed aláírásra került.',
    attachmentLine: 'A csatolmányban találod az aláírt PDF-et.',
    closing: 'Üdvözlettel,',
    renterFallback: 'Bérlő',
  },
  de: {
    greetingPrefix: 'Guten Tag',
    signedLine: 'Ihr Mietvertrag wurde unterzeichnet.',
    attachmentLine: 'Das unterschriebene PDF finden Sie im Anhang.',
    closing: 'Mit freundlichen Grüßen,',
    renterFallback: 'Mieter',
  },
  ro: {
    greetingPrefix: 'Bună',
    signedLine: 'Contractul tău de închiriere a fost semnat.',
    attachmentLine: 'Găsești PDF-ul semnat în atașament.',
    closing: 'Cu stimă,',
    renterFallback: 'Chiriaș',
  },
  fr: {
    greetingPrefix: 'Bonjour',
    signedLine: 'Votre contrat de location a été signé.',
    attachmentLine: 'Vous trouverez le PDF signé en pièce jointe.',
    closing: 'Cordialement,',
    renterFallback: 'Locataire',
  },
  es: {
    greetingPrefix: 'Hola',
    signedLine: 'Tu contrato de alquiler ha sido firmado.',
    attachmentLine: 'Encontrarás el PDF firmado en el archivo adjunto.',
    closing: 'Un saludo,',
    renterFallback: 'Arrendatario',
  },
  it: {
    greetingPrefix: 'Buongiorno',
    signedLine: 'Il tuo contratto di noleggio è stato firmato.',
    attachmentLine: 'Trovi il PDF firmato in allegato.',
    closing: 'Cordiali saluti,',
    renterFallback: 'Cliente',
  },
  sk: {
    greetingPrefix: 'Dobrý deň',
    signedLine: 'Vaša nájomná zmluva bola podpísaná.',
    attachmentLine: 'Podpísané PDF nájdete v prílohe.',
    closing: 'S pozdravom,',
    renterFallback: 'Nájomca',
  },
  cz: {
    greetingPrefix: 'Dobrý den',
    signedLine: 'Vaše nájemní smlouva byla podepsána.',
    attachmentLine: 'Podepsané PDF najdete v příloze.',
    closing: 'S pozdravem,',
    renterFallback: 'Nájemce',
  },
  se: {
    greetingPrefix: 'Hej',
    signedLine: 'Ditt hyresavtal har signerats.',
    attachmentLine: 'Du hittar den signerade PDF-filen i bilagan.',
    closing: 'Vänliga hälsningar,',
    renterFallback: 'Hyresgäst',
  },
  no: {
    greetingPrefix: 'Hei',
    signedLine: 'Leieavtalen din er signert.',
    attachmentLine: 'Du finner den signerte PDF-filen i vedlegget.',
    closing: 'Med vennlig hilsen,',
    renterFallback: 'Leietaker',
  },
  dk: {
    greetingPrefix: 'Hej',
    signedLine: 'Din lejeaftale er underskrevet.',
    attachmentLine: 'Du finder den underskrevne PDF-fil i vedhæftningen.',
    closing: 'Med venlig hilsen,',
    renterFallback: 'Lejer',
  },
  pl: {
    greetingPrefix: 'Cześć',
    signedLine: 'Twoja umowa najmu została podpisana.',
    attachmentLine: 'Podpisany plik PDF znajdziesz w załączniku.',
    closing: 'Pozdrawiamy,',
    renterFallback: 'Najemca',
  },
};

const toBilingualText = (
  locale: ContractLocale,
  english: string,
  localized: string,
) => (locale === 'en' ? english : `${english}\n${localized}`);

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const toBilingualHtml = (
  locale: ContractLocale,
  english: string,
  localized: string,
) => {
  if (locale === 'en') {
    return `<p style="margin:0 0 14px;">${escapeHtml(english)}</p>`;
  }
  return `<p style="margin:0 0 14px;">
    <span style="font-weight:600; color:#0f172a;">${escapeHtml(english)}</span><br/>
    <span style="color:#334155;">${escapeHtml(localized)}</span>
  </p>`;
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
  const locale = resolveContractLocale(
    booking.locale ?? booking.payload?.locale ?? null,
  );
  const emailCopy = CONTRACT_DISPATCH_EMAIL_COPY[locale];
  const renterDisplayName = renterName?.trim() || emailCopy.renterFallback;
  const englishGreetingLine = `Dear ${renterDisplayName},`;
  const localizedGreetingLine = `${emailCopy.greetingPrefix} ${renterDisplayName},`;
  const englishSignedLine = 'Your rental agreement has been signed.';
  const englishAttachmentLine = 'You can find the signed PDF in the attachment.';
  const englishClosingLine = 'Best regards,';

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
      locale,
    });

    const transporter = await getTransporter();
    const bookingCode = booking.humanId ?? booking.id;
    const subject =
      locale === 'en'
        ? `Rental agreement (${bookingCode})`
        : `Rental agreement / ${CONTRACT_COPY[locale].title} (${bookingCode})`;
    const signatureData = resolveEmailSignatureData({
      signerName: data.signerName,
      locale,
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
      toBilingualText(locale, englishGreetingLine, localizedGreetingLine),
      '',
      toBilingualText(locale, englishSignedLine, emailCopy.signedLine),
      toBilingualText(locale, englishAttachmentLine, emailCopy.attachmentLine),
      '',
      toBilingualText(locale, englishClosingLine, emailCopy.closing),
      buildEmailSignatureText(signatureData),
    ].join('\n');
    const html = `<!doctype html>
      <div style="margin:0; padding:24px; background:#f8fafc;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:22px; font-family:Arial, sans-serif; font-size:14px; line-height:1.6; color:#0f172a;">
          ${toBilingualHtml(locale, englishGreetingLine, localizedGreetingLine)}
          ${toBilingualHtml(locale, englishSignedLine, emailCopy.signedLine)}
          ${toBilingualHtml(locale, englishAttachmentLine, emailCopy.attachmentLine)}
          ${toBilingualHtml(locale, englishClosingLine, emailCopy.closing)}
          ${signatureHtml}
        </div>
      </div>`;

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

    await db.rentRequests.update({
      where: { id: booking.id },
      data: {
        updatedAt: new Date(),
      },
    });
    await db.$executeRaw`
      UPDATE "RentRequests"
      SET "signerName" = ${data.signerName.trim()}
      WHERE "id" = ${booking.id}::uuid
    `;

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
