'use client';

import CarDamages from '@/components/car/car-damages';
import { Input } from '@/components/ui/input';
import { FloatingTextarea } from '@/components/ui/textarea';

import type { CarFleetAddFormModel } from '@/hooks/use-car-fleet-add-form';

type CarFleetAddFormServiceSectionProps = {
  formModel: CarFleetAddFormModel;
};

export function CarFleetAddFormServiceSection({
  formModel,
}: CarFleetAddFormServiceSectionProps) {
  return (
    <>
      <Input
        label='Km óra'
        type='number'
        inputMode='numeric'
        min={0}
        value={formModel.form.odometer}
        onChange={(event) =>
          formModel.updateField('odometer', event.target.value)
        }
      />
      <Input
        label='Műszaki vizsga lejárata'
        type='date'
        value={formModel.form.inspectionExpiry}
        onChange={(event) =>
          formModel.updateField('inspectionExpiry', event.target.value)
        }
      />
      <Input
        label='Utolsó szerviz időpontja'
        type='date'
        value={formModel.form.lastServiceAt}
        onChange={(event) =>
          formModel.updateField('lastServiceAt', event.target.value)
        }
      />
      <Input
        label='Utolsó szerviz km'
        type='number'
        inputMode='numeric'
        min={0}
        value={formModel.form.lastServiceMileage}
        onChange={(event) =>
          formModel.updateField('lastServiceMileage', event.target.value)
        }
      />
      <Input
        label='Szerviz intervallum (km)'
        type='number'
        inputMode='numeric'
        min={0}
        value={formModel.form.serviceIntervalKm}
        onChange={(event) =>
          formModel.updateField('serviceIntervalKm', event.target.value)
        }
      />
      <div className='flex gap-4'>
        <Input
          label='Következő szerviz tól'
          type='date'
          value={formModel.form.nextServiceFrom}
          onChange={(event) =>
            formModel.updateField('nextServiceFrom', event.target.value)
          }
        />
        <Input
          label='Következő szerviz ig'
          type='date'
          value={formModel.form.nextServiceTo}
          onChange={(event) =>
            formModel.updateField('nextServiceTo', event.target.value)
          }
        />
      </div>
      <div className='md:col-span-2 space-y-2'>
        <FloatingTextarea
          label='Megjegyzések'
          value={formModel.form.notes}
          onChange={(event) => formModel.updateField('notes', event.target.value)}
        />
      </div>
      <div className='md:col-span-2 space-y-2'>
        <FloatingTextarea
          label='Ismert sérülések'
          value={formModel.form.damages}
          onChange={(event) =>
            formModel.updateField('damages', event.target.value)
          }
        />
      </div>
      <div className='md:col-span-2'>
        <CarDamages
          carId={formModel.carId}
          vehicleId={formModel.vehicleId}
          initialImages={formModel.form.damagesImages}
          onImagesChange={(images) => formModel.updateField('damagesImages', images)}
          persistImages={formModel.persistDamageImages}
        />
      </div>
    </>
  );
}
