export type BookingRejectionCopy = {
  subject: string;
  heading: string;
  greeting: (name?: string | null) => string;
  intro: string;
  reasonLabel: string;
  reasonText: string;
  bookingLabel: string;
  periodLabel: string;
  carLabel: string;
  contactLine: string;
  closing: string;
  successMessage: string;
};

const BASE_EN: BookingRejectionCopy = {
  subject: 'Booking request declined - Zodiac Rent a Car',
  heading: 'Booking request declined',
  greeting: (name) => `Hi${name ? ` ${name}` : ''},`,
  intro:
    'Thank you for your booking request. We have reviewed it carefully.',
  reasonLabel: 'Reason',
  reasonText:
    'There is currently no available vehicle for the selected rental dates.',
  bookingLabel: 'Booking ID',
  periodLabel: 'Rental period',
  carLabel: 'Requested car',
  contactLine:
    'If you want, we can help you with an alternative date or a different car.',
  closing: 'Best regards',
  successMessage: 'Booking rejection email sent.',
};

const BOOKING_REJECTION_COPY: Record<string, BookingRejectionCopy> = {
  en: BASE_EN,
  hu: {
    ...BASE_EN,
    subject: 'Foglalás elutasítva - Zodiac Rent a Car',
    heading: 'Foglalás elutasítva',
    greeting: (name) => `Szia${name ? ` ${name}` : ''}!`,
    intro: 'Köszönjük a foglalási igényt, átnéztük a részleteket.',
    reasonLabel: 'Elutasítás oka',
    reasonText:
      'A választott bérlési időpontra jelenleg nincs elérhető autónk.',
    bookingLabel: 'Foglalás azonosító',
    periodLabel: 'Bérlési időszak',
    carLabel: 'Kért autó',
    contactLine:
      'Ha szeretnéd, segítünk másik időponttal vagy másik autóval.',
    closing: 'Üdvözlettel',
    successMessage: 'Elutasítási e-mail elküldve.',
  },
  de: {
    ...BASE_EN,
    subject: 'Buchung abgelehnt - Zodiac Rent a Car',
    heading: 'Buchung abgelehnt',
    greeting: (name) => `Hallo${name ? ` ${name}` : ''},`,
    intro:
      'Vielen Dank für Ihre Buchungsanfrage. Wir haben sie sorgfältig geprüft.',
    reasonLabel: 'Grund',
    reasonText:
      'Für den gewählten Mietzeitraum ist derzeit kein Fahrzeug verfügbar.',
    bookingLabel: 'Buchungsnummer',
    periodLabel: 'Mietzeitraum',
    carLabel: 'Gewünschtes Fahrzeug',
    contactLine:
      'Gerne helfen wir Ihnen mit einem alternativen Zeitraum oder einem anderen Fahrzeug.',
    closing: 'Mit freundlichen Grüßen',
    successMessage: 'Ablehnungs-E-Mail gesendet.',
  },
  ro: {
    ...BASE_EN,
    subject: 'Rezervare respinsă - Zodiac Rent a Car',
    heading: 'Rezervare respinsă',
    greeting: (name) => `Salut${name ? ` ${name}` : ''},`,
    intro:
      'Îți mulțumim pentru cererea de rezervare. Am analizat-o cu atenție.',
    reasonLabel: 'Motiv',
    reasonText:
      'În prezent nu avem un vehicul disponibil pentru perioada selectată.',
    bookingLabel: 'ID rezervare',
    periodLabel: 'Perioada închirierii',
    carLabel: 'Mașina solicitată',
    contactLine:
      'Dacă dorești, te putem ajuta cu o altă perioadă sau altă mașină.',
    closing: 'Cu stimă',
    successMessage: 'Emailul de respingere a fost trimis.',
  },
  fr: {
    ...BASE_EN,
    subject: 'Réservation refusée - Zodiac Rent a Car',
    heading: 'Réservation refusée',
    greeting: (name) => `Bonjour${name ? ` ${name}` : ''},`,
    intro:
      'Merci pour votre demande de réservation. Nous l’avons examinée avec attention.',
    reasonLabel: 'Motif',
    reasonText:
      'Aucun véhicule n’est actuellement disponible pour les dates demandées.',
    bookingLabel: 'ID de réservation',
    periodLabel: 'Période de location',
    carLabel: 'Véhicule demandé',
    contactLine:
      'Si vous le souhaitez, nous pouvons proposer d’autres dates ou un autre véhicule.',
    closing: 'Cordialement',
    successMessage: 'E-mail de refus envoyé.',
  },
  es: {
    ...BASE_EN,
    subject: 'Reserva rechazada - Zodiac Rent a Car',
    heading: 'Reserva rechazada',
    greeting: (name) => `Hola${name ? ` ${name}` : ''},`,
    intro:
      'Gracias por tu solicitud de reserva. La hemos revisado cuidadosamente.',
    reasonLabel: 'Motivo',
    reasonText:
      'Actualmente no hay ningún vehículo disponible para las fechas seleccionadas.',
    bookingLabel: 'ID de reserva',
    periodLabel: 'Periodo de alquiler',
    carLabel: 'Coche solicitado',
    contactLine:
      'Si quieres, te ayudamos con fechas alternativas o con otro vehículo.',
    closing: 'Un saludo',
    successMessage: 'Correo de rechazo enviado.',
  },
  it: {
    ...BASE_EN,
    subject: 'Prenotazione rifiutata - Zodiac Rent a Car',
    heading: 'Prenotazione rifiutata',
    greeting: (name) => `Ciao${name ? ` ${name}` : ''},`,
    intro:
      'Grazie per la tua richiesta di prenotazione. L’abbiamo verificata con attenzione.',
    reasonLabel: 'Motivo',
    reasonText:
      'Al momento non abbiamo veicoli disponibili per le date selezionate.',
    bookingLabel: 'ID prenotazione',
    periodLabel: 'Periodo di noleggio',
    carLabel: 'Auto richiesta',
    contactLine:
      'Se vuoi, possiamo aiutarti con date alternative o con un’altra auto.',
    closing: 'Cordiali saluti',
    successMessage: 'Email di rifiuto inviata.',
  },
  sk: {
    ...BASE_EN,
    subject: 'Rezervácia zamietnutá - Zodiac Rent a Car',
    heading: 'Rezervácia zamietnutá',
    greeting: (name) => `Dobrý deň${name ? ` ${name}` : ''},`,
    intro:
      'Ďakujeme za vašu žiadosť o rezerváciu. Starostlivo sme ju skontrolovali.',
    reasonLabel: 'Dôvod',
    reasonText:
      'Pre zvolený termín prenájmu momentálne nemáme dostupné vozidlo.',
    bookingLabel: 'ID rezervácie',
    periodLabel: 'Obdobie prenájmu',
    carLabel: 'Požadované vozidlo',
    contactLine:
      'Ak chcete, pomôžeme vám s alternatívnym termínom alebo iným vozidlom.',
    closing: 'S pozdravom',
    successMessage: 'E-mail o zamietnutí bol odoslaný.',
  },
  cz: {
    ...BASE_EN,
    subject: 'Rezervace zamítnuta - Zodiac Rent a Car',
    heading: 'Rezervace zamítnuta',
    greeting: (name) => `Dobrý den${name ? ` ${name}` : ''},`,
    intro:
      'Děkujeme za vaši žádost o rezervaci. Pečlivě jsme ji zkontrolovali.',
    reasonLabel: 'Důvod',
    reasonText:
      'Pro zvolený termín pronájmu momentálně nemáme dostupné vozidlo.',
    bookingLabel: 'ID rezervace',
    periodLabel: 'Období pronájmu',
    carLabel: 'Požadované vozidlo',
    contactLine:
      'Pokud chcete, pomůžeme vám s jiným termínem nebo jiným vozidlem.',
    closing: 'S pozdravem',
    successMessage: 'E-mail o zamítnutí byl odeslán.',
  },
  se: {
    ...BASE_EN,
    subject: 'Bokning avvisad - Zodiac Rent a Car',
    heading: 'Bokning avvisad',
    greeting: (name) => `Hej${name ? ` ${name}` : ''},`,
    intro: 'Tack för din bokningsförfrågan. Vi har granskat den noggrant.',
    reasonLabel: 'Orsak',
    reasonText:
      'Det finns för närvarande inget tillgängligt fordon för de valda datumen.',
    bookingLabel: 'Boknings-ID',
    periodLabel: 'Hyresperiod',
    carLabel: 'Efterfrågad bil',
    contactLine:
      'Om du vill hjälper vi dig gärna med alternativa datum eller en annan bil.',
    closing: 'Vänliga hälsningar',
    successMessage: 'Avvisningsmail skickat.',
  },
  no: {
    ...BASE_EN,
    subject: 'Bestilling avslått - Zodiac Rent a Car',
    heading: 'Bestilling avslått',
    greeting: (name) => `Hei${name ? ` ${name}` : ''},`,
    intro:
      'Takk for bestillingsforespørselen din. Vi har gjennomgått den nøye.',
    reasonLabel: 'Årsak',
    reasonText:
      'Det er for øyeblikket ingen tilgjengelig bil for den valgte perioden.',
    bookingLabel: 'Bestillings-ID',
    periodLabel: 'Leieperiode',
    carLabel: 'Ønsket bil',
    contactLine:
      'Hvis du vil, kan vi hjelpe deg med alternative datoer eller en annen bil.',
    closing: 'Med vennlig hilsen',
    successMessage: 'Avslagsmail sendt.',
  },
  dk: {
    ...BASE_EN,
    subject: 'Booking afvist - Zodiac Rent a Car',
    heading: 'Booking afvist',
    greeting: (name) => `Hej${name ? ` ${name}` : ''},`,
    intro:
      'Tak for din bookingforespørgsel. Vi har gennemgået den grundigt.',
    reasonLabel: 'Årsag',
    reasonText:
      'Der er desværre ingen ledig bil i den valgte lejeperiode.',
    bookingLabel: 'Booking-ID',
    periodLabel: 'Lejeperiode',
    carLabel: 'Ønsket bil',
    contactLine:
      'Hvis du vil, hjælper vi gerne med alternative datoer eller en anden bil.',
    closing: 'Med venlig hilsen',
    successMessage: 'Afvisningsmail sendt.',
  },
  pl: {
    ...BASE_EN,
    subject: 'Rezerwacja odrzucona - Zodiac Rent a Car',
    heading: 'Rezerwacja odrzucona',
    greeting: (name) => `Cześć${name ? ` ${name}` : ''},`,
    intro:
      'Dziękujemy za Twoje zgłoszenie rezerwacji. Dokładnie je przeanalizowaliśmy.',
    reasonLabel: 'Powód',
    reasonText:
      'Obecnie nie mamy dostępnego pojazdu w wybranym terminie.',
    bookingLabel: 'ID rezerwacji',
    periodLabel: 'Okres wynajmu',
    carLabel: 'Wybrany samochód',
    contactLine:
      'Jeśli chcesz, pomożemy z alternatywnym terminem lub innym samochodem.',
    closing: 'Pozdrawiamy',
    successMessage: 'E-mail z odrzuceniem został wysłany.',
  },
};

const normalizeLocaleKey = (locale?: string | null) => {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase();
  if (BOOKING_REJECTION_COPY[normalized]) return normalized;

  const base = normalized.split('-')[0];
  if (BOOKING_REJECTION_COPY[base]) return base;
  if (base === 'cs') return 'cz';
  if (base === 'sv') return 'se';
  if (base === 'da') return 'dk';
  if (base === 'nb' || base === 'nn') return 'no';
  return 'en';
};

export const getBookingRejectionCopy = (locale?: string | null) => {
  const key = normalizeLocaleKey(locale);
  return BOOKING_REJECTION_COPY[key] ?? BOOKING_REJECTION_COPY.en;
};
