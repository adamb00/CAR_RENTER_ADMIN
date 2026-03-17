'use client';

import { Input } from '@/components/ui/input';
import type { ManualBookingFormModel } from '@/hooks/use-manual-booking-form';

type BillingSectionProps = {
  formModel: ManualBookingFormModel;
};

export function BillingSection({ formModel }: BillingSectionProps) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <h2 className='text-base font-semibold'>Kapcsolat / számlázás</h2>
      <div className='grid gap-4 md:grid-cols-2'>
        <label className='md:col-span-3 flex items-center gap-2 text-sm text-muted-foreground'>
          <input
            type='checkbox'
            checked={formModel.contactMatchesPrimaryDriver}
            onChange={(event) =>
              formModel.setContactMatchesPrimaryDriver(event.target.checked)
            }
          />
          Kapcsolati és számlázási adatok megegyeznek az elsődleges sofőr
          adataival
        </label>
        <Input
          label='Számlázási név'
          value={formModel.form.invoiceName}
          onChange={(event) =>
            formModel.updateField('invoiceName', event.target.value)
          }
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Számlázási ország'
          value={formModel.form.invoiceCountry}
          onChange={(event) =>
            formModel.updateField('invoiceCountry', event.target.value)
          }
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Számlázási irányítószám'
          value={formModel.form.invoicePostalCode}
          onChange={(event) =>
            formModel.updateField('invoicePostalCode', event.target.value)
          }
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Számlázási város'
          value={formModel.form.invoiceCity}
          onChange={(event) =>
            formModel.updateField('invoiceCity', event.target.value)
          }
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Számlázási utca'
          value={formModel.form.invoiceStreet}
          onChange={(event) =>
            formModel.updateField('invoiceStreet', event.target.value)
          }
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Számlázási közterület jellege'
          value={formModel.form.invoiceStreetType}
          onChange={(event) =>
            formModel.updateField('invoiceStreetType', event.target.value)
          }
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Számlázási házszám / ajtó'
          value={formModel.form.invoiceDoorNumber}
          onChange={(event) =>
            formModel.updateField('invoiceDoorNumber', event.target.value)
          }
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Adószám'
          value={formModel.form.taxId}
          onChange={(event) => formModel.updateField('taxId', event.target.value)}
        />
        <Input
          label='Cégnév'
          value={formModel.form.taxCompanyName}
          onChange={(event) =>
            formModel.updateField('taxCompanyName', event.target.value)
          }
        />
      </div>
    </div>
  );
}
