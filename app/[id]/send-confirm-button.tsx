'use client';

import { FileText } from 'lucide-react';
import { useState, useTransition, type ReactNode } from 'react';

import type {
  BookingAddress,
  BookingChild,
  BookingPayload,
} from '@/data-service/bookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { sendBookingFinalizationEmailAction } from '@/actions/sendBookingFinalizationEmailAction';
import type { BookingRequestData } from '@/types/booking-request';

type ContactInfo = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  same?: boolean | null;
};

type SendConfirmButtonProps = {
  bookingCode: string;
  bookingId: string;
  localeLabel: string;
  carLabel?: string;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  contact: ContactInfo;
  invoice?: BookingPayload['invoice'];
  tax?: BookingPayload['tax'];
  delivery?: BookingPayload['delivery'];
  extras?: string[];
  adults?: number;
  childPassengers?: BookingChild[];
  pricing?: BookingRequestData;
  hasInsuranceConsent?: boolean | null;
};

const booleanLabel = (value: boolean | null | undefined) => {
  if (value == null) return '—';
  return value ? 'Igen' : 'Nem';
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
};

const formatAddress = (address?: BookingAddress | null) => {
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

const formatPlaceType = (value?: string | null) => {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) =>
      part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ''
    )
    .join(' ');
};

const formatExtras = (extras?: string[]) => {
  if (!extras || extras.length === 0) return '—';
  return extras.join(', ');
};

const formatPrice = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '—';
  return `${trimmed} €`;
};

const formatDepositDisplay = (
  value?: string | null,
  hasInsuranceSelected?: boolean
) => {
  if (hasInsuranceSelected) return 'Biztosítással nem szükséges';
  const formatted = formatPrice(value);
  return formatted === '—' ? 'Kaució fizetendő' : formatted;
};

const normalizeMoneyInput = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (lowered === 'false' || lowered === 'no' || lowered === 'nem' || lowered === '0') {
    return null;
  }
  return trimmed;
};

const InfoGroup = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className='rounded-lg border bg-card p-4'>
    <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
      {title}
    </p>
    <div className='mt-3 grid gap-2'>{children}</div>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className='flex flex-col rounded-md border px-3 py-2'>
    <span className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
      {label}
    </span>
    <span className='text-sm font-medium text-foreground break-words'>
      {value ?? '—'}
    </span>
  </div>
);

export const SendConfirmButton = ({
  bookingCode,
  bookingId,
  localeLabel,
  carLabel,
  rentalStart,
  rentalEnd,
  contact,
  invoice,
  tax,
  delivery,
  extras,
  adults,
  childPassengers,
  pricing,
  hasInsuranceConsent,
}: SendConfirmButtonProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [signerName, setSignerName] = useState('');
  const childCount = Array.isArray(childPassengers)
    ? childPassengers.length
    : null;
  const rentalFeeDisplay = formatPrice(pricing?.rentalFee);
  const normalizedInsurance = normalizeMoneyInput(pricing?.insurance);
  const insuranceDisplay = normalizedInsurance
    ? formatPrice(normalizedInsurance)
    : null;
  const deliveryFeeDisplay = formatPrice(pricing?.deliveryFee);
  const wantsInsurance =
    hasInsuranceConsent != null
      ? Boolean(hasInsuranceConsent)
      : Boolean(normalizedInsurance);
  const depositDisplay = formatDepositDisplay(
    pricing?.deposit,
    wantsInsurance
  );
  const extrasDisplay = formatPrice(pricing?.extrasFee);

  const handleSendEmail = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await sendBookingFinalizationEmailAction({
        bookingId,
        signerName,
      });
      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }
      setStatus({
        type: 'success',
        message: result?.success ?? 'Foglalás véglegesítő e-mail elküldve.',
      });
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type='button' variant='outline' className='gap-2'>
          <FileText className='h-4 w-4' />
          Foglalás véglegesítő
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-full sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Foglalás véglegesítő</SheetTitle>
          <SheetDescription>
            A foglaláshoz kapcsolódó legfontosabb adatok összegyűjtve a
            véglegesítéshez.
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6 flex flex-1 flex-col gap-4 overflow-y-auto pb-6 text-sm'>
          <InfoGroup title='Foglalás'>
            <InfoRow label='Foglalás azonosító' value={bookingCode} />
            <InfoRow label='Rendszer ID' value={bookingId} />
            <InfoRow label='Nyelv' value={localeLabel} />
            <InfoRow label='Autó' value={carLabel ?? '—'} />
            <InfoRow
              label='Időszak'
              value={`${formatDate(rentalStart)} → ${formatDate(rentalEnd)}`}
            />
            <InfoRow
              label='Létszám'
              value={`Felnőttek: ${adults ?? '—'} • Gyerekek: ${
                childCount ?? '—'
              }`}
            />
            <InfoRow label='Extrák' value={formatExtras(extras)} />
          </InfoGroup>

          <InfoGroup title='Díjak összesítése'>
            <InfoRow label='Foglalási díj' value={rentalFeeDisplay} />
            {wantsInsurance && insuranceDisplay && (
              <InfoRow label='Biztosítás díja' value={insuranceDisplay} />
            )}
            <InfoRow label='Kaució' value={depositDisplay} />
            <InfoRow label='Kiszállás díja' value={deliveryFeeDisplay} />
            <InfoRow label='Extrák díja' value={extrasDisplay} />
          </InfoGroup>

          <InfoGroup title='Kapcsolattartó'>
            <InfoRow label='Név' value={contact.name ?? '—'} />
            <InfoRow label='Email' value={contact.email ?? '—'} />
            <InfoRow label='Telefon' value={contact.phone ?? '—'} />
            <InfoRow
              label='Kapcsolattartó egyezik a számlázással?'
              value={booleanLabel(contact.same)}
            />
          </InfoGroup>

          <InfoGroup title='Számlázási adatok'>
            <InfoRow label='Név' value={invoice?.name ?? '—'} />
            <InfoRow label='Email' value={invoice?.email ?? '—'} />
            <InfoRow label='Telefon' value={invoice?.phoneNumber ?? '—'} />
            <InfoRow label='Cím' value={formatAddress(invoice?.location)} />
            <InfoRow
              label='Számlázás egyezik a kapcsolattartóval?'
              value={booleanLabel(invoice?.same)}
            />
          </InfoGroup>

          <InfoGroup title='Adó / Cég adatok'>
            <InfoRow label='Cégnév' value={tax?.companyName ?? '—'} />
            <InfoRow label='Adószám' value={tax?.id ?? '—'} />
          </InfoGroup>

          <InfoGroup title='Kiszállítás / Átvétel'>
            <InfoRow
              label='Helytípus'
              value={formatPlaceType(delivery?.placeType)}
            />
            <InfoRow label='Helyszín' value={delivery?.locationName ?? '—'} />
            <InfoRow label='Cím' value={formatAddress(delivery?.address)} />
            <InfoRow
              label='Érkező járat'
              value={delivery?.arrivalFlight ?? '—'}
            />
            <InfoRow
              label='Távozó járat'
              value={delivery?.departureFlight ?? '—'}
            />
          </InfoGroup>

          <div className='rounded-lg border bg-card p-4 space-y-3'>
            <div className='space-y-2'>
              <Input
                type='text'
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                label='Aláíró neve'
              />
            </div>
            <p className='text-sm text-muted-foreground'>
              Az alábbi gombbal elküldheted a foglalás véglegesítő e-mailt az
              ügyfélnek, benne az összes eddig ismert díjjal.
            </p>
            <Button
              type='button'
              className='w-full'
              disabled={isPending || !signerName.trim()}
              onClick={handleSendEmail}
            >
              {isPending ? 'Küldés...' : 'Foglalás véglegesítő e-mail küldése'}
            </Button>
            {status && (
              <p
                className={`text-sm ${
                  status.type === 'error'
                    ? 'text-destructive'
                    : 'text-emerald-600'
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
