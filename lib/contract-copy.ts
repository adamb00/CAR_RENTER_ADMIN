export const LOCALES = ['hu', 'en'] as const;

export type ContractLocale = (typeof LOCALES)[number];

type ContractDetailLabels = {
  bookingId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  vehicle: string;
  period: string;
  pickupLocation: string;
  pickupAddress: string;
};

export type ContractCopy = {
  title: string;
  intro: string;
  detailLabels: ContractDetailLabels;
  rentalDaysUnit: string;
};

const EN_COPY: ContractCopy = {
  title: 'VEHICLE RENTAL CONTRACT / GEPJARMUBERLETI SZERZODES',
  intro: '',
  detailLabels: {
    bookingId: 'Booking ID',
    renterName: 'Renter name',
    renterEmail: 'Renter email',
    renterPhone: 'Renter phone',
    vehicle: 'Rented vehicle',
    period: 'Rental period',
    pickupLocation: 'Pickup location',
    pickupAddress: 'Pickup address',
  },
  rentalDaysUnit: 'days',
};

const HU_COPY: ContractCopy = {
  title: 'GEPJARMUBERLETI SZERZODES / VEHICLE RENTAL CONTRACT',
  intro: '',
  detailLabels: {
    bookingId: 'Foglalas azonosito',
    renterName: 'Berlo neve',
    renterEmail: 'Berlo e-mail',
    renterPhone: 'Berlo telefon',
    vehicle: 'Berelt jarmu',
    period: 'Berleti idoszak',
    pickupLocation: 'Atvetel helye',
    pickupAddress: 'Atvetel cime',
  },
  rentalDaysUnit: 'nap',
};

export const CONTRACT_COPY: Record<ContractLocale, ContractCopy> = {
  en: EN_COPY,
  hu: HU_COPY,
};

export const resolveContractLocale = (
  locale?: string | null,
): ContractLocale => {
  if (!locale) return 'en';
  const normalized = locale.trim().toLowerCase();
  const base = normalized.split(/[-_]/)[0];
  if (base === 'hu') return 'hu';
  if (base === 'en') return 'en';
  return 'en';
};

export const DATE_LOCALE_MAP: Record<ContractLocale, string> = {
  en: 'en-US',
  hu: 'hu-HU',
};
