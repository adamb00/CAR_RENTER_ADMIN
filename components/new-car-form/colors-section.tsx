'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  CAR_COLOR_LABELS,
  CAR_COLOR_SWATCH,
  CAR_COLORS,
} from '@/lib/car-options';
import { cn } from '@/lib/utils';
import type { NewCarFormModel } from '@/hooks/use-new-car-form';

import { FormSection } from './utils';

type ColorsSectionProps = {
  formModel: NewCarFormModel;
};

export function ColorsSection({ formModel }: ColorsSectionProps) {
  return (
    <FormSection
      title='Színek'
      description='Add meg, milyen karosszéria színekben érhető el az autó. Többet is választhatsz.'
    >
      <FormField
        control={formModel.form.control}
        name='colors'
        render={({ field }) => {
          const selectedColors = field.value ?? [];

          const toggleColor = (color: (typeof CAR_COLORS)[number]) => {
            const isSelected = selectedColors.includes(color);
            const nextValue = isSelected
              ? selectedColors.filter((item) => item !== color)
              : [...selectedColors, color];

            field.onChange(nextValue);
          };

          return (
            <FormItem className='space-y-4'>
              <FormLabel>Elerheto szinek</FormLabel>
              <FormControl>
                <div className='space-y-3'>
                  <div className='flex flex-wrap gap-2'>
                    {selectedColors.length === 0 ? (
                      <span className='text-sm text-muted-foreground'>
                        Még nincs kiválasztott szín.
                      </span>
                    ) : (
                      selectedColors.map((color) => (
                        <span
                          key={color}
                          className='inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm'
                        >
                          <span
                            className='h-4 w-4 rounded-full border border-black/10'
                            style={{ backgroundColor: CAR_COLOR_SWATCH[color] }}
                            aria-hidden
                          />
                          {CAR_COLOR_LABELS[color]}
                        </span>
                      ))
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
                    {CAR_COLORS.map((color) => {
                      const isSelected = selectedColors.includes(color);
                      return (
                        <button
                          key={color}
                          type='button'
                          onClick={() => toggleColor(color)}
                          className={cn(
                            'flex items-center justify-between rounded-md border px-3 py-2 text-sm transition',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'hover:border-primary/60',
                          )}
                        >
                          <span className='flex items-center gap-2'>
                            <span
                              className='h-5 w-5 rounded-full border border-black/10'
                              style={{ backgroundColor: CAR_COLOR_SWATCH[color] }}
                              aria-hidden
                            />
                            {CAR_COLOR_LABELS[color]}
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold uppercase tracking-wide',
                              isSelected ? 'text-primary' : 'text-muted-foreground',
                            )}
                          >
                            {isSelected ? 'Kiválasztva' : 'Hozzáadás'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
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
