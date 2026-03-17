'use client';

import { Button } from '@/components/ui/button';

import { CarFleetAddFormBasicSection } from './car-fleet-add-form-basic-section';
import { CarFleetAddFormCostsSection } from './car-fleet-add-form-costs-section';
import { CarFleetAddFormServiceSection } from './car-fleet-add-form-service-section';
import { FleetAddFormProps } from './types';
import { useCarFleetAddForm } from '@/hooks/use-car-fleet-add-form';

export type { FleetEditSection } from './types';

export function FleetAddForm(props: FleetAddFormProps) {
  const formModel = useCarFleetAddForm(props);

  return (
    <div className='space-y-4 rounded-xl border bg-card/40 p-6 shadow-sm'>
      <h2 className='text-lg font-semibold'>{formModel.title}</h2>
      <form
        className='grid gap-4 md:grid-cols-2'
        onSubmit={formModel.handleSubmit}
      >
        {formModel.showBasicSection && (
          <CarFleetAddFormBasicSection formModel={formModel} />
        )}
        {formModel.showServiceSection && (
          <CarFleetAddFormServiceSection formModel={formModel} />
        )}
        {formModel.showCostsSection && (
          <CarFleetAddFormCostsSection formModel={formModel} />
        )}

        <div className='md:col-span-2 flex items-center justify-end gap-3'>
          <Button
            type='button'
            variant='secondary'
            onClick={formModel.redirectToEditPage}
            disabled={formModel.isPending}
          >
            Mégse
          </Button>
          <Button type='submit' disabled={formModel.isPending}>
            {formModel.submitLabel}
          </Button>
        </div>
      </form>
      {formModel.statusMessage && (
        <p className='text-sm text-muted-foreground'>
          {formModel.statusMessage}
        </p>
      )}
    </div>
  );
}
