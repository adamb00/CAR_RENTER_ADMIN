import { Booking } from '@/data-service/bookings';
import { formatLocale } from './format/format-locale';

export const getRentDetails = (booking: Booking) => {
  const contactName = booking.contactName || booking.renter?.name;
  const contactEmail = booking.contactEmail || booking.renter?.email;
  const contactPhone = booking.contactPhone || booking.renter?.phone;

  const localeLabel = formatLocale(booking.payload?.locale ?? booking.locale);

  const rentalStart =
    booking.rentalStart ?? booking.payload?.rentalPeriod?.startDate;
  const rentalEnd = booking.rentalEnd ?? booking.payload?.rentalPeriod?.endDate;

  const adults = booking.payload?.adults ?? null;
  const children = booking.payload?.children ?? [];
  const drivers = booking.payload?.driver ?? [];

  const invoice = booking.payload?.invoice;
  const consents = {
    ...booking.payload?.consents,
    paymentMethod:
      booking.renter?.paymentMethod ?? booking.payload?.consents?.paymentMethod,
  };
  const same = booking.payload?.contact?.same;

  const delivery = booking.delivery;
  const extras = booking.payload?.extras ?? [];

  const carLabel = booking.carLabel ?? booking.carId ?? booking.payload?.carId;
  const tax =
    booking.renter?.taxId || booking.renter?.companyName
      ? {
          id: booking.renter?.taxId ?? undefined,
          companyName: booking.renter?.companyName ?? undefined,
        }
      : booking.payload?.tax;

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
