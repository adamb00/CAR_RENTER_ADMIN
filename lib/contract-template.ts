import {
  CONTRACT_COPY,
  DATE_LOCALE_MAP,
  type ContractLocale,
  resolveContractLocale,
} from '@/lib/contract-copy';

export const CONTRACT_VERSION = 'v1' as const;

export type ContractData = {
  bookingId: string;
  bookingCode?: string | null;
  locale?: string | null;
  renterName?: string | null;
  renterEmail?: string | null;
  renterPhone?: string | null;
  renterAddress?: string | null;
  renterBirthPlace?: string | null;
  renterBirthDate?: string | null;
  renterIdCardNumber?: string | null;
  renterIdCardExpireDate?: string | null;
  renterDrivingLicenseNumber?: string | null;
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

const formatValue = (value?: string | null) =>
  value && value.trim().length > 0 ? value : '—';

const formatValueOr = (value: string | null | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback;

const formatDateShortLocale = (
  value: string | null | undefined,
  locale: ContractLocale,
) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(DATE_LOCALE_MAP[locale], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const formatDateOr = (
  value: string | null | undefined,
  fallback: string,
  locale: ContractLocale,
) =>
  value && value.trim().length > 0
    ? formatDateShortLocale(value, locale)
    : fallback;

const normalizeFee = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\s*(€|eur)\s*$/i, '').trim();
};

const joinLabelValue = (label: string, value: string) => `${label} ${value}`;

const isNumericLike = (value: string) => /^[\d.,\s-]+$/.test(value);

const formatMoney = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  const normalized = normalizeFee(trimmed);
  if (!normalized) return fallback;
  if (!isNumericLike(normalized)) return trimmed;
  return `${normalized} EUR`;
};

export const buildContractTemplate = (
  data: ContractData,
  options?: { signedAt?: Date; locale?: string | null },
): ContractTemplate => {
  const locale = resolveContractLocale(options?.locale ?? data.locale ?? 'en');
  const copy = CONTRACT_COPY[locale];
  const englishCopy = CONTRACT_COPY.en;

  const period = [
    formatDateShortLocale(data.rentalStart ?? undefined, locale),
    formatDateShortLocale(data.rentalEnd ?? undefined, locale),
  ].join(' – ');
  const rentalDays =
    typeof data.rentalDays === 'number'
      ? `${data.rentalDays} ${copy.rentalDaysUnit}`
      : '—';
  const pickupLocation = formatValue(data.pickupLocation);
  const pickupAddress = formatValue(data.pickupAddress);
  const carLabel = formatValue(data.carLabel);
  const plate = formatValue(data.plate);
  const ownerCompanyName = formatValueOr(
    data.ownerCompanyName,
    '<<OwnerCompany.Name>>',
  );
  const ownerCompanyAddress = formatValueOr(
    data.ownerCompanyAddress,
    '<<OwnerCompany.Address>>',
  );
  const ownerCompanyFiscal = formatValueOr(
    data.ownerCompanyFiscal,
    '<<OwnerCompany.Fiscal>>',
  );
  const renterName = formatValueOr(data.renterName, '<<Customer.Name>>');
  const renterAddress = formatValueOr(
    data.renterAddress,
    '<<Customer.Address>>',
  );
  const renterBirthPlace = formatValueOr(
    data.renterBirthPlace,
    '<<Customer.BirthPlace>>',
  );
  const renterIdCardNumber = formatValueOr(
    data.renterIdCardNumber,
    '<<Customer.IdCardNumber>>',
  );
  const renterDrivingLicenseNumber = formatValueOr(
    data.renterDrivingLicenseNumber,
    '<<Customer.DrivingLicenseNumber>>',
  );
  const renterPhone = formatValueOr(
    data.renterPhone,
    '<<Customer.PhoneNumber>>',
  );
  const carModel = formatValueOr(data.carLabel, '<<Car.Model>>');
  const carLicensePlate = formatValueOr(data.plate, '<<Car.LicensePlate>>');
  const rentFee = normalizeFee(data.rentalFee);
  const rentFeeOnlyLine = rentFee ?? '<<Rent.Fee>>';
  const signedAt = options?.signedAt;
  const depositLine = formatMoney(data.deposit, '<<Deposit>>');
  const insuranceLine = formatMoney(data.insurance, '<<Insurance>>');

  const buildBodyLines = (
    bodyCopy: typeof copy.body,
    bodyLocale: ContractLocale,
  ) => {
    const renterBirthDate = formatDateOr(
      data.renterBirthDate,
      '<<Customer.BirthDate>>',
      bodyLocale,
    );
    const renterIdCardExpireDate = formatDateOr(
      data.renterIdCardExpireDate,
      '<<Customer.IdCardExpireDate>>',
      bodyLocale,
    );
    const rentFrom = formatDateOr(data.rentalStart, '<<Rent.From>>', bodyLocale);
    const rentTo = formatDateOr(data.rentalEnd, '<<Rent.To>>', bodyLocale);
    const rentalFeeSuffix = CONTRACT_COPY[bodyLocale].rentalFeePerDaySuffix;
    const rentFeePerDayLine = rentFee
      ? `${rentFee} ${rentalFeeSuffix}`
      : `<<Rent.Fee>> ${rentalFeeSuffix}`;
    const customToday = signedAt
      ? formatDateShortLocale(signedAt.toISOString(), bodyLocale)
      : '<<Custom.Today>>';
    const renterBirthLine = `${renterBirthPlace}, ${renterBirthDate}`;

    return [
    bodyCopy.lessorHeading,
    '',
    joinLabelValue(bodyCopy.companyLabel, ownerCompanyName),
    joinLabelValue(bodyCopy.addressLabel, ownerCompanyAddress),
    joinLabelValue(bodyCopy.registrationLabel, ownerCompanyFiscal),
    '',
    bodyCopy.renterHeading,
    '',
    joinLabelValue(bodyCopy.renterLabel, renterName),
    joinLabelValue(bodyCopy.addressLabel, renterAddress),
    joinLabelValue(bodyCopy.birthLabel, renterBirthLine),
    joinLabelValue(bodyCopy.idNumberLabel, renterIdCardNumber),
    joinLabelValue(bodyCopy.idExpiryLabel, renterIdCardExpireDate),
    joinLabelValue(bodyCopy.licenseLabel, renterDrivingLicenseNumber),
    joinLabelValue(bodyCopy.phoneLabel, renterPhone),
    '',
    bodyCopy.vehicleDetailsHeading,
    '',
    joinLabelValue(bodyCopy.carTypeLabel, carModel),
    joinLabelValue(bodyCopy.licensePlateLabel, carLicensePlate),
    '',
    bodyCopy.rentalFeesHeading,
    '',
    joinLabelValue(bodyCopy.rentalFeeLabel, rentFeePerDayLine),
    joinLabelValue(bodyCopy.depositLabel, depositLine),
    joinLabelValue(bodyCopy.insuranceLabel, insuranceLine),
    joinLabelValue(bodyCopy.rentalFeeLabel, rentFeeOnlyLine),
    '',
    bodyCopy.depositParagraph,
    bodyCopy.insuranceParagraph,
    '',
    bodyCopy.rentalPeriodHeading,
    '',
    joinLabelValue(bodyCopy.rentalStartLabel, rentFrom),
    joinLabelValue(bodyCopy.rentalEndLabel, rentTo),
    '',
    bodyCopy.rentalTermsHeading,
    ...bodyCopy.rentalTermsLines,
    '',
    '',
    bodyCopy.section1Heading,
    '',
    bodyCopy.section1DriverLine,
    '',
    bodyCopy.section1DocumentsLine,
    '',
    bodyCopy.section1PaymentHeading,
    '',
    bodyCopy.section1CashLine,
    '',
    bodyCopy.section1CardLine,
    '',
    bodyCopy.section1DepositLine,
    '',
    bodyCopy.section1FullInsuranceLine,
    '',
    '',
    bodyCopy.section2Heading,
    '',
    bodyCopy.section2Intro,
    '',
    bodyCopy.section2WrongFuel,
    '',
    bodyCopy.section2Keys,
    '',
    bodyCopy.section2OffRoad,
    '',
    bodyCopy.section2Alcohol,
    '',
    bodyCopy.section2Fines,
    '',
    bodyCopy.section2UnauthorizedIsland,
    '',
    '',
    bodyCopy.section3Heading,
    '',
    bodyCopy.section3Island,
    '',
    bodyCopy.section3Fuel,
    '',
    bodyCopy.section3Cancellation,
    '',
    '',
    bodyCopy.declarationHeading,
    '',
    bodyCopy.declarationParagraph1,
    '',
    bodyCopy.declarationParagraph2,
    '',
    bodyCopy.declarationParagraph3,
    '',
    '',
    bodyCopy.dateLine,
    bodyCopy.cityLine.replace('<<Custom.Today>>', customToday),
  ];
  };

  const englishBody = [
    '=== ENGLISH VERSION ===',
    '',
    ...buildBodyLines(englishCopy.body, 'en'),
  ].join('\n');
  const localizedBody = [
    `=== LOCAL LANGUAGE VERSION (${copy.title}) ===`,
    '',
    ...buildBodyLines(copy.body, locale),
  ].join('\n');
  const body =
    locale === 'en'
      ? englishBody
      : [englishBody, '', localizedBody].join('\n');

  return {
    title:
      locale === 'en'
        ? englishCopy.title
        : `${englishCopy.title} / ${copy.title}`,
    intro:
      locale === 'en'
        ? englishCopy.intro
        : `${englishCopy.intro} / ${copy.intro}`,
    details: [
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.bookingId
            : `${englishCopy.detailLabels.bookingId} / ${copy.detailLabels.bookingId}`,
        value: formatValue(data.bookingCode ?? data.bookingId),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.renterName
            : `${englishCopy.detailLabels.renterName} / ${copy.detailLabels.renterName}`,
        value: formatValue(data.renterName),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.renterEmail
            : `${englishCopy.detailLabels.renterEmail} / ${copy.detailLabels.renterEmail}`,
        value: formatValue(data.renterEmail),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.renterPhone
            : `${englishCopy.detailLabels.renterPhone} / ${copy.detailLabels.renterPhone}`,
        value: formatValue(data.renterPhone),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.vehicle
            : `${englishCopy.detailLabels.vehicle} / ${copy.detailLabels.vehicle}`,
        value: `${carLabel} (${plate})`,
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.period
            : `${englishCopy.detailLabels.period} / ${copy.detailLabels.period}`,
        value: `${period} (${rentalDays})`,
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.pickupLocation
            : `${englishCopy.detailLabels.pickupLocation} / ${copy.detailLabels.pickupLocation}`,
        value: pickupLocation,
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.pickupAddress
            : `${englishCopy.detailLabels.pickupAddress} / ${copy.detailLabels.pickupAddress}`,
        value: pickupAddress,
      },
    ],
    terms:
      locale === 'en'
        ? englishCopy.terms
        : englishCopy.terms.map(
            (term, index) => `${term} / ${copy.terms[index] ?? ''}`,
          ),
    footer:
      locale === 'en'
        ? englishCopy.footer
        : `${englishCopy.footer} / ${copy.footer}`,
    body,
  };
};

export const formatContractText = (
  template: ContractTemplate,
  options?: { includeTitle?: boolean },
) => {
  const includeTitle = options?.includeTitle ?? true;
  const detailLines = template.details.map(
    (item) => `${item.label}: ${item.value}`,
  );
  const termLines = template.terms.map(
    (term, index) => `${index + 1}. ${term}`,
  );

  const lines = [
    template.intro,
    '',
    ...detailLines,
    '',
    ...termLines,
    '',
    template.footer,
  ];

  if (template.body) {
    lines.push('', template.body);
  }

  return (includeTitle ? [template.title, '', ...lines] : lines).join('\n');
};
