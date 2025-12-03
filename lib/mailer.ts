import {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASS,
  BOOKING_EMAIL_FROM,
  QUOTE_PROCESSED_STATUS,
} from '@/lib/constants';

const formatFromAddress = () => {
  const from = BOOKING_EMAIL_FROM?.trim();
  if (from && from.includes('@')) return from;
  if (from && MAIL_USER) return `"${from}" <${MAIL_USER}>`;
  return MAIL_USER;
};

export const BOOKING_FROM_ADDRESS = formatFromAddress();

const createTransporter = async () => {
  const nodemailerModule = await import('nodemailer');
  const nodemailer = nodemailerModule.default ?? nodemailerModule;
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

export const hasMailerConfig = () =>
  Boolean(
    MAIL_HOST &&
      MAIL_PORT &&
      Number.isFinite(MAIL_PORT) &&
      MAIL_USER &&
      MAIL_PASS
  );

export const getTransporter = async () => {
  if (!cachedTransporter) {
    cachedTransporter = await createTransporter();
  }
  return cachedTransporter;
};

export { MAIL_USER, QUOTE_PROCESSED_STATUS };
