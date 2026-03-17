'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { CarFleetAddFormModel } from '@/hooks/use-car-fleet-add-form';
import type { ServiceCostDraft } from './types';

type CarFleetAddFormCostsSectionProps = {
  formModel: CarFleetAddFormModel;
};

export function CarFleetAddFormCostsSection({
  formModel,
}: CarFleetAddFormCostsSectionProps) {
  return (
    <div className='md:col-span-2 space-y-3 rounded-lg border p-4'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold'>Szerviz költség tételek</h3>
        <Button type='button' variant='outline' onClick={formModel.addServiceCost}>
          Új időpont hozzáadása
        </Button>
      </div>

      {formModel.form.serviceCosts.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          Még nincs rögzített szerviz költség.
        </p>
      )}

      {formModel.form.serviceCosts.map((entry: ServiceCostDraft) => (
        <div
          key={entry.id}
          className='grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end'
        >
          <Input
            label='Szerviz időpontja'
            type='date'
            value={entry.serviceDate}
            onChange={(event) =>
              formModel.updateServiceCost(
                entry.id,
                'serviceDate',
                event.target.value,
              )
            }
          />
          <Input
            label='Szerviz díja'
            type='number'
            inputMode='decimal'
            min={0}
            value={entry.serviceFee}
            onChange={(event) =>
              formModel.updateServiceCost(
                entry.id,
                'serviceFee',
                event.target.value,
              )
            }
          />
          <Input
            label='Megjegyzés (opcionális)'
            value={entry.note}
            onChange={(event) =>
              formModel.updateServiceCost(entry.id, 'note', event.target.value)
            }
          />
          <Button
            type='button'
            variant='secondary'
            onClick={() => formModel.removeServiceCost(entry.id)}
          >
            Törlés
          </Button>
        </div>
      ))}
    </div>
  );
}
