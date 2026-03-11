import { ADMIN_SIGNATURE, BRAND } from '@/lib/constants';
import { LOCALIZED_STATIC } from './utils/localized-static';

export type EmailSignatureData = {
  signerName: string;
  adminTitle: string;
  localizedSiteUrl: string;
  sloganLines: string[];
};

type ResolveEmailSignatureInput = {
  signerName?: string | null;
  locale?: string | null;
  adminTitle?: string | null;
  localizedSiteUrl?: string | null;
  sloganLines?: string[] | null;
};

const normalizeLocaleKey = (locale?: string | null) => {
  if (!locale) return 'en';
  const normalized = locale.trim().toLowerCase();
  if (LOCALIZED_STATIC[normalized]) return normalized;
  const base = normalized.split('-')[0];
  if (LOCALIZED_STATIC[base]) return base;
  if (base === 'cs') return 'cz';
  if (base === 'sv') return 'se';
  return 'en';
};

const sanitizeSignerName = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Zodiacs Rent a Car';
};

export const resolveEmailSignatureData = ({
  signerName,
  locale,
  adminTitle,
  localizedSiteUrl,
  sloganLines,
}: ResolveEmailSignatureInput): EmailSignatureData => {
  const localeKey = normalizeLocaleKey(locale);
  const localizedStatic = LOCALIZED_STATIC[localeKey] ?? LOCALIZED_STATIC.en;
  return {
    signerName: sanitizeSignerName(signerName),
    adminTitle:
      adminTitle?.trim() && adminTitle.trim().length > 0
        ? adminTitle.trim()
        : localizedStatic.adminTitle,
    localizedSiteUrl:
      localizedSiteUrl?.trim() && localizedSiteUrl.trim().length > 0
        ? localizedSiteUrl.trim()
        : `https://zodiacsrentacar.com/${localeKey}`,
    sloganLines:
      sloganLines?.filter(
        (line): line is string =>
          typeof line === 'string' && line.trim().length > 0,
      ) ?? localizedStatic.slogans,
  };
};

export const buildEmailSignatureText = (data: EmailSignatureData) =>
  [
    data.signerName,
    data.adminTitle,
    ADMIN_SIGNATURE.company,
    `Tel: ${ADMIN_SIGNATURE.phone}`,
    `Email: ${ADMIN_SIGNATURE.email}`,
    `Web: ${data.localizedSiteUrl}`,
    `Helyszin: ${ADMIN_SIGNATURE.locations}`,
    ...data.sloganLines,
  ].join('\n');

export function EmailSignatureBlock({ data }: { data: EmailSignatureData }) {
  return (
    <tbody>
      <tr>
        <td align='right' style={{ textAlign: 'right' }}>
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: BRAND.navyLight,
              lineHeight: 1.5,
              display: 'inline-block',
              textAlign: 'right',
            }}
          >
            <div style={{ fontWeight: 700 }}>{data.signerName}</div>
            <div>{data.adminTitle}</div>
            <div>{ADMIN_SIGNATURE.company}</div>
            <div>Tel: {ADMIN_SIGNATURE.phone}</div>
            <div>Email: {ADMIN_SIGNATURE.email}</div>
            <div>Web: {data.localizedSiteUrl}</div>
            <div>{ADMIN_SIGNATURE.locations}</div>
            {data.sloganLines.map((line, idx) => (
              <div
                key={`${line}-${idx}`}
                style={{
                  fontStyle: 'italic',
                  marginTop: idx === 0 ? 6 : 0,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
