import { saveBookingPricingAction } from '@/actions/saveBookingPricingAction';
import { hasPricingDetails } from '@/hooks/use-rental-pricing';
import React, { ChangeEvent, useState, useTransition } from 'react';
import { Button } from '../ui/button';
import InfoGroup from '../ui/info-group';
import { Input } from '../ui/input';
import type { PricingFormState, PricingKeys, StatusMessage } from './types';
import { buildPricingFormState } from './utils';

type PriceDetailsProps = {
  pricingValues: PricingFormState;
  setPricingValues: React.Dispatch<React.SetStateAction<PricingFormState>>;
  setSaved: React.Dispatch<React.SetStateAction<boolean>>;
  bookingId: string;
};

export default function PriceDetails({
  pricingValues,
  setPricingValues,
  setSaved,
  bookingId,
}: PriceDetailsProps) {
  const handlePricingInputChange =
    (field: PricingKeys) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setSaved(false);
      setPricingValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const [isSavingPricing, startPricingTransition] = useTransition();
  const [pricingStatus, setPricingStatus] = useState<StatusMessage | null>(
    null,
  );

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
      setSaved(hasPricingDetails(result.pricing));
    });
  };
  return (
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
  );
}
