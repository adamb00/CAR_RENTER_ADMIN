import {
  DATE_LOCALE_MAP,
  type ContractLocale,
  resolveContractLocale,
} from '@/lib/contract-copy';

export const CONTRACT_VERSION = 'v4' as const;

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
  fuelType?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalDays?: number | null;
  rentalFee?: string | null;
  deposit?: string | null;
  insurance?: string | null;
  deliveryFee?: string | null;
  extrasFee?: string | null;
  tip?: string | null;
  pickupLocation?: string | null;
  pickupAddress?: string | null;
  pickupTime?: string | null;
  returnLocation?: string | null;
  returnAddress?: string | null;
  returnTime?: string | null;
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
  'Make and Model / Marka es tipus: <<CAR_LABEL>>',
  'License Plate / Rendszam: <<LICENSE_PLATE>>',
  'Fuel Level (Pick-up) / Uzemanyagszint (atvetelkor): ____________________________________________',
  'Fuel type / Uzemanyagtipus: <<FUEL_TYPE>>',
  '',
  '• RENTAL PERIOD / BERLETI IDOSZAK',
  'From (day/hour/minute) / -tol (nap/ora/perc): <<RENT_FROM>>',
  'To (day/hour/minute) / -ig (nap/ora/perc): <<RENT_TO>>',
  'Rental days / Berleti napok: <<RENTAL_DAYS>>',
  '',
  '• PICK-UP AND RETURN / ATVETEL ES VISSZAADAS',
  'Pick-up location / Atvetel helye: <<PICKUP_LOCATION>>',
  'Pick-up address / Atvetel cime: <<PICKUP_ADDRESS>>',
  'Pick-up time / Atvetel ideje: <<PICKUP_TIME>>',
  'Return location / Visszaadas helye: <<RETURN_LOCATION>>',
  'Return address / Visszaadas cime: <<RETURN_ADDRESS>>',
  'Return time / Visszaadas ideje: <<RETURN_TIME>>',
  '',
  '• PRICE DETAILS / DIJAK',
  'Rental fee / Berleti dij: <<RENTAL_FEE>>',
  'Insurance / Biztositas: <<INSURANCE>>',
  'Deposit / Letet: <<DEPOSIT>>',
  'Delivery fee / Kiszallitasi dij: <<DELIVERY_FEE>>',
  'Extras fee / Extra dijak: <<EXTRAS_FEE>>',
  'Tip / Borravalo: <<TIP>>',
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
  '6. Handling of Damage Events: If any accident, damage, theft, loss, or other incident affecting the rented vehicle occurs, the Lessee must notify Zodiacs Rent a Car within 24 hours and make the vehicle available for inspection within the same period.',
  '6. Karesemeny bekovetkezesenek kezelese: Amennyiben a berelt gepjarmuvel kapcsolatban barmilyen baleset, serules, rongalodas, lopas, elvesztes vagy egyeb karesemeny tortenik, a berlo koteles azt 24 oran belul jelezni a Zodiacs Rent a Car reszere, es a gepjarmuvet ugyanilyen hataridon belul ellenorzesre bemutatni.',
  '7. Contract Extension: If the Lessee wishes to extend the rental period, they must notify Zodiacs Rent a Car personally or by phone at least 24 hours before the agreed rental period expires. Zodiacs Rent a Car reserves the right to approve or refuse the extension. The applicable fee is the daily price published on the Zodiacs Rent a Car website at the time of the request; the rate applied in the original contract cannot be extended.',
  '7. Szerzodeshosszabbitas: Amennyiben a berlo meg kivanja hosszabbitani a berleti idoszakot, koteles a megegyezett idotartam lejarta elott legalabb 24 oraval szemelyesen vagy telefonon ertesiteni a Zodiacs Rent a Car-t. A Zodiacs Rent a Car fenntartja a jogot, hogy a hosszabbitasi kerelmet elfogadja vagy elutasitsa. A fizetendo dij a kerelem idopontjaban a Zodiacs Rent a Car weboldalan ervenyes napi arnak felel meg; az eredeti szerzodesben alkalmazott dij nem hosszabbithato meg.',
  '8. Fuel Policy: The vehicle must be returned with the same fuel level as when it was picked up (Full to Full).',
  '8. Uzemanyag-szabaly: Az autot ugyanazzal az uzemanyagszinttel kell visszahozni, mint atvetelkor (Tele - Tele).',
  '9. Island Restriction: The vehicle may not leave the island where it was rented, except with written authorization.',
  '9. Sziget elhagyasa: A jarmu nem hagyhatja el a szigetet a berbeado irasos engedelye nelkul.',
  '10. Early Return: No refunds will be made for early return or unused rental days.',
  '10. Korai visszahozas: A berleti dij ido elotti visszahozas eseten nem jar vissza.',
  '11. Governing Law: This contract is governed by Spanish law.',
  '11. Iranyado jog: A jelen szerzodesre a spanyol jog az iranyado.',
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

const formatNumberValue = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

const formatPriceValue = (value?: string | null) => {
  const trimmed = formatValue(value);
  return trimmed ? `${trimmed} EUR` : '';
};

const isZeroPriceValue = (value?: string | null) => {
  const trimmed = formatValue(value);
  if (!trimmed) return false;

  const normalized = trimmed
    .replace(/\s+/g, '')
    .replace(/[€$]/g, '')
    .replace(/eur/gi, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed === 0;
};

const formatOptionalPriceValue = (value?: string | null) =>
  isZeroPriceValue(value) ? '' : formatPriceValue(value);

const removeEmptyOptionalPriceLines = (content: string) => {
  const optionalLabels = [
    'Deposit / Letet:',
    'Delivery fee / Kiszallitasi dij:',
    'Extras fee / Extra dijak:',
    'Tip / Borravalo:',
  ];

  return content
    .split('\n')
    .filter((line) => {
      const label = optionalLabels.find((item) => line.startsWith(item));
      if (!label) return true;
      return line.slice(label.length).trim().length > 0;
    })
    .join('\n');
};

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
  content = replaceToken(
    content,
    '<<RENTER_NAME>>',
    formatValue(data.renterName),
  );
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
  content = replaceToken(
    content,
    '<<RENTER_PHONE>>',
    formatValue(data.renterPhone),
  );
  content = replaceToken(content, '<<CAR_LABEL>>', formatValue(data.carLabel));
  content = replaceToken(content, '<<LICENSE_PLATE>>', formatValue(data.plate));
  content = replaceToken(content, '<<FUEL_TYPE>>', formatValue(data.fuelType));
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
    '<<RENTAL_DAYS>>',
    formatNumberValue(data.rentalDays),
  );
  content = replaceToken(
    content,
    '<<PICKUP_LOCATION>>',
    formatValue(data.pickupLocation),
  );
  content = replaceToken(
    content,
    '<<PICKUP_ADDRESS>>',
    formatValue(data.pickupAddress),
  );
  content = replaceToken(
    content,
    '<<PICKUP_TIME>>',
    formatValue(data.pickupTime),
  );
  content = replaceToken(
    content,
    '<<RETURN_LOCATION>>',
    formatValue(data.returnLocation),
  );
  content = replaceToken(
    content,
    '<<RETURN_ADDRESS>>',
    formatValue(data.returnAddress),
  );
  content = replaceToken(
    content,
    '<<RETURN_TIME>>',
    formatValue(data.returnTime),
  );
  content = replaceToken(
    content,
    '<<RENTAL_FEE>>',
    formatPriceValue(data.rentalFee),
  );
  content = replaceToken(
    content,
    '<<INSURANCE>>',
    formatPriceValue(data.insurance),
  );
  content = replaceToken(
    content,
    '<<DEPOSIT>>',
    formatOptionalPriceValue(data.deposit),
  );
  content = replaceToken(
    content,
    '<<DELIVERY_FEE>>',
    formatOptionalPriceValue(data.deliveryFee),
  );
  content = replaceToken(
    content,
    '<<EXTRAS_FEE>>',
    formatOptionalPriceValue(data.extrasFee),
  );
  content = replaceToken(content, '<<TIP>>', formatOptionalPriceValue(data.tip));
  content = replaceToken(
    content,
    '<<SIGNED_AT>>',
    signedAt ? formatDateShortLocale(signedAt.toISOString(), locale) : '',
  );
  return removeEmptyOptionalPriceLines(content);
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
    sections.push(
      ...template.details.map((item) => `${item.label}: ${item.value}`),
    );
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
