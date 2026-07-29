'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { NewCarFormModel } from '@/hooks/use-new-car-form';
import { useState } from 'react';

import { FormSection, MONTH_LABELS } from './utils';

type MonthlyPricesSectionProps = {
  formModel: NewCarFormModel;
};

export function MonthlyPricesSection({ formModel }: MonthlyPricesSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
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
                <RadioGroup
                  value={selectedMonth?.toString() ?? ''}
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                  className='grid  gap-3 sm:grid-cols-2'
                >
                  <div className='space-y-4 max-w-sm'>
                    {MONTH_LABELS.map((month, index) => (
                      <div
                        key={month.name}
                        className='flex items-center gap-2 space-y-1.5'
                      >
                        <RadioGroupItem
                          value={index.toString()}
                          id={`monthly-price-${index}`}
                          aria-label={`${month.name} kiválasztása`}
                        />
                        <Input
                          type='number'
                          inputMode='numeric'
                          min={0}
                          label={month.name}
                          value={prices[index] ?? ''}
                          onChange={(event) =>
                            handleChange(index, event.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className=''>
                    {selectedMonth !== null
                      ? MONTH_LABELS[selectedMonth].name
                      : 'Válassz ki egy hónapot'}
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </FormSection>
  );
}
