'use client';

import { FileText } from 'lucide-react';
import {
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from 'react';

import { saveBookingDeliveryAction } from '@/actions/saveBookingDeliveryAction';
import { saveBookingPricingAction } from '@/actions/saveBookingPricingAction';
import { sendBookingFinalizationEmailAction } from '@/actions/sendBookingFinalizationEmailAction';
import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type {
  BookingAddress,
  BookingChild,
  BookingPayload,
} from '@/data-service/bookings';
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
  hasQuote: boolean;
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

const extractAddressText = (address?: BookingAddress | null) => {
  if (!address) return '';
  const parts = [
    address.country,
    address.postalCode,
    address.city,
    address.street,
    address.streetType,
    address.doorNumber,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
};

const formatAddress = (address?: BookingAddress | null) => {
  const formatted = extractAddressText(address);
  return formatted.length > 0 ? formatted : '—';
};

const formatPlaceType = (value?: string | null) => {
  if (!value) return '—';
  const map: Record<string, string> = {
    airport: 'Átvétel a reptéren',
    accommodation: 'Átvétel a szállodánál',
    office: 'Átvétel az irodánál',
  };
  return map[value] ?? value;
};

const formatArrivalTime = (hour?: string | null, minute?: string | null) => {
  const hourText = hour?.trim() ?? '';
  const minuteText = minute?.trim() ?? '';
  if (!hourText && !minuteText) return '—';

  const normalizedHour =
    hourText.length > 0 && /^\d+$/.test(hourText)
      ? hourText.padStart(2, '0')
      : hourText || '--';
  const normalizedMinute =
    minuteText.length > 0 && /^\d+$/.test(minuteText)
      ? minuteText.padStart(2, '0')
      : minuteText || '--';

  return `${normalizedHour}:${normalizedMinute}`;
};

const requiresDeliveryAddress = (placeType?: string | null) =>
  placeType === 'airport' || placeType === 'accommodation';

const formatExtras = (extras?: string[]) => {
  if (!extras || extras.length === 0) return '—';
  return extras.join(', ');
};

type StatusMessage = { type: 'success' | 'error'; message: string };
type PricingKeys =
  | 'rentalFee'
  | 'insurance'
  | 'deposit'
  | 'deliveryFee'
  | 'extrasFee';
type PricingFormState = Record<PricingKeys, string>;
type DeliveryFormState = {
  placeType: string;
  locationName: string;
  address: string;
};

const buildPricingFormState = (
  pricing?: Pick<BookingRequestData, PricingKeys>,
): PricingFormState => ({
  rentalFee: pricing?.rentalFee ?? '',
  insurance: pricing?.insurance ?? '',
  deposit: pricing?.deposit ?? '',
  deliveryFee: pricing?.deliveryFee ?? '',
  extrasFee: pricing?.extrasFee ?? '',
});

const buildDeliveryFormState = (
  delivery?: BookingPayload['delivery'] | null,
  pricing?: BookingRequestData,
): DeliveryFormState => ({
  placeType: delivery?.placeType ?? '',
  locationName: delivery?.locationName ?? pricing?.deliveryLocation ?? '',
  address: extractAddressText(delivery?.address ?? null),
});

const hasPricingValues = (
  pricing?: Pick<BookingRequestData, PricingKeys> | null,
) =>
  Boolean(
    pricing &&
    [
      pricing.rentalFee,
      pricing.insurance,
      pricing.deposit,
      pricing.deliveryFee,
      pricing.extrasFee,
    ].some((value) => typeof value === 'string' && value.trim().length > 0),
  );

const hasDeliveryFeeValue = (value?: string | null) =>
  typeof value === 'string' && value.trim().length > 0;

const hasDeliveryLocation = (delivery?: BookingPayload['delivery'] | null) =>
  Boolean(delivery?.locationName && delivery.locationName.trim().length > 0);

const hasDeliveryAddress = (delivery?: BookingPayload['delivery'] | null) =>
  extractAddressText(delivery?.address ?? null).trim().length > 0;

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
    <span className='text-sm font-medium text-foreground wrap-break-word'>
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
  hasQuote,
}: SendConfirmButtonProps) => {
  const [open, setOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<StatusMessage | null>(null);
  const [pricingStatus, setPricingStatus] = useState<StatusMessage | null>(
    null,
  );
  const [isSendingEmail, startSendTransition] = useTransition();
  const [isSavingPricing, startPricingTransition] = useTransition();
  const [signerName, setSignerName] = useState('');
  const [pricingValues, setPricingValues] = useState<PricingFormState>(() =>
    buildPricingFormState(pricing),
  );
  const [deliveryValues, setDeliveryValues] = useState<DeliveryFormState>(() =>
    buildDeliveryFormState(delivery, pricing),
  );
  const deliveryPlaceType = delivery?.placeType?.trim() ?? '';
  const deliveryDetailsRequired =
    hasDeliveryFeeValue(pricing?.deliveryFee) &&
    (!deliveryPlaceType ||
      (requiresDeliveryAddress(deliveryPlaceType) &&
        (!hasDeliveryLocation(delivery) || !hasDeliveryAddress(delivery))));
  const [deliveryStatus, setDeliveryStatus] = useState<StatusMessage | null>(
    null,
  );
  const [isSavingDelivery, startDeliveryTransition] = useTransition();
  const [deliverySaved, setDeliverySaved] = useState(
    () => !deliveryDetailsRequired,
  );

  useEffect(() => {
    if (hasQuote) return;
    setPricingValues(buildPricingFormState(pricing));
  }, [hasQuote, pricing]);

  useEffect(() => {
    setDeliveryValues(buildDeliveryFormState(delivery, pricing));
  }, [delivery, pricing]);

  const childCount = Array.isArray(childPassengers)
    ? childPassengers.length
    : null;

  const [saved, setSaved] = useState(() => hasPricingValues(pricing));

  useEffect(() => {
    setSaved(hasPricingValues(pricing));
  }, [pricing]);

  const formattedDeliveryAddress = formatAddress(delivery?.address);
  const deliveryTypeDisplay = formatPlaceType(
    delivery?.placeType ?? deliveryValues.placeType,
  );
  const deliveryRequiresAddress = requiresDeliveryAddress(
    deliveryValues.placeType.trim(),
  );
  const deliveryLocationDisplay =
    delivery?.locationName && delivery.locationName.trim().length > 0
      ? delivery.locationName
      : deliveryValues.locationName.trim() || '—';
  const deliveryAddressDisplay =
    formattedDeliveryAddress !== '—'
      ? formattedDeliveryAddress
      : deliveryValues.address.trim() || '—';

  const handleSendEmail = () => {
    setEmailStatus(null);
    startSendTransition(async () => {
      const result = await sendBookingFinalizationEmailAction({
        bookingId,
        signerName,
      });
      if (result?.error) {
        setEmailStatus({ type: 'error', message: result.error });
        return;
      }
      setEmailStatus({
        type: 'success',
        message: result?.success ?? 'Foglalás véglegesítő e-mail elküldve.',
      });
    });
  };

  const handlePricingInputChange =
    (field: PricingKeys) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setSaved(false);
      setPricingValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSavePricing = () => {
    setPricingStatus(null);
    startPricingTransition(async () => {
      const payload = {
        rentalFee: pricingValues.rentalFee.trim() || undefined,
        insurance: pricingValues.insurance.trim() || undefined,
        deposit: pricingValues.deposit.trim() || undefined,
        deliveryFee: pricingValues.deliveryFee.trim() || undefined,
        extrasFee: pricingValues.extrasFee.trim() || undefined,
      };
      const result = await saveBookingPricingAction({
        bookingId,
        pricing: payload,
      });
      if (result?.error) {
        setPricingStatus({ type: 'error', message: result.error });
        return;
      }
      setPricingStatus({
        type: 'success',
        message: result?.success ?? 'Díjak elmentve.',
      });
      setPricingValues(buildPricingFormState(result.pricing));
      setSaved(hasPricingValues(result.pricing));
    });
  };

  const handleDeliveryInputChange =
    (field: keyof DeliveryFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setDeliverySaved(false);
      setDeliveryValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSaveDelivery = () => {
    setDeliveryStatus(null);
    startDeliveryTransition(async () => {
      const placeType = deliveryValues.placeType.trim();
      const locationName = deliveryValues.locationName.trim();
      const address = deliveryValues.address.trim();
      const needsAddress = requiresDeliveryAddress(placeType);

      if (!placeType || (needsAddress && (!locationName || !address))) {
        setDeliveryStatus({
          type: 'error',
          message:
            'Add meg az átvétel helyét. Reptér/szálloda esetén a helyszín és a cím is kötelező.',
        });
        return;
      }

      const result = await saveBookingDeliveryAction({
        bookingId,
        delivery: {
          placeType,
          locationName: locationName || undefined,
          address: address || undefined,
        },
      });

      if (result?.error) {
        setDeliveryStatus({ type: 'error', message: result.error });
        return;
      }

      setDeliveryStatus({
        type: 'success',
        message: result?.success ?? 'Átvételi adatok elmentve.',
      });
      setDeliveryValues(buildDeliveryFormState(result.delivery, pricing));
      setDeliverySaved(true);
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
            <div className='space-y-3'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <Input
                  type='text'
                  label='Foglalási díj (€)'
                  value={pricingValues.rentalFee}
                  onChange={handlePricingInputChange('rentalFee')}
                />
                <Input
                  type='text'
                  label='Biztosítás díja (€)'
                  value={pricingValues.insurance}
                  onChange={handlePricingInputChange('insurance')}
                />
                <Input
                  type='text'
                  label='Kaució (€)'
                  value={pricingValues.insurance ? 0 : pricingValues.deposit}
                  onChange={handlePricingInputChange('deposit')}
                />
                <Input
                  type='text'
                  label='Átvétel díja (€)'
                  value={pricingValues.deliveryFee}
                  onChange={handlePricingInputChange('deliveryFee')}
                />
                <Input
                  type='text'
                  label='Extrák díja (€)'
                  value={pricingValues.extrasFee}
                  onChange={handlePricingInputChange('extrasFee')}
                />
              </div>
              <div className='space-y-2'>
                <Button
                  type='button'
                  variant='secondary'
                  className='w-full sm:w-auto'
                  disabled={isSavingPricing}
                  onClick={handleSavePricing}
                >
                  {isSavingPricing ? 'Mentés...' : 'Díjak mentése'}
                </Button>
                {pricingStatus && (
                  <p
                    className={`text-sm ${
                      pricingStatus.type === 'error'
                        ? 'text-destructive'
                        : 'text-emerald-600'
                    }`}
                  >
                    {pricingStatus.message}
                  </p>
                )}
              </div>
            </div>
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

          <InfoGroup title='Átvétel'>
            {deliveryDetailsRequired ? (
              <div className='space-y-3'>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <FloatingSelect
                    label='Átvétel helye'
                    alwaysFloatLabel
                    value={deliveryValues.placeType}
                    onChange={handleDeliveryInputChange('placeType')}
                  >
                    <option value=''>Válassz átvételi helyet</option>
                    <option value='airport'>Reptér</option>
                    <option value='accommodation'>Szálloda</option>
                    <option value='office'>Iroda</option>
                  </FloatingSelect>
                  {deliveryRequiresAddress ? (
                    <>
                      <Input
                        type='text'
                        label='Helyszín neve'
                        value={deliveryValues.locationName}
                        onChange={handleDeliveryInputChange('locationName')}
                      />
                      <div className='sm:col-span-2'>
                        <Input
                          type='text'
                          label='Cím'
                          value={deliveryValues.address}
                          onChange={handleDeliveryInputChange('address')}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
                <div className='space-y-2'>
                  <Button
                    type='button'
                    variant='secondary'
                    className='w-full sm:w-auto'
                    disabled={
                      isSavingDelivery ||
                      !deliveryValues.placeType.trim() ||
                      (deliveryRequiresAddress &&
                        (!deliveryValues.locationName.trim() ||
                          !deliveryValues.address.trim()))
                    }
                    onClick={handleSaveDelivery}
                  >
                    {isSavingDelivery ? 'Mentés...' : 'Átvételi adatok mentése'}
                  </Button>
                  {deliveryStatus && (
                    <p
                      className={`text-sm ${
                        deliveryStatus.type === 'error'
                          ? 'text-destructive'
                          : 'text-emerald-600'
                      }`}
                    >
                      {deliveryStatus.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <InfoRow label='Átvétel helye' value={deliveryTypeDisplay} />
                <InfoRow
                  label='Helyszín neve'
                  value={deliveryLocationDisplay}
                />
                <InfoRow label='Cím' value={deliveryAddressDisplay} />
              </>
            )}
            <InfoRow
              label='Érkező járat'
              value={delivery?.arrivalFlight ?? '—'}
            />
            <InfoRow
              label='Érkezés ideje'
              value={formatArrivalTime(
                delivery?.arrivalHour,
                delivery?.arrivalMinute,
              )}
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
              disabled={
                isSendingEmail ||
                !signerName.trim() ||
                !saved ||
                (deliveryDetailsRequired && !deliverySaved)
              }
              onClick={handleSendEmail}
            >
              {isSendingEmail
                ? 'Küldés...'
                : 'Foglalás véglegesítő e-mail küldése'}
            </Button>
            {emailStatus && (
              <p
                className={`text-sm ${
                  emailStatus.type === 'error'
                    ? 'text-destructive'
                    : 'text-emerald-600'
                }`}
              >
                {emailStatus.message}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
