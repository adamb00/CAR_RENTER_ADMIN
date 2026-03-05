import { Booking } from '@/data-service/bookings';
import type { PricingBreakdown } from '@/hooks/use-rental-pricing';
import { formatArrivalTime } from '@/lib/format/format-date';
import { Button } from '../ui/button';
import { FloatingSelect } from '../ui/floating-select';
import InfoGroup from '../ui/info-group';
import InfoRow from '../ui/info-row';
import { Input } from '../ui/input';

import { formatAddress } from '@/lib/format/format-address';
import { getRentDetails } from '@/lib/rent-details';
import type { DeliveryFormState, StatusMessage } from './types';
import { ChangeEvent, useState, useTransition } from 'react';
import { saveBookingDeliveryAction } from '@/actions/saveBookingDeliveryAction';
import { formatPlaceType } from '@/lib/format/format-place';
import { buildDeliveryFormState, requiresDeliveryAddress } from './utils';

export default function DeliveryDetails({
  booking,
  deliveryValues,
  setDeliverySaved,
  setDeliveryValues,
  deliveryDetailsRequired,
  pricing,
}: {
  booking: Booking;
  deliveryValues: DeliveryFormState;
  setDeliveryValues: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  setDeliverySaved: React.Dispatch<React.SetStateAction<boolean>>;
  deliveryDetailsRequired: boolean;
  pricing?: PricingBreakdown;
}) {
  const { delivery } = getRentDetails(booking);
  const [isSavingDelivery, startDeliveryTransition] = useTransition();

  const [deliveryStatus, setDeliveryStatus] = useState<StatusMessage | null>(
    null,
  );

  const formattedDeliveryAddress = formatAddress(delivery?.address);

  const deliveryTypeDisplay = formatPlaceType(
    delivery?.placeType ?? deliveryValues.placeType,
  );

  const deliveryLocationDisplay =
    delivery?.locationName && delivery.locationName.trim().length > 0
      ? delivery.locationName
      : deliveryValues.locationName.trim() || '—';
  const deliveryAddressDisplay =
    formattedDeliveryAddress !== '—'
      ? formattedDeliveryAddress
      : deliveryValues.address.trim() || '—';

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

  const deliveryRequiresAddress = requiresDeliveryAddress(
    deliveryValues.placeType.trim(),
  );

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
        bookingId: booking.id,
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
          <InfoRow label='Helyszín neve' value={deliveryLocationDisplay} />
          <InfoRow label='Cím' value={deliveryAddressDisplay} />
        </>
      )}
      <InfoRow label='Érkező járat' value={delivery?.arrivalFlight ?? '—'} />
      <InfoRow
        label='Érkezés ideje'
        value={formatArrivalTime(
          delivery?.arrivalHour,
          delivery?.arrivalMinute,
        )}
      />
      <InfoRow label='Távozó járat' value={delivery?.departureFlight ?? '—'} />
    </InfoGroup>
  );
}
