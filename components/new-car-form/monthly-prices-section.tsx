'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { NewCarFormModel } from '@/hooks/use-new-car-form';

import { FormSection, MONTH_LABELS } from './utils';

type MonthlyPricesSectionProps = {
  formModel: NewCarFormModel;
};

export function MonthlyPricesSection({
  formModel,
}: MonthlyPricesSectionProps) {
  return (
    <FormSection
      title='Havi árak'
      description='Add meg a 12 hónapra vonatkozó árakat (EUR).'
    >
      <FormField
        control={formModel.form.control}
        name='monthlyPrices'
        render={({ field }) => {
          const prices: (number | undefined)[] = (() => {
            const incoming = field.value ?? [];
            return Array.from({ length: 12 }, (_, index) => {
              const raw = incoming[index];
              if (raw === '' || raw == null) return undefined;
              const parsed = Number(raw);
              return Number.isNaN(parsed) ? undefined : parsed;
            });
          })();

          const handleChange = (index: number, value: string) => {
            const nextPrices = [...prices];
            nextPrices[index] = value === '' ? undefined : Number(value);
            field.onChange(nextPrices);
          };

          return (
            <FormItem className='space-y-3'>
              <FormLabel>Havi árak (EUR) 7 napra</FormLabel>
              <FormControl>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {MONTH_LABELS.map((month, index) => (
                    <div key={month} className='space-y-1.5'>
                      <Input
                        type='number'
                        inputMode='numeric'
                        min={0}
                        label={month}
                        value={prices[index] ?? ''}
                        onChange={(event) =>
                          handleChange(index, event.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </FormSection>
  );
}
