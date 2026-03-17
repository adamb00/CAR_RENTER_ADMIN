'use client';

import { FloatingSelect } from '@/components/ui/floating-select';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  CAR_BODY_TYPE_LABELS,
  CAR_BODY_TYPES,
  CAR_FUEL_LABELS,
  CAR_FUELS,
  CAR_TRANSMISSION_LABELS,
  CAR_TRANSMISSIONS,
} from '@/lib/car-options';
import type { NewCarFormModel } from '@/hooks/use-new-car-form';

import { FormSection } from './utils';

type BaseSectionProps = {
  formModel: NewCarFormModel;
};

export function BaseSection({ formModel }: BaseSectionProps) {
  return (
    <FormSection
      title='Alapadatok'
      description='Add meg az autó alapvető adatait.'
    >
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <FormField
          control={formModel.form.control}
          name='manufacturer'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} label='Márka' placeholder='Audi' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formModel.form.control}
          name='model'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} label='Típus' placeholder='A3 Sportback' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formModel.form.control}
          name='bodyType'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingSelect {...field} value={field.value ?? ''} label='Kivitel'>
                  {CAR_BODY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CAR_BODY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </FloatingSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formModel.form.control}
          name='fuel'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingSelect {...field} value={field.value ?? ''} label='Üzemanyag'>
                  {CAR_FUELS.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {CAR_FUEL_LABELS[fuel]}
                    </option>
                  ))}
                </FloatingSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formModel.form.control}
          name='transmission'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingSelect {...field} value={field.value ?? ''} label='Váltó'>
                  {CAR_TRANSMISSIONS.map((gear) => (
                    <option key={gear} value={gear}>
                      {CAR_TRANSMISSION_LABELS[gear]}
                    </option>
                  ))}
                </FloatingSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formModel.form.control}
          name='seats'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type='number'
                  inputMode='numeric'
                  min={1}
                  label='Szállítható személyek'
                  value={
                    typeof field.value === 'number'
                      ? field.value
                      : ((field.value as string | undefined) ?? '')
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formModel.form.control}
          name='smallLuggage'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type='number'
                  inputMode='numeric'
                  min={0}
                  label='Kis bőröndök száma'
                  value={
                    typeof field.value === 'number'
                      ? field.value
                      : ((field.value as string | undefined) ?? '')
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formModel.form.control}
          name='largeLuggage'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type='number'
                  inputMode='numeric'
                  min={0}
                  label='Nagy bőröndök száma'
                  value={
                    typeof field.value === 'number'
                      ? field.value
                      : ((field.value as string | undefined) ?? '')
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );
}
