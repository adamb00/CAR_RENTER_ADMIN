'use client';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { NewCarFormModel } from '@/hooks/use-new-car-form';

import { FormSection } from './utils';

type AccommodationPricesSectionProps = {
  formModel: NewCarFormModel;
};

export default function AccommodationPricesSection({
  formModel,
}: AccommodationPricesSectionProps) {
  return (
    <FormSection
      title='Szállodai napi árak'
      description='Add meg a szállodai ajánlatokhoz használt napi árakat és teljes biztosítást (EUR). Tetszőleges napot hozzáadhatsz (pl. 14, 31).'
    >
      <FormField
        control={formModel.form.control}
        name='accommodationPrices'
        render={({ field }) => {
          const prices = (field.value ?? []).map((entry, index) => ({
            days: Number(entry?.days ?? index + 1),
            price_eur:
              entry?.price_eur == null || entry.price_eur === ''
                ? undefined
                : Number(entry.price_eur),
            full_insurance_eur:
              entry?.full_insurance_eur == null || entry.full_insurance_eur === ''
                ? undefined
                : Number(entry.full_insurance_eur),
          }));

          const handleChange = (
            index: number,
            key: 'days' | 'price_eur' | 'full_insurance_eur',
            value: string,
          ) => {
            const next = [...prices];
            const current = next[index] ?? {
              days: index + 1,
              price_eur: 0,
              full_insurance_eur: 0,
            };
            next[index] = {
              ...current,
              [key]: value === '' ? undefined : Number(value),
            };
            field.onChange(next);
          };

          const handleAddRow = () => {
            const maxDay = prices.reduce(
              (max, row) => Math.max(max, Number.isFinite(row.days) ? row.days : 0),
              0,
            );
            field.onChange([
              ...prices,
              {
                days: Math.max(1, maxDay + 1),
                price_eur: 0,
                full_insurance_eur: 0,
              },
            ]);
          };

          const handleRemoveRow = (index: number) => {
            const next = prices.filter((_, rowIndex) => rowIndex !== index);
            field.onChange(next);
          };

          const sortedRows = prices
            .map((row, index) => ({ row, index }))
            .sort((a, b) => a.row.days - b.row.days);

          return (
            <FormItem className='space-y-3'>
              <FormLabel>Napi szállodai árak (EUR)</FormLabel>
              <FormControl>
                <div className='space-y-2'>
                  {sortedRows.map(({ row, index }) => {
                    const canRemove = sortedRows.length > 1;

                    return (
                      <div
                        key={`${row.days}-${index}`}
                        className='grid gap-3 rounded-md border p-3 md:grid-cols-[120px_1fr_1fr_auto]'
                      >
                        <Input
                          type='number'
                          inputMode='numeric'
                          min={1}
                          label='Nap'
                          value={row.days ?? ''}
                          onChange={(event) =>
                            handleChange(index, 'days', event.target.value)
                          }
                        />
                        <Input
                          type='number'
                          inputMode='numeric'
                          min={0}
                          label='Ár (EUR)'
                          value={row.price_eur ?? ''}
                          onChange={(event) =>
                            handleChange(index, 'price_eur', event.target.value)
                          }
                        />
                        <Input
                          type='number'
                          inputMode='numeric'
                          min={0}
                          label='Teljes biztosítás (EUR)'
                          value={row.full_insurance_eur ?? ''}
                          onChange={(event) =>
                            handleChange(
                              index,
                              'full_insurance_eur',
                              event.target.value,
                            )
                          }
                        />
                        <div className='flex items-end'>
                          <Button
                            type='button'
                            variant='outline'
                            disabled={!canRemove}
                            onClick={() => handleRemoveRow(index)}
                          >
                            Törlés
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <Button type='button' variant='secondary' onClick={handleAddRow}>
                    + Nap hozzáadása
                  </Button>
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
