import {
  DATE_LOCALE_MAP,
  type ContractLocale,
  resolveContractLocale,
} from '@/lib/contract-copy';

export const CONTRACT_VERSION = 'v3' as const;

export type ContractData = {
  bookingId: string;
  bookingCode?: string | null;
  locale?: string | null;
  renterName?: string | null;
  renterNationality?: string | null;
  renterEmail?: string | null;
  renterPhone?: string | null;
  renterAddress?: string | null;
  renterBirthPlace?: string | null;
  renterBirthDate?: string | null;
  renterIdCardNumber?: string | null;
  renterIdCardExpireDate?: string | null;
  renterDrivingLicenseNumber?: string | null;
  renterDrivingLicenseValidUntil?: string | null;
  ownerCompanyName?: string | null;
  ownerCompanyAddress?: string | null;
  ownerCompanyFiscal?: string | null;
  carLabel?: string | null;
  plate?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalDays?: number | null;
  rentalFee?: string | null;
  deposit?: string | null;
  insurance?: string | null;
  pickupLocation?: string | null;
  pickupAddress?: string | null;
};

export type ContractTemplate = {
  title: string;
  intro: string;
  details: { label: string; value: string }[];
  terms: string[];
  footer: string;
  body: string;
};

const CONTRACT_TITLE = 'VEHICLE RENTAL CONTRACT / GEPJARMUBERLETI SZERZODES';

const FINAL_BILINGUAL_CONTRACT_TEMPLATE = [
  '• LESSEE INFORMATION / A BERLO ADATAI',
  'Name / Nev: <<RENTER_NAME>>',
  'Nationality: <<RENTER_NATIONALITY>>',
  'ID or Passport No. / Szemelyi igazolvany vagy utlevel szama: <<RENTER_ID_CARD>>',
  'Address / Cim: <<RENTER_ADDRESS>>',
  'Date of Birth / Szuletesi datum: <<RENTER_BIRTH_DATE>>',
  'Driving License No. / Jogositvany szama: <<RENTER_LICENSE_NO>>',
  'License Valid Until / Jogositvany ervenyessege: <<RENTER_LICENSE_VALID_UNTIL>>',
  'Tel. Numero: <<RENTER_PHONE>>',
  '',
  '• VEHICLE INFORMATION / A JARMU ADATAI',
  'Make and Model / Marka es tipus: KIA',
  'License Plate / Rendszam: _',
  'Fuel Level (Pick-up) / Uzemanyagszint (atvetelkor): ____________________________________________',
  'Fuel type: 95 PETROL',
  '',
  '• RENTAL PERIOD / BERLETI IDOSZAK',
  'From (day/hour/minute) / -tol (nap/ora/perc): <<RENT_FROM>>',
  'To (day/hour/minute) / -ig (nap/ora/perc): <<RENT_TO>>',
  '',
  '• GENERAL TERMS AND CONDITIONS / ALTALANOS FELTETELEK',
  '1. Minimum Driver Requirements: The Lessee must be over 25 years old and have held a valid Category B driving license for at least 2 years.',
  '1. Minimalis vezetoi feltetel: A berlonek 25 ev felettinek kell lennie, es legalabb 2 eve ervenyes B kategorias jogositvannyal kell rendelkeznie.',
  '2. Document Validity: All documents and licenses must remain valid during the rental period.',
  '2. Okmanyok ervenyessege: Az osszes okmanynak es jogositvanynak ervenyesnek kell lennie a teljes berleti ido alatt.',
  '3. Payment Methods: Accepted payment methods are cash, bank card (VISA/Mastercard), or Revolut.',
  '3. Fizetesi modok: Elfogadott fizetesi modok: keszpenz, bankkartya (VISA/Mastercard) vagy Revolut.',
  '4. Deposit: A deposit of EUR 500 is required, unless full insurance without deductible is contracted.',
  '4. Letet: 500 EUR letet fizetendo, kiveve ha a berlo teljes koru biztositast kot (onresz nelkul).',
  '5. Insurance Exclusions: Even with full insurance, the Lessee is responsible for damages caused by: wrong fuel, key loss or breakage, off-road driving, traffic fines, alcohol/drug use, or taking the vehicle to unauthorized islands.',
  '5. Biztositasi kizarasok: Teljes koru biztositas mellett is a berlo felel az alabbi karokert: hibas uzemanyag tankolasa, kulcs elvesztese vagy eltorese, terepen valo vezetes, kozlekedesi birsagok, alkohol vagy drog hatasa alatti vezetes, illetve a jarmu engedely nelkuli szigetre vitele.',
  '6. Fuel Policy: The vehicle must be returned with the same fuel level as when it was picked up (Full to Full).',
  '6. Uzemanyag-szabaly: Az autot ugyanazzal az uzemanyagszinttel kell visszahozni, mint atvetelkor (Tele - Tele).',
  '7. Island Restriction: The vehicle may not leave the island where it was rented, except with written authorization.',
  '7. Sziget elhagyasa: A jarmu nem hagyhatja el a szigetet a berbeado irasos engedelye nelkul.',
  '8. Early Return: No refunds will be made for early return or unused rental days.',
  '8. Korai visszahozas: A berleti dij ido elotti visszahozas eseten nem jar vissza.',
  '9. Governing Law: This contract is governed by Spanish law.',
  '9. Iranyado jog: A jelen szerzodesre a spanyol jog az iranyado.',
  '',
  '• DECLARATION AND SIGNATURES / NYILATKOZAT ES ALAIRAS',
  'The Lessee declares that they have read, understood, and accepted all terms and conditions stated in this contract.',
  'A berlo kijelenti, hogy a jelen szerzodesben foglalt felteteleket elolvasta, megertette es elfogadta.',
  'Lessee / Berlo: ____________________________________________',
  'Signature / Alairas: ____________________________________________',
  'Date / Datum: <<SIGNED_AT>>',
  'Company / Ceg: ZODIACS RENT A CAR - THOMYFUERTEVENTURA S.L. 35610 C/LA MARESIA 26. +34683192422',
  'Stamp / Belyegzo: ____________________________________________',
].join('\n');

const formatValue = (value?: string | null) =>
  value && value.trim().length > 0 ? value.trim() : '';

const formatDateShortLocale = (
  value: string | null | undefined,
  locale: ContractLocale,
) => {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(DATE_LOCALE_MAP[locale], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
};

const formatDateTimeLocale = (
  value: string | null | undefined,
  locale: ContractLocale,
) => {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleString(DATE_LOCALE_MAP[locale], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const replaceToken = (source: string, token: string, value: string) =>
  source.replaceAll(token, value);

const buildBilingualContractBody = (
  data: ContractData,
  locale: ContractLocale,
  signedAt?: Date,
) => {
  let content = FINAL_BILINGUAL_CONTRACT_TEMPLATE;
  content = replaceToken(content, '<<RENTER_NAME>>', formatValue(data.renterName));
  content = replaceToken(
    content,
    '<<RENTER_NATIONALITY>>',
    formatValue(data.renterNationality),
  );
  content = replaceToken(
    content,
    '<<RENTER_ID_CARD>>',
    formatValue(data.renterIdCardNumber),
  );
  content = replaceToken(
    content,
    '<<RENTER_ADDRESS>>',
    formatValue(data.renterAddress),
  );
  content = replaceToken(
    content,
    '<<RENTER_BIRTH_DATE>>',
    formatDateShortLocale(data.renterBirthDate, locale),
  );
  content = replaceToken(
    content,
    '<<RENTER_LICENSE_NO>>',
    formatValue(data.renterDrivingLicenseNumber),
  );
  content = replaceToken(
    content,
    '<<RENTER_LICENSE_VALID_UNTIL>>',
    formatDateShortLocale(
      data.renterDrivingLicenseValidUntil ?? data.renterIdCardExpireDate,
      locale,
    ),
  );
  content = replaceToken(content, '<<RENTER_PHONE>>', formatValue(data.renterPhone));
  content = replaceToken(
    content,
    '<<RENT_FROM>>',
    formatDateTimeLocale(data.rentalStart, locale),
  );
  content = replaceToken(
    content,
    '<<RENT_TO>>',
    formatDateTimeLocale(data.rentalEnd, locale),
  );
  content = replaceToken(
    content,
    '<<SIGNED_AT>>',
    signedAt ? formatDateShortLocale(signedAt.toISOString(), locale) : '',
  );
  return content;
};

export const buildContractTemplate = (
  data: ContractData,
  options?: { signedAt?: Date; locale?: string | null },
): ContractTemplate => {
  const locale = resolveContractLocale(options?.locale ?? data.locale ?? 'en');

  return {
    title: CONTRACT_TITLE,
    intro: '',
    details: [],
    terms: [],
    footer: '',
    body: buildBilingualContractBody(data, locale, options?.signedAt),
  };
};

export const formatContractText = (
  template: ContractTemplate,
  options?: { includeTitle?: boolean },
) => {
  const includeTitle = options?.includeTitle ?? true;
  const sections: string[] = [];

  if (template.intro.trim().length > 0) {
    sections.push(template.intro);
  }

  if (template.details.length > 0) {
    sections.push(...template.details.map((item) => `${item.label}: ${item.value}`));
  }

  if (template.terms.length > 0) {
    sections.push(...template.terms.map((term, idx) => `${idx + 1}. ${term}`));
  }

  if (template.footer.trim().length > 0) {
    sections.push(template.footer);
  }

  if (template.body.trim().length > 0) {
    sections.push(template.body);
  }

  if (includeTitle && template.title.trim().length > 0) {
    return [template.title, '', ...sections].join('\n');
  }

  return sections.join('\n');
};
