'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useManualBookingForm } from '@/hooks/use-manual-booking-form';

import { BillingSection } from './billing-section';
import { BookingDetailsSection } from './booking-details-section';
import { DeliverySection } from './delivery-section';
import { DriversSection } from './drivers-section';
import { PassengersSection } from './passengers-section';
import { PricingSection } from './pricing-section';
import type { ManualBookingFormProps } from './types';

export function ManualBookingForm(props: ManualBookingFormProps) {
  const formModel = useManualBookingForm(props);

  return (
    <form onSubmit={formModel.handleSubmit} className='space-y-6'>
      <BookingDetailsSection formModel={formModel} />
      <PricingSection formModel={formModel} />
      <PassengersSection formModel={formModel} />
      <DriversSection formModel={formModel} />
      <BillingSection formModel={formModel} />
      <DeliverySection formModel={formModel} />

      {formModel.message && (
        <p
          className={`text-sm ${
            formModel.message.type === 'error'
              ? 'text-destructive'
              : 'text-emerald-600'
          }`}
        >
          {formModel.message.text}
        </p>
      )}

      <div className='flex flex-wrap items-center gap-3'>
        <Button type='submit' disabled={formModel.isPending}>
          {formModel.isPending ? 'Mentés...' : 'Foglalás mentése'}
        </Button>
        <Button
          type='button'
          variant='outline'
          asChild
          disabled={formModel.isPending}
        >
          <Link href='/calendar'>Mégse</Link>
        </Button>
      </div>
    </form>
  );
}
