'use client';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem } from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useTransition } from 'react';
import { updateInsuranceAction } from '@/app/insurance/action';
import {
  InsuranceFormSchema,
  type InsuranceFormSchemaType,
} from '@/schemas/insuranceSchema';
import type { Insurance } from '@prisma/client';

const INSURANCE_DAYS = Array.from({ length: 30 }, (_, index) => index + 1);
const dailyInsuranceDefaultValues = INSURANCE_DAYS.reduce<
  Record<string, number>
>((prices, day) => {
  prices[String(day)] = 0;
  return prices;
}, {});

function normalizeDailyInsurancePrices(
  value: Insurance['dailyInsurancePrices'] | null | undefined,
): Record<string, number> {
  const prices = { ...dailyInsuranceDefaultValues };

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prices;
  }

  const savedPrices = value as Record<string, unknown>;

  for (const day of INSURANCE_DAYS) {
    const key = String(day);
    const savedPrice = savedPrices[key];

    if (typeof savedPrice === 'number' && Number.isFinite(savedPrice)) {
      prices[key] = savedPrice;
    }
  }

  return prices;
}

export default function InsuranceForm({
  insurance,
}: {
  insurance: Insurance | null;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<InsuranceFormSchemaType>({
    resolver: zodResolver(InsuranceFormSchema),
    defaultValues: {
      underAgeLimit: insurance?.underAgeLimit ?? 25,
      overAgeLimit: insurance?.overAgeLimit ?? 75,
      underAgeMultiplier: insurance?.underAgeMultiplier ?? 2,
      overAgeMultiplier: insurance?.overAgeMultiplier ?? 2,
      dailyInsurancePrices: normalizeDailyInsurancePrices(
        insurance?.dailyInsurancePrices,
      ),
    },
  });
  console.log(form.formState.errors);
  const handleOnSubmit = (values: InsuranceFormSchemaType) => {
    startTransition(async () => {
      await updateInsuranceAction(values);
    });
  };
  return (
    <Form {...form}>
      <form className='space-y-6' onSubmit={form.handleSubmit(handleOnSubmit)}>
        <div className='grid grid-cols-5 gap-5'>
          <FormField
            control={form.control}
            name='underAgeLimit'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type='number'
                    label='Alsó korhatár'
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.target.valueAsNumber)
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='overAgeLimit'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type='number'
                    label='Felső korhatár'
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.target.valueAsNumber)
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='underAgeMultiplier'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type='number'
                    label='Alsó korhatár szorzó'
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.target.valueAsNumber)
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='overAgeMultiplier'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type='number'
                    label='Felső korhatár szorzó'
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.target.valueAsNumber)
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className='space-y-3'>
          <h2 className='text-sm font-semibold'>Napi biztosítási díjak</h2>
          <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6'>
            {INSURANCE_DAYS.map((day) => (
              <FormField
                key={day}
                control={form.control}
                name={`dailyInsurancePrices.${day}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='decimal'
                        min={0}
                        max={100}
                        label={`${day}. nap díja`}
                        {...field}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
        <Button disabled={isPending} type='submit'>
          Mentés
        </Button>
      </form>
    </Form>
  );
}
