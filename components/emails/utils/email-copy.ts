import { EmailCopy } from '../booking-request-email';

export const EMAIL_COPY: Record<string, EmailCopy> = {
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
