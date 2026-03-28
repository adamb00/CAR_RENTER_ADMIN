import type { BookingAddress } from '@/data-service/bookings';

export const formatAddress = (address?: BookingAddress) => {
  if (!address) return '—';
  const parts = [
    address.country,
    address.postalCode,
    address.city,
    address.street,
    address.streetType,
    address.doorNumber,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
};

export const formatAddressInputValue = (address?: BookingAddress | null) => {
  const formattedAddress = formatAddress(address ?? undefined);
  return formattedAddress === '—' ? '' : formattedAddress;
};
