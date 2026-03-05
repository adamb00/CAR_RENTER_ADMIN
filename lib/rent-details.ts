import { Booking } from '@/data-service/bookings';
import { formatLocale } from './format/format-locale';

export const getRentDetails = (booking: Booking) => {
  const contactName = booking.payload?.contact?.name ?? booking.contactName;
  const contactEmail = booking.payload?.contact?.email ?? booking.contactEmail;
  const contactPhone = booking.contactPhone;

  const localeLabel = formatLocale(booking.payload?.locale ?? booking.locale);

  const rentalStart =
    booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const rentalEnd = booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;

  const adults = booking.payload?.adults ?? null;
  const children = booking.payload?.children ?? [];
  const drivers = booking.payload?.driver ?? [];

  const invoice = booking.payload?.invoice;
  const consents = booking.payload?.consents;
  const same = booking.payload?.contact?.same;

  const delivery = booking.payload?.delivery;
  const extras = booking.payload?.extras ?? [];

  const carLabel = booking.carLabel ?? booking.carId ?? booking.payload?.carId;
  const tax = booking.payload?.tax;

  return {
    contactName,
    contactEmail,
    localeLabel,
    rentalStart,
    rentalEnd,
    adults,
    children,
    drivers,
    invoice,
    consents,
    same,
    delivery,
    extras,
    carLabel,
    contactPhone,
    tax,
  };
};
