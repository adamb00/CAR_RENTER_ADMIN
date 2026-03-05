import type { BookingAddress } from '@/data-service/bookings';

export const formatAddress = (address?: {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  streetType?: string;
  doorNumber?: string;
}) => {
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
