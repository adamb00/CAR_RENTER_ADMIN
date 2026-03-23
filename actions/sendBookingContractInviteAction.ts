'use server';

import { z } from 'zod';

import {
  EmailSignatureBlock,
  buildEmailSignatureText,
  resolveEmailSignatureData,
} from '@/components/emails/email-signature';
import { getBookingById } from '@/data-service/bookings';
import { db } from '@/lib/db';
import { BOOKING_EMAIL_FROM, TAKE_OPTION_VALUES } from '@/lib/constants';
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
import {
  CONTRACT_COPY,
  type ContractLocale,
  resolveContractLocale,
} from '@/lib/contract-copy';
import {
  buildContractDataFromBooking,
  getContractRecipientFromBooking,
} from '@/lib/contract-data';
import {
  buildLocalizedContractInviteUrl,
  createContractInviteToken,
  hashContractInviteToken,
  resolveContractInviteExpiry,
} from '@/lib/contract-invite';
import { revalidatePath } from 'next/cache';

const sendBookingContractInviteSchema = z.object({
  bookingId: z.string().min(1),
  signerName: z.string().min(1),
  lessorSignerName: z.enum(TAKE_OPTION_VALUES),
  lessorSignatureData: z.string().optional(),
});

type SendBookingContractInviteResult = {
  success?: string;
  error?: string;
};

type ContractInviteEmailCopy = {
  subject: string;
  greetingPrefix: string;
  intro: string;
  description: string;
  cta: string;
  footerNote: string;
  closing: string;
  renterFallback: string;
};

const CONTRACT_INVITE_EMAIL_COPY: Record<
  ContractLocale,
  ContractInviteEmailCopy
> = {
  en: {
    subject: 'Rental agreement signature request',
    greetingPrefix: 'Dear',
    intro: 'Your rental agreement is ready for review and signature.',
    description:
      'Open the link below to read the agreement, download it, sign it, and send it back to us.',
    cta: 'Open agreement',
    footerNote:
      'If the button does not open directly, copy the link below into your browser.',
    closing: 'Best regards,',
    renterFallback: 'Renter',
  },
  hu: {
    subject: 'Bérleti szerződés aláírása',
    greetingPrefix: 'Kedves',
    intro: 'A bérleti szerződésed elkészült, és aláírásra vár.',
    description:
      'Az alábbi linken meg tudod nyitni, el tudod olvasni, le tudod tölteni, alá tudod írni, majd vissza tudod küldeni.',
    cta: 'Szerződés megnyitása',
    footerNote:
      'Ha a gomb nem nyílik meg közvetlenül, másold be az alábbi linket a böngésződbe.',
    closing: 'Üdvözlettel,',
    renterFallback: 'Bérlő',
  },
  de: {
    subject: 'Mietvertrag zur Unterschrift',
    greetingPrefix: 'Guten Tag',
    intro: 'Ihr Mietvertrag ist bereit zur Prüfung und Unterschrift.',
    description:
      'Öffnen Sie den folgenden Link, um den Vertrag zu lesen, herunterzuladen, zu unterschreiben und an uns zurückzusenden.',
    cta: 'Vertrag öffnen',
    footerNote:
      'Falls die Schaltfläche nicht direkt funktioniert, kopieren Sie den folgenden Link in Ihren Browser.',
    closing: 'Mit freundlichen Grüßen,',
    renterFallback: 'Mieter',
  },
  ro: {
    subject: 'Contract de închiriere pentru semnare',
    greetingPrefix: 'Bună',
    intro:
      'Contractul tău de închiriere este pregătit pentru verificare și semnare.',
    description:
      'Deschide linkul de mai jos pentru a citi contractul, a-l descărca, semna și trimite înapoi.',
    cta: 'Deschide contractul',
    footerNote:
      'Dacă butonul nu se deschide direct, copiază linkul de mai jos în browser.',
    closing: 'Cu stimă,',
    renterFallback: 'Chiriaș',
  },
  fr: {
    subject: 'Contrat de location à signer',
    greetingPrefix: 'Bonjour',
    intro: 'Votre contrat de location est prêt à être consulté et signé.',
    description:
      'Ouvrez le lien ci-dessous pour lire le contrat, le télécharger, le signer et nous le renvoyer.',
    cta: 'Ouvrir le contrat',
    footerNote:
      "Si le bouton ne s'ouvre pas directement, copiez le lien ci-dessous dans votre navigateur.",
    closing: 'Cordialement,',
    renterFallback: 'Locataire',
  },
  es: {
    subject: 'Contrato de alquiler para firmar',
    greetingPrefix: 'Hola',
    intro: 'Tu contrato de alquiler está listo para revisarlo y firmarlo.',
    description:
      'Abre el siguiente enlace para leer el contrato, descargarlo, firmarlo y devolvérnoslo.',
    cta: 'Abrir contrato',
    footerNote:
      'Si el botón no se abre directamente, copia el siguiente enlace en tu navegador.',
    closing: 'Un saludo,',
    renterFallback: 'Arrendatario',
  },
  it: {
    subject: 'Contratto di noleggio da firmare',
    greetingPrefix: 'Buongiorno',
    intro:
      'Il tuo contratto di noleggio è pronto per essere visionato e firmato.',
    description:
      'Apri il link qui sotto per leggere il contratto, scaricarlo, firmarlo e rimandarcelo.',
    cta: 'Apri contratto',
    footerNote:
      'Se il pulsante non si apre direttamente, copia il link qui sotto nel browser.',
    closing: 'Cordiali saluti,',
    renterFallback: 'Cliente',
  },
  sk: {
    subject: 'Nájomná zmluva na podpis',
    greetingPrefix: 'Dobrý deň',
    intro: 'Vaša nájomná zmluva je pripravená na kontrolu a podpis.',
    description:
      'Otvorte nasledujúci odkaz, aby ste si zmluvu prečítali, stiahli, podpísali a poslali späť.',
    cta: 'Otvoriť zmluvu',
    footerNote:
      'Ak sa tlačidlo neotvorí priamo, skopírujte nasledujúci odkaz do prehliadača.',
    closing: 'S pozdravom,',
    renterFallback: 'Nájomca',
  },
  cz: {
    subject: 'Nájemní smlouva k podpisu',
    greetingPrefix: 'Dobrý den',
    intro: 'Vaše nájemní smlouva je připravena ke kontrole a podpisu.',
    description:
      'Otevřete následující odkaz, přečtěte si smlouvu, stáhněte ji, podepište a odešlete zpět.',
    cta: 'Otevřít smlouvu',
    footerNote:
      'Pokud se tlačítko neotevře přímo, zkopírujte následující odkaz do prohlížeče.',
    closing: 'S pozdravem,',
    renterFallback: 'Nájemce',
  },
  se: {
    subject: 'Hyresavtal för signering',
    greetingPrefix: 'Hej',
    intro: 'Ditt hyresavtal är klart för granskning och signering.',
    description:
      'Öppna länken nedan för att läsa avtalet, ladda ner det, signera det och skicka tillbaka det till oss.',
    cta: 'Öppna avtalet',
    footerNote:
      'Om knappen inte öppnas direkt, kopiera länken nedan till din webbläsare.',
    closing: 'Vänliga hälsningar,',
    renterFallback: 'Hyresgäst',
  },
  no: {
    subject: 'Leieavtale for signering',
    greetingPrefix: 'Hei',
    intro: 'Leieavtalen din er klar for gjennomgang og signering.',
    description:
      'Åpne lenken nedenfor for å lese avtalen, laste den ned, signere den og sende den tilbake til oss.',
    cta: 'Åpne avtalen',
    footerNote:
      'Hvis knappen ikke åpnes direkte, kopier lenken nedenfor inn i nettleseren din.',
    closing: 'Med vennlig hilsen,',
    renterFallback: 'Leietaker',
  },
  dk: {
    subject: 'Lejeaftale til underskrift',
    greetingPrefix: 'Hej',
    intro: 'Din lejeaftale er klar til gennemgang og underskrift.',
    description:
      'Åbn linket nedenfor for at læse aftalen, downloade den, underskrive den og sende den tilbage til os.',
    cta: 'Åbn aftalen',
    footerNote:
      'Hvis knappen ikke åbner direkte, kan du kopiere linket nedenfor ind i din browser.',
    closing: 'Med venlig hilsen,',
    renterFallback: 'Lejer',
  },
  pl: {
    subject: 'Umowa najmu do podpisu',
    greetingPrefix: 'Cześć',
    intro: 'Twoja umowa najmu jest gotowa do sprawdzenia i podpisu.',
    description:
      'Otwórz poniższy link, aby przeczytać umowę, pobrać ją, podpisać i odesłać do nas.',
    cta: 'Otwórz umowę',
    footerNote:
      'Jeśli przycisk nie otwiera się bezpośrednio, skopiuj poniższy link do przeglądarki.',
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

export const sendBookingContractInviteAction = async (
  input: z.infer<typeof sendBookingContractInviteSchema>,
): Promise<SendBookingContractInviteResult> => {
  const parsed = sendBookingContractInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen adatok, kérjük ellenőrizd a mezőket.' };
  }

  const data = parsed.data;
  const lessorSignatureData = data.lessorSignatureData?.trim() || null;
  if (lessorSignatureData && !lessorSignatureData.startsWith('data:image/')) {
    return { error: 'A bérbeadó aláírásának formátuma nem megfelelő.' };
  }

  const booking = await getBookingById(data.bookingId.trim());
  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const recipient = getContractRecipientFromBooking(booking);
  if (!recipient) {
    return { error: 'Ehhez a foglaláshoz nincs megadható e-mail cím.' };
  }

  if (!hasMailerConfig() || !BOOKING_FROM_ADDRESS) {
    return {
      error:
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const existingContract = await db.bookingContract.findUnique({
    where: { bookingId: booking.id },
    select: { id: true },
  });
  if (existingContract) {
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

  const locale = booking.locale ?? booking.payload?.locale ?? null;
  const resolvedLocale = resolveContractLocale(locale);
  const contractData = buildContractDataFromBooking(booking, vehicle);
  const template = buildContractTemplate(contractData, {
    signedAt: new Date(),
    locale,
  });
  const contractText = formatContractText(template);
  const token = createContractInviteToken();
  const tokenHash = hashContractInviteToken(token);
  const inviteUrl = buildLocalizedContractInviteUrl(token, locale);
  const signerName = data.signerName.trim();
  const lessorSignerName = data.lessorSignerName.trim();

  let inviteId: string | null = null;
  try {
    const created = await db.$transaction(async (tx) => {
      await tx.bookingContractInvite.updateMany({
        where: {
          bookingId: booking.id,
          completedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return tx.bookingContractInvite.create({
        data: {
          bookingId: booking.id,
          tokenHash,
          recipientEmail: recipient,
          signerName,
          locale,
          contractVersion: CONTRACT_VERSION,
          contractText,
          ...(lessorSignatureData
            ? { lessorSignatureData }
            : {}),
          expiresAt: resolveContractInviteExpiry(),
        },
        select: { id: true },
      });
    });
    inviteId = created.id;

    const signatureData = resolveEmailSignatureData({
      signerName: lessorSignerName,
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

    const renterName = contractData.renterName?.trim() || booking.contactName;
    const bookingCode = booking.humanId ?? booking.id;
    const copy = CONTRACT_INVITE_EMAIL_COPY[resolvedLocale];
    const contractCopy = CONTRACT_COPY[resolvedLocale];
    const renterDisplayName = renterName || copy.renterFallback;
    const subject = `${copy.subject} (${bookingCode})`;
    const text = [
      `${copy.greetingPrefix} ${renterDisplayName},`,
      '',
      copy.intro,
      copy.description,
      '',
      inviteUrl,
      '',
      copy.footerNote,
      '',
      copy.closing,
      buildEmailSignatureText(signatureData),
    ].join('\n');
    const html = `<!doctype html>
      <div style="margin:0;padding:0;background:#f2f4f7;color:#0f172a;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
          <div style="border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);background:#ffffff;border:1px solid #e5e7eb;">
            <div style="padding:20px 22px;background:linear-gradient(135deg, #8ecae6 0%, #ffc933 100%);color:#ffffff;">
              <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">Zodiacs Rent a Car</div>
              <h1 style="margin:6px 0 4px;font-size:22px;font-weight:700;">${escapeHtml(copy.subject)}</h1>
              <p style="margin:0;font-size:14px;opacity:0.95;">${escapeHtml(copy.intro)}</p>
            </div>
            <div style="padding:22px 22px 10px;">
              <p style="margin:0 0 14px;color:#1f2937;">${escapeHtml(copy.greetingPrefix)} ${escapeHtml(
                renterDisplayName,
              )},</p>
              <p style="margin:0 0 14px;color:#475569;">${escapeHtml(copy.description)}</p>
              <table style="border-collapse:collapse;width:100%;font-size:14px;margin:4px 0 12px;">
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#f7f8fa;font-weight:600;color:#023047;width:38%;">${escapeHtml(contractCopy.detailLabels.bookingId)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#ffffff;color:#1f2937;">${escapeHtml(bookingCode)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#f7f8fa;font-weight:600;color:#023047;width:38%;">${escapeHtml(contractCopy.detailLabels.renterEmail)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e6e7e9;background:#ffffff;color:#1f2937;">${escapeHtml(recipient)}</td>
                </tr>
              </table>
              <div style="margin:18px 0 12px;">
                <a
                  href="${escapeHtml(inviteUrl)}"
                  style="display:inline-block;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg, #ffc933 0%, #8ecae6 100%);color:#ffffff;font-weight:700;text-decoration:none;"
                >
                  ${escapeHtml(copy.cta)}
                </a>
              </div>
              <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${escapeHtml(copy.footerNote)}</p>
              <p style="margin:12px 0 0;word-break:break-all;color:#475569;">${escapeHtml(inviteUrl)}</p>
              <div style="margin-top:16px;">
                ${signatureHtml}
              </div>
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
    });
  } catch (error) {
    console.error('sendBookingContractInviteAction', error);
    if (inviteId) {
      try {
        await db.bookingContractInvite.delete({
          where: { id: inviteId },
        });
      } catch (cleanupError) {
        console.error('sendBookingContractInviteAction cleanup', cleanupError);
      }
    }
    return {
      error: 'Nem sikerült kiküldeni az aláírási linket. Próbáld meg később.',
    };
  }

  revalidatePath(`/bookings/${booking.id}/contract`);
  revalidatePath(`/bookings/${booking.id}/edit`);

  return {
    success: 'Az aláírási linket elküldtük a bérlőnek.',
  };
};
