'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { CarFleetAddFormModel } from '@/hooks/use-car-fleet-add-form';
import type { FleetPlacesOptions, FleetStatusLabel } from './types';

type CarFleetAddFormBasicSectionProps = {
  formModel: CarFleetAddFormModel;
};

export function CarFleetAddFormBasicSection({
  formModel,
}: CarFleetAddFormBasicSectionProps) {
  return (
    <>
      <Input
        label='Rendszám'
        value={formModel.form.plate}
        onChange={(event) => formModel.updateField('plate', event.target.value)}
        required
      />
      <Input
        label='Évjárat'
        value={formModel.form.year}
        onChange={(event) => formModel.updateField('year', event.target.value)}
      />
      <FloatingSelect
        label='Státusz'
        value={formModel.selectedStatusValue}
        onChange={(event) => formModel.setStatus(event.target.value)}
      >
        {formModel.statusOptions.map(
          (status: { value: string; label: FleetStatusLabel }) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ),
        )}
      </FloatingSelect>
      <Input
        label='Első forgalomba helyezés'
        type='date'
        value={formModel.form.firstRegistration}
        onChange={(event) =>
          formModel.updateField('firstRegistration', event.target.value)
        }
      />
      <Input
        label='Flottába vétel dátuma'
        type='date'
        value={formModel.form.addedAt}
        onChange={(event) =>
          formModel.updateField('addedAt', event.target.value)
        }
      />
      <div className='relative w-full'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='outline'
              className='peer h-12 w-full justify-start font-normal'
            >
              <span className='inline-flex items-center gap-2'>
                <span
                  className='h-2.5 w-2.5 rounded-full border border-black/10'
                  style={{
                    backgroundColor:
                      formModel.selectedPlace?.color ?? '#888888',
                  }}
                  aria-hidden
                />
                <span>
                  {formModel.selectedPlace?.label ?? formModel.form.location}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            className='w-(--radix-dropdown-menu-trigger-width)'
          >
            {formModel.placesOptions.map(
              (place: {
                value: string;
                label: FleetPlacesOptions;
                color: string;
              }) => (
                <DropdownMenuItem
                  key={place.value}
                  className='cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground'
                  onSelect={() =>
                    formModel.setLocation(place.label as FleetPlacesOptions)
                  }
                >
                  <span className='inline-flex items-center gap-2'>
                    <span
                      className='h-2.5 w-2.5 rounded-full border border-black/10'
                      style={{ backgroundColor: place.color }}
                      aria-hidden
                    />
                    <span>{place.label}</span>
                  </span>
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <label className='pointer-events-none absolute -top-2 left-3 translate-x-2 bg-background px-2 text-sm text-slate-600'>
          Helyszín
        </label>
      </div>
      <Input
        label='Alvázszám'
        value={formModel.form.vin}
        onChange={(event) => formModel.updateField('vin', event.target.value)}
      />
      <Input
        label='Motorszám'
        value={formModel.form.engineNumber}
        onChange={(event) =>
          formModel.updateField('engineNumber', event.target.value)
        }
      />
    </>
  );
}
