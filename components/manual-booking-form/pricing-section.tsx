'use client';

import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import type { ManualBookingFormModel } from '@/hooks/use-manual-booking-form';

import { paymentMethodOptions } from './constants';

type PricingSectionProps = {
  formModel: ManualBookingFormModel;
};

export function PricingSection({ formModel }: PricingSectionProps) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <h2 className='text-base font-semibold'>Díjak és fizetési adatok</h2>
      <div className='grid gap-4 md:grid-cols-5'>
        <Input
          label='Foglalási díj'
          value={formModel.form.pricingRentalFee}
          onChange={(event) =>
            formModel.updateField('pricingRentalFee', event.target.value)
          }
        />
        <Input
          label='Biztosítás díja'
          value={formModel.form.pricingInsurance}
          onChange={(event) =>
            formModel.updateField('pricingInsurance', event.target.value)
          }
        />
        <Input
          label='Kaució'
          value={formModel.form.pricingDeposit}
          onChange={(event) =>
            formModel.updateField('pricingDeposit', event.target.value)
          }
        />
        <Input
          label='Kiszallitas dija'
          value={formModel.form.pricingDeliveryFee}
          onChange={(event) =>
            formModel.updateField('pricingDeliveryFee', event.target.value)
          }
        />
        <Input
          label='Extrák díja'
          value={formModel.form.pricingExtrasFee}
          onChange={(event) =>
            formModel.updateField('pricingExtrasFee', event.target.value)
          }
        />
        <Input
          label='Jatt (kiadáskor)'
          type='number'
          inputMode='decimal'
          min='0'
          step='0.01'
          value={formModel.form.handoverTip}
          onChange={(event) =>
            formModel.updateField('handoverTip', event.target.value)
          }
        />
        <Input
          label='Tankolás (kiadáskor)'
          type='number'
          inputMode='decimal'
          min='0'
          step='0.01'
          value={formModel.form.handoverFuelCost}
          onChange={(event) =>
            formModel.updateField('handoverFuelCost', event.target.value)
          }
        />
        <Input
          label='Komp (kiadáskor)'
          type='number'
          inputMode='decimal'
          min='0'
          step='0.01'
          value={formModel.form.handoverFerryCost}
          onChange={(event) =>
            formModel.updateField('handoverFerryCost', event.target.value)
          }
        />
        <Input
          label='Takarítás (kiadáskor)'
          type='number'
          inputMode='decimal'
          min='0'
          step='0.01'
          value={formModel.form.handoverCleaningCost}
          onChange={(event) =>
            formModel.updateField('handoverCleaningCost', event.target.value)
          }
        />
        <Input
          label='Jutalék (kiadáskor)'
          type='number'
          inputMode='decimal'
          min='0'
          step='0.01'
          value={formModel.form.handoverCommission}
          onChange={(event) =>
            formModel.updateField('handoverCommission', event.target.value)
          }
        />
        <FloatingSelect
          label='Fizetési mód'
          value={formModel.form.paymentMethod}
          onChange={(event) =>
            formModel.updateField('paymentMethod', event.target.value)
          }
        >
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>
      </div>
    </div>
  );
}
