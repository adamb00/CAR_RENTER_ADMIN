'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FloatingTextarea } from '@/components/ui/textarea';
import type { ManualBookingFormModel } from '@/hooks/use-manual-booking-form';
import type { ChildDraft } from './types';

type PassengersSectionProps = {
  formModel: ManualBookingFormModel;
};

export function PassengersSection({ formModel }: PassengersSectionProps) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <h2 className='text-base font-semibold'>Utasok és extrák</h2>
      <div className='grid gap-4 md:grid-cols-2'>
        <Input
          label='Felnőttek száma'
          type='number'
          min='0'
          step='1'
          value={formModel.form.adults}
          onChange={(event) =>
            formModel.updateField('adults', event.target.value)
          }
        />
      </div>
      <FloatingTextarea
        label='Extrák (soronként vagy vesszővel elválasztva)'
        value={formModel.form.extrasText}
        onChange={(event) =>
          formModel.updateField('extrasText', event.target.value)
        }
      />
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Gyerekek</h3>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={formModel.addChild}
          >
            Gyerek hozzáadása
          </Button>
        </div>
        {formModel.form.children.map((child: ChildDraft, index: number) => (
          <div
            key={index}
            className='grid gap-3 rounded-md border p-3 md:grid-cols-3'
          >
            <Input
              label={`Gyerek ${index + 1} - életkor`}
              type='number'
              min='0'
              step='0.5'
              value={child.age}
              onChange={(event) =>
                formModel.updateChild(index, 'age', event.target.value)
              }
            />
            <Input
              label={`Gyerek ${index + 1} - magasság (cm)`}
              type='number'
              min='0'
              step='1'
              value={child.height}
              onChange={(event) =>
                formModel.updateChild(index, 'height', event.target.value)
              }
            />
            <div className='flex items-end'>
              <Button
                type='button'
                variant='outline'
                onClick={() => formModel.removeChild(index)}
                className='w-full'
              >
                Törlés
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
