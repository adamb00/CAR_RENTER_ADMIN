'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type SendBookingRequestEmailInput = {
  quoteId: string;
  email: string | null | undefined;
  name?: string | null;
  locale?: string | null;
  carId?: string | null;
  carName?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalFee?: string;
  deposit?: string;
  insurance?: string;
  deliveryFee?: string;
  extrasFee?: string;
  adminName?: string | null;
};

type SendBookingRequestEmailResult = {
  success?: string;
  error?: string;
};

type EmailCopy = {
  subject: string;
  greeting: (name?: string | null) => string;
  thankYou: string;
  instructions: string;
  cta: string;
  signature: string;
  successMessage?: string;
};

const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = Number(process.env.MAIL_PORT ?? 0);
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;
const BOOKING_EMAIL_FROM =
  process.env.BOOKING_EMAIL_FROM ??
  process.env.EMAIL_FROM ??
  process.env.MAIL_USER;
const QUOTE_PROCESSED_STATUS = 'answered';
const LOGO_URL =
  process.env.BOOKING_EMAIL_LOGO_URL ||
  process.env.LOGO_URL ||
  'https://zodiacsrentacar.com/logo_white.png';
const BRAND = {
  sky: '#8ecae6',
  blue: '#219ebc',
  navy: '#023047',
  navyLight: '#234f63',
  amber: '#ffb703',
  orange: '#fb8500',
  background: '#f7f9fb',
};
const formatFromAddress = () => {
  const from = BOOKING_EMAIL_FROM?.trim();
  if (from && from.includes('@')) return from;
  if (from && MAIL_USER) return `"${from}" <${MAIL_USER}>`;
  return MAIL_USER;
};
const BOOKING_FROM_ADDRESS = formatFromAddress();
let cachedLogoDataUrl: string | null | undefined;
const getLogoDataUrl = async () => {
  // Prefer an external hosted logo so clients don't block large inline images.
  if (LOGO_URL) return LOGO_URL;
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;

  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');

  const logoPaths = ['logo_white.png', 'logo_black.png'].map((file) =>
    join(process.cwd(), 'public', file)
  );

  for (const logoPath of logoPaths) {
    try {
      const buffer = readFileSync(logoPath);
      cachedLogoDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      return cachedLogoDataUrl;
    } catch (error) {
      console.error(
        'sendBookingRequestEmailAction logo load failed',
        logoPath,
        error
      );
    }
  }

  cachedLogoDataUrl = null;
  return cachedLogoDataUrl;
};

const formatPrice = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return `${trimmed} €`;
};

const ADMIN_SIGNATURE = {
  company: 'ZODIACS Rent a Car',
  phone: '+34 683 192 422',
  email: 'info@zodiacsrentacar.com',
  website: 'https://zodiacsrentacar.com',
  locations: 'Fuerteventura & Lanzarote',
};

const LOCALIZED_STATIC: Record<
  string,
  {
    rentalFeeLabel: string;
    depositLabel: string;
    insuranceLabel: string;
    insuranceNote: string;
    fallbackLink: string;
    adminTitle: string;
    slogans: string[];
    extrasNote: string;
    extrasLabel: string;
    deliveryFeeLabel: string;
    extrasFeeLabel: string;
    daysSuffix: string;
    deliveryNote: string;
  }
> = {
  en: {
    rentalFeeLabel: 'Rental fee',
    depositLabel: 'Deposit',
    insuranceLabel: 'Full coverage insurance',
    insuranceNote: 'If you choose full coverage, no deposit is required.',
    fallbackLink: 'If the button above does not work, open this link:',
    adminTitle: 'Rental Operations Advisor',
    slogans: ['Freedom leads.', 'Comfort follows.'],
    extrasNote: 'Selecting extras may incur additional costs.',
    extrasLabel: 'Other costs',
    deliveryFeeLabel: 'Delivery fee',
    extrasFeeLabel: 'Extras fee',
    daysSuffix: 'days',
    deliveryNote:
      'You can request delivery to your preferred location (e.g. airport or hotel).',
  },
  hu: {
    rentalFeeLabel: 'Bérleti díj',
    depositLabel: 'Kaució',
    insuranceLabel: 'Teljes körű biztosítás',
    insuranceNote:
      'Ha teljes körű biztosítással szeretné az autót, nincs szükség kaucióra.',
    fallbackLink: 'Ha a fenti gomb nem működik, nyisd meg ezt a linket:',
    adminTitle: 'Autóbérlési tanácsadó',
    slogans: ['A szabadság vezet.', 'A kényelem elkísér.'],
    extrasNote: 'Az extrák kiválasztásakor további költségek merülhetnek fel.',
    extrasLabel: 'Egyéb költségek',
    deliveryFeeLabel: 'Kiszállítás díja',
    extrasFeeLabel: 'Extrák díja',
    daysSuffix: 'napra',
    deliveryNote:
      'Kérheted az autó kiszállítását a választott helyszínre (pl. reptérre vagy szállásra).',
  },
  de: {
    rentalFeeLabel: 'Mietpreis',
    depositLabel: 'Kaution',
    insuranceLabel: 'Vollkaskoversicherung',
    insuranceNote: 'Wenn Sie Vollkasko wählen, ist keine Kaution nötig.',
    fallbackLink:
      'Wenn die Schaltfläche nicht funktioniert, öffnen Sie diesen Link:',
    adminTitle: 'Mietwagenberater',
    slogans: ['Freiheit führt.', 'Komfort begleitet.'],
    extrasNote:
      'Bei der Auswahl von Extras können zusätzliche Kosten anfallen.',
    extrasLabel: 'Weitere Kosten',
    deliveryFeeLabel: 'Liefergebühr',
    extrasFeeLabel: 'Aufpreis für Extras',
    daysSuffix: 'Tage',
    deliveryNote:
      'Du kannst das Auto an deinen Wunschort liefern lassen (z. B. Flughafen oder Unterkunft).',
  },
  ro: {
    rentalFeeLabel: 'Taxă de închiriere',
    depositLabel: 'Depozit',
    insuranceLabel: 'Asigurare completă',
    insuranceNote:
      'Dacă alegeți asigurare completă, nu este necesară garanție.',
    fallbackLink: 'Dacă butonul nu funcționează, deschideți acest link:',
    adminTitle: 'Consilier operațiuni închirieri',
    slogans: ['Libertatea te conduce.', 'Confortul te însoțește.'],
    extrasNote:
      'La selectarea extraopțiunilor pot apărea costuri suplimentare.',
    extrasLabel: 'Costuri suplimentare',
    deliveryFeeLabel: 'Taxă de livrare',
    extrasFeeLabel: 'Taxă pentru extraopțiuni',
    daysSuffix: 'zile',
    deliveryNote:
      'Poți solicita livrarea mașinii la locația dorită (de ex. aeroport sau cazare).',
  },
  fr: {
    rentalFeeLabel: 'Frais de location',
    depositLabel: 'Caution',
    insuranceLabel: 'Assurance tous risques',
    insuranceNote:
      "Si vous choisissez l'assurance complète, aucune caution n'est requise.",
    fallbackLink: 'Si le bouton ne fonctionne pas, ouvrez ce lien :',
    adminTitle: 'Conseiller opérations de location',
    slogans: ['La liberté vous conduit.', 'Le confort vous accompagne.'],
    extrasNote:
      'Le choix des options peut entraîner des coûts supplémentaires.',
    extrasLabel: 'Autres coûts',
    deliveryFeeLabel: 'Frais de livraison',
    extrasFeeLabel: 'Frais des options',
    daysSuffix: 'jours',
    deliveryNote:
      "Vous pouvez demander la livraison de la voiture à l'endroit de votre choix (ex. aéroport ou hébergement).",
  },
  es: {
    rentalFeeLabel: 'Tarifa de alquiler',
    depositLabel: 'Depósito',
    insuranceLabel: 'Seguro a todo riesgo',
    insuranceNote: 'Si eliges cobertura total, no se requiere depósito.',
    fallbackLink: 'Si el botón no funciona, abre este enlace:',
    adminTitle: 'Asesor de operaciones de alquiler',
    slogans: ['La libertad te conduce.', 'La comodidad te acompaña.'],
    extrasNote: 'Elegir extras puede generar costes adicionales.',
    extrasLabel: 'Costes adicionales',
    deliveryFeeLabel: 'Tarifa de entrega',
    extrasFeeLabel: 'Coste de extras',
    daysSuffix: 'días',
    deliveryNote:
      'Puedes solicitar la entrega del coche en el lugar que prefieras (p. ej., aeropuerto o alojamiento).',
  },
  it: {
    rentalFeeLabel: 'Tariffa di noleggio',
    depositLabel: 'Deposito',
    insuranceLabel: 'Assicurazione completa',
    insuranceNote: 'Se scegli la copertura completa, non è richiesto deposito.',
    fallbackLink: 'Se il pulsante non funziona, apri questo link:',
    adminTitle: 'Consulente operazioni di noleggio',
    slogans: ['La libertà ti guida.', 'Il comfort ti accompagna.'],
    extrasNote: 'La scelta di extra può comportare costi aggiuntivi.',
    extrasLabel: 'Altri costi',
    deliveryFeeLabel: 'Costo consegna',
    extrasFeeLabel: 'Costo extra',
    daysSuffix: 'giorni',
    deliveryNote:
      "Puoi richiedere la consegna dell'auto nel luogo che preferisci (es. aeroporto o alloggio).",
  },
  sk: {
    rentalFeeLabel: 'Prenájomné',
    depositLabel: 'Kaucia',
    insuranceLabel: 'Komplexné poistenie',
    insuranceNote: 'Ak zvolíte komplexné poistenie, kaucia nie je potrebná.',
    fallbackLink: 'Ak tlačidlo nefunguje, otvor tento odkaz:',
    adminTitle: 'Poradca pre prevádzku prenájmu',
    slogans: ['Sloboda vedie.', 'Komfort sprevádza.'],
    extrasNote: 'Výber extra služieb môže priniesť dodatočné náklady.',
    extrasLabel: 'Ďalšie náklady',
    deliveryFeeLabel: 'Poplatok za doručenie',
    extrasFeeLabel: 'Poplatok za extra služby',
    daysSuffix: 'dní',
    deliveryNote:
      'Môžeš si vyžiadať doručenie auta na zvolené miesto (napr. letisko alebo ubytovanie).',
  },
  cz: {
    rentalFeeLabel: 'Nájemné',
    depositLabel: 'Kauce',
    insuranceLabel: 'Komplexní pojištění',
    insuranceNote: 'Pokud zvolíte plné pojištění, kauce není potřeba.',
    fallbackLink: 'Pokud tlačítko nefunguje, otevřete tento odkaz:',
    adminTitle: 'Poradce pro provoz půjčoven',
    slogans: ['Svoboda vede.', 'Komfort provází.'],
    extrasNote: 'Výběr doplňků může znamenat další náklady.',
    extrasLabel: 'Další náklady',
    deliveryFeeLabel: 'Poplatek za doručení',
    extrasFeeLabel: 'Poplatek za doplňky',
    daysSuffix: 'dní',
    deliveryNote:
      'Auto si můžete nechat doručit na vámi zvolené místo (např. letiště nebo ubytování).',
  },
  se: {
    rentalFeeLabel: 'Hyresavgift',
    depositLabel: 'Deposition',
    insuranceLabel: 'Heltäckande försäkring',
    insuranceNote: 'Väljer du heltäckande försäkring behövs ingen deposition.',
    fallbackLink: 'Om knappen inte fungerar, öppna denna länk:',
    adminTitle: 'Rådgivare för uthyrningsverksamhet',
    slogans: ['Friheten leder.', 'Komforten följer med.'],
    extrasNote: 'Val av extra kan medföra ytterligare kostnader.',
    extrasLabel: 'Övriga kostnader',
    deliveryFeeLabel: 'Leveranskostnad',
    extrasFeeLabel: 'Kostnad för tillval',
    daysSuffix: 'dagar',
    deliveryNote:
      'Du kan be om leverans till valfri plats (t.ex. flygplats eller boende).',
  },
  no: {
    rentalFeeLabel: 'Leiepris',
    depositLabel: 'Depositum',
    insuranceLabel: 'Full kaskoforsikring',
    insuranceNote: 'Velger du full dekning, trengs ikke depositum.',
    fallbackLink: 'Hvis knappen ikke virker, åpne denne lenken:',
    adminTitle: 'Rådgiver for leieoperasjoner',
    slogans: ['Frihet leder.', 'Komfort følger med.'],
    extrasNote: 'Valg av ekstrautstyr kan medføre ekstra kostnader.',
    extrasLabel: 'Andre kostnader',
    deliveryFeeLabel: 'Leveringsgebyr',
    extrasFeeLabel: 'Kostnad for ekstrautstyr',
    daysSuffix: 'dager',
    deliveryNote:
      'Du kan be om levering til ønsket sted (f.eks. flyplass eller overnatting).',
  },
  dk: {
    rentalFeeLabel: 'Lejepris',
    depositLabel: 'Depositum',
    insuranceLabel: 'Fuld kaskoforsikring',
    insuranceNote:
      'Hvis du vælger fuld dækning, er der ikke behov for depositum.',
    fallbackLink: 'Hvis knappen ikke virker, åbne dette link:',
    adminTitle: 'Rådgiver for udlejningsdrift',
    slogans: ['Frihed leder.', 'Komfort følger med.'],
    extrasNote: 'Valg af ekstraudstyr kan medføre ekstra omkostninger.',
    extrasLabel: 'Andre omkostninger',
    deliveryFeeLabel: 'Leveringsgebyr',
    extrasFeeLabel: 'Pris for ekstraudstyr',
    daysSuffix: 'dage',
    deliveryNote:
      'Du kan bede om levering til det ønskede sted (f.eks. lufthavn eller overnatning).',
  },
  pl: {
    rentalFeeLabel: 'Opłata za wynajem',
    depositLabel: 'Kaucja',
    insuranceLabel: 'Pełne ubezpieczenie',
    insuranceNote:
      'Jeśli wybierzesz pełne ubezpieczenie, kaucja nie jest wymagana.',
    fallbackLink: 'Jeśli przycisk nie działa, otwórz ten link:',
    adminTitle: 'Doradca ds. operacji wynajmu',
    slogans: ['Wolność prowadzi.', 'Komfort towarzyszy.'],
    extrasNote: 'Wybranie dodatków może wiązać się z dodatkowymi kosztami.',
    extrasLabel: 'Inne koszty',
    deliveryFeeLabel: 'Opłata za dostawę',
    extrasFeeLabel: 'Opłata za dodatki',
    daysSuffix: 'dni',
    deliveryNote:
      'Możesz poprosić o dostawę auta pod wskazany adres (np. lotnisko lub nocleg).',
  },
};

const getStaticTexts = (locale: string) =>
  LOCALIZED_STATIC[locale] ?? LOCALIZED_STATIC.en;

const EMAIL_COPY: Record<string, EmailCopy> = {
  hu: {
    subject: 'Foglalás folytatása - Zodiac Rent a Car',
    greeting: (name) => `Szia${name ? ` ${name}` : ''}!`,
    thankYou: 'Köszönjük az ajánlatkérést a Zodiac Rent a Cartól.',
    instructions:
      'A foglalás véglegesítéséhez kérjük töltsd ki az adataidat az alábbi linken.',
    cta: 'Foglalás folytatása',
    signature: 'Üdvözlettel, Zodiac Rent a Car csapat',
    successMessage: 'Foglaláskérés e-mail elküldve.',
  },
  en: {
    subject: 'Complete your booking - Zodiac Rent a Car',
    greeting: (name) => `Hi${name ? ` ${name}` : ''},`,
    thankYou: 'Thank you for your enquiry with Zodiac Rent a Car.',
    instructions:
      'To finalize your booking, please complete your details at the link below.',
    cta: 'Continue booking',
    signature: 'Best regards, Zodiac Rent a Car team',
    successMessage: 'Booking request email sent.',
  },
  de: {
    subject: 'Buchung abschließen - Zodiac Rent a Car',
    greeting: (name) => `Hallo${name ? ` ${name}` : ''},`,
    thankYou: 'Vielen Dank für Ihre Anfrage bei Zodiac Rent a Car.',
    instructions:
      'Um Ihre Buchung abzuschließen, füllen Sie bitte Ihre Daten unter folgendem Link aus.',
    cta: 'Buchung fortsetzen',
    signature: 'Viele Grüße, Ihr Zodiac Rent a Car Team',
  },
  ro: {
    subject: 'Finalizează rezervarea - Zodiac Rent a Car',
    greeting: (name) => `Bună${name ? ` ${name}` : ''},`,
    thankYou:
      'Îți mulțumim pentru solicitarea trimisă către Zodiac Rent a Car.',
    instructions:
      'Pentru a finaliza rezervarea, te rugăm să completezi datele la linkul de mai jos.',
    cta: 'Continuă rezervarea',
    signature: 'Cu stimă, Echipa Zodiac Rent a Car',
  },
  fr: {
    subject: 'Finalisez votre réservation - Zodiac Rent a Car',
    greeting: (name) => `Bonjour${name ? ` ${name}` : ''},`,
    thankYou: 'Merci pour votre demande auprès de Zodiac Rent a Car.',
    instructions:
      'Pour finaliser votre réservation, veuillez compléter vos informations via le lien ci-dessous.',
    cta: 'Continuer la réservation',
    signature: "Cordialement, L'équipe Zodiac Rent a Car",
  },
  es: {
    subject: 'Completa tu reserva - Zodiac Rent a Car',
    greeting: (name) => `Hola${name ? ` ${name}` : ''},`,
    thankYou: 'Gracias por tu solicitud en Zodiac Rent a Car.',
    instructions:
      'Para finalizar la reserva, completa tus datos en el siguiente enlace.',
    cta: 'Continuar con la reserva',
    signature: 'Saludos, Equipo de Zodiac Rent a Car',
  },
  it: {
    subject: 'Completa la tua prenotazione - Zodiac Rent a Car',
    greeting: (name) => `Ciao${name ? ` ${name}` : ''},`,
    thankYou: 'Grazie per la tua richiesta a Zodiac Rent a Car.',
    instructions:
      'Per completare la prenotazione, inserisci i tuoi dati al link qui sotto.',
    cta: 'Continua la prenotazione',
    signature: 'Un saluto, Il team di Zodiac Rent a Car',
  },
  sk: {
    subject: 'Dokončite rezerváciu - Zodiac Rent a Car',
    greeting: (name) => `Dobrý deň${name ? ` ${name}` : ''},`,
    thankYou: 'Ďakujeme za dopyt v Zodiac Rent a Car.',
    instructions:
      'Pre dokončenie rezervácie vyplňte svoje údaje na odkaze nižšie.',
    cta: 'Pokračovať v rezervácii',
    signature: 'S pozdravom, Tím Zodiac Rent a Car',
  },
  cz: {
    subject: 'Dokončete rezervaci - Zodiac Rent a Car',
    greeting: (name) => `Dobrý den${name ? ` ${name}` : ''},`,
    thankYou: 'Děkujeme za poptávku u Zodiac Rent a Car.',
    instructions:
      'Pro dokončení rezervace prosím vyplňte své údaje na odkazu níže.',
    cta: 'Pokračovat v rezervaci',
    signature: 'S pozdravem, Tým Zodiac Rent a Car',
  },
  se: {
    subject: 'Slutför din bokning - Zodiac Rent a Car',
    greeting: (name) => `Hej${name ? ` ${name}` : ''},`,
    thankYou: 'Tack för din förfrågan hos Zodiac Rent a Car.',
    instructions:
      'Fyll i dina uppgifter via länken nedan för att slutföra bokningen.',
    cta: 'Fortsätt bokningen',
    signature: 'Vänliga hälsningar, Teamet på Zodiac Rent a Car',
  },
  no: {
    subject: 'Fullfør bestillingen din - Zodiac Rent a Car',
    greeting: (name) => `Hei${name ? ` ${name}` : ''},`,
    thankYou: 'Takk for forespørselen hos Zodiac Rent a Car.',
    instructions:
      'Fullfør bestillingen ved å fylle ut opplysningene dine via lenken under.',
    cta: 'Fortsett bestillingen',
    signature: 'Vennlig hilsen, Teamet i Zodiac Rent a Car',
  },
  dk: {
    subject: 'Gør din booking færdig - Zodiac Rent a Car',
    greeting: (name) => `Hej${name ? ` ${name}` : ''},`,
    thankYou: 'Tak for din forespørgsel hos Zodiac Rent a Car.',
    instructions:
      'Færdiggør bookingen ved at udfylde dine oplysninger via linket nedenfor.',
    cta: 'Fortsæt bookingen',
    signature: 'Med venlig hilsen, Zodiac Rent a Car-teamet',
  },
  pl: {
    subject: 'Dokończ rezerwację - Zodiac Rent a Car',
    greeting: (name) => `Cześć${name ? ` ${name}` : ''},`,
    thankYou: 'Dziękujemy za zapytanie w Zodiac Rent a Car.',
    instructions:
      'Aby dokończyć rezerwację, uzupełnij swoje dane w poniższym linku.',
    cta: 'Kontynuuj rezerwację',
    signature: 'Pozdrawiamy, Zespół Zodiac Rent a Car',
  },
};

const normalizeLocale = (locale?: string | null) => {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase();
  return EMAIL_COPY[normalized] ? normalized : 'en';
};

const hasMailerConfig = () =>
  Boolean(
    MAIL_HOST &&
      MAIL_PORT &&
      Number.isFinite(MAIL_PORT) &&
      MAIL_USER &&
      MAIL_PASS
  );

const createTransporter = async () => {
  const module = await import('nodemailer');
  const nodemailer = module.default ?? module;
  return nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_PORT === 465,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
};

let cachedTransporter: Awaited<ReturnType<typeof createTransporter>> | null =
  null;

const getTransporter = async () => {
  if (!cachedTransporter) {
    cachedTransporter = await createTransporter();
  }
  return cachedTransporter;
};

const buildBookingLink = (locale: string, carId: string, quoteId: string) => {
  const safeLocale = normalizeLocale(locale);
  const encodedCarId = encodeURIComponent(carId);
  const encodedQuoteId = encodeURIComponent(quoteId);
  return `https://zodiacsrentacar.com/${safeLocale}/cars/${encodedCarId}/rent?quoteId=${encodedQuoteId}`;
};

const sanitizeName = (name?: string | null) => {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatDateRange = (
  start?: string | null,
  end?: string | null,
  locale = 'hu-HU'
) => {
  if (!start && !end) return null;
  const fmt = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
};

const rentalDays = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
  const diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return null;
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
};

const buildTextBody = (
  copy: EmailCopy,
  input: SendBookingRequestEmailInput,
  bookingLink: string
) => {
  const safeName = sanitizeName(input.name);
  const dateRange = formatDateRange(
    input.rentalStart,
    input.rentalEnd,
    input.locale ?? 'hu-HU'
  );
  const days = rentalDays(input.rentalStart, input.rentalEnd);
  const carLabel = input.carName || input.carId;
  const localeSafe = normalizeLocale(input.locale);
  const staticText = getStaticTexts(localeSafe);
  const rentalFee = formatPrice(input.rentalFee);
  const deposit = formatPrice(input.deposit);
  const insurancePrice = formatPrice(input.insurance);
  const deliveryFee = formatPrice(input.deliveryFee);
  const extrasFee = formatPrice(input.extrasFee);
  const insuranceNote =
    insurancePrice && deposit ? staticText.insuranceNote : null;
  const signerName = sanitizeName(input.adminName) ?? 'Zodiacs Rent a Car';
  const adminTitle = staticText.adminTitle;
  const slogans = staticText.slogans;
  const localizedSiteUrl = `https://zodiacsrentacar.com/${localeSafe}`;
  return `${copy.greeting(safeName)}

${copy.thankYou}
${copy.instructions}

${
  dateRange
    ? `${dateRange}${days ? ` (${days} ${staticText.daysSuffix})` : ''} :`
    : ''
}
${carLabel ? `${carLabel}` : ''}

${rentalFee ? `${staticText.rentalFeeLabel}: ${rentalFee}` : ''}
${deposit ? `${staticText.depositLabel}: ${deposit}` : ''}

${insurancePrice ? `${insuranceNote ?? ''}` : ''}
${insurancePrice ? `${staticText.insuranceLabel}: ${insurancePrice}` : ''}
${deliveryFee ? `${staticText.deliveryFeeLabel}: ${deliveryFee}` : ''}
${extrasFee ? `${staticText.extrasFeeLabel}: ${extrasFee}` : ''}

${copy.cta}: ${bookingLink}

${staticText.extrasNote}
${staticText.deliveryNote}

${copy.signature}

${signerName}
${adminTitle}
${ADMIN_SIGNATURE.company}
Tel: ${ADMIN_SIGNATURE.phone}
Email: ${ADMIN_SIGNATURE.email}
Web: ${localizedSiteUrl}
Helyszín: ${ADMIN_SIGNATURE.locations}

${slogans.join('\n')}`;
};

const buildHtmlBody = async (
  copy: EmailCopy,
  input: SendBookingRequestEmailInput,
  bookingLink: string
) => {
  const safeName = sanitizeName(input.name);
  const safeNameForHtml = safeName ? escapeHtml(safeName) : undefined;
  const logoSrc = await getLogoDataUrl();

  const heading = escapeHtml(copy.subject);
  const greeting = copy.greeting(safeNameForHtml);
  const primaryCta = escapeHtml(copy.cta);
  const thankYou = escapeHtml(copy.thankYou);
  const instructions = escapeHtml(copy.instructions);
  const dateRange = formatDateRange(
    input.rentalStart,
    input.rentalEnd,
    input.locale ?? 'hu-HU'
  );
  const days = rentalDays(input.rentalStart, input.rentalEnd);
  const carLabel = escapeHtml(input.carName || input.carId || '');
  const localeSafe = normalizeLocale(input.locale);
  const staticText = getStaticTexts(localeSafe);
  const rentalFee = formatPrice(input.rentalFee);
  const deposit = formatPrice(input.deposit);
  const insurancePrice = formatPrice(input.insurance);
  const deliveryFee = formatPrice(input.deliveryFee);
  const extrasFee = formatPrice(input.extrasFee);
  const insuranceNote = insurancePrice ? staticText.insuranceNote : null;
  const signerName = sanitizeName(input.adminName) ?? 'Zodiacs Rent a Car';
  const signerNameHtml = escapeHtml(signerName);
  const adminTitle = escapeHtml(staticText.adminTitle);
  const sloganLines = staticText.slogans.map((line) => escapeHtml(line));
  const localizedSiteUrl = `https://zodiacsrentacar.com/${localeSafe}`;

  return `
  <div style="margin:0;padding:0;background:${BRAND.background};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:${
      BRAND.background
    };padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;border-collapse:collapse;background:#ffffff;border-radius:18px;box-shadow:0 14px 40px rgba(2,48,71,0.12);overflow:hidden;">
            <tr>
              <td style="padding:0; background:linear-gradient(135deg, ${
                BRAND.sky
              } 0%, ${BRAND.amber} 100%);">
                <div style="padding:18px 24px; text-align:center;">
                  ${
                    logoSrc
                      ? `<img src="${logoSrc}" alt="Zodiacs Rent a Car" style="height:200px; max-width:2520px; display:inline-block;" />`
                      : `<div style="color:#ffffff;font-family:Arial, sans-serif;font-weight:700;font-size:20px;letter-spacing:1px;">Zodiacs Rent a Car</div>`
                  }
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 26px 8px; font-family: Arial, sans-serif; color:${
                BRAND.navy
              };">
                <div style="color:${
                  BRAND.navyLight
                }; font-size:13px; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:10px; font-weight:700;">
                  Zodiacs Rent a Car
                </div>
                <div style="font-size:22px; font-weight:800; letter-spacing:0.3px; margin:0 0 14px;">
                  ${heading}
                </div>
                <div style="font-size:16px; line-height:1.6; color:${
                  BRAND.navyLight
                }; margin-bottom:12px;">
                  ${greeting}
                </div>
                <div style="font-size:16px; line-height:1.6; color:${
                  BRAND.navyLight
                }; margin-bottom:12px;">
                  ${thankYou}
                </div>
                <div style="font-size:16px; line-height:1.6; color:${
                  BRAND.navyLight
                }; margin-bottom:22px;">
                  ${instructions}
                </div>
                ${
                  dateRange || carLabel
                    ? `<div style="margin: 0 0 18px; padding:14px 16px; border:1px solid rgba(2,48,71,0.08); border-radius:14px; background:linear-gradient(135deg, ${
                        BRAND.sky
                      }15 0%, ${BRAND.amber}12 100%);">
                        ${
                          dateRange
                            ? `<div style="font-size:15px; font-weight:700; color:${
                                BRAND.navy
                              }; margin-bottom:6px;">${escapeHtml(dateRange)}${
                                days
                                  ? ` (${days} ${escapeHtml(
                                      staticText.daysSuffix
                                    )})`
                                  : ''
                              }</div>`
                            : ''
                        }
                        ${
                          carLabel
                            ? `<div style="font-size:15px; font-weight:700; color:${BRAND.navy};">${carLabel}</div>`
                            : ''
                        }
                      </div>`
                    : ''
                }
                ${
                  rentalFee || deposit || insurancePrice
                    ? `<div style="display:flex; flex-wrap:wrap; margin:0 -10px 8px 0; align-items:stretch;">
                        ${
                          rentalFee
                            ? `<div style="flex:1; min-width:150px; padding:12px 14px; border-radius:12px; border:1px solid rgba(2,48,71,0.08); background:linear-gradient(135deg, ${
                                BRAND.sky
                              }15 0%, ${
                                BRAND.amber
                              }12 100%); margin:0 12px 12px 0;">
                                <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:${
                                  BRAND.navyLight
                                }; margin-bottom:6px;">${escapeHtml(
                                staticText.rentalFeeLabel
                              )}</div>
                                <div style="font-size:18px; font-weight:800; color:${
                                  BRAND.navy
                                };">${escapeHtml(rentalFee)}</div>
                              </div>`
                            : ''
                        }
                        ${
                          deposit
                            ? `<div style="flex:1; min-width:150px; padding:12px 14px; border-radius:12px; border:1px solid rgba(2,48,71,0.08); background:linear-gradient(135deg, ${
                                BRAND.sky
                              }15 0%, ${
                                BRAND.amber
                              }12 100%); margin:0 12px 12px 0;">
                                <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:${
                                  BRAND.navyLight
                                }; margin-bottom:6px;">${escapeHtml(
                                staticText.depositLabel
                              )}</div>
                                <div style="font-size:18px; font-weight:800; color:${
                                  BRAND.navy
                                };">${escapeHtml(deposit)}</div>
                              </div>`
                            : ''
                        }
                        ${
                          insurancePrice
                            ? `<div style="flex:1; min-width:150px; padding:12px 14px; border-radius:12px; border:1px solid rgba(2,48,71,0.08); background:linear-gradient(135deg, ${
                                BRAND.sky
                              }15 0%, ${
                                BRAND.amber
                              }12 100%); margin:0 12px 12px 0;">
                                <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:${
                                  BRAND.navyLight
                                }; margin-bottom:6px;">${escapeHtml(
                                staticText.insuranceLabel
                              )}</div>
                                <div style="font-size:18px; font-weight:800; color:${
                                  BRAND.navy
                                };">${escapeHtml(insurancePrice)}</div>
                              </div>`
                            : ''
                        }
                        <div style="flex:1; min-width:150px; padding:12px 14px; border-radius:12px; border:1px solid rgba(2,48,71,0.08); background:linear-gradient(135deg, ${
                          BRAND.sky
                        }12 0%, ${BRAND.amber}10 100%); margin:0 12px 12px 0;">
                          <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:${
                            BRAND.navyLight
                          }; margin-bottom:6px;">${escapeHtml(
                        staticText.extrasLabel
                      )}</div>
                          <div style="font-size:14px; font-weight:600; color:${
                            BRAND.navyLight
                          }; line-height:1.5;">
                            ${escapeHtml(staticText.extrasNote)}
                            <br />
                            ${escapeHtml(staticText.deliveryNote)}
                            ${
                              deliveryFee || extrasFee
                                ? `<div style="margin-top:10px; font-size:14px; font-weight:700; color:${
                                    BRAND.navy
                                  };">
                                    ${
                                      deliveryFee
                                        ? `<div>${escapeHtml(
                                            staticText.deliveryFeeLabel
                                          )}: ${escapeHtml(deliveryFee)}</div>`
                                        : ''
                                    }
                                    ${
                                      extrasFee
                                        ? `<div>${escapeHtml(
                                            staticText.extrasFeeLabel
                                          )}: ${escapeHtml(extrasFee)}</div>`
                                        : ''
                                    }
                                  </div>`
                                : ''
                            }
                          </div>
                        </div>
                      </div>`
                    : ''
                }
                ${
                  insuranceNote
                    ? `<div style="font-size:14px; line-height:1.6; font-weight:bold; text-align:center; color:${BRAND.navyLight}; margin:-6px 0 18px;">
                        ${insuranceNote}
                      </div>`
                    : ''
                }
                <div style="text-align:center; margin: 18px 0 24px;">
                  <a href="${bookingLink}" style="display:inline-block; padding:13px 22px; background:${
    BRAND.blue
  }; color:#ffffff; font-weight:700; font-size:16px; text-decoration:none; border-radius:999px; box-shadow:0 10px 24px rgba(33,158,188,0.22);">
                    ${primaryCta}
                  </a>
                </div>
                <div style="font-size:12px; color:${
                  BRAND.navyLight
                }; line-height:1.5; text-align:center; margin:8px 0 10px;">
                  ${escapeHtml(staticText.fallbackLink)}<br />
                  <a href="${bookingLink}" style="color:${
    BRAND.navy
  }; font-weight:600; text-decoration:none; word-break:break-all;">${bookingLink}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 26px; font-family: Arial, sans-serif; color:${
                BRAND.navyLight
              }; font-size:14px; line-height:1.6; border-top:1px solid rgba(2,48,71,0.06);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="right" style="text-align:right;">
                      <div style="margin-top:10px; font-size:13px; color:${
                        BRAND.navyLight
                      }; line-height:1.5; display:inline-block; text-align:right;">
                        <div style="font-weight:700;">${signerNameHtml}</div>
                        <div>${adminTitle}</div>
                        <div>${escapeHtml(ADMIN_SIGNATURE.company)}</div>
                        <div>Tel: ${escapeHtml(ADMIN_SIGNATURE.phone)}</div>
                        <div>Email: ${escapeHtml(ADMIN_SIGNATURE.email)}</div>
                        <div>Web: ${escapeHtml(localizedSiteUrl)}</div>
                        <div>${escapeHtml(ADMIN_SIGNATURE.locations)}</div>
                        ${sloganLines
                          .map(
                            (line, idx) =>
                              `<div style="${
                                idx === 0 ? 'margin-top:6px;' : ''
                              } font-style:italic;">${line}</div>`
                          )
                          .join('')}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
};

const markQuoteAsProcessed = async (quoteId: string) => {
  await db.contactQuotes.update({
    where: { id: quoteId },
    data: {
      status: QUOTE_PROCESSED_STATUS,
      updatedAt: new Date(),
    },
  });
};

export const sendBookingRequestEmailAction = async (
  input: SendBookingRequestEmailInput
): Promise<SendBookingRequestEmailResult> => {
  const recipient = input.email?.trim();

  if (!recipient) {
    return { error: 'Ehhez az ajánlatkéréshez nincs e-mail cím megadva.' };
  }

  if (!input.carId) {
    return { error: 'Nincs autó társítva ehhez az ajánlatkéréshez.' };
  }

  if (!hasMailerConfig() || !BOOKING_FROM_ADDRESS) {
    return {
      error:
        'Az e-mail küldéshez hiányzik a konfiguráció (MAIL_HOST/PORT/USER/PASS vagy BOOKING_EMAIL_FROM/EMAIL_FROM).',
    };
  }

  const locale = normalizeLocale(input.locale);
  const copy = EMAIL_COPY[locale] ?? EMAIL_COPY.en;
  const bookingLink = buildBookingLink(locale, input.carId, input.quoteId);

  const text = buildTextBody(copy, input, bookingLink);
  const html = await buildHtmlBody(copy, input, bookingLink);

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: BOOKING_FROM_ADDRESS,
      to: recipient,
      subject: copy.subject,
      text,
      html,
      replyTo: MAIL_USER ?? BOOKING_EMAIL_FROM,
    });
  } catch (error) {
    console.error('sendBookingRequestEmailAction sendMail', error);
    return {
      error: 'Az e-mail küldése közben hiba történt. Próbáld meg később.',
    };
  }

  try {
    await markQuoteAsProcessed(input.quoteId);
    // Refresh listing and detail pages so the new státusz megjelenik az UI-ban.
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${input.quoteId}`);
  } catch (error) {
    console.error('sendBookingRequestEmailAction statusUpdate', error);
    return {
      error:
        'Az e-mail elküldve, de a státuszt nem sikerült frissíteni az adatbázisban.',
    };
  }

  return { success: copy.successMessage ?? 'Foglaláskérés e-mail elküldve.' };
};
